@echo off
echo ============================================================
echo GRP Quotation Generator - Complete Startup
echo ============================================================
echo.
echo This will start BOTH the backend and frontend servers
echo.
echo Backend (Python FastAPI): http://localhost:8000
echo Frontend (Next.js):       http://localhost:3000
echo.
echo Press any key to continue...
pause > nul

REM Start backend in new window
start "GRP Backend - FastAPI" cmd /k "cd /d %~dp0server && START_BACKEND.bat"

REM Wait 3 seconds for backend to start
timeout /t 3 /nobreak

REM Start frontend in new window
start "GRP Frontend - Next.js" cmd /k "cd /d %~dp0client && START_FRONTEND.bat"

echo.
echo ============================================================
echo Both servers are starting in separate windows
echo ============================================================
echo.
echo Once both are ready, open your browser to:
echo http://localhost:3000
echo.
echo To stop: Close both terminal windows or press CTRL+C in each
echo.
pause
