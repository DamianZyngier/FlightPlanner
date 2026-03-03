import os
import json
import random
from datetime import datetime, timedelta
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
            print("Amadeus credentials not found or library missing. Using MOCK mode.")

    def search_flight_offers(self, origin, destination, departure_date, return_date):
        """
        Searches for flight offers.
        Returns a list of simplified flight objects.
        """
        if self.client:
            try:
                response = self.client.shopping.flight_offers_search.get(
                    originLocationCode=origin,
                    destinationLocationCode=destination,
                    departureDate=departure_date.isoformat(),
                    returnDate=return_date.isoformat(),
                    adults=1,
                    currencyCode='PLN',
                    max=5 # Limit results per query to save bandwidth/processing
                )
                return self._process_response(response.data)
            except ResponseError as error:
                print(f"Amadeus API Error: {error}")
                return []
            except Exception as e:
                print(f"Error searching flights: {e}")
                return []
        else:
            return self._mock_response(origin, destination, departure_date, return_date)

    def _process_response(self, data):
        results = []
        for offer in data:
            try:
                # Extract simplified data
                itineraries = offer.get('itineraries', [])
                if not itineraries:
                    continue
                
                # Outbound
                out_segments = itineraries[0].get('segments', [])
                if not out_segments:
                    continue
                departure_time = out_segments[0].get('departure', {}).get('at')
                arrival_time = out_segments[-1].get('arrival', {}).get('at')
                airline = out_segments[0].get('carrierCode')
                
                # Inbound (if exists)
                in_segments = itineraries[1].get('segments', []) if len(itineraries) > 1 else []
                return_arrival = in_segments[-1].get('arrival', {}).get('at') if in_segments else None

                price_total = offer.get('price', {}).get('total')
                currency = offer.get('price', {}).get('currency')

                flight = {
                    "id": offer.get('id'),
                    "source": "Amadeus",
                    "origin": out_segments[0].get('departure', {}).get('iataCode'),
                    "destination": out_segments[-1].get('arrival', {}).get('iataCode'),
                    "departure_date": departure_time.split('T')[0],
                    "return_date": return_arrival.split('T')[0] if return_arrival else None,
                    "airline": airline,
                    "price": float(price_total),
                    "currency": currency,
                    "duration_iso": itineraries[0].get('duration'), # PT15H30M
                    "link": f"https://www.google.com/travel/flights?q=Flights%20to%20{out_segments[-1].get('arrival', {}).get('iataCode')}%20from%20{out_segments[0].get('departure', {}).get('iataCode')}%20on%20{departure_time.split('T')[0]}" # deeply simplified link
                }
                results.append(flight)
            except Exception as e:
                print(f"Error parsing offer: {e}")
                continue
        return results

    def _mock_response(self, origin, destination, departure_date, return_date):
        # Generate fake data for testing
        base_price = 4000
        if destination in ["SYD", "MEL"]: base_price = 5500
        if destination in ["TYO"]: base_price = 4500
        
        # Random variation
        price = base_price + random.randint(-500, 1000)
        
        return [{
            "id": f"mock-{random.randint(1000,9999)}",
            "source": "Mock",
            "origin": origin,
            "destination": destination,
            "departure_date": departure_date.isoformat(),
            "return_date": return_date.isoformat(),
            "airline": random.choice(["LH", "EK", "QR", "LO"]),
            "price": float(price),
            "currency": "PLN",
            "duration_iso": "PT20H",
            "link": "#"
        }]
