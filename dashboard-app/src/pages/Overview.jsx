import { useEffect, useRef, useState } from "react";
import { accessToken, apiBase } from "../api.js";
import { Nav } from "../components/Nav.jsx";

export function Overview() {
  const hoodRef = useRef(null);
  const [account, setAccount] = useState(null);
  const token = accessToken();

  useEffect(() => {
    let cleanup = () => {};
    let cancelled = false;
    import("/assets/js/hood-ui.js")
      .then((mod) => {
        if (!cancelled && hoodRef.current) cleanup = mod.mountHood(hoodRef.current) || (() => {});
      })
      .catch((err) => {
        console.error("Failed to load inspect UI", err);
      });
    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (!token) return undefined;
    let cancelled = false;

    async function loadAccount() {
      try {
        const meRes = await fetch(`${apiBase()}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!meRes.ok || cancelled) return;
        const user = await meRes.json();
        const next = {
          name: user.first_name || (user.email || "").split("@")[0] || "signed in",
          tier: user.tier || "free",
          used: null,
          limit: null,
          remaining: null,
          mcp: "no key",
        };

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
        if (!cancelled) setAccount(next);
      } catch (err) {
        console.error("Error loading dashboard:", err);
      }
    }

    loadAccount();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <>
      <Nav active="dashboard" authed={Boolean(token)} />
      <main className="dash-wrap">
        {account && (
          <section className="dash-account is-on" aria-live="polite">
            <div className="surface dash-stat">
              <div className="k">Account</div>
              <div className="v">{account.name}</div>
              <div className="s">{account.tier}</div>
            </div>
            <div className="surface dash-stat">
              <div className="k">Tokens this month</div>
              <div className="v">{account.used == null ? "—" : Number(account.used).toLocaleString()}</div>
              <div className="s">{account.limit == null ? "" : `of ${Number(account.limit).toLocaleString()}`}</div>
            </div>
            <div className="surface dash-stat">
              <div className="k">Remaining</div>
              <div className="v">
                {account.remaining == null ? "create a key" : Number(account.remaining).toLocaleString()}
              </div>
              <div className="s">hosted API quota</div>
            </div>
            <div className="surface dash-stat">
              <div className="k">MCP</div>
              <div className="v">{account.mcp}</div>
              <div className="s">key status for connect / serve</div>
            </div>
          </section>
        )}
        <div ref={hoodRef} />
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
