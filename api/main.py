
import sys
import os

print(f"DEBUG: sys.path: {sys.path}")
print(f"DEBUG: CWD: {os.getcwd()}")
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    import database_sql
    print("DEBUG: database_sql imported successfully from main preamble.")
except ImportError as e:
    print(f"DEBUG: Failed to import database_sql: {e}")

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from sqlalchemy import desc, func, or_
import subprocess
import logging
import asyncio
from typing import List, Optional
from datetime import datetime, timedelta
import os
import json

from database_sql import get_db, engine, Base
from models_sql import User, CrawledItem, DailyReport, SeenURL
# from report_generator import get_report_generator
# from scheduler import get_scheduler
from redis_manager import get_redis_manager
from pdf_generator import get_pdf_generator
from notification_manager import get_notification_manager
from auth_deps import get_current_user, get_admin_user, log_audit_event
from auth import router as auth_router

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Config
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="Dark Web Intelligence API",
    description="RBAC Enabled Threat Intel System (SQLite Edition)",
    version="2.2.0"
)

# Middleware
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.include_router(auth_router)

# User Management Routers
from routers import users
app.include_router(users.router)
app.include_router(users.admin_router)

# Security Middleware
from security_middleware import AuditMiddleware
app.add_middleware(AuditMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

active_connections = []

# Startup/Shutdown
@app.on_event("startup")
async def startup_event():
    logger.info("Startup Event Skipped (Already handled by init_database.py)")
    pass

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("[API] Shutdown complete")

# --- Endpoints ---

@app.get("/")
@limiter.limit("60/minute")
async def root(request: Request):
    """Public Health Check"""
    return {"status": "active", "system": "Dark Web Intel (SQL)", "auth": "JWT Required"}

# Global Crawler Status
CRAWL_STATUS = {
    "running": False,
    "scope": "hybrid"
}

@app.get("/admin/crawl/status")
async def get_crawl_status(current_user: User = Depends(get_current_user)):
    return CRAWL_STATUS

@app.get("/items")
async def search_items(
    q: Optional[str] = None,
    category: Optional[str] = None,
    risk_score: Optional[float] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(CrawledItem)
    
    if q:
        # Simple text search (SQLite LIKE)
        search = f"%{q}%"
        query = query.filter(or_(
            CrawledItem.title.ilike(search),
            CrawledItem.text.ilike(search),
            CrawledItem.url.ilike(search)
        ))
        
    if category and category != "All":
        query = query.filter(CrawledItem.category == category)
        
    if risk_score:
        query = query.filter(CrawledItem.risk_score >= risk_score)
        
    items = query.order_by(desc(CrawledItem.timestamp)).limit(limit).all()
    return items

@app.post("/admin/crawl")
@limiter.limit("5/minute")
async def admin_start_crawl(
    request: Request,
    background_tasks: BackgroundTasks,
    scope: str = "hybrid", # clearnet, darkweb, hybrid
    current_user: User = Depends(get_admin_user)
):
    global CRAWL_STATUS
    if CRAWL_STATUS["running"]:
        return JSONResponse(status_code=400, content={"message": "Crawl already in progress"})
        
    try:
        log_audit_event(current_user, "START_CRAWL", {"ip": request.client.host, "scope": scope}, "HIGH")
        
        # Update Status immediately (Optimistic UI)
        CRAWL_STATUS["running"] = True
        CRAWL_STATUS["scope"] = scope
        
        # Run crawler as a subprocess in background
        def run_crawler_subprocess(target_scope):
            global CRAWL_STATUS
            logger.info(f"[Crawler] Starting subprocess (Scope: {target_scope})...")
            try:
                # Assuming api/ is CWD, crawler is at ../crawler
                crawler_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "crawler"))
                
                cmd = ["scrapy", "crawl", "crawler", "-a", f"scope={target_scope}"]
                
                result = subprocess.run(
                    cmd, 
                    cwd=crawler_dir, 
                    capture_output=True, 
                    text=True
                )
                
                if result.returncode == 0:
                    logger.info(f"[Crawler] Success: {result.stdout[-200:]}")
                else:
                    logger.error(f"[Crawler] Failed: {result.stderr}")
                    
            except Exception as ex:
                logger.error(f"[Crawler] Subprocess error: {ex}")
            finally:
                CRAWL_STATUS["running"] = False
                logger.info("[Crawler] Process finished")

        background_tasks.add_task(run_crawler_subprocess, scope)
        
        return {"status": "success", "message": f"Crawler started ({scope}) in background"}
    except Exception as e:
        logger.error(f"[Crawler] Error: {e}")
        return JSONResponse(status_code=500, content={"message": str(e)})

