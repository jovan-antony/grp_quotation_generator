#!/bin/bash

# Safe frontend build script for thread-constrained Linux servers
set -e

cd "$(dirname "$0")"

echo "=============================================="
echo "GRP Frontend Safe Build"
echo "=============================================="

echo "Current thread limit: $(ulimit -u)"
ulimit -u 8192 2>/dev/null || true
echo "Updated thread limit: $(ulimit -u)"

export DOCKER_BUILDKIT=0

echo "\nBuilding frontend image with BuildKit disabled..."
if command -v docker-compose >/dev/null 2>&1; then
  docker-compose build --no-cache frontend
else
  docker compose build --no-cache frontend
fi

echo "\nStarting frontend container..."
if command -v docker-compose >/dev/null 2>&1; then
  docker-compose up -d frontend
else
  docker compose up -d frontend
fi

echo "\nFrontend build/start complete."
echo "Check logs: docker logs --tail 100 grp_frontend"
