/**
 * Flight Planner Pro - Smart Dashboard
 */

const DATA_MAP = {
    "COUNTRIES": {
        "AF": "Afghanistan", "AL": "Albania", "DZ": "Algeria", "AD": "Andorra", "AO": "Angola", "AR": "Argentina", "AM": "Armenia", "AU": "Australia", "AT": "Austria", "AZ": "Azerbaijan", "BS": "Bahamas", "BH": "Bahrain", "BD": "Bangladesh", "BB": "Barbados", "BY": "Belarus", "BE": "Belgium", "BZ": "Belize", "BJ": "Benin", "BT": "Bhutan", "BO": "Bolivia", "BA": "Bosnia and Herzegovina", "BW": "Botswana", "BR": "Brazil", "BN": "Brunei", "BG": "Bulgaria", "BF": "Burkina Faso", "BI": "Burundi", "KH": "Cambodia", "CM": "Cameroon", "CA": "Canada", "CV": "Cape Verde", "CF": "Central African Republic", "TD": "Chad", "CL": "Chile", "CN": "China", "CO": "Colombia", "KM": "Comoros", "CG": "Congo", "CR": "Costa Rica", "HR": "Croatia", "CU": "Cuba", "CY": "Cyprus", "CZ": "Czech Republic", "DK": "Denmark", "DJ": "Djibouti", "DM": "Dominica", "DO": "Dominican Republic", "EC": "Ecuador", "EG": "Egypt", "SV": "El Salvador", "GQ": "Equatorial Guinea", "ER": "Eritrea", "EE": "Estonia", "ET": "Ethiopia", "FJ": "Fiji", "FI": "Finland", "FR": "France", "GA": "Gabon", "GM": "Gambia", "GE": "Georgia", "DE": "Germany", "GH": "Ghana", "GR": "Greece", "GD": "Grenada", "GT": "Guatemala", "GN": "Guinea", "GW": "Guinea-Bissau", "GY": "Guyana", "HT": "Haiti", "HN": "Honduras", "HU": "Hungary", "IS": "Iceland", "IN": "India", "ID": "Indonesia", "IR": "Iran", "IQ": "Iraq", "IE": "Ireland", "IL": "Israel", "IT": "Italy", "JM": "Jamaica", "JP": "Japan", "JO": "Jordan", "KZ": "Kazakhstan", "KE": "Kenya", "KI": "Kiribati", "KP": "North Korea", "KR": "South Korea", "KW": "Kuwait", "KG": "Kyrgyzstan", "LA": "Laos", "LV": "Latvia", "LB": "Lebanon", "LS": "Lesotho", "LR": "Liberia", "LY": "Libya", "LI": "Liechtenstein", "LT": "Lithuania", "LU": "Luxembourg", "MK": "North Macedonia", "MG": "Madagascar", "MW": "Malawi", "MY": "Malaysia", "MV": "Maldives", "ML": "Mali", "MT": "Malta", "MH": "Marshall Islands", "MR": "Mauritania", "MU": "Mauritius", "MX": "Mexico", "FM": "Micronesia", "MD": "Moldova", "MC": "Monaco", "MN": "Mongolia", "ME": "Montenegro", "MA": "Morocco", "MZ": "Mozambique", "MM": "Myanmar", "NA": "Namibia", "NR": "Nauru", "NP": "Nepal", "NL": "Netherlands", "NZ": "New Zealand", "NI": "Nicaragua", "NE": "Niger", "NG": "Nigeria", "NO": "Norway", "OM": "Oman", "PK": "Pakistan", "PW": "Palau", "PA": "Panama", "PG": "Papua New Guinea", "PY": "Paraguay", "PE": "Peru", "PH": "Philippines", "PL": "Poland", "PT": "Portugal", "QA": "Qatar", "RO": "Romania", "RU": "Russia", "RW": "Rwanda", "KN": "Saint Kitts and Nevis", "LC": "Saint Lucia", "VC": "Saint Vincent and the Grenadines", "WS": "Samoa", "SM": "San Marino", "ST": "Sao Tome and Principe", "SA": "Saudi Arabia", "SN": "Senegal", "RS": "Serbia", "SC": "Seychelles", "SL": "Sierra Leone", "SG": "Singapore", "SK": "Slovakia", "SI": "Slovenia", "SB": "Solomon Islands", "SO": "Somalia", "ZA": "South Africa", "ES": "Spain", "LK": "Sri Lanka", "SD": "Sudan", "SR": "Suriname", "SZ": "Eswatini", "SE": "Sweden", "CH": "Switzerland", "SY": "Syria", "TW": "Taiwan", "TJ": "Tajikistan", "TZ": "Tanzania", "TH": "Thailand", "TL": "Timor-Leste", "TG": "Togo", "TO": "Tonga", "TT": "Trinidad and Tobago", "TN": "Tunisia", "TR": "Turkey", "TM": "Turkmenistan", "TV": "Tuvalu", "UG": "Uganda", "UA": "Ukraine", "AE": "United Arab Emirates", "GB": "United Kingdom", "US": "United States", "UY": "Uruguay", "UZ": "Uzbekistan", "VU": "Vanuatu", "VA": "Vatican City", "VE": "Venezuela", "VN": "Vietnam", "YE": "Yemen", "ZM": "Zambia", "ZW": "Zimbabwe"
    },
    "AIRPORTS": {
        "KRK": "Kraków John Paul II", "WAW": "Warsaw Chopin", "WMI": "Warsaw Modlin", "KTW": "Katowice", "BER": "Berlin Brandenburg",
        "PRG": "Prague Václav Havel", "VIE": "Vienna Intl", "BUD": "Budapest Ferenc Liszt", "FRA": "Frankfurt", "MUC": "Munich",
        "SYD": "Sydney Kingsford Smith", "MEL": "Melbourne", "BNE": "Brisbane", "AKL": "Auckland", "CHC": "Christchurch",
        "TYO": "Tokyo (All Airports)", "NRT": "Tokyo Narita", "HND": "Tokyo Haneda", "KIX": "Osaka Kansai", "BKK": "Bangkok Suvarnabhumi",
        "HKT": "Phuket", "SGN": "Ho Chi Minh Tan Son Nhat", "HAN": "Hanoi Noi Bai", "LIM": "Lima Jorge Chávez", "CUZ": "Cusco",
        "YYZ": "Toronto Pearson", "YVR": "Vancouver", "JNB": "Johannesburg O.R. Tambo", "CPT": "Cape Town", "WDH": "Windhoek Hosea Kutako"
    }
};

