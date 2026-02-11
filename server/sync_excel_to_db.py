"""
Sync Excel files with PostgreSQL database
Updates company_details, sales_details, and project_manager_details tables
from their respective Excel files
"""
import pandas as pd
from datetime import datetime
from pathlib import Path
import os
from dotenv import load_dotenv
from database import get_session
from models import CompanyDetails, SalesDetails, ProjectManagerDetails
from sqlmodel import select

# Helper function to get DATA path
def get_data_path():
    """
    Get the DATA path from environment variable or use default.
    DATA folder contains: template/, signs&seals/, default_details/
    Returns absolute path.
    """
    # Get the .env file path (same directory as this script)
    script_dir = os.path.dirname(os.path.abspath(__file__))
    env_file = os.path.join(script_dir, '.env')
    
    # Reload environment variables from .env file with override
    if os.path.exists(env_file):
        load_dotenv(dotenv_path=env_file, override=True)
    
    env_path = os.getenv('DATA_PATH', '').strip()
    
    if env_path:
        if os.path.isabs(env_path):
            data_path = env_path
        else:
            script_dir = os.path.dirname(os.path.abspath(__file__))
            data_path = os.path.join(script_dir, env_path)
    else:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        data_path = os.path.join(script_dir, "DATA")
    
    return os.path.abspath(data_path)

def sync_company_details():
    """Sync company_details.xlsx with company_details table"""
    data_dir = get_data_path()
    excel_path = os.path.join(data_dir, 'default_details/company_details.xlsx')
    excel_file = Path(excel_path)
    temp_file = Path(os.path.join(data_dir, 'default_details/~$company_details.xlsx'))
    
    print("\n" + "="*60)
    print("SYNCING COMPANY DETAILS")
    print("="*60)
    print(f"Looking for Excel file at: {excel_file}")
    
    if not excel_file.exists():
        print(f"❌ File not found: {excel_file}")
        print(f"DATA_PATH environment variable: {os.getenv('DATA_PATH', 'NOT SET')}")
        print(f"Computed data directory: {data_dir}")
        return False
    
    if temp_file.exists():
        print(f"⚠️  WARNING: Excel file appears to be OPEN in another program!")
        print(f"   Close 'company_details.xlsx' and try again.")
        print(f"   Will attempt to read anyway...")
    
    print(f"✓ Excel file found")
    
    session = None
    try:
        # Read Excel file
        df = pd.read_excel(excel_file)
        # Convert column names to uppercase and strip whitespace for consistency
        df.columns = df.columns.str.strip().str.upper()
        print(f"✓ Found {len(df)} companies in Excel file")
        print(f"Excel columns: {list(df.columns)}")
        
        # Get database session
        session_gen = get_session()
        session = next(session_gen)
        
        updated_count = 0
        added_count = 0
        deleted_count = 0
        
        # Track all codes present in Excel
        excel_codes = set()
        
        for idx, row in df.iterrows():
            code = str(row.get('CODE', '')).strip()
            if not code:
                print(f"  ⚠️ Skipping row {idx + 2}: No CODE value")
                continue
            
            excel_codes.add(code)
            
            # Check if company exists
            statement = select(CompanyDetails).where(CompanyDetails.code == code)
            existing = session.exec(statement).first()
            
            full_name = str(row.get('FULL_NAME', '')).strip()
            company_name = str(row.get('COMPANY_NAME', '')).strip().lower()
            seal_path = str(row.get('SEAL_PATH', '')).strip()
            template_path = str(row.get('TEMPLATE_PATH', '')).strip()
            company_domain = str(row.get('COMPANY_DOMAIN', '')).strip()
            company_storage_path = str(row.get('COMPANY_STORAGE_PATH', '')).strip()
            
            if existing:
                # Update existing company
                existing.company_name = company_name
                existing.full_name = full_name
                existing.seal_path = seal_path
                existing.template_path = template_path
                existing.company_domain = company_domain
                existing.company_storage_path = company_storage_path
                existing.last_updated_time = datetime.utcnow()
                session.flush()
                print(f"  ✓ Updated: {full_name} ({code})")
                updated_count += 1
            else:
                # Create new company
                company = CompanyDetails(
                    company_name=company_name,
                    full_name=full_name,
                    code=code,
                    seal_path=seal_path,
                    template_path=template_path,
                    company_domain=company_domain,
                    company_storage_path=company_storage_path,
                    created_time=datetime.utcnow(),
                    last_updated_time=datetime.utcnow()
                )
                session.add(company)
                session.flush()
                print(f"  ✅ Added NEW: {full_name} ({code})")
                added_count += 1
        
        # Delete companies not in Excel file
        all_companies = session.exec(select(CompanyDetails)).all()
        for company in all_companies:
            if company.code not in excel_codes:
                print(f"  🗑️ Deleting removed: {company.full_name} ({company.code})")
                session.delete(company)
                deleted_count += 1
        
        session.commit()
        print(f"\n✅ SUCCESS: {added_count} added, {updated_count} updated, {deleted_count} deleted")
        print(f"{'='*60}\n")
        return True
        
    except Exception as e:
        if session:
            session.rollback()
        print(f"\n❌ ERROR syncing company details: {e}")
        import traceback
        traceback.print_exc()
        print(f"{'='*60}\n")
        return False

