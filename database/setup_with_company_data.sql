-- ============================================================================
-- GRP QUOTATION GENERATOR - DATABASE SETUP WITH COMPANY DATA
-- Creates all 7 tables + inserts data from JSON files
-- ============================================================================

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS quotation_webpage_input_details_save CASCADE;
DROP TABLE IF EXISTS contractual_terms_specifications CASCADE;
DROP TABLE IF EXISTS default_contractual_terms_specifications CASCADE;
DROP TABLE IF EXISTS project_manager_details CASCADE;
DROP TABLE IF EXISTS sales_details CASCADE;
DROP TABLE IF EXISTS recipient_details CASCADE;
DROP TABLE IF EXISTS company_details CASCADE;

-- ============================================================================
-- TABLE 1: COMPANY_DETAILS
-- ============================================================================
CREATE TABLE company_details (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(50) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    code VARCHAR(10) UNIQUE NOT NULL,
    seal_path VARCHAR(500),
    template_path VARCHAR(500),
    company_domain VARCHAR(100),
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLE 2: RECIPIENT_DETAILS
-- ============================================================================
CREATE TABLE recipient_details (
    id SERIAL PRIMARY KEY,
    recipient_name VARCHAR(255) NOT NULL,
    role_of_recipient VARCHAR(100),
    to_company_name VARCHAR(255),
    to_company_location VARCHAR(255),
    phone_number VARCHAR(50),
    email VARCHAR(255),
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLE 3: SALES_DETAILS
-- ============================================================================
CREATE TABLE sales_details (
    id SERIAL PRIMARY KEY,
    sales_person_name VARCHAR(255) NOT NULL,
    code VARCHAR(10) UNIQUE NOT NULL,
    sign_path VARCHAR(500),
    designation VARCHAR(100),
    phone_number VARCHAR(50),
    email_name VARCHAR(100),
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLE 4: PROJECT_MANAGER_DETAILS
-- ============================================================================
CREATE TABLE project_manager_details (
    id SERIAL PRIMARY KEY,
    manager_name VARCHAR(255) NOT NULL,
    code VARCHAR(10) UNIQUE NOT NULL,
    sign_path VARCHAR(500),
    designation VARCHAR(100),
    phone_number VARCHAR(50),
    email_name VARCHAR(100),
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLE 5: DEFAULT_CONTRACTUAL_TERMS_SPECIFICATIONS
-- ============================================================================
CREATE TABLE default_contractual_terms_specifications (
    id SERIAL PRIMARY KEY,
    note JSONB,
    material_specifications JSONB,
    warranty_conditions JSONB,
    terms_and_conditions JSONB,
    supplier_scope JSONB,
    customer_scope JSONB,
    note_second JSONB,
    scope_of_work JSONB,
    work_excluded JSONB,
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLE 6: CONTRACTUAL_TERMS_SPECIFICATIONS
-- ============================================================================
CREATE TABLE contractual_terms_specifications (
    id SERIAL PRIMARY KEY,
    full_main_quote_number VARCHAR(100) NOT NULL,
    note JSONB,
    material_specifications JSONB,
    warranty_conditions JSONB,
    terms_and_conditions JSONB,
    supplier_scope JSONB,
    customer_scope JSONB,
    note_second JSONB,
    scope_of_work JSONB,
    work_excluded JSONB,
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_terms_per_quote UNIQUE (full_main_quote_number)
);

-- ============================================================================
-- TABLE 7: QUOTATION_WEBPAGE_INPUT_DETAILS_SAVE
-- ============================================================================
CREATE TABLE quotation_webpage_input_details_save (
    id SERIAL PRIMARY KEY,
    quotation_number VARCHAR(12) NOT NULL,
    full_main_quote_number VARCHAR(100) UNIQUE NOT NULL,
    final_doc_file_path VARCHAR(500),
    company_id INTEGER NOT NULL REFERENCES company_details(id) ON DELETE RESTRICT,
    recipient_id INTEGER NOT NULL REFERENCES recipient_details(id) ON DELETE RESTRICT,
    sales_person_id INTEGER NOT NULL REFERENCES sales_details(id) ON DELETE RESTRICT,
    project_manager_id INTEGER REFERENCES project_manager_details(id) ON DELETE SET NULL,
    quotation_date DATE NOT NULL,
    subject TEXT,
    project_location TEXT,
    tanks_data JSONB NOT NULL,
    form_options JSONB,
    additional_data JSONB,
    subtotal DECIMAL(15, 2),
    discount_percentage DECIMAL(5, 2) DEFAULT 0,
    discount_amount DECIMAL(15, 2) DEFAULT 0,
    tax_percentage DECIMAL(5, 2) DEFAULT 0,
    tax_amount DECIMAL(15, 2) DEFAULT 0,
    total_amount DECIMAL(15, 2),
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'approved', 'rejected', 'revised')),
    revision_number INTEGER DEFAULT 0,
    revision TEXT,
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_quote_per_company UNIQUE (company_id, quotation_number, revision_number)
);

-- ============================================================================
-- TRIGGERS: Auto-update timestamps
-- ============================================================================
CREATE OR REPLACE FUNCTION update_last_updated_time()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated_time = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_company_details_timestamp
    BEFORE UPDATE ON company_details
    FOR EACH ROW EXECUTE FUNCTION update_last_updated_time();

CREATE TRIGGER update_recipient_details_timestamp
    BEFORE UPDATE ON recipient_details
    FOR EACH ROW EXECUTE FUNCTION update_last_updated_time();

CREATE TRIGGER update_sales_details_timestamp
    BEFORE UPDATE ON sales_details
    FOR EACH ROW EXECUTE FUNCTION update_last_updated_time();

CREATE TRIGGER update_project_manager_details_timestamp
    BEFORE UPDATE ON project_manager_details
    FOR EACH ROW EXECUTE FUNCTION update_last_updated_time();

CREATE TRIGGER update_default_contractual_terms_specifications_timestamp
    BEFORE UPDATE ON default_contractual_terms_specifications
    FOR EACH ROW EXECUTE FUNCTION update_last_updated_time();

CREATE TRIGGER update_contractual_terms_specifications_timestamp
    BEFORE UPDATE ON contractual_terms_specifications
    FOR EACH ROW EXECUTE FUNCTION update_last_updated_time();

CREATE TRIGGER update_quotation_webpage_input_details_save_timestamp
    BEFORE UPDATE ON quotation_webpage_input_details_save
    FOR EACH ROW EXECUTE FUNCTION update_last_updated_time();

-- ============================================================================
-- FUNCTION: Generate Full Quote Number
-- ============================================================================
CREATE OR REPLACE FUNCTION generate_full_quote_number(
    p_company_id INTEGER,
    p_sales_person_id INTEGER,
    p_quotation_number VARCHAR(12),
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
-- TRIGGER: Auto-generate full_main_quote_number and file path
-- ============================================================================
CREATE OR REPLACE FUNCTION auto_generate_quote_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.full_main_quote_number IS NULL OR NEW.full_main_quote_number = '' THEN
        NEW.full_main_quote_number := generate_full_quote_number(
            NEW.company_id,
            NEW.sales_person_id,
            NEW.quotation_number,
            NEW.quotation_date
        );
    END IF;
    
    IF NEW.final_doc_file_path IS NULL OR NEW.final_doc_file_path = '' THEN
        -- Format: Final_Doc/GRPPT/GRPPT_2502_VV_2582.docx or Final_Doc/GRPPT/GRPPT_2502_VV_2582_R1.docx
        -- Extract company code from full_main_quote_number (first part before /)
        DECLARE
            company_code_var TEXT;
        BEGIN
            company_code_var := SPLIT_PART(NEW.full_main_quote_number, '/', 1);
            NEW.final_doc_file_path := 'Final_Doc/' || company_code_var || '/' || REPLACE(REPLACE(NEW.full_main_quote_number, '/', '_'), '-R', '_R') || '.docx';
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_generate_quote_number
    BEFORE INSERT OR UPDATE ON quotation_webpage_input_details_save
    FOR EACH ROW EXECUTE FUNCTION auto_generate_quote_number();

-- ============================================================================
-- INDEXES: Performance optimization
-- ============================================================================
CREATE INDEX idx_quote_number ON quotation_webpage_input_details_save(full_main_quote_number);
CREATE INDEX idx_quotation_number ON quotation_webpage_input_details_save(quotation_number);
CREATE INDEX idx_quotation_date ON quotation_webpage_input_details_save(quotation_date);
CREATE INDEX idx_status ON quotation_webpage_input_details_save(status);
CREATE INDEX idx_company ON quotation_webpage_input_details_save(company_id);
CREATE INDEX idx_sales_person ON quotation_webpage_input_details_save(sales_person_id);
CREATE INDEX idx_recipient ON quotation_webpage_input_details_save(recipient_id);

-- ============================================================================
-- VIEWS: Convenient data retrieval
-- ============================================================================

-- View 1: Complete Quotation Details
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
LEFT JOIN sales_details s ON q.sales_person_id = s.id
ORDER BY q.created_time DESC;

-- ============================================================================
-- INSERT DATA FROM JSON FILES
-- ============================================================================

-- Insert Company Details (from company_details.json)
INSERT INTO company_details (company_name, full_name, code, seal_path, template_path, company_domain) VALUES
('grp', 'GRP TANKS TRADING L.L.C', 'GRPT', 'grp_seal', 'grp_template', 'grptanks.com'),
('grp pipeco', 'GRP PIPECO TANKS TRADING L.L.C', 'GRPPT', 'pipeco_seal', 'pipeco_template', 'grppipeco.com'),
('colex', 'COLEX TANKS TRADING L.L.C', 'CLX', 'colex_seal', 'colex_template', 'colextanks.com');

-- Insert Sales Details (from sales_details.json)
INSERT INTO sales_details (sales_person_name, code, sign_path, designation, phone_number, email_name) VALUES
('Viwin Varghese', 'VV', 'VV_sign', 'Sales Executive', '+971 54 450 4282', 'viwin'),
('Midhun Murali', 'MM', 'MM_sign', 'Business Development Manager', '+971 50 265 3282', 'midhun'),
('Somiya Joy', 'SJ', 'SJ_sign', 'Sales & Administrative Assistant', '+971 50 295 4282', 'sales'),
('AKSHAYA SHAJI', 'AS', 'AS_sign', 'Business Development Executive', '+971 54 382 4282', 'akshaya'),
('Vismay Krishnan', 'VK', 'VK_sign', 'Business Development Executive', '+971 50 911 5210', 'vismay'),
('LEYON PAUL', 'LP', 'LP_sign', 'Business Development Executive', '+971 50 603 4282', 'leyon');

-- Insert Project Manager Details (from project_manager_details.json)
INSERT INTO project_manager_details (manager_name, code, sign_path, designation, phone_number, email_name) VALUES
('Anoop Mohan', 'AM', 'AM_sign', 'Manager - Projects', '+971 50 952 4282', 'anoop'),
('Midhun Murali', 'MM', 'MM_sign', 'Sales Manager', '+971 50 265 3282', 'midhun');

-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=======================================================';
    RAISE NOTICE '   DATABASE SETUP COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '=======================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Database: grp_quotation_fresh';
    RAISE NOTICE '';
    RAISE NOTICE '7 Tables Created:';
    RAISE NOTICE '  1. company_details (3 companies)';
    RAISE NOTICE '  2. recipient_details (empty)';
    RAISE NOTICE '  3. sales_details (6 sales persons)';
    RAISE NOTICE '  4. project_manager_details (2 managers)';
    RAISE NOTICE '  5. default_contractual_terms_specifications (empty)';
    RAISE NOTICE '  6. contractual_terms_specifications (empty)';
    RAISE NOTICE '  7. quotation_webpage_input_details_save (empty)';
    RAISE NOTICE '';
    RAISE NOTICE 'Data Inserted:';
    RAISE NOTICE '  ✓ 3 Companies: GRP, GRP PIPECO, COLEX';
    RAISE NOTICE '  ✓ 6 Sales Persons: VV, MM, SJ, AS, VK, LP';
    RAISE NOTICE '  ✓ 2 Project Managers: AM, MM';
    RAISE NOTICE '';
    RAISE NOTICE 'Company Codes for Quote Numbers:';
    RAISE NOTICE '  - GRPT   (GRP Tanks)';
    RAISE NOTICE '  - GRPPT  (GRP Pipeco)';
    RAISE NOTICE '  - CLX    (Colex)';
    RAISE NOTICE '';
    RAISE NOTICE 'Sales Codes: VV, MM, SJ, AS, VK, LP';
    RAISE NOTICE 'Manager Codes: AM, MM';
    RAISE NOTICE '';
    RAISE NOTICE 'Quote Number Format: CODE/YYMM/SALES/####';
    RAISE NOTICE 'Example: GRPT/2602/VV/0001';
    RAISE NOTICE '';
    RAISE NOTICE '=======================================================';
    RAISE NOTICE 'Ready to create quotations!';
    RAISE NOTICE '=======================================================';
END $$;
