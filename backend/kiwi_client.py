import os
import requests
import random
from datetime import datetime

class KiwiClient:
    def __init__(self):
        self.api_key = os.environ.get("KIWI_API_KEY")
        self.base_url = "https://api.tequila.kiwi.com/v2/search"

    def search_flights(self, origins, destinations, dep_from, dep_to, ret_from, ret_to):
        """
        Uses Kiwi's 'fly_from' and 'fly_to' which support multiple locations.
        Example: fly_from="KRK,KTW,WAW", fly_to="SYD,MEL,TYO"
        """
        if not self.api_key:
            print("KIWI_API_KEY not found. Using MOCK mode.")
            return self._mock_response(origins, destinations, dep_from)

        headers = {"apikey": self.api_key}
        params = {
            "fly_from": ",".join(origins),
            "fly_to": ",".join(destinations),
            "date_from": dep_from.strftime("%d/%m/%Y"),
            "date_to": dep_to.strftime("%d/%m/%Y"),
            "return_from": ret_from.strftime("%d/%m/%Y"),
            "return_to": ret_to.strftime("%d/%m/%Y"),
            "nights_in_dst_from": 7,
            "nights_in_dst_to": 10,
            "curr": "PLN",
            "limit": 50,
            "sort": "price"
        }

        try:
            response = requests.get(self.base_url, headers=headers, params=params)
            response.raise_for_status()
            data = response.json()
            return self._process_response(data['data'])
        except Exception as e:
            print(f"Kiwi API Error: {e}")
            return []

    def _process_response(self, data):
        results = []
        for flight in data:
            results.append({
                "id": flight['id'],
                "source": "Kiwi",
                "origin": flight['cityCodeFrom'],
                "destination": flight['cityCodeTo'],
                "departure_date": flight['local_departure'].split('T')[0],
                "return_date": flight['route'][-1]['local_departure'].split('T')[0],
                "airline": flight['airlines'][0],
                "price": float(flight['price']),
                "currency": "PLN",
                "duration_total": flight['duration']['total'] / 3600, # Hours
                "link": flight['deep_link']
            })
        return results

    def _mock_response(self, origins, destinations, dep_date):
        return [{
            "id": f"mock-{random.randint(1000,9999)}",
            "source": "Mock",
            "origin": random.choice(origins),
            "destination": random.choice(destinations),
            "departure_date": dep_date.isoformat(),
            "return_date": (dep_date).isoformat(),
            "airline": "LO",
            "price": 3500.0,
            "currency": "PLN",
            "duration_total": 22,
            "link": "#"
        }]
