#!/usr/bin/env bash
# Refreshes api.yaml from a running backbone-rest and regenerates the TypeScript types.
#   BACKBONE_BASE_URL=https://localhost:8084 scripts/sync-api.sh
set -euo pipefail
cd "$(dirname "$0")/.."
base="${BACKBONE_BASE_URL:-https://localhost:8084}"
curl -sfk "$base/v3/api-docs.yaml" -o api.yaml
pnpm run api:types
