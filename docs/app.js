/**
 * Flight Planner Pro - Optimized Dashboard Script
 */

const AIRPORT_NAMES = {
    "KRK": "Kraków", "KTW": "Katowice", "OSR": "Ostrava", "RZE": "Rzeszów",
    "WAW": "Warsaw", "WMI": "Modlin", "BUD": "Budapest", "BTS": "Bratislava",
    "VIE": "Vienna", "PRG": "Prague", "BER": "Berlin", "SYD": "Sydney",
    "MEL": "Melbourne", "BNE": "Brisbane", "PER": "Perth", "AKL": "Auckland",
    "WDH": "Windhoek", "GBE": "Gaborone", "JNB": "Johannesburg", "CPT": "Cape Town",
    "TYO": "Tokyo", "BKK": "Bangkok", "HKT": "Phuket", "KUL": "Kuala Lumpur",
    "MNL": "Manila", "SGN": "Ho Chi Minh", "LIM": "Lima", "CUZ": "Cusco",
    "SID": "Sal", "YYZ": "Toronto", "YVR": "Vancouver"
};

class FlightPlanner {
    constructor() {
        this.data = { flights: null, config: null };
        this.chart = null;
        this.els = this.getElements();
        this.init();
    }

    getElements() {
        const query = (id) => document.getElementById(id);
        return {
            scanBtn: query('scan-btn'),
            scanStatus: query('scan-status'),
            lastUpdated: query('last-updated'),
            dealsGrid: query('deals-grid'),
            destList: query('dest-list'),
            originDist: query('origin-dist'),
            valDistKrk: query('val-dist-krk'),
            bestPrice: query('stat-best-price'),
            totalRoutes: query('stat-total-routes'),
            addBtn: query('add-dest-btn'),
            inCountry: query('new-dest-country'),
            inCode: query('new-dest-code')
        };
    }

    async init() {
        await this.loadConfig();
        await this.loadFlights();
        this.bindEvents();
        this.renderDestinations();
    }

    bindEvents() {
        this.els.scanBtn.onclick = () => this.triggerScan();
        this.els.addBtn.onclick = () => this.addDestination();
        this.els.originDist.oninput = (e) => {
            this.els.valDistKrk.innerText = e.target.value;
            this.renderDashboard();
        };
    }

    async loadConfig() {
        try {
            const r = await fetch('/api/config');
            this.data.config = await r.json();
        } catch (e) { console.error("Config failed", e); }
    }

    async loadFlights() {
        try {
            const r = await fetch('/api/flights');
            this.data.flights = await r.json();
            this.updateMetadata();
            this.renderDashboard();
        } catch (e) { console.error("Flights failed", e); }
    }

    updateMetadata() {
        const lu = this.data.flights.last_updated;
        if (lu) this.els.lastUpdated.innerText = `Updated: ${new Date(lu).toLocaleTimeString()}`;
    }

    async triggerScan() {
        this.els.scanBtn.disabled = true;
        this.els.scanBtn.innerText = "⏳ Scanning...";
        try {
            const r = await fetch('/api/scan', { method: 'POST' });
            await this.loadFlights();
            this.els.scanStatus.innerText = "Success";
        } catch (e) {
            this.els.scanStatus.innerText = "Failed";
        } finally {
            this.els.scanBtn.disabled = false;
            this.els.scanBtn.innerText = "🚀 Run Global Scan";
        }
    }

    async addDestination() {
        const c = this.els.inCountry.value.toUpperCase();
        const a = this.els.inCode.value.toUpperCase();
        if (!c || !a) return;

        if (!this.data.config.DESTINATIONS[c]) this.data.config.DESTINATIONS[c] = [];
        if (!this.data.config.DESTINATIONS[c].includes(a)) {
            this.data.config.DESTINATIONS[c].push(a);
            await this.saveConfig();
            this.renderDestinations();
            this.els.inCountry.value = ''; this.els.inCode.value = '';
        }
    }

