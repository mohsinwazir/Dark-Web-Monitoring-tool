import socket
import logging

# 1. Detect Tor Port FIRST
TOR_PORT = None
for port in [9050, 9150]:
    try:
        with socket.create_connection(("127.0.0.1", port), timeout=0.5):
            TOR_PORT = port
            break
    except Exception:
        pass

if TOR_PORT:
    HTTP_PROXY = f"socks5h://127.0.0.1:{TOR_PORT}"
    HTTPS_PROXY = HTTP_PROXY
    print(f"[+] Tor proxy enabled at 127.0.0.1:{TOR_PORT}")
else:
    print("[!] No Tor proxy detected — surface web only.")

BOT_NAME = "crawler"

SPIDER_MODULES = ["crawler.spiders"]
NEWSPIDER_MODULE = "crawler.spiders"

LOG_LEVEL = "INFO"
FEED_EXPORT_ENCODING = "utf-8"


CONCURRENT_REQUESTS_PER_DOMAIN = 1
DOWNLOAD_DELAY = 1
DEPTH_LIMIT = 2
DOWNLOAD_TIMEOUT = 40


DOWNLOAD_HANDLERS = {
    "http": "scrapy_playwright.handler.ScrapyPlaywrightDownloadHandler",
    "https": "scrapy_playwright.handler.ScrapyPlaywrightDownloadHandler",
}

TWISTED_REACTOR = "twisted.internet.asyncioreactor.AsyncioSelectorReactor"

PLAYWRIGHT_LAUNCH_OPTIONS = {
    "headless": True,     
    "timeout": 60000,      
}

# Route Playwright through Tor proxy for .onion sites
PLAYWRIGHT_CONTEXT_ARGS = {
    "proxy": {
        "server": f"socks5://127.0.0.1:{TOR_PORT}" if TOR_PORT else None,
    } 
} if TOR_PORT else {} 

PLAYWRIGHT_DEFAULT_NAVIGATION_TIMEOUT = 60000
PLAYWRIGHT_PROCESS_REQUEST_HEADERS = None

DOWNLOADER_MIDDLEWARES = {
    "scrapy.downloadermiddlewares.useragent.UserAgentMiddleware": None,
    "scrapy.downloadermiddlewares.retry.RetryMiddleware": 90,
    "crawler.middlewares.DeduplicateMiddleware": 100,  # URL deduplication
}




NLP_MODEL = "en_core_web_sm"  
TRANSFORMER_MODEL = "bert-base-uncased"






NLP_MODEL = "en_core_web_sm"  
TRANSFORMER_MODEL = "bert-base-uncased"


logging.basicConfig(
    format="%(levelname)s: %(message)s",
    level=logging.INFO,
)
