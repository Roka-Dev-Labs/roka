import { useState } from "react";
import { logout } from "../api.js";
import { applyTheme, currentTheme } from "../theme.js";

const DARK_ICON = "M6 1 A5 5 0 0 0 6 11 Z";
const LIGHT_ICON = "M6 1 A5 5 0 0 1 6 11 Z";

export function Nav({ active }) {
  const [theme, setTheme] = useState(currentTheme);

  function toggleTheme() {
    setTheme(applyTheme(theme === "dark" ? "light" : "dark"));
  }

  return (
    <nav className="nav">
      <a href="/index.html" className="nav-logo">
        <img
          src="/assets/icons/favicon-32x32.png"
          alt="Roka"
          className="logo-animate"
          width="28"
          height="28"
        />
        Roka
      </a>
      <div className="nav-links">
        <a href="/dashboard.html" className={active === "dashboard" ? "active" : undefined}>
          Dashboard
        </a>
        <a href="/dashboard/api-keys.html" className={active === "keys" ? "active" : undefined}>
          API Keys
        </a>
        <a href="/dashboard/upgrade.html" className={active === "upgrade" ? "active" : undefined}>
          Usage limits
        </a>
        <button
          id="themeToggle"
          type="button"
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          onClick={toggleTheme}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.25" />
            <path d={theme === "dark" ? DARK_ICON : LIGHT_ICON} fill="currentColor" />
          </svg>
          <span>{theme === "dark" ? "Light" : "Dark"}</span>
        </button>
        <button id="logoutBtn" className="btn-secondary" type="button" onClick={logout}>
          Logout
        </button>
      </div>
    </nav>
  );
}
