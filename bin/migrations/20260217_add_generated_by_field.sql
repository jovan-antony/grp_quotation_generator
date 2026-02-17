-- Add generated_by field to track who created the quotation
-- Migration: 20260217_add_generated_by_field.sql
-- Date: February 17, 2026

-- Add generated_by column to quotation_webpage_input_details_save table
ALTER TABLE quotation_webpage_input_details_save 
ADD COLUMN IF NOT EXISTS generated_by VARCHAR(255);

-- Add comment to explain the column
COMMENT ON COLUMN quotation_webpage_input_details_save.generated_by IS 'Name of the person who generated/created this quotation';

-- Create index for faster searches by generated_by
CREATE INDEX IF NOT EXISTS idx_quotation_generated_by ON quotation_webpage_input_details_save(generated_by);

-- Verify the update
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'quotation_webpage_input_details_save' 
AND column_name = 'generated_by';
