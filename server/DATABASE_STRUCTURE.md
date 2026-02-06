# Database Structure Documentation

## Overview
This document describes the 6-table database structure for the GRP Quotation Generator system.

## Database Name
**grp_quotation**

---

## Table Descriptions

### 1. **company_details**
Stores information about different companies (GRP, PIPECO, COLEX, etc.)

| Column Name | Data Type | Description | Example |
|------------|-----------|-------------|---------|
| id | SERIAL (PK) | Auto-incrementing primary key | 1 |
| company_name | VARCHAR(50) | Short company name | grp |
| full_name | VARCHAR(255) | Full company legal name | GRP TANKS TRADING L.L.C |
| code | VARCHAR(10) UNIQUE | Company code | GRP |
| seal_path | VARCHAR(500) | Path to company seal/stamp image | signs&seals/grp_seal.png |
| template_path | VARCHAR(500) | Path to Word document template | template_grp.docx |
| company_domain | VARCHAR(100) | Email domain | @grptanks.com |
| created_time | TIMESTAMP | Auto-generated creation time | 2026-02-05 10:30:00 |
| last_updated_time | TIMESTAMP | Auto-updated modification time | 2026-02-05 15:45:00 |

**Sample Data:**
- GRP TANKS TRADING L.L.C
- GRP PIPECO TANKS TRADING L.L.C  
- COLEX TANKS TRADING L.L.C

---

### 2. **recipient_details**
Stores information about quotation recipients (clients/customers)

| Column Name | Data Type | Description | Example |
|------------|-----------|-------------|---------|
| id | SERIAL (PK) | Auto-incrementing primary key | 1 |
| recipient_name | VARCHAR(255) | Name of the person | umar farooq |
| role_of_recipient | VARCHAR(100) | Job role/title | jr engineer |
| to_company_name | VARCHAR(255) | Client company name | bhagatti |
| to_company_location | VARCHAR(255) | Company location | ajman, UAE |
| phone_number | VARCHAR(50) | Contact phone number | +971 8524569634 |
| email | VARCHAR(255) | Full email address | umar@bhagatti.com |
| created_time | TIMESTAMP | Auto-generated creation time | 2026-02-05 10:30:00 |
| last_updated_time | TIMESTAMP | Auto-updated modification time | 2026-02-05 15:45:00 |

---

### 3. **sales_details**
Stores information about sales personnel

| Column Name | Data Type | Description | Example |
|------------|-----------|-------------|---------|
| id | SERIAL (PK) | Auto-incrementing primary key | 1 |
| sales_person_name | VARCHAR(255) | Full name of sales person | jovan antony |
| code | VARCHAR(10) UNIQUE | Employee code | jv |
| sign_path | VARCHAR(500) | Path to signature image file | signs&seals/jv_sign.png |
| designation | VARCHAR(100) | Job title | Sales Manager |
| phone_number | VARCHAR(50) | Contact number | +971 50 123 4567 |
| email_name | VARCHAR(100) | Email username before @ | jovan |
| created_time | TIMESTAMP | Auto-generated creation time | 2026-02-05 10:30:00 |
| last_updated_time | TIMESTAMP | Auto-updated modification time | 2026-02-05 15:45:00 |

**Note:** Email is stored as just the username (before @). The full email is constructed by combining `email_name` + company domain from `company_details`.

---

### 4. **project_manager_details**
Stores information about project managers

| Column Name | Data Type | Description | Example |
|------------|-----------|-------------|---------|
| id | SERIAL (PK) | Auto-incrementing primary key | 1 |
| manager_name | VARCHAR(255) | Full name of project manager | jovan antony |
| code | VARCHAR(10) UNIQUE | Employee code | jv |
| sign_path | VARCHAR(500) | Path to signature image file | signs&seals/jv_sign.png |
| designation | VARCHAR(100) | Job title | Project Manager |
| phone_number | VARCHAR(50) | Contact number | +971 50 123 4567 |
| email_name | VARCHAR(100) | Email username before @ | jovan |
| created_time | TIMESTAMP | Auto-generated creation time | 2026-02-05 10:30:00 |
| last_updated_time | TIMESTAMP | Auto-updated modification time | 2026-02-05 15:45:00 |

**Note:** Same person can be in both sales_details and project_manager_details with potentially different roles.

---

### 5. **contractual_terms_specifications**
Stores contractual terms, specifications, and scope details for quotations

