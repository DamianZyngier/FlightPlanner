from datetime import datetime
from backend.config import ORIGINS, DESTINATIONS, PEAK_SEASONS, DEFAULT_WEIGHTS
from backend.utils import calculate_days_off_detailed

class FlightScorer:
    def __init__(self, weights=None):
        self.weights = weights or DEFAULT_WEIGHTS

    def score_flight(self, flight_data):
        # 1. Price Score
        price = flight_data['price']
        price_pts = max(0, min(100, 100 - (price - 1500) / 60))

        # 2. Distance Score
        dist_km = ORIGINS.get(flight_data['origin'], 600)
        dist_pts = max(0, min(100, 100 - (dist_km / 6)))

        # 3. Days Off & Holidays
        dep_date = datetime.strptime(flight_data['departure_date'], "%Y-%m-%d").date()
        ret_date = datetime.strptime(flight_data['return_date'], "%Y-%m-%d").date() if flight_data.get('return_date') else dep_date
        
        days_off, holiday_count = calculate_days_off_detailed(dep_date, ret_date)
        days_pts = max(0, min(100, 100 - (days_off * 10)))

        # 4. Seasonality
        dest_code = flight_data['destination']
        country_code = self._get_country_code(dest_code)
        month = dep_date.month
        in_season = False
        if country_code and country_code in PEAK_SEASONS:
            if month in PEAK_SEASONS[country_code]:
                in_season = True
        season_pts = 100 if in_season else 20

        # Duration & Efficiency
        duration_days = (ret_date - dep_date).days
        efficiency = duration_days - days_off # Higher is better

        # Weighted Sum (Using backend weights as baseline)
        final_score = (
            price_pts * self.weights.get('price', 0.5) +
            days_pts * self.weights.get('days_off', 0.2) +
            dist_pts * self.weights.get('distance_krk', 0.1) +
            season_pts * self.weights.get('seasonality', 0.2)
        )

        flight_data['score'] = round(final_score, 1)
        flight_data['score_breakdown'] = {
            "price_raw": price,
            "days_off": days_off,
            "holiday_count": holiday_count,
            "dist_km": dist_km,
            "in_season": in_season,
            "duration_days": duration_days,
            "efficiency": efficiency
        }
        return flight_data

    def _get_country_code(self, airport_code):
        for country, airports in DESTINATIONS.items():
            if airport_code in airports:
                return country
        return None
