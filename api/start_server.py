
import sys
import os
import uvicorn

# Ensure current directory is in sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    print(f"Starting server... CWD: {os.getcwd()}")
    print(f"Path: {sys.path}")
    try:
        # Import app to verify dependencies before starting
        from main import app
        print("App imported successfully.")
        
        uvicorn.run(app, host="127.0.0.1", port=8000, log_level="info")
    except Exception as e:
        print(f"Failed to start: {e}")
        import traceback
        traceback.print_exc()
