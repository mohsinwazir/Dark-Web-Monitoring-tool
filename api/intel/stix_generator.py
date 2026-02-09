from stix2 import Indicator, Bundle, ThreatActor, Malware
import json
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

def export_to_stix(crawled_item):
    """
    Convert a crawled item into a STIX 2.1 Bundle.
    """
    objects = []
    
    try:
        url = crawled_item.get("url", "unknown")
        label = crawled_item.get("label", "unknown")
        
        # Create Indicator for the URL
        indicator = Indicator(
            name=f"Malicious URL linked to {label}",
            pattern=f"[url:value = '{url}']",
            pattern_type="stix",
            valid_from=datetime.utcnow()
        )
        objects.append(indicator)
        
        # If High Risk, maybe create a Threat Actor placeholder
        if crawled_item.get("risk_score", 0) > 0.8:
            actor = ThreatActor(
                name="Unknown Dark Web Actor",
                goals=[label],
                description=f"Detected on {url}"
            )
            objects.append(actor)
        
        # Bundle it
        bundle = Bundle(objects=objects)
        return json.loads(str(bundle))
        
    except Exception as e:
        logger.error(f"[STIX] Export failed: {e}")
        return {}
