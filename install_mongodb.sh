#!/usr/bin/env bash
set -Eeuo pipefail

MONGODB_MAJOR="${MONGODB_MAJOR:-7.0}"

log() {
  printf '[mongodb] %s\n' "$1"
}

die() {
  printf '[mongodb] ERROR: %s\n' "$1" >&2
  exit 1
}

[[ "${EUID}" -eq 0 ]] || SUDO="sudo"
SUDO="${SUDO:-}"

source /etc/os-release

case "${ID_LIKE:-$ID}" in
  *debian*|*ubuntu*)
    command -v apt-get >/dev/null 2>&1 || die "apt-get is required for Debian-family systems."
    command -v gpg >/dev/null 2>&1 || {
      ${SUDO} apt-get update
      ${SUDO} apt-get install -y gnupg curl ca-certificates
    }
    ${SUDO} apt-get update
    ${SUDO} apt-get install -y gnupg curl ca-certificates
    ${SUDO} install -d -m 0755 /etc/apt/keyrings
    curl -fsSL "https://pgp.mongodb.com/server-${MONGODB_MAJOR}.asc" |
      gpg --dearmor |
      ${SUDO} tee "/etc/apt/keyrings/mongodb-server-${MONGODB_MAJOR}.gpg" >/dev/null
    ${SUDO} chmod 0644 "/etc/apt/keyrings/mongodb-server-${MONGODB_MAJOR}.gpg"

    distro_codename="${VERSION_CODENAME:-}"
    [[ -n "${distro_codename}" ]] || die "Could not determine distribution codename."
    repo_component="main"
    repo_family="debian"
    case "${ID}:${distro_codename}" in
      debian:bookworm|debian:bullseye) ;;
      ubuntu:focal|ubuntu:jammy)
        repo_family="ubuntu"
        repo_component="multiverse"
        ;;
      *) die "MongoDB ${MONGODB_MAJOR} does not support ${ID} codename ${distro_codename}."
          ;;
    esac

    printf 'deb [ signed-by=/etc/apt/keyrings/mongodb-server-%s.gpg ] https://repo.mongodb.org/apt/%s %s/mongodb-org/%s %s\n' \
      "${MONGODB_MAJOR}" "${repo_family}" "${distro_codename}" "${MONGODB_MAJOR}" "${repo_component}" |
      ${SUDO} tee "/etc/apt/sources.list.d/mongodb-org-${MONGODB_MAJOR}.list" >/dev/null
    ${SUDO} apt-get update
    ${SUDO} apt-get install -y mongodb-org
    ;;
  *rhel*|centos|rocky|almalinux)
    command -v dnf >/dev/null 2>&1 || command -v yum >/dev/null 2>&1 ||
      die "dnf or yum is required for RHEL-family systems."
    rhel_major="${VERSION_ID%%.*}"
    [[ "${rhel_major}" =~ ^[0-9]+$ ]] || die "Could not determine RHEL major version."
    repo_manager="dnf"
    command -v dnf >/dev/null 2>&1 || repo_manager="yum"
    ${SUDO} "${repo_manager}" install -y curl ca-certificates gnupg2
    curl -fsSL "https://pgp.mongodb.com/server-${MONGODB_MAJOR}.asc" |
      ${SUDO} rpm --import -
    ${SUDO} tee "/etc/yum.repos.d/mongodb-org-${MONGODB_MAJOR}.repo" >/dev/null <<EOF
[mongodb-org-${MONGODB_MAJOR}]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/${rhel_major}/mongodb-org/${MONGODB_MAJOR}/\$basearch/
gpgcheck=1
enabled=1
gpgkey=https://pgp.mongodb.com/server-${MONGODB_MAJOR}.asc
EOF
    ${SUDO} "${repo_manager}" install -y mongodb-org
    ;;
  *)
    die "Unsupported distribution: ${ID:-unknown}. Supported families: Debian/Ubuntu and RHEL-compatible distributions."
    ;;
esac

if command -v systemctl >/dev/null 2>&1; then
  ${SUDO} systemctl enable --now mongod
  ${SUDO} systemctl --no-pager --full status mongod
else
  log "systemd is unavailable; start MongoDB manually with: mongod --config /etc/mongod.conf"
fi

command -v mongod >/dev/null 2>&1 || die "MongoDB installation did not complete."
log "MongoDB: $(mongod --version | awk 'NR == 1 { print; exit }')"
