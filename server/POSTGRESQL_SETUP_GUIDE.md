# PostgreSQL Setup Guide for GRP Quotation Generator

This document provides complete step-by-step instructions for setting up PostgreSQL and integrating it with the GRP Quotation Generator application.

---

## Prerequisites

- Windows 10 or later
- Administrator access to install software
- Python 3.11 or later installed

---

## Part 1: Install PostgreSQL

### Step 1: Download PostgreSQL

1. Visit https://www.postgresql.org/download/windows/
2. Download the latest PostgreSQL installer (version 18 or later recommended)
3. Run the installer as Administrator

### Step 2: Installation Settings

During installation, configure the following:

- **Installation Directory:** `C:\Program Files\PostgreSQL\18` (default)
- **Components to Install:**
  - PostgreSQL Server ✓
  - pgAdmin 4 ✓
  - Stack Builder (optional)
  - Command Line Tools ✓
- **Data Directory:** Accept default
- **Password:** Set a strong password for the postgres superuser
  - **IMPORTANT:** Remember this password! You will need it later.
- **Port:** `5432` (default)
- **Locale:** Accept default (or choose your preferred locale)

### Step 3: Complete Installation

1. Click "Next" through the remaining screens
2. Wait for installation to complete
3. Uncheck "Stack Builder" at the end (not needed)
4. Click "Finish"

---

## Part 2: Configure System PATH

### Step 1: Find PostgreSQL bin Directory

1. Open File Explorer
2. Navigate to: `C:\Program Files\PostgreSQL\18\bin`
3. Copy the full path from the address bar

### Step 2: Add to System PATH

1. Press `Win + S` on your keyboard
2. Type: `environment variables`
3. Click: "Edit the system environment variables"
4. In the System Properties window, click: "Environment Variables…"
5. Under "System variables" (lower section), find and select: `Path`
6. Click: "Edit…"
7. Click: "New"
8. Paste the path: `C:\Program Files\PostgreSQL\18\bin`
9. Click: "OK" on all dialogs to save

### Step 3: Restart

**IMPORTANT:** Restart your computer or log out and log back in for the PATH changes to take effect.

---

## Part 3: Verify Installation

### Test PostgreSQL Command Line Tools

1. Open a new **Command Prompt** (not PowerShell):
   - Press `Win + R`
   - Type: `cmd`
   - Press Enter

2. Run the following command:
   ```
   psql --version
   ```

3. You should see output like:
   ```
   psql (PostgreSQL) 18.1
   ```

If you see this, PostgreSQL is correctly installed and accessible.

---

## Part 4: Configure pgAdmin 4

### Step 1: Open pgAdmin 4

1. Open pgAdmin 4 from the Start Menu
2. Wait for it to load in your browser

### Step 2: Create Server Connection

1. In the left sidebar, right-click on: **Servers**
2. Select: **Create → Server...**

### Step 3: Configure Connection (General Tab)

- **Name:** `LocalDB` (or any descriptive name)
- **Server group:** Servers
- **Background:** (leave default)
- **Foreground:** (leave default)
- **Connect now?** ✓ (checked)

### Step 4: Configure Connection (Connection Tab)

- **Host name/address:** `localhost`
- **Port:** `5432`
- **Maintenance database:** `postgres`
- **Username:** `postgres`
- **Save password?** ✓ (toggle ON)
- **Password:** Enter the password you set during installation
- **Role:** (leave empty)

### Step 5: Save

1. Click: "Save"
2. You should now see your server in the left sidebar
3. Expand it to see the "Databases" folder

---

## Part 5: Set PostgreSQL Password

### Step 1: Open Query Tool

1. In pgAdmin, right-click on your server (e.g., "LocalDB")
2. Select: "Query Tool"

### Step 2: Set Password

1. In the Query Tool, enter this SQL command:
   ```sql
   ALTER USER postgres WITH PASSWORD 'YourPasswordHere';
   ```
   **Replace `YourPasswordHere` with your chosen password**

