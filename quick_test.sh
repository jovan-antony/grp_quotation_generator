#!/bin/bash
echo "=== Quick Backend Diagnostics ==="

echo -e "\n1. Backend container status:"
docker ps | grep grp_backend

echo -e "\n2. Backend logs (last 20 lines):"
docker logs --tail 20 grp_backend

echo -e "\n3. Testing backend health from host:"
curl -v http://192.168.0.10:8000/health 2>&1 | grep -E "HTTP|Access-Control"

echo -e "\n4. Testing backend /api/companies from host:"
curl -v http://192.168.0.10:8000/api/companies 2>&1 | grep -E "HTTP|Access-Control"

echo -e "\n5. Checking if backend is listening on port 8000:"
docker exec grp_backend netstat -tlnp 2>/dev/null | grep 8000 || docker exec grp_backend ss -tlnp 2>/dev/null | grep 8000

echo -e "\n6. Testing from inside frontend container:"
docker exec grp_frontend wget -qO- http://192.168.0.10:8000/health || echo "Frontend cannot reach backend"

echo -e "\nDone!"