@app.post("/user/watchlist")
async def update_watchlist(
    keywords: List[str], 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Update assets.monitored_keywords
    # Need to fetch, deserialized, update, serialize?
    # SQLAlchemy with JSON type handles persistence usually.
    
    current_assets = dict(current_user.assets) if current_user.assets else {}
    current_keywords = set(current_assets.get("monitored_keywords", []))
    current_keywords.update(keywords)
    
    current_assets["monitored_keywords"] = list(current_keywords)
    current_user.assets = current_assets
    
    db.commit()
    
    log_audit_event(current_user, "UPDATE_WATCHLIST", {"keywords": keywords})
    return {"status": "success", "message": f"Added {len(keywords)} keywords"}

@app.get("/stats")
async def get_stats(request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        # Simplified stats for now
        # 1. Total findings
        total = db.query(CrawledItem).count()
        
        # 2. Risk distribution?
        # Manually aggregate for SQLite simplicity
        # Or just return raw counts for categories if we had them
        
        # Fetch a sample to guess categories or just hardcode
        high_risk = db.query(CrawledItem).filter(CrawledItem.risk_score >= 0.8).count()
        medium_risk = db.query(CrawledItem).filter(CrawledItem.risk_score >= 0.5, CrawledItem.risk_score < 0.8).count()
        low_risk = total - high_risk - medium_risk
        
        stats = {
            "categories": ["High Risk", "Medium Risk", "Low Risk"],
            "counts": [high_risk, medium_risk, low_risk],
            "total": total,
            "view_mode": "GLOBAL" # TODO: Personalized
        }
        return stats
    except Exception as e:
        logger.error(f"[Stats] Error: {e}")
        return JSONResponse(status_code=500, content={"message": str(e)})

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)
    logger.info("[WebSocket] Client connected")
    
    try:
        from database_sql import SessionLocal
        
        # 1. Send recent history immediately
        db = SessionLocal()
        try:
            recent_items = db.query(CrawledItem).order_by(CrawledItem.timestamp.desc()).limit(50).all()
            # Send in reverse order (oldest -> newest) so client log looks right, OR just send as is and let client sort.
            # Let's send oldest first for "log" feel.
            for item in reversed(recent_items):
                msg = {
                    "url": item.url,
                    "title": item.title,
                    "label": item.category,
                    "risk_score": item.risk_score,
                    "csam_flag": item.csam_flag,
                    "timestamp": item.timestamp.isoformat(),
                    "entities": item.entities or {}
                }
                await websocket.send_json(msg)
        except Exception as e:
            logger.error(f"[WebSocket] History fetch error: {e}")
        finally:
            db.close()

        last_check = datetime.utcnow()
        
        while True:
            # Poll for new high risk items since last check
            db = SessionLocal()
            try:
                # Query recent items (simulate "live" feed with any recent item)
                # In production, strictly query > last_check
                
                query = db.query(CrawledItem).filter(CrawledItem.timestamp > last_check).order_by(CrawledItem.timestamp.asc())
                new_items = query.all()
                
                if new_items:
                    for item in new_items:
                        # Serialize
                        msg = {
                            "url": item.url,
                            "title": item.title,
                            "label": item.category,
                            "risk_score": item.risk_score,
                            "csam_flag": item.csam_flag,
                            "timestamp": item.timestamp.isoformat(),
                            "entities": item.entities or {}
                        }
                        await websocket.send_json(msg)
                        logger.info(f"[WebSocket] Sent update: {item.title}")
                    
                    # Update last_check to the latest item's timestamp
                    last_check = new_items[-1].timestamp
                
            except Exception as e:
                logger.error(f"[WebSocket] Polling error: {e}")
            finally:
                db.close()
            
            await asyncio.sleep(3) # Poll every 3 seconds
            
    except WebSocketDisconnect:
        active_connections.remove(websocket)
        logger.info("[WebSocket] Client disconnected")
    except Exception as e:
        logger.error(f"[WebSocket] Error: {e}")
        if websocket in active_connections:
            active_connections.remove(websocket)

@app.post("/generate-report")
@limiter.limit("10/hour")
async def generate_report(request: Request, current_user: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    try:
        # Get report generator (needs refactor?)
        from report_generator import ReportGenerator 
        # Assuming ReportGenerator can work with list of dicts/objects
        
        # Fetch items
        twenty_four_hours_ago = datetime.utcnow() - timedelta(days=1)
        high_risk_items = db.query(CrawledItem).filter(
            CrawledItem.risk_score >= 0.8
            # CrawledItem.timestamp >= twenty_four_hours_ago # Timestamp might be string or datetime?
        ).order_by(desc(CrawledItem.timestamp)).limit(50).all()
        
        if not high_risk_items:
             return {"status": "success", "message": "No high risks found", "report": None}

        # Convert to list of dicts for generator
        docs = [item.__dict__ for item in high_risk_items] 
        # Clean up SQLAlchemy state
        for d in docs: 
            d.pop('_sa_instance_state', None)
            
        report_gen = ReportGenerator() # Instantiate directly
        summary = report_gen.create_executive_summary(docs)
        
        report = DailyReport(
            findings_count=len(docs),
            summary=summary,
            period="last_24_hours"
        )
        db.add(report)
        db.commit()
        db.refresh(report)
        
        return {
            "status": "success",
            "report": {
                "id": report.id,
                "timestamp": report.timestamp.isoformat(),
                "summary": summary
            }
        }
    except Exception as e:
        logger.error(f"[API] Report gen failed: {e}")
        return JSONResponse(status_code=500, content={"message": str(e)})

@app.get("/reports")
async def get_reports(limit: int = 10, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    reports = db.query(DailyReport).order_by(desc(DailyReport.timestamp)).limit(limit).all()
    formatted = []
    for r in reports:
        formatted.append({
            "id": r.id,
            "timestamp": r.timestamp.isoformat(),
            "findings_count": r.findings_count,
            "summary": r.summary
        })
    return {"reports": formatted}

# --- Forensics ---
from forensics.stego import scan_image
from pydantic import BaseModel

class StegoRequest(BaseModel):
    image_url: str

class YaraRequest(BaseModel):
    threat_name: str
    indicators: List[str]

from intel.yara_gen import generate_yara_rule

@app.post("/forensics/stego")
async def stego_analysis(request: StegoRequest, current_user: User = Depends(get_current_user)):
    try:
        secret = scan_image(request.image_url)
        return {"has_hidden_text": bool(secret), "text": secret if secret else None}
    except Exception as e:
        return JSONResponse(status_code=500, content={"message": str(e)})

@app.post("/intel/yara")
async def create_yara_rule(request: YaraRequest, current_user: User = Depends(get_current_user)):
    rule = generate_yara_rule(request.threat_name, request.indicators)
    return {"rule": rule}

# Chat
from chat_service import get_chat_service
class ChatRequest(BaseModel):
    message: str

@app.post("/chat")
async def chat_endpoint(request: ChatRequest, current_user: User = Depends(get_current_user)):
    try:
        service = get_chat_service()
        
        # Generator wrapper to stream chunks
        async def generate():
            async for chunk in service.stream_chat(request.message):
                yield chunk

        return StreamingResponse(generate(), media_type="text/plain")
        
    except Exception as e:
        return JSONResponse(status_code=500, content={"message": str(e)})

# Stats endpoints placeholders
@app.get("/trending")
async def get_trending():
    # Placeholder
    return {"trends": []}

@app.get("/historical-trends")
async def get_historical_trends():
    return {"trends": []}
    
@app.get("/entity-graph/{entity}")
async def get_graph(entity: str):
    return {"nodes": [], "edges": []}


if __name__ == "__main__":
    import uvicorn
    # Use reload=False to avoid subprocess path issues in this specific debug context
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=False)
