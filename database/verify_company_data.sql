-- Verification script for grp_quotation_fresh database
-- Run this to verify all data was inserted correctly

\echo ''
\echo '========================================='
\echo '  DATABASE VERIFICATION'
\echo '========================================='
\echo ''

-- Check all tables exist
\echo 'Checking tables...'
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

\echo ''
\echo '========================================='
\echo '  COMPANY DETAILS (3 companies)'
\echo '========================================='
SELECT id, code, company_name, full_name FROM company_details ORDER BY id;

\echo ''
\echo '========================================='
\echo '  SALES DETAILS (6 sales persons)'
\echo '========================================='
SELECT id, code, sales_person_name, designation, phone_number FROM sales_details ORDER BY id;

\echo ''
\echo '========================================='
\echo '  PROJECT MANAGER DETAILS (2 managers)'
\echo '========================================='
SELECT id, code, manager_name, designation, phone_number FROM project_manager_details ORDER BY id;

\echo ''
\echo '========================================='
\echo '  RECIPIENT DETAILS (should be empty)'
\echo '========================================='
SELECT COUNT(*) as recipient_count FROM recipient_details;

\echo ''
\echo '========================================='
\echo '  TEST QUOTE NUMBER GENERATION'
\echo '========================================='
\echo 'Testing with: Company=1 (GRPT), Sales=1 (VV), Quote=0001, Date=today'
SELECT generate_full_quote_number(1, 1, '0001', CURRENT_DATE) as sample_quote_number;

\echo ''
\echo '========================================='
\echo '  VERIFICATION COMPLETE!'
\echo '========================================='
\echo ''
\echo 'If you see:'
\echo '  ✓ 7 tables listed'
\echo '  ✓ 3 companies (GRPT, GRPPT, CLX)'
\echo '  ✓ 6 sales persons (VV, MM, SJ, AS, VK, LP)'
\echo '  ✓ 2 project managers (AM, MM)'
\echo '  ✓ Sample quote number generated'
\echo ''
\echo 'Then your database is ready to use!'
\echo ''
