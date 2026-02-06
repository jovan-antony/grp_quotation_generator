"""
Test database connection
"""
from database.config import test_connection, get_db_context
from database.models import Company

def main():
    print("\n" + "="*60)
    print("TESTING DATABASE CONNECTION")
    print("="*60 + "\n")
    
    # Test connection
    if test_connection():
        # Test query
        try:
            with get_db_context() as db:
                companies = db.query(Company).all()
                print(f"\n✓ Found {len(companies)} companies:")
                for company in companies:
                    print(f"  - {company.name} ({company.code})")
                
                print("\n✓ Database is ready to use!")
                return True
        except Exception as e:
            print(f"\n✗ Error querying database: {e}")
            return False
    else:
        print("\n✗ Please check your database configuration")
        return False

if __name__ == "__main__":
    main()
