#!/usr/bin/env bash
#
# Roka Installer
# Served via: curl -fsSL https://install.roka-prune.com | bash
# Also: curl -fsSL https://raw.githubusercontent.com/Roka-Dev-Labs/roka/main/install.sh | bash
#
# Supports: Linux (amd64, arm64) · macOS (amd64, arm64)
# Override version: ROKA_VERSION=v1.2.3 curl -fsSL https://install.roka-prune.com | bash
#
set -euo pipefail

# ── Configuration ────────────────────────────────────────────────────────────
REPO="Roka-Dev-Labs/roka"
BINARY_NAME="roka"
GITHUB_API="https://api.github.com/repos/${REPO}/releases/latest"

# Install to ~/.local/bin by default (no sudo needed).
# Set ROKA_INSTALL_DIR=/usr/local/bin to override.
INSTALL_DIR="${ROKA_INSTALL_DIR:-$HOME/.local/bin}"

# ── Colors ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

# ── Helpers ───────────────────────────────────────────────────────────────────
info()    { echo -e "${GREEN}  ➜${NC}  $*"; }
success() { echo -e "${GREEN}  ✓${NC}  $*"; }
warn()    { echo -e "${YELLOW}  ⚠${NC}  $*"; }
die()     { echo -e "${RED}  ✗${NC}  $*" >&2; exit 1; }

# ── Cleanup trap ─────────────────────────────────────────────────────────────
TEMP_DIR=""
cleanup() {
  [[ -n "${TEMP_DIR}" && -d "${TEMP_DIR}" ]] && rm -rf "${TEMP_DIR}"
}
trap cleanup EXIT INT TERM

# ── Banner ────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BLUE}${BOLD}  ╔══════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}${BOLD}  ║${NC}           ${BOLD}Roka CLI Installer${NC}                ${BLUE}${BOLD}║${NC}"
echo -e "${BLUE}${BOLD}  ║${NC}   ${DIM}Intelligent log pruning for humans${NC}         ${BLUE}${BOLD}║${NC}"
echo -e "${BLUE}${BOLD}  ╚══════════════════════════════════════════════╝${NC}"
echo ""

# ── Detect OS ────────────────────────────────────────────────────────────────
info "Detecting operating system..."
_uname_s="$(uname -s)"
case "${_uname_s}" in
  Linux*)   OS="linux"  ;;
  Darwin*)  OS="darwin" ;;
  MINGW*|MSYS*|CYGWIN*)
    die "Windows is not supported. Use WSL or download manually:\n  https://github.com/${REPO}/releases"
    ;;
  *)
    die "Unsupported OS: ${_uname_s}"
    ;;
esac
success "OS: ${BOLD}${OS}${NC}"

# ── Detect Architecture ───────────────────────────────────────────────────────
info "Detecting processor architecture..."
_uname_m="$(uname -m)"
case "${_uname_m}" in
  x86_64|amd64)      ARCH="amd64"  ;;
  aarch64|arm64)     ARCH="arm64"  ;;
  i386|i686)
    die "32-bit systems are not supported. Download manually:\n  https://github.com/${REPO}/releases"
    ;;
  *)
    die "Unsupported architecture: ${_uname_m}"
    ;;
esac
success "Architecture: ${BOLD}${ARCH}${NC}"

# ── Resolve version ───────────────────────────────────────────────────────────
TARGET_VERSION="${ROKA_VERSION:-}"

if [[ -z "${TARGET_VERSION}" ]]; then
  info "Fetching latest release from GitHub..."
  if TARGET_VERSION="$(curl -fsSL --connect-timeout 10 --max-time 15 "${GITHUB_API}" \
        2>/dev/null | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')"; \
     [[ -n "${TARGET_VERSION}" ]]; then
    success "Latest version: ${BOLD}${TARGET_VERSION}${NC}"
  else
    warn "Could not fetch latest version tag — falling back to /latest redirect"
    TARGET_VERSION="__latest__"
  fi
else
  success "Using pinned version: ${BOLD}${TARGET_VERSION}${NC}"
fi

# ── Build download URL ────────────────────────────────────────────────────────
# Release assets are gzip-compressed to stay under GitHub's 2 GB limit.
BINARY_FILE="${BINARY_NAME}-${OS}-${ARCH}.gz"
BINARY_FILE_PLAIN="${BINARY_NAME}-${OS}-${ARCH}"

if [[ "${TARGET_VERSION}" == "__latest__" ]]; then
  DOWNLOAD_URL="https://github.com/${REPO}/releases/latest/download/${BINARY_FILE}"
else
  DOWNLOAD_URL="https://github.com/${REPO}/releases/download/${TARGET_VERSION}/${BINARY_FILE}"
fi

info "Binary target : ${BOLD}${BINARY_FILE_PLAIN}${NC}"
info "Download URL  : ${DIM}${DOWNLOAD_URL}${NC}"

# ── Download ──────────────────────────────────────────────────────────────────
TEMP_DIR="$(mktemp -d)"
TEMP_GZ="${TEMP_DIR}/${BINARY_FILE}"
TEMP_BIN="${TEMP_DIR}/${BINARY_NAME}"

info "Downloading binary..."
if ! curl -fSL --connect-timeout 15 --max-time 300 --progress-bar \
     "${DOWNLOAD_URL}" -o "${TEMP_GZ}"; then
  echo ""
  die "Download failed. Please verify:\n  1. A release exists: https://github.com/${REPO}/releases\n  2. Asset '${BINARY_FILE}' is attached to the release\n  3. Your internet connection is stable"
fi
success "Download complete"

# ── Decompress ────────────────────────────────────────────────────────────────
info "Decompressing..."
if ! gunzip -c "${TEMP_GZ}" > "${TEMP_BIN}"; then
  die "Decompression failed"
