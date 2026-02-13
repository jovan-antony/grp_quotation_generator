#!/bin/bash

echo "=== Rebuilding and Restarting Backend with CORS Fix ==="
echo ""

echo "1. Stopping backend container..."
docker-compose stop backend

echo "2. Removing old backend container..."
docker-compose rm -f backend

echo "3. Rebuilding backend image..."
docker-compose build --no-cache backend

echo "4. Starting backend container..."
docker-compose up -d backend

echo "5. Waiting for backend to start (10 seconds)..."
sleep 10

echo "6. Checking backend status..."
docker ps | grep grp_backend

echo ""
echo "7. Checking backend logs..."
docker logs --tail 30 grp_backend

echo ""
echo "8. Testing backend connectivity..."
curl -s http://localhost:8000/ || curl -s http://192.168.0.10:8000/

echo ""
echo "=== Backend restart complete ==="
echo "Test the frontend now at: http://192.168.0.10:3000"
