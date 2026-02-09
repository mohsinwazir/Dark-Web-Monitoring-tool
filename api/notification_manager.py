"""
Notification Manager for Critical Alerts
Supports Email and Slack notifications
"""

import logging
import smtplib
import requests
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Optional
from datetime import datetime

logger = logging.getLogger(__name__)


class NotificationManager:
    """Manages alert notifications via Email and Slack"""
    
    def __init__(self):
        self.email_config = {
            "enabled": False,
            "smtp_server": "",
            "smtp_port": 587,
            "username": "",
            "password": "",
            "from_email": "",
            "to_emails": []
        }
        
        self.slack_config = {
            "enabled": False,
            "webhook_url": ""
        }
    
    def configure_email(self, smtp_server: str, smtp_port: int, username: str, 
                       password: str, from_email: str, to_emails: List[str]):
        """
        Configure email notifications
        
        Args:
            smtp_server: SMTP server address (e.g., smtp.gmail.com)
            smtp_port: SMTP port (usually 587 for TLS)
            username: SMTP username
            password: SMTP password or app password
            from_email: Sender email address
            to_emails: List of recipient email addresses
        """
        self.email_config = {
            "enabled": True,
            "smtp_server": smtp_server,
            "smtp_port": smtp_port,
            "username": username,
            "password": password,
            "from_email": from_email,
            "to_emails": to_emails
        }
        logger.info(f"[Notifications] Email configured for {len(to_emails)} recipients")
    
    def configure_slack(self, webhook_url: str):
        """
        Configure Slack webhook notifications
        
        Args:
            webhook_url: Slack incoming webhook URL
        """
        self.slack_config = {
            "enabled": True,
            "webhook_url": webhook_url
        }
        logger.info("[Notifications] Slack webhook configured")
    
    def send_email_alert(self, subject: str, body: str, html_body: Optional[str] = None):
        """
        Send email alert
        
        Args:
            subject: Email subject
            body: Plain text body
            html_body: Optional HTML body
        """
        if not self.email_config["enabled"]:
            logger.warning("[Notifications] Email not configured")
            return False
        
        try:
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = self.email_config["from_email"]
            msg['To'] = ", ".join(self.email_config["to_emails"])
            
            # Attach plain text
            msg.attach(MIMEText(body, 'plain'))
            
            # Attach HTML if provided
            if html_body:
                msg.attach(MIMEText(html_body, 'html'))
            
            # Send email
            with smtplib.SMTP(self.email_config["smtp_server"], 
                            self.email_config["smtp_port"]) as server:
                server.starttls()
                server.login(self.email_config["username"], 
                           self.email_config["password"])
                server.send_message(msg)
            
            logger.info(f"[Notifications] Email sent: {subject}")
            return True
            
        except Exception as e:
            logger.error(f"[Notifications] Email send failed: {e}")
            return False
    
    def send_slack_alert(self, message: str, color: str = "danger"):
        """
        Send Slack alert
        
        Args:
            message: Alert message
            color: Message color (good, warning, danger)
        """
        if not self.slack_config["enabled"]:
            logger.warning("[Notifications] Slack not configured")
            return False
        
        try:
            payload = {
                "attachments": [
                    {
                        "color": color,
                        "title": "🚨 Dark Web Intelligence Alert",
                        "text": message,
                        "footer": "Dark Web Intelligence System",
                        "ts": int(datetime.utcnow().timestamp())
                    }
                ]
            }
            
            response = requests.post(
                self.slack_config["webhook_url"],
                json=payload,
                timeout=10
            )
            
            if response.status_code == 200:
                logger.info("[Notifications] Slack message sent")
                return True
            else:
                logger.error(f"[Notifications] Slack failed: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"[Notifications] Slack send failed: {e}")
            return False
    
    def send_critical_finding_alert(self, finding: dict):
        """
        Send alert for critical finding
        
        Args:
            finding: Dictionary with finding details
        """
        # Email content
        subject = f"⚠️ Critical Finding: {finding.get('label', 'Unknown').upper()}"
        
        body = f"""
Critical Dark Web Finding Detected

Label: {finding.get('label', 'Unknown')}
Risk Score: {finding.get('risk_score', 0)*100:.0f}%
CSAM Flag: {'YES' if finding.get('csam_flag') else 'NO'}

Title: {finding.get('title', 'No title')}
URL: {finding.get('url', 'Unknown')}

Timestamp: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}

This is an automated alert from the Dark Web Intelligence System.
Please review immediately.
        """
        
        html_body = f"""
        <html>
            <body style="font-family: Arial, sans-serif;">
                <h2 style="color: #E74C3C;">⚠️ Critical Dark Web Finding</h2>
                <table style="border-collapse: collapse; width: 100%;">
                    <tr>
                        <td style="padding: 8px; background: #ECF0F1;"><b>Label</b></td>
                        <td style="padding: 8px;">{finding.get('label', 'Unknown').upper()}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; background: #ECF0F1;"><b>Risk Score</b></td>
                        <td style="padding: 8px; color: #E74C3C;"><b>{finding.get('risk_score', 0)*100:.0f}%</b></td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; background: #ECF0F1;"><b>CSAM Flag</b></td>
                        <td style="padding: 8px;">{'<span style="color: red;">YES</span>' if finding.get('csam_flag') else 'NO'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; background: #ECF0F1;"><b>Title</b></td>
                        <td style="padding: 8px;">{finding.get('title', 'No title')}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; background: #ECF0F1;"><b>URL</b></td>
                        <td style="padding: 8px;"><code>{finding.get('url', 'Unknown')}</code></td>
                    </tr>
                </table>
                <p style="margin-top: 20px; color: #7F8C8D; font-size: 12px;">
                    Generated at {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}
                </p>
            </body>
        </html>
        """
        
        # Slack message
        slack_message = (
            f"*Critical Finding Detected*\n\n"
            f"*Label:* {finding.get('label', 'Unknown').upper()}\n"
            f"*Risk Score:* {finding.get('risk_score', 0)*100:.0f}%\n"
            f"*CSAM Flag:* {'⚠️ YES' if finding.get('csam_flag') else 'No'}\n"
            f"*Title:* {finding.get('title', 'No title')}\n"
            f"*URL:* `{finding.get('url', 'Unknown')}`"
        )
        
        # Send both
        if self.email_config["enabled"]:
            self.send_email_alert(subject, body, html_body)
        
        if self.slack_config["enabled"]:
            self.send_slack_alert(slack_message, color="danger")


# Global instance
_notification_manager = None

def get_notification_manager():
    """Get or create global notification manager instance"""
    global _notification_manager
    if _notification_manager is None:
        _notification_manager = NotificationManager()
    return _notification_manager
