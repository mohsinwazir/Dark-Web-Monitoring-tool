
import socks
import socket
import time
import requests

def wait_for_tor_connection(proxy_port=9150, timeout=300):
    print(f"Waiting for Tor to bootstrap on port {proxy_port}...")
    
    # Configure SOCKS proxy
    socks.set_default_proxy(socks.SOCKS5, "127.0.0.1", proxy_port)
    socket.socket = socks.socksocket
    
    start_time = time.time()
    
    while time.time() - start_time < timeout:
        try:
            print(f"Attempting to connect via Tor (Time elapsed: {int(time.time() - start_time)}s)...")
            # Try to fetch a reliable clearweb site via Tor first to check circuit
            requests.get("http://check.torproject.org", timeout=10)
            print("✅ Tor is CONNECTED and routing traffic!")
            return True
        except Exception as e:
            print(f"⏳ Tor not ready yet: {e}")
            time.sleep(5)
            
    print("❌ Timed out waiting for Tor connection.")
    return False

if __name__ == "__main__":
    # Try default Tor Browser port first
    if not wait_for_tor_connection(9150, timeout=60):
        # Fallback to system Tor or alternative config
        print("Switching to port 9050...")
        if not wait_for_tor_connection(9050, timeout=60):
            sys.exit(1)
