import scrapy
import socket
from urllib.parse import urljoin


def detect_tor_port():
    for port in [9050, 9150]:
        try:
            with socket.create_connection(("127.0.0.1", port), timeout=0.8):
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
        "DEPTH_LIMIT": 2,
        "LOG_LEVEL": "INFO",
        "DOWNLOAD_TIMEOUT": 40,
        "ROBOTSTXT_OBEY": False,
        "PLAYWRIGHT_BROWSER_TYPE": "chromium",
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
            if self.scope == "darkweb" and not is_onion:
                self.logger.info(f"Skipping {url} (Scope: Darkweb)")
                continue

            # TOR CHECK
            use_tor = is_onion
            if use_tor and not TOR_PROXY:
                self.logger.warning(f"Skipping .onion link (Tor not running): {url}")
                continue

            yield scrapy.Request(
                url=url,
                callback=self.parse,
                meta={"playwright": True, "depth": 0, "use_tor": use_tor},
                dont_filter=True,
            )

    async def parse(self, response):
        url = response.url
        conn_type = "Tor" if response.meta.get("use_tor") else "Direct"
        title = response.xpath("//title/text()").get(default="No Title").strip()
        text = " ".join(response.xpath("//body//text()").getall()).strip().replace("\n", " ")
        text = " ".join(text.split())[:500] 

        print(f"\n[+] Crawled: {url}")
        print(f"    [{conn_type}] Title: {title}")
        print(f"    --- Text (first 500 chars) ---\n{text}\n{'-'*70}")

        yield {
            "url": url,
            "title": title,
            "text": text,
            "conn_type": conn_type,
            "depth": response.meta.get("depth", 0),
        }


        links = response.css("a::attr(href)").getall()
        abs_links = []
        for link in links:
            abs_link = urljoin(response.url, link)
            if abs_link.startswith("http"):
                abs_links.append(abs_link)

        for link in abs_links[:10]:
            print(f"       → {link}")


        next_depth = response.meta.get("depth", 0) + 1
        if next_depth <= 2:
            for link in abs_links:
                yield scrapy.Request(
                    url=link,
                    callback=self.parse,
                    meta={"playwright": True, "depth": next_depth, "use_tor": link.endswith(".onion")},
                    dont_filter=True,
                )
