import requests
import logging
import time

logger = logging.getLogger(__name__)

# Rate limiting for free tier
LAST_CALL = 0

def analyze_wallet(address, coin="btc"):
    """
    Query BlockCypher to get wallet intelligence.
    Returns dict with stats.
    """
    global LAST_CALL
    
    # Simple Rate Limit (3 calls per second allowed, we do 1 per 2s to be safe)
    if time.time() - LAST_CALL < 2:
        time.sleep(1)
        
    url = f"https://api.blockcypher.com/v1/{coin}/main/addrs/{address}/balance"
    
    try:
        response = requests.get(url, timeout=10)
        LAST_CALL = time.time()
        
        if response.status_code == 200:
            data = response.json()
            return {
                "address": address,
                "total_received": data.get("total_received", 0),
                "final_balance": data.get("final_balance", 0),
                "n_tx": data.get("n_tx", 0),
                "risk_flag": data.get("total_received", 0) > 1000000000 # Flag if > 10 BTC (approx) received
            }
        elif response.status_code == 429:
            logger.warning(f"[Crypto] Rate limit hit for {address}")
            return {"address": address, "error": "Rate Limit"}
        else:
            return {"address": address, "error": f"API Error {response.status_code}"}
            
    except Exception as e:
        logger.error(f"[Crypto] Analysis failed for {address}: {e}")
        return {"address": address, "error": str(e)}
