export const useApi = () => {
  const config = useRuntimeConfig()
  const auth = useAuth()

  const makeRequest = async (path: string, options: RequestInit = {}, retry = true): Promise<any> => {
    const token = auth.getToken()

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${config.public.apiBase}${path}`, {
      ...options,
      headers
    })

    // Handle 401 - token expired, try to refresh
    if (response.status === 401 && retry) {
      try {
        await auth.refreshAccessToken()
        // Retry request with new token
        return makeRequest(path, options, false)
      } catch (error) {
        // Refresh failed, logout and redirect to login
        auth.clearTokens()
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
        throw new Error('Authentication failed')
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }))
      throw new Error(error.detail || `Request failed with status ${response.status}`)
    }

    return response.json()
  }

  const get = (path: string) => makeRequest(path, { method: 'GET' })

  const post = (path: string, body?: any) => makeRequest(path, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined
  })

  const put = (path: string, body?: any) => makeRequest(path, {
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined
  })

  const del = (path: string) => makeRequest(path, { method: 'DELETE' })

  return {
    get,
    post,
    put,
    delete: del
  }
}
