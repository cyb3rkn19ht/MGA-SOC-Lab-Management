#!/usr/bin/env bash
set -euo pipefail
if command -v node >/dev/null 2>&1; then
  node scripts/configure-local.mjs
else
  docker run --rm --user "$(id -u):$(id -g)" -v "$PWD:/workspace" -w /workspace node:24-bookworm-slim node scripts/configure-local.mjs
fi
