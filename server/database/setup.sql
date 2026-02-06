-- GRP Quotation Generator Database Setup
-- Run this script to create all necessary tables and initial data

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS quotation_webpage_input_details_save CASCADE;
DROP TABLE IF EXISTS contractual_terms_specifications CASCADE;
DROP TABLE IF EXISTS project_manager_details CASCADE;
DROP TABLE IF EXISTS sales_details CASCADE;
DROP TABLE IF EXISTS recipient_details CASCADE;
DROP TABLE IF EXISTS company_details CASCADE;

-- ============================================================================
-- TABLE 1: COMPANY_DETAILS
-- ============================================================================
CREATE TABLE company_details (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(50) NOT NULL,              -- eg. grp
    full_name VARCHAR(255) NOT NULL,                -- eg. GRP TANKS TRADING L.L.C
    code VARCHAR(10) UNIQUE NOT NULL,               -- eg. GRP
    seal_path VARCHAR(500),                         -- eg. grp_seal (path to seal/stamp image)
    template_path VARCHAR(500),                     -- eg. template_grp.docx
    company_domain VARCHAR(100),                    -- eg. @grptanks.com
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger to auto-update last_updated_time
CREATE OR REPLACE FUNCTION update_last_updated_time()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated_time = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_company_details_timestamp
    BEFORE UPDATE ON company_details
    FOR EACH ROW
    EXECUTE FUNCTION update_last_updated_time();

-- Insert sample data
INSERT INTO company_details (company_name, full_name, code, seal_path, template_path, company_domain) VALUES
('grp', 'GRP TANKS TRADING L.L.C', 'GRP', 'signs&seals/grp_seal.png', 'template_grp.docx', '@grptanks.com'),
('pipeco', 'GRP PIPECO TANKS TRADING L.L.C', 'PIPECO', 'signs&seals/pipeco_seal.png', 'template_pipeco.docx', '@grppipeco.com'),
('colex', 'COLEX TANKS TRADING L.L.C', 'COLEX', 'signs&seals/colex_seal.png', 'template_colex.docx', '@colextanks.com');

-- ============================================================================
-- TABLE 2: RECIPIENT_DETAILS
-- ============================================================================
CREATE TABLE recipient_details (
    id SERIAL PRIMARY KEY,
    recipient_name VARCHAR(255) NOT NULL,           -- eg. umar farooq
    role_of_recipient VARCHAR(100),                 -- eg. jr engineer
    to_company_name VARCHAR(255),                   -- eg. bhagatti
    to_company_location VARCHAR(255),               -- eg. ajman, UAE
    phone_number VARCHAR(50),                       -- eg. +971 8524569634
    email VARCHAR(255),                             -- full email address
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_recipient_details_timestamp
    BEFORE UPDATE ON recipient_details
    FOR EACH ROW
    EXECUTE FUNCTION update_last_updated_time();

-- ============================================================================
-- TABLE 3: SALES_DETAILS
-- ============================================================================
CREATE TABLE sales_details (
    id SERIAL PRIMARY KEY,
    sales_person_name VARCHAR(255) NOT NULL,        -- eg. jovan antony
    code VARCHAR(10) UNIQUE NOT NULL,               -- eg. jv
    sign_path VARCHAR(500),                         -- eg. jv_sign (path to signature image)
    designation VARCHAR(100),                       -- job title/designation
    phone_number VARCHAR(50),                       -- contact number
    email_name VARCHAR(100),                        -- name before @ (eg. jovan for jovan@grptanks.com)
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_sales_details_timestamp
    BEFORE UPDATE ON sales_details
    FOR EACH ROW
    EXECUTE FUNCTION update_last_updated_time();

-- ============================================================================
-- TABLE 4: PROJECT_MANAGER_DETAILS
-- ============================================================================
CREATE TABLE project_manager_details (
    id SERIAL PRIMARY KEY,
    manager_name VARCHAR(255) NOT NULL,             -- eg. jovan antony
    code VARCHAR(10) UNIQUE NOT NULL,               -- eg. jv
    sign_path VARCHAR(500),                         -- eg. jv_sign (path to signature image)
    designation VARCHAR(100),                       -- job title/designation
    phone_number VARCHAR(50),                       -- contact number
    email_name VARCHAR(100),                        -- name before @ (eg. jovan for jovan@grptanks.com)
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_project_manager_details_timestamp
    BEFORE UPDATE ON project_manager_details
    FOR EACH ROW
    EXECUTE FUNCTION update_last_updated_time();

-- ============================================================================
-- TABLE 5: CONTRACTUAL_TERMS_SPECIFICATIONS
-- ============================================================================
CREATE TABLE contractual_terms_specifications (
    id SERIAL PRIMARY KEY,
    note TEXT,                                      -- general notes
    material_specifications TEXT,                   -- material specs
    warranty_conditions TEXT,                       -- warranty terms
    terms_and_conditions TEXT,                      -- T&C
    supplier_scope TEXT,                            -- supplier responsibilities
    customer_scope TEXT,                            -- customer responsibilities
    scope_of_work TEXT,                             -- work scope details
    work_excluded TEXT,                             -- excluded items
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_contractual_terms_specifications_timestamp
    BEFORE UPDATE ON contractual_terms_specifications
    FOR EACH ROW
    EXECUTE FUNCTION update_last_updated_time();

-- ============================================================================
-- TABLE 6: QUOTATION_WEBPAGE_INPUT_DETAILS_SAVE
-- This table stores all form inputs from the quotation webpage
-- It's flexible to accommodate varying number of tanks and options
-- ============================================================================
CREATE TABLE quotation_webpage_input_details_save (
    id SERIAL PRIMARY KEY,
    full_main_quote_number VARCHAR(100) UNIQUE NOT NULL,  -- eg. GRP-Q-2026-001-R0
    final_doc_file_path VARCHAR(500),               -- eg. Final_Doc/GRP-Q-2026-001-R0.docx
    
    -- Reference to other tables
    company_id INTEGER REFERENCES company_details(id),
    recipient_id INTEGER REFERENCES recipient_details(id),
    sales_person_id INTEGER REFERENCES sales_details(id),
    project_manager_id INTEGER REFERENCES project_manager_details(id),
    contractual_terms_id INTEGER REFERENCES contractual_terms_specifications(id),
    
    -- Quotation header details
    quotation_date DATE,
    subject TEXT,
    project_location TEXT,
    
    -- Tank details stored as JSONB for flexibility
    -- This allows varying number of tanks with varying options
    tanks_data JSONB,                               
    -- Example structure:
    -- [
    --   {
    --     "tank_number": 1,
    --     "tank_name": "Storage Tank A",
    --     "quantity": 2,
    --     "dimensions": {"length": 10, "width": 5, "height": 3},
    --     "unit": "meters",
    --     "unit_price": 15000,
    --     "total_price": 30000,
    --     "options": ["option1", "option2"]
    --   },
    --   ...
    -- ]
    
    -- Additional form data stored as JSONB for flexibility
    additional_data JSONB,
    
    -- Totals and calculations
    subtotal DECIMAL(15, 2),
    tax_percentage DECIMAL(5, 2),
    tax_amount DECIMAL(15, 2),
    total_amount DECIMAL(15, 2),
    
    -- Status tracking
    status VARCHAR(50) DEFAULT 'draft',             -- draft, sent, approved, rejected
    revision_number INTEGER DEFAULT 0,
    
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_quotation_webpage_input_details_save_timestamp
    BEFORE UPDATE ON quotation_webpage_input_details_save
    FOR EACH ROW
    EXECUTE FUNCTION update_last_updated_time();

-- Create indexes for better query performance
CREATE INDEX idx_quote_number ON quotation_webpage_input_details_save(full_main_quote_number);
CREATE INDEX idx_quotation_date ON quotation_webpage_input_details_save(quotation_date);
CREATE INDEX idx_status ON quotation_webpage_input_details_save(status);
CREATE INDEX idx_company ON quotation_webpage_input_details_save(company_id);

-- ============================================================================
-- SETUP COMPLETE MESSAGE
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=================================================';
    RAISE NOTICE '   DATABASE SETUP COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '=================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Tables created:';
    RAISE NOTICE '  1. company_details';
    RAISE NOTICE '  2. recipient_details';
    RAISE NOTICE '  3. sales_details';
    RAISE NOTICE '  4. project_manager_details';
    RAISE NOTICE '  5. contractual_terms_specifications';
    RAISE NOTICE '  6. quotation_webpage_input_details_save';
    RAISE NOTICE '';
    RAISE NOTICE 'Sample data:';
    RAISE NOTICE '  - 3 companies inserted (GRP, PIPECO, COLEX)';
    RAISE NOTICE '';
    RAISE NOTICE 'Features:';
    RAISE NOTICE '  - Auto-update timestamps on all tables';
    RAISE NOTICE '  - Indexes for optimized queries';
    RAISE NOTICE '  - JSONB support for flexible tank data';
    RAISE NOTICE '';
    RAISE NOTICE '=================================================';
END $$;
