from celery import Celery
import subprocess
import os
import logging

# Configure Logging
logger = logging.getLogger(__name__)

# Initialize Celery
# Ensure you have a running Redis instance on localhost:6379
app = Celery(
    'worker',
    broker='redis://localhost:6379/0',
    backend='redis://localhost:6379/0'
)

@app.task(bind=True)
def run_spider_task(self):
    """
    Celery task to run the Scrapy spider.
    """
    try:
        project_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "crawler"))
        
        logger.info(f"[Worker] Starting crawler in {project_dir}")
        
        # Run Scrapy as a subprocess
        # capturing output could be useful for logging
        process = subprocess.Popen(
            ["scrapy", "crawl", "crawler"],
            cwd=project_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            # Windows specific flag to hide window
            creationflags=subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0
        )
        
        stdout, stderr = process.communicate()
        
        if process.returncode == 0:
            logger.info("[Worker] Crawl finished successfully")
            return {"status": "success", "output": stdout.decode()[-200:]} # Return last 200 chars
        else:
            logger.error(f"[Worker] Crawl failed: {stderr.decode()}")
            return {"status": "error", "error": stderr.decode()}
            
    except Exception as e:
        logger.error(f"[Worker] Task Exception: {e}")
        return {"status": "failed", "error": str(e)}
