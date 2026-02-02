@echo off
echo ============================================================
echo Starting GRP Quotation Generator - Frontend
echo ============================================================
echo.

cd /d "%~dp0"

REM Check if node_modules exists
if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
    echo.
)

echo.
echo Starting Next.js development server...
echo Frontend will be available at: http://localhost:3000
echo Press CTRL+C to stop the server
echo.

call npm run dev

pause
