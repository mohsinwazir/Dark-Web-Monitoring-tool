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
        "carding", "cvv", "fullz", "counterfeit", "drugs"
    ]

    for ent in doc.ents:
        if ent.label_ in result:
            result[ent.label_].append(ent.text)

    for term in dark_terms:
        if term in text.lower():
            result["DARKWEB_TERMS"].append(term)

    # remove duplicates
    for key in result:
        result[key] = list(set(result[key]))

    return result
