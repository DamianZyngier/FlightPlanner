import os
import random
from datetime import datetime
from backend.utils import generate_google_flights_link, parse_amadeus_duration, get_layover_info

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
            print("Amadeus credentials not found. Mock mode disabled.")

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
                    max=3
                )
                return self._process_response(response.data)
            except Exception as e:
                print(f"Amadeus Error ({origin}->{destination}): {e}")
                return []
        else:
            return []

    def _process_response(self, data):
        results = []
        for offer in data:
            try:
                itineraries = offer.get('itineraries', [])
                if not itineraries: continue
                
                # Outbound info
                out_itin = itineraries[0]
                out_segments = out_itin.get('segments', [])
                
                # Inbound info (if available)
                in_itin = itineraries[1] if len(itineraries) > 1 else None
                in_segments = in_itin.get('segments', []) if in_itin else []
                
                origin = out_segments[0].get('departure', {}).get('iataCode')
                dest = out_segments[-1].get('arrival', {}).get('iataCode')
                dep_date = out_segments[0].get('departure', {}).get('at').split('T')[0]
                ret_date = in_segments[-1].get('arrival', {}).get('at').split('T')[0] if in_segments else None

                results.append({
                    "id": offer.get('id'),
                    "source": "Amadeus",
                    "is_mock": False,
                    "origin": origin,
                    "destination": dest,
                    "departure_date": dep_date,
                    "return_date": ret_date,
                    "airline": out_segments[0].get('carrierCode'),
                    "price": float(offer.get('price', {}).get('total')),
                    "currency": "PLN",
                    "duration_out": parse_amadeus_duration(out_itin.get('duration')),
                    "duration_in": parse_amadeus_duration(in_itin.get('duration')) if in_itin else None,
                    "stops_out": len(out_segments) - 1,
                    "layovers_out": get_layover_info(out_segments),
                    "link": generate_google_flights_link(origin, dest, dep_date, ret_date)
                })
            except Exception as e:
                print(f"Error processing Amadeus offer: {e}")
                continue
        return results
