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

One command registers Roka as an MCP server so Claude Code / Cursor / Codex / Copilot can call `prune_file`, `prune_logs`, and `prune_tail`:

```bash
npx roka-mcp connect --agent claude-code
npx roka-mcp connect --agent cursor
npx roka-mcp connect --agent codex
npx roka-mcp connect --agent copilot
```

Optional Pro key: `--api-key rk_live_...` or `ROKA_API_KEY`. Restart the IDE after connect.  
Full MCP docs: [roka-mcp README](https://github.com/Roka-Dev-Labs/roka-mcp).

---

## Usage

```bash
# Pipe from stdin
cat deploy.log | roka prune --query "connection errors" --budget 8000

# Point at a file
roka --input app.log --query "what broke during last night's deploy" --budget 12000

# Write output to a file
roka --input big.log --query "OOM" --budget 5000 --output pruned.txt

# Pro: API key for semantic ranking
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

1. **Collapse** — Adjacent duplicate / near-duplicate lines merge with counts (heartbeats, retries stop dominating).
2. **Rank / force-keep** — Lines matching `ERROR|FATAL|CRITICAL|Exception|Traceback|panic` survive; other lines score by rarity / anomaly.
3. **Fit** — Pack into your character/token budget.

Deterministic by default; semantic re-ranking is a Pro/optional path. Local prune tools do not upload your logs.

---

## Benchmark (MVP)

We ran the shipped MCP `prune_file` tool against the [LogHub](https://github.com/logpai/loghub) corpus (15 real production log sources, fixed 4,000-character budget, no per-file tuning):

| Metric | Result |
|--------|--------|
| Avg. lines removed | **92.2%** |
| Avg. compression | **~69×** (chars in → 4K out) |
| Sources with real errors still surfaced | **11 / 11** |

Full write-up (methodology, Thunderbird before/after, limits): [roka-prune.com/research.html](https://roka-prune.com/research.html).

We're early — the study measures **retention under budget**, not downstream agent task success.

---

## Pricing (summary)

| Tier | Price | Highlights |
|------|-------|------------|
| **Free** | $0 | Local CLI, up to 15K tokens lifetime per device, basic fingerprinting |
| **Pro** | $20/mo | Web UI + API, 500K tokens/month, semantic re-rank, MCP agent connect |
| **Enterprise** | Custom | Unlimited, SSO / audit / integrations — [contact](mailto:mukhamedjankydyrli@gmail.com) |

Details: [roka-prune.com/#pricing](https://roka-prune.com/#pricing).

---

## Releases

Pre-built binaries: [GitHub Releases](https://github.com/Roka-Dev-Labs/roka/releases).  
Assets match `install.roka-prune.com` naming: `roka-{linux|darwin}-{amd64|arm64}.gz`.

This public repo is **docs, website, and issue tracking**. The pruning engine source and hosted backend are proprietary.

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
- [Website](https://roka-prune.com) · [support@roka-prune.com](mailto:support@roka-prune.com)

## License

MIT — see [LICENSE](LICENSE).
