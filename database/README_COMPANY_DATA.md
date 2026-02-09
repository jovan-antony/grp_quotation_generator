# Setup Database with Your Company Data

This setup creates the database with **your actual company data** from the JSON files.

---

## Quick Setup (RECOMMENDED)

```cmd
cd c:\Users\jovan\Downloads\grp_quotation_generator\database
SETUP_WITH_COMPANY_DATA.bat
```

**What gets created:**
- ✅ All 7 tables with proper structure
- ✅ 3 Companies from company_details.json
- ✅ 6 Sales Persons from sales_details.json
- ✅ 2 Project Managers from project_manager_details.json
- ✅ Empty tables: recipients, contractual terms, quotations

---

## Verify After Setup

```cmd
VERIFY_COMPANY_DATA.bat
```

This will show you all the inserted data.

---

## What Data Gets Inserted

### Companies (3)

| ID | Code  | Company Name | Full Name |
|----|-------|--------------|-----------|
| 1  | GRPT  | grp          | GRP TANKS TRADING L.L.C |
| 2  | GRPPT | grp pipeco   | GRP PIPECO TANKS TRADING L.L.C |
| 3  | CLX   | colex        | COLEX TANKS TRADING L.L.C |

### Sales Persons (6)

| ID | Code | Name            | Designation |
|----|------|-----------------|-------------|
| 1  | VV   | Viwin Varghese  | Sales Executive |
| 2  | MM   | Midhun Murali   | Business Development Manager |
| 3  | SJ   | Somiya Joy      | Sales & Administrative Assistant |
| 4  | AS   | AKSHAYA SHAJI   | Business Development Executive |
| 5  | VK   | Vismay Krishnan | Business Development Executive |
| 6  | LP   | LEYON PAUL      | Business Development Executive |

### Project Managers (2)

| ID | Code | Name          | Designation |
|----|------|---------------|-------------|
| 1  | AM   | Anoop Mohan   | Manager - Projects |
| 2  | MM   | Midhun Murali | Sales Manager |

---

## Quote Number Format

**Format:** `COMPANY_CODE/YYMM/SALES_CODE/QUOTATION_NUMBER`

**Examples:**
- `GRPT/2602/VV/0001` - GRP Tanks, Feb 2026, Viwin, Quote #0001
- `GRPPT/2602/MM/0002` - GRP Pipeco, Feb 2026, Midhun, Quote #0002
- `CLX/2602/SJ/0003` - Colex, Feb 2026, Somiya, Quote #0003

---

## File Structure

```
database/
├── setup_with_company_data.sql      # SQL script with your data
├── SETUP_WITH_COMPANY_DATA.bat      # Run this to setup
├── verify_company_data.sql          # SQL to verify data
├── VERIFY_COMPANY_DATA.bat          # Run this to verify
└── README_COMPANY_DATA.md           # This file
```

---

## Comparison with Other Setup Options

| Setup Type | Companies | Sales | Managers | Use Case |
|-----------|-----------|-------|----------|----------|
| CREATE_EMPTY_TABLES | 0 | 0 | 0 | Manual data entry |
| SETUP_NEW_DATABASE | 3 (samples) | 2 (samples) | 2 (samples) | Testing/Demo |
| **SETUP_WITH_COMPANY_DATA** | **3 (your data)** | **6 (your data)** | **2 (your data)** | **Production** ✅ |

---

## Next Steps After Setup

1. **Verify the data:**
   ```cmd
   VERIFY_COMPANY_DATA.bat
   ```

2. **Add recipients as needed:**
   ```sql
   INSERT INTO recipient_details (recipient_name, to_company_name, email) 
   VALUES ('Client Name', 'Client Company', 'client@email.com');
   ```

3. **Create your first quotation:**
   - Use company_id = 1 (GRPT), 2 (GRPPT), or 3 (CLX)
   - Use sales_person_id = 1-6 (VV, MM, SJ, AS, VK, LP)
   - Use project_manager_id = 1-2 (AM, MM)

4. **Connect your backend:**
   Update `database.py` to use `grp_quotation_fresh`

---

## Source JSON Files

Data is imported from:
- `server/default_details/company_details.json`
- `server/default_details/sales_details.json`
- `server/default_details/project_manager_details.json`

If you need to update the data:
1. Edit the JSON files
2. Re-run `SETUP_WITH_COMPANY_DATA.bat`
3. It will drop and recreate the database with updated data

---

**Ready to use in production!** ✅
