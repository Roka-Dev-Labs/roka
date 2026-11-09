import { useState } from "react";
import { logout } from "../api.js";
import { applyTheme, currentTheme } from "../theme.js";

const DARK_ICON = "M6 1 A5 5 0 0 0 6 11 Z";
const LIGHT_ICON = "M6 1 A5 5 0 0 1 6 11 Z";

export function Nav({ active, authed }) {
  const [theme, setTheme] = useState(currentTheme);

  function toggleTheme() {
    setTheme(applyTheme(theme === "dark" ? "light" : "dark"));
  }

  return (
    <nav className="dash-nav">
      <a href="/index.html" className="dash-nav-logo">
        <img src="/assets/logos/logo-roka.png" alt="Roka" width="28" height="28" />
        Roka
      </a>
      <div className="dash-nav-links">
        <a href="/dashboard.html" className={active === "dashboard" ? "active" : undefined}>
          Under the hood
        </a>
        <a href="/dashboard/api-keys.html" className={active === "keys" ? "active" : undefined}>
          API keys
        </a>
        <a href="/docs/mcp.html">MCP</a>
      </div>
      <div className="dash-nav-actions">
        <div className="nav-action-pills">
          {authed ? (
            <button type="button" className="nav-login-btn" onClick={logout}>
              <span className="inner">Log out</span>
            </button>
          ) : (
            <a href="/login.html" className="nav-login-btn">
              <span className="inner">Sign up</span>
            </a>
          )}
          <button
            id="themeToggle"
            type="button"
            className="theme-toggle-btn"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            onClick={toggleTheme}
          >
            <span className="inner">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5" />
                <path d={theme === "dark" ? DARK_ICON : LIGHT_ICON} fill="currentColor" />
              </svg>
              <span>{theme === "dark" ? "Light" : "Dark"}</span>
            </span>
          </button>
        </div>
        <a href="/install.html" className="btn-primary" style={{ height: 40, padding: "0 14px", borderRadius: 6 }}>
          Install
        </a>
      </div>
    </nav>
  );
}
