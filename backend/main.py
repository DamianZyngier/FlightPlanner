import os
import json
from datetime import datetime, date
from concurrent.futures import ThreadPoolExecutor
from dotenv import load_dotenv

load_dotenv()

from backend.amadeus_client import FlightSearchClient
from backend.travelpayouts_client import TravelpayoutsClient
from backend.scorer import FlightScorer
from backend.config import CONFIG_PATH, FLIGHTS_PATH, USE_AMADEUS
from backend.utils import load_json, save_json

class FlightMonitor:
    def __init__(self):
        self.config = load_json(CONFIG_PATH)
        self.amadeus = FlightSearchClient()
        self.travelpayouts = TravelpayoutsClient()
        self.scorer = FlightScorer()
        self.data = load_json(FLIGHTS_PATH, default={"current_best": [], "history": []})

    def scan_origin(self, origin, destinations):
        """Worker for ThreadPoolExecutor."""
        print(f"Searching from {origin}...")
        try:
            raw_data = self.travelpayouts.get_cheap_prices(origin)
            normalized = self.travelpayouts.normalize_cheap_prices(origin, raw_data)
            
            origin_results = []
            for f in normalized:
                # Flat check if destination is in any of our tracked lists
                is_tracked = any(f['destination'] in codes for codes in destinations.values())
                if is_tracked and f.get('return_date'):
                    origin_results.append(self.scorer.score_flight(f))
            return origin_results
        except Exception as e:
            print(f"Error scanning origin {origin}: {e}")
            return []

    def run(self):
        start_time = datetime.now()
        print(f"[{start_time}] Starting optimized parallel scan...")
        
        origins = self.config.get("ORIGINS", {})
        destinations = self.config.get("DESTINATIONS", {})

        # Phase 1: Travelpayouts Parallel Scan
        all_flights = []
        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(self.scan_origin, o, destinations) for o in origins]
            for future in futures:
                all_flights.extend(future.result())

        # Phase 2: Amadeus Refinement (Optional)
        if USE_AMADEUS:
            all_flights.sort(key=lambda x: x['score'], reverse=True)
            for deal in all_flights[:5]:
                try:
                    print(f"Refining {deal['origin']} -> {deal['destination']}...")
                    refined = self.amadeus.search_flight_offers(
                        deal['origin'], deal['destination'],
                        datetime.strptime(deal['departure_date'], "%Y-%m-%d").date(),
                        datetime.strptime(deal['return_date'], "%Y-%m-%d").date()
                    )
                    all_flights.extend([self.scorer.score_flight(rf) for rf in refined])
                except Exception as e:
                    print(f"Amadeus refinement failed for {deal['destination']}: {e}")

        # Deduplicate and Update
        unique = { (f['origin'], f['destination'], f['departure_date']): f for f in all_flights }.values()
        self.data['current_best'] = sorted(unique, key=lambda x: x['score'], reverse=True)[:50]
        self.data['last_updated'] = datetime.now().isoformat()
        
        # Update History Stats
        today_str = date.today().isoformat()
        stats = {}
        for country, codes in destinations.items():
            prices = [f['price'] for f in all_flights if f['destination'] in codes]
            if prices: stats[country] = {"avg": round(sum(prices)/len(prices), 2)}
        
        updated_history = [h for h in self.data.get('history', []) if h['date'] != today_str]
        updated_history.append({"date": today_str, "stats": stats})
        self.data['history'] = updated_history[-30:]
        
        save_json(FLIGHTS_PATH, self.data)
        duration = datetime.now() - start_time
        print(f"Scan complete in {duration.total_seconds():.1f}s. Found {len(all_flights)} options.")

if __name__ == "__main__":
    FlightMonitor().run()