class FlightPlanner {
    constructor() {
        this.data = { flights: null, config: null };
        this.chart = null;
        this.els = this.getElements();
        this.init();
    }

    getElements() {
        const q = (id) => document.getElementById(id);
        return {
            scanBtn: q('scan-btn'),
            scanStatus: q('scan-status'),
            lastUpdated: q('last-updated'),
            dealsGrid: q('deals-grid'),
            destList: q('dest-list'),
            originDist: q('origin-dist'),
            valDistKrk: q('val-dist-krk'),
            bestPrice: q('stat-best-price'),
            totalRoutes: q('stat-total-routes'),
            addBtn: q('add-dest-btn'),
            autoInput: q('dest-autocomplete'),
            suggestions: q('dest-suggestions'),
            originList: q('included-origins')
        };
    }

    async init() {
        this.populateSuggestions();
        await this.loadConfig();
        await this.loadFlights();
        this.bindEvents();
        this.renderDestinations();
        this.renderOriginList();
    }

    populateSuggestions() {
        let html = '';
        // Add countries
        Object.entries(DATA_MAP.COUNTRIES).forEach(([code, name]) => {
            html += `<option value="${name} (${code})">Country</option>`;
        });
        // Add specific airports
        Object.entries(DATA_MAP.AIRPORTS).forEach(([code, name]) => {
            html += `<option value="${code}: ${name}">Airport</option>`;
        });
        this.els.suggestions.innerHTML = html;
    }

    bindEvents() {
        this.els.scanBtn.onclick = () => this.triggerScan();
        this.els.addBtn.onclick = () => this.addFromSmartInput();
        this.els.originDist.oninput = (e) => {
            this.els.valDistKrk.innerText = e.target.value;
            this.renderOriginList();
            this.renderDashboard();
        };
        // Also handle enter key on input
        this.els.autoInput.onkeypress = (e) => {
            if (e.key === 'Enter') this.addFromSmartInput();
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
        this.els.scanBtn.innerText = "⏳ Processing...";
        try {
            await fetch('/api/scan', { method: 'POST' });
            await this.loadFlights();
            this.els.scanStatus.innerText = "Complete";
        } catch (e) { this.els.scanStatus.innerText = "Error"; }
        finally {
            this.els.scanBtn.disabled = false;
            this.els.scanBtn.innerText = "🚀 Run Global Scan";
        }
    }

    async addFromSmartInput() {
        const val = this.els.autoInput.value.trim();
        if (!val) return;

        let countryCode = '', airportCode = '';

        // Case 1: "Mexico (MX)" -> Selected a country
        if (val.includes('(') && val.includes(')')) {
            countryCode = val.split('(')[1].split(')')[0].toUpperCase();
            airportCode = '-'; 
        } 
        // Case 2: "JFK: John F. Kennedy" -> Selected an airport
        else if (val.includes(':')) {
            airportCode = val.split(':')[0].trim().toUpperCase();
            countryCode = 'INTL'; // Default bucket for direct airport additions
        }
        // Case 3: Typed name or code manually
        else {
            const upper = val.toUpperCase();
            // Check if it's a known country code
            if (DATA_MAP.COUNTRIES[upper]) {
                countryCode = upper;
                airportCode = '-';
            } 
            // Check if it's a known airport code
            else if (DATA_MAP.AIRPORTS[upper] || upper.length === 3) {
                airportCode = upper;
                countryCode = 'INTL';
            }
            // Search by country name
            else {
                const foundEntry = Object.entries(DATA_MAP.COUNTRIES).find(([code, name]) => name.toLowerCase() === val.toLowerCase());
                if (foundEntry) {
                    countryCode = foundEntry[0];
                    airportCode = '-';
                }
            }
        }

        if (countryCode) {
            if (!this.data.config.DESTINATIONS[countryCode]) this.data.config.DESTINATIONS[countryCode] = [];
            
            // If it's a country-wide scan, we don't add specific codes
            if (airportCode !== '-' && !this.data.config.DESTINATIONS[countryCode].includes(airportCode)) {
                this.data.config.DESTINATIONS[countryCode].push(airportCode);
            } else if (airportCode === '-') {
                // If it's a country, maybe just add a placeholder or handle in backend.
                // For now, let's just use the country code as key and keep empty list if no airports
                if (!this.data.config.DESTINATIONS[countryCode]) this.data.config.DESTINATIONS[countryCode] = [];
            }

            await this.saveConfig();
            this.renderDestinations();
            this.els.autoInput.value = '';
        } else {
            alert("Could not identify country or airport. Please use the suggestions.");
        }
    }

    async saveConfig() {
        await fetch('/api/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(this.data.config)
        });
    }

