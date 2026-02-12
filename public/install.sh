#!/usr/bin/env bash
# ============================================================================
# ChipOS Universal Linux Installer
#
# Auto-detects architecture and installs the correct .deb package.
#
# Usage:
#   curl -fsSL https://futureatoms.com/install.sh | bash
#
# Options (via environment variables):
#   CHIPOS_ARCH=amd64|arm64    Override architecture detection
#   CHIPOS_VERSION=1.0.1       Install a specific version (default: latest)
#   DRY_RUN=1                  Print what would be done without installing
#
# ============================================================================
set -euo pipefail

# --- Configuration ----------------------------------------------------------
BASE_URL="https://futureatoms.com"
VERSION="${CHIPOS_VERSION:-latest}"

# --- Colors -----------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

info()  { echo -e "${BLUE}[INFO]${NC}  $*"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
err()   { echo -e "${RED}[ERROR]${NC} $*" >&2; }

# --- Banner -----------------------------------------------------------------
echo ""
echo -e "${CYAN}"
echo "   _____ _     _       ___  ____  "
echo "  / ____| |   (_)     / _ \\/ ___| "
echo " | |    | |__  _ _ __| | | \\___ \\ "
echo " | |    | '_ \\| | '_ \\ | | |___) |"
echo " | |____| | | | | |_) | |_| |____/ "
echo "  \\_____|_| |_|_| .__/ \\___/|_____| "
echo "                 |_|                  "
echo -e "${NC}"
echo -e "${CYAN}  Universal Linux Installer${NC}"
echo ""

# --- Architecture detection -------------------------------------------------
detect_arch() {
  if [ -n "${CHIPOS_ARCH:-}" ]; then
    echo "$CHIPOS_ARCH"
    return
  fi

  local machine
  machine=$(uname -m)
  case "$machine" in
    x86_64|amd64)    echo "amd64" ;;
    aarch64|arm64)   echo "arm64" ;;
    *)
      err "Unsupported architecture: $machine"
      err "ChipOS supports x86_64 (amd64) and aarch64 (arm64)."
      exit 1
      ;;
  esac
}

# --- Package manager detection ----------------------------------------------
detect_package_manager() {
  if command -v dpkg >/dev/null 2>&1 && command -v apt-get >/dev/null 2>&1; then
    echo "apt"
  elif command -v dnf >/dev/null 2>&1; then
    echo "dnf"
  elif command -v yum >/dev/null 2>&1; then
    echo "yum"
  else
    echo "unknown"
  fi
}

# --- Root / sudo detection --------------------------------------------------
setup_sudo() {
  if [ "$(id -u)" -eq 0 ]; then
    SUDO=""
  elif command -v sudo >/dev/null 2>&1; then
    SUDO="sudo"
  else
    err "This script requires root privileges. Run with sudo or as root."
    exit 1
  fi
}

# --- Install dependencies for non-apt systems ------------------------------
install_deps_if_needed() {
  local pkg_mgr="$1"
  case "$pkg_mgr" in
    apt)
      # dpkg -i + apt-get install -f handles deps automatically
      return 0
      ;;
    dnf)
      info "Installing dependencies via dnf..."
      $SUDO dnf install -y \
        nss gtk3 libXScrnSaver alsa-lib mesa-libgbm \
        libnotify libsecret libxkbfile gnome-keyring
      ;;
    yum)
      info "Installing dependencies via yum..."
      $SUDO yum install -y \
        nss gtk3 libXScrnSaver alsa-lib mesa-libgbm \
        libnotify libsecret libxkbfile gnome-keyring
      ;;
  esac
}

# --- Main -------------------------------------------------------------------
ARCH=$(detect_arch)
PKG_MGR=$(detect_package_manager)

info "Detected architecture: ${ARCH}"
info "Package manager: ${PKG_MGR}"

