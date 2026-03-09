import os
import json
import sys
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

    def precision_scan(self, origin, destination, dep_date, ret_date):
        """Performs a targeted Amadeus search and updates the flights database."""
        print(f"Performing precision scan: {origin} -> {destination} ({dep_date} to {ret_date})")
        try:
            # Parse dates
            d1 = datetime.strptime(dep_date, "%Y-%m-%d").date()
            d2 = datetime.strptime(ret_date, "%Y-%m-%d").date()
            
            # Use Amadeus for high-precision data
            refined = self.amadeus.search_flight_offers(origin, destination, d1, d2)
            scored = []
            for rf in refined:
                sf = self.scorer.score_flight(rf)
                sf['was_precision_scanned'] = True
                scored.append(sf)
            
            if not scored:
                print("No results found in precision scan.")
                return False
            
            # Update data: merge with current_best
            all_flights = self.data.get('current_best', []) + scored
            
            # Deduplicate (prefer Amadeus results which usually have more details)
            unique = { (f['origin'], f['destination'], f['departure_date']): f for f in all_flights }.values()
            self.data['current_best'] = sorted(unique, key=lambda x: x['score'], reverse=True)[:50]
            self.data['last_updated'] = datetime.now().isoformat()
            
            save_json(FLIGHTS_PATH, self.data)
            print(f"Precision scan complete. Added/Updated {len(scored)} options.")
            return True
        except Exception as e:
            print(f"Precision scan failed: {e}")
            return False

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
    monitor = FlightMonitor()
    # Support command line args for targeted precision scan
    if len(sys.argv) > 1 and sys.argv[1] == "--precision":
        # Usage: python -m backend.main --precision KRK TYO 2026-05-10 2026-05-20
        if len(sys.argv) == 6:
            monitor.precision_scan(sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5])
        else:
            print("Usage: python -m backend.main --precision <origin> <dest> <dep> <ret>")
    else:
        monitor.run()