| Column Name | Data Type | Description | Example |
|------------|-----------|-------------|---------|
| id | SERIAL (PK) | Auto-incrementing primary key | 1 |
| note | TEXT | General notes | Important project notes... |
| material_specifications | TEXT | Technical material specifications | GRP material grade, thickness... |
| warranty_conditions | TEXT | Warranty terms and conditions | 12 months warranty on... |
| terms_and_conditions | TEXT | General T&C | Payment terms, delivery... |
| supplier_scope | TEXT | Supplier responsibilities | Design, manufacture, deliver... |
| customer_scope | TEXT | Customer responsibilities | Site preparation, power supply... |
| scope_of_work | TEXT | Detailed work scope | Full scope details... |
| work_excluded | TEXT | Items not included | Installation, civil work... |
| created_time | TIMESTAMP | Auto-generated creation time | 2026-02-05 10:30:00 |
| last_updated_time | TIMESTAMP | Auto-updated modification time | 2026-02-05 15:45:00 |

---

### 6. **quotation_webpage_input_details_save**
Main table storing all quotation form inputs from the webpage. Uses JSONB for flexible storage of varying tank configurations.

| Column Name | Data Type | Description | Example |
|------------|-----------|-------------|---------|
| id | SERIAL (PK) | Auto-incrementing primary key | 1 |
| full_main_quote_number | VARCHAR(100) UNIQUE | Complete quotation number | GRP-Q-2026-001-R0 |
| final_doc_file_path | VARCHAR(500) | Path to generated Word document | Final_Doc/GRP-Q-2026-001-R0.docx |
| company_id | INTEGER (FK) | References company_details.id | 1 |
| recipient_id | INTEGER (FK) | References recipient_details.id | 5 |
| sales_person_id | INTEGER (FK) | References sales_details.id | 2 |
| project_manager_id | INTEGER (FK) | References project_manager_details.id | 2 |
| contractual_terms_id | INTEGER (FK) | References contractual_terms_specifications.id | 1 |
| quotation_date | DATE | Date of quotation | 2026-02-05 |
| subject | TEXT | Quotation subject line | Supply of GRP Water Tanks |
| project_location | TEXT | Project location details | Dubai Marina, Dubai |
| tanks_data | JSONB | Flexible storage for tank details | See example below |
| additional_data | JSONB | Any extra form data | {"notes": "..."} |
| subtotal | DECIMAL(15,2) | Subtotal amount | 150000.00 |
| discount_percentage | DECIMAL(5,2) | Discount percentage | 5.00 |
| discount_amount | DECIMAL(15,2) | Discount amount | 7500.00 |
| tax_percentage | DECIMAL(5,2) | Tax/VAT percentage | 5.00 |
| tax_amount | DECIMAL(15,2) | Tax/VAT amount | 7125.00 |
| total_amount | DECIMAL(15,2) | Final total amount | 149625.00 |
| status | VARCHAR(50) | Quote status | draft, sent, approved, rejected |
| revision_number | INTEGER | Revision number | 0, 1, 2... |
| created_time | TIMESTAMP | Auto-generated creation time | 2026-02-05 10:30:00 |
| last_updated_time | TIMESTAMP | Auto-updated modification time | 2026-02-05 15:45:00 |

#### JSONB Structure for tanks_data

The `tanks_data` column stores tank information in JSON format, allowing flexibility for varying numbers of tanks and options:

```json
[
  {
    "tank_number": 1,
    "tank_name": "Storage Tank A",
    "quantity": 2,
    "has_partition": false,
    "tank_type": "Rectangular",
    "dimensions": {
      "length": "10",
      "width": "5",
      "height": "3",
      "unit": "M"
    },
    "capacity": {
      "total_m3": 150,
      "usg": 39627,
      "img": 32996
    },
    "freeboard": {
      "need_freeboard": true,
      "freeboard_size": "0.3",
      "net_volume": 135
    },
    "pricing": {
      "unit_price": "15000",
      "total_price": 30000
    },
    "options": ["Option A", "Option B"]
  },
  {
    "tank_number": 2,
    "tank_name": "Storage Tank B",
    "quantity": 1,
    ...
  }
]
```

---

## Automatic Features

### 1. **Auto-Timestamps**
All tables have automatic timestamp management:
- `created_time`: Set automatically when record is created
- `last_updated_time`: Updated automatically whenever record is modified