2. Click the **Execute** button (lightning bolt icon) or press F5

3. You should see:
   ```
   ALTER ROLE
   Query returned successfully in 72 msec.
   ```

---

## Part 6: Create the Database

### Step 1: Create Database

1. In the Query Tool, run:
   ```sql
   CREATE DATABASE grp_quotation;
   ```

2. Click Execute

3. You should see:
   ```
   CREATE DATABASE
   Query returned successfully in 15 msec.
   ```

### Step 2: Verify

1. In the left sidebar, expand "Databases"
2. You should see `grp_quotation` listed

---

## Part 7: Configure Authentication (Optional but Recommended)

### Step 1: Locate pg_hba.conf

1. Open File Explorer
2. Navigate to: `C:\Program Files\PostgreSQL\18\data\pg_hba.conf`
3. Right-click → "Open with" → "Notepad"
4. If prompted, click "Run as Administrator"

### Step 2: Verify Authentication Settings

Scroll to the bottom of the file and ensure these lines are present:

```
# IPv4 local connections:
host    all             all             127.0.0.1/32            scram-sha-256
# IPv6 local connections:
host    all             all             ::1/128                 scram-sha-256
```

If they say `md5` or `trust`, you can change them to `scram-sha-256` for better security.

### Step 3: Restart PostgreSQL Service

1. Press `Win + R`
2. Type: `services.msc`
3. Press Enter
4. Find: `postgresql-x64-18`
5. Right-click → "Restart"
6. Wait for the service to restart

---

## Part 8: Project Setup

### Step 1: Navigate to Project Directory

1. Open Command Prompt
2. Navigate to your project's server folder:
   ```
   cd C:\path\to\grp_quotation_generator\server
   ```

### Step 2: Install Python Dependencies

Run the following commands:

```
pip install psycopg2-binary==2.9.11
pip install sqlalchemy==2.0.23
pip install python-dotenv==1.0.0
```

Wait for all packages to install successfully.

---

## Part 9: Create Project Database Structure

### Step 1: Create database Folder

In your project's `server` folder, create a new folder named: `database`

### Step 2: Create Required Files

Inside the `database` folder, create these files:

#### File 1: `__init__.py`
Create an **empty file** named `__init__.py`
(This makes the folder a Python package)

#### File 2: `config.py`
Create `config.py` with this content:

```python
"""
Database configuration and connection management
"""
import os
from dotenv import load_dotenv
load_dotenv()
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from contextlib import contextmanager

# Database Configuration
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': os.getenv('DB_PORT', '5432'),
    'database': os.getenv('DB_NAME', 'grp_quotation'),
    'user': os.getenv('DB_USER', 'postgres'),
    'password': os.getenv('DB_PASSWORD', 'postgres'),
}

# Construct database URL
DATABASE_URL = f"postgresql://{DB_CONFIG['user']}:{DB_CONFIG['password']}@{DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']}"

# Create engine
engine = create_engine(
    DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    echo=False
)

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class
Base = declarative_base()

@contextmanager
def get_db_context():
    """Context manager for database session"""
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

def test_connection():
    """Test database connection"""
    try:
        with engine.connect() as connection:
            print("✓ Database connection successful")
            print(f"Connected to: {DB_CONFIG['database']} at {DB_CONFIG['host']}:{DB_CONFIG['port']}")
            return True
    except Exception as e:
        print(f"✗ Database connection failed: {e}")
        return False
```

---

## Part 10: Configure Environment Variables

### Step 1: Create .env File

In the `server` folder (not inside database), create a file named: `.env`

### Step 2: Add Configuration

Add this content to the `.env` file:

```
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=grp_quotation
DB_USER=postgres
DB_PASSWORD=YourPasswordHere

# Application Configuration
APP_ENV=development
DEBUG=True

# Server Configuration
API_HOST=0.0.0.0
API_PORT=8000
```

