@echo off
echo ================================================================
echo GRP QUOTATION GENERATOR - DATABASE SETUP
echo ================================================================
echo.

REM Change to server directory
cd /d "%~dp0"

echo Step 1: Checking PostgreSQL installation...
psql --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] PostgreSQL is not installed or not in PATH
    echo Please install PostgreSQL and try again
    pause
    exit /b 1
)
echo [OK] PostgreSQL is installed
echo.

echo Step 2: Creating database...
echo Enter your PostgreSQL password when prompted:
psql -U postgres -c "CREATE DATABASE grp_quotation;" 2>nul
if errorlevel 1 (
    echo [INFO] Database may already exist, continuing...
) else (
    echo [OK] Database created successfully
)
echo.

echo Step 3: Running database setup script...
psql -U postgres -d grp_quotation -f database\setup.sql
if errorlevel 1 (
    echo [ERROR] Failed to run setup script
    pause
    exit /b 1
)
echo [OK] Database tables created successfully
echo.

echo Step 4: Installing Python dependencies...
if exist venv\ (
    echo [INFO] Virtual environment found, activating...
    call venv\Scripts\activate.bat
) else (
    echo [INFO] Creating virtual environment...
    python -m venv venv
    call venv\Scripts\activate.bat
)

echo Installing required packages...
pip install -r requirements.txt
if errorlevel 1 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)
echo [OK] Dependencies installed successfully
echo.

echo Step 5: Configuring environment variables...
if not exist .env (
    echo Creating .env file...
    copy .env.example .env
    echo [INFO] Please edit .env file and set your PostgreSQL password
) else (
    echo [OK] .env file already exists
)
echo.

echo Step 6: Testing database connection...
python test_db_connection.py
if errorlevel 1 (
    echo [ERROR] Database connection test failed
    echo Please check your .env file configuration
    pause
    exit /b 1
)
echo.

echo Step 7: Importing Excel data (Optional)...
set /p import="Do you want to import Excel data? (y/n): "
if /i "%import%"=="y" (
    python import_excel_data.py
)
echo.

echo ================================================================
echo SETUP COMPLETE!
echo ================================================================
echo.
echo Next steps:
echo 1. Edit .env file with your PostgreSQL password
echo 2. Run: python api_server.py (to start backend)
echo 3. Open another terminal and run: cd client ^&^& npm run dev (to start frontend)
echo.
echo Your quotations will be automatically saved to the database
echo with the quote number at the end!
echo.
pause
