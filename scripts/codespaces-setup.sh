#!/usr/bin/env bash
set -euo pipefail
node scripts/configure-local.mjs
npm ci
npm run db:setup
