# roka-mcp

[![Website](https://img.shields.io/badge/Website-roka--prune.com-blue)](https://roka-prune.com)
[![License](https://img.shields.io/badge/License-MIT-green)](https://opensource.org/licenses/MIT)

> **MCP integration for [Roka](https://roka-prune.com) — connect Cursor, Claude Code, Codex, or Copilot to prune logs inside your agent.**

Part of [Roka Dev Labs](https://github.com/Roka-Dev-Labs). Install the [CLI](https://github.com/Roka-Dev-Labs/roka) separately for local pruning.

## Pro required

MCP is a **Pro** feature. Sign up at [roka-prune.com](https://roka-prune.com), create an API key in the [dashboard](https://roka-prune.com/dashboard/api-keys.html), then:

```bash
export ROKA_API_KEY=rk_live_...
npx roka-mcp connect --agent cursor
```

Supported agents: **Claude Code**, **Cursor**, **Codex**, **Copilot**, **Windsurf**, **VS Code**, **Cline**.

`connect` and `watch` both require `ROKA_API_KEY` (env var or `--api-key`) and will exit with a clear
error if it's missing — no key, no config gets written. `serve` (the raw MCP stdio server an agent
launches under the hood) currently prints a warning to stderr if the key is missing rather than
refusing to run, since it's typically invoked programmatically by whatever `connect` already wired up.

## Install

```bash
npm install -g roka-mcp
# or one-shot:
npx roka-mcp connect --agent cursor --api-key rk_live_...
```

## What it does

Roka runs as an MCP server next to your dev environment, watching logs in real time. On crash patterns (ERROR, FATAL, panic, …) it runs the same prune pipeline — collapse repetition, preserve the exception, rank, pack to budget — and hands your agent exactly the slice of context needed to debug.

## Tools

| Tool | Description |
|------|-------------|
| `prune_logs` | Prune raw log text |
| `prune_file` | Prune a log file by path |
| `prune_tail` | Prune the last N lines of a live log |

## Commands

### `serve` (default)

Starts the MCP server on stdio. This is what your agent launches under the hood after `connect` —
you normally don't run it by hand. If you do run it directly in a terminal, it prints a short banner
to stderr explaining that it's waiting for JSON-RPC on stdin (stdout stays clean for the MCP protocol).

```bash
npx roka-mcp@latest
# equivalent to:
npx roka-mcp serve
```

### `connect`

Registers roka-mcp as an MCP server in your agent's config file, using each agent's real config
format/location. Idempotent — running it again just updates the existing entry in place.

```bash
npx roka-mcp connect --agent <name> [--api-key <key>]
```

| Flag | Description |
|------|-------------|
| `--agent, -a <name>` | Required. One of: `claude-code`, `cursor`, `codex`, `copilot`, `vscode`, `windsurf`, `cline` |
| `--api-key, -k <key>` | Roka Pro API key (or set `ROKA_API_KEY`) |

| Agent | Config file written |
|-------|----------------------|
| `claude-code` | `.mcp.json` (project root) |
| `cursor` | `~/.cursor/mcp.json` |
| `codex` | `~/.codex/config.toml` (`[mcp_servers.roka-mcp]`) |
| `copilot` / `vscode` | `.vscode/mcp.json` (project) |
| `windsurf` | `~/.codeium/windsurf/mcp_config.json` |
| `cline` | Cline's VS Code global storage settings file (path varies by host editor/OS — logged on run) |

Examples:

```bash
npx roka-mcp connect --agent claude-code
npx roka-mcp connect --agent cursor --api-key rk_live_...
npx roka-mcp connect --agent codex
npx roka-mcp connect --agent copilot
```

### `watch`

Tails a log file. When `--on-crash` is set and a new line matches the crash pattern (`ERROR`,
`FATAL`, `CRITICAL`, `Exception`, `Traceback`, `panic`), it runs the same prune pipeline used by the
tools above over the recently buffered context and writes the result to `.roka/crash-context.txt`
(created if needed). Runs in the foreground until `Ctrl+C`/`SIGTERM`.

```bash
npx roka-mcp watch ./logs/dev.log --on-crash
```

| Flag | Description |
|------|-------------|
| `--on-crash` | Enable crash-triggered context pruning |
| `--budget <n>` | Character budget for pruned output (default `4000`) |
| `--api-key, -k <key>` | Roka Pro API key (or set `ROKA_API_KEY`) |

On crash, Roka writes pruned context to `.roka/crash-context.txt`.

## API

Pruning itself (`prune_logs`/`prune_file`/`prune_tail`, and the `watch --on-crash` pipeline) runs
**locally** in this package — no network calls, no data leaves your machine. `ROKA_API_KEY` currently
only gates the `connect`/`watch` commands locally (see [Pro required](#pro-required)); it is not yet
sent to a hosted API from this package.

## Other Roka projects

| Repo | Description |
|------|-------------|
| [roka](https://github.com/Roka-Dev-Labs/roka) | CLI — prune logs, code, docs locally |
| [roka-mcp](https://github.com/Roka-Dev-Labs/roka-mcp) | MCP server — this repository |
| [Roka Dev Labs](https://github.com/Roka-Dev-Labs) | Org profile — website, dashboard, API |

## Links

- [Website](https://roka-prune.com)
- [Install + MCP](https://roka-prune.com/install.html#mcp)
- [Research (LogHub)](https://roka-prune.com/research.html)
- [Pricing](https://roka-prune.com/#pricing)
- [CLI install](https://github.com/Roka-Dev-Labs/roka#install)
- [Support](mailto:support@roka-prune.com)

## License

MIT — see [LICENSE](LICENSE).
