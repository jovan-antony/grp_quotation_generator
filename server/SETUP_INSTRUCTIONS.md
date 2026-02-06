# PostgreSQL Setup Instructions for GRP Quotation Generator

## Step 1: Create PostgreSQL Database

1. Open **pgAdmin 4** (installed with PostgreSQL)
2. Right-click on "Databases" → "Create" → "Database..."
3. Enter database name: `grp_quotation`
4. Click "Save"

**OR using command line:**

```bash
# Open Command Prompt or PowerShell
psql -U postgres

# Then run:
CREATE DATABASE grp_quotation;
\q
```

## Step 2: Run Database Setup Script

1. Open **pgAdmin 4**
2. Navigate to: Databases → grp_quotation
3. Right-click on `grp_quotation` → "Query Tool"
4. Open file: `server/database/setup.sql`
5. Click "Execute" (F5) to run the script

**OR using command line:**

```bash
# Navigate to your project folder
cd C:\Users\jovan\Downloads\grp_quotation_generator\server

# Run the setup script
psql -U postgres -d grp_quotation -f database/setup.sql
```

## Step 3: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   copy .env.example .env
   ```

2. Edit `.env` file and update with your PostgreSQL credentials:
   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=grp_quotation
   DB_USER=postgres
   DB_PASSWORD=YOUR_ACTUAL_PASSWORD
   ```

## Step 4: Install Python Dependencies

```bash
# Navigate to server folder
cd C:\Users\jovan\Downloads\grp_quotation_generator\server

# Activate virtual environment
venv\Scripts\activate

# Install new dependencies
pip install psycopg2-binary sqlalchemy python-dotenv
```

## Step 5: Test Database Connection

```bash
# Run the test script
python test_db_connection.py
```

You should see:
```
✓ Database connection successful
✓ Found 3 companies
✓ Database is ready to use!
```

## Step 6: Import Excel Data (Optional)

If you have existing data in Excel files, run the import script:

```bash
python import_excel_data.py
```

This will import:
- Sales person details from `sales_person_details.xlsx`
- Project manager details from `Project_manager_details.xlsx`

## Step 7: Start the Server

```bash
# Start the backend server
python api_server.py
```

Server will start at: http://localhost:8000

## Step 8: Test API

Open your browser and go to:
- API Documentation: http://localhost:8000/docs
- Health Check: http://localhost:8000/health

## Troubleshooting

### Issue: Cannot connect to PostgreSQL

**Solution:**
1. Check if PostgreSQL service is running:
   - Open Services (Win + R, type `services.msc`)
   - Look for "postgresql-x64-17" (or your version)
   - Make sure it's "Running"

2. Verify your password:
   ```bash
   psql -U postgres
   # Enter your password
   ```

### Issue: Database does not exist

**Solution:**
```bash
psql -U postgres
CREATE DATABASE grp_quotation;
\q
```

### Issue: Permission denied

**Solution:**
Make sure you're running as administrator or the user has proper permissions.

### Issue: Module not found (psycopg2, sqlalchemy)

**Solution:**
```bash
pip install psycopg2-binary sqlalchemy python-dotenv
```

## Verify Installation

Run this checklist:

- [ ] PostgreSQL is installed and running
- [ ] Database `grp_quotation` exists
- [ ] Tables are created (run setup.sql)
- [ ] `.env` file is configured
- [ ] Python dependencies installed
- [ ] Test connection successful
- [ ] API server starts without errors

## Next Steps

1. Import your existing Excel data
2. Start the frontend (Next.js)
3. Create your first quotation
4. Verify document generation and database storage

## Database Structure

Your database now has these tables:
- `companies` - Company master data
- `users` - Sales and office personnel
- `customers` - Customer information
- `quotations` - Main quotation records
- `quotation_tanks` - Tank details for each quotation
- `quotation_sections` - Terms and conditions sections
- `generated_documents` - Track all generated Word files
- `quotation_history` - Audit trail of changes

All quotations and generated documents will be saved automatically with the quote number!
