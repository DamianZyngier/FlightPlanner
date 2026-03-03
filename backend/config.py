from datetime import date

# Origin Airports and their distance from KRK (km)
ORIGINS = {
    "KRK": 0,    # Krakow
    "KTW": 80,   # Katowice
    "OSR": 170,  # Ostrava
    "RZE": 160,  # Rzeszow
    "WAW": 300,  # Warsaw Chopin
    "WMI": 310,  # Warsaw Modlin
    "BUD": 400,  # Budapest
    "BTS": 450,  # Bratislava
    "VIE": 460,  # Vienna
    "PRG": 540,  # Prague
    "BER": 600   # Berlin (often cheap long haul, close enough for dedicated travelers)
}

# Destinations
DESTINATIONS = {
    "AU": ["SYD", "MEL", "BNE", "PER"], # Australia
    "NZ": ["AKL", "CHC", "WLG"],        # New Zealand
    "NA": ["WDH"],                      # Namibia (Windhoek)
    "BW": ["GBE", "MUB"],               # Botswana (Gaborone, Maun)
    "JP": ["TYO", "KIX", "FUK"],        # Japan (Tokyo, Osaka, Fukuoka)
}

# Peak Seasons (approximate months for best weather)
# 1 = Jan, 12 = Dec
PEAK_SEASONS = {
    "AU": [12, 1, 2, 3, 4, 10, 11], # Summer/Shoulder
    "NZ": [12, 1, 2, 3],            # Summer
    "NA": [5, 6, 7, 8, 9, 10],      # Dry Season (safari)
    "BW": [5, 6, 7, 8, 9, 10],      # Dry Season (safari)
    "JP": [3, 4, 5, 10, 11]         # Cherry Blossom / Autumn
}

# Polish Public Holidays (2026-2027)
HOLIDAYS = [
    date(2026, 1, 1),
    date(2026, 1, 6),
    date(2026, 4, 5),
    date(2026, 4, 6),
    date(2026, 5, 1),
    date(2026, 5, 3),
    date(2026, 6, 3),
    date(2026, 8, 15),
    date(2026, 11, 1),
    date(2026, 11, 11),
    date(2026, 12, 25),
    date(2026, 12, 26),
    # 2027
    date(2027, 1, 1),
    date(2027, 1, 6),
    date(2027, 3, 28),
    date(2027, 3, 29),
    date(2027, 5, 1),
    date(2027, 5, 3),
    date(2027, 5, 27),
    date(2027, 8, 15),
    date(2027, 11, 1),
    date(2027, 11, 11),
    date(2027, 12, 25),
    date(2027, 12, 26),
]

# Default Scoring Weights
DEFAULT_WEIGHTS = {
    "price": 0.5,
    "duration": 0.2,
    "distance_krk": 0.1,
    "days_off": 0.1,
    "seasonality": 0.1
}

# Email Config
EMAIL_SENDER = "zyngi23@gmail.com"  # The user's email is both sender (via SMTP) and receiver
EMAIL_RECEIVER = "zyngi23@gmail.com"
