
from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from database_sql import Base
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    organization_name = Column(String)
    role = Column(String, default="user")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # JSON fields for flexible data
    assets = Column(JSON, default=dict) # threat assets
    preferences = Column(JSON, default=dict) # notif preferences

    # Relationships can be added here if needed
    # api_keys = relationship("APIKey", back_populates="owner")


class CrawledItem(Base):
    __tablename__ = "crawled_items"

    id = Column(String, primary_key=True, default=generate_uuid)
    url = Column(String, index=True)
    title = Column(String)
    text = Column(Text) # Main content
    risk_score = Column(Float, default=0.0)
    conn_type = Column(String) # Tor or Direct
    depth = Column(Integer)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Advanced Forensics
    stego_hidden_text = Column(String, nullable=True)
    stego_image_url = Column(String, nullable=True)
    
    # Analysis
    category = Column(String, nullable=True)
    entities = Column(JSON, default=list) # Extracted entities
    sentiment = Column(String, nullable=True)
    csam_flag = Column(Boolean, default=False)


class DailyReport(Base):
    __tablename__ = "daily_reports"

    id = Column(String, primary_key=True, default=generate_uuid)
    timestamp = Column(DateTime, default=datetime.utcnow)
    findings_count = Column(Integer)
    summary = Column(Text) # AI Summary
    period = Column(String) # e.g. "last_24_hours"


class SeenURL(Base):
    __tablename__ = "seen_urls"

    url_hash = Column(String, primary_key=True) # SHA256 of URL
    url = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    timestamp = Column(DateTime, default=datetime.utcnow)
    actor_username = Column(String)
    action = Column(String)
    details = Column(JSON, default=dict)
    severity = Column(String)
