import os
import json
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta, date
from dotenv import load_dotenv

load_dotenv() # Load local .env file if it exists

from backend.config import ORIGINS, DESTINATIONS, EMAIL_SENDER, EMAIL_RECEIVER, USE_AMADEUS
from backend.amadeus_client import FlightSearchClient
from backend.travelpayouts_client import TravelpayoutsClient
from backend.scorer import FlightScorer

DATA_FILE = "data/flights.json"

class FlightMonitor:
    def __init__(self):
        self.amadeus = FlightSearchClient()
        self.travelpayouts = TravelpayoutsClient()
        self.scorer = FlightScorer()
        self.data = self.load_data()

    def load_data(self):
        if os.path.exists(DATA_FILE):
            try:
                with open(DATA_FILE, 'r') as f:
                    return json.load(f)
            except:
                return {"current_best": [], "history": []}
        return {"current_best": [], "history": []}

    def save_data(self):
        # Ensure directory exists
        os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
        with open(DATA_FILE, 'w') as f:
            json.dump(self.data, f, indent=2)

    def send_email(self, flight):
        password = os.environ.get("EMAIL_PASSWORD")
        if not password:
            print("No EMAIL_PASSWORD set. Skipping email.")
            return

        msg = MIMEMultipart()
        msg['From'] = EMAIL_SENDER
        msg['To'] = EMAIL_RECEIVER
        msg['Subject'] = f"✈️ FLIGHT DEAL: {flight['destination']} for {flight['price']} PLN!"

        body = f"""
        <h1>Super Deal Found!</h1>
        <p><strong>Source:</strong> {flight['source']}</p>
        <p><strong>Destination:</strong> {flight['destination']} ({flight['airline']})</p>
        <p><strong>Dates:</strong> {flight['departure_date']} to {flight['return_date']}</p>
        <p><strong>Price:</strong> {flight['price']} {flight['currency']}</p>
        <p><strong>Score:</strong> {flight['score']}</p>
        <br>
        <a href="{flight['link']}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none;">Check Google Flights</a>
        """
        msg.attach(MIMEText(body, 'html'))

        try:
            server = smtplib.SMTP('smtp.gmail.com', 587)
            server.starttls()
            server.login(EMAIL_SENDER, password)
            server.send_message(msg)
            server.quit()
        except Exception as e:
            print(f"Failed to send email: {e}")

    def run(self):
        print(f"Starting Flight Scan at {datetime.now()}")
        
        all_flights = []
        
        # 1. TRAVELPAYOUTS BROAD SCAN
        # Check all origins for cheap long-haul destinations
        origins_to_check = ["KRK", "WAW", "BER", "VIE"]
        for origin in origins_to_check:
            print(f"Broad Scan (Travelpayouts) for {origin}...")
            # Using v1/prices/cheap with destination='-' to get a map of cheap destinations
            cheap_data = self.travelpayouts.get_cheap_prices(origin)
            normalized = self.travelpayouts.normalize_cheap_prices(origin, cheap_data)
            
            for f in normalized:
                # Filter for our regions of interest
                is_target = False
                for region, dests in DESTINATIONS.items():
                    if f['destination'] in dests:
                        is_target = True
                        break
                
                if is_target and f.get('return_date'):
                    all_flights.append(self.scorer.score_flight(f))

        # 2. TRAVELPAYOUTS LATEST SCAN (Global Hunting)
        print("Hunting for latest global deals...")
        latest_data = self.travelpayouts.get_latest_prices(limit=50)
        normalized_latest = self.travelpayouts.normalize_latest_prices(latest_data)
        for f in normalized_latest:
            if f['origin'] in ORIGINS and f.get('return_date'):
                 all_flights.append(self.scorer.score_flight(f))

        # 3. AMADEUS PRECISION LAYER
        if USE_AMADEUS:
            all_flights.sort(key=lambda x: x['score'])
            top_contenders = all_flights[:5]
            
            print(f"Refining {len(top_contenders)} deals with Amadeus...")
            refined_flights = []
            for deal in top_contenders:
                dep_date = datetime.strptime(deal['departure_date'], "%Y-%m-%d").date()
                ret_date = datetime.strptime(deal['return_date'], "%Y-%m-%d").date()
                
                amadeus_results = self.amadeus.search_flight_offers(
                    deal['origin'], deal['destination'], dep_date, ret_date
                )
                for f in amadeus_results:
                    refined_flights.append(self.scorer.score_flight(f))
            
            all_flights.extend(refined_flights)
        else:
            print("Skipping Amadeus refinement (USE_AMADEUS = False).")

        # Update and Save Data
        self.data['last_updated'] = datetime.now().isoformat()
        
        combined = self.data.get('current_best', []) + all_flights
        # Remove duplicates
        unique = { (f['origin'], f['destination'], f['departure_date']): f for f in combined }.values()
        
        sorted_unique = sorted(unique, key=lambda x: x['score'])
        self.data['current_best'] = sorted_unique[:50]
        
        self.save_data()

        if sorted_unique and sorted_unique[0]['score'] < 3.5:
            self.send_email(sorted_unique[0])

        print(f"Done. Found {len(all_flights)} potential deals.")

if __name__ == "__main__":
    monitor = FlightMonitor()
    monitor.run()
