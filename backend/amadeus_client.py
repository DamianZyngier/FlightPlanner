import os
import random
from datetime import datetime
from backend.utils import generate_google_flights_link

try:
    from amadeus import Client, ResponseError
except ImportError:
    Client = None
    ResponseError = None

class FlightSearchClient:
    def __init__(self):
        self.api_key = os.environ.get("AMADEUS_API_KEY")
        self.api_secret = os.environ.get("AMADEUS_API_SECRET")
        self.client = None
        
        if self.api_key and self.api_secret and Client:
            try:
                self.client = Client(
                    client_id=self.api_key,
                    client_secret=self.api_secret
                )
                print("Amadeus client initialized.")
            except Exception as e:
                print(f"Failed to initialize Amadeus client: {e}")
        else:
            print("Amadeus credentials not found. Using MOCK mode.")

    def search_flight_offers(self, origin, destination, departure_date, return_date):
        if self.client:
            try:
                response = self.client.shopping.flight_offers_search.get(
                    originLocationCode=origin,
                    destinationLocationCode=destination,
                    departureDate=departure_date.isoformat(),
                    returnDate=return_date.isoformat(),
                    adults=1,
                    currencyCode='PLN',
                    max=3 # Keep it lean
                )
                return self._process_response(response.data)
            except Exception as e:
                print(f"Amadeus Error ({origin}->{destination}): {e}")
                return []
        else:
            return self._mock_response(origin, destination, departure_date, return_date)

    def _process_response(self, data):
        results = []
        for offer in data:
            try:
                itineraries = offer.get('itineraries', [])
                out_segments = itineraries[0].get('segments', [])
                in_segments = itineraries[1].get('segments', []) if len(itineraries) > 1 else []
                
                origin = out_segments[0].get('departure', {}).get('iataCode')
                dest = out_segments[-1].get('arrival', {}).get('iataCode')
                dep_date = out_segments[0].get('departure', {}).get('at').split('T')[0]
                ret_date = in_segments[-1].get('arrival', {}).get('at').split('T')[0] if in_segments else None

                results.append({
                    "id": offer.get('id'),
                    "source": "Amadeus",
                    "origin": origin,
                    "destination": dest,
                    "departure_date": dep_date,
                    "return_date": ret_date,
                    "airline": out_segments[0].get('carrierCode'),
                    "price": float(offer.get('price', {}).get('total')),
                    "currency": "PLN",
                    "link": generate_google_flights_link(origin, dest, dep_date, ret_date)
                })
            except: continue
        return results

    def _mock_response(self, origin, destination, dep_date, ret_date):
        dep_str = dep_date.isoformat()
        ret_str = ret_date.isoformat()
        return [{
            "id": f"mock-{random.randint(1000,9999)}",
            "source": "Mock",
            "origin": origin,
            "destination": destination,
            "departure_date": dep_str,
            "return_date": ret_str,
            "airline": "LO",
            "price": 4250.0,
            "currency": "PLN",
            "link": generate_google_flights_link(origin, destination, dep_str, ret_str)
        }]
