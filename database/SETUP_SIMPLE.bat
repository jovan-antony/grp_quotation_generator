@echo off
echo ================================================================
echo GRP QUOTATION - SIMPLE SETUP
echo ================================================================
echo.
echo This will:
echo   1. Create database: grp_quotation_fresh
echo   2. Setup 7 tables with your company data
echo.
pause

set /p PGPASSWORD="Enter PostgreSQL password: "

echo.
echo Step 1: Creating database...
set PGPASSWORD=%PGPASSWORD%
psql -U postgres -d postgres -c "DROP DATABASE IF EXISTS grp_quotation_fresh;"
psql -U postgres -d postgres -c "CREATE DATABASE grp_quotation_fresh;"

if errorlevel 1 (
    echo [ERROR] Failed to create database
    echo Try running: RESTART_POSTGRESQL.bat as Administrator
    pause
    exit /b 1
)

echo.
echo Step 2: Setting up tables and data...
psql -U postgres -d grp_quotation_fresh -f setup_with_company_data.sql

if errorlevel 1 (
    echo [ERROR] Failed to setup tables
    pause
    exit /b 1
)

echo.
echo ================================================================
echo [SUCCESS] Setup Complete!
echo ================================================================
echo.
echo Database: grp_quotation_fresh
echo Tables: 7 (with 3 companies, 6 sales, 2 managers)
echo.
echo Verify with: VERIFY_COMPANY_DATA.bat
echo.
pause
