from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from enum import Enum
from datetime import datetime
import uuid

# --- Enums ---
class UserRole(str, Enum):
    ADMIN = "admin"
    USER = "user"

class ReportFrequency(str, Enum):
    DAILY = "Daily"
    WEEKLY = "Weekly"
    INSTANT = "Instant"
    NONE = "None"

class AlertSeverity(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"

# --- Shared Models ---
class ThreatAssets(BaseModel):
    monitored_keywords: List[str] = Field(default=[])
    monitored_domains: List[str] = Field(default=[])
    vip_names: List[str] = Field(default=[])

class NotificationPreferences(BaseModel):
    report_frequency: ReportFrequency = ReportFrequency.DAILY
    alert_severity: AlertSeverity = AlertSeverity.HIGH

# --- Auth Models ---
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    username: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

# --- User Models ---
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    organization_name: str
    role: UserRole = UserRole.USER # Default to USER
    
    # Onboarding convenience
    target_domains: List[str] = [] 
    keywords: List[str] = []       
    vip_names: List[str] = []      

class UserDB(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), alias="_id")
    username: str
    email: EmailStr
    hashed_password: str
    organization_name: str
    role: UserRole
    assets: ThreatAssets
    preferences: NotificationPreferences
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True
    
    # 2FA Fields
    two_factor_secret: Optional[str] = None
    two_factor_enabled: bool = False

    class Config:
        populate_by_name = True

class UserUpdatePreferences(BaseModel):
    assets: Optional[ThreatAssets] = None
    preferences: Optional[NotificationPreferences] = None

# --- Feature Models ---
class APIKey(BaseModel):
    name: str
    key_hash: str
    user_id: str
    username: str
    scopes: List[str] = ["read"]
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_used: Optional[datetime] = None

class Watchlist(BaseModel):
    user_id: str
    keywords: List[str] = []
    domains: List[str] = []
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class AuditLog(BaseModel):
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    actor_id: str
    actor_username: str
    action: str  # e.g., "START_CRAWL", "UPDATE_WATCHLIST"
    details: dict = {}
    severity: str = "INFO"

class CrawlResult(BaseModel):
    url: str
    title: str
    risk_score: float
    label: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    matched_user_ids: List[str] = [] # Users whose watchlist triggered this

