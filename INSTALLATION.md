# roka-cli — Installation Guide

## One-line install (recommended)

```bash
curl -fsSL https://install.roka-prune.com | bash
```

Auto-detects OS and architecture, downloads the latest binary, verifies checksum, and installs to `~/.local/bin`.

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

## Verify

```bash
roka --version
echo "test log line" | roka --query "error" --budget 100
```
