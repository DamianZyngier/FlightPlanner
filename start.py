import os
import subprocess
import sys
import shutil
import http.server
import socketserver
import threading
import webbrowser
import time

def run_command(command):
    print(f"Executing: {' '.join(command)}")
    try:
        subprocess.run(command, check=True)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error executing command: {e}")
        return False

def check_requirements():
    print("Checking dependencies...")
    try:
        import requests
        import dotenv
        return True
    except ImportError:
        print("Missing dependencies. Installing from requirements.txt...")
        return run_command([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])

def main():
    # 1. Install/Check Requirements
    if not check_requirements():
        print("Failed to prepare environment. Please check your internet connection.")
        # We continue anyway, maybe they just want to see existing data
    
    # 2. Run Backend Scanner
    print("\n--- Starting Flight Scan (Phase 1) ---")
    # We use -m to handle package imports correctly
    if run_command([sys.executable, "-m", "backend.main"]):
        print("Scan completed successfully.")
    else:
        print("Scan failed or returned errors. Check your .env file.")

    # 3. Sync Data to Frontend
    print("\n--- Syncing Data to Frontend (Phase 2) ---")
    src = os.path.join("data", "flights.json")
    dst_dir = os.path.join("docs", "data")
    dst = os.path.join(dst_dir, "flights.json")

    if os.path.exists(src):
        os.makedirs(dst_dir, exist_ok=True)
        shutil.copy2(src, dst)
        print(f"Data synced: {src} -> {dst}")
    else:
        print(f"Warning: {src} not found. UI might show old or no data.")

    # 4. Start Local Server
    PORT = 8000
    DIRECTORY = "docs"

    class Handler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=DIRECTORY, **kwargs)

    print(f"\n--- Launching Local Server (Phase 3) ---")
    print(f"Serving at: http://localhost:{PORT}")
    
    # Function to open browser after a short delay
    def open_browser():
        time.sleep(1.5)
        webbrowser.open(f"http://localhost:{PORT}")

    threading.Thread(target=open_browser, daemon=True).start()

    try:
        with socketserver.TCPServer(("", PORT), Handler) as httpd:
            print("Press Ctrl+C to stop the server.")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
    except Exception as e:
        print(f"Could not start server: {e}")

if __name__ == "__main__":
    main()
