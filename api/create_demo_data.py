import random
from datetime import datetime, timedelta
import uuid
from database_sql import SessionLocal
from models_sql import CrawledItem, DailyReport

def generate_demo_data():
    db = SessionLocal()
    print("Generating demo data...")

    # Clear existing data? Maybe not, just append.
    # db.query(CrawledItem).delete()
    # db.commit()

    categories = ["Drugs", "Weapons", "Finance", "Hacking", "Counterfeit", "Extremism", "Other"]
    
    templates = [
        {
            "title": "Valid CC Fullz - Visa/Mastercard",
            "text": "Selling high limit credit cards. 95% validity rate. Escrow accepted. Bulk discounts available for serious buyers.",
            "category": "Finance",
            "risk": 0.9,
            "url_prefix": "cardshop",
            "terms": ["cc", "fullz", "cvv", "dump"]
        },
        {
            "title": "Glock 19 Gen 5 - Unregistered",
            "text": "Brand new in box. Comes with 2 mags. Shipping worldwide with stealth packaging. Bitcoin only.",
            "category": "Weapons",
            "risk": 0.95,
            "url_prefix": "guns4u",
            "terms": ["glock", "weapon", "firearm", "ammo"]
        },
        {
            "title": "Network Access - Corporate VPN",
            "text": "Access to Fortune 500 company VPN. Citrix entry point. Admin privileges. Auction starting at 0.5 BTC.",
            "category": "Hacking",
            "risk": 0.98,
            "url_prefix": "access-market",
            "terms": ["vpn", "citrix", "rdp", "exploit"]
        },
        {
            "title": "Premium Hacking Tutorials",
            "text": "Learn SQL injection, XSS, and social engineering. Complete course with tools included.",
            "category": "Hacking",
            "risk": 0.6,
            "url_prefix": "hack-school",
            "terms": ["tutorial", "sql", "xss", "course"]
        },
        {
            "title": "High Quality LSD - 200ug tabs",
            "text": "Double dipped tabs. Gammas. Shipping from EU. Reship guarantee.",
            "category": "Drugs",
            "risk": 0.85,
            "url_prefix": "psy-store",
            "terms": ["lsd", "acid", "tabs", "drugs"]
        },
        {
            "title": "Anonymous Email Service",
            "text": "Secure, encrypted email. No logs kept. Tor only. Free tier available.",
            "category": "Other",
            "risk": 0.1,
            "url_prefix": "secure-mail",
            "terms": ["email", "privacy", "secure"]
        },
        {
            "title": "Counterfeit USD - High Quality",
            "text": "Passes pen test. Correct texture and watermarks. 100 notes for $2000 BTC.",
            "category": "Counterfeit",
            "risk": 0.92,
            "url_prefix": "cash-king",
            "terms": ["fake money", "usd", "counterfeit", "notes"]
        },
        {
            "title": "Database Dump - Social Media",
            "text": "1M records. Email, hash, phone. Leaked 2024. Instant download.",
            "category": "Hacking",
            "risk": 0.88,
            "url_prefix": "leak-store",
            "terms": ["database", "leak", "dump", "records"]
        }
    ]

    # Generate 50 items
    for i in range(50):
        template = random.choice(templates)
        
        # Add some randomness to risk
        risk_score = min(1.0, max(0.0, template["risk"] + random.uniform(-0.1, 0.1)))
        
        # Time distribution: spread over last 24 hours, with more recent ones
        hours_ago = random.uniform(0, 24)
        if random.random() > 0.7:
             hours_ago = random.uniform(0, 1) # 30% are very recent (last hour) for Live Feed
             
        timestamp = datetime.utcnow() - timedelta(hours=hours_ago)
        
        item = CrawledItem(
            id=str(uuid.uuid4()),
            url=f"http://{template['url_prefix']}{random.randint(100,999)}.onion/item/{random.randint(1000,9999)}",
            title=f"{template['title']} #{random.randint(1,100)}",
            text=f"{template['text']} [Ref: {uuid.uuid4().hex[:8]}]",
            risk_score=risk_score,
            conn_type="Tor",
            depth=1,
            timestamp=timestamp,
            category=template["category"],
            stego_hidden_text=None,
            stego_image_url=None,
            entities={"DARKWEB_TERMS": template["terms"]},
            sentiment="Negative" if risk_score > 0.5 else "Neutral",
            csam_flag=False
        )
        db.add(item)

    print("Committing 50 demo items...")
    db.commit()
    print("Done!")
    db.close()

if __name__ == "__main__":
    generate_demo_data()
