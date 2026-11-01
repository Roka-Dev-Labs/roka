import { useEffect, useState } from "react";
import { accessToken, apiBase, redirectToLogin } from "../api.js";
import { Nav } from "../components/Nav.jsx";

export function Overview() {
  const [name, setName] = useState("User");
  const [tier, setTier] = useState("");
  const [trialDays, setTrialDays] = useState(null);
  const [usage, setUsage] = useState({
    used: 0,
    limit: 0,
    remaining: 0,
    progress: 0,
  });

  useEffect(() => {
    const token = accessToken();
    if (!token) {
      redirectToLogin();
      return;
    }

    let cancelled = false;

    async function loadDashboard() {
      try {
        const response = await fetch(`${apiBase()}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          redirectToLogin();
          return;
        }
        const user = await response.json();
        if (cancelled) return;

        setName(user.email.split("@")[0]);
        setTier(user.tier);

        if (user.is_trial_active && user.tier === "trial" && user.trial_ends_at) {
          const daysLeft = Math.ceil(
            (new Date(user.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
          );
          if (daysLeft > 14) setTrialDays(daysLeft);
        }

        loadTokenUsage(token);
      } catch (error) {
        console.error("Error loading dashboard:", error);
        redirectToLogin();
      }
    }

    loadDashboard();
    return () => {
      cancelled = true;
    };
  }, []);

  async function loadTokenUsage(token) {
    try {
      const keysResponse = await fetch(`${apiBase()}/api-keys`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!keysResponse.ok) return;
      const keys = await keysResponse.json();
      if (keys.length === 0) return;

      const statusResponse = await fetch(`${apiBase()}/api/status`, {
        headers: { Authorization: `Bearer ${keys[0].key}` },
      });
      if (!statusResponse.ok) return;

      const status = await statusResponse.json();
      const progress = (status.tokens_used_this_month / status.tokens_limit) * 100;
      setUsage({
        used: status.tokens_used_this_month,
        limit: status.tokens_limit,
        remaining: status.tokens_remaining,
        progress: Math.min(progress, 100),
      });
    } catch (error) {
      console.error("Error loading token usage:", error);
    }
  }

  return (
    <>
      <Nav active="dashboard" />
      <div className="container">
        <div className="dashboard-header">
          <h1>
            Welcome back, <span>{name}</span>
          </h1>
          <p>
            Current Tier:{" "}
            <span className={tier ? `tier-badge ${tier}` : "tier-badge"}>
              {tier ? tier.toUpperCase() : "Loading..."}
            </span>
          </p>
        </div>

        {trialDays != null && (
          <div className="trial-countdown">
            <h3>Your trial expires in</h3>
            <div className="days">
              <span>{trialDays}</span> days
            </div>
            <div className="subtext">Roka is free with usage limits. Check your API key access.</div>
          </div>
        )}

        <div className="stats-grid">
          <div className="stat-card">
            <h3>Tokens This Month</h3>
            <div className="value">
              <span>{usage.used.toLocaleString()}</span> / <span>{usage.limit.toLocaleString()}</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${usage.progress}%` }} />
            </div>
            <div className="subtext">
              <span>{usage.remaining.toLocaleString()}</span> remaining
            </div>
          </div>
          <div className="stat-card">
            <h3>API Calls This Month</h3>
            <div className="value">0</div>
            <div className="subtext">Total requests</div>
          </div>
          <div className="stat-card">
            <h3>Average Compression</h3>
            <div className="value">0%</div>
            <div className="subtext">Token reduction</div>
          </div>
        </div>

        <div className="quick-actions">
          <a href="/dashboard/api-keys.html" className="btn-primary">
            Manage API Keys
          </a>
          <a href="/dashboard/upgrade.html" className="btn-primary">
            View usage limits
          </a>
        </div>
      </div>
    </>
  );
}
