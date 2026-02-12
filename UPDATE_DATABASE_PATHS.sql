# Update the database with network share paths
# From Docker container, run:
# docker exec -it grp_postgres psql -U postgres -d grp_quotation_fresh -f /path/to/this/file.sql

# Or from Windows, run:
# psql -U postgres -d grp_quotation_fresh -f bin\migrations\20260212_update_network_share_paths.sql

-- Option 1: Use network share paths directly (requires SMB credentials)
UPDATE company_details 
SET company_storage_path = '//192.168.0.10/GRP-Quotations/GRPT-QUOTATIONS-GENERATOR' 
WHERE code = 'GRPT';

UPDATE company_details 
SET company_storage_path = '//192.168.0.10/GRP-PIPECO-Quotations/GRPPT-QUOTATIONS-GENERATOR' 
WHERE code = 'GRPPT';

UPDATE company_details 
SET company_storage_path = '//192.168.0.10/Colex-Quotations/CLX-QUOTATIONS-GENERATOR' 
WHERE code = 'CLX';

-- Verify the update
SELECT code, company_name, company_storage_path FROM company_details;
