export const useAuth = () => {
  const config = useRuntimeConfig()

  const TOKEN_KEY = 'broadcast_access_token'
  const REFRESH_TOKEN_KEY = 'broadcast_refresh_token'

  // Get token from localStorage
  const getToken = () => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(TOKEN_KEY)
  }

  const getRefreshToken = () => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  }

  // Store tokens
  const setTokens = (accessToken: string, refreshToken: string) => {
    if (typeof window === 'undefined') return
    localStorage.setItem(TOKEN_KEY, accessToken)
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  }

  // Clear tokens
  const clearTokens = () => {
    if (typeof window === 'undefined') return
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  }

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!getToken()
  }

  // Login
  const login = async (email: string, password: string) => {
    const response = await fetch(`${config.public.apiBase}/api/v1/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Login failed' }))
      throw new Error(error.detail || 'Login failed')
    }

    const data = await response.json()
    setTokens(data.access_token, data.refresh_token)
    return data
  }

  // Refresh token
  const refreshAccessToken = async () => {
    const refreshToken = getRefreshToken()
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    const response = await fetch(`${config.public.apiBase}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refresh_token: refreshToken })
    })

    if (!response.ok) {
      clearTokens()
      throw new Error('Token refresh failed')
    }

    const data = await response.json()
    setTokens(data.access_token, data.refresh_token)
    return data.access_token
  }

  // Logout
  const logout = () => {
    clearTokens()
  }

  return {
    getToken,
    getRefreshToken,
    setTokens,
    clearTokens,
    isAuthenticated,
    login,
    refreshAccessToken,
    logout
  }
}
