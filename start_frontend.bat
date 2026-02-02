@echo off
echo ========================================
echo   Starting Frontend (Next.js)
echo ========================================
echo.

cd /d "%~dp0client"

REM Check if node_modules exists
if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
    echo.
)

REM Check if .env.local exists, if not create from example
if not exist ".env.local" (
    if exist ".env.local.example" (
        echo Creating .env.local from example...
        copy .env.local.example .env.local
        echo.
    )
)

echo Starting Next.js development server on http://localhost:3000...
echo Press CTRL+C to stop the server
echo.

call npm run dev

pause
