/**
 * roka-mcp connect — registers this MCP server in a coding agent's config file.
 *
 * Each agent has its own config format/location. We write the minimal,
 * standard entry for each and merge it into any existing config so the
 * command is idempotent (safe to re-run) and non-destructive to unrelated
 * settings already in the file.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { verifyProAccess, printVerificationError } from "./verify.js";

const SERVER_KEY = "roka-mcp";
const API_KEY_DASHBOARD_URL = "https://roka-prune.com/dashboard/api-keys.html";

function ensureDirFor(filePath) {
  const dir = dirname(filePath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function readJson(filePath) {
  if (!existsSync(filePath)) return {};
  const raw = readFileSync(filePath, "utf8").trim();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`could not parse existing JSON at ${filePath}: ${err.message}`);
  }
}

function writeJson(filePath, data) {
  ensureDirFor(filePath);
  writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function buildServerEntry(apiKey, extra = {}) {
  const entry = { command: "npx", args: ["-y", "roka-mcp", "serve"], ...extra };
  if (apiKey) entry.env = { ...(extra.env || {}), ROKA_API_KEY: apiKey };
  return entry;
}

/** Claude Code (.mcp.json), Cursor (mcp.json), Windsurf (mcp_config.json) all use { mcpServers: { name: {...} } }. */
function writeMcpServersJson(filePath, apiKey) {
  const data = readJson(filePath);
  if (!data.mcpServers || typeof data.mcpServers !== "object") data.mcpServers = {};
  data.mcpServers[SERVER_KEY] = buildServerEntry(apiKey);
  writeJson(filePath, data);
}

/** VS Code / Copilot use { servers: { name: { type: "stdio", ... } } }. */
function writeVSCodeMcpJson(filePath, apiKey) {
  const data = readJson(filePath);
  if (!data.servers || typeof data.servers !== "object") data.servers = {};
  data.servers[SERVER_KEY] = buildServerEntry(apiKey, { type: "stdio" });
  writeJson(filePath, data);
}

/** Cline stores extra UI-only fields (disabled/autoApprove) alongside the server entry. */
function writeClineJson(filePath, apiKey) {
  const data = readJson(filePath);
  if (!data.mcpServers || typeof data.mcpServers !== "object") data.mcpServers = {};
  const existing = data.mcpServers[SERVER_KEY] || {};
  data.mcpServers[SERVER_KEY] = {
    ...buildServerEntry(apiKey),
    disabled: existing.disabled ?? false,
    autoApprove: existing.autoApprove ?? [],
  };
  writeJson(filePath, data);
}

/**
 * Codex CLI uses TOML (~/.codex/config.toml, [mcp_servers.<name>] tables).
 * We avoid pulling in a TOML dependency by doing a targeted text
 * replace/append of just our own table, leaving the rest of the file intact.
 */
function writeCodexToml(filePath, apiKey) {
  ensureDirFor(filePath);
  const lines = [`[mcp_servers.${SERVER_KEY}]`, `command = "npx"`, `args = ["-y", "roka-mcp", "serve"]`];
  if (apiKey) lines.push(`env = { ROKA_API_KEY = "${apiKey}" }`);
  const block = lines.join("\n");

  const existing = existsSync(filePath) ? readFileSync(filePath, "utf8") : "";
  const headerRe = new RegExp(`\\[mcp_servers\\.${SERVER_KEY}\\][^]*?(?=\\n\\[|$)`);

  let updated;
  if (headerRe.test(existing)) {
    updated = existing.replace(headerRe, block);
  } else if (existing.length === 0) {
    updated = block;
  } else if (existing.endsWith("\n")) {
    updated = `${existing}\n${block}`;
  } else {
    updated = `${existing}\n\n${block}`;
  }
  if (!updated.endsWith("\n")) updated += "\n";
  writeFileSync(filePath, updated, "utf8");
}

function defaultClinePath() {
  const plat = process.platform;
  if (plat === "darwin") {
    return join(
      homedir(),
      "Library",
      "Application Support",
      "Code",
      "User",
      "globalStorage",
      "saoudrizwan.claude-dev",
      "settings",
      "cline_mcp_settings.json"
    );
  }
  if (plat === "win32") {
    const appData = process.env.APPDATA || join(homedir(), "AppData", "Roaming");
    return join(appData, "Code", "User", "globalStorage", "saoudrizwan.claude-dev", "settings", "cline_mcp_settings.json");
  }
  return join(
    homedir(),
    ".config",
    "Code",
    "User",
    "globalStorage",
    "saoudrizwan.claude-dev",
    "settings",
    "cline_mcp_settings.json"
  );
}

