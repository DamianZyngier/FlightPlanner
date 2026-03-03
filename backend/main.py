import os
import json
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta, date

from backend.config import DESTINATIONS, EMAIL_SENDER, EMAIL_RECEIVER
from backend.amadeus_client import FlightSearchClient
from backend.scorer import FlightScorer

DATA_FILE = "data/flights.json"

class FlightMonitor:
    def __init__(self):
        self.client = FlightSearchClient()
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
        msg['Subject'] = f"✈️ AMADEUS DEAL: {flight['destination']} for {flight['price']} PLN!"

        body = f"""
        <h1>Super Deal Found on Amadeus!</h1>
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
        except: pass

    def run(self):
        print(f"Starting Amadeus Lean Search at {datetime.now()}")
        
        # Lean Selection: 2 Origins, 5 Hubs
        origins = ["KRK", "WAW"]
        hubs = {
            "AU": "SYD",
            "NZ": "AKL",
            "NA": "WDH",
            "BW": "GBE",
            "JP": "TYO"
        }

        # Dates: 2 specific windows to minimize API calls (10 total requests per run)
        today = date.today()
        dates_to_check = []
        
        # Next Friday
        curr = today + timedelta(days=1)
        while curr.weekday() != 4: curr += timedelta(days=1)
        dates_to_check.append(curr)
        
        # One random Friday in 2 months
        future = today + timedelta(days=60)
        while future.weekday() != 4: future += timedelta(days=1)
        dates_to_check.append(future)

        all_flights = []
        for origin in origins:
            for country, dest in hubs.items():
                for dep_date in dates_to_check:
                    # Ideal duration: 8 days
                    ret_date = dep_date + timedelta(days=8)
                    
                    print(f"Searching {origin} -> {dest}...")
                    flights = self.client.search_flight_offers(origin, dest, dep_date, ret_date)
                    for f in flights:
                        all_flights.append(self.scorer.score_flight(f))

        all_flights.sort(key=lambda x: x['score'])
        
        # Update Data
        self.data['last_updated'] = datetime.now().isoformat()
        # Keep current best deals (mix of all runs)
        # Combine existing and new, then filter for top scores
        combined = self.data['current_best'] + all_flights
        # Remove duplicates (roughly by ID or key details)
        unique = { (f['origin'], f['destination'], f['departure_date']): f for f in combined }.values()
        
        sorted_unique = sorted(unique, key=lambda x: x['score'])
        self.data['current_best'] = sorted_unique[:30]
        
        # Stats entry
        history_entry = {"date": today.isoformat(), "stats": {}}
        for country, hub in hubs.items():
            c_flights = [f for f in all_flights if f['destination'] == hub]
            if c_flights:
                history_entry["stats"][country] = {"avg": round(sum(f['price'] for f in c_flights)/len(c_flights), 2)}
        
        self.data['history'].append(history_entry)
        self.save_data()

        if sorted_unique and sorted_unique[0]['score'] < 3.8:
            self.send_email(sorted_unique[0])

        print(f"Done. Searched {len(origins)*len(hubs)*len(dates_to_check)} pairs.")

if __name__ == "__main__":
    monitor = FlightMonitor()
    monitor.run()
