#!/bin/bash
# Test script to check full stack connectivity

SERVER_IP=${SERVER_IP:-localhost}

echo -e "\n\033[1;36m=== Checking Docker Containers ===\033[0m"
docker ps

echo -e "\n\033[1;36m=== Testing Postgres Connection from Host ===\033[0m"
docker exec grp_postgres psql -U postgres -d grp_quotation_fresh -c "SELECT 'Database is accessible' as status;"

echo -e "\n\033[1;36m=== Testing Backend → Database Connection ===\033[0m"
docker exec grp_backend python -c "import psycopg2; conn = psycopg2.connect('postgresql://postgres:RdDpp2M47i@postgres:5432/grp_quotation_fresh'); print('✓ Backend can connect to database!'); conn.close()"

echo -e "\n\033[1;36m=== Testing Backend API from Host ===\033[0m"
echo "Testing http://localhost:8000/health"
curl -s http://localhost:8000/health
echo ""
echo "Testing http://${SERVER_IP}:8000/health (Frontend URL)"
curl -s http://${SERVER_IP}:8000/health

echo -e "\n\033[1;36m=== Testing Frontend → Backend Connection ===\033[0m"
docker exec grp_frontend sh -c "wget -qO- http://backend:8000/health || echo 'Frontend CANNOT reach backend!'"

echo -e "\n\033[1;36m=== Testing if Frontend is Running ===\033[0m"
echo "Testing http://localhost:3000"
curl -I http://localhost:3000 2>&1 | grep HTTP

echo -e "\n\033[1;36m=== Checking Backend Logs (last 30 lines) ===\033[0m"
docker logs --tail 30 grp_backend

echo -e "\n\033[1;36m=== Checking Frontend Logs (last 20 lines) ===\033[0m"
docker logs --tail 20 grp_frontend

echo -e "\n\033[1;36m=== Checking Postgres Logs (last 15 lines) ===\033[0m"
docker logs --tail 15 grp_postgres

echo -e "\n\033[1;36m=== Checking Database Tables ===\033[0m"
docker exec grp_postgres psql -U postgres -d grp_quotation_fresh -c "\dt"

echo -e "\n\033[1;32mDiagnostics complete!\033[0m"
echo -e "\n\033[1;33mConnection Flow:\033[0m"
echo -e "  Browser → Frontend (localhost:3000)"
echo -e "  Frontend → Backend API (backend:8000)"
echo -e "  Backend → Database (postgres:5432)"
