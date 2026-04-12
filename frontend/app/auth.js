const TOKEN_KEY = "kiosk_token"

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export function authHeaders(extraHeaders = {}) {
  const token = getToken()
  return token
    ? {
        Authorization: `Bearer ${token}`,
        ...extraHeaders
      }
    : { ...extraHeaders }
}
