import { accessToken } from "../api.js";
import { Nav } from "../components/Nav.jsx";

export function Upgrade() {
  return (
    <>
      <Nav active="upgrade" authed={Boolean(accessToken())} />
      <main className="limits-wrap">
        <h1>Free CLI. Pro MCP.</h1>
        <p className="lede">Local prune is free with a device quota. Connecting an agent is not.</p>
        <article className="limits-card">
          <h2>Usage limits</h2>
          <ul>
            <li>Local CLI prune: 15K tokens lifetime per device; works offline; no API key.</li>
            <li>Hosted API: up to 500K tokens/month on Pro, trial, or Enterprise keys.</li>
            <li>MCP connect / serve / watch require a Pro API key. Free-tier keys are rejected.</li>
          </ul>
          <a className="limits-btn" href="/install.html">
            Get started free
          </a>
          <a className="limits-btn limits-btn-ghost" href="/dashboard.html">
            View your usage
          </a>
        </article>
      </main>
    </>
  );
}
