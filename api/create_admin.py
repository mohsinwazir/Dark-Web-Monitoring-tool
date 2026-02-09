
from database_sql import SessionLocal, Base, engine
from models_sql import User
from passlib.context import CryptContext
import logging
import traceback

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Hashing setup (Reduced rounds as per optimization)
pwd_context = CryptContext(
    schemes=["pbkdf2_sha256", "bcrypt"], 
    deprecated="auto",
    pbkdf2_sha256__default_rounds=1000
)

def create_admin_account():
    db = SessionLocal()
    try:
        # Create tables if not exist (just in case)
        Base.metadata.create_all(bind=engine)
        
        username = "admin"
        email = "admin@darkweb.com"
        password = "Password123@"
        
        # Check if exists
        existing_user = db.query(User).filter(User.username == username).first()
        
        hashed_pw = pwd_context.hash(password)
        
        if existing_user:
            logger.info(f"Updating existing admin user: {username}")
            existing_user.hashed_password = hashed_pw
            existing_user.role = "admin"
            existing_user.is_active = True
        else:
            logger.info(f"Creating new admin user: {username}")
            new_user = User(
                username=username,
                email=email,
                hashed_password=hashed_pw,
                organization_name="System Admin",
                role="admin",
                is_active=True,
                assets={},
                preferences={}
            )
            db.add(new_user)
            
        db.commit()
        logger.info("✅ Admin account created/updated successfully.")
        
    except Exception as e:
        logger.error(f"❌ Failed to create admin: {e}")
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_admin_account()
