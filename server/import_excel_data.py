"""
Import Excel data into PostgreSQL database
"""
import pandas as pd
import os
from database.config import get_db_context
from database.models import User, Company

def import_sales_data():
    """Import sales person details"""
    try:
        if not os.path.exists('sales_person_details.xlsx'):
            print("⚠ sales_person_details.xlsx not found")
            return
        
        df = pd.read_excel('sales_person_details.xlsx')
        print(f"\nImporting {len(df)} sales persons...")
        
        with get_db_context() as db:
            for _, row in df.iterrows():
                # Check if user already exists
                existing = db.query(User).filter(User.code == row['CODE']).first()
                if existing:
                    print(f"  ⊘ {row['NAME']} already exists, skipping...")
                    continue
                
                # Get company (default to GRPPT)
                company = db.query(Company).filter(Company.code == 'GRPPT').first()
                
                user = User(
                    username=row['CODE'].lower(),
                    full_name=row['NAME'],
                    code=row['CODE'],
                    mobile=str(row.get('MOB', '')),
                    designation=row.get('DESIGNATION', 'Sales Executive'),
                    role='Sales',
                    company_id=company.id if company else None,
                    email_grptanks=row.get('EMAIL-GRPTANKS', ''),
                    email_pipeco=row.get('EMAIL-PIPECO', ''),
                    email_colex=row.get('EMAIL-COLEX', ''),
                    is_active=True
                )
                
                # Set signature path if exists
                signs_dir = 'signs&seals'
                for ext in ['.png', '.jpg', '.jpeg']:
                    sign_path = f"{signs_dir}/{row['CODE']}_sign{ext}"
                    if os.path.exists(sign_path):
                        user.signature_path = sign_path
                        break
                
                db.add(user)
                print(f"  ✓ Added {row['NAME']} ({row['CODE']})")
        
        print("✓ Sales data imported successfully")
    except Exception as e:
        print(f"✗ Error importing sales data: {e}")

def import_pm_data():
    """Import project manager details"""
    try:
        if not os.path.exists('Project_manager_details.xlsx'):
            print("⚠ Project_manager_details.xlsx not found")
            return
        
        df = pd.read_excel('Project_manager_details.xlsx')
        print(f"\nImporting {len(df)} project managers...")
        
        with get_db_context() as db:
            for _, row in df.iterrows():
                # Check if user already exists
                existing = db.query(User).filter(User.code == row['CODE']).first()
                if existing:
                    print(f"  ⊘ {row['NAME']} already exists, skipping...")
                    continue
                
                # Get company (default to GRPPT)
                company = db.query(Company).filter(Company.code == 'GRPPT').first()
                
                user = User(
                    username=row['CODE'].lower(),
                    full_name=row['NAME'],
                    code=row['CODE'],
                    mobile=str(row.get('MOB', '')),
                    designation=row.get('DESIGNATION', 'Manager - Projects'),
                    role='Office',
                    company_id=company.id if company else None,
                    email_grptanks=row.get('EMAIL-GRPTANKS', ''),
                    email_pipeco=row.get('EMAIL-PIPECO', ''),
                    email_colex=row.get('EMAIL-COLEX', ''),
                    is_active=True
                )
                
                # Set signature path if exists
                signs_dir = 'signs&seals'
                for ext in ['.png', '.jpg', '.jpeg']:
                    sign_path = f"{signs_dir}/{row['CODE']}_sign{ext}"
                    if os.path.exists(sign_path):
                        user.signature_path = sign_path
                        break
                
                db.add(user)
                print(f"  ✓ Added {row['NAME']} ({row['CODE']})")
        
        print("✓ Project manager data imported successfully")
    except Exception as e:
        print(f"✗ Error importing PM data: {e}")

def main():
    print("\n" + "="*60)
    print("IMPORTING EXCEL DATA TO DATABASE")
    print("="*60)
    
    import_sales_data()
    import_pm_data()
    
    print("\n" + "="*60)
    print("IMPORT COMPLETE")
    print("="*60 + "\n")

if __name__ == "__main__":
    main()
