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

echo "\nBuilding frontend image with explicit low-resource limits..."
docker build \
  --no-cache \
  --memory=2g \
  --memory-swap=4g \
  --ulimit nproc=8192:16384 \
  -t grp_frontend:latest \
  ./client

echo "\nStarting frontend container..."
if command -v docker-compose >/dev/null 2>&1; then
  docker-compose up -d --no-build frontend
else
  docker compose up -d --no-build frontend
fi

echo "\nFrontend build/start complete."
echo "Check logs: docker logs --tail 100 grp_frontend"