    getScoreClass(s) {
        if (s > 80) return 'score-excellent';
        if (s > 60) return 'score-good';
        if (s > 40) return 'score-fair';
        return 'score-poor';
    }

    getName(code) { return DATA_MAP.AIRPORTS[code] || DATA_MAP.COUNTRIES[code] || code; }

    renderOriginList() {
        if (!this.data.config?.ORIGINS) return;
        const maxDist = parseInt(this.els.originDist.value);
        const html = Object.entries(this.data.config.ORIGINS)
            .filter(([code, dist]) => dist <= maxDist)
            .sort((a,b) => a[1] - b[1])
            .map(([code, dist]) => `<span class="origin-tag">${code} (${dist}km)</span>`)
            .join('');
        this.els.originList.innerHTML = html;
    }

    renderDashboard() {
        if (!this.data.flights?.current_best) return;
        const maxDist = parseInt(this.els.originDist.value);
        const origins = this.data.config.ORIGINS || {};

        const filtered = this.data.flights.current_best
            .filter(f => !f.is_mock && (origins[f.origin] ?? 0) <= maxDist)
            .sort((a, b) => b.score - a.score);

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
        ` : `<div class="mini-itin"><span class="itin-duration" style="color:var(--accent)">🔍 Precision Scan Required</span></div>`;

        return `
            <div class="card">
                <div class="score-tag ${this.getScoreClass(f.score)}">${f.score}% Match</div>
                <div class="card-top">
                    <div class="card-dest">${this.getName(f.destination)}</div>
                    <div class="card-price">${f.price} ${f.currency}</div>
                </div>
                ${itin}
                <div class="card-details">
                    <div class="row"><span>From</span> <span>${this.getName(f.origin)}</span></div>
                    <div class="row"><span>Airline</span> <span>${f.airline}</span></div>
                    <div class="row"><span>Travel Dates</span> <span>${f.departure_date}</span></div>
                </div>
                <a href="${f.link}" target="_blank" class="btn-book">Open on Google Flights</a>
            </div>
        `;
    }

    renderDestinations() {
        if (!this.data.config?.DESTINATIONS) return;
        this.els.destList.innerHTML = Object.entries(this.data.config.DESTINATIONS).flatMap(([country, codes]) => {
            const countryName = this.getName(country);
            if (codes.length === 0) {
                return [`<div class="tag"><span>${countryName} (Any)</span><span class="tag-remove" onclick="window.app.removeDest('${country}', null)">×</span></div>`];
            }
            return codes.map(code => `
                <div class="tag">
                    <span>${countryName}: <strong>${code}</strong></span>
                    <span class="tag-remove" onclick="window.app.removeDest('${country}', '${code}')">×</span>
                </div>
            `);
        }).join('');
    }

    async removeDest(c, code) {
        if (!code) {
            delete this.data.config.DESTINATIONS[c];
        } else {
            this.data.config.DESTINATIONS[c] = this.data.config.DESTINATIONS[c].filter(x => x !== code);
            if (!this.data.config.DESTINATIONS[c].length) delete this.data.config.DESTINATIONS[c];
        }
        await this.saveConfig();
        this.renderDestinations();
    }

    renderHistory() {
        const hist = this.data.flights.history;
        if (!hist?.length) return;
        const canvas = document.getElementById('historyChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const labels = hist.map(h => new Date(h.date).toLocaleDateString());
        const countries = [...new Set(hist.flatMap(h => Object.keys(h.stats || {})))];

        const datasets = countries.map((c, i) => ({
            label: this.getName(c),
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
