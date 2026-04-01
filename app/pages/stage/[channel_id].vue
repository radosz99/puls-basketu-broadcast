<template>
  <div class="fixed inset-0 bg-transparent">
    <!-- Team shotchart infographic -->
    <InfographicShotchart
      v-if="currentGraphic === 'team-shotchart' && graphicData"
      ref="shotchartRef"
      mode="team"
      :game-id="graphicData.game_id"
      :team="graphicData.team"
      :title="graphicData.title || 'Mapa rzutów w całym meczu'"
      :speed="graphicData.speed"
      :show-advertising="graphicData.show_advertising || false"
      @ready="handleGraphicReady"
    />

    <!-- Player shotchart infographic -->
    <InfographicShotchart
      v-if="currentGraphic === 'player-shotchart' && graphicData"
      ref="shotchartRef"
      mode="player"
      :game-id="graphicData.game_id"
      :shirt-number="graphicData.shirt_number"
      :team="graphicData.team"
      :title="graphicData.title || 'Mapa rzutów w całym meczu'"
      :speed="graphicData.speed"
      :show-advertising="graphicData.show_advertising || false"
      @ready="handleGraphicReady"
    />

    <!-- Debug info (only in preview mode) -->
    <div v-if="isPreview" class="fixed top-4 right-4 bg-black bg-opacity-50 text-white p-2 text-xs rounded z-50">
      <div>Preview Mode</div>
      <div>WS: {{ isConnected ? 'Connected' : 'Disconnected' }}</div>
      <div v-if="currentGraphic">Graphic: {{ currentGraphic }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const channelId = route.params.channel_id as string
const broadcastKey = route.query.key as string
const isPreview = route.query.preview === 'true'

const shotchartRef = ref<any>(null)
const currentGraphic = ref<string | null>(null)
const graphicData = ref<any>(null)

const { isConnected, connect, send } = useWebSocket({
  channelId,
  role: 'output',
  key: broadcastKey,
  isPreview: isPreview,
  onMessage: handleMessage,
  onOpen: () => {
    console.log('[Stage] WebSocket connected')
    // Notify parent window if this is preview mode
    if (isPreview && window.parent !== window) {
      window.parent.postMessage({ type: 'preview_connected' }, '*')
    }
  },
  onClose: (code, reason) => {
    console.log(`[Stage] WebSocket closed: ${code} - ${reason}`)
    // Notify parent window if this is preview mode
    if (isPreview && window.parent !== window) {
      window.parent.postMessage({ type: 'preview_disconnected', code }, '*')
    }
  }
})

function handleMessage(data: any) {
  // Only log commands, not pings
  if (data.action) {
    console.log('[Stage] Command received:', data.action, data.graphic || '')
    handleCommand(data)
  }
  // Pings are handled automatically in the WebSocket composable
}

function handleCommand(command: any) {
  const { action } = command

  if (action === 'show') {
    handleShow(command)
  } else if (action === 'hide') {
    handleHide()
  } else if (action === 'update') {
    handleUpdate(command)
  }
}

function handleShow(command: any) {
  const { graphic } = command

  // Hide current graphic if different type
  if (currentGraphic.value && currentGraphic.value !== graphic) {
    handleHide()
    // Wait for hide animation before showing new graphic
    setTimeout(() => {
      showGraphic(command)
    }, 500)
  } else {
    showGraphic(command)
  }
}

function showGraphic(command: any) {
  const { graphic, speed = 1.0 } = command

  currentGraphic.value = graphic
  graphicData.value = {
    ...command,
    speed
  }

  // Wait for component to mount/update, then call show()
  nextTick(() => {
    if ((graphic === 'team-shotchart' || graphic === 'player-shotchart') && shotchartRef.value) {
      shotchartRef.value.show()
    }
  })
}

function handleHide() {
  const graphic = currentGraphic.value

  if ((graphic === 'team-shotchart' || graphic === 'player-shotchart') && shotchartRef.value) {
    shotchartRef.value.hide()
  }

  // Wait for animation, then clear
  setTimeout(() => {
    currentGraphic.value = null
    graphicData.value = null
  }, 500)
}

function handleUpdate(command: any) {
  // Update graphic data if needed
  graphicData.value = {
    ...graphicData.value,
    ...command
  }
}

function handleGraphicReady() {
  // Only send ready message if not in preview mode
  if (!isPreview) {
    console.log('[Stage] Sending ready signal:', currentGraphic.value)
    send({
      type: 'ready',
      graphic: currentGraphic.value
    })
  } else {
    console.log('[Stage] Preview mode - not sending ready signal')
  }
}

onMounted(() => {
  if (!broadcastKey) {
    console.error('[Stage] No broadcast key provided')
    return
  }

  // Connect WebSocket
  connect()
})
</script>
