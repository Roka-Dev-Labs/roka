# Roka — Installation Guide

Matches the flows on [roka-prune.com/install.html](https://trysoup.dev/install.html).

## One-line CLI install (recommended)

```bash
curl -fsSL https://install.trysoup.dev | bash
```

Auto-detects OS and architecture, downloads the latest binary, verifies checksum, and installs to `~/.local/bin` (no sudo).

Supported: **macOS** (Intel + Apple Silicon), **Linux** (x86_64 + ARM64), **Windows** (WSL2).

---

## Manual installation

Download the binary for your platform from [GitHub Releases](https://github.com/Roka-Dev-Labs/roka/releases), then:

```bash
# decompress
gunzip roka-<platform>.gz

# make executable and move to PATH
chmod +x roka-<platform>
mv roka-<platform> ~/.local/bin/roka
```

### Platform names

| Platform | File |
|----------|------|
| macOS (Apple Silicon) | `roka-darwin-arm64.gz` |
| macOS (Intel) | `roka-darwin-amd64.gz` |
| Linux (x86_64) | `roka-linux-amd64.gz` |
| Linux (ARM64) | `roka-linux-arm64.gz` |

---

## PATH setup

If `roka` is not found after install, add `~/.local/bin` to your PATH:

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

---

## Verify + first prune

```bash
roka --version
cat your-log.log | roka prune --query "what broke" --budget 8000
```

---

## Connect MCP to your AI agent

MCP is free. The `roka-mcp` package is published on npm; `connect` / `serve` / `watch` need no API key.

```bash
npx roka-mcp connect --agent claude-code
npx roka-mcp connect --agent cursor
npx roka-mcp connect --agent codex
npx roka-mcp connect --agent copilot
```

Restart the IDE after connect.

Watch mode:

```bash
npx roka-mcp watch ./logs/dev.log --on-crash
```

Docs: [trysoup.dev/docs](https://trysoup.dev/docs/) · [Install page MCP section](https://trysoup.dev/install.html#mcp).
