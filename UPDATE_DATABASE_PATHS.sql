-- Update the database with LOCAL Docker container mount paths
-- From Docker container, run:
-- docker exec -it grp_postgres psql -U postgres -d grp_quotation_fresh -f /docker-entrypoint-initdb.d/update_storage_paths_for_docker.sql

-- Update storage paths to LOCAL DOCKER MOUNT POINTS (not network shares)
UPDATE company_details 
SET company_storage_path = '/mnt/grp_quotations' 
WHERE code = 'GRPT';

UPDATE company_details 
SET company_storage_path = '/mnt/grp_pipeco_quotations' 
WHERE code = 'GRPPT';

UPDATE company_details 
SET company_storage_path = '/mnt/colex_quotations' 
WHERE code = 'CLX';

-- Verify the update
SELECT code, company_name, company_storage_path FROM company_details;
