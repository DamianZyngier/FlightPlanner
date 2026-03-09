import unittest
from datetime import date
from backend.utils import calculate_days_off_detailed, parse_amadeus_duration
from backend.scorer import FlightScorer

class TestFlightPlannerLogic(unittest.TestCase):
    
    def test_calculate_days_off_detailed(self):
        # 2026-01-01 is Thursday (Holiday)
        # 2026-01-02 is Friday (Work day)
        # 2026-01-03 is Saturday (Weekend)
        # 2026-01-04 is Sunday (Weekend)
        # 2026-01-05 is Monday (Work day)
        # 2026-01-06 is Tuesday (Holiday)
        
        start = date(2026, 1, 1)
        end = date(2026, 1, 6)
        
        days_off, holidays = calculate_days_off_detailed(start, end)
        
        # Work days: Jan 2, Jan 5 -> 2 days off
        # Holidays: Jan 1, Jan 6 -> 2 holidays
        self.assertEqual(days_off, 2)
        self.assertEqual(holidays, 2)

    def test_parse_amadeus_duration(self):
        self.assertEqual(parse_amadeus_duration("PT23H15M"), "23h 15m")
        self.assertEqual(parse_amadeus_duration("PT5H"), "5h 0m")
        self.assertEqual(parse_amadeus_duration("PT45M"), "0h 45m")

    def test_scorer_efficiency(self):
        scorer = FlightScorer()
        flight = {
            "price": 3000,
            "origin": "KRK",
            "destination": "TYO",
            "departure_date": "2026-05-01", # Friday (Holiday)
            "return_date": "2026-05-10",    # Sunday
            "airline": "LO"
        }
        # May 1 (Fri) - Holiday
        # May 2 (Sat) - Weekend
        # May 3 (Sun) - Weekend/Holiday
        # May 4-8 (Mon-Fri) - 5 Work Days
        # May 9-10 (Sat-Sun) - Weekend
        # Total days duration: 9. Work days off: 5. Efficiency (free days): 9 - 5 = 4.
        
        scored = scorer.score_flight(flight)
        self.assertEqual(scored['score_breakdown']['holiday_count'], 2) # May 1, May 3
        self.assertEqual(scored['score_breakdown']['days_off'], 5)
        self.assertEqual(scored['score_breakdown']['efficiency'], 4)

if __name__ == '__main__':
    unittest.main()
