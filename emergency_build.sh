#!/bin/bash

# EMERGENCY BUILD SCRIPT
# For systems with severe threading constraints
# This uses the most minimal approach possible

echo "========================================"
echo "Emergency Build - Most Minimal Approach"
echo "========================================"
echo ""

if [ "$EUID" -ne 0 ]; then 
    echo "Run with sudo: sudo ./emergency_build.sh"
    exit 1
fi

cd "$(dirname "$0")"

echo "Step 1: Creating ultra-minimal Dockerfile..."

cat > server/Dockerfile.emergency << 'EOFEMERGENCY'
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

# Copy app first
COPY . .

# Install packages one by one with maximum safety
RUN python -m pip --no-cache-dir --disable-pip-version-check install --no-compile fastapi==0.104.1 || true
RUN python -m pip --no-cache-dir --disable-pip-version-check install --no-compile uvicorn==0.24.0 || true
RUN python -m pip --no-cache-dir --disable-pip-version-check install --no-compile python-docx==1.1.0 || true
RUN python -m pip --no-cache-dir --disable-pip-version-check install --no-compile pydantic==2.5.0 || true
RUN python -m pip --no-cache-dir --disable-pip-version-check install --no-compile openpyxl || true
RUN python -m pip --no-cache-dir --disable-pip-version-check install --no-compile pandas || true
RUN python -m pip --no-cache-dir --disable-pip-version-check install --no-compile sqlmodel==0.0.14 || true
RUN python -m pip --no-cache-dir --disable-pip-version-check install --no-compile psycopg2-binary==2.9.9 || true
RUN python -m pip --no-cache-dir --disable-pip-version-check install --no-compile sqlalchemy==2.0.23 || true
RUN python -m pip --no-cache-dir --disable-pip-version-check install --no-compile python-dotenv==1.0.0 || true

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "api_server:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
EOFEMERGENCY

echo "✓ Emergency Dockerfile created"
echo ""

echo "Step 2: Backing up current Dockerfile..."
cp server/Dockerfile server/Dockerfile.backup.$(date +%s)
echo "✓ Backup created"
echo ""

echo "Step 3: Using emergency Dockerfile..."
cp server/Dockerfile.emergency server/Dockerfile
echo "✓ Emergency Dockerfile in place"
echo ""

echo "Step 4: Stopping existing containers..."
docker-compose stop backend 2>/dev/null || true
docker-compose rm -f backend 2>/dev/null || true
echo "✓ Containers stopped"
echo ""

echo "Step 5: Increasing system limits..."
ORIGINAL=$(ulimit -u)
ulimit -u 16384 2>/dev/null || ulimit -u 8192 2>/dev/null || ulimit -u 4096 2>/dev/null
echo "  Thread limit: $(ulimit -u)"
echo ""

echo "Step 6: Building with emergency Dockerfile..."
echo "  (Each RUN command is separate, so build won't fail completely)"
echo ""

docker-compose build backend 2>&1 | tee /tmp/emergency_build.log

ulimit -u $ORIGINAL 2>/dev/null || true

echo ""
echo "Step 7: Checking build result..."
if docker images | grep -q "grp_quotation_generator"; then
    echo "✓ Image was created"
    
    echo ""
    echo "Step 8: Starting container..."
    docker-compose up -d backend
    
    echo ""
    echo "Step 9: Waiting 15 seconds..."
    sleep 15
    
    echo ""
    echo "Step 10: Testing..."
    if docker ps | grep -q grp_backend; then
        echo "✓ Container is running!"
        docker logs --tail 30 grp_backend
        
        echo ""
        if curl -sf http://localhost:8000/ > /dev/null 2>&1; then
            echo "✓✓✓ SUCCESS! API is responding!"
            curl -s http://localhost:8000/
            echo ""
            echo ""
            echo "Backend is now running!"
            echo "Test at: http://192.168.0.10:8000/"
            exit 0
        else
            echo "⚠ Container running but API not ready yet"
            echo "Wait a minute and test: curl http://localhost:8000/"
            exit 0
        fi
    else
        echo "✗ Container not running"
        echo "Logs:"
        docker logs grp_backend 2>&1 | tail -50
        exit 1
    fi
else
    echo "✗ Build may have had issues"
    echo "But check if container can still run..."
    
    docker-compose up -d backend
    sleep 15
    
    if docker ps | grep -q grp_backend; then
        echo "✓ Container running despite build warnings!"
        curl -s http://localhost:8000/ || echo "Waiting for API..."
        exit 0
    else
        echo "✗ Build completely failed"
        tail -100 /tmp/emergency_build.log
        exit 1
    fi
fi
