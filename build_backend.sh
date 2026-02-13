#!/bin/bash

# Simple build script with threading error handling
set -e

echo "=========================================="
echo "GRP Backend Docker Build Script"
echo "=========================================="
echo ""

# Check if running as root/sudo
if [ "$EUID" -ne 0 ]; then 
    echo "Please run with sudo: sudo ./build_backend.sh"
    exit 1
fi

cd "$(dirname "$0")"

echo "Current directory: $(pwd)"
echo "Current thread limit: $(ulimit -u)"
echo ""

# Stop and remove existing container
echo "1. Cleaning up existing containers..."
docker-compose stop backend 2>/dev/null || true
docker-compose rm -f backend 2>/dev/null || true

# Remove existing image to force rebuild
echo "2. Removing old images..."
docker rmi grp_quotation_generator_backend 2>/dev/null || true
docker rmi grp_quotation_generator-backend 2>/dev/null || true

echo ""
echo "3. Attempting to build backend..."
echo "   (This may take 3-5 minutes)"
echo ""

# Temporarily increase thread limit
ORIGINAL_ULIMIT=$(ulimit -u)
echo "   - Increasing thread limit to 4096..."
ulimit -u 4096 2>/dev/null || echo "   Warning: Could not increase thread limit"

# Build with error handling
if docker-compose build --no-cache backend; then
    echo ""
    echo "✓ Build completed successfully!"
    BUILD_SUCCESS=true
else
    echo ""
    echo "✗ Build failed!"
    BUILD_SUCCESS=false
fi

# Restore original limit
ulimit -u $ORIGINAL_ULIMIT 2>/dev/null || true

if [ "$BUILD_SUCCESS" = false ]; then
    echo ""
    echo "Troubleshooting suggestions:"
    echo "1. Check if you have enough free memory: free -h"
    echo "2. Increase system thread limits: ulimit -u 8192"
    echo "3. Restart Docker: sudo systemctl restart docker"
    echo "4. See THREADING_ERROR_FIX.md for more solutions"
    exit 1
fi

echo ""
echo "4. Starting backend container..."
docker-compose up -d backend

echo ""
echo "5. Waiting 10 seconds for startup..."
sleep 10

echo ""
echo "6. Checking container status..."
if docker ps | grep -q grp_backend; then
    echo "✓ Container is running"
    docker ps | grep grp_backend
else
    echo "✗ Container is not running"
    echo "Checking logs:"
    docker logs grp_backend
    exit 1
fi

echo ""
echo "7. Testing API connectivity..."
sleep 2

if curl -sf http://localhost:8000/ > /dev/null 2>&1; then
    echo "✓ API is responding!"
    echo "Response: $(curl -s http://localhost:8000/)"
elif curl -sf http://192.168.0.10:8000/ > /dev/null 2>&1; then
    echo "✓ API is responding!"
    echo "Response: $(curl -s http://192.168.0.10:8000/)"
else
    echo "⚠ API not responding yet (may still be starting)"
    echo "Check logs: sudo docker logs grp_backend"
fi

echo ""
echo "=========================================="
echo "Build complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  - Test backend: http://192.168.0.10:8000/"
echo "  - Test frontend: http://192.168.0.10:3000/"
echo "  - View logs: sudo docker logs -f grp_backend"
echo ""
