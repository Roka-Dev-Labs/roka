# Soup

[![Website](https://img.shields.io/badge/Website-trysoup.dev-blue)](https://trysoup.dev)
[![License](https://img.shields.io/badge/License-MIT-green)](https://opensource.org/licenses/MIT)
[![GitHub Stars](https://img.shields.io/github/stars/Roka-Dev-Labs/roka?style=social)](https://github.com/Roka-Dev-Labs/roka/stargazers)

> **Prune your logs.** Collapse noise, keep real errors, pack to a token budget — before your AI agent ever sees the dump.

Soup is a free, open-source context-pruning layer for AI coding agents. Point it at a noisy crash log (or pipe stdin) and get back a tight, ranked, budget-aware slice your agent can actually use. No API key. No quota. MIT.

The CLI binary is still `roka`. The MCP package is still `roka-mcp`.

```bash
cat deploy.log | roka prune --query "what broke" --budget 8000
```

**Site:** [trysoup.dev](https://trysoup.dev) · **Install:** [install.html](https://trysoup.dev/install.html) · **Research:** [LogHub benchmark write-up](https://trysoup.dev/research.html)

---

## Install (CLI)

```bash
curl -fsSL https://install.trysoup.dev | bash
roka --version
```

Auto-detects OS/arch, verifies checksum, installs to `~/.local/bin` (no sudo).  
Supported: **macOS** (Intel + Apple Silicon), **Linux** (x86_64 + ARM64), **Windows** (WSL2).

Manual install and PATH notes: [INSTALLATION.md](INSTALLATION.md).

---

## Connect an AI agent (MCP)

Free. Local. No API key.

```bash
npx roka-mcp connect --agent claude-code
npx roka-mcp connect --agent cursor
npx roka-mcp connect --agent codex
npx roka-mcp connect --agent copilot
```

Restart the IDE after connect. Pruning runs on your machine. Full docs: [trysoup.dev/docs](https://trysoup.dev/docs/).

---

## Usage

```bash
# Pipe from stdin
cat deploy.log | roka prune --query "connection errors" --budget 8000

# Point at a file
roka --input app.log --query "what broke during last night's deploy" --budget 12000

# Write output to a file
roka --input big.log --query "OOM" --budget 5000 --output pruned.txt
```

### Common flags

| Flag | Default | Description |
|------|---------|-------------|
| `-q, --query` | `summarize` | What to focus on — plain English or keywords |
| `-b, --budget` | `8000` | Token budget for the output |
| `-i, --input` | stdin | Input file path |
| `-o, --output` | stdout | Output file path |

Exact flags may vary by release — run `roka --help`.

---

## What it does

1. **Collapse** — Adjacent identical and near-duplicate lines merge with counts (timestamped retries stop dominating; small heartbeat counters stay separate).
2. **Rank** — Pack query hits (stems, failure synonyms, Java `*Exception` names, Android logcat levels), then crash lines (`ERROR|FATAL|CRITICAL|Exception|Traceback|panic|ANR`, `*Exception`/`*Error`, `has died`, logcat `E`/`F`), then crash neighbors, then recency. Query outranks an unrelated ERROR.
3. **Pack** — Keep whole lines in a character budget. One template gets a representative before extra copies of a storm. MCP default is 4000 characters.

Deterministic by default. Local prune tools do not upload your logs.

---

## Benchmark (MVP)

We reran shipped `pruneText` (`prune_file(path, budget=4000)`, no query) against the [LogHub](https://github.com/logpai/loghub) 2k samples (15 sources, 30,003 lines / 4.18M characters):

| Metric | Result |
|--------|--------|
| Mean lines removed | **98.3%** |
| Character compression | **70×** (4.18M → 59.7K) |
| Files with a crash-regex line that still had one | **11 / 11** |

Full write-up (methodology, Thunderbird before/after, limits): [trysoup.dev/research.html](https://trysoup.dev/research.html).

We're early — the study measures **retention under budget**, not downstream agent task success.

---

## Free and open source

Soup is MIT-licensed and free to use. CLI, MCP `connect` / `serve` / `watch`, and the prune pipeline in this repo need no account and no API key. There is no device quota and no paid plan.

---

## Releases

Pre-built binaries: [GitHub Releases](https://github.com/Roka-Dev-Labs/roka/releases).  
Assets match `install.trysoup.dev` naming: `roka-{linux|darwin}-{amd64|arm64}.gz`.

This public repo is the website, docs, and the `roka-mcp` npm package, including the JavaScript prune engine agents actually call.

---

## Other projects

| Repo | Description |
|------|-------------|
| [roka](https://github.com/Roka-Dev-Labs/roka) | CLI + website — this repository |
| [roka-mcp](https://github.com/Roka-Dev-Labs/roka-mcp) | MCP server (`connect` / `serve` / `watch`) |

---

## Support

- [Report a bug](../../issues/new?labels=bug&template=bug_report.md)
- [Request a feature](../../issues/new?labels=enhancement&template=feature_request.md)
- [Website](https://trysoup.dev) · [mukhamedjankydyrli@gmail.com](mailto:mukhamedjankydyrli@gmail.com)

## License

MIT — see [LICENSE](LICENSE).
