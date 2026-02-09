from datetime import datetime

def generate_yara_rule(threat_name, indicators):
    """
    Generates a YARA rule string based on provided indicators.
    
    Args:
        threat_name (str): Name of the threat (e.g., "Ransomware_X")
        indicators (list): List of suspicious strings/IOCs
        
    Returns:
        str: Formatted YARA rule
    """
    clean_name = "".join(x for x in threat_name if x.isalnum() or x == "_")
    date_str = datetime.now().strftime("%Y-%m-%d")
    
    rule = f"""rule {clean_name}_{datetime.now().strftime('%H%M')} {{
    meta:
        description = "Auto-generated Defense Rule for {threat_name}"
        author = "DarkWeb_Crawler_AI"
        date = "{date_str}"
        severity = "HIGH"
    
    strings:"""
    
    for idx, ind in enumerate(indicators):
        # Escape quotes
        safe_ind = ind.replace('"', '\\"')
        rule += f'\n        $s{idx} = "{safe_ind}"'
        
    rule += """
    
    condition:
        any of them
}"""
    
    return rule
