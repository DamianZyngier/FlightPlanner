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
        result = subprocess.run(command, capture_output=True, text=True)
        return True, result.stdout
    except Exception as e:
        return False, str(e)

@app.route("/")
def serve_index(): return send_from_directory("docs", "index.html")

@app.route("/<path:path>")
def serve_static(path): return send_from_directory("docs", path)

@app.route("/api/config", methods=["GET", "POST"])
def manage_config():
    if request.method == "POST":
        new_config = request.json
        with open(CONFIG_PATH, "w") as f: json.dump(new_config, f, indent=2)
        return jsonify({"status": "success"})
    if os.path.exists(CONFIG_PATH):
        with open(CONFIG_PATH, "r") as f: return jsonify(json.load(f))
    return jsonify({})

@app.route("/api/flights")
def get_flights():
    if os.path.exists(FLIGHTS_PATH):
        with open(FLIGHTS_PATH, "r") as f: return jsonify(json.load(f))
    return jsonify({"current_best": [], "history": []})

@app.route("/api/scan", methods=["POST"])
def trigger_scan():
    success, output = run_command([sys.executable, "-m", "backend.main"])
    if success:
        if os.path.exists(FLIGHTS_PATH):
            os.makedirs(os.path.dirname(DOCS_DATA_PATH), exist_ok=True)
            shutil.copy2(FLIGHTS_PATH, DOCS_DATA_PATH)
        return jsonify({"status": "success", "output": output})
    return jsonify({"status": "error", "output": output}), 500

@app.route("/api/precision", methods=["POST"])
def trigger_precision():
    """Targeted scan for one route/date pair."""
    req = request.json
    origin = req.get('origin')
    dest = req.get('destination')
    dep = req.get('departure_date')
    ret = req.get('return_date')
    
    # We use a special flag or environment to tell main.py to do ONLY this one
    # For now, we'll implement a small helper in a new temporary script
    # but a better way is to just call Amadeus directly here if keys are local
    from backend.amadeus_client import FlightSearchClient
    from datetime import datetime
    
    client = FlightSearchClient()
    results = client.search_flight_offers(
        origin, dest, 
        datetime.strptime(dep, "%Y-%m-%d").date(),
        datetime.strptime(ret, "%Y-%m-%d").date()
    )
    
    # Update the local flights.json with these details if found
    if results:
        with open(FLIGHTS_PATH, 'r') as f:
            data = json.load(f)
        
        # Find the flight and update it
        for f in data['current_best']:
            if f['origin'] == origin and f['destination'] == dest and f['departure_date'] == dep:
                # Update with precise details
                f.update(results[0])
                break
        
        with open(FLIGHTS_PATH, 'w') as f:
            json.dump(data, f, indent=2)
        shutil.copy2(FLIGHTS_PATH, DOCS_DATA_PATH)
        return jsonify({"status": "success", "data": results[0]})
    
    return jsonify({"status": "error", "message": "No precise results found"}), 404

def check_requirements():
    try:
        import flask, requests, dotenv
        return True
    except ImportError:
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        return True

def open_browser():
    time.sleep(2)
    webbrowser.open("http://localhost:5000")

if __name__ == "__main__":
    check_requirements()
    threading.Thread(target=open_browser, daemon=True).start()
    app.run(host="0.0.0.0", port=5000, debug=False)
