@echo off
echo ================================================================
echo   VERIFY COMPANY DATA IN DATABASE
echo ================================================================
echo.
echo This will show all the data inserted into grp_quotation_fresh
echo.
pause

REM Change to database directory
cd /d "%~dp0"

REM Prompt for password
set /p PGPASSWORD="Enter PostgreSQL password: "
echo.

echo Running verification...
echo.

psql -U postgres -d grp_quotation_fresh -f verify_company_data.sql

if errorlevel 1 (
    echo.
    echo [ERROR] Database not found or verification failed.
    echo Make sure you ran SETUP_WITH_COMPANY_DATA.bat first!
    pause
    exit /b 1
)

echo.
echo ================================================================
echo   VERIFICATION COMPLETE!
echo ================================================================
echo.
pause
