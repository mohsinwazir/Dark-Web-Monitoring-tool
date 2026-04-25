import scrapy
import socket
from urllib.parse import urljoin
from scrapy_playwright.page import PageMethod


def detect_tor_port():
    for port in [9050, 9150]:
        try:
            with socket.create_connection(("127.0.0.1", port), timeout=3.0):
                return port
        except Exception:
            pass
    return None

TOR_PORT = detect_tor_port()
if TOR_PORT:
    TOR_PROXY = f"socks5h://127.0.0.1:{TOR_PORT}"
    print(f"[+] Detected Tor at 127.0.0.1:{TOR_PORT}")
else:
    TOR_PROXY = None
    print("[!] Tor not detected — .onion links will be skipped.")


class HybridSpider(scrapy.Spider):
    name = "crawler"

    custom_settings = {
        "DEPTH_LIMIT": 0,
        "LOG_LEVEL": "INFO",
        "DOWNLOAD_TIMEOUT": 120,           # 120s for slow .onion sites
        "CONCURRENT_REQUESTS": 1,           # One at a time to avoid overloading
        "DOWNLOAD_DELAY": 2,                # 2s polite delay
        "ROBOTSTXT_OBEY": False,
        "PLAYWRIGHT_BROWSER_TYPE": "chromium",
        "PLAYWRIGHT_DEFAULT_NAVIGATION_TIMEOUT": 120000,  # 120s nav timeout
        "PLAYWRIGHT_LAUNCH_OPTIONS": {
            "headless": True,
            "args": [
                "--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE .onion",
                "--no-sandbox",
                "--disable-gpu",
            ]
        },
        "FEEDS": {
            "output.csv": {
                "format": "csv",
                "overwrite": True,
                "encoding": "utf8",
                "fields": ["url", "title", "text", "conn_type", "depth"],
            }
        },
    }

    def __init__(self, scope="hybrid", *args, **kwargs):
        super(HybridSpider, self).__init__(*args, **kwargs)
        self.scope = scope
        print(f"[Spider] Initialized with scope: {self.scope}")

    def start_requests(self):
        try:
          with open("target.txt", "r", encoding="utf-8") as f:
           urls = [line.strip() for line in f if line.strip()]
        except FileNotFoundError:
            self.logger.warning("No target.txt found — using default target URL.")
            urls = ["https://example.com"]

        for url in urls:
            is_onion = url.endswith(".onion")
            
            # SCOPE FILTERING
            if self.scope == "clearnet" and is_onion:
                self.logger.info(f"Skipping {url} (Scope: Clearnet)")
                continue
            if self.scope == "darkweb" and not is_onion and "torproject.org" not in url:
                self.logger.info(f"Skipping {url} (Scope: Darkweb)")
                continue

            # TOR CHECK
            use_tor = is_onion or "torproject.org" in url
            if use_tor and not TOR_PROXY:
                self.logger.warning(f"Skipping .onion link (Tor not running): {url}")
                continue

            meta = {
                "playwright": True, 
                "depth": 0, 
                "use_tor": use_tor,
                "playwright_page_goto_kwargs": {"wait_until": "domcontentloaded"}
            }
            if use_tor and TOR_PROXY:
                meta["playwright_context_kwargs"] = {
                    "proxy": {"server": TOR_PROXY.replace("socks5h://", "socks5://")}
                }
            
            # Special handling for Dread (DDoS protection session creation queue)
            if "dreadytofatroptsdj6io7l3xptbet6onoyno2yv7jicoxknyazubrad" in url:
                self.logger.info(f"Injecting 30s wait for Dread session creation: {url}")
                meta["playwright_page_coroutines"] = [
                    PageMethod("wait_for_timeout", 30000)
                ]

            yield scrapy.Request(
                url=url,
                callback=self.parse,
                meta=meta,
                dont_filter=False,
            )

    def _is_onion_url(self, url):
        """Strict check — only allow .onion hidden services."""
        try:
            from urllib.parse import urlparse
            host = urlparse(url).hostname or ""
            return host.endswith(".onion")
        except Exception:
            return False

    # Skip binary/asset URLs — only crawl HTML pages
    SKIP_EXTENSIONS = (
        '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp',
        '.pdf', '.zip', '.tar', '.gz', '.mp4', '.mp3', '.avi',
        '.css', '.js', '.woff', '.woff2', '.ttf', '.eot',
    )

    def _is_html_url(self, url):
        from urllib.parse import urlparse
        path = urlparse(url).path.lower()
        return not any(path.endswith(ext) for ext in self.SKIP_EXTENSIONS)

    async def parse(self, response):
        url = response.url

        # Hard block: discard any clearnet page that slipped through
        if not self._is_onion_url(url):
            self.logger.info(f"[BLOCKED] Clearnet URL discarded: {url}")
            return

        # Hard block: skip binary/asset files
        if not self._is_html_url(url):
            self.logger.info(f"[BLOCKED] Binary/asset URL skipped: {url}")
            return

        conn_type = "Tor" if response.meta.get("use_tor") else "Direct"
        title = response.xpath("//title/text()").get(default="No Title").strip()
        # Unlimited character capture
        text = " ".join(response.xpath("//body//text()").getall()).strip().replace("\n", " ")
        text = " ".join(text.split())

        safe_title = title.encode("ascii", "ignore").decode()
        print(f"\n[+] Crawled: {url}")
        print(f"    [{conn_type}] Title: {safe_title}")
        print(f"    Text length: {len(text)} chars")

        yield {
            "url": url,
            "title": title,
            "text": text,
            "conn_type": conn_type,
            "depth": response.meta.get("depth", 0),
            "raw_html": response.text
        }


        links = response.css("a::attr(href)").getall()
        abs_links_filtered = []
        for link in links:
            abs_link = urljoin(response.url, link)
            # STRICT FILTER: Only follow .onion hidden service HTML links
            if self._is_onion_url(abs_link) and self._is_html_url(abs_link):
                abs_links_filtered.append(abs_link)

        self.logger.info(f"    Found {len(abs_links_filtered)} valid .onion links to follow")

        next_depth = response.meta.get("depth", 0) + 1
        
        for link in abs_links_filtered:
            # Skip irrelevant boilerplate pages
            lower_link = link.lower()
            if any(term in lower_link for term in ["about", "contact", "privacy", "terms", "faq", "help", "login", "register"]):
                continue

            meta = {
                "playwright": True,
                "depth": next_depth,
                "use_tor": True,  # All .onion links require Tor
                "playwright_page_goto_kwargs": {"wait_until": "domcontentloaded"}
            }

            if TOR_PROXY:
                meta["playwright_context_kwargs"] = {
                    "proxy": {"server": TOR_PROXY.replace("socks5h://", "socks5://")}
                }

            # Special handling for Dread (DDoS protection session creation queue)
            if "dreadytofatroptsdj6io7l3xptbet6onoyno2yv7jicoxknyazubrad" in link:
                meta["playwright_page_coroutines"] = [
                    PageMethod("wait_for_timeout", 30000)
                ]

            yield scrapy.Request(
                url=link,
                callback=self.parse,
                meta=meta,
                dont_filter=False,
            )
