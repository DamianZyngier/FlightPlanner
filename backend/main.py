import os
import json
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta, date
from dotenv import load_dotenv

load_dotenv()

from backend.amadeus_client import FlightSearchClient
from backend.travelpayouts_client import TravelpayoutsClient
from backend.scorer import FlightScorer

CONFIG_FILE = "data/config.json"
DATA_FILE = "data/flights.json"

class FlightMonitor:
    def __init__(self):
        self.config = self._load_json(CONFIG_FILE)
        self.amadeus = FlightSearchClient()
        self.travelpayouts = TravelpayoutsClient()
        self.scorer = FlightScorer()
        self.data = self._load_json(DATA_FILE, default={"current_best": [], "history": []})

    def _load_json(self, path, default=None):
        if os.path.exists(path):
            with open(path, 'r') as f:
                try: return json.load(f)
                except: return default or {}
        return default or {}

    def save_data(self):
        os.makedirs("data", exist_ok=True)
        with open(DATA_FILE, 'w') as f:
            json.dump(self.data, f, indent=2)

    def run(self):
        print(f"[{datetime.now()}] Starting optimized scan...")
        all_flights = []
        
        origins = self.config.get("ORIGINS", {})
        destinations = self.config.get("DESTINATIONS", {})

        # Phase 1: Travelpayouts Broad Scan
        for origin in origins:
            print(f"Searching from {origin}...")
            raw_data = self.travelpayouts.get_cheap_prices(origin)
            normalized = self.travelpayouts.normalize_cheap_prices(origin, raw_data)
            
            for f in normalized:
                # Flat check if destination is in any of our tracked lists
                is_tracked = any(f['destination'] in codes for codes in destinations.values())
                if is_tracked and f.get('return_date'):
                    all_flights.append(self.scorer.score_flight(f))

        # Phase 2: Amadeus Refinement (Optional)
        if self.config.get("USE_AMADEUS", False):
            all_flights.sort(key=lambda x: x['score'])
            for deal in all_flights[:5]:
                print(f"Refining {deal['origin']} -> {deal['destination']}...")
                refined = self.amadeus.search_flight_offers(
                    deal['origin'], deal['destination'],
                    datetime.strptime(deal['departure_date'], "%Y-%m-%d").date(),
                    datetime.strptime(deal['return_date'], "%Y-%m-%d").date()
                )
                all_flights.extend([self.scorer.score_flight(rf) for f in refined])

        # deduplicate and Update
        unique = { (f['origin'], f['destination'], f['departure_date']): f for f in all_flights }.values()
        self.data['current_best'] = sorted(unique, key=lambda x: x['score'])[:50]
        self.data['last_updated'] = datetime.now().isoformat()
        
        # History Stats (simplified)
        today_str = date.today().isoformat()
        stats = {}
        for country, codes in destinations.items():
            prices = [f['price'] for f in all_flights if f['destination'] in codes]
            if prices: stats[country] = {"avg": round(sum(prices)/len(prices), 2)}
        
        self.data['history'].append({"date": today_str, "stats": stats})
        self.data['history'] = self.data['history'][-30:] # Keep last 30 runs
        
        self.save_data()
        print(f"Scan complete. Found {len(all_flights)} options.")

if __name__ == "__main__":
    FlightMonitor().run()
