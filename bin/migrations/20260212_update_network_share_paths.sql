-- Update company storage paths to network share locations
-- Run this after setting up network share access

UPDATE company_details 
SET company_storage_path = '//192.168.0.10/GRP-Quotations/GRP-QUOTATIONS-GENERATOR' 
WHERE code = 'GRP';

UPDATE company_details 
SET company_storage_path = '//192.168.0.10/GRP-PIPECO-Quotations/GRPPT-QUOTATIONS-GENERATOR' 
WHERE code = 'GRPPT';

UPDATE company_details 
SET company_storage_path = '//192.168.0.10/Colex-Quotations/CLX-QUOTATIONS-GENERATOR' 
WHERE code = 'CLX';

-- If using Docker volume mounts instead, use these Linux paths:
-- UPDATE company_details SET company_storage_path = '/mnt/grp_quotations' WHERE code = 'GRP';
-- UPDATE company_details SET company_storage_path = '/mnt/grp_pipeco_quotations' WHERE code = 'GRPPT';
-- UPDATE company_details SET company_storage_path = '/mnt/colex_quotations' WHERE code = 'CLX';

-- Verify the update
SELECT code, company_name, company_storage_path FROM company_details;
