import { ref, onUnmounted } from 'vue'

interface WebSocketOptions {
  channelId: string
  role: 'output' | 'control'
  key?: string
  token?: string
  isPreview?: boolean
  onMessage?: (data: any) => void
  onOpen?: () => void
  onClose?: (code: number, reason: string) => void
}

export const useWebSocket = (options: WebSocketOptions) => {
  const config = useRuntimeConfig()
  const auth = useAuth()

  const ws = ref<WebSocket | null>(null)
  const isConnected = ref(false)
  const reconnectAttempts = ref(0)
  const maxReconnectAttempts = 10
  const reconnectTimeouts = [1000, 2000, 4000, 8000, 16000] // exponential backoff
  let reconnectTimeout: NodeJS.Timeout | null = null
  let heartbeatTimeout: NodeJS.Timeout | null = null

  const getReconnectDelay = () => {
    const index = Math.min(reconnectAttempts.value, reconnectTimeouts.length - 1)
    return reconnectTimeouts[index]
  }

  const clearHeartbeat = () => {
    if (heartbeatTimeout) {
      clearTimeout(heartbeatTimeout)
      heartbeatTimeout = null
    }
  }

  const send = (data: any) => {
    if (ws.value && ws.value.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify(data))
    }
  }

  const connect = async () => {
    // Clear any existing connection
    if (ws.value) {
      ws.value.close()
    }

    // Build WebSocket URL
    let wsUrl = `${config.public.websocketBase}/ws/broadcast/${options.channelId}?role=${options.role}`

    if (options.role === 'output' && options.key) {
      wsUrl += `&key=${options.key}`
      // Add preview flag so backend can distinguish preview from real stage outputs
      if (options.isPreview) {
        wsUrl += `&preview=true`
      }
    } else if (options.role === 'control') {
      const token = options.token || auth.getToken()
      if (!token) {
        console.error('No token available for control connection')
        return
      }
      wsUrl += `&token=${token}`
    }

    try {
      ws.value = new WebSocket(wsUrl)

      ws.value.onopen = () => {
        isConnected.value = true
        reconnectAttempts.value = 0
        console.log(`[WebSocket] Connected as ${options.role}${options.isPreview ? ' (preview)' : ''}`)

        // Output sends online message on connect (but not in preview mode)
        if (options.role === 'output' && !options.isPreview) {
          send({ type: 'online' })
        }

        options.onOpen?.()
      }

      ws.value.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)

          // Handle ping from server (output role only)
          if (data.type === 'ping' && options.role === 'output') {
            clearHeartbeat()
            send({ type: 'pong' })
            // Expect next ping within 30s
            heartbeatTimeout = setTimeout(() => {
              console.warn('[WebSocket] Heartbeat timeout, closing connection')
              ws.value?.close()
            }, 30000)
          }

          options.onMessage?.(data)
        } catch (error) {
          console.error('[WebSocket] Failed to parse message:', error)
        }
      }

      ws.value.onclose = (event) => {
        isConnected.value = false
        clearHeartbeat()
        console.log(`[WebSocket] Closed with code ${event.code}`)

        options.onClose?.(event.code, event.reason)

        // Handle different close codes
        if (event.code === 4001) {
          // Token expired - refresh and reconnect
          if (options.role === 'control') {
            console.log('[WebSocket] Token expired, refreshing...')
            auth.refreshAccessToken()
              .then(() => {
                console.log('[WebSocket] Token refreshed, reconnecting...')
                scheduleReconnect()
              })
              .catch((error) => {
                console.error('[WebSocket] Token refresh failed:', error)
                auth.clearTokens()
                if (typeof window !== 'undefined') {
                  window.location.href = '/login'
                }
              })
            return
          }
        } else if (event.code === 4004) {
          // Channel not found or inactive - don't reconnect
          console.error('[WebSocket] Channel not found or inactive')
          return
        } else if (event.code === 4003) {
          // Wrong channel - don't reconnect
          console.error('[WebSocket] Wrong channel for this user')
          return
        }

        // Normal close or network error - reconnect
        if (event.code !== 1000) {
          scheduleReconnect()
        }
      }

      ws.value.onerror = (error) => {
        console.error('[WebSocket] Error:', error)
      }
    } catch (error) {
      console.error('[WebSocket] Connection error:', error)
      scheduleReconnect()
    }
  }

  const scheduleReconnect = () => {
    if (reconnectAttempts.value >= maxReconnectAttempts) {
      console.error('[WebSocket] Max reconnect attempts reached')
      return
    }

    const delay = getReconnectDelay()
    reconnectAttempts.value++

    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttempts.value})`)

    reconnectTimeout = setTimeout(() => {
      connect()
    }, delay)
  }

  const disconnect = () => {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout)
      reconnectTimeout = null
    }
    clearHeartbeat()
    if (ws.value) {
      ws.value.close(1000)
      ws.value = null
    }
    isConnected.value = false
  }

  // Cleanup on unmount
  onUnmounted(() => {
    disconnect()
  })

  return {
    ws,
    isConnected,
    connect,
    disconnect,
    send
  }
}
