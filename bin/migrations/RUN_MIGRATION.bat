@echo off
echo ============================================================
echo Update Quotation Number Column Length (VARCHAR(4) to VARCHAR(12))
echo ============================================================
echo.
echo This will update the quotation_number column to support 4-12 characters.
echo.
echo Database: grp_quotation_fresh
echo User: postgres
echo.
pause
echo.
echo Running migration...
psql -U postgres -d grp_quotation_fresh -f "20260210_update_quotation_number_length.sql"
echo.
if %ERRORLEVEL% EQU 0 (
    echo ============================================================
    echo ✓ Migration completed successfully!
    echo ============================================================
) else (
    echo ============================================================
    echo ✗ Migration failed. Please check the error above.
    echo ============================================================
)
echo.
pause
