-- ============================================================================
-- UPDATE STORAGE PATHS FOR DOCKER DEPLOYMENT
-- Run this AFTER deploying to the Linux server with Docker
-- ============================================================================

-- Update storage paths to use container mount points
-- These paths correspond to where the host directories are mounted INSIDE the Docker container

UPDATE company_details 
SET company_storage_path = '/mnt/grp_quotations'
WHERE code = 'GRP';

UPDATE company_details 
SET company_storage_path = '/mnt/grp_pipeco_quotations'
WHERE code = 'GRPPT';

UPDATE company_details 
SET company_storage_path = '/mnt/colex_quotations'
WHERE code = 'CLX';

-- Verify the updates
DO $$
DECLARE
    rec RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=======================================================';
    RAISE NOTICE '   DOCKER STORAGE PATHS UPDATED!';
    RAISE NOTICE '=======================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Updated Company Storage Paths (Container Paths):';
    RAISE NOTICE '';
    
    FOR rec IN SELECT code, full_name, company_storage_path FROM company_details ORDER BY code
    LOOP
        RAISE NOTICE '  % (%)', rec.full_name, rec.code;
        RAISE NOTICE '    -> %', rec.company_storage_path;
        RAISE NOTICE '';
    END LOOP;
    
    RAISE NOTICE '=======================================================';
    RAISE NOTICE 'Docker Volume Mapping:';
    RAISE NOTICE '  Host: /mnt/SSD1/samba/Share/GRP-Quotations';
    RAISE NOTICE '  Container: /mnt/grp_quotations (GRP)';
    RAISE NOTICE '';
    RAISE NOTICE '  Host: /mnt/SSD1/samba/Share/GRP-PIPECO-Quotations';
    RAISE NOTICE '  Container: /mnt/grp_pipeco_quotations (GRPPT)';
    RAISE NOTICE '';
    RAISE NOTICE '  Host: /mnt/SSD1/samba/Share/colex-quotations';
    RAISE NOTICE '  Container: /mnt/colex_quotations (CLX)';
    RAISE NOTICE '=======================================================';
END $$;
