import os
import subprocess
import sys
import shutil
import time
import json
from flask import Flask, request, jsonify, send_from_directory
from backend.config import CONFIG_PATH, FLIGHTS_PATH, DOCS_DATA_PATH

app = Flask(__name__, static_folder="docs")

def run_command(command):
    print(f"Executing: {' '.join(command)}")
    try:
        result = subprocess.run(command, capture_output=True, text=True)
        return result.returncode == 0, result.stdout + result.stderr
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
        with open(CONFIG_PATH, "w", encoding="utf-8") as f: 
            json.dump(new_config, f, indent=2)
        return jsonify({"status": "success"})
    
    if os.path.exists(CONFIG_PATH):
        with open(CONFIG_PATH, "r", encoding="utf-8") as f: 
            return jsonify(json.load(f))
    return jsonify({})

@app.route("/api/flights")
def get_flights():
    if os.path.exists(FLIGHTS_PATH):
        with open(FLIGHTS_PATH, "r", encoding="utf-8") as f: 
            return jsonify(json.load(f))
    return jsonify({"current_best": [], "history": []})

@app.route("/api/scan", methods=["POST"])
def trigger_scan():
    # Use 'py' on Windows if available, else sys.executable
    py_exe = "py" if sys.platform == "win32" else sys.executable
    success, output = run_command([py_exe, "-m", "backend.main"])
    
    if success:
        if os.path.exists(FLIGHTS_PATH):
            os.makedirs(os.path.dirname(DOCS_DATA_PATH), exist_ok=True)
            shutil.copy2(FLIGHTS_PATH, DOCS_DATA_PATH)
        return jsonify({"status": "success", "output": output})
    return jsonify({"status": "error", "output": output}), 500

@app.route("/api/precision", methods=["POST"])
def trigger_precision():
    req = request.json
    origin = req.get('origin')
    dest = req.get('destination')
    dep = req.get('departure_date')
    ret = req.get('return_date')
    
    if not all([origin, dest, dep, ret]):
        return jsonify({"status": "error", "message": "Missing parameters"}), 400

    # Use 'py' on Windows if available, else sys.executable
    py_exe = "py" if sys.platform == "win32" else sys.executable
    success, output = run_command([py_exe, "-m", "backend.main", "--precision", origin, dest, dep, ret])
    
    if success:
        if os.path.exists(FLIGHTS_PATH):
            os.makedirs(os.path.dirname(DOCS_DATA_PATH), exist_ok=True)
            shutil.copy2(FLIGHTS_PATH, DOCS_DATA_PATH)
        return jsonify({"status": "success", "output": output})
    return jsonify({"status": "error", "output": output}), 500

if __name__ == "__main__":
    print("Flight Planner Pro starting...")
    print(f"Config: {CONFIG_PATH}")
    print(f"Data: {FLIGHTS_PATH}")
    app.run(host="0.0.0.0", port=5000, debug=True)
