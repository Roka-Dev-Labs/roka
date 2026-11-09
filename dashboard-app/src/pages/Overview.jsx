import { useEffect, useState } from "react";
import { accessToken, apiBase, redirectToLogin } from "../api.js";
import { Nav } from "../components/Nav.jsx";

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

export function Overview() {
  const [account, setAccount] = useState(null);
  const [events, setEvents] = useState(null);
  const token = accessToken();

  useEffect(() => {
    if (!token) {
      redirectToLogin();
      return undefined;
    }
    let cancelled = false;

    async function load() {
      try {
        const meRes = await fetch(`${apiBase()}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (meRes.status === 401) {
          redirectToLogin();
          return;
        }
        if (!meRes.ok || cancelled) return;
        const user = await meRes.json();

        const activityRes = await fetch(`${apiBase()}/api/mcp/events`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const activity = activityRes.ok ? await activityRes.json() : { events: [], mcp_calls: 0 };
        if (cancelled) return;

        const next = {
          name: user.first_name || user.username || (user.email || "").split("@")[0] || "signed in",
          tier: user.tier || "free",
          used: null,
          limit: null,
          remaining: null,
          mcp: "no key",
          seen: relTime(activity.last_mcp_seen_at || user.last_mcp_seen_at),
          calls: activity.mcp_calls ?? user.mcp_calls ?? 0,
        };
        if (activity.last_mcp_agent) {
          next.seen = `${relTime(activity.last_mcp_seen_at)} · ${activity.last_mcp_agent}`;
        }

        const keysRes = await fetch(`${apiBase()}/api-keys`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (keysRes.ok) {
          const keys = await keysRes.json();
          if (Array.isArray(keys) && keys.length > 0) {
            const statusRes = await fetch(`${apiBase()}/api/status`, {
              headers: { Authorization: `Bearer ${keys[0].key}` },
            });
            if (statusRes.ok) {
              const status = await statusRes.json();
              next.used = status.tokens_used_this_month;
              next.limit = status.tokens_limit;
              next.remaining = status.tokens_remaining;
              next.mcp = status.mcp_allowed ? "allowed" : "locked";
            }
          }
        }
        if (!cancelled) {
          setAccount(next);
          setEvents(Array.isArray(activity.events) ? activity.events : []);
        }
      } catch (err) {
        console.error("Error loading dashboard:", err);
      }
    }

    load();
    const timer = window.setInterval(load, 15000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [token]);

  return (
    <>
      <Nav active="dashboard" authed={Boolean(token)} />
      <main className="dash-wrap">
        <header className="dash-hero">
          <span className="eyebrow">Account</span>
          <h1>What Roka did</h1>
          <p>
            Every MCP prune from your connected agent lands here: collapse, crash evidence, query
            score, and the packed budget. Log text never leaves the machine.
          </p>
        </header>
        {account && (
          <section className="dash-account is-on" aria-live="polite">
            <div className="surface dash-stat">
              <div className="k">Account</div>
              <div className="v">{account.name}</div>
              <div className="s">{account.tier}</div>
            </div>
            <div className="surface dash-stat">
              <div className="k">Tokens this month</div>
              <div className="v">{account.used == null ? "—" : fmt(account.used)}</div>
              <div className="s">{account.limit == null ? "" : `of ${fmt(account.limit)}`}</div>
            </div>
            <div className="surface dash-stat">
              <div className="k">Remaining</div>
              <div className="v">{account.remaining == null ? "create a key" : fmt(account.remaining)}</div>
              <div className="s">hosted API quota</div>
            </div>
            <div className="surface dash-stat">
              <div className="k">MCP</div>
              <div className="v">{account.mcp}</div>
              <div className="s">{account.seen}</div>
            </div>
            <div className="surface dash-stat">
              <div className="k">Processes</div>
              <div className="v">{fmt(account.calls)}</div>
              <div className="s">prune calls reported</div>
            </div>
          </section>
        )}
        <section className="process-feed" aria-live="polite">
          {events && events.length === 0 && (
            <div className="surface feed-empty">
              <p className="eyebrow">MCP</p>
              <h2>Waiting for a process</h2>
              <p>
                Nothing has run on this account yet. Connect Roka to an agent, then prune a log.
                Each call shows collapse, crash keep, query score, and budget pack here — the log
                text stays on your machine.
              </p>
              <pre>npx roka-mcp connect --agent cursor</pre>
              <p className="hood-note">
                Need a key first? <a href="/dashboard/api-keys.html">Create an API key</a>, then
                restart the agent so it picks up the server.
              </p>
            </div>
          )}
          {events &&
            events.map((event) => {
              const reasons = event.reasons || {};
              const originalLines = Number(event.originalLines) || 0;
              const prunedLines = Number(event.prunedLines) || 0;
              const originalChars = Number(event.originalChars) || 0;
              const prunedChars = Number(event.prunedChars) || 0;
              const budget = Number(event.budget) || 0;
              const keptPct = originalChars ? Math.round((prunedChars / originalChars) * 100) : 0;
              return (
                <article className="surface feed-card" key={event.id || event.at}>
                  <header className="feed-head">
                    <div>
                      <div className="feed-tool">{event.tool || "prune"}</div>
                      <div className="feed-sub">
                        {event.query || "no query — recency and crash evidence"}
                      </div>
                    </div>
                    <time dateTime={event.at || ""}>{relTime(event.at)}</time>
                  </header>
                  <div className="hood-stages">
                    <div className="surface hood-stage">
                      <div className="k">Collapse</div>
                      <div className="v">
                        {fmt(originalLines)} → {fmt(prunedLines)}
                      </div>
                      <div className="s">{fmt(Math.max(0, originalLines - prunedLines))} lines dropped</div>
                    </div>
                    <div className="surface hood-stage">
                      <div className="k">Crash</div>
                      <div className="v">{fmt(reasons.crash || 0)}</div>
                      <div className="s">{fmt(reasons.neighbor || 0)} neighbors kept</div>
                    </div>
                    <div className="surface hood-stage">
                      <div className="k">Query</div>
                      <div className="v">{fmt(reasons.query || 0)}</div>
                      <div className="s">{event.query ? "scored against the task" : "no task score"}</div>
                    </div>
                    <div className="surface hood-stage">
                      <div className="k">Pack</div>
                      <div className="v">
                        {fmt(prunedChars)} / {fmt(budget)}
                      </div>
                      <div className="s">
                        {fmt(keptPct)}% of original chars · {event.mode || "pruned"}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
        </section>
        <footer className="dash-foot">
          <span>© 2026 Roka Labs</span>
          <span>
            <a href="/docs/pipeline.html">Pipeline</a>
            {" · "}
            <a href="/docs/mcp.html">Connect</a>
            {" · "}
            <a href="/index.html">Home</a>
          </span>
        </footer>
      </main>
    </>
  );
}
