# Roka

[![Website](https://img.shields.io/badge/Website-roka--prune.com-blue)](https://roka-prune.com)
[![License](https://img.shields.io/badge/License-MIT-green)](https://opensource.org/licenses/MIT)
[![GitHub Stars](https://img.shields.io/github/stars/Roka-Dev-Labs/roka?style=social)](https://github.com/Roka-Dev-Labs/roka/stargazers)

> **Prune your logs.** Collapse noise, keep real errors, pack to a token budget — before your AI agent ever sees the dump.

Roka is a context-pruning layer for AI coding agents. Point it at a noisy crash log (or pipe stdin) and get back a tight, ranked, budget-aware slice your agent can actually use.

```bash
cat deploy.log | roka prune --query "what broke" --budget 8000
```

**Site:** [roka-prune.com](https://roka-prune.com) · **Install:** [install.html](https://roka-prune.com/install.html) · **Research:** [LogHub benchmark write-up](https://roka-prune.com/research.html)

Part of [Roka Dev Labs](https://github.com/Roka-Dev-Labs). MCP server: [roka-mcp](https://github.com/Roka-Dev-Labs/roka-mcp).

---

## Install (CLI)

```bash
curl -fsSL https://install.roka-prune.com | bash
roka --version
```

Auto-detects OS/arch, verifies checksum, installs to `~/.local/bin` (no sudo).  
Supported: **macOS** (Intel + Apple Silicon), **Linux** (x86_64 + ARM64), **Windows** (WSL2).

Manual install and PATH notes: [INSTALLATION.md](INSTALLATION.md).

---

## Connect an AI agent (MCP)

MCP is a **Pro** feature. The `roka-mcp` package is on npm (`npx roka-mcp@latest`), but `connect` / `serve` / `watch` require a Pro API key — without one the command exits instead of writing config.

Get a key via the [API key dashboard](https://roka-prune.com/dashboard/api-keys.html) or the [dashboard](https://roka-prune.com/dashboard/api-keys.html), then:

```bash
npx roka-mcp connect --agent claude-code --api-key rk_live_...
npx roka-mcp connect --agent cursor --api-key rk_live_...
npx roka-mcp connect --agent codex --api-key rk_live_...
npx roka-mcp connect --agent copilot --api-key rk_live_...
```

Or set `ROKA_API_KEY` and omit `--api-key`. Restart the IDE after connect.  
Free cold start (no key): install the CLI above. Full docs: [roka-prune.com/docs](https://roka-prune.com/docs/).

---

## Usage

```bash
# Pipe from stdin
cat deploy.log | roka prune --query "connection errors" --budget 8000

# Point at a file
roka --input app.log --query "what broke during last night's deploy" --budget 12000

# Write output to a file
roka --input big.log --query "OOM" --budget 5000 --output pruned.txt

# Optional hosted embeddings (not the default prune path)
roka --input logs.txt --query "auth failures" --budget 8000 --api-key rk_live_...
```

### Common flags

| Flag | Default | Description |
|------|---------|-------------|
| `-q, --query` | `summarize` | What to focus on — plain English or keywords |
| `-b, --budget` | `8000` | Token budget for the output |
| `-i, --input` | stdin | Input file path |
| `-o, --output` | stdout | Output file path |
| `-a, --api-key` | — | API key (Pro) |

Exact flags may vary by release — run `roka --help`.

---

## What it does

1. **Collapse** — Adjacent identical lines merge with counts (heartbeats, retries stop dominating).
2. **Rank** — Pack query hits, then crash lines (`ERROR|FATAL|CRITICAL|Exception|Traceback|panic`), then crash neighbors, then recency. Query outranks an unrelated ERROR.
3. **Pack** — Keep whole lines in a character budget. MCP default is 4000 characters.

Deterministic by default. Optional hosted embeddings are Pro-only and not the MCP ranker. Local prune tools do not upload your logs.

---

## Benchmark (MVP)

We reran shipped `pruneText` (`prune_file(path, budget=4000)`, no query) against the [LogHub](https://github.com/logpai/loghub) 2k samples (15 sources, 30,003 lines / 4.18M characters):

| Metric | Result |
|--------|--------|
| Mean lines removed | **98.3%** |
| Character compression | **70×** (4.18M → 59.7K) |
| Files with a crash-regex line that still had one | **11 / 11** |

Full write-up (methodology, Thunderbird before/after, limits): [roka-prune.com/research.html](https://roka-prune.com/research.html).

We're early — the study measures **retention under budget**, not downstream agent task success.

---

## Free usage & limits

Local CLI prune is free with a device quota. MCP is not on that free path.

- Local CLI prune: 15K tokens lifetime per device; works offline; no API key.
- Hosted API: up to 500K tokens per month on Pro, trial, or Enterprise keys.
- MCP `connect` / `serve` / `watch` require a Pro API key. Free-tier keys are rejected.

Check your dashboard for your current quota and remaining usage: https://www.roka-prune.com/dashboard.html
API keys: https://www.roka-prune.com/dashboard/api-keys.html

---

## Releases

Pre-built binaries: [GitHub Releases](https://github.com/Roka-Dev-Labs/roka/releases).  
Assets match `install.roka-prune.com` naming: `roka-{linux|darwin}-{amd64|arm64}.gz`.

This public repo is **docs, website, issue tracking, and the `roka-mcp` npm package**. The pruning engine (Rust) and hosted backend are proprietary and live in private repos — GitHub language stats here reflect the marketing site + MCP JS, not the engine. See [`.gitattributes`](.gitattributes).

---

## Other projects

| Repo | Description |
|------|-------------|
| [roka](https://github.com/Roka-Dev-Labs/roka) | CLI + website — this repository |
| [roka-mcp](https://github.com/Roka-Dev-Labs/roka-mcp) | MCP server (`connect` / `serve` / `watch`) |
| [Roka Dev Labs](https://github.com/Roka-Dev-Labs) | Org |

---

## Support

- [Report a bug](../../issues/new?labels=bug&template=bug_report.md)
- [Request a feature](../../issues/new?labels=enhancement&template=feature_request.md)
- [Website](https://roka-prune.com) · [mukhamedjankydyrli@gmail.com](mailto:mukhamedjankydyrli@gmail.com)

## License

MIT — see [LICENSE](LICENSE).
