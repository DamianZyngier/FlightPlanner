from datetime import date, timedelta
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
