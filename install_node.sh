#!/usr/bin/env bash
set -Eeuo pipefail

NODE_MAJOR="${NODE_MAJOR:-20}"

log() {
  printf '[node] %s\n' "$1"
}

die() {
  printf '[node] ERROR: %s\n' "$1" >&2
  exit 1
}

[[ "${EUID}" -eq 0 ]] || SUDO="sudo"
SUDO="${SUDO:-}"

command -v curl >/dev/null 2>&1 || {
  if command -v apt-get >/dev/null 2>&1; then
    ${SUDO} apt-get update
    ${SUDO} apt-get install -y curl ca-certificates
  elif command -v dnf >/dev/null 2>&1; then
    ${SUDO} dnf install -y curl ca-certificates
  elif command -v yum >/dev/null 2>&1; then
    ${SUDO} yum install -y curl ca-certificates
  else
    die "No supported package manager found."
  fi
}

source /etc/os-release

case "${ID_LIKE:-$ID}" in
  *debian*|*ubuntu*)
    log "Installing Node.js ${NODE_MAJOR} on ${PRETTY_NAME}..."
    ${SUDO} apt-get update
    ${SUDO} apt-get install -y ca-certificates curl gnupg
    ${SUDO} install -d -m 0755 /etc/apt/keyrings
    curl -fsSL "https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key" |
      gpg --dearmor |
      ${SUDO} tee /etc/apt/keyrings/nodesource.gpg >/dev/null
    ${SUDO} chmod 0644 /etc/apt/keyrings/nodesource.gpg
    printf 'deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_%s.x nodistro main\n' \
      "${NODE_MAJOR}" |
      ${SUDO} tee /etc/apt/sources.list.d/nodesource.list >/dev/null
    ${SUDO} apt-get update
    ${SUDO} apt-get install -y nodejs
    ;;
  *rhel*|*fedora*|centos|rocky|almalinux)
    log "Installing Node.js ${NODE_MAJOR} on ${PRETTY_NAME}..."
    if command -v dnf >/dev/null 2>&1; then
      ${SUDO} dnf install -y curl ca-certificates
    else
      ${SUDO} yum install -y curl ca-certificates
    fi
    curl -fsSL "https://rpm.nodesource.com/setup_${NODE_MAJOR}.x" |
      ${SUDO} bash -
    if command -v dnf >/dev/null 2>&1; then
      ${SUDO} dnf install -y nodejs
    else
      ${SUDO} yum install -y nodejs
    fi
    ;;
  *)
    die "Unsupported distribution: ${ID:-unknown}. Supported families: Debian/Ubuntu and RHEL/Fedora."
    ;;
esac

command -v node >/dev/null 2>&1 || die "Node.js installation did not complete."
command -v npm >/dev/null 2>&1 || die "npm installation did not complete."
log "Node.js: $(node --version)"
log "npm: $(npm --version)"
