
from fastapi import APIRouter, HTTPException, Depends, status, Body
from fastapi.security import OAuth2PasswordRequestForm
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from database_sql import get_db
from models_sql import User, User as UserDB # Alias
from models import UserCreate, UserUpdatePreferences # Keep Pydantic models for input validation
from auth_deps import create_access_token, get_current_user, log_audit_event, ACCESS_TOKEN_EXPIRE_MINUTES
from datetime import timedelta
import logging
import re
import pyotp
import qrcode
import io
import base64

# Setup password hashing
pwd_context = CryptContext(
    schemes=["pbkdf2_sha256", "bcrypt"], 
    deprecated="auto",
    pbkdf2_sha256__default_rounds=1000
)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])

def get_password_hash(password):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def validate_password_complexity(password: str):
    """
    Enforce strong passwords:
    - At least 8 chars
    - Mixed case
    - At least one number
    """
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long")
    if not re.search(r"[A-Z]", password):
        raise HTTPException(status_code=400, detail="Password must contain at least one uppercase letter")
    if not re.search(r"[a-z]", password):
        raise HTTPException(status_code=400, detail="Password must contain at least one lowercase letter")
    if not re.search(r"\d", password):
        raise HTTPException(status_code=400, detail="Password must contain at least one number")
    return True

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(user_in: UserCreate, db: Session = Depends(get_db)):
    
    # 1. Check if user exists
    if db.query(User).filter(User.email == user_in.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(User).filter(User.username == user_in.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")

    # 2. Enforce Password Complexity
    validate_password_complexity(user_in.password)

    # 3. Create assets/preferences data (stored as JSON)
    assets_dict = {
        "monitored_keywords": user_in.keywords,
        "monitored_domains": user_in.target_domains,
        "vip_names": user_in.vip_names
    }
    
    # 4. Create User Object
    new_user = User(
        username=user_in.username,
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        organization_name=user_in.organization_name,
        role=user_in.role.value if hasattr(user_in.role, 'value') else user_in.role, # Handle Enum
        assets=assets_dict,
        preferences={}, # Default
    )

    # 5. Save to DB
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    logger.info(f"[Auth] New user registered: {user_in.email}")
    
    return {
        "status": "success", 
        "message": "User registered successfully", 
        "user_id": new_user.id
    }

@router.post("/login")
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    # Find user
    user = db.query(User).filter(User.username == form_data.username).first()
    
    if not user:
        logger.warning(f"[Auth] Login failed: User '{form_data.username}' not found")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not verify_password(form_data.password, user.hashed_password):
        logger.warning(f"[Auth] Login failed: Password mismatch for '{form_data.username}'")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Generate Token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role},
        expires_delta=access_token_expires
    )
    
    # Log Audit
    log_audit_event(user, "LOGIN", {"ip": "unknown"}, severity="INFO") 

    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "role": user.role,
        "username": user.username
    }
