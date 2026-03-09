from datetime import date, timedelta
import urllib.parse
from backend.config import HOLIDAYS

import re

def calculate_days_off(start_date: date, end_date: date) -> int:
# ... existing code ...

def parse_amadeus_duration(duration_str):
    """Converts PT23H15M to '23h 15m'"""
    match = re.search(r'PT(?:(\d+)H)?(?:(\d+)M)?', duration_str)
    if not match: return duration_str
    h, m = match.groups()
    return f"{h or 0}h {m or 0}m"

def get_layover_info(segments):
    """Calculates layovers between segments."""
    layovers = []
    for i in range(len(segments) - 1):
        arr_time = datetime.fromisoformat(segments[i]['arrival']['at'].replace('Z', ''))
        dep_time = datetime.fromisoformat(segments[i+1]['departure']['at'].replace('Z', ''))
        diff = (dep_time - arr_time).total_seconds() / 60
        
        hours = int(diff // 60)
        mins = int(diff % 60)
        
        status = "short" if diff < 90 else "long" if diff > 360 else "medium"
        layovers.append({
            "airport": segments[i]['arrival']['iataCode'],
            "duration": f"{hours}h {mins}m",
            "status": status
        })
    return layovers

def generate_google_flights_link(origin, destination, dep_date, ret_date):
    """
    Generates a functional Google Flights search link.
    """
    base = "https://www.google.com/travel/flights?q="
    query = f"Flights to {destination} from {origin} on {dep_date}"
    if ret_date:
        query += f" returning {ret_date}"
    
    return base + urllib.parse.quote(query)
