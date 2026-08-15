const NAV = [
  {
    label: "Get started",
    items: [
      { href: "/docs/", id: "welcome", title: "Welcome" },
      { href: "/docs/install.html", id: "install", title: "Install CLI" },
      { href: "/docs/cli.html", id: "cli", title: "CLI usage" },
    ],
  },
  {
    label: "MCP",
    items: [
      { href: "/docs/mcp.html", id: "mcp", title: "Connect an agent" },
      { href: "/docs/tools.html", id: "tools", title: "Tools" },
      { href: "/docs/watch.html", id: "watch", title: "Watch mode" },
    ],
  },
  {
    label: "Concepts",
    items: [
      { href: "/docs/pipeline.html", id: "pipeline", title: "How pruning works" },
      { href: "/docs/pricing.html", id: "pricing", title: "Pricing & quotas" },
      { href: "/docs/benchmark.html", id: "benchmark", title: "Benchmark" },
      { href: "/docs/faq.html", id: "faq", title: "FAQ" },
    ],
  },
  {
    label: "Legal",
    items: [
      { href: "/docs/privacy.html", id: "privacy", title: "Privacy" },
      { href: "/docs/terms.html", id: "terms", title: "Terms" },
    ],
  },
];

function currentId() {
  return document.getElementById("docs-root")?.dataset.page || "";
}

function renderSidebar() {
  const active = currentId();
  const groups = NAV.map((group) => {
    const links = group.items
      .map((item) => {
        const cls = item.id === active ? "nav-link active" : "nav-link";
        return `<a class="${cls}" href="${item.href}">${item.title}</a>`;
      })
      .join("");
    return `<div class="nav-group"><div class="nav-label">${group.label}</div>${links}</div>`;
  }).join("");

  return `
    <a class="docs-brand" href="/docs/">
      <img src="/assets/logos/logo-roka.png" alt="">
      Roka Docs
    </a>
    ${groups}
    <div class="nav-group">
      <div class="nav-label">Site</div>
      <a class="nav-link" href="/index.html">Home</a>
      <a class="nav-link" href="/install.html">Install page</a>
      <a class="nav-link" href="/research.html">Research</a>
      <a class="nav-link" href="/dashboard/api-keys.html">API keys</a>
    </div>
    <div style="padding:0.55rem">
      <button type="button" class="icon-btn" id="themeToggle"><span id="themeLabel">Light</span></button>
    </div>
  `;
}

function enhanceCodeBlocks() {
  document.querySelectorAll("pre").forEach((pre) => {
    if (pre.querySelector(".copy-btn")) return;
    pre.style.position = "relative";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "copy-btn";
    btn.textContent = "Copy";
    btn.addEventListener("click", async () => {
      const text = pre.innerText.replace(/\nCopy$/, "").replace(/Copy$/, "").trim();
      try {
        await navigator.clipboard.writeText(pre.dataset.copy || text);
        btn.textContent = "Copied";
        setTimeout(() => { btn.textContent = "Copy"; }, 1200);
      } catch {
        btn.textContent = "Failed";
      }
    });
    pre.appendChild(btn);
  });
}

function applyTheme(theme) {
  const html = document.documentElement;
  html.classList.toggle("light", theme === "light");
  html.classList.toggle("dark", theme !== "light");
  localStorage.setItem("roka-theme", theme);
  localStorage.setItem("theme", theme);
    const label = document.getElementById("themeLabel");
    if (label) label.textContent = theme === "dark" ? "Light" : "Dark";
    document.querySelectorAll("#themeLabel").forEach((el) => {
      el.textContent = theme === "dark" ? "Light" : "Dark";
    });
}

document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.getElementById("docs-sidebar");
  if (sidebar) sidebar.innerHTML = renderSidebar();

  const saved = localStorage.getItem("roka-theme") || localStorage.getItem("theme") || "dark";
  applyTheme(saved === "light" ? "light" : "dark");

  document.querySelectorAll("#themeToggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const next = document.documentElement.classList.contains("light") ? "dark" : "light";
      applyTheme(next);
    });
  });

  document.getElementById("navToggle")?.addEventListener("click", () => {
    sidebar?.classList.toggle("open");
  });

  enhanceCodeBlocks();
});
