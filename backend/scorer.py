from datetime import datetime
from backend.config import ORIGINS, DESTINATIONS, PEAK_SEASONS, DEFAULT_WEIGHTS
from backend.utils import calculate_days_off

class FlightScorer:
    def __init__(self, weights=None):
        self.weights = weights or DEFAULT_WEIGHTS

    def score_flight(self, flight_data):
        """
        Calculates a composite score for a flight. Lower is better.
        """
        # 1. Price Score (PLN / 1000)
        # 4000 PLN -> 4.0
        price_score = flight_data['price'] / 1000.0

        # 2. Distance from KRK Score (km / 100)
        # KRK (0) -> 0
        # PRG (540) -> 5.4
        dist_km = ORIGINS.get(flight_data['origin'], 500) # Default penalty if unknown
        distance_score = dist_km / 100.0

        # 3. Days Off Score (Number of days)
        # Ideal 0 (holidays), typical 5-6
        dep_date = datetime.strptime(flight_data['departure_date'], "%Y-%m-%d").date()
        ret_date = datetime.strptime(flight_data['return_date'], "%Y-%m-%d").date()
        days_off = calculate_days_off(dep_date, ret_date)
        days_off_score = days_off

        # 4. Duration Score (Deviation from 8 days)
        # 8 days -> 0
        # 10 days -> 2
        trip_duration = (ret_date - dep_date).days
        duration_diff = abs(trip_duration - 8)
        duration_score = duration_diff

        # 5. Seasonality Score (0 = In Season, 1 = Out of Season)
        dest_code = flight_data['destination']
        country_code = self._get_country_code(dest_code)
        month = dep_date.month
        
        in_season = False
        if country_code and country_code in PEAK_SEASONS:
            if month in PEAK_SEASONS[country_code]:
                in_season = True
        
        season_score = 0 if in_season else 1

        # Weighted Sum
        # weights should be calibrated.
        # User requirements:
        # - Price (High impact)
        # - Days off (High impact)
        # - Distance (Medium)
        # - Duration (Medium)
        
        # Let's adjust raw scores to be somewhat comparable before weighting?
        # Price ~4-10. Days ~5. Dist ~0-5. Dur ~0-3. Season ~0-1.
        # They are roughly same magnitude, except season is binary.
        
        final_score = (
            price_score * self.weights['price'] +
            days_off_score * self.weights['days_off'] +
            distance_score * self.weights['distance_krk'] +
            duration_score * self.weights['duration'] +
            season_score * self.weights['seasonality'] * 5 # Boost season impact
        )

        flight_data['score'] = round(final_score, 2)
        flight_data['score_breakdown'] = {
            "price_raw": flight_data['price'],
            "price_component": round(price_score * self.weights['price'], 2),
            "days_off": days_off,
            "dist_km": dist_km,
            "duration_days": trip_duration,
            "in_season": in_season
        }
        return flight_data

    def _get_country_code(self, airport_code):
        for country, airports in DESTINATIONS.items():
            if airport_code in airports:
                return country
        return None
