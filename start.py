import os
import subprocess
import sys
import shutil
import threading
import webbrowser
import time
import json
from flask import Flask, request, jsonify, send_from_directory

app = Flask(__name__, static_folder="docs")

CONFIG_PATH = "data/config.json"
FLIGHTS_PATH = "data/flights.json"
DOCS_DATA_PATH = "docs/data/flights.json"

def run_command(command):
    print(f"Executing: {' '.join(command)}")
    try:
        # Use subprocess.run with universal_newlines=True to get text output
        result = subprocess.run(command, capture_output=True, text=True)
        return True, result.stdout
    except Exception as e:
        return False, str(e)

@app.route("/")
def serve_index():
    return send_from_directory("docs", "index.html")

@app.route("/<path:path>")
def serve_static(path):
    return send_from_directory("docs", path)

@app.route("/api/config", methods=["GET", "POST"])
def manage_config():
    if request.method == "POST":
        new_config = request.json
        with open(CONFIG_PATH, "w") as f:
            json.dump(new_config, f, indent=2)
        return jsonify({"status": "success"})
    
    if os.path.exists(CONFIG_PATH):
        with open(CONFIG_PATH, "r") as f:
            return jsonify(json.load(f))
    return jsonify({})

@app.route("/api/flights")
def get_flights():
    if os.path.exists(FLIGHTS_PATH):
        with open(FLIGHTS_PATH, "r") as f:
            return jsonify(json.load(f))
    return jsonify({"current_best": [], "history": []})

@app.route("/api/scan", methods=["POST"])
def trigger_scan():
    # Sync data to docs after scan
    success, output = run_command([sys.executable, "-m", "backend.main"])
    if success:
        if os.path.exists(FLIGHTS_PATH):
            os.makedirs(os.path.dirname(DOCS_DATA_PATH), exist_ok=True)
            shutil.copy2(FLIGHTS_PATH, DOCS_DATA_PATH)
        return jsonify({"status": "success", "output": output})
    return jsonify({"status": "error", "output": output}), 500

def check_requirements():
    try:
        import flask
        import requests
        import dotenv
        return True
    except ImportError:
        print("Missing dependencies. Installing...")
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        return True

def open_browser():
    time.sleep(2)
    webbrowser.open("http://localhost:5000")

if __name__ == "__main__":
    check_requirements()
    threading.Thread(target=open_browser, daemon=True).start()
    app.run(host="0.0.0.0", port=5000, debug=False)
