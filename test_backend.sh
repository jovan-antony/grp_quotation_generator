#!/bin/bash

SERVER_IP=${SERVER_IP:-localhost}

echo "=== Testing Backend Connectivity ==="
echo ""

echo "1. Testing root endpoint (/):"
curl -v http://${SERVER_IP}:8000/ 2>&1 | grep -E "HTTP|status|message|Connection"
echo ""

echo "2. Testing health endpoint (/health):"
curl -v http://${SERVER_IP}:8000/health 2>&1 | grep -E "HTTP|status|Connection"
echo ""

echo "3. Testing API endpoint (/api/companies):"
curl -v http://${SERVER_IP}:8000/api/companies 2>&1 | head -20
echo ""

echo "4. Checking if backend container is running:"
docker ps | grep grp_backend
echo ""

echo "5. Checking backend container logs (last 50 lines):"
docker logs --tail 50 grp_backend
echo ""

echo "6. Testing if port 8000 is listening:"
netstat -tlnp 2>/dev/null | grep :8000 || ss -tlnp | grep :8000
echo ""

echo "=== Diagnostic complete ==="
