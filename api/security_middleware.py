from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from database_sql import SessionLocal
from models_sql import AuditLog
from jose import jwt
import os
import logging
from datetime import datetime

# We need the secret key to decode token manually in middleware if needed, 
# though usually we rely on dependencies. For middleware, we often just check headers.
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "CHANGE_ME_IN_PRODUCTION_SECRET_KEY")
ALGORITHM = "HS256"

logger = logging.getLogger(__name__)

class AuditMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # Only log state-changing methods or specific paths
        if request.method in ["POST", "PUT", "DELETE"]:
            # We explicitly exclude login/register to avoid logging passwords or clutter
            # But specific security events like Login are logged in auth.py
            path = request.url.path
            
            if not path.startswith("/auth/"): 
                # Try to identify user from header without validating (validation happens in endpoint)
                auth_header = request.headers.get("Authorization")
                username = "anonymous"
                
                if auth_header and auth_header.startswith("Bearer "):
                    token = auth_header.split(" ")[1]
                    try:
                        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
                        username = payload.get("sub", "unknown")
                        # In a real app we might look up user_id from DB or put it in token
                    except:
                        pass
                
                # Log to DB
                try:
                    db = SessionLocal()
                    log_entry = AuditLog(
                        timestamp=datetime.utcnow(),
                        actor_username=username,
                        action=f"{request.method} {path}",
                        details={
                            "ip": request.client.host,
                            "user_agent": request.headers.get("user-agent"),
                            "status_code": response.status_code
                        },
                        severity="INFO"
                    )
                    db.add(log_entry)
                    db.commit()
                    db.close()
                except Exception as e:
                    logger.error(f"[AuditMiddleware] Failed to log: {e}")
                    
        return response
