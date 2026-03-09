import os
import requests
import json
from datetime import datetime, date
from backend.utils import generate_google_flights_link

class TravelpayoutsClient:
    def __init__(self):
        self.token = os.environ.get("TRAVELPAYOUTS_TOKEN")
        self.base_url = "https://api.travelpayouts.com"
        self.headers = {
            "X-Access-Token": self.token,
            "Accept-Encoding": "gzip, deflate"
        }
        if not self.token:
            print("TRAVELPAYOUTS_TOKEN not found. Travelpayouts will be in limited mode.")

    def get_cheap_prices(self, origin, destination="-", depart_date=None, return_date=None, currency="PLN"):
        """
        v1/prices/cheap: Returns the cheapest prices for the specified route.
        """
        url = f"{self.base_url}/v1/prices/cheap"
        params = {
            "origin": origin,
            "destination": destination,
            "depart_date": depart_date,
            "return_date": return_date,
            "currency": currency,
            "token": self.token
        }
        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            # SAVE SAMPLE FOR USER
            if data.get("success") and data.get("data"):
                os.makedirs("data", exist_ok=True)
                with open("data/api_sample.json", "w") as f:
                    json.dump(data["data"], f, indent=2)

            if data.get("success"):
                return data.get("data", {})
            return {}
        except Exception as e:
            print(f"Travelpayouts Cheap Prices Error: {e}")
            return {}

    def get_latest_prices(self, origin=None, destination=None, period_type="year", sorting="price", limit=30, currency="PLN"):
        url = f"{self.base_url}/v2/prices/latest"
        params = {"origin": origin, "destination": destination, "period_type": period_type, "sorting": sorting, "limit": limit, "currency": currency, "token": self.token}
        params = {k: v for k, v in params.items() if v is not None}
        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            if data.get("success"): return data.get("data", [])
            return []
        except Exception as e:
            print(f"Travelpayouts Latest Prices Error: {e}")
            return []

    def get_month_matrix(self, origin, destination, currency="PLN"):
        url = f"{self.base_url}/v2/prices/month-matrix"
        params = {"origin": origin, "destination": destination, "currency": currency, "token": self.token}
        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            if data.get("success"): return data.get("data", [])
            return []
        except Exception as e:
            print(f"Travelpayouts Month Matrix Error: {e}")
            return []

    def normalize_cheap_prices(self, origin, data):
        results = []
        if not data or not isinstance(data, dict): return results
        for dest, offers in data.items():
            if not isinstance(offers, dict): continue
            for idx, offer in offers.items():
                try:
                    raw_dep = offer.get('departure_at') or offer.get('departure_date')
                    if not raw_dep: continue
                    dep_date = raw_dep.split('T')[0]
                    ret_date = (offer.get('return_at') or offer.get('return_date', '')).split('T')[0] if (offer.get('return_at') or offer.get('return_date')) else None
                    results.append({
                        "id": f"tp-cheap-{origin}-{dest}-{raw_dep}",
                        "source": "Travelpayouts-Cheap",
                        "is_mock": False,
                        "origin": origin,
                        "destination": dest,
                        "departure_date": dep_date,
                        "return_date": ret_date,
                        "airline": offer.get('airline', '??'),
                        "price": float(offer.get('price', 0)),
                        "currency": "PLN",
                        "link": generate_google_flights_link(origin, dest, dep_date, ret_date)
                    })
                except Exception as e: continue
        return results

    def normalize_latest_prices(self, data):
        results = []
        if not data or not isinstance(data, list): return results
        for offer in data:
            try:
                raw_dep = offer.get('departure_at') or offer.get('departure_date')
                if not raw_dep: continue
                dep_date = raw_dep.split('T')[0]
                ret_date = offer.get('return_date') or offer.get('return_at')
                if ret_date and 'T' in ret_date: ret_date = ret_date.split('T')[0]
                results.append({
                    "id": f"tp-latest-{offer.get('origin')}-{offer.get('destination')}-{raw_dep}",
                    "source": "Travelpayouts-Latest",
                    "is_mock": False,
                    "origin": offer.get('origin'),
                    "destination": offer.get('destination'),
                    "departure_date": dep_date,
                    "return_date": ret_date,
                    "airline": offer.get('gate') or offer.get('airline'),
                    "price": float(offer.get('value') or offer.get('price', 0)),
                    "currency": "PLN",
                    "link": generate_google_flights_link(offer.get('origin'), offer.get('destination'), dep_date, ret_date)
                })
            except Exception as e: continue
        return results
