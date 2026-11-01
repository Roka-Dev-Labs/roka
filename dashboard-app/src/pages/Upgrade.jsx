import { Nav } from "../components/Nav.jsx";

export function Upgrade() {
  return (
    <>
      <Nav active="upgrade" />
      <main className="limits-wrap">
        <h1>Free, with usage limits</h1>
        <p className="lede">Roka is free. No subscription or payment required.</p>
        <article className="limits-card">
          <h2>Usage limits</h2>
          <ul>
            <li>Local CLI: 15K tokens lifetime per device; works offline.</li>
            <li>Hosted API: up to 500K tokens/month, depending on your API key.</li>
            <li>MCP requires a valid API key with the appropriate access.</li>
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
