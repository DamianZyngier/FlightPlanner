import os
import requests
from datetime import datetime, date

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
            if data.get("success"):
                return data.get("data", {})
            return {}
        except Exception as e:
            print(f"Travelpayouts Cheap Prices Error: {e}")
            return {}

    def get_latest_prices(self, origin=None, destination=None, period_type="year", sorting="price", limit=30, currency="PLN"):
        """
        v2/prices/latest: Returns the latest prices found by users for a route.
        Good for hunting globally for very low value fares.
        """
        url = f"{self.base_url}/v2/prices/latest"
        params = {
            "origin": origin,
            "destination": destination,
            "period_type": period_type,
            "sorting": sorting,
            "limit": limit,
            "currency": currency,
            "token": self.token
        }
        # Clean None values
        params = {k: v for k, v in params.items() if v is not None}
        
        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            if data.get("success"):
                return data.get("data", [])
            return []
        except Exception as e:
            print(f"Travelpayouts Latest Prices Error: {e}")
            return []

    def get_month_matrix(self, origin, destination, currency="PLN"):
        """
        v2/prices/month-matrix: Returns a matrix of prices for a month.
        """
        url = f"{self.base_url}/v2/prices/month-matrix"
        params = {
            "origin": origin,
            "destination": destination,
            "currency": currency,
            "token": self.token
        }
        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            if data.get("success"):
                return data.get("data", [])
            return []
        except Exception as e:
            print(f"Travelpayouts Month Matrix Error: {e}")
            return []

    def normalize_cheap_prices(self, origin, data):
        """
        Normalizes v1/prices/cheap response data.
        """
        results = []
        for dest, offers in data.items():
            for idx, offer in offers.items():
                results.append({
                    "id": f"tp-cheap-{origin}-{dest}-{offer['departure_at']}",
                    "source": "Travelpayouts-Cheap",
                    "origin": origin,
                    "destination": dest,
                    "departure_date": offer['departure_at'].split('T')[0],
                    "return_date": offer.get('return_at', '').split('T')[0] if offer.get('return_at') else None,
                    "airline": offer['airline'],
                    "price": float(offer['price']),
                    "currency": "PLN",
                    "link": f"https://www.google.com/travel/flights?q=Flights%20to%20{dest}%20from%20{origin}"
                })
        return results

    def normalize_latest_prices(self, data):
        """
        Normalizes v2/prices/latest response data.
        """
        results = []
        for offer in data:
            results.append({
                "id": f"tp-latest-{offer['origin']}-{offer['destination']}-{offer['departure_at']}",
                "source": "Travelpayouts-Latest",
                "origin": offer['origin'],
                "destination": offer['destination'],
                "departure_date": offer['departure_at'].split('T')[0],
                "return_date": offer.get('return_date'),
                "airline": offer.get('gate'), # Gate/Airline
                "price": float(offer['value']),
                "currency": "PLN",
                "link": f"https://www.google.com/travel/flights?q=Flights%20to%20{offer['destination']}%20from%20{offer['origin']}"
            })
        return results
