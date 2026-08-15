# Connect an agent

MCP is a **Pro** feature. The npm package `roka-mcp` (v0.2.1+) can be installed by anyone, but `connect`, `serve`, and `watch` verify a Pro API key before they do anything.

Get a key from https://www.roka-prune.com/dashboard/api-keys.html or the 3-month feedback promo. Set `ROKA_API_KEY` or pass `--api-key`.

```bash
npm install -g roka-mcp
npx roka-mcp connect --agent cursor --api-key rk_live_...
```

Requires Node.js 18+.

```bash
npx roka-mcp connect --agent <name> [--api-key <key>]
```

`--agent` / `-a` is required: `claude-code`, `cursor`, `codex`, `copilot`, `vscode`, `windsurf`, `cline`.

| Agent | Config file |
| --- | --- |
| claude-code | `.mcp.json` (project root) |
| cursor | `~/.cursor/mcp.json` |
| codex | `~/.codex/config.toml` — `[mcp_servers.roka-mcp]` |
| copilot / vscode | `.vscode/mcp.json` (project), type: stdio |
| windsurf | `~/.codeium/windsurf/mcp_config.json` |
| cline | Cline global storage settings (path varies) |

The entry launched by the agent:

```
command: npx
args: ["-y", "roka-mcp", "serve"]
env.ROKA_API_KEY: <your key, if provided>
```

Restart the IDE after connect. `serve` is stdio JSON-RPC; missing/invalid/expired/free-tier keys are rejected.

The only network call for MCP is `GET https://api.roka-prune.com/api/status` with the key in Authorization. Override host with `ROKA_API_URL_BASE`. Log text used by the tools stays on the machine.
