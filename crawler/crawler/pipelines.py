
import logging
import re
from itemadapter import ItemAdapter
from w3lib.html import remove_tags
import sys
import os
from scrapy.exceptions import DropItem

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

    # Known safe/legitimate dark web services & indexers — never threat intel
    SAFE_DOMAINS = [
        "duckduckgogg42xjoc72x3sjasowoarfbgcmvfimaftt6twagswzczad.onion",  # DDG
        "torlinksge6enmcyyuxjpgcgvn5sx3p5mkyfjto5wefl55cwzxtw3oqd.onion",  # TorLinks
        "answerszuvs3gg2l64e6hmnryudl5zgrmwm3vh65hzszdghbldbpvqrad.onion",  # Hidden Answers
        # NOTE: Ahmia search results ARE allowed - only homepage/legal blocked via title filter
    ]

    # Page titles that signal boilerplate/admin pages — no threat value
    BOILERPLATE_TITLES = [
        "legal disclaimer", "terms of service", "terms and conditions",
        "privacy policy", "about ahmia", "about us", "cookie policy",
        "contact us", "faq", "help center", "add service", "register",
        "sign in", "login", "captcha", "access denied", "403 forbidden",
        "404 not found", "error", "maintenance",
    ]

    # Text patterns that indicate PROTECTIVE/informational context (not criminal)
    PROTECTIVE_PHRASES = [
        "we have not deployed", "content warning: the indexed sites",
        "not responsible for them", "blocks websites that contain",
        "filter child sexual abuse material from your own",
        "right onion address starts with", "man-in-the-middle fake clone",
        "legal disclaimer", "this is a research", "for educational purposes",
        "checksum from an onion address", "md5 sum of the onion domain",
    ]

    def process_item(self, item, spider):
        try:
            data = ItemAdapter(item).asdict()
            url = data.get("url", "")
            title = (data.get("title") or "").lower().strip()

            # 1. Exact URL Deduplication (Fast)
            if self.db:
                existing_item = self.db.query(CrawledItem).filter(CrawledItem.url == url).first()
                if existing_item:
                    raise DropItem(f"Duplicate URL already exists in database: {url}")

            # 2. Pre-filter: Drop known safe indexers immediately (no AI needed)
            from urllib.parse import urlparse
            host = (urlparse(url).hostname or "").lower()
            if any(safe in host for safe in self.SAFE_DOMAINS):
                raise DropItem(f"Dropping known safe indexer/search service: {url}")

            # 3. Pre-filter: Drop boilerplate/admin page titles
            if any(bp in title for bp in self.BOILERPLATE_TITLES):
                raise DropItem(f"Dropping boilerplate page by title: '{title}'")

            raw_html = data.get("text") or data.get("content") or ""
            clean_text = self.clean_html(raw_html)

            # 4. Pre-filter: Drop pages with protective/informational language
            clean_lower = clean_text.lower()
            if any(phrase in clean_lower for phrase in self.PROTECTIVE_PHRASES):
                raise DropItem(f"Dropping informational/protective-context page: {url}")

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
                if is_dup:
                    raise DropItem(f"Semantic duplicate of item {matched_id} (FAISS Threshold > 0.95)")

            # Risk Calc
            risk_score = classification["score"] if classification["is_threat"] else 0.0

            # Data Pruning: Removed temporarily to ensure maximum data collection
            # (All data will be saved regardless of risk score)

            # Store in SQL
            crawled_item = CrawledItem(
                url=data.get("url"),
                title=data.get("title"),
                text=nlp_cleaned,  # No text size limit
                raw_html=raw_html, # Store raw HTML for frontend rendering
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

        except DropItem as e:
            logging.info(f"[Pruning] {e}")
            raise
        except Exception as e:
            logging.error(f"[Pipeline] Failed: {e}")
            if self.db:
                self.db.rollback()
            return item
