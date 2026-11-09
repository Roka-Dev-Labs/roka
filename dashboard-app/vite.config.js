import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// @vercel/static-build cds into the directory of dashboard-app/package.json
// before `npm run build`. This root is that same directory (the folder that
// contains this file). A root of "dashboard-app" would look for a nested
// dashboard-app/dashboard-app.
const appDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(appDir, "..");
const distDir = path.join(appDir, "dist");

const PAGES = [
  "dashboard/api-keys.html",
  "dashboard/upgrade.html",
];

function serveRepoStatic() {
  const types = {
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".woff2": "font/woff2",
    ".webmanifest": "application/manifest+json",
  };

  return (req, res, next) => {
    const urlPath = req.url?.split("?")[0] ?? "";
    if (!urlPath.startsWith("/js/") && !urlPath.startsWith("/assets/")) {
      next();
      return;
    }
    const file = path.resolve(repoRoot, urlPath.slice(1));
    if (!file.startsWith(repoRoot + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      next();
      return;
    }
    res.setHeader("Content-Type", types[path.extname(file)] || "application/octet-stream");
    fs.createReadStream(file).pipe(res);
  };
}

function repoStaticPlugin() {
  const middleware = serveRepoStatic();
  return {
    name: "repo-static",
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}

const ALLOWED_SCRIPTS = new Set([
  "/js/config.js",
  "/js/console-egg.js",
  "/js/back-trigger.js",
  "/assets/js/theme-boot.js",
  "/assets/js/reveal.js",
]);

function assertDashboardOutputOnly() {
  return {
    name: "assert-dashboard-output-only",
    writeBundle() {
      const files = walk(distDir);
      const unexpected = files.filter(
        (file) => !PAGES.includes(file) && !file.startsWith("dashboard-assets/"),
      );
      const missing = PAGES.filter((page) => !files.includes(page));
      const jsAssets = files.filter(
        (file) => file.startsWith("dashboard-assets/") && file.endsWith(".js"),
      );

      if (missing.length || unexpected.length || jsAssets.length === 0) {
        throw new Error(
          [
            "Dashboard build must emit only the three page URLs plus /dashboard-assets.",
            `Missing: ${missing.join(", ") || "(none)"}`,
            `Unexpected: ${unexpected.join(", ") || "(none)"}`,
            `JS assets: ${jsAssets.length}`,
          ].join("\n"),
        );
      }

      for (const page of PAGES) {
        const html = fs.readFileSync(path.join(distDir, page), "utf8");
        if (!html.includes("/dashboard-assets/")) {
          throw new Error(`${page} does not reference /dashboard-assets/`);
        }
        const scriptSrcs = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((match) => match[1]);
        for (const src of scriptSrcs) {
          if (src.startsWith("/dashboard-assets/") || ALLOWED_SCRIPTS.has(src)) continue;
          throw new Error(`${page} loads an unexpected script: ${src}`);
        }
      }

      console.log(`Vite root: ${appDir}`);
      console.log("Deploy paths:");
      for (const page of PAGES) console.log(`  /${page}`);
      for (const file of files.filter((item) => item.startsWith("dashboard-assets/"))) {
        console.log(`  /${file}`);
      }
    },
  };
}

function walk(dir, base = "") {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) out.push(...walk(path.join(dir, entry.name), rel));
    else out.push(rel);
  }
  return out;
}

export default defineConfig({
  root: appDir,
  plugins: [react(), repoStaticPlugin(), assertDashboardOutputOnly()],
  build: {
    outDir: distDir,
    emptyOutDir: true,
    assetsDir: "dashboard-assets",
    rollupOptions: {
      input: {
        apiKeys: path.join(appDir, "dashboard/api-keys.html"),
        upgrade: path.join(appDir, "dashboard/upgrade.html"),
      },
    },
  },
});
