# Backend Connectivity Test Script
Write-Host "=== Testing Backend Connectivity ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Testing root endpoint (/):" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://192.168.0.10:8000/" -UseBasicParsing -TimeoutSec 5
    Write-Host "Status Code: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor Green
} catch {
    Write-Host "ERROR: $_" -ForegroundColor Red
}
Write-Host ""

Write-Host "2. Testing health endpoint (/health):" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://192.168.0.10:8000/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "Status Code: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor Green
} catch {
    Write-Host "ERROR: $_" -ForegroundColor Red
}
Write-Host ""

Write-Host "3. Testing API endpoint (/api/companies):" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://192.168.0.10:8000/api/companies" -UseBasicParsing -TimeoutSec 5
    Write-Host "Status Code: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response (first 200 chars): $($response.Content.Substring(0, [Math]::Min(200, $response.Content.Length)))" -ForegroundColor Green
} catch {
    Write-Host "ERROR: $_" -ForegroundColor Red
}
Write-Host ""

Write-Host "=== Test Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "If you see connection errors above, run this on your Linux server:" -ForegroundColor Yellow
Write-Host "  sudo docker logs grp_backend" -ForegroundColor White
Write-Host "  sudo docker ps | grep grp" -ForegroundColor White
Write-Host "  sudo netstat -tlnp | grep :8000" -ForegroundColor White
