import os
import json
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta, date

from backend.config import ORIGINS, DESTINATIONS, EMAIL_SENDER, EMAIL_RECEIVER
from backend.kiwi_client import KiwiClient
from backend.scorer import FlightScorer

DATA_FILE = "data/flights.json"

class FlightMonitor:
    def __init__(self):
        self.client = KiwiClient()
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
        msg['Subject'] = f"✈️ KIWI DEAL: {flight['destination']} for {flight['price']} PLN!"

        body = f"""
        <h1>Super Deal Found on Kiwi!</h1>
        <p><strong>Destination:</strong> {flight['destination']} ({flight['airline']})</p>
        <p><strong>Dates:</strong> {flight['departure_date']} to {flight['return_date']}</p>
        <p><strong>Price:</strong> {flight['price']} {flight['currency']}</p>
        <p><strong>Score:</strong> {flight['score']}</p>
        <br>
        <a href="{flight['link']}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none;">Book on Kiwi</a>
        """
        msg.attach(MIMEText(body, 'html'))

        try:
            server = smtplib.SMTP('smtp.gmail.com', 587)
            server.starttls()
            server.login(EMAIL_SENDER, password)
            server.send_message(msg)
            server.quit()
        except Exception as e:
            print(f"Email failed: {e}")

    def run(self):
        print(f"Starting Kiwi flight search at {datetime.now()}")
        
        # We can search all at once!
        origins = ["KRK", "KTW", "WAW", "WMI", "VIE", "PRG", "BUD"]
        destinations = []
        for d_list in DESTINATIONS.values():
            destinations.extend(d_list)

        # Date Range: Next 4 months
        dep_from = date.today() + timedelta(days=7)
        dep_to = date.today() + timedelta(days=120)

        # In return_from/to we specify trip duration via nights_in_dst in client
        # but Kiwi API needs return dates if we want to be specific
        # We'll search for return flights within the same range
        flights = self.client.search_flights(
            origins, destinations, dep_from, dep_to, dep_from, dep_to
        )

        scored_flights = []
        for f in flights:
            scored_flights.append(self.scorer.score_flight(f))

        scored_flights.sort(key=lambda x: x['score'])
        
        top_deals = scored_flights[:30]
        self.data['last_updated'] = datetime.now().isoformat()
        self.data['current_best'] = top_deals
        
        # History entry
        today_iso = date.today().isoformat()
        history_entry = {"date": today_iso, "stats": {}}
        for country in DESTINATIONS.keys():
            c_flights = [f for f in scored_flights if f['destination'] in DESTINATIONS[country]]
            if c_flights:
                avg = sum(f['price'] for f in c_flights) / len(c_flights)
                history_entry["stats"][country] = {"avg": round(avg, 2), "min": min(f['price'] for f in c_flights)}
        
        self.data['history'].append(history_entry)
        self.save_data()

        # Alert if score < 3.5
        if top_deals and top_deals[0]['score'] < 3.5:
            self.send_email(top_deals[0])

        print(f"Done. Found {len(scored_flights)} flights.")

if __name__ == "__main__":
    monitor = FlightMonitor()
    monitor.run()
