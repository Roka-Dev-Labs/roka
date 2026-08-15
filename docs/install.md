# Install the CLI

The CLI is the Free cold start: prune locally, no API key. MCP agent connect is a separate Pro step.

## One-line install (recommended)

```bash
curl -fsSL https://install.roka-prune.com | bash
roka --version
```

The script auto-detects OS and architecture, downloads the latest binary, verifies the checksum, and installs to `~/.local/bin` (no sudo).

Supported: **macOS** (Intel + Apple Silicon), **Linux** (x86_64 + ARM64), **Windows** (WSL2).

## PATH

If `roka` is not found after install:

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

## Manual install

Download the matching asset from [GitHub Releases](https://github.com/Roka-Dev-Labs/roka/releases):

| Platform | File |
| --- | --- |
| macOS Apple Silicon | roka-darwin-arm64.gz |
| macOS Intel | roka-darwin-amd64.gz |
| Linux x86_64 | roka-linux-amd64.gz |
| Linux ARM64 | roka-linux-arm64.gz |

```bash
gunzip roka-<platform>.gz
chmod +x roka-<platform>
mv roka-<platform> ~/.local/bin/roka
```

## Verify

```bash
roka --version
cat your-log.log | roka prune --query "what broke" --budget 8000
```
