# 🗄️ Database Quick Reference

## Setup Command
```bash
cd server
SETUP_DATABASE.bat
```

## Database Info
- **Name:** `grp_quotation`
- **Tables:** 6
- **Port:** 5432 (PostgreSQL default)

## Table Summary

| # | Table Name | Purpose | Key Columns |
|---|-----------|---------|-------------|
| 1 | `company_details` | Company info (GRP, PIPECO, COLEX) | code, full_name, template_path, seal_path |
| 2 | `recipient_details` | Client/customer info | recipient_name, to_company_name, email |
| 3 | `sales_details` | Sales person info | sales_person_name, code, sign_path, email_name |
| 4 | `project_manager_details` | Project manager info | manager_name, code, sign_path, email_name |
| 5 | `contractual_terms_specifications` | T&C, warranty, scope | material_specs, warranty, supplier_scope |
| 6 | `quotation_webpage_input_details_save` | Main quotation data | full_main_quote_number, tanks_data (JSONB) |

## Connection String
```
postgresql://postgres:YOUR_PASSWORD@localhost:5432/grp_quotation
```

## Key Features
✓ Auto-timestamps on all tables (created_time, last_updated_time)
✓ JSONB for flexible tank storage (handles varying tanks/options)
✓ Foreign keys linking all tables
✓ Performance indexes
✓ Sample data for 3 companies

## File Paths
| Type | Location | Example |
|------|----------|---------|
| Seals | `signs&seals/` | `grp_seal.png` |
| Signatures | `signs&seals/` | `jv_sign.png` |
| Templates | `server/` | `template_grp.docx` |
| Generated Docs | `Final_Doc/` | `GRP-Q-2026-001-R0.docx` |

## Common Queries

### Get All Quotations
```sql
SELECT * FROM quotation_webpage_input_details_save;
```

### Get Quotation with Details
```sql
SELECT 
    q.full_main_quote_number,
    c.full_name as company,
    r.recipient_name,
    s.sales_person_name,
    q.total_amount,
    q.status
FROM quotation_webpage_input_details_save q
LEFT JOIN company_details c ON q.company_id = c.id
LEFT JOIN recipient_details r ON q.recipient_id = r.id
LEFT JOIN sales_details s ON q.sales_person_id = s.id;
```

### Get Tank Data
```sql
SELECT 
    full_main_quote_number,
    tanks_data
FROM quotation_webpage_input_details_save
WHERE id = 1;
```

## Backup Database
```bash
pg_dump -U postgres grp_quotation > backup.sql
```

## Restore Database
```bash
psql -U postgres grp_quotation < backup.sql
```

## Check Tables
```bash
psql -U postgres -d grp_quotation -c "\dt"
```

## View Table Structure
```bash
psql -U postgres -d grp_quotation -c "\d company_details"
```

## Test Connection
```bash
cd server
python test_db_connection.py
```

---
📚 For detailed documentation, see:
- `DATABASE_STRUCTURE.md` - Complete table details
- `DATABASE_VISUAL_GUIDE.md` - Visual diagrams
- `DATABASE_SETUP_COMPLETE.md` - Setup instructions