def sync_sales_details():
    """Sync sales_details.xlsx with sales_details table"""
    data_dir = get_data_path()
    excel_path = os.path.join(data_dir, 'default_details/sales_details.xlsx')
    excel_file = Path(excel_path)
    temp_file = Path(os.path.join(data_dir, 'default_details/~$sales_details.xlsx'))
    
    print("\n" + "="*60)
    print("SYNCING SALES DETAILS")
    print("="*60)
    print(f"Looking for Excel file at: {excel_file}")
    
    if not excel_file.exists():
        print(f"❌ File not found: {excel_file}")
        print(f"DATA_PATH environment variable: {os.getenv('DATA_PATH', 'NOT SET')}")
        print(f"Computed data directory: {data_dir}")
        return False
    
    if temp_file.exists():
        print(f"⚠️  WARNING: Excel file appears to be OPEN in another program!")
        print(f"   Close 'sales_details.xlsx' and try again.")
        print(f"   Will attempt to read anyway...")
    
    print(f"✓ Excel file found")
    
    session = None
    try:
        # Read Excel file
        df = pd.read_excel(excel_file)
        # Convert column names to uppercase and strip whitespace for consistency
        df.columns = df.columns.str.strip().str.upper()
        print(f"✓ Found {len(df)} sales persons in Excel file")
        print(f"Excel columns: {list(df.columns)}")
        
        # Get database session
        session_gen = get_session()
        session = next(session_gen)
        
        updated_count = 0
        added_count = 0
        deleted_count = 0
        
        # Track all codes present in Excel
        excel_codes = set()
        
        for idx, row in df.iterrows():
            code = str(row.get('CODE', '')).strip()
            if not code:
                print(f"  ⚠️ Skipping row {idx + 2}: No CODE value")
                continue
            
            excel_codes.add(code)
            
            # Check if sales person exists
            statement = select(SalesDetails).where(SalesDetails.code == code)
            existing = session.exec(statement).first()
            
            # Support both old (NAME, MOB, EMAIL) and new (SALES_PERSON_NAME, PHONE_NUMBER, EMAIL_NAME) column names
            name = str(row.get('SALES_PERSON_NAME', row.get('NAME', ''))).strip()
            designation = str(row.get('DESIGNATION', '')).strip()
            phone = str(row.get('PHONE_NUMBER', row.get('MOB', ''))).strip()
            email_name = str(row.get('EMAIL_NAME', '')).strip()
            # If EMAIL_NAME is empty, try to extract from EMAIL column
            if not email_name:
                email = str(row.get('EMAIL', '')).strip()
                email_name = email.split('@')[0] if '@' in email else email
            sign_path = str(row.get('SIGN_PATH', '')).strip()
            
            if existing:
                # Update existing sales person
                existing.sales_person_name = name
                existing.designation = designation
                existing.phone_number = phone
                existing.email_name = email_name
                existing.sign_path = sign_path
                existing.last_updated_time = datetime.utcnow()
                session.flush()
                print(f"  ✓ Updated: {name} ({code})")
                updated_count += 1
            else:
                # Create new sales person
                sales_person = SalesDetails(
                    sales_person_name=name,
                    code=code,
                    sign_path=sign_path,
                    designation=designation,
                    phone_number=phone,
                    email_name=email_name,
                    created_time=datetime.utcnow(),
                    last_updated_time=datetime.utcnow()
                )
                session.add(sales_person)
                session.flush()
                print(f"  ✅ Added NEW: {name} ({code})")
                added_count += 1
        
        # Delete sales persons not in Excel file
        all_sales = session.exec(select(SalesDetails)).all()
        for sales_person in all_sales:
            if sales_person.code not in excel_codes:
                print(f"  🗑️ Deleting removed: {sales_person.sales_person_name} ({sales_person.code})")
                session.delete(sales_person)
                deleted_count += 1
        
        session.commit()
        print(f"\n✅ SUCCESS: {added_count} added, {updated_count} updated, {deleted_count} deleted")
        print(f"{'='*60}\n")
        return True
        
    except Exception as e:
        if session:
            session.rollback()
        print(f"\n❌ ERROR syncing sales details: {e}")
        import traceback
        traceback.print_exc()
        return False

