@echo off
echo ========================================
echo   GRP Quotation Generator
echo   Starting All Services...
echo ========================================
echo.

REM Start backend in new window
echo [1/2] Starting Backend Server...
start "Backend - FastAPI" cmd /k "%~dp0start_backend.bat"

REM Wait a bit for backend to start
timeout /t 5 /nobreak > nul

REM Start frontend in new window
echo [2/2] Starting Frontend Server...
start "Frontend - Next.js" cmd /k "%~dp0start_frontend.bat"

REM Wait for frontend to start
timeout /t 8 /nobreak > nul

REM Open browser
echo.
echo Opening browser at http://localhost:3000...
start http://localhost:3000

echo.
echo ========================================
echo   All services started!
echo ========================================
echo.
echo   Backend:  http://localhost:8000
echo   Frontend: http://localhost:3000
echo.
echo   Close the terminal windows to stop the servers.
echo.

pause
