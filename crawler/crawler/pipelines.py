
import logging
import re
from itemadapter import ItemAdapter
from w3lib.html import remove_tags
import sys
import os

# Ensure API directory matches for imports
# Scrapy runs from project root usually? 
# We need to find the api directory relative to this file
# c:\Users\WAZIR\Desktop\fyp\scrapy\crawler\crawler\pipelines.py
# api is at c:\Users\WAZIR\Desktop\fyp\scrapy\api
api_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "api"))
if api_path not in sys.path:
    sys.path.append(api_path)

from database_sql import SessionLocal
from models_sql import CrawledItem
from crawler.ai.nlp_spacy import analyze_entities, clean_text as nlp_clean_text
from crawler.ai.classifier import classify_document
from crawler.ai.sentencetransformer import get_embedding
from crawler.ai.faiss_manager import get_faiss_manager

class SQLitePipeline:

    def __init__(self):
        self.db = None
        self.faiss_manager = None

    @classmethod
    def from_crawler(cls, crawler):
        return cls()

    def open_spider(self, spider):
        try:
            self.db = SessionLocal()
            logging.info(f"[SQLite] Connected to darkweb.db")
            
            self.faiss_manager = get_faiss_manager(dimension=384)
            # logging.info(f"[FAISS] Initialized")
        except Exception as e:
            logging.error(f"[SQLite] Connection failed: {e}")

    def close_spider(self, spider):
        if self.db:
            self.db.close()
            logging.info("[SQLite] Connection closed.")
        
        if self.faiss_manager:
            self.faiss_manager.save_index()

    def clean_html(self, html):
        if not html:
            return ""
        html = re.sub(r"<script.*?>.*?</script>", "", html, flags=re.DOTALL)
        html = re.sub(r"<style.*?>.*?</style>", "", html, flags=re.DOTALL)
        text = remove_tags(html)
        text = re.sub(r"\s+", " ", text)
        return text.strip()

    def process_item(self, item, spider):
        try:
            data = ItemAdapter(item).asdict()
            raw_html = data.get("text") or data.get("content") or ""
            clean_text = self.clean_html(raw_html)
            
            # NLP
            nlp_cleaned = nlp_clean_text(clean_text)
            entities = analyze_entities(nlp_cleaned)
            
            # Forensics (Stego - Simple check on raw html for demo)
            stego_hidden = None
            stego_image = None
            
            # Classification
            classification = classify_document(nlp_cleaned)
            
            # Embedding
            embedding = get_embedding(nlp_cleaned)
            
            # Deduplication
            if self.faiss_manager and embedding:
                is_dup, matched_id, _ = self.faiss_manager.is_duplicate(embedding, threshold=0.95)
                # skipping logic if needed, but for now allow overwrite or ignore
            
            # Risk Calc
            risk_score = classification["score"] if classification["is_threat"] else 0.0
            
            # Store in SQL
            crawled_item = CrawledItem(
                url=data.get("url"),
                title=data.get("title"),
                text=nlp_cleaned[:5000],  # Limit text size
                risk_score=risk_score,
                conn_type=data.get("conn_type"),
                depth=data.get("depth"),
                stego_hidden_text=stego_hidden,
                stego_image_url=stego_image,
                category=classification["label"],
                entities=entities, # JSON
                sentiment=None,
                csam_flag="human trafficking" in classification["label"]
            )
            
            self.db.add(crawled_item)
            self.db.commit()
            
            # Add to FAISS
            if self.faiss_manager and embedding:
                self.faiss_manager.add_embedding(embedding, str(crawled_item.id))
            
            logging.info(f"[SQLite] Usage Saved: {data.get('url')} | Risk: {risk_score:.2f}")

            return item

        except Exception as e:
            logging.error(f"[Pipeline] Failed: {e}")
            if self.db:
                self.db.rollback()
            return item
