import sqlite3

import os

DB_PATH = r"c:\Users\WAZIR\Desktop\fyp\scrapy\api\darkweb.db"

def check_data():
    if not os.path.exists(DB_PATH):
        print(f"❌ Database not found at {DB_PATH}")
        return

    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Get item count
        cursor.execute("SELECT COUNT(*) FROM crawled_items")
        count = cursor.fetchone()[0]
        print(f"✅ Total Crawled Items: {count}")
        
        if count > 0:
            # Check for AI fields
            cursor.execute("SELECT url, title, risk_score, category, sentiment FROM crawled_items ORDER BY timestamp DESC LIMIT 5")
            rows = cursor.fetchall()
            print("\n🔍 Recent 5 Items:")
            for row in rows:
                print(f"URL: {row[0]}")
                print(f"Title: {row[1]}")
                print(f"Risk Score: {row[2]}")
                print(f"Category: {row[3]}")
                print(f"Sentiment: {row[4]}")
                print("-" * 20)
                
            # Check stats for AI fields
            cursor.execute("SELECT COUNT(*) FROM crawled_items WHERE risk_score > 0")
            scored_count = cursor.fetchone()[0]
            print(f"\n✅ Items with Risk Score > 0: {scored_count}")
            
            cursor.execute("SELECT COUNT(*) FROM crawled_items WHERE category IS NOT NULL")
            categorized_count = cursor.fetchone()[0]
            print(f"✅ Items with Category: {categorized_count}")
            
        else:
            print("⚠️ Database is empty. Crawler might not be saving data.")
            
        conn.close()
        
    except Exception as e:
        print(f"❌ Error querying database: {e}")

if __name__ == "__main__":
    check_data()
