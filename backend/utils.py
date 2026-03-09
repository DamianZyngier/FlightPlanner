from datetime import date, timedelta
import urllib.parse
from backend.config import HOLIDAYS

def calculate_days_off(start_date: date, end_date: date) -> int:
    """
    Calculates the number of work days (days off needed) between start and end date inclusive.
    """
    days_off_needed = 0
    current_date = start_date
    while current_date <= end_date:
        # Check if weekend (Sat=5, Sun=6)
        if current_date.weekday() >= 5:
            pass # Weekend
        # Check if holiday
        elif current_date in HOLIDAYS:
            pass # Holiday
        else:
            days_off_needed += 1
        current_date += timedelta(days=1)
    return days_off_needed

def parse_amadeus_duration(duration_str):
    """Converts PT23H15M to '23h 15m'"""
    import re
    match = re.search(r'PT(?:(\d+)H)?(?:(\d+)M)?', duration_str)
    if not match: return duration_str
    h, m = match.groups()
    return f"{h or 0}h {m or 0}m"

def get_layover_info(segments):
    """Calculates layovers between segments."""
    from datetime import datetime
    layovers = []
    for i in range(len(segments) - 1):
        try:
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
        except: continue
    return layovers

def generate_google_flights_link(origin, destination, dep_date, ret_date):
    """
    Generates a functional Google Flights search link.
    Using the standard search URL format.
    """
    # Format: https://www.google.com/travel/flights/search?tfs=CBwQAhoeEgoyMDI0LTA2LTI4agwIAhIIL20vMGRsdjB6Gh4SCjIwMjQtMDctMDVqDAIAEgkvbS8wMWx6ZzhwAcIBCwj___________8BQAFIAZgBAw
    # Simpler version that works better:
    base = "https://www.google.com/travel/flights?q="
    query = f"Flights to {destination} from {origin} on {dep_date}"
    if ret_date:
        query += f" returning {ret_date}"
    
    return base + urllib.parse.quote(query)
