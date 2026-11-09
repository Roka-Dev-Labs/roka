export function apiBase() {
  return window.ROKA_API_BASE || "https://api.roka-prune.com";
}

export function accessToken() {
  return localStorage.getItem("roka_access_token");
}

export function redirectToLogin() {
  const next = `${window.location.pathname}${window.location.search}`;
  const safe = next.startsWith("/") && !next.startsWith("//") && !next.includes("\\")
    ? next
    : "/dashboard.html";
  window.location.href = `/login.html?next=${encodeURIComponent(safe)}`;
}

export function logout() {
  localStorage.removeItem("roka_access_token");
  window.location.href = "/index.html";
}