**IMPORTANT:** 
- Replace `YourPasswordHere` with the password you set for PostgreSQL
- This password must match exactly what you configured earlier
- No spaces around the `=` sign
- No quotes around the password

---

## Part 11: Create Test Script

### Step 1: Create test_db_connection.py

In the `server` folder, create a file named: `test_db_connection.py`

### Step 2: Add Test Code

```python
import sys
print("=" * 60)
print("TESTING DATABASE CONNECTION")
print("=" * 60)
print()

from database.config import test_connection

if test_connection():
    print()
    print("✓ Setup complete! Your database is ready.")
else:
    print()
    print("✗ Please check your database configuration")
```

---

## Part 12: Test the Setup

### Step 1: Run the Test

1. Open Command Prompt in the `server` folder
2. Run:
   ```
   python test_db_connection.py
   ```

### Step 2: Verify Success

You should see output like:

```
============================================================
TESTING DATABASE CONNECTION
============================================================

✓ Database connection successful
Connected to: grp_quotation at localhost:5432

✓ Setup complete! Your database is ready.
```

**If you see this message, congratulations! Your PostgreSQL setup is complete.**

---

## Troubleshooting

### Problem: 'psql' is not recognized

**Solution:**
1. Verify PostgreSQL bin is in your PATH (Part 2)
2. Restart your computer
3. Open a NEW Command Prompt and try again

---

### Problem: Password authentication failed

**Solution:**
1. Verify your password in pgAdmin by connecting manually
2. Open `.env` file and ensure `DB_PASSWORD` matches exactly
3. No extra spaces or quotes
4. Run the test again

---

### Problem: ModuleNotFoundError: No module named 'database.config'

**Solution:**
1. Ensure `__init__.py` exists in the `database` folder
2. Run the test from the `server` folder, not from inside `database`
3. Make sure you're in the correct directory:
   ```
   cd C:\path\to\grp_quotation_generator\server
   python test_db_connection.py
   ```

---

### Problem: ModuleNotFoundError: No module named 'psycopg2'

**Solution:**
```
pip install psycopg2-binary
```

---

### Problem: scram-sha-256 authentication error

**Solution:**
1. Upgrade psycopg2:
   ```
   pip install --upgrade psycopg2-binary
   ```
2. Verify pg_hba.conf has `scram-sha-256` (Part 7)
3. Restart PostgreSQL service

---

## Verification Checklist

Before proceeding, ensure all these items are checked:

- [ ] PostgreSQL 18 installed
- [ ] PostgreSQL bin added to system PATH
- [ ] Computer restarted after PATH change
- [ ] `psql --version` works in Command Prompt
- [ ] pgAdmin 4 configured with server connection
- [ ] postgres user password set
- [ ] grp_quotation database created
- [ ] Python packages installed (psycopg2-binary, sqlalchemy, python-dotenv)
- [ ] `database` folder created with `__init__.py` and `config.py`
- [ ] `.env` file created with correct password
- [ ] `test_db_connection.py` created
- [ ] Test script runs successfully

---

## Final Notes

### Security Best Practices

1. **Never commit `.env` to version control**
   - Add `.env` to your `.gitignore` file

2. **Use strong passwords**
   - For production servers, use complex passwords

3. **Regular backups**
   - Set up automated database backups

### Getting Help

If you encounter issues not covered in this guide:

1. Check PostgreSQL logs: `C:\Program Files\PostgreSQL\18\data\log\`
2. Verify PostgreSQL service is running in Windows Services
3. Ensure no other application is using port 5432

---

## Summary

Your GRP Quotation Generator is now connected to PostgreSQL. You can:
- Store quotation data persistently
- Retrieve quotations by quote number
- Save generated Word documents to the database
- Import Excel data for sales and project managers

**Next Steps:**
- Run your application's database migrations
- Import initial data
- Start the backend server
- Begin using the quotation generator

---

*Document Version: 1.0*  
*Last Updated: February 4, 2026*  
*For: GRP Quotation Generator Project*
