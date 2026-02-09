import requests
import os
import tempfile
import logging
from stegano import lsb
try:
    from PIL import Image
except ImportError:
    pass

logger = logging.getLogger(__name__)

def scan_image(image_url):
    """
    Downloads an image and attempts to reveal hidden LSB text.
    Returns the hidden text if found, else None.
    """
    temp_path = None
    try:
        # 1. Download Image
        response = requests.get(image_url, timeout=5, stream=True)
        if response.status_code != 200:
            return None
        
        # 2. Save to Temp File
        fd, temp_path = tempfile.mkstemp(suffix=".png")
        os.close(fd)
        
        with open(temp_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
                
        # 3. Attempt Decode
        # stegano.lsb.reveal returns the string or raises IndexError/TypeError if nothing found
        try:
             secret = lsb.reveal(temp_path)
             if secret:
                 return secret
        except Exception:
            # Most images won't have hidden text, so this is expected
            pass
            
        return None
        
    except Exception as e:
        logger.warning(f"[Stego] Failed to scan {image_url}: {e}")
        return None
    finally:
        # Cleanup
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except:
                pass
