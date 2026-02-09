# GRP Quotation Database - Fresh Setup

## Overview

This folder contains everything needed to create a **fresh, clean PostgreSQL database** for the GRP Quotation Generator system - without any connection issues from the old database.

---

## Folder Structure

```
database/
├── create_empty_tables.sql      # SQL: Empty tables only (no data)
├── CREATE_EMPTY_TABLES.bat      # Setup: Empty tables (recommended)
├── setup_database.sql           # SQL: Tables + sample data
├── SETUP_NEW_DATABASE.bat       # Setup: Tables + sample data
├── test_database.sql            # Test queries
├── TEST_DATABASE.bat            # Run tests
├── README.md                    # This file
├── QUICK_REFERENCE.md           # SQL query examples
└── DATABASE_SPECIFICATION.md    # Complete specification document
```

---

## Quick Start

### Option 1: Setup with Your Company Data (⭐ RECOMMENDED for Production)

**Creates database with your actual company data from JSON files**

1. **Navigate to this folder:**
   ```cmd
   cd c:\Users\jovan\Downloads\grp_quotation_generator\database
   ```
2. **Run the setup:**
   ```cmd
   SETUP_WITH_COMPANY_DATA.bat
   ```
3. **Enter your PostgreSQL password** when prompted

Result: Database `grp_quotation_fresh` with:
- ✅ 3 Companies (GRPT, GRPPT, CLX) from JSON
- ✅ 6 Sales Persons (VV, MM, SJ, AS, VK, LP) from JSON
- ✅ 2 Project Managers (AM, MM) from JSON
- ✅ Empty recipient, contractual terms, and quotation tables

**Verify data:**
```cmd
VERIFY_COMPANY_DATA.bat
```

### Option 2: Empty Tables Only

**Creates database with 7 empty tables - no sample data**

1. **Navigate to this folder:**
   ```cmd
   cd c:\Users\jovan\Downloads\grp_quotation_generator\database
   ```
2. **Run the setup:**
   ```cmd
   CREATE_EMPTY_TABLES.bat
   ```
3. **Enter your PostgreSQL password** when prompted

Result: Database `grp_quotation_fresh` with all 7 empty tables (structure only)

### Option 3: With Sample Data (For Testing)

**Creates database with 7 tables AND sample data for testing**

1. **Navigate to this folder:**
   ```cmd
   cd c:\Users\jovan\Downloads\grp_quotation_generator\database
   ```
2. **Run the setup:**
   ```cmd
   SETUP_NEW_DATABASE.bat
   ```
3. **Enter your PostgreSQL password** when prompted

Result: Database `grp_quotation_fresh` with all 7 tables + sample companies, sales persons, etc.

---

## What Gets Created

### Database Name
**`grp_quotation_fresh`** (new database, no conflicts)

### 7 Tables

1. **company_details** - Company information (GRP, PIPECO, COLEX)
2. **recipient_details** - Client/customer information
3. **sales_details** - Sales personnel
4. **project_manager_details** - Project managers
5. **default_contractual_terms_specifications** - Template terms
6. **contractual_terms_specifications** - Quotation-specific terms
7. **quotation_webpage_input_details_save** - Main quotation data

### Features

✅ **Auto-generated quote numbers** (Format: `GRP/2602/JV/0001`)  
✅ **JSONB columns** for flexible tank data storage  
✅ **Triggers** for auto-updating timestamps  
✅ **Foreign keys** connecting all tables  
✅ **Indexes** for fast queries  
✅ **Views** for easy data retrieval  
✅ **Revision tracking** with notes column  

### Sample Data (for testing)

- 3 Companies: GRP, PIPECO, COLEX
- 2 Sales persons: Jovan Antony (JV), Ahmed Ali (AA)
- 2 Project managers: Jovan Antony (JV), Sarah Khan (SK)
- 2 Recipients: Umar Farooq, Ali Hassan

---

## Manual Setup (if batch file doesn't work)

```powershell
# Set password
$env:PGPASSWORD = "your_password"

# Create database
psql -U postgres -c "CREATE DATABASE grp_quotation_fresh;"

# Run setup script
psql -U postgres -d grp_quotation_fresh -f setup_database.sql
```

---

## Verify Setup

### Check tables were created:

```sql
-- Connect to the database
psql -U postgres -d grp_quotation_fresh

-- List all tables
\dt

-- Expected output:
-- company_details
-- recipient_details
-- sales_details
-- project_manager_details
-- default_contractual_terms_specifications
-- contractual_terms_specifications
-- quotation_webpage_input_details_save
```

### Check sample data:

```sql
-- View companies
SELECT * FROM company_details;

-- View sales persons
SELECT * FROM sales_details;

-- View project managers
SELECT * FROM project_manager_details;

-- View recipients
SELECT * FROM recipient_details;
```

---

## Database Schema Highlights

### Quote Number System

**User inputs:** `0001` (4-digit quotation number)  
**System generates:** `GRP/2602/JV/0001`

Components:
- `GRP` = Company code
- `2602` = Year/Month (Feb 2026)
- `JV` = Sales person code
- `0001` = Quotation number

### JSONB Storage

**tanks_data** column stores unlimited tanks with unlimited options:

```json
{
  "numberOfTanks": 2,
  "tanks": [
    {
      "tankNumber": 1,
      "options": [
        {
          "optionNumber": 1,
          "tankName": "Water Storage Tank",
          "quantity": 2,
          "dimensions": {...},
          "capacity": {...},
          "pricing": {...}
        }
      ]
    }
  ]
}
```

**Contractual terms** sections store arrays of points:

```json
["Point 1", "Point 2", "Point 3"]
```

---

## Advantages of Fresh Database

✅ **No connection limits** - Clean slate, no stuck connections  
✅ **No conflicts** - Separate from old `grp_quotation` database  
✅ **Latest structure** - Includes all 7 tables with latest features  
✅ **Tested sample data** - Ready to test immediately  
✅ **Revision column** - Track changes to quotations  

---

## Troubleshooting

### Problem: "Database already exists"

**Solution:** Either:
1. Use existing database (it's already set up)
2. Drop and recreate:
   ```sql
   DROP DATABASE grp_quotation_fresh;
   ```
   Then run setup again.

### Problem: "Password authentication failed"

**Solution:** Make sure you enter the correct PostgreSQL password (the one you set during installation).

### Problem: "psql: command not found"

**Solution:** PostgreSQL is not in your PATH. Use full path:
```cmd
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d grp_quotation_fresh
```

---

## Next Steps

1. ✅ Run `SETUP_NEW_DATABASE.bat`
2. ✅ Verify tables with pgAdmin or psql
3. ✅ Test inserting a quotation
4. ⏳ Connect backend (api_server.py) to use `grp_quotation_fresh`
5. ⏳ Connect frontend to backend
6. ⏳ Start generating quotations!

---

## Database Connection Info

**For Backend Configuration:**

```python
DB_CONFIG = {
    "dbname": "grp_quotation_fresh",
    "user": "postgres",
    "password": "your_password",
    "host": "localhost",
    "port": "5432"
}
```

---

## Support

If you encounter any issues:

1. Check PostgreSQL service is running
2. Verify password is correct
3. Check firewall isn't blocking port 5432
4. Review error messages in the console output

---

**Created:** February 7, 2026  
**Database:** grp_quotation_fresh  
**Tables:** 7  
**Status:** Ready to use ✅