fi
success "Decompressed"

# ── Verify SHA256 checksum ────────────────────────────────────────────────────
info "Verifying checksum..."

SUMS_URL=""
if [[ "${TARGET_VERSION}" == "__latest__" ]]; then
  SUMS_URL="https://github.com/${REPO}/releases/latest/download/SHA256SUMS.txt"
else
  SUMS_URL="https://github.com/${REPO}/releases/download/${TARGET_VERSION}/SHA256SUMS.txt"
fi

TEMP_SUMS="${TEMP_DIR}/SHA256SUMS.txt"
if curl -fsSL --connect-timeout 10 --max-time 30 "${SUMS_URL}" -o "${TEMP_SUMS}" 2>/dev/null; then
  # Extract expected checksum for the .gz file
  EXPECTED_SUM="$(grep "${BINARY_FILE}$" "${TEMP_SUMS}" 2>/dev/null | awk '{print $1}')"

  if [[ -n "${EXPECTED_SUM}" ]]; then
    # Compute actual checksum of the downloaded .gz
    if command -v sha256sum &>/dev/null; then
      ACTUAL_SUM="$(sha256sum "${TEMP_GZ}" | awk '{print $1}')"
    elif command -v shasum &>/dev/null; then
      ACTUAL_SUM="$(shasum -a 256 "${TEMP_GZ}" | awk '{print $1}')"
    else
      warn "No sha256 tool found — skipping checksum verification"
      ACTUAL_SUM="${EXPECTED_SUM}"
    fi

    if [[ "${ACTUAL_SUM}" != "${EXPECTED_SUM}" ]]; then
      die "Checksum mismatch!\n  Expected: ${EXPECTED_SUM}\n  Got:      ${ACTUAL_SUM}\n\nThe downloaded file may be corrupted or tampered with. Aborting."
    fi
    success "Checksum verified"
  else
    warn "No checksum entry found for ${BINARY_FILE} — skipping verification"
  fi
else
  warn "Could not fetch SHA256SUMS.txt — skipping checksum verification"
fi

# ── Validate binary ───────────────────────────────────────────────────────────
if [[ ! -f "${TEMP_BIN}" ]]; then
  die "Binary not found at ${TEMP_BIN}"
fi

# cross-platform file size check (macOS uses -f%z, Linux uses -c%s)
_file_size="$(stat -f%z "${TEMP_BIN}" 2>/dev/null || stat -c%s "${TEMP_BIN}" 2>/dev/null || echo 0)"
if (( _file_size < 1024 )); then
  die "Decompressed file is suspiciously small (${_file_size} bytes)."
fi

chmod +x "${TEMP_BIN}"

# ── Install ───────────────────────────────────────────────────────────────────
info "Installing to ${INSTALL_DIR}/${BINARY_NAME}..."

# Ensure install directory exists (always writable since it's under $HOME)
mkdir -p "${INSTALL_DIR}"

# Add to PATH in shell profiles if not already present
_add_to_path() {
  local shell_rc="$1"
  local export_line='export PATH="$HOME/.local/bin:$PATH"'
  if [[ -f "${shell_rc}" ]] && ! grep -qF '.local/bin' "${shell_rc}" 2>/dev/null; then
    echo "" >> "${shell_rc}"
    echo "# Added by Roka installer" >> "${shell_rc}"
    echo "${export_line}" >> "${shell_rc}"
  fi
}

if mv "${TEMP_BIN}" "${INSTALL_DIR}/${BINARY_NAME}"; then
  chmod +x "${INSTALL_DIR}/${BINARY_NAME}"
  success "Installed to ${INSTALL_DIR}/${BINARY_NAME} (no password required)"

  # Only patch PATH if we installed to the default ~/.local/bin
  if [[ "${INSTALL_DIR}" == "$HOME/.local/bin" ]]; then
    _add_to_path "$HOME/.zshrc"
    _add_to_path "$HOME/.bashrc"
    _add_to_path "$HOME/.bash_profile"
    # Make it available in the current session too
    export PATH="${INSTALL_DIR}:${PATH}"
  fi
else
  die "Installation failed.\n  Try: mv ${TEMP_BIN} ${INSTALL_DIR}/${BINARY_NAME}"
fi

# ── Verify ────────────────────────────────────────────────────────────────────
echo ""
info "Verifying installation..."
if command -v "${BINARY_NAME}" &>/dev/null; then
  _installed_path="$(command -v "${BINARY_NAME}")"
  success "${BINARY_NAME} found at ${BOLD}${_installed_path}${NC}"

  # Print version if the binary responds to --version
  _version_output="$("${BINARY_NAME}" --version 2>/dev/null || true)"
  [[ -n "${_version_output}" ]] && echo -e "  ${DIM}${_version_output}${NC}"

  echo ""
  echo -e "${BLUE}  ──────────────────────────────────────────────────${NC}"
  echo -e "${GREEN}${BOLD}    ✓  Installation complete!${NC}"
  echo -e "${BLUE}  ──────────────────────────────────────────────────${NC}"
  echo ""
  echo -e "${YELLOW}  Quick start:${NC}"
  echo -e "    ${BOLD}roka --help${NC}"
  echo -e "    ${BOLD}cat your-app.log | roka prune --query 'what broke' --budget 8000${NC}"
  echo ""
  echo -e "${YELLOW}  Docs & releases:${NC}"
  echo -e "    ${DIM}https://github.com/${REPO}${NC}"
  echo ""
else
  warn "${INSTALL_DIR} may not be in your \$PATH."
  warn "Add this line to your shell profile, then restart your terminal:"
  echo ""
  echo -e "    export PATH=\"${INSTALL_DIR}:\$PATH\""
  echo ""
  die "Installation verification failed — binary is installed but not reachable in PATH"
fi
