# ✈️ Flight Monitor

A serverless flight monitoring system that tracks deals from Kraków (and surrounding airports within 300km) to Australia, New Zealand, Namibia, Botswana, and Japan.

## 🚀 Features

- **Automated Scanning**: Checks flight prices 4 times daily via GitHub Actions.
- **Smart Scoring**: Ranks flights based on Price, Duration, Distance from KRK, Days Off Required, and Seasonality.
- **Interactive Dashboard**: Static site hosted on GitHub Pages to view current best deals and price history.
- **Email Alerts**: Instant notification when a "Super Deal" is found (Score < 3.8).
- **Configurable Weights**: Adjust scoring criteria on the dashboard to find *your* perfect flight.

## 🛠️ Setup Guide

### 1. Prerequisites

- A GitHub account.
- [Amadeus for Developers](https://developers.amadeus.com/) account (Free tier: 2,000 requests per month).
- A Gmail account for sending alerts (requires App Password).

### 2. Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-username/flight-monitor.git
    cd flight-monitor
    ```

2.  **Install Python Dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

3.  **Configure Secrets in GitHub**:
    Go to `Settings` > `Secrets and variables` > `Actions` and add the following:
    - `AMADEUS_API_KEY`: Your Amadeus API Key.
    - `AMADEUS_API_SECRET`: Your Amadeus API Secret.
    - `EMAIL_PASSWORD`: Your Gmail App Password.

### 3. Deployment

1.  Push the code to your GitHub repository.
2.  Go to `Settings` > `Pages`.
3.  Source: **Deploy from a branch**.
4.  Branch: `main` / Folder: `/frontend`.
5.  Save.

### 4. Local Usage

To run the scraper locally:

```bash
# Set env vars (PowerShell example)
$env:AMADEUS_API_KEY="your_key"
$env:AMADEUS_API_SECRET="your_secret"

# Run the script
python -m backend.main
```

## 🧮 How Scoring Works

Lower score is better.
- **Price**: Normalized against 1000 PLN.
- **Duration**: Penalty for deviating from ideal 8-day trip.
- **Distance**: Penalty for flying from airports far from KRK.
- **Days Off**: Counts workdays consumed by the trip.
- **Seasonality**: Bonus for flying during the destination's peak season.

## 📄 License

MIT
