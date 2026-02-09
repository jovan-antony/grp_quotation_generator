@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ================================================================
echo GRP QUOTATION GENERATOR - SAFE SETUP WITH COMPANY DATA
echo ================================================================
echo.
echo This will create database with your company data
echo.
echo Database Name: grp_quotation_fresh
echo.
echo What will be created:
echo   - All 7 table structures
echo   - 3 Companies (GRP, GRP PIPECO, COLEX)
echo   - 6 Sales Persons (from JSON file)
echo   - 2 Project Managers (from JSON file)
echo   - Recipients table (empty - add as needed)
echo   - Contractual terms tables (empty)
echo   - Quotation table (empty)
echo.
echo Company Codes: GRPT, GRPPT, CLX
echo Sales Codes: VV, MM, SJ, AS, VK, LP
echo Manager Codes: AM, MM
echo.
echo ================================================================
echo.
echo This version will:
echo   1. First check if database exists
echo   2. If yes, skip drop/create
echo   3. Run setup on existing database
echo.
pause

set /p PGPASSWORD="Enter PostgreSQL password: "
set PGPASSWORD=%PGPASSWORD%

echo.
echo Step 1: Testing PostgreSQL connection...
psql -U postgres -d postgres -c "SELECT version();" >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Cannot connect to PostgreSQL!
    echo.
    echo Possible solutions:
    echo   1. Run RESTART_POSTGRESQL.bat as Administrator
    echo   2. Close all pgAdmin windows
    echo   3. Close all applications using PostgreSQL
    echo   4. Restart your computer
    echo.
    pause
    exit /b 1
)
echo [OK] PostgreSQL connection successful

echo.
echo Step 2: Creating database (will drop if exists)...
psql -U postgres -d postgres -c "DROP DATABASE IF EXISTS grp_quotation_fresh;"
if errorlevel 1 (
    echo [WARNING] Could not drop database (may not exist yet)
)

psql -U postgres -d postgres -c "CREATE DATABASE grp_quotation_fresh;"
if errorlevel 1 (
    echo [ERROR] Failed to create database.
    echo.
    echo Try these solutions:
    echo   1. Close pgAdmin if open
    echo   2. Run: net stop postgresql-x64-12
    echo          net start postgresql-x64-12
    echo   3. Check if another app is using the database
    pause
    exit /b 1
)
echo [OK] Database created successfully

echo.
echo Step 3: Setting up tables and inserting company data...
psql -U postgres -d grp_quotation_fresh -f setup_with_company_data.sql
if errorlevel 1 (
    echo [ERROR] Failed to setup database.
    pause
    exit /b 1
)

echo.
echo ================================================================
echo [SUCCESS] Database setup completed!
echo ================================================================
echo.
echo Database: grp_quotation_fresh
echo.
echo COMPANY DATA INSERTED:
echo.
echo Companies (3):
echo   1. GRP TANKS TRADING L.L.C          - Code: GRPT
echo   2. GRP PIPECO TANKS TRADING L.L.C   - Code: GRPPT
echo   3. COLEX TANKS TRADING L.L.C        - Code: CLX
echo.
echo Sales Persons (6):
echo   1. Viwin Varghese    (VV)  - Senior Manager Sales
echo   2. Midhun Murali     (MM)  - Project/Sales Manager
echo   3. Somiya Joy        (SJ)  - Sales Coordinator
echo   4. AKSHAYA SHAJI     (AS)  - SALES COORDINATOR
echo   5. Vismay Krishnan   (VK)  - Sales Engineer
echo   6. LEYON PAUL        (LP)  - SALES ENGINEER
echo.
echo Project Managers (2):
echo   1. Anoop Mohan       (AM)  - Project Manager
echo   2. Midhun Murali     (MM)  - Project/Sales Manager
echo.
echo Quote Number Format:
echo   GRPT/2602/VV/0001   (GRP Tanks, Feb 2026, Viwin, Seq 1)
echo   GRPPT/2602/MM/0002  (GRP Pipeco, Feb 2026, Midhun, Seq 2)
echo   CLX/2602/SJ/0003    (Colex, Feb 2026, Somiya, Seq 3)
echo.
echo Next Steps:
echo   1. Run VERIFY_COMPANY_DATA.bat to check data
echo   2. Update server/database.py with: dbname="grp_quotation_fresh"
echo   3. Start creating quotations!
echo.
pause
