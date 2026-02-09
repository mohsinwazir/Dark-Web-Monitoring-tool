
import sys
import os

# Add api to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'api'))

from database_sql import SessionLocal
from models_sql import User
from auth import get_password_hash

def reset_admin():
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.username == "admin").first()
        if admin:
            print(f"Found admin user. Hash before: {admin.hashed_password[:20]}...")
            new_hash = get_password_hash("Password123@")
            admin.hashed_password = new_hash
            db.commit()
            print(f"✅ Admin password forced reset to 'Password123@'. Hash now: {new_hash[:20]}...")
        else:
            print("❌ Admin user not found! Seeding...")
            new_hash = get_password_hash("Password123@")
            new_admin = User(
                username="admin",
                email="admin@darkweb.com",
                hashed_password=new_hash,
                role="admin",
                assets={}, preferences={}
            )
            db.add(new_admin)
            db.commit()
            print("✅ Admin user created.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    reset_admin()
