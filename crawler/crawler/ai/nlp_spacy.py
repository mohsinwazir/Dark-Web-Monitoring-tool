import spacy
import re

# FALLBACK TO SMALLER MODEL IF TRANSFORMER FAILS
try:
    nlp = spacy.load("en_core_web_trf")
except OSError:
    print("[!] Transformer model not found. Using 'en_core_web_sm' fallback.")
    nlp = spacy.load("en_core_web_sm")

STOP_PATTERNS = [
    r"\b(function|var|let|const|document|window)\b",
    r"\b(cookie|accept|privacy|subscribe|Sign up)\b",
]

def clean_text(text):
    if not text:
        return ""

    text = re.sub(r"\s+", " ", text)
    text = re.sub(r"\[.*?]", " ", text)
    text = re.sub(r"{.*?}", " ", text)

    for pat in STOP_PATTERNS:
        text = re.sub(pat, " ", text, flags=re.I)

    return text.strip()


def analyze_entities(text):

    text = clean_text(text)

    doc = nlp(text)

    result = {
        "PERSON": [],
        "ORG": [],
        "PRODUCT": [],
        "GPE": [],
        "LOC": [],
        "MONEY": [],
        "DARKWEB_TERMS": [],
    }

    dark_terms = [
        "bitcoin", "btc", "wallet", "opsec", "market", "vendor",
        "exploit", "0day", "botnet", "hack", "malware", "ransomware",
        "carding", "cvv", "fullz", "counterfeit", "drugs", "fentanyl",
        "heroin", "cocaine", "mdma", "firearms", "pistol", "rifle",
        "passport", "ssn", "dox", "doxxing", "phishing", "ddos",
        "keylogger", "rat", "stealer", "cryptolocker", "escrow",
        "monero", "xmr", "darknet", "tor", "onion", "pgp"
    ]

    for ent in doc.ents:
        if ent.label_ in result:
            result[ent.label_].append(ent.text)

    for term in dark_terms:
        if term in text.lower():
            result["DARKWEB_TERMS"].append(term)

    # --- Regex-based Critical Entity Extraction ---

    # Email Addresses
    email_matches = re.findall(
        r'\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b', text
    )
    if email_matches:
        result["EMAIL"] = list(set(email_matches))

    # IP Addresses (IPv4)
    ip_matches = re.findall(
        r'\b(?:\d{1,3}\.){3}\d{1,3}\b', text
    )
    ip_matches = [ip for ip in ip_matches if all(0 <= int(o) <= 255 for o in ip.split('.'))]
    if ip_matches:
        result["IP_ADDRESS"] = list(set(ip_matches))

    # Phone Numbers (international formats)
    phone_matches = re.findall(
        r'(?:\+?\d[\d\s\-\(\)]{7,}\d)', text
    )
    if phone_matches:
        result["PHONE"] = list(set([p.strip() for p in phone_matches]))

    # PGP Public Key blocks
    if "BEGIN PGP PUBLIC KEY" in text or "BEGIN PGP MESSAGE" in text:
        result["PGP_KEY"] = ["PGP Key Block Detected"]

    # Crypto Wallet Extraction
    btc_matches = re.findall(r'\b([13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[qzprya9x8gf2tvdw0s3jn54khce6mua7l]{39,59})\b', text)
    xmr_matches = re.findall(r'\b(4[0-9AB][1-9A-HJ-NP-Za-km-z]{93})\b', text)

    if btc_matches or xmr_matches:
        result["CRYPTO"] = []
        if btc_matches:
            result["CRYPTO"].extend([f"BTC_{w}" for w in btc_matches])
        if xmr_matches:
            result["CRYPTO"].extend([f"XMR_{w}" for w in xmr_matches])

    # Remove duplicates and delete empty keys to keep DB clean
    for key in list(result.keys()):
        result[key] = list(set(result[key]))
        if not result[key]:
            del result[key]

    return result
