#!/bin/bash

# Multi-strategy Docker build script for threading-constrained systems
# Tries multiple approaches to successfully build the backend

set +e  # Don't exit on error, we'll handle them

echo "=============================================="
echo "GRP Backend Multi-Strategy Build Script"
echo "=============================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run with sudo: sudo ./build_with_strategies.sh"
    exit 1
fi

cd "$(dirname "$0")"

echo "System Information:"
echo "  Current directory: $(pwd)"
echo "  Thread limit: $(ulimit -u)"
echo "  Free memory: $(free -h | grep Mem | awk '{print $4}')"
echo ""

# Cleanup function
cleanup() {
    echo "Cleaning up..."
    docker-compose stop backend 2>/dev/null || true
    docker-compose rm -f backend 2>/dev/null || true
    docker rmi grp_quotation_generator_backend grp_quotation_generator-backend 2>/dev/null || true
}

# Test function
test_backend() {
    echo "Starting backend container..."
    docker-compose up -d backend
    
    echo "Waiting 10 seconds for startup..."
    sleep 10
    
    if docker ps | grep -q grp_backend; then
        echo "✓ Container is running"
        
        # Test API
        if curl -sf http://localhost:8000/ > /dev/null 2>&1; then
            echo "✓ API is responding!"
            curl -s http://localhost:8000/
            return 0
        else
            echo "⚠ Container running but API not responding yet"
            echo "Check logs: docker logs grp_backend"
            return 1
        fi
    else
        echo "✗ Container failed to start"
        docker logs grp_backend 2>&1 | tail -20
        return 1
    fi
}

# Strategy 1: Increased thread limit + current Dockerfile
strategy1() {
    echo ""
    echo "=========================================="
    echo "STRATEGY 1: Increased Thread Limit"
    echo "=========================================="
    echo "Using current Dockerfile with ulimit increase"
    echo ""
    
    ORIGINAL_ULIMIT=$(ulimit -u)
    ulimit -u 8192 2>/dev/null || ulimit -u 4096 2>/dev/null || echo "Could not increase ulimit"
    
    echo "Building..."
    if docker-compose build --no-cache backend 2>&1 | tee /tmp/build.log; then
        ulimit -u $ORIGINAL_ULIMIT 2>/dev/null || true
        echo "✓ Strategy 1 succeeded!"
        return 0
    else
        ulimit -u $ORIGINAL_ULIMIT 2>/dev/null || true
        echo "✗ Strategy 1 failed"
        return 1
    fi
}

# Strategy 2: Build with increased Docker daemon resources
strategy2() {
    echo ""
    echo "=========================================="
    echo "STRATEGY 2: Docker Resource Limits"
    echo "=========================================="
    echo "Building with explicit resource limits"
    echo ""
    
    echo "Building with memory limits..."
    cd server
    if docker build \
        --no-cache \
        --memory=2g \
        --memory-swap=4g \
        --ulimit nproc=8192:16384 \
        -t grp_quotation_generator_backend:latest \
        . 2>&1 | tee /tmp/build2.log; then
        cd ..
        
        # Update docker-compose to use built image temporarily
        sed -i.bak 's|build: ./server|image: grp_quotation_generator_backend:latest|' docker-compose.yml
        
        echo "✓ Strategy 2 succeeded!"
        return 0
    else
        cd ..
        echo "✗ Strategy 2 failed"
        return 1
    fi
}

# Strategy 3: Use minimal Dockerfile
strategy3() {
    echo ""
    echo "=========================================="
    echo "STRATEGY 3: Minimal Dockerfile"
    echo "=========================================="
    echo "Using ultra-minimal Dockerfile"
    echo ""
    
    if [ ! -f "server/Dockerfile.minimal" ]; then
        echo "✗ Dockerfile.minimal not found"
        return 1
    fi
    
    # Backup and swap
    cp server/Dockerfile server/Dockerfile.original.bak
    cp server/Dockerfile.minimal server/Dockerfile
    
    echo "Building with minimal Dockerfile..."
    if docker-compose build --no-cache backend 2>&1 | tee /tmp/build3.log; then
        echo "✓ Strategy 3 succeeded!"
        return 0
    else
        # Restore original
        mv server/Dockerfile.original.bak server/Dockerfile
        echo "✗ Strategy 3 failed"
        return 1
    fi
}

# Strategy 4: Install packages on host and copy
strategy4() {
    echo ""
    echo "=========================================="
    echo "STRATEGY 4: Pre-installed Packages"
    echo "=========================================="
    echo "Installing packages locally first"
    echo ""
    
    # Create a virtual environment and install packages
    if command -v python3.11 &> /dev/null; then
        echo "Creating virtual environment..."
        python3.11 -m venv /tmp/grp_venv
        source /tmp/grp_venv/bin/activate
        
        echo "Installing packages in venv..."
        pip install --no-cache-dir -r server/requirements.txt
        
        # Create a Dockerfile that copies the venv
        cat > server/Dockerfile.venv << 'EOF'
FROM python:3.11-slim
ENV PYTHONUNBUFFERED=1
WORKDIR /app
COPY --from=venv /tmp/grp_venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
COPY . .
EXPOSE 8000
CMD ["uvicorn", "api_server:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
EOF
        
        deactivate
        
        cp server/Dockerfile server/Dockerfile.original.bak2
        cp server/Dockerfile.venv server/Dockerfile
        
        echo "Building with pre-installed packages..."
        if docker-compose build --no-cache backend 2>&1 | tee /tmp/build4.log; then
            echo "✓ Strategy 4 succeeded!"
            return 0
        else
            mv server/Dockerfile.original.bak2 server/Dockerfile
            echo "✗ Strategy 4 failed"
            return 1
        fi
    else
        echo "✗ Python 3.11 not found on host"
        return 1
    fi
}

# Main execution
echo "Starting multi-strategy build process..."
echo "This will try different approaches until one succeeds."
echo ""

cleanup

# Try strategies in order
if strategy1; then
    echo ""
    echo "SUCCESS: Built with Strategy 1"
    test_backend
    exit 0
fi

cleanup

if strategy2; then
    echo ""
    echo "SUCCESS: Built with Strategy 2"
    test_backend
    exit 0
fi

# Restore docker-compose if modified
if [ -f "docker-compose.yml.bak" ]; then
    mv docker-compose.yml.bak docker-compose.yml
fi

cleanup

if strategy3; then
    echo ""
    echo "SUCCESS: Built with Strategy 3"
    test_backend
    exit 0
fi

cleanup

if strategy4; then
    echo ""
    echo "SUCCESS: Built with Strategy 4"
    test_backend
    exit 0
fi

# All strategies failed
echo ""
echo "=============================================="
echo "ALL STRATEGIES FAILED"
echo "=============================================="
echo ""
echo "None of the automated strategies worked."
echo "This suggests a severe system resource constraint."
echo ""
echo "Manual steps to try:"
echo "1. Increase system limits permanently:"
echo "   sudo nano /etc/security/limits.conf"
echo "   Add: * soft nproc 8192"
echo "        * hard nproc 16384"
echo ""
echo "2. Restart Docker daemon:"
echo "   sudo systemctl restart docker"
echo ""
echo "3. Free up system resources:"
echo "   - Stop unnecessary services"
echo "   - Clear Docker cache: docker system prune -a"
echo "   - Reboot if possible"
echo ""
echo "4. Consider building on another machine and transferring:"
echo "   docker save grp_quotation_generator_backend > backend.tar"
echo "   # Transfer to server"
echo "   docker load < backend.tar"
echo ""
exit 1
