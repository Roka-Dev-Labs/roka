# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [0.2.1] - 2026-08-11

### Changed

- Connect success logs use ASCII `[OK]` instead of Unicode checkmarks.
- Publish workflow skips when the package version is already on npm (avoids E403 on tag re-runs).

## [0.2.0] - 2026-08-10

### Changed

- **Breaking:** `connect`, `serve`, and `watch` now verify the API key against the hosted
  `/api/status` endpoint instead of only checking that a key string was present. A missing,
  invalid, expired, or free-tier key is now rejected (`serve` refuses to start any tools;
  `connect` refuses to write the agent config; `watch` refuses to start tailing). This closes the
  gap where MCP tools would silently run locally for anyone who set any `ROKA_API_KEY` value,
  Pro or not.
- Set `ROKA_API_URL_BASE` to override the verification host (defaults to
  `https://api.roka-prune.com`), primarily for local development against a self-hosted backend.

## [0.1.2] - 2026-08-05

### Fixed

- Align package version with the `roka-mcp-v0.1.2` release tag so the GitHub Actions publish
  workflow can publish successfully.
- Harden the publish workflow: fail fast when `NPM_TOKEN` is missing, and write auth into
  `roka-mcp/.npmrc` so `npm publish` always sees credentials.

## [0.1.1] - 2026-08-05

### Added

- `roka-mcp connect --agent <name> [--api-key <key>]` — registers roka-mcp as an MCP server in
  the config file of Claude Code, Cursor, Codex, Copilot, VS Code, Windsurf, or Cline. Writes each
  agent's real config format (`.mcp.json`, `~/.cursor/mcp.json`, `~/.codex/config.toml`,
  `.vscode/mcp.json`, `~/.codeium/windsurf/mcp_config.json`, Cline's settings file). Idempotent —
  re-running updates the existing entry instead of duplicating it.
- `roka-mcp watch <path> --on-crash [--budget <n>] [--api-key <key>]` — tails a log file and, on a
  line matching the crash pattern (`ERROR`, `FATAL`, `CRITICAL`, `Exception`, `Traceback`, `panic`),
  prunes the recently buffered context and writes it to `.roka/crash-context.txt`.
- `roka-mcp --help` / `-h` and `roka-mcp --version` / `-v`.
- Unknown-command handling now lists the available commands (`serve`, `connect`, `watch`) instead of
  a generic error.
- A short human-friendly stderr banner when `serve` is launched directly in an interactive terminal
  (stdout stays untouched so MCP JSON-RPC framing over stdio is unaffected).
- Lightweight local `ROKA_API_KEY` gating: `connect` and `watch` now refuse to run without a key
  (env var or `--api-key`), matching this package's "Pro required" docs.

### Changed

- Internals split into `lib/prune.js`, `lib/server.js`, `lib/connect.js`, `lib/watch.js` for
  readability; `bin/roka-mcp.js` is now just the command dispatcher. No dependencies were added.
- `README.md` documents `connect` and `watch` with real flags/examples, and corrects the "API"
  section to state that pruning runs locally in this package (no hosted API call is made from here
  today).

## [0.1.0] - 2026-06-30

### Added

- Initial MCP server (`roka-mcp serve`) exposing `prune_logs`, `prune_file`, and `prune_tail` tools
  over stdio.