if [ "$PKG_MGR" = "unknown" ]; then
  err "No supported package manager found (apt, dnf, yum)."
  err "ChipOS provides .deb packages for Debian/Ubuntu-based systems."
  err ""
  err "Manual install (Debian/Ubuntu):"
  err "  wget ${BASE_URL}/chipos_latest_${ARCH}.deb"
  err "  sudo dpkg -i chipos_*.deb && sudo apt-get install -f"
  exit 1
fi

# Build download URL
if [ "$VERSION" = "latest" ]; then
  DEB_URL="${BASE_URL}/chipos_latest_${ARCH}.deb"
  DEB_FILE="chipos_latest_${ARCH}.deb"
else
  DEB_URL="${BASE_URL}/chipos_${VERSION}_${ARCH}.deb"
  DEB_FILE="chipos_${VERSION}_${ARCH}.deb"
fi

info "Download URL: ${DEB_URL}"

# Dry run mode
if [ "${DRY_RUN:-0}" = "1" ]; then
  echo ""
  info "Dry run mode — would execute:"
  echo "  1. Download: $DEB_URL"
  echo "  2. Install:  sudo dpkg -i $DEB_FILE"
  echo "  3. Fix deps: sudo apt-get install -f"
  echo "  4. Verify:   chipos --version"
  echo ""
  exit 0
fi

setup_sudo

# Download
TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT

info "Downloading ChipOS .deb package..."
if command -v wget >/dev/null 2>&1; then
  wget -q --show-progress -O "$TMPDIR/$DEB_FILE" "$DEB_URL"
elif command -v curl >/dev/null 2>&1; then
  curl -fSL --progress-bar -o "$TMPDIR/$DEB_FILE" "$DEB_URL"
else
  err "Neither wget nor curl found. Install one and retry."
  exit 1
fi

ok "Downloaded: $DEB_FILE"

# Verify download size
FILE_SIZE=$(stat -c%s "$TMPDIR/$DEB_FILE" 2>/dev/null || stat -f%z "$TMPDIR/$DEB_FILE")
if [ "$FILE_SIZE" -lt 1000000 ]; then
  err "Downloaded file is too small (${FILE_SIZE} bytes). The download may have failed."
  err "Try downloading manually: wget $DEB_URL"
  exit 1
fi

info "Package size: $((FILE_SIZE / 1024 / 1024)) MB"

# Install dependencies for non-apt systems
install_deps_if_needed "$PKG_MGR"

# Install
info "Installing ChipOS..."
if [ "$PKG_MGR" = "apt" ]; then
  $SUDO dpkg -i "$TMPDIR/$DEB_FILE" 2>/dev/null || true
  info "Resolving dependencies..."
  $SUDO apt-get install -f -y 2>/dev/null || {
    warn "Could not auto-resolve dependencies. Run manually:"
    warn "  sudo apt-get install -f"
  }
else
  # For RPM-based systems, extract and install manually
  # (Future: provide .rpm packages)
  warn "Non-apt system detected. Attempting alien conversion..."
  if command -v alien >/dev/null 2>&1; then
    $SUDO alien -i "$TMPDIR/$DEB_FILE"
  else
    err "Install 'alien' to convert .deb to your system's format,"
    err "or use a Debian/Ubuntu-based system."
    exit 1
  fi
fi

# Verify
echo ""
if command -v chipos >/dev/null 2>&1; then
  ok "ChipOS installed successfully!"
  echo ""
  echo -e "  ${GREEN}Launch:${NC}    chipos"
  echo -e "  ${GREEN}Version:${NC}   $(chipos --version 2>/dev/null || echo 'installed')"
else
  warn "ChipOS was installed but 'chipos' command not found in PATH."
  warn "Try launching from /usr/bin/chipos or your applications menu."
fi

echo ""
echo -e "${CYAN}Documentation:${NC} https://futureatoms.com/chipos-docs.html"
echo -e "${CYAN}Report issues:${NC} https://github.com/FutureAtoms/chipos-app-releases/issues"
echo ""
