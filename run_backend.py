
import sys
import os
import uvicorn

# Add 'api' directory to sys.path so modules can import each other
current_dir = os.path.dirname(os.path.abspath(__file__))
api_dir = os.path.join(current_dir, 'api')
sys.path.insert(0, api_dir)

if __name__ == "__main__":
    print(f"Starting Backend from Root... API Dir: {api_dir}")
    try:
        # Check import
        import main
        print("Import check passed.")
        
        # Run Uvicorn - pass app object directly to avoid module resolution magic issues
        uvicorn.run(main.app, host="127.0.0.1", port=8001, log_config=None)
        
    except Exception as e:
        print(f"FAILED: {e}")
        import traceback
        traceback.print_exc()