### 2. **Indexes**
Performance indexes created on:
- `full_main_quote_number` (quotation_webpage_input_details_save)
- `quotation_date` (quotation_webpage_input_details_save)
- `status` (quotation_webpage_input_details_save)
- `company_id` (quotation_webpage_input_details_save)

### 3. **Foreign Key Relationships**
- quotation_webpage_input_details_save → company_details
- quotation_webpage_input_details_save → recipient_details
- quotation_webpage_input_details_save → sales_details
- quotation_webpage_input_details_save → project_manager_details
- quotation_webpage_input_details_save → contractual_terms_specifications

---

## Setup Instructions

### 1. Install PostgreSQL
Download and install PostgreSQL from: https://www.postgresql.org/download/

### 2. Run the Setup Script
```bash
cd server
SETUP_DATABASE.bat
```

This will:
1. Check PostgreSQL installation
2. Create the `grp_quotation` database
3. Create all 6 tables with triggers
4. Insert sample company data
5. Set up Python environment
6. Configure environment variables

### 3. Verify Installation
The script will test the database connection automatically.

---

## Database Connection

**Connection String:**
```
postgresql://postgres:postgres@localhost:5432/grp_quotation
```

**Environment Variable (.env):**
```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/grp_quotation
```

---

## File Naming Convention

### Document Files
Generated quotation documents are named using the full quote number:
- Format: `[full_main_quote_number].docx`
- Example: `GRP-Q-2026-001-R0.docx`
- Location: `Final_Doc/` folder

### Seal/Signature Files
- Company seals: `signs&seals/[company]_seal.png`
- Employee signatures: `signs&seals/[code]_sign.png`

### Template Files
- Company templates: `template_[company].docx`
- Examples: `template_grp.docx`, `template_pipeco.docx`

---

## Query Examples

### Get all quotations for a specific company:
```sql
SELECT q.*, c.company_name, c.full_name
FROM quotation_webpage_input_details_save q
JOIN company_details c ON q.company_id = c.id
WHERE c.code = 'GRP';
```

### Get quotation with full details:
```sql
SELECT 
    q.*,
    c.full_name as company_name,
    r.recipient_name,
    r.to_company_name,
    s.sales_person_name,
    p.manager_name
FROM quotation_webpage_input_details_save q
LEFT JOIN company_details c ON q.company_id = c.id
LEFT JOIN recipient_details r ON q.recipient_id = r.id
LEFT JOIN sales_details s ON q.sales_person_id = s.id
LEFT JOIN project_manager_details p ON q.project_manager_id = p.id
WHERE q.full_main_quote_number = 'GRP-Q-2026-001-R0';
```

### Extract tank information from JSONB:
```sql
SELECT 
    full_main_quote_number,
    jsonb_array_elements(tanks_data) as tank
FROM quotation_webpage_input_details_save
WHERE id = 1;
```

---

## Backup and Maintenance

### Backup Database:
```bash
pg_dump -U postgres grp_quotation > backup_grp_quotation.sql
```

### Restore Database:
```bash
psql -U postgres grp_quotation < backup_grp_quotation.sql
```

### View Table Structure:
```sql
\d+ company_details
\d+ recipient_details
\d+ sales_details
\d+ project_manager_details
\d+ contractual_terms_specifications
\d+ quotation_webpage_input_details_save
```

---

## Notes

1. **Brackets in Column Names**: As specified, details within brackets in the original specification are NOT used as column names but are examples/notes.

2. **Email Handling**: Email names in sales_details and project_manager_details are stored without the domain. Full email is constructed by combining with company domain.

3. **File Paths**: All file paths (seal_path, sign_path, template_path, final_doc_file_path) are relative to the server directory.

4. **JSONB Flexibility**: The tanks_data JSONB column allows the system to handle:
   - Variable number of tanks per quotation
   - Different tank configurations
   - Different options per tank
   - Future field additions without schema changes

5. **Status Values**: Quotation status can be: draft, sent, approved, rejected

6. **Revision Tracking**: The revision_number field tracks quotation revisions (0 = original, 1+ = revisions)

---

## Support

For database issues:
1. Check PostgreSQL is running: `psql --version`
2. Test connection: `python test_db_connection.py`
3. Review logs in PostgreSQL log directory
4. Verify .env file configuration
