# Manual Database Setup Commands

If batch files aren't working, run these commands manually:

## Open Command Prompt

1. Press `Win + R`
2. Type `cmd` and press Enter
3. Navigate to database folder:
   ```cmd
   cd c:\Users\jovan\Downloads\grp_quotation_generator\database
   ```

## Run These Commands (One by One)

### Command 1: Create Database
```cmd
psql -U postgres -d postgres -c "DROP DATABASE IF EXISTS grp_quotation_fresh;"
```
Press Enter, enter password: **J0vanAnt0ny**

### Command 2: Create Fresh Database
```cmd
psql -U postgres -d postgres -c "CREATE DATABASE grp_quotation_fresh;"
```

### Command 3: Setup Tables and Data
```cmd
psql -U postgres -d grp_quotation_fresh -f setup_with_company_data.sql
```

### Command 4: Verify (Optional)
```cmd
psql -U postgres -d grp_quotation_fresh -c "\dt"
```

## Expected Result

You should see:
```
                          List of relations
 Schema |                  Name                   | Type  |  Owner
--------+-----------------------------------------+-------+----------
 public | company_details                         | table | postgres
 public | contractual_terms_specifications        | table | postgres
 public | default_contractual_terms_specifications| table | postgres
 public | project_manager_details                 | table | postgres
 public | quotation_webpage_input_details_save    | table | postgres
 public | recipient_details                       | table | postgres
 public | sales_details                           | table | postgres
(7 rows)
```

## Check Data

```cmd
psql -U postgres -d grp_quotation_fresh -c "SELECT code, company_name FROM company_details;"
```

Should show: GRPT, GRPPT, CLX

## If Still Getting "Too Many Clients"

Run Command Prompt **as Administrator**:
```cmd
net stop postgresql-x64-12
net start postgresql-x64-12
```

Then try the setup commands again.