/**
 * Supported agents. `describe` resolves the config path (given cwd);
 * `write` merges our server entry into that file.
 */
export const AGENTS = {
  "claude-code": {
    label: "Claude Code",
    describe: (cwd) => join(cwd, ".mcp.json"),
    write: writeMcpServersJson,
  },
  cursor: {
    label: "Cursor",
    describe: () => join(homedir(), ".cursor", "mcp.json"),
    write: writeMcpServersJson,
  },
  codex: {
    label: "Codex",
    describe: () => join(homedir(), ".codex", "config.toml"),
    write: writeCodexToml,
  },
  copilot: {
    label: "GitHub Copilot (VS Code)",
    describe: (cwd) => join(cwd, ".vscode", "mcp.json"),
    write: writeVSCodeMcpJson,
  },
  vscode: {
    label: "VS Code",
    describe: (cwd) => join(cwd, ".vscode", "mcp.json"),
    write: writeVSCodeMcpJson,
  },
  windsurf: {
    label: "Windsurf",
    describe: () => join(homedir(), ".codeium", "windsurf", "mcp_config.json"),
    write: writeMcpServersJson,
  },
  cline: {
    label: "Cline",
    describe: () => defaultClinePath(),
    write: writeClineJson,
    note:
      "Cline's config path depends on your host editor (VS Code, Cursor, ...) and OS. " +
      "If this file isn't picked up, open Cline's MCP settings UI and check the path shown there.",
  },
};

function printConnectHelp() {
  console.error(`
Usage: roka-mcp connect --agent <name> [--api-key <key>]

Registers roka-mcp as an MCP server in your agent's config file.

Agents:
  ${Object.keys(AGENTS).join(", ")}

Options:
  --agent, -a <name>     Agent to configure (required)
  --api-key, -k <key>    Roka Pro API key (or set ROKA_API_KEY)
  --help, -h             Show this help

Examples:
  roka-mcp connect --agent cursor
  ROKA_API_KEY=rk_live_... roka-mcp connect --agent claude-code
  roka-mcp connect --agent codex --api-key rk_live_...
`);
}

function parseConnectArgs(args) {
  const opts = { agent: null, apiKey: null };
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--agent" || arg === "-a") {
      opts.agent = args[++i];
    } else if (arg.startsWith("--agent=")) {
      opts.agent = arg.slice("--agent=".length);
    } else if (arg === "--api-key" || arg === "-k") {
      opts.apiKey = args[++i];
    } else if (arg.startsWith("--api-key=")) {
      opts.apiKey = arg.slice("--api-key=".length);
    } else if (arg === "--help" || arg === "-h") {
      printConnectHelp();
      process.exit(0);
    } else {
      console.error(`[roka-mcp] connect: unknown argument "${arg}"`);
      printConnectHelp();
      process.exit(1);
    }
  }
  return opts;
}

export async function connectCommand(args) {
  const opts = parseConnectArgs(args);

  if (!opts.agent) {
    console.error("[roka-mcp] connect: missing required --agent <name>");
    printConnectHelp();
    process.exit(1);
  }

  const agentConf = AGENTS[opts.agent];
  if (!agentConf) {
    console.error(`[roka-mcp] connect: unknown agent "${opts.agent}"`);
    console.error(`Supported agents: ${Object.keys(AGENTS).join(", ")}`);
    process.exit(1);
  }

  const apiKey = opts.apiKey || process.env.ROKA_API_KEY || null;
  if (!apiKey) {
    console.error("[roka-mcp] connect: MCP is a Pro feature and requires an API key.");
    console.error(`  Set ROKA_API_KEY or pass --api-key <key>. Get one at ${API_KEY_DASHBOARD_URL}`);
    process.exit(1);
  }

  console.error("[roka-mcp] connect: verifying API key…");
  const verification = await verifyProAccess(apiKey);
  if (!verification.ok) {
    printVerificationError("connect", verification);
    process.exit(1);
  }
  console.error(`[roka-mcp] connect: verified — tier "${verification.tier}", MCP access confirmed.`);

  const filePath = agentConf.describe(process.cwd());
  try {
    agentConf.write(filePath, apiKey);
  } catch (err) {
    console.error(`[roka-mcp] connect: failed to update ${agentConf.label} config at ${filePath}`);
    console.error(`  ${err.message}`);
    process.exit(1);
  }

  console.log(`✓ registered roka-mcp with ${agentConf.label}`);
  console.log(`✓ wrote config to ${filePath}`);
  if (agentConf.note) console.log(`  note: ${agentConf.note}`);
  console.log(`Restart ${agentConf.label} (or reload its window) to pick up the new MCP server.`);
}
