const LOGIN = "/login.html?next=/dashboard.html";
const POLL_MS = 15000;

function apiBase() {
  return window.ROKA_API_BASE || "https://api.roka-prune.com";
}

function token() {
  return localStorage.getItem("roka_access_token");
}

function requireAuth() {
  if (!token()) {
    window.location.replace(LOGIN);
    return false;
  }
  return true;
}

function logout() {
  localStorage.removeItem("roka_access_token");
  window.location.href = "/index.html";
}

function fmt(n) {
  if (n == null || n === "") return "—";
  const num = Number(n);
  return Number.isFinite(num) ? num.toLocaleString() : String(n);
}

function relTime(iso) {
  if (!iso) return "never";
  const ms = Date.now() - Date.parse(iso);
  if (!Number.isFinite(ms)) return iso;
  const sec = Math.max(0, Math.round(ms / 1000));
  if (sec < 45) return "just now";
  if (sec < 3600) return `${Math.round(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.round(sec / 3600)}h ago`;
  return `${Math.round(sec / 86400)}d ago`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

async function fetchJson(path, auth) {
  const res = await fetch(`${apiBase()}${path}`, {
    headers: { Authorization: `Bearer ${auth}` },
  });
  if (res.status === 401) {
    localStorage.removeItem("roka_access_token");
    window.location.replace(LOGIN);
    throw new Error("unauthorized");
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function renderEvent(event) {
  const reasons = event.reasons || {};
  const query = event.query || "";
  const terms = Array.isArray(event.queryTerms) ? event.queryTerms : [];
  const warnings = Array.isArray(event.warnings) ? event.warnings : [];
  const originalLines = Number(event.originalLines) || 0;
  const prunedLines = Number(event.prunedLines) || 0;
  const originalChars = Number(event.originalChars) || 0;
  const prunedChars = Number(event.prunedChars) || 0;
  const budget = Number(event.budget) || 0;
  const droppedLines = Math.max(0, originalLines - prunedLines);
  const keptPct = originalChars ? Math.round((prunedChars / originalChars) * 100) : 0;
  const chips = [
    event.file ? `<span class="hood-chip">${escapeHtml(event.file)}</span>` : "",
    ...terms.slice(0, 6).map((term) => `<span class="hood-chip query">${escapeHtml(term)}</span>`),
    event.budgetExceeded ? `<span class="hood-chip crash">over budget</span>` : "",
  ]
    .filter(Boolean)
    .join("");

  return `
    <article class="surface feed-card">
      <header class="feed-head">
        <div>
          <div class="feed-tool">${escapeHtml(event.tool || "prune")}</div>
          <div class="feed-sub">${query ? escapeHtml(query) : "no query — recency and crash evidence"}</div>
        </div>
        <time datetime="${escapeHtml(event.at || "")}">${escapeHtml(relTime(event.at))}</time>
      </header>
      ${chips ? `<div class="hood-chips feed-chips">${chips}</div>` : ""}
      <div class="hood-stages">
        <div class="surface hood-stage">
          <div class="k">Collapse</div>
          <div class="v">${fmt(originalLines)} → ${fmt(prunedLines)}</div>
          <div class="s">${fmt(droppedLines)} lines dropped</div>
        </div>
        <div class="surface hood-stage">
          <div class="k">Crash</div>
          <div class="v">${fmt(reasons.crash || 0)}</div>
          <div class="s">${fmt(reasons.neighbor || 0)} neighbors kept</div>
        </div>
        <div class="surface hood-stage">
          <div class="k">Query</div>
          <div class="v">${fmt(reasons.query || 0)}</div>
          <div class="s">${query ? "scored against the task" : "no task score"}</div>
        </div>
        <div class="surface hood-stage">
          <div class="k">Pack</div>
          <div class="v">${fmt(prunedChars)} / ${fmt(budget)}</div>
          <div class="s">${fmt(keptPct)}% of original chars · ${escapeHtml(event.mode || "pruned")}</div>
        </div>
      </div>
      ${
        warnings.length
          ? `<p class="hood-note">${warnings.map((item) => escapeHtml(item)).join(" · ")}</p>`
          : ""
      }
    </article>
  `;
}

function renderEmpty() {
  return `
    <div class="surface feed-empty">
      <p class="eyebrow">MCP</p>
      <h2>Waiting for a process</h2>
      <p>Nothing has run on this account yet. Connect Roka to an agent, then prune a log. Each call shows collapse, crash keep, query score, and budget pack here — the log text stays on your machine.</p>
      <pre>npx roka-mcp connect --agent cursor</pre>
      <p class="hood-note">Need a key first? <a href="/dashboard/api-keys.html">Create an API key</a>, then restart the agent so it picks up the server.</p>
    </div>
  `;
}

export function mountAccountDash() {
  if (!requireAuth()) return () => {};

  const loginBtn = document.getElementById("navLoginBtn");
  if (loginBtn) {
    const label = loginBtn.querySelector(".inner");
    if (label) label.textContent = "Log out";
    loginBtn.href = "/index.html";
    loginBtn.title = "Log out";
    loginBtn.addEventListener("click", (event) => {
      if (event.metaKey || event.ctrlKey) return;
      event.preventDefault();
      logout();
    });
  }

  const feed = document.getElementById("processFeed");
  const strip = document.getElementById("accountStrip");
  let timer = 0;
  let cancelled = false;

  async function load() {
    const auth = token();
    if (!auth) return;
    try {
      const [user, activityRes] = await Promise.all([
        fetchJson("/auth/me", auth),
        fetch(`${apiBase()}/api/mcp/events`, {
          headers: { Authorization: `Bearer ${auth}` },
        }),
      ]);
      if (cancelled) return;
      if (activityRes.status === 401) {
        localStorage.removeItem("roka_access_token");
        window.location.replace(LOGIN);
        return;
      }
      const activity = activityRes.ok
        ? await activityRes.json()
        : { events: [], mcp_calls: user.mcp_calls || 0, last_mcp_seen_at: user.last_mcp_seen_at };

      strip?.classList.add("is-on");
      setText("acctName", user.first_name || user.username || (user.email || "").split("@")[0] || "signed in");
      setText("acctTier", user.tier || "free");
      setText("acctCalls", fmt(activity.mcp_calls ?? user.mcp_calls ?? 0));
      setText(
        "acctSeen",
        activity.last_mcp_agent
          ? `${relTime(activity.last_mcp_seen_at)} · ${activity.last_mcp_agent}`
          : relTime(activity.last_mcp_seen_at || user.last_mcp_seen_at)
      );

      let keys = [];
      try {
        keys = await fetchJson("/api-keys", auth);
      } catch {
        keys = [];
      }
      if (cancelled) return;

      if (!Array.isArray(keys) || keys.length === 0) {
        setText("acctUsed", "—");
        setText("acctLimit", "");
        setText("acctLeft", "create a key");
        setText("acctMcp", "no key");
      } else {
        const statusRes = await fetch(`${apiBase()}/api/status`, {
          headers: { Authorization: `Bearer ${keys[0].key}` },
        });
        if (statusRes.ok) {
          const status = await statusRes.json();
          setText("acctUsed", fmt(status.tokens_used_this_month));
          setText("acctLimit", `of ${fmt(status.tokens_limit)}`);
          setText("acctLeft", fmt(status.tokens_remaining));
          setText("acctMcp", status.mcp_allowed ? "allowed" : "locked");
        }
      }

      const events = Array.isArray(activity.events) ? activity.events : [];
      if (!feed) return;
      feed.innerHTML = events.length ? events.map(renderEvent).join("") : renderEmpty();
    } catch (err) {
      if (err.message === "unauthorized") return;
      console.error(err);
    }
  }

  load();
  timer = window.setInterval(load, POLL_MS);
  return () => {
    cancelled = true;
    window.clearInterval(timer);
  };
}
