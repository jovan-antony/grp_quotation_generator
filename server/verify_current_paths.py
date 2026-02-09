"""Verify current database paths match actual files"""
import os
from database import engine
from sqlmodel import Session, select
from models import CompanyDetails

print("="*60)
print("VERIFYING TEMPLATE PATHS")
print("="*60)

script_dir = os.path.dirname(__file__)

try:
    session = Session(engine)
    companies = session.exec(select(CompanyDetails)).all()
    
    all_valid = True
    
    for company in companies:
        template_path = company.template_path
        
        # Add .docx extension if not present
        if not template_path.endswith('.docx'):
            template_filename = template_path + '.docx'
        else:
            template_filename = template_path
        
        # Build full path
        full_path = os.path.join(script_dir, template_filename)
        exists = os.path.exists(full_path)
        
        status = "✓" if exists else "✗"
        if not exists:
            all_valid = False
        
        print(f"\n{status} {company.full_name}")
        print(f"  Code: {company.code}")
        print(f"  DB Path: {template_path}")
        print(f"  File: {template_filename}")
        print(f"  Full Path: {full_path}")
        print(f"  Exists: {exists}")
    
    session.close()
    
    print("\n" + "="*60)
    if all_valid:
        print("✅ ALL TEMPLATE PATHS ARE VALID!")
    else:
        print("❌ SOME TEMPLATE PATHS ARE INVALID!")
    print("="*60)
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
