import logging
import re

logger = logging.getLogger(__name__)

# Simple Knowledge Base for Demo
# In production, this would be a larger DB or STIX source
MITRE_KB = {
    "sql injection": "T1190",
    "sqli": "T1190",
    "buffer overflow": "T1190",
    "ransomware": "T1486",
    "encrypt files": "T1486",
    "phishing": "T1566",
    "spearphishing": "T1566",
    "credential dumping": "T1003",
    "mimikatz": "T1003",
    "brute force": "T1110",
    "password guessing": "T1110",
    "data exfiltration": "T1041",
    "c2": "T1071",
    "command and control": "T1071"
}

MITRE_DETAILS = {
    "T1190": "Exploit Public-Facing Application",
    "T1486": "Data Encrypted for Impact",
    "T1566": "Phishing",
    "T1003": "OS Credential Dumping",
    "T1110": "Brute Force",
    "T1041": "Exfiltration Over C2 Channel",
    "T1071": "Application Layer Protocol"
}

def map_text_to_attck(text):
    """
    Scans text for MITRE keywords and returns detected TTPs.
    """
    detected_ttps = {}
    
    if not text:
        return []
        
    text_lower = text.lower()
    
    for keyword, ttp_id in MITRE_KB.items():
        if keyword in text_lower:
            if ttp_id not in detected_ttps:
                detected_ttps[ttp_id] = {
                    "id": ttp_id,
                    "name": MITRE_DETAILS.get(ttp_id, "Unknown"),
                    "confidence": "High",
                    "evidence": keyword
                }
    
    return list(detected_ttps.values())
