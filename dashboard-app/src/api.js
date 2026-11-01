export function apiBase() {
  return window.ROKA_API_BASE || "https://api.roka-prune.com";
}

export function accessToken() {
  return localStorage.getItem("roka_access_token");
}

export function redirectToLogin() {
  window.location.href = "/login.html";
}

export function logout() {
  localStorage.removeItem("roka_access_token");
  window.location.href = "/index.html";
}
