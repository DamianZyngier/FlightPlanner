import json
import os
from datetime import date

CONFIG_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "config.json")

def load_config():
    if os.path.exists(CONFIG_PATH):
        with open(CONFIG_PATH, "r") as f:
            return json.load(f)
    return {}

config_data = load_config()

ORIGINS = config_data.get("ORIGINS", {})
DESTINATIONS = config_data.get("DESTINATIONS", {})
PEAK_SEASONS = config_data.get("PEAK_SEASONS", {})
DEFAULT_WEIGHTS = config_data.get("DEFAULT_WEIGHTS", {})
USE_AMADEUS = config_data.get("USE_AMADEUS", False)
EMAIL_SENDER = config_data.get("EMAIL_SENDER", "")
EMAIL_RECEIVER = config_data.get("EMAIL_RECEIVER", "")

# Polish Public Holidays (2026-2027)
HOLIDAYS = [
    date(2026, 1, 1), date(2026, 1, 6), date(2026, 4, 5), date(2026, 4, 6),
    date(2026, 5, 1), date(2026, 5, 3), date(2026, 6, 3), date(2026, 8, 15),
    date(2026, 11, 1), date(2026, 11, 11), date(2026, 12, 25), date(2026, 12, 26),
    date(2027, 1, 1), date(2027, 1, 6), date(2027, 3, 28), date(2027, 3, 29),
    date(2027, 5, 1), date(2027, 5, 3), date(2027, 5, 27), date(2027, 8, 15),
    date(2027, 11, 1), date(2027, 11, 11), date(2027, 12, 25), date(2027, 12, 26),
]

# Base Airport Names (can be extended in UI)
AIRPORT_NAMES = {
    "KRK": "Kraków", "KTW": "Katowice", "OSR": "Ostrava", "RZE": "Rzeszów",
    "WAW": "Warsaw Chopin", "WMI": "Warsaw Modlin", "BUD": "Budapest",
    "BTS": "Bratislava", "VIE": "Vienna", "PRG": "Prague", "BER": "Berlin",
    "SYD": "Sydney", "MEL": "Melbourne", "BNE": "Brisbane", "PER": "Perth",
    "AKL": "Auckland", "CHC": "Christchurch", "WLG": "Wellington",
    "WDH": "Windhoek", "GBE": "Gaborone", "MUB": "Maun",
    "JNB": "Johannesburg", "CPT": "Cape Town", "DUR": "Durban",
    "TYO": "Tokyo", "KIX": "Osaka", "FUK": "Fukuoka",
    "HND": "Tokyo Haneda", "NRT": "Tokyo Narita",
    "BKK": "Bangkok", "HKT": "Phuket", "CNX": "Chiang Mai",
    "KUL": "Kuala Lumpur", "BKI": "Kota Kinabalu",
    "MNL": "Manila", "CEB": "Cebu",
    "SGN": "Ho Chi Minh City", "HAN": "Hanoi", "DAD": "Da Nang",
    "LIM": "Lima", "CUZ": "Cusco",
    "SID": "Sal", "RAI": "Praia", "BVC": "Boa Vista",
    "YYZ": "Toronto", "YVR": "Vancouver", "YUL": "Montreal", "YYC": "Calgary"
}
