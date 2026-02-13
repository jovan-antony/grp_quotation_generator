# Test script to check database connectivity
Write-Host "`n=== Checking Docker Containers ===" -ForegroundColor Cyan
docker ps

Write-Host "`n=== Testing Postgres Connection from Host ===" -ForegroundColor Cyan
docker exec grp_postgres psql -U postgres -d grp_quotation_fresh -c "SELECT 'Database is accessible' as status;"

Write-Host "`n=== Testing Postgres Connection from Backend ===" -ForegroundColor Cyan
docker exec grp_backend python -c "import psycopg2; conn = psycopg2.connect('postgresql://postgres:RdDpp2M47i@postgres:5432/grp_quotation_fresh'); print('Backend can connect to database!'); conn.close()"

Write-Host "`n=== Checking Backend Logs (last 30 lines) ===" -ForegroundColor Cyan
docker logs --tail 30 grp_backend

Write-Host "`n=== Checking Postgres Logs (last 20 lines) ===" -ForegroundColor Cyan
docker logs --tail 20 grp_postgres

Write-Host "`n=== Testing Backend API Health ===" -ForegroundColor Cyan
curl http://localhost:8000/health

Write-Host "`nDiagnostics complete!" -ForegroundColor Green
