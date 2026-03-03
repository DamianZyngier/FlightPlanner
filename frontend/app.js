document.addEventListener('DOMContentLoaded', () => {
    const DATA_URL = './data/flights.json'; // Assumes data is copied to frontend/data/
    let flightData = null;
    let chartInstance = null;

    // Sliders
    const sliders = {
        price: document.getElementById('w-price'),
        duration: document.getElementById('w-duration'),
        distance: document.getElementById('w-distance'),
        days: document.getElementById('w-days'),
        season: document.getElementById('w-season')
    };

    const labels = {
        price: document.getElementById('val-price'),
        duration: document.getElementById('val-duration'),
        distance: document.getElementById('val-distance'),
        days: document.getElementById('val-days'),
        season: document.getElementById('val-season')
    };

    // Load Data
    fetch(DATA_URL)
        .then(response => response.json())
        .then(data => {
            flightData = data;
            document.getElementById('last-updated').innerText = `Last Updated: ${new Date(data.last_updated).toLocaleString()}`;
            init();
        })
        .catch(err => {
            console.error('Error loading flight data:', err);
            document.getElementById('deals-grid').innerHTML = '<p>Error loading data. Please try again later.</p>';
        });

    function init() {
        // Init listeners
        Object.keys(sliders).forEach(key => {
            sliders[key].addEventListener('input', (e) => {
                labels[key].innerText = e.target.value;
                renderFlights();
            });
        });

        renderFlights();
        renderHistory();
    }

    function calculateScore(flight, weights) {
        // Reconstruct score logic from backend/scorer.py
        // We have the breakdown in flight.score_breakdown
        const bd = flight.score_breakdown;
        
        // breakdown keys: price_component (pre-weighted), price_raw, etc.
        // We need raw normalized values to re-weight.
        // Backend: price_score = price / 1000
        const price_score = bd.price_raw / 1000.0;
        const days_score = bd.days_off;
        const dist_score = bd.dist_km / 100.0;
        const dur_diff = Math.abs(bd.duration_days - 8);
        const season_score = bd.in_season ? 0 : 1;

        const final_score = 
            (price_score * weights.price) +
            (days_score * weights.days) +
            (dist_score * weights.distance) +
            (dur_diff * weights.duration) +
            (season_score * weights.season * 5);

        return parseFloat(final_score.toFixed(2));
    }

    function renderFlights() {
        if (!flightData || !flightData.current_best) return;

        const weights = {
            price: parseFloat(sliders.price.value),
            duration: parseFloat(sliders.duration.value),
            distance: parseFloat(sliders.distance.value),
            days: parseFloat(sliders.days.value),
            season: parseFloat(sliders.season.value)
        };

        // Rescore and Sort
        const flights = flightData.current_best.map(f => {
            return { ...f, ui_score: calculateScore(f, weights) };
        });

        flights.sort((a, b) => a.ui_score - b.ui_score);

        const grid = document.getElementById('deals-grid');
        grid.innerHTML = '';

        flights.forEach(f => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <div class="score-badge">Score: ${f.ui_score}</div>
                <div class="card-header">
                    <span class="destination">${f.destination}</span>
                    <span class="price">${f.price} ${f.currency}</span>
                </div>
                <div class="details">
                    <div><strong>From:</strong> ${f.origin}</div>
                    <div><strong>Date:</strong> ${f.departure_date}</div>
                    <div><strong>Return:</strong> ${f.return_date}</div>
                    <div><strong>Airline:</strong> ${f.airline}</div>
                    <div><strong>Days Off:</strong> ${f.score_breakdown.days_off}</div>
                    <div><strong>Duration:</strong> ${f.score_breakdown.duration_days} days</div>
                </div>
                <a href="${f.link}" target="_blank" class="book-btn">Check Deal</a>
            `;
            grid.appendChild(card);
        });
    }

    function renderHistory() {
        if (!flightData || !flightData.history) return;

        const ctx = document.getElementById('historyChart').getContext('2d');
        const history = flightData.history;
        
        // Prepare datasets
        // We need labels (dates) and datasets (one per country)
        const dates = history.map(h => new Date(h.date).toLocaleDateString());
        
        // Identify all countries present in history
        const countries = new Set();
        history.forEach(h => {
            if (h.stats) Object.keys(h.stats).forEach(k => countries.add(k));
        });

        const datasets = Array.from(countries).map((country, index) => {
            const data = history.map(h => h.stats && h.stats[country] ? h.stats[country].avg : null);
            // Color palette
            const colors = ['#e74c3c', '#3498db', '#2ecc71', '#9b59b6', '#f1c40f'];
            const color = colors[index % colors.length];

            return {
                label: country,
                data: data,
                borderColor: color,
                backgroundColor: 'transparent',
                tension: 0.1
            };
        });

        if (chartInstance) chartInstance.destroy();

        chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: datasets
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: false,
                        title: { display: true, text: 'Avg Price (PLN)' }
                    }
                }
            }
        });
    }
});
