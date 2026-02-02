@echo off
echo ========================================
echo   Starting Backend Server (FastAPI)
echo ========================================
echo.

cd /d "%~dp0server"

REM Check if virtual environment exists
if not exist "venv\" (
    echo Creating virtual environment...
    python -m venv venv
    echo.
)

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Installing dependencies...
pip install -r requirements.txt -q

echo.
echo Starting FastAPI server on http://localhost:8000...
echo Press CTRL+C to stop the server
echo.

python api_server.py

pause
