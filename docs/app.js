document.addEventListener('DOMContentLoaded', () => {
    const API_FLIGHTS = '/api/flights';
    const API_CONFIG = '/api/config';
    const API_SCAN = '/api/scan';

    let flightData = null;
    let configData = null;
    let chartInstance = null;
    let originsList = {};

    // UI Elements
    const elements = {
        scanBtn: document.getElementById('scan-btn'),
        scanStatus: document.getElementById('scan-status'),
        lastUpdated: document.getElementById('last-updated'),
        dealsGrid: document.getElementById('deals-grid'),
        destList: document.getElementById('dest-list'),
        addDestBtn: document.getElementById('add-dest-btn'),
        newDestCountry: document.getElementById('new-dest-country'),
        newDestCode: document.getElementById('new-dest-code'),
        originDist: document.getElementById('origin-dist'),
        valDistKrk: document.getElementById('val-dist-krk'),
        bestPrice: document.getElementById('stat-best-price'),
        totalRoutes: document.getElementById('stat-total-routes'),
        navBtns: document.querySelectorAll('.nav-btn'),
        tabContents: document.querySelectorAll('.tab-content'),
        tabTitle: document.getElementById('current-tab-title')
    };

    const AIRPORT_NAMES = {
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
    };

    async function init() {
        await loadConfig();
        await loadFlights();
        setupEventListeners();
        renderDestinations();
    }

    async function loadConfig() {
        try {
            const resp = await fetch(API_CONFIG);
            configData = await resp.json();
            originsList = configData.ORIGINS || {};
        } catch (e) { console.error("Config load failed", e); }
    }

    async function loadFlights() {
        try {
            const resp = await fetch(API_FLIGHTS);
            flightData = await resp.json();
            if (flightData.last_updated) {
                elements.lastUpdated.innerText = `Last Updated: ${new Date(flightData.last_updated).toLocaleString()}`;
            }
            renderDashboard();
        } catch (e) { console.error("Flight load failed", e); }
    }

    function setupEventListeners() {
        elements.navBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                elements.navBtns.forEach(b => b.classList.remove('active'));
                elements.tabContents.forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById(`${tab}-tab`).classList.add('active');
                elements.tabTitle.innerText = btn.innerText.split(' ')[1];
            });
        });

        elements.originDist.addEventListener('input', (e) => {
            elements.valDistKrk.innerText = e.target.value;
            renderDashboard();
        });

        elements.scanBtn.addEventListener('click', async () => {
            elements.scanBtn.disabled = true;
            elements.scanBtn.innerText = "⏳ Scanning...";
            elements.scanStatus.innerText = "Processing matrix...";
            try {
                const resp = await fetch(API_SCAN, { method: 'POST' });
                const result = await resp.json();
                if (result.status === 'success') {
                    elements.scanStatus.innerText = "Scan complete!";
                    await loadFlights();
                } else {
                    elements.scanStatus.innerText = "Error: " + result.output;
                }
            } catch (e) {
                elements.scanStatus.innerText = "Failed to trigger scan.";
            } finally {
                elements.scanBtn.disabled = false;
                elements.scanBtn.innerText = "🚀 Run Flight Scan";
            }
        });

        elements.addDestBtn.addEventListener('click', async () => {
            const country = elements.newDestCountry.value.toUpperCase();
            const code = elements.newDestCode.value.toUpperCase();
            if (country && code) {
                if (!configData.DESTINATIONS) configData.DESTINATIONS = {};
                if (!configData.DESTINATIONS[country]) configData.DESTINATIONS[country] = [];
                if (!configData.DESTINATIONS[country].includes(code)) {
                    configData.DESTINATIONS[country].push(code);
                    await saveConfig();
                    renderDestinations();
                    elements.newDestCountry.value = '';
                    elements.newDestCode.value = '';
                }
            }
        });
    }

    async function saveConfig() {
        await fetch(API_CONFIG, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(configData)
        });
    }

    function getAirportDisplay(code) {
        return AIRPORT_NAMES[code] ? `${AIRPORT_NAMES[code]} (${code})` : code;
    }

    function calculateScore(flight, weights) {
        const bd = flight.score_breakdown;
        if (!bd) return 0;
        const price_score = bd.price_raw / 1000.0;
        const days_score = bd.days_off;
        const dist_score = bd.dist_km / 100.0;
        const dur_diff = Math.abs(bd.duration_days - 8);
        const season_score = bd.in_season ? 0 : 1;

        return parseFloat((
            (price_score * weights.price) +
            (days_score * weights.days) +
            (dist_score * weights.distance) +
            (dur_diff * weights.duration) +
            (season_score * weights.season * 5)
        ).toFixed(2));
    }

    function renderItinerary(f) {
        if (!f.duration_out) {
            return `<div class="itinerary-line"><div class="stops-row"><span class="duration-tag">Details via Precision Scan</span></div></div>`;
        }

        const stopsLabel = f.stops_out === 0 ? 'Direct' : `${f.stops_out} Stop${f.stops_out > 1 ? 's' : ''}`;
        
        let layoverHtml = '';
        if (f.layovers_out && f.layovers_out.length > 0) {
            layoverHtml = `<div class="layover-badges">`;
            f.layovers_out.forEach(l => {
                layoverHtml += `<span class="badge badge-${l.status}">${l.airport}: ${l.duration}</span>`;
            });
            layoverHtml += `</div>`;
        }

        return `
            <div class="itinerary-line">
                <div class="stops-row">
                    <span class="duration-tag">${f.duration_out}</span>
                    <div class="timeline">
                        <div class="timeline-dot" style="left: 0;"></div>
                        ${f.stops_out > 0 ? `<div class="timeline-dot" style="left: 50%;"></div><span class="timeline-label">${stopsLabel}</span>` : ''}
                        <div class="timeline-dot" style="left: 100%;"></div>
                    </div>
                </div>
                ${layoverHtml}
            </div>
        `;
    }

    function renderDashboard() {
        if (!flightData || !flightData.current_best) return;

        const maxOriginDist = parseInt(elements.originDist.value);
        const weights = { price: 0.5, duration: 0.2, distance: 0.1, days: 0.1, season: 0.1 };

        let flights = flightData.current_best
            .filter(f => !f.is_mock)
            .filter(f => (originsList[f.origin] || 0) <= maxOriginDist)
            .map(f => ({ ...f, ui_score: calculateScore(f, weights) }));

        flights.sort((a, b) => a.ui_score - b.ui_score);

        elements.totalRoutes.innerText = flights.length;
        elements.bestPrice.innerText = flights.length > 0 ? `${flights[0].price} ${flights[0].currency}` : "--";

        elements.dealsGrid.innerHTML = '';
        flights.forEach(f => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <div class="score-badge">Score: ${f.ui_score}</div>
                <div class="card-header">
                    <span class="destination">${getAirportDisplay(f.destination)}</span>
                    <span class="price">${f.price} ${f.currency}</span>
                </div>
                
                ${renderItinerary(f)}

                <div class="details">
                    <div class="detail-row"><span>From</span> <span>${getAirportDisplay(f.origin)}</span></div>
                    <div class="detail-row"><span>Airline</span> <span>${f.airline}</span></div>
                    <div class="detail-row"><span>Dates</span> <span>${f.departure_date} - ${f.return_date}</span></div>
                </div>
                <a href="${f.link}" target="_blank" class="book-btn">View on Google Flights</a>
            `;
            elements.dealsGrid.appendChild(card);
        });

        renderHistory(flightData.history);
    }

    function renderDestinations() {
        if (!configData || !configData.DESTINATIONS) return;
        elements.destList.innerHTML = '';
        Object.entries(configData.DESTINATIONS).forEach(([country, codes]) => {
            codes.forEach(code => {
                const tag = document.createElement('div');
                tag.className = 'tag';
                tag.innerHTML = `<span>${country}: <strong>${code}</strong></span><span class="tag-remove" data-country="${country}" data-code="${code}">×</span>`;
                tag.querySelector('.tag-remove').addEventListener('click', async (e) => {
                    const c = e.target.dataset.country;
                    const cd = e.target.dataset.code;
                    configData.DESTINATIONS[c] = configData.DESTINATIONS[c].filter(x => x !== cd);
                    if (configData.DESTINATIONS[c].length === 0) delete configData.DESTINATIONS[c];
                    await saveConfig();
                    renderDestinations();
                });
                elements.destList.appendChild(tag);
            });
        });
    }

    function renderHistory(history) {
        if (!history || history.length === 0) return;
        const canvas = document.getElementById('historyChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dates = history.map(h => new Date(h.date).toLocaleDateString());
        const countries = new Set();
        history.forEach(h => { if (h.stats) Object.keys(h.stats).forEach(k => countries.add(k)); });

        const datasets = Array.from(countries).map((country, index) => {
            const data = history.map(h => h.stats && h.stats[country] ? h.stats[country].avg : null);
            const colors = ['#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6'];
            return {
                label: country, data: data, borderColor: colors[index % colors.length],
                backgroundColor: 'transparent', tension: 0.3
            };
        });

        if (chartInstance) chartInstance.destroy();
        chartInstance = new Chart(ctx, {
            type: 'line',
            data: { labels: dates, datasets: datasets },
            options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
        });
    }

    init();
});
