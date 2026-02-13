#!/bin/bash

echo "=== Rebuilding and Restarting Backend with CORS Fix ==="
echo ""

echo "Checking system thread limits..."
ulimit -u
echo ""

echo "1. Stopping backend container..."
docker-compose stop backend

echo "2. Removing old backend container..."
docker-compose rm -f backend

echo "3. Rebuilding backend image..."
echo "   (This may take a few minutes on systems with threading constraints)"

# Try building with default Dockerfile
if docker-compose build --no-cache backend 2>&1 | tee /tmp/docker_build.log; then
    echo "✓ Build successful with default Dockerfile"
else
    echo "✗ Build failed. Checking error..."
    if grep -q "can't start new thread" /tmp/docker_build.log; then
        echo ""
        echo "Threading error detected. Trying alternative build methods..."
        echo ""
        
        # Method 1: Increase thread limits temporarily
        echo "Attempting Method 1: Increasing system thread limits..."
        ORIGINAL_ULIMIT=$(ulimit -u)
        ulimit -u 4096 2>/dev/null
        
        if docker-compose build --no-cache backend; then
            echo "✓ Build successful with increased thread limit"
            ulimit -u $ORIGINAL_ULIMIT 2>/dev/null
        else
            ulimit -u $ORIGINAL_ULIMIT 2>/dev/null
            
            # Method 2: Use simpler Dockerfile
            echo ""
            echo "Attempting Method 2: Using simplified Dockerfile..."
            if [ -f "server/Dockerfile.simple" ]; then
                mv server/Dockerfile server/Dockerfile.original
                cp server/Dockerfile.simple server/Dockerfile
                
                if docker-compose build --no-cache backend; then
                    echo "✓ Build successful with simplified Dockerfile"
                else
                    # Restore original
                    mv server/Dockerfile.original server/Dockerfile
                    echo "✗ Build still failed. Manual intervention required."
                    exit 1
                fi
            fi
        fi
    else
        echo "Build failed with different error. Check logs above."
        exit 1
    fi
fi

echo ""
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
if curl -s http://localhost:8000/ > /dev/null 2>&1; then
    echo "✓ Backend is responding!"
    curl -s http://localhost:8000/
elif curl -s http://192.168.0.10:8000/ > /dev/null 2>&1; then
    echo "✓ Backend is responding!"
    curl -s http://192.168.0.10:8000/
else
    echo "✗ Backend not responding. Check logs above."
fi

echo ""
echo "=== Backend restart complete ==="
echo "Test the frontend now at: http://192.168.0.10:3000"
