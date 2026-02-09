
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, APIKeyHeader
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from database_sql import get_db, SessionLocal
from models_sql import User, User as UserDB # Alias for compatibility
import os
import logging
import hashlib

# Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "CHANGE_ME_IN_PRODUCTION_SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 24 Hours

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")
api_key_scheme = APIKeyHeader(name="X-API-KEY")
logger = logging.getLogger(__name__)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        role: str = payload.get("role")
        if username is None:
            raise credentials_exception
        # We don't strictly need TokenData class if we just use local vars
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.username == username).first()
    
    if user is None:
        raise credentials_exception
        
    return user

async def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin": # Check string directly
        # Log unauthorized attempt
        log_audit_event(
            actor=current_user, 
            action="UNAUTHORIZED_ACCESS", 
            details={"endpoint": "admin_restricted"},
            severity="WARNING"
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return current_user

def log_audit_event(actor: User, action: str, details: dict = None, severity: str = "INFO"):
    """
    Helper to create an audit log entry.
    Since this might be called from non-async contexts or without a DB session handy,
    we create a fresh session.
    """
    try:
        # TODO: Implement AuditLog model in models_sql.py if needed.
        # For now, just log to file to ensure migration doesn't break on missing table
        logger.info(f"[AUDIT] {actor.username} -> {action} | {details}")
        
    except Exception as e:
        logger.error(f"[AUDIT_FAIL] Failed to log audit event: {e}")

async def get_api_key_user(api_key: str = Depends(api_key_scheme), db: Session = Depends(get_db)) -> User:
    # Hash the key to find it
    key_hash = hashlib.sha256(api_key.encode()).hexdigest()
    
    # Needs APIKey model in models_sql.py
    # api_key_record = db.query(APIKey).filter(APIKey.key_hash == key_hash).first()
    
    # Placeholder until API Key table is verified
    raise HTTPException(status_code=401, detail="API Key auth under migration")
