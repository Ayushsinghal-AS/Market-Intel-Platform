const TOKEN_KEY = "mip_token";
const USERNAME_KEY = "mip_username";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUsername() {
  return localStorage.getItem(USERNAME_KEY);
}

export function setSession(token, username) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USERNAME_KEY, username);
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USERNAME_KEY);
}