    async saveConfig() {
        await fetch('/api/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(this.data.config)
        });
    }

    getAirport(code) { return AIRPORT_NAMES[code] ? `${AIRPORT_NAMES[code]} (${code})` : code; }

    renderDashboard() {
        if (!this.data.flights?.current_best) return;

        const maxDist = parseInt(this.els.originDist.value);
        const origins = this.data.config.ORIGINS || {};

        const filtered = this.data.flights.current_best
            .filter(f => !f.is_mock && (origins[f.origin] ?? 0) <= maxDist)
            .sort((a, b) => a.score - b.score);

        this.els.totalRoutes.innerText = filtered.length;
        this.els.bestPrice.innerText = filtered.length ? `${filtered[0].price} ${filtered[0].currency}` : "--";

        this.els.dealsGrid.innerHTML = filtered.map(f => this.createCard(f)).join('');
        this.renderHistory();
    }

    createCard(f) {
        const itin = f.duration_out ? `
            <div class="mini-itin">
                <div class="itin-main">
                    <span class="itin-duration">${f.duration_out}</span>
                    <div class="itin-line">
                        <div class="itin-dot" style="left:0"></div>
                        <div class="itin-dot" style="left:100%"></div>
                    </div>
                </div>
                <div class="itin-badge-list">
                    ${(f.layovers_out || []).map(l => `<span class="badge badge-${l.status}">${l.airport} ${l.duration}</span>`).join('')}
                </div>
            </div>
        ` : `<div class="mini-itin"><span class="itin-duration">Details in Precision Scan</span></div>`;

        return `
            <div class="card">
                <div class="score-tag">Score ${f.score}</div>
                <div class="card-top">
                    <div class="card-dest">${this.getAirport(f.destination)}</div>
                    <div class="card-price">${f.price} ${f.currency}</div>
                </div>
                ${itin}
                <div class="card-details">
                    <div class="row"><span>Origin</span> <span>${this.getAirport(f.origin)}</span></div>
                    <div class="row"><span>Dates</span> <span>${f.departure_date} - ${f.return_date}</span></div>
                    <div class="row"><span>Airline</span> <span>${f.airline}</span></div>
                </div>
                <a href="${f.link}" target="_blank" class="btn-book">Open on Google Flights</a>
            </div>
        `;
    }

    renderDestinations() {
        if (!this.data.config?.DESTINATIONS) return;
        this.els.destList.innerHTML = Object.entries(this.data.config.DESTINATIONS).flatMap(([country, codes]) => 
            codes.map(code => `
                <div class="tag">
                    <span>${country}: ${code}</span>
                    <span class="tag-remove" onclick="window.app.removeDest('${country}', '${code}')">×</span>
                </div>
            `)
        ).join('');
    }

    async removeDest(c, code) {
        this.data.config.DESTINATIONS[c] = this.data.config.DESTINATIONS[c].filter(x => x !== code);
        if (!this.data.config.DESTINATIONS[c].length) delete this.data.config.DESTINATIONS[c];
        await this.saveConfig();
        this.renderDestinations();
    }

    renderHistory() {
        const hist = this.data.flights.history;
        if (!hist?.length) return;
        const ctx = document.getElementById('historyChart').getContext('2d');
        const labels = hist.map(h => new Date(h.date).toLocaleDateString());
        const countries = [...new Set(hist.flatMap(h => Object.keys(h.stats || {})))];

        const datasets = countries.map((c, i) => ({
            label: c,
            data: hist.map(h => h.stats?.[c]?.avg || null),
            borderColor: ['#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6'][i % 5],
            tension: 0.3,
            fill: false
        }));

        if (this.chart) this.chart.destroy();
        this.chart = new Chart(ctx, {
            type: 'line',
            data: { labels, datasets },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }
}

window.app = new FlightPlanner();
