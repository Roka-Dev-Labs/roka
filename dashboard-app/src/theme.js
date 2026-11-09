export function currentTheme() {
  return localStorage.getItem("roka-theme") === "light" ? "light" : "dark";
}

export function applyTheme(theme) {
  const html = document.documentElement;
  html.dataset.theme = theme;
  html.classList.toggle("dark", theme === "dark");
  html.classList.toggle("light", theme === "light");
  html.style.colorScheme = theme;
  localStorage.setItem("roka-theme", theme);
  localStorage.setItem("theme", theme);
  return theme;
}
