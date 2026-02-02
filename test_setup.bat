@echo off
echo ========================================
echo GRP Quotation Generator - Test Setup
echo ========================================
echo.

echo [1/5] Checking Python installation...
python --version
if %errorlevel% neq 0 (
    echo ERROR: Python not found. Please install Python 3.8 or higher.
    pause
    exit /b 1
)
echo OK: Python found
echo.

echo [2/5] Checking Node.js installation...
node --version
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found. Please install Node.js v18 or higher.
    pause
    exit /b 1
)
echo OK: Node.js found
echo.

echo [3/5] Checking Python dependencies...
cd server
python -c "import fastapi, uvicorn, docx, pydantic" 2>nul
if %errorlevel% neq 0 (
    echo WARNING: Some Python packages missing. Installing...
    pip install -r requirements.txt
) else (
    echo OK: Python dependencies installed
)
cd ..
echo.

echo [4/5] Checking template files...
if exist "server\Template_GRP.docx" (
    echo OK: Template_GRP.docx found
) else (
    echo WARNING: Template_GRP.docx not found
)
if exist "server\Template_PIPECO.docx" (
    echo OK: Template_PIPECO.docx found
) else (
    echo WARNING: Template_PIPECO.docx not found
)
if exist "server\Template_COLEX.docx" (
    echo OK: Template_COLEX.docx found
) else (
    echo WARNING: Template_COLEX.docx not found
)
echo.

echo [5/5] Checking environment configuration...
if exist "client\.env.local" (
    echo OK: .env.local found
) else (
    echo WARNING: client\.env.local not found. You may need to create it.
)
echo.

echo ========================================
echo Setup check complete!
echo ========================================
echo.
echo To start the application:
echo 1. Open terminal in 'server' folder and run: start_server.bat
echo 2. Open another terminal in 'client' folder and run: npm run dev
echo 3. Visit http://localhost:3000 in your browser
echo.
pause
