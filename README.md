# roka-cli

[![Website](https://img.shields.io/badge/Website-roka--prune.com-blue)](https://roka-prune.com)
[![License](https://img.shields.io/badge/License-MIT-green)](https://opensource.org/licenses/MIT)
[![GitHub Stars](https://img.shields.io/github/stars/Roka-Dev-Labs/roka?style=social)](https://github.com/Roka-Dev-Labs/roka/stargazers)

> **Free CLI to prune logs, code, and docs down to your token budget — without losing what matters.**

Roka is the command-line interface for [Roka](https://roka-prune.com). Pipe a noisy crash log, a bloated codebase, or a long document — get back a tight, ranked, budget-aware context your agent can actually use.

```bash
cat deploy.log | roka --query "why did the deploy fail" --budget 8000
```

Part of [Roka Dev Labs](https://github.com/Roka-Dev-Labs) — see also [roka-mcp](https://github.com/Roka-Dev-Labs/roka-mcp) for Cursor / Claude Code integration.

## Install

```bash
curl -fsSL https://install.roka-prune.com | bash
```

Auto-detects OS and architecture, verifies SHA256 checksum, installs to `~/.local/bin`. See [INSTALLATION.md](INSTALLATION.md) for manual install and PATH setup.

Supported: **macOS** (Intel + Apple Silicon), **Linux** (x86_64 + ARM64), **Windows** (WSL2).

## Usage

```bash
# Pipe from stdin
cat deploy.log | roka --query "connection errors" --budget 8000

# Point at a file
roka --input app.log --query "what broke during last night's deploy" --budget 12000

# Write output to file
roka --input big.log --query "OOM" --budget 5000 --output pruned.txt

# Pro: pass your API key for semantic ranking
roka --input logs.txt --query "auth failures" --budget 8000 --api-key rk_live_...
```

### Flags

| Flag | Default | Description |
|------|---------|-------------|
| `-q, --query` | `summarize` | What to focus on — plain English or keywords |
| `-b, --budget` | `8000` | Token budget for the output |
| `-i, --input` | stdin | Input file path |
| `-o, --output` | stdout | Output file path |
| `-a, --api-key` | — | API key (Pro / Enterprise) |

## What the CLI does

- **Fingerprinting** — Collapses repeated lines (UUIDs, IPs, timestamps → placeholders)
- **Critical preservation** — Panics, exceptions, OOM, stack traces always survive
- **Semantic ranking** — BM25 + optional semantic re-ranking against your query (Pro)
- **Token-budget packing** — Exact token counts, respects `--budget`

## Releases

Pre-built binaries are on [GitHub Releases](https://github.com/Roka-Dev-Labs/roka/releases). They are built from the private product repo when a `v*` tag is pushed (see `RELEASE.md` there). Assets match `install.roka-prune.com` naming: `roka-{linux|darwin}-{amd64|arm64}.gz`.

## Other Roka projects

| Repo | Description |
|------|-------------|
| [roka](https://github.com/Roka-Dev-Labs/roka) | CLI — this repository |
| [roka-mcp](https://github.com/Roka-Dev-Labs/roka-mcp) | MCP server for Cursor, Claude Code, Codex (Pro) |
| [Roka Dev Labs](https://github.com/Roka-Dev-Labs) | Org profile — website, dashboard, API |

The pruning engine source and hosted backend are proprietary. This public repo is **CLI docs and issue tracking** only. Install via [install.roka-prune.com](https://install.roka-prune.com); binaries come from [Releases](https://github.com/Roka-Dev-Labs/roka/releases).

## Support

- [Report a bug](../../issues/new?labels=bug&template=bug_report.md)
- [Request a feature](../../issues/new?labels=enhancement&template=feature_request.md)
- [Website](https://roka-prune.com) · [support@roka-prune.com](mailto:support@roka-prune.com)

## License

MIT — see [LICENSE](LICENSE).
