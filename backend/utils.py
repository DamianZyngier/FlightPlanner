import json
import os
import urllib.parse
from datetime import date, timedelta, datetime
from backend.config import HOLIDAYS

def load_json(path, default=None):
    if os.path.exists(path):
        try:
            with open(path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading JSON from {path}: {e}")
    return default if default is not None else {}

def save_json(path, data):
    try:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"Error saving JSON to {path}: {e}")

def calculate_days_off_detailed(start_date: date, end_date: date):
    """
    Calculates the number of work days and holiday counts.
    Returns (days_off_needed, holiday_count)
    """
    days_off_needed = 0
    holiday_count = 0
    current_date = start_date
    while current_date <= end_date:
        # Check if holiday first (could be on weekend, but still counts as holiday for info)
        is_holiday = current_date in HOLIDAYS
        if is_holiday:
            holiday_count += 1
        
        # Calculate work days (not weekend AND not holiday)
        if current_date.weekday() < 5 and not is_holiday:
            days_off_needed += 1
            
        current_date += timedelta(days=1)
    return days_off_needed, holiday_count

def calculate_days_off(start_date: date, end_date: date) -> int:
    days_off, _ = calculate_days_off_detailed(start_date, end_date)
    return days_off

def parse_amadeus_duration(duration_str):
    """Converts PT23H15M to '23h 15m'"""
    import re
    match = re.search(r'PT(?:(\d+)H)?(?:(\d+)M)?', duration_str)
    if not match: return duration_str
    h, m = match.groups()
    return f"{h or 0}h {m or 0}m"

def get_layover_info(segments):
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
    if not ret_date:
        query = f"Flights to {destination} from {origin} on {dep_date}"
    else:
        query = f"Flights to {destination} from {origin} on {dep_date} through {ret_date}"
    return f"https://www.google.com/travel/flights?q={urllib.parse.quote(query)}&curr=PLN"
