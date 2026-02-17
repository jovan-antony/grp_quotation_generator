-- Migration: Add generated_by field to quotation_webpage_input_details_save table
-- Date: 2026-02-17
-- Purpose: Add generated_by field to track who generated each quotation

-- ============================================================================
-- ALTER TABLE: Add generated_by column
-- ============================================================================
ALTER TABLE quotation_webpage_input_details_save 
    ADD COLUMN IF NOT EXISTS generated_by VARCHAR(255);

-- ============================================================================
-- COMMENT: Add column comment for documentation
-- ============================================================================
COMMENT ON COLUMN quotation_webpage_input_details_save.generated_by IS 'Name of the person who generated this quotation';

-- ============================================================================
-- VERIFICATION: Show table structure to verify the change
-- ============================================================================
SELECT column_name, data_type, character_maximum_length, is_nullable
FROM information_schema.columns
WHERE table_name = 'quotation_webpage_input_details_save'
AND column_name = 'generated_by';
