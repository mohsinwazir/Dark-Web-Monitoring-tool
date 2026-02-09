"""
Redis Manager for Fast URL Deduplication
Provides high-speed lookups with SQLite fallback
"""

import logging
import redis
from typing import Optional

logger = logging.getLogger(__name__)


class RedisManager:
    """Manages Redis connection for fast seen_urls lookups"""
    
    def __init__(self, host='localhost', port=6379, db=0):
        """
        Initialize Redis connection
        
        Args:
            host: Redis server host
            port: Redis server port
            db: Redis database number
        """
        self.host = host
        self.port = port
        self.db = db
        self.client = None
        self.available = False
        
        self._connect()
    
    def _connect(self):
        """Attempt to connect to Redis"""
        try:
            self.client = redis.Redis(
                host=self.host,
                port=self.port,
                db=self.db,
                decode_responses=True,
                socket_connect_timeout=2
            )
            # Test connection
            self.client.ping()
            self.available = True
            logger.info(f"[Redis] Connected to {self.host}:{self.port}")
        except (redis.ConnectionError, redis.TimeoutError) as e:
            self.available = False
        except (redis.ConnectionError, redis.TimeoutError) as e:
            self.available = False
            logger.warning(f"[Redis] Connection failed: {e}. URL deduplication will rely on local DB.")
    
    def check_url(self, url_hash: str) -> bool:
        """
        Check if URL hash exists in Redis
        
        Args:
            url_hash: SHA-256 hash of URL
        
        Returns:
            True if URL was seen before, False otherwise
        """
        if not self.available:
            return False
        
        try:
            return self.client.exists(f"seen:{url_hash}") > 0
        except redis.RedisError as e:
            logger.error(f"[Redis] Check failed: {e}")
            return False
    
    def mark_url_seen(self, url_hash: str, url: str, ttl: Optional[int] = None):
        """
        Mark URL as seen in Redis
        
        Args:
            url_hash: SHA-256 hash of URL
            url: Original URL (for debugging)
            ttl: Time to live in seconds (None = never expire)
        """
        if not self.available:
            return
        
        try:
            key = f"seen:{url_hash}"
            self.client.set(key, url)
            
            if ttl:
                self.client.expire(key, ttl)
            
            logger.debug(f"[Redis] Marked as seen: {url_hash[:8]}...")
        except redis.RedisError as e:
            logger.error(f"[Redis] Mark failed: {e}")
    
    def get_stats(self) -> dict:
        """Get Redis statistics"""
        if not self.available:
            return {"available": False}
        
        try:
            info = self.client.info()
            return {
                "available": True,
                "used_memory": info.get("used_memory_human", "unknown"),
                "total_keys": self.client.dbsize(),
                "connected_clients": info.get("connected_clients", 0)
            }
        except redis.RedisError as e:
            logger.error(f"[Redis] Stats failed: {e}")
            return {"available": False, "error": str(e)}
    
    def clear_all(self):
        """Clear all seen URLs from Redis (use with caution!)"""
        if not self.available:
            return
        
        try:
            # Only delete keys with 'seen:' prefix
            for key in self.client.scan_iter("seen:*"):
                self.client.delete(key)
            logger.info("[Redis] Cleared all seen URLs")
        except redis.RedisError as e:
            logger.error(f"[Redis] Clear failed: {e}")


# Global Redis manager instance
_redis_manager = None

def get_redis_manager():
    """Get or create global Redis manager instance"""
    global _redis_manager
    if _redis_manager is None:
        _redis_manager = RedisManager()
    return _redis_manager
