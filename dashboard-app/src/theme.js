export function currentTheme() {
  return localStorage.getItem("roka-theme") === "light" ? "light" : "dark";
}

export function applyTheme(theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  localStorage.setItem("roka-theme", theme);
  return theme;
}