def sync_project_manager_details():
    """Sync project_manager_details.xlsx with project_manager_details table"""
    data_dir = get_data_path()
    excel_path = os.path.join(data_dir, 'default_details/project_manager_details.xlsx')
    excel_file = Path(excel_path)
    temp_file = Path(os.path.join(data_dir, 'default_details/~$project_manager_details.xlsx'))
    
    print("\n" + "="*60)
    print("SYNCING PROJECT MANAGER DETAILS")
    print("="*60)
    print(f"Looking for Excel file at: {excel_file}")
    
    if not excel_file.exists():
        print(f"❌ File not found: {excel_file}")
        print(f"DATA_PATH environment variable: {os.getenv('DATA_PATH', 'NOT SET')}")
        print(f"Computed data directory: {data_dir}")
        return False
    
    if temp_file.exists():
        print(f"⚠️  WARNING: Excel file appears to be OPEN in another program!")
        print(f"   Close 'project_manager_details.xlsx' and try again.")
        print(f"   Will attempt to read anyway...")
    
    print(f"✓ Excel file found")
    
    session = None
    try:
        # Read Excel file
        df = pd.read_excel(excel_file)
        # Convert column names to uppercase and strip whitespace for consistency
        df.columns = df.columns.str.strip().str.upper()
        print(f"✓ Found {len(df)} project managers in Excel file")
        print(f"Excel columns: {list(df.columns)}")
        
        # Get database session
        session_gen = get_session()
        session = next(session_gen)
        
        updated_count = 0
        added_count = 0
        deleted_count = 0
        
        # Track all codes present in Excel
        excel_codes = set()
        
        for idx, row in df.iterrows():
            code = str(row.get('CODE', '')).strip()
            if not code:
                print(f"  ⚠️ Skipping row {idx + 2}: No CODE value")
                continue
            
            excel_codes.add(code)
            
            # Check if project manager exists
            statement = select(ProjectManagerDetails).where(ProjectManagerDetails.code == code)
            existing = session.exec(statement).first()
            
            # Support both old (NAME, MOB, EMAIL) and new (MANAGER_NAME, PHONE_NUMBER, EMAIL_NAME) column names
            name = str(row.get('MANAGER_NAME', row.get('NAME', ''))).strip()
            designation = str(row.get('DESIGNATION', '')).strip()
            phone = str(row.get('PHONE_NUMBER', row.get('MOB', ''))).strip()
            email_name = str(row.get('EMAIL_NAME', '')).strip()
            # If EMAIL_NAME is empty, try to extract from EMAIL column
            if not email_name:
                email = str(row.get('EMAIL', '')).strip()
                email_name = email.split('@')[0] if '@' in email else email
            sign_path = str(row.get('SIGN_PATH', '')).strip()
            
            if existing:
                # Update existing project manager
                existing.manager_name = name
                existing.designation = designation
                existing.phone_number = phone
                existing.email_name = email_name
                existing.sign_path = sign_path
                existing.last_updated_time = datetime.utcnow()
                session.flush()
                print(f"  ✓ Updated: {name} ({code})")
                updated_count += 1
            else:
                # Create new project manager
                manager = ProjectManagerDetails(
                    manager_name=name,
                    code=code,
                    sign_path=sign_path,
                    designation=designation,
                    phone_number=phone,
                    email_name=email_name,
                    created_time=datetime.utcnow(),
                    last_updated_time=datetime.utcnow()
                )
                session.add(manager)
                session.flush()
                print(f"  ✅ Added NEW: {name} ({code})")
                added_count += 1
        
        # Delete project managers not in Excel file
        all_managers = session.exec(select(ProjectManagerDetails)).all()
        for manager in all_managers:
            if manager.code not in excel_codes:
                print(f"  🗑️ Deleting removed: {manager.manager_name} ({manager.code})")
                session.delete(manager)
                deleted_count += 1
        
        session.commit()
        print(f"\n✅ SUCCESS: {added_count} added, {updated_count} updated, {deleted_count} deleted")
        print(f"{'='*60}\n")
        return True
        
    except Exception as e:
        if session:
            session.rollback()
        print(f"\n❌ ERROR syncing project manager details: {e}")
        import traceback
        traceback.print_exc()
        print(f"{'='*60}\n")
        return False

def main():
    """Main function to sync all Excel files"""
    print("\n" + "="*70)
    print("EXCEL TO POSTGRESQL SYNC")
    print("="*70)
    print("\nThis will sync data from Excel files to PostgreSQL database:")
    print("  1. company_details.xlsx → company_details table")
    print("  2. sales_details.xlsx → sales_details table")
    print("  3. project_manager_details.xlsx → project_manager_details table")
    print()
    
    results = {
        'company_details': sync_company_details(),
        'sales_details': sync_sales_details(),
        'project_manager_details': sync_project_manager_details()
    }
    
    print("\n" + "="*70)
    print("SYNC RESULTS")
    print("="*70)
    
    for table_name, success in results.items():
        status = "✓ SUCCESS" if success else "✗ FAILED"
        print(f"{status}: {table_name}")
    
    all_success = all(results.values())
    
    if all_success:
        print("\n✓ All tables synced successfully!")
    else:
        print("\n⚠ Some tables failed to sync. Check the errors above.")
    
    print("="*70 + "\n")
    
    return all_success

if __name__ == "__main__":
    main()
