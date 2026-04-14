const TOKEN_KEY = "kiosk_token"
const USER_KEY = "kiosk_user"

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function getCurrentUser() {
  const user = localStorage.getItem(USER_KEY)
  return user ? JSON.parse(user) : null
}

export function setCurrentUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function isAdmin() {
  const user = getCurrentUser()
  return user && user.is_admin ? true : false
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
