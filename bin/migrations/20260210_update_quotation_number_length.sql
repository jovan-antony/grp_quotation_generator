-- Migration: Update quotation_number from VARCHAR(4) to VARCHAR(12)
-- Date: 2026-02-10
-- Purpose: Increase quotation_number field length to support 4-12 character quotation numbers

-- ============================================================================
-- 1. DROP VIEW: Temporarily drop view that depends on quotation_number column
-- ============================================================================
DROP VIEW IF EXISTS view_quotation_complete CASCADE;
DROP VIEW IF EXISTS view_quotation_summary CASCADE;

-- ============================================================================
-- 2. ALTER TABLE: Update quotation_number column length
-- ============================================================================
ALTER TABLE quotation_webpage_input_details_save 
    ALTER COLUMN quotation_number TYPE VARCHAR(12);

-- ============================================================================
-- 2. UPDATE FUNCTION: Recreate generate_full_quote_number with updated parameter
-- ============================================================================
CREATE OR REPLACE FUNCTION generate_full_quote_number(
    p_company_id INTEGER,
    p_sales_person_id INTEGER,
    p_quotation_number VARCHAR(12),  -- Updated from VARCHAR(4) to VARCHAR(12)
    p_quotation_date DATE
)
RETURNS VARCHAR(100) AS $$
DECLARE
    v_company_code VARCHAR(10);
    v_sales_code VARCHAR(10);
    v_year_month VARCHAR(4);
    v_full_quote_number VARCHAR(100);
BEGIN
    SELECT code INTO v_company_code FROM company_details WHERE id = p_company_id;
    SELECT code INTO v_sales_code FROM sales_details WHERE id = p_sales_person_id;
    v_year_month := TO_CHAR(p_quotation_date, 'YYMM');
    v_full_quote_number := v_company_code || '/' || v_year_month || '/' || v_sales_code || '/' || p_quotation_number;
    RETURN v_full_quote_number;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 3. RECREATE VIEWS: Restore views that were dropped
-- ============================================================================

-- View 1: Quotation Complete
CREATE OR REPLACE VIEW view_quotation_complete AS
SELECT 
    q.id, q.quotation_number, q.full_main_quote_number, q.final_doc_file_path,
    q.quotation_date, q.subject, q.project_location,
    c.code as company_code, c.company_name, c.full_name as company_full_name,
    c.seal_path as company_seal_path, c.template_path as company_template_path,
    r.recipient_name, r.role_of_recipient, r.to_company_name, r.to_company_location,
    r.phone_number as recipient_phone, r.email as recipient_email,
    s.sales_person_name, s.code as sales_code, s.designation as sales_designation,
    s.sign_path as sales_sign_path, s.email_name as sales_email_name,
    pm.manager_name, pm.code as manager_code, pm.designation as manager_designation,
    pm.sign_path as manager_sign_path, pm.email_name as manager_email_name,
    q.subtotal, q.discount_percentage, q.discount_amount,
    q.tax_percentage, q.tax_amount, q.total_amount,
    q.status, q.revision_number, q.revision,
    q.created_time, q.last_updated_time
FROM quotation_webpage_input_details_save q
LEFT JOIN company_details c ON q.company_id = c.id
LEFT JOIN recipient_details r ON q.recipient_id = r.id
LEFT JOIN sales_details s ON q.sales_person_id = s.id
LEFT JOIN project_manager_details pm ON q.project_manager_id = pm.id;

-- View 2: Quotation Summary
CREATE OR REPLACE VIEW view_quotation_summary AS
SELECT 
    q.id, q.full_main_quote_number, q.quotation_date,
    c.company_name, r.recipient_name, r.to_company_name,
    s.sales_person_name, q.total_amount, q.status,
    q.revision_number, q.created_time
FROM quotation_webpage_input_details_save q
LEFT JOIN company_details c ON q.company_id = c.id
LEFT JOIN recipient_details r ON q.recipient_id = r.id
LEFT JOIN sales_details s ON q.sales_person_id = s.id;

-- ============================================================================
-- Verification Query (Optional - run to verify changes)
-- ============================================================================
-- SELECT column_name, data_type, character_maximum_length 
-- FROM information_schema.columns 
-- WHERE table_name = 'quotation_webpage_input_details_save' 
-- AND column_name = 'quotation_number';
