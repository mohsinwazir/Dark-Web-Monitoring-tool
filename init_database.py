
import sys
import os

# Put api in path
sys.path.append(os.path.join(os.path.dirname(__file__), 'api'))

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'api'))

# Import directly as if inside api package to match app behavior
from database_sql import engine, Base
from models_sql import User, CrawledItem, DailyReport, SeenURL
from auth import get_password_hash

def init_db():
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables created.")
    
    from sqlalchemy.orm import sessionmaker
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    
    # Seed Admin
    print("Seeding admin...")
    admin = db.query(User).filter(User.username == "admin").first()
    if not admin:
        hashed_pw = get_password_hash("Password123@")
        new_admin = User(
            username="admin",
            email="admin@darkweb.com",
            hashed_password=hashed_pw,
            organization_name="System Admin",
            role="admin",
            assets={},
            preferences={}
        )
        db.add(new_admin)
        db.commit()
        print("✅ Admin user seeded.")
    else:
        print("✅ Admin user already exists.")
    
    db.close()

if __name__ == "__main__":
    init_db()
