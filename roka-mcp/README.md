# roka-mcp

[![Website](https://img.shields.io/badge/Website-trysoup.dev-blue)](https://trysoup.dev)
[![License](https://img.shields.io/badge/License-MIT-green)](https://opensource.org/licenses/MIT)

> **MCP for [Soup](https://trysoup.dev) — connect Cursor, Claude Code, Codex, or Copilot to prune logs inside your agent.**

Free and open source. No API key. Install the [CLI](https://github.com/Roka-Dev-Labs/roka) separately for local pruning.

## Install

```bash
npx roka-mcp connect --agent cursor
```

Supported agents: **Claude Code**, **Cursor**, **Codex**, **Copilot**, **Windsurf**, **VS Code**, **Cline**.

```bash
npm install -g roka-mcp
```

## What it does

Soup runs as an MCP server next to your dev environment. On crash patterns (ERROR, FATAL, panic, Android `E`, `ClassCastException`, process death, …) it runs the same prune pipeline — collapse repetition and timestamped near-duplicates, preserve the exception, rank, pack to budget without one storm filling it — and hands your agent exactly the slice of context needed to debug.

## Tools

| Tool | Description |
|------|-------------|
| `prune_logs` | Prune raw log text |
| `prune_file` | Prune a log file by path |
| `prune_tail` | Prune the last N lines of a live log |

## Commands

### `serve` (default)

Starts the MCP server on stdio. This is what your agent launches under the hood after `connect`.

```bash
npx roka-mcp@latest
npx roka-mcp serve
```

### `connect`

Registers roka-mcp as an MCP server in your agent's config file. Idempotent.

```bash
npx roka-mcp connect --agent <name>
```

| Flag | Description |
|------|-------------|
| `--agent, -a <name>` | Required. One of: `claude-code`, `cursor`, `codex`, `copilot`, `vscode`, `windsurf`, `cline` |
| `--api-key, -k <key>` | Optional. Unused for prune; only if you still have a hosted dashboard key |

| Agent | Config file written |
|-------|----------------------|
| `claude-code` | `.mcp.json` (project root) |
| `cursor` | `~/.cursor/mcp.json` |
| `codex` | `~/.codex/config.toml` (`[mcp_servers.roka-mcp]`) |
| `copilot` / `vscode` | `.vscode/mcp.json` (project) |
| `windsurf` | `~/.codeium/windsurf/mcp_config.json` |
| `cline` | Cline's VS Code global storage settings file |

Examples:

```bash
npx roka-mcp connect --agent claude-code
npx roka-mcp connect --agent cursor
npx roka-mcp connect --agent codex
npx roka-mcp connect --agent copilot
```

### `watch`

Tails a log file. When `--on-crash` is set and a new line matches the crash pattern, it prunes recent buffered context and writes `.roka/crash-context.txt`.

```bash
npx roka-mcp watch ./logs/dev.log --on-crash
```

## API

Pruning (`prune_logs` / `prune_file` / `prune_tail`, and `watch --on-crash`) runs **locally**. Log text never leaves your machine. An API key is not required.

## Links

- [Website](https://trysoup.dev)
- [Docs](https://trysoup.dev/docs/)
- [Research (LogHub)](https://trysoup.dev/research.html)
- [CLI install](https://github.com/Roka-Dev-Labs/roka#install)
- [Support](mailto:mukhamedjankydyrli@gmail.com)

## License

MIT — see [LICENSE](LICENSE).
