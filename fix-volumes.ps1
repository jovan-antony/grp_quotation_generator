# Fix Docker Volume Credential Conflict
# This script removes old volumes and recreates them with new credentials

Write-Host "=" -NoNewline
Write-Host ("=" * 70)
Write-Host "Fixing Docker Volume Credential Conflict" -ForegroundColor Cyan
Write-Host ("=" * 70)
Write-Host ""

# Step 1: Stop and remove containers
Write-Host "Step 1: Stopping containers..." -ForegroundColor Yellow
docker compose down
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error stopping containers. Trying alternative command..." -ForegroundColor Red
    docker-compose down
}
Write-Host "✓ Containers stopped" -ForegroundColor Green
Write-Host ""

# Step 2: Remove old volumes with incorrect credentials
Write-Host "Step 2: Removing old volumes with incorrect credentials..." -ForegroundColor Yellow
$volumes = @(
    "grp_quotation_generator_grp_quotations",
    "grp_quotation_generator_grp_pipeco_quotations", 
    "grp_quotation_generator_colex_quotations"
)

foreach ($vol in $volumes) {
    Write-Host "  Removing volume: $vol" -ForegroundColor Gray
    docker volume rm $vol 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "    ✓ Removed $vol" -ForegroundColor Green
    } else {
        Write-Host "    ℹ Volume $vol doesn't exist or already removed" -ForegroundColor Gray
    }
}
Write-Host ""

# Step 3: List remaining volumes (optional verification)
Write-Host "Step 3: Current Docker volumes:" -ForegroundColor Yellow
docker volume ls | Select-String "grp_quotation"
Write-Host ""

# Step 4: Rebuild and start with new configuration
Write-Host "Step 4: Starting containers with updated credentials..." -ForegroundColor Yellow
docker compose up -d --build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error starting containers. Trying alternative command..." -ForegroundColor Red
    docker-compose up -d --build
}
Write-Host ""

# Step 5: Verify containers are running
Write-Host "Step 5: Verifying containers..." -ForegroundColor Yellow
docker compose ps
if ($LASTEXITCODE -ne 0) {
    docker-compose ps
}
Write-Host ""

Write-Host ("=" * 70)
Write-Host "✓ Setup Complete!" -ForegroundColor Green
Write-Host ("=" * 70)
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Test frontend: http://192.168.0.10:3000" -ForegroundColor White
Write-Host "2. Check logs: docker compose logs -f backend" -ForegroundColor White
Write-Host "3. Verify SMB connection in backend logs" -ForegroundColor White
Write-Host ""
