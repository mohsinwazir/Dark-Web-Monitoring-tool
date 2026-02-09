import re
import requests
import logging

logger = logging.getLogger(__name__)

def extract_cves(text):
    """Refined Regex to capture Common Vulnerabilities and Exposures IDs"""
    if not text:
        return []
    # Pattern: CVE-YYYY-NNNN...
    return list(set(re.findall(r'CVE-\d{4}-\d+', text)))

def enrich_cve_data(cve_id):
    """
    Query NVD API for CVE details. 
    Note: Open NVD API has strict rate limits. 
    We will use a timeout and mock fallback for demo stability.
    """
    base_url = "https://services.nvd.nist.gov/rest/json/cves/2.0"
    params = {"cveId": cve_id}
    
    try:
        # TIMEOUT is crucial to not hang the crawler
        response = requests.get(base_url, params=params, timeout=3)
        
        if response.status_code == 200:
            data = response.json()
            vulns = data.get("vulnerabilities", [])
            if vulns:
                cve_item = vulns[0]["cve"]
                metrics = cve_item.get("metrics", {})
                
                # Try V3.1, then V3.0, then V2
                cvss_data = None
                if "cvssMetricV31" in metrics:
                    cvss_data = metrics["cvssMetricV31"][0]["cvssData"]
                elif "cvssMetricV30" in metrics:
                    cvss_data = metrics["cvssMetricV30"][0]["cvssData"]
                
                if cvss_data:
                    score = cvss_data.get("baseScore", 0)
                    return {
                        "id": cve_id,
                        "score": score,
                        "severity": cvss_data.get("baseSeverity", "UNKNOWN"),
                        "description": cve_item.get("descriptions", [{}])[0].get("value", "No description"),
                        "is_critical": score >= 9.0
                    }
    except Exception as e:
        logger.warning(f"[CVE] Lookup failed for {cve_id}: {e}")
    
    # Fallback / Mock for Demo purposes if API fails
    return {
        "id": cve_id,
        "score": 0.0,
        "severity": "UNKNOWN (Lookup Failed)",
        "description": "Details could not be fetched from NVD.",
        "is_critical": False
    }
