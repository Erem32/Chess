const TOKEN_KEY = "access_token";

export function clearLegacyAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function getAuthToken() {
  clearLegacyAuthToken();
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token) {
  clearLegacyAuthToken();
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken() {
  clearLegacyAuthToken();
  sessionStorage.removeItem(TOKEN_KEY);
}
