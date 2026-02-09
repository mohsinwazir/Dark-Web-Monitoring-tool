"""
Automated Scheduler for Daily Reports and Maintenance Tasks
Uses APScheduler to run background jobs
"""

import logging
from datetime import datetime, timedelta
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy import desc
from database_sql import SessionLocal
from models_sql import CrawledItem, DailyReport, SeenURL
from report_generator import ReportGenerator # Instantiate directly

logger = logging.getLogger(__name__)

class TaskScheduler:
    """Manages automated background tasks"""
    
    def __init__(self):
        self.scheduler = BackgroundScheduler()
    
    def start(self):
        """Start the scheduler with all configured jobs"""
        try:
            # Job 1: Generate daily report at 9 AM
            self.scheduler.add_job(
                func=self.generate_daily_report,
                trigger=CronTrigger(hour=9, minute=0),
                id='daily_report',
                name='Generate Daily Intelligence Report',
                replace_existing=True
            )
            
            # Job 2: Cleanup old seen_urls (older than 30 days) at 2 AM
            self.scheduler.add_job(
                func=self.cleanup_old_urls,
                trigger=CronTrigger(hour=2, minute=0),
                id='cleanup_urls',
                name='Cleanup Old Seen URLs',
                replace_existing=True
            )
            
            self.scheduler.start()
            logger.info("[Scheduler] Started with 2 jobs")
            self._log_next_runs()
            
        except Exception as e:
            logger.error(f"[Scheduler] Failed to start: {e}")
    
    def generate_daily_report(self):
        """Automated daily report generation"""
        db = SessionLocal()
        try:
            logger.info("[Scheduler] Starting daily report generation...")
            
            # Query high risk docs
            high_risk_docs = db.query(CrawledItem).filter(
                CrawledItem.risk_score >= 0.8
            ).order_by(desc(CrawledItem.timestamp)).limit(50).all()
            
            if not high_risk_docs:
                logger.info("[Scheduler] No high-risk findings for daily report")
                return
            
            # Convert for ReportGenerator
            docs_dicts = [item.__dict__ for item in high_risk_docs]
            for d in docs_dicts:
                d.pop('_sa_instance_state', None)

            # Generate report
            report_gen = ReportGenerator()
            summary = report_gen.create_executive_summary(docs_dicts)
            
            # Save to database
            report = DailyReport(
                findings_count=len(high_risk_docs),
                summary=summary,
                period="last_24_hours"
            )
            db.add(report)
            db.commit()
            
            logger.info(f"[Scheduler] Daily report generated: {report.id}")
            
        except Exception as e:
            logger.error(f"[Scheduler] Daily report failed: {e}")
        finally:
            db.close()
    
    def cleanup_old_urls(self):
        """Remove seen_urls older than 30 days"""
        db = SessionLocal()
        try:
            logger.info("[Scheduler] Starting cleanup of old seen_urls...")
            
            thirty_days_ago = datetime.utcnow() - timedelta(days=30)
            
            # Delete old entries
            deleted_count = db.query(SeenURL).filter(
                SeenURL.timestamp < thirty_days_ago
            ).delete()
            
            db.commit()
            
            logger.info(f"[Scheduler] Cleaned up {deleted_count} old URLs")
            
        except Exception as e:
            logger.error(f"[Scheduler] Cleanup failed: {e}")
        finally:
            db.close()
    
    def _log_next_runs(self):
        """Log next scheduled run times"""
        jobs = self.scheduler.get_jobs()
        for job in jobs:
            logger.info(f"[Scheduler] {job.name} - Next run: {job.next_run_time}")
    
    def shutdown(self):
        """Gracefully shutdown the scheduler"""
        if self.scheduler.running:
            self.scheduler.shutdown()
            logger.info("[Scheduler] Shutdown complete")


# Global scheduler instance
_scheduler = None

def get_scheduler():
    """Get or create global scheduler instance"""
    global _scheduler
    if _scheduler is None:
        _scheduler = TaskScheduler()
    return _scheduler
