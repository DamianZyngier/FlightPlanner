# ✈️ Flight Monitor

A serverless flight monitoring system that tracks deals from Kraków (and surrounding airports within 300km) to Australia, New Zealand, Namibia, Botswana, and Japan.

## 🚀 Features

- **Automated Scanning**: Checks flight prices 4 times daily via GitHub Actions.
- **Smart Scoring**: Ranks flights based on Price, Duration, Distance from KRK, Days Off Required, and Seasonality.
- **Interactive Dashboard**: Static site hosted on GitHub Pages to view current best deals and price history.
- **Email Alerts**: Instant notification when a "Super Deal" is found (Score < 3.5).
- **Configurable Weights**: Adjust scoring criteria on the dashboard to find *your* perfect flight.

## 🛠️ Setup Guide

### 1. Prerequisites

- A GitHub account.
- [Kiwi.com Tequila](https://tequila.kiwi.com/) account (Free Tier: 2,000 requests per day).
- A Gmail account for sending alerts (requires App Password).

### 2. Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-username/flight-monitor.git
    cd flight-monitor
    ```

2.  **Install Python Dependencies** (for local testing):
    ```bash
    pip install -r requirements.txt
    ```

3.  **Configure Secrets in GitHub**:
    Go to `Settings` > `Secrets and variables` > `Actions` and add the following:
    - `KIWI_API_KEY`: Your Tequila API Key.
    - `EMAIL_PASSWORD`: Your Gmail App Password.

### 3. Deployment

1.  Push the code to your GitHub repository.
2.  Go to `Settings` > `Pages`.
3.  Source: **Deploy from a branch**.
4.  Branch: `main` (or `master`), Folder: `/frontend`.
5.  Save. Your dashboard will be live at `https://<your-username>.github.io/<repo-name>/`.

### 4. Local Usage

To run the scraper locally:

```bash
# Set env vars (PowerShell example)
$env:KIWI_API_KEY="your_key"
# $env:EMAIL_PASSWORD="optional"

# Run the script
python -m backend.main
```
This will update `data/flights.json`. Open `frontend/index.html` in your browser to see the results.

## 🧮 How Scoring Works

Lower score is better.
- **Price**: Normalized against 1000 PLN.
- **Duration**: Penalty for deviating from ideal 8-day trip.
- **Distance**: Penalty for flying from airports far from KRK (e.g., PRG is penalized more than KTW).
- **Days Off**: Counts workdays consumed by the trip (weekends/holidays are free).
- **Seasonality**: Bonus for flying during the destination's peak season.

## 🔮 Future Improvements

1.  **Multi-City/Open Jaw**: Support for arriving in one city and departing from another.
2.  **Calendar View**: A visual calendar showing cheapest dates for a selected destination.
3.  **User Subscriptions**: Integrate a serverless function (e.g., AWS Lambda or Google Cloud Functions) to allow other users to subscribe to alerts via a form.
4.  **Route Visualization**: Map view of the flight path using Leaflet.js.

## 📄 License

MIT
