
from database_sql import SessionLocal
from models_sql import CrawledItem
import os

def check_results():
    if not os.path.exists("darkweb.db"):
        print("❌ darkweb.db not found!")
        return

    db = SessionLocal()
    try:
        count = db.query(CrawledItem).count()
        print(f"Total Items: {count}")
        
        items = db.query(CrawledItem).order_by(CrawledItem.timestamp.desc()).limit(5).all()
        if not items:
            print("❌ No items found in database.")
        else:
            print("✅ Latest Items:")
            for item in items:
                print(f" - URL: {item.url}")
                print(f"   Title: {item.title}")
                print(f"   Risk: {item.risk_score}")
                print(f"   Category: {item.category}")
                print(f"   Timestamp: {item.timestamp}")
                print(f"   Entities: {len(item.entities) if item.entities else 0}")
                if item.risk_score > 0 or item.category:
                     print("   ✅ AI Logic ran successfully (Category/Risk assigned)")
                else:
                     print("   ⚠️ AI Logic might not have run (Risk 0 / No Category)")
                print("-" * 30)

    except Exception as e:
        print(f"❌ Error checking DB: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_results()
