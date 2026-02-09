
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from database_sql import get_db
from models_sql import User
from auth_deps import get_current_user, get_admin_user
from auth import get_password_hash, validate_password_complexity, verify_password
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

router = APIRouter(prefix="/users", tags=["Users"])
admin_router = APIRouter(prefix="/admin/users", tags=["Admin Users"])

# --- Pydantic Models for Validation ---

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    new_password: Optional[str] = None
    preferences: Optional[dict] = None

class UserOut(BaseModel):
    id: str
    username: str
    email: str
    role: str
    is_active: bool
    created_at: datetime
    # last_login: Optional[datetime] = None # Add later if tracked
    
    class Config:
        from_attributes = True

# --- User Endpoints ---

@router.put("/me")
async def update_user_me(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Update basic fields if provided and unique
    if user_update.username and user_update.username != current_user.username:
        if db.query(User).filter(User.username == user_update.username).first():
            raise HTTPException(status_code=400, detail="Username already taken")
        current_user.username = user_update.username

    if user_update.email and user_update.email != current_user.email:
        if db.query(User).filter(User.email == user_update.email).first():
            raise HTTPException(status_code=400, detail="Email already taken")
        current_user.email = user_update.email

    # 2. Update Password (requires current password verification)
    if user_update.new_password:
        if not user_update.password:
             raise HTTPException(status_code=400, detail="Current password required to set new password")
        
        if not verify_password(user_update.password, current_user.hashed_password):
             raise HTTPException(status_code=400, detail="Incorrect current password")
             
        validate_password_complexity(user_update.new_password)
        current_user.hashed_password = get_password_hash(user_update.new_password)

    # 3. Update Preferences
    if user_update.preferences is not None:
        # Merge or replace? Let's merge for flexibility
        current_prefs = dict(current_user.preferences) if current_user.preferences else {}
        current_prefs.update(user_update.preferences)
        current_user.preferences = current_prefs

    db.commit()
    return {"status": "success", "message": "Profile updated"}

# --- Admin Endpoints ---

@admin_router.get("/", response_model=List[UserOut])
async def get_all_users(
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    users = db.query(User).all()
    return users

@admin_router.delete("/{user_id}")
async def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent self-delete
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    db.delete(user)
    db.commit()
    return {"status": "success", "message": f"User {user.username} deleted"}

@admin_router.patch("/{user_id}/role")
async def update_user_role(
    user_id: str,
    role: str = Body(..., embed=True), # Expect JSON: {"role": "admin"}
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if role not in ["user", "admin", "analyst"]:
        raise HTTPException(status_code=400, detail="Invalid role")
        
    user.role = role
    db.commit()
    return {"status": "success", "message": f"User {user.username} role updated to {role}"}
