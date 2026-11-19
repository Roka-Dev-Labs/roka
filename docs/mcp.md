# Connect an agent

Soup MCP is free. The npm package `roka-mcp` needs no API key.

```bash
npm install -g roka-mcp
npx roka-mcp connect --agent cursor
```

Requires Node.js 18+.

```bash
npx roka-mcp connect --agent <name>
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
```

Restart the IDE after connect. `serve` is stdio JSON-RPC. Pruning runs locally; log text stays on the machine. An API key is optional telemetry only — never required to connect or prune.
