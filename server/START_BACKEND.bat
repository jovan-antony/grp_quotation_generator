@echo off
echo ============================================================
echo Starting GRP Quotation Generator - Python Backend
echo ============================================================
echo.

cd /d "%~dp0"

REM Check if virtual environment exists
if not exist "venv\" (
    echo Creating virtual environment...
    python -m venv venv
    echo.
    echo Installing dependencies...
    call venv\Scripts\activate.bat
    pip install -r requirements.txt
) else (
    call venv\Scripts\activate.bat
)

echo.
echo Starting FastAPI server...
echo Server will be available at: http://localhost:8000
echo Press CTRL+C to stop the server
echo.

python api_server.py

pause
