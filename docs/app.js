/**
 * Flight Planner Pro - Optimized Dashboard
 */

const DATA_MAP = {
    "COUNTRIES": { "AF": "Afghanistan", "AL": "Albania", "DZ": "Algeria", "AD": "Andorra", "AO": "Angola", "AR": "Argentina", "AM": "Armenia", "AU": "Australia", "AT": "Austria", "AZ": "Azerbaijan", "BS": "Bahamas", "BH": "Bahrain", "BD": "Bangladesh", "BB": "Barbados", "BY": "Belarus", "BE": "Belgium", "BZ": "Belize", "BJ": "Benin", "BT": "Bhutan", "BO": "Bolivia", "BA": "Bosnia and Herzegovina", "BW": "Botswana", "BR": "Brazil", "BN": "Brunei", "BG": "Bulgaria", "BF": "Burkina Faso", "BI": "Burundi", "KH": "Cambodia", "CM": "Cameroon", "CA": "Canada", "CV": "Cape Verde", "CF": "Central African Republic", "TD": "Chad", "CL": "Chile", "CN": "China", "CO": "Colombia", "KM": "Comoros", "CG": "Congo", "CR": "Costa Rica", "HR": "Croatia", "CU": "Cuba", "CY": "Cyprus", "CZ": "Czech Republic", "DK": "Denmark", "DJ": "Djibouti", "DM": "Dominica", "DO": "Dominican Republic", "EC": "Ecuador", "EG": "Egypt", "SV": "El Salvador", "GQ": "Equatorial Guinea", "ER": "Eritrea", "EE": "Estonia", "ET": "Ethiopia", "FJ": "Fiji", "FI": "Finland", "FR": "France", "GA": "Gabon", "GM": "Gambia", "GE": "Georgia", "DE": "Germany", "GH": "Ghana", "GR": "Greece", "GD": "Grenada", "GT": "Guatemala", "GN": "Guinea", "GW": "Guinea-Bissau", "GY": "Guyana", "HT": "Haiti", "HN": "Honduras", "HU": "Hungary", "IS": "Iceland", "IN": "India", "ID": "Indonesia", "IR": "Iran", "IQ": "Iraq", "IE": "Ireland", "IL": "Israel", "IT": "Italy", "JM": "Jamaica", "JP": "Japan", "JO": "Jordan", "KZ": "Kazakhstan", "KE": "Kenya", "KI": "Kiribati", "KP": "North Korea", "KR": "South Korea", "KW": "Kuwait", "KG": "Kyrgyzstan", "LA": "Laos", "LV": "Latvia", "LB": "Lebanon", "LS": "Lesotho", "LR": "Liberia", "LY": "Libya", "LI": "Liechtenstein", "LT": "Lithuania", "LU": "Luxembourg", "MK": "North Macedonia", "MG": "Madagascar", "MW": "Malawi", "MY": "Malaysia", "MV": "Maldives", "ML": "Mali", "MT": "Malta", "MH": "Marshall Islands", "MR": "Mauritania", "MU": "Mauritius", "MX": "Mexico", "FM": "Micronesia", "MD": "Moldova", "MC": "Monaco", "MN": "Mongolia", "ME": "Montenegro", "MA": "Morocco", "MZ": "Mozambique", "MM": "Myanmar", "NA": "Namibia", "NR": "Nauru", "NP": "Nepal", "NL": "Netherlands", "NZ": "New Zealand", "NI": "Nicaragua", "NE": "Niger", "NG": "Nigeria", "NO": "Norway", "OM": "Oman", "PK": "Pakistan", "PW": "Palau", "PA": "Panama", "PG": "Papua New Guinea", "PY": "Paraguay", "PE": "Peru", "PH": "Philippines", "PL": "Poland", "PT": "Portugal", "QA": "Qatar", "RO": "Romania", "RU": "Russia", "RW": "Rwanda", "KN": "Saint Kitts and Nevis", "LC": "Saint Lucia", "VC": "Saint Vincent and the Grenadines", "WS": "Samoa", "SM": "San Marino", "ST": "Sao Tome and Principe", "SA": "Saudi Arabia", "SN": "Senegal", "RS": "Serbia", "SC": "Seychelles", "SL": "Sierra Leone", "SG": "Singapore", "SK": "Slovakia", "SI": "Slovenia", "SB": "Solomon Islands", "SO": "Somalia", "ZA": "South Africa", "ES": "Spain", "LK": "Sri Lanka", "SD": "Sudan", "SR": "Suriname", "SZ": "Eswatini", "SE": "Sweden", "CH": "Switzerland", "SY": "Syria", "TW": "Taiwan", "TJ": "Tajikistan", "TZ": "Tanzania", "TH": "Thailand", "TL": "Timor-Leste", "TG": "Togo", "TO": "Tonga", "TT": "Trinidad and Tobago", "TN": "Tunisia", "TR": "Turkey", "TM": "Turkmenistan", "TV": "Tuvalu", "UG": "Uganda", "UA": "Ukraine", "AE": "United Arab Emirates", "GB": "United Kingdom", "US": "United States", "UY": "Uruguay", "UZ": "Uzbekistan", "VU": "Vanuatu", "VA": "Vatican City", "VE": "Venezuela", "VN": "Vietnam", "YE": "Yemen", "ZM": "Zambia", "ZW": "Zimbabwe" },
    "AIRPORTS": { "KRK": "Kraków John Paul II", "WAW": "Warsaw Chopin", "WMI": "Warsaw Modlin", "KTW": "Katowice", "BER": "Berlin Brandenburg", "PRG": "Prague Václav Havel", "VIE": "Vienna Intl", "BUD": "Budapest Ferenc Liszt", "SYD": "Sydney", "AKL": "Auckland", "TYO": "Tokyo", "BKK": "Bangkok", "SGN": "Ho Chi Minh", "LIM": "Lima", "JNB": "Johannesburg", "CPT": "Cape Town" },
    "AIRLINES": { 
        "LO": "LOT Polish Airlines", "LH": "Lufthansa", "LX": "Swiss", "OS": "Austrian Airlines", "AF": "Air France", 
        "KL": "KLM", "TK": "Turkish Airlines", "EK": "Emirates", "QR": "Qatar Airways", "AY": "Finnair", 
        "FR": "Ryanair", "W6": "Wizz Air", "BA": "British Airways", "CA": "Air China", "FZ": "flydubai", 
        "EY": "Etihad Airways", "EI": "Aer Lingus", "VF": "Valuair" 
    }
};

class FlightPlanner {
    constructor() {
        this.data = { flights: null, config: null };
        this.currentView = 'longhaul';
        this.els = this.getElements();
        this.init();
    }

    getElements() {
        const q = (id) => document.getElementById(id);
        return {
            scanBtn: q('scan-btn'), lastUpdated: q('last-updated'), dealsGrid: q('deals-grid'),
            destList: q('dest-list'), originDist: q('origin-dist'), valDistKrk: q('val-dist-krk'),
            minDur: q('min-duration'), maxDur: q('max-duration'), valMinDur: q('val-min-dur'), valMaxDur: q('val-max-dur'),
            filterPrice: q('filter-price'), valMaxPrice: q('val-max-price'),
            bestPrice: q('stat-best-price'), totalRoutes: q('stat-total-routes'),
            viewName: q('current-view-name'), addBtn: q('add-dest-btn'), autoInput: q('dest-autocomplete'),
            suggestions: q('dest-suggestions'), originList: q('included-origins'),
            wPrice: q('w-price'), wDist: q('w-dist'), wWeather: q('w-weather'),
            vWPrice: q('val-w-price'), vWDist: q('val-w-dist'), vWWeather: q('val-w-weather'),
            sortBy: q('sort-by')
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
        let h = '';
        Object.entries(DATA_MAP.COUNTRIES).forEach(([c, n]) => h += `<option value="${n} (${c})"></option>`);
        Object.entries(DATA_MAP.AIRPORTS).forEach(([c, n]) => h += `<option value="${c}: ${n}"></option>`);
        this.els.suggestions.innerHTML = h;
    }

    bindEvents() {
        this.els.scanBtn.onclick = () => this.triggerScan();
        this.els.addBtn.onclick = () => this.addFromSmartInput();
        
        document.querySelectorAll('.nav-tab').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentView = btn.dataset.view;
                this.els.viewName.innerText = this.currentView === 'longhaul' ? 'World Explorer' : 'Kraków Weekend';
                this.saveConfigLocally();
                this.renderDashboard();
            };
        });

        const sliders = ['originDist', 'filterPrice', 'minDur', 'maxDur', 'wPrice', 'wDist', 'wWeather'];
        sliders.forEach(key => {
            this.els[key].oninput = (e) => {
                const val = e.target.value;
                if (key === 'originDist') { this.els.valDistKrk.innerText = val; this.renderOriginList(); }
                else if (key === 'filterPrice') this.els.valMaxPrice.innerText = val;
                else if (key === 'minDur') this.els.valMinDur.innerText = val;
                else if (key === 'maxDur') this.els.valMaxDur.innerText = val;
                else {
                    const id = 'val-w-' + key.replace('w', '').toLowerCase();
                    const el = document.getElementById(id);
                    if (el) el.innerText = val;
                }
                this.saveConfigLocally();
                this.renderDashboard();
            };
        });

        this.els.sortBy.onchange = () => { this.saveConfigLocally(); this.renderDashboard(); };
    }

    async loadConfig() {
        try {
            const r = await fetch('/api/config');
            this.data.config = await r.json();
            if (this.data.config.SETTINGS) {
                const s = this.data.config.SETTINGS;
                this.els.originDist.value = s.origin_dist ?? 600;
                this.els.filterPrice.value = s.max_price ?? 8000;
                this.els.minDur.value = s.min_dur ?? 1;
                this.els.maxDur.value = s.max_dur ?? 30;
                this.els.wPrice.value = s.w_price ?? 1.0;
                this.els.wDist.value = s.w_dist ?? 0.5;
                this.els.wWeather.value = s.w_weather ?? 0.5;
                this.currentView = s.last_view ?? 'longhaul';
                this.els.sortBy.value = s.sort_by ?? 'score';
                
                this.els.valDistKrk.innerText = this.els.originDist.value;
                this.els.valMaxPrice.innerText = this.els.filterPrice.value;
                this.els.valMinDur.innerText = this.els.minDur.value;
                this.els.valMaxDur.innerText = this.els.maxDur.value;
                if (this.els.vWPrice) this.els.vWPrice.innerText = this.els.wPrice.value;
                if (this.els.vWDist) this.els.vWDist.innerText = this.els.wDist.value;
                if (this.els.vWWeather) this.els.vWWeather.innerText = this.els.wWeather.value;
                
                document.querySelectorAll('.nav-tab').forEach(b => b.classList.toggle('active', b.dataset.view === this.currentView));
                this.els.viewName.innerText = this.currentView === 'longhaul' ? 'World Explorer' : 'Kraków Weekend';
            }
        } catch (e) { console.error(e); }
    }

    async saveConfigLocally() {
        if (!this.data.config) return;
        this.data.config.SETTINGS = {
            origin_dist: parseInt(this.els.originDist.value),
            max_price: parseInt(this.els.filterPrice.value),
            min_dur: parseInt(this.els.minDur.value),
            max_dur: parseInt(this.els.maxDur.value),
            w_price: parseFloat(this.els.wPrice.value),
            w_dist: parseFloat(this.els.wDist.value),
            w_weather: parseFloat(this.els.wWeather.value),
            last_view: this.currentView,
            sort_by: this.els.sortBy.value
        };
        await fetch('/api/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(this.data.config) });
    }

    async loadFlights() {
        try {
            const r = await fetch('/api/flights');
            this.data.flights = await r.json();
            const lu = this.data.flights.last_updated;
            if (lu) this.els.lastUpdated.innerText = `Updated: ${new Date(lu).toLocaleTimeString()}`;
            this.renderDashboard();
        } catch (e) { console.error(e); }
    }

    async triggerScan() {
        this.els.scanBtn.disabled = true; this.els.scanBtn.innerText = "⏳ Scanning...";
        try { await fetch('/api/scan', { method: 'POST' }); await this.loadFlights(); }
        finally { this.els.scanBtn.disabled = false; this.els.scanBtn.innerText = "🚀 Run Global Scan"; }
    }

    async triggerPrecisionScan(origin, dest, dep, ret, btn) {
        btn.disabled = true; btn.innerText = "⏳ Precision Checking...";
        try {
            const r = await fetch('/api/precision', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ origin, destination: dest, departure_date: dep, return_date: ret })
            });
            const res = await r.json();
            if (res.status === 'success') { await this.loadFlights(); }
            else { alert("Precision Scan failed: " + (res.message || "Unknown error")); }
        } catch (e) { alert("Error connecting to precision engine."); }
        finally { btn.disabled = false; }
    }

    async addFromSmartInput() {
        const val = this.els.autoInput.value.trim(); if (!val) return;
        let c = '', a = '';
        if (val.includes('(')) { c = val.split('(')[1].split(')')[0].toUpperCase(); a = '-'; }
        else if (val.includes(':')) { a = val.split(':')[0].trim().toUpperCase(); c = 'INTL'; }
        else { a = val.toUpperCase(); c = 'INTL'; }
        if (c) {
            if (!this.data.config.DESTINATIONS) this.data.config.DESTINATIONS = {};
            if (!this.data.config.DESTINATIONS[c]) this.data.config.DESTINATIONS[c] = [];
            if (a !== '-' && !this.data.config.DESTINATIONS[c].includes(a)) this.data.config.DESTINATIONS[c].push(a);
            await this.saveConfigLocally(); this.renderDestinations(); this.els.autoInput.value = '';
        }
    }

    getName(c) { return DATA_MAP.AIRPORTS[c] || DATA_MAP.COUNTRIES[c] || c; }
    getAirline(c) { return DATA_MAP.AIRLINES[c] || c; }

    renderOriginList() {
        if (!this.data.config) return;
        const max = parseInt(this.els.originDist.value);
        const html = Object.entries(this.data.config.ORIGINS || {})
            .filter(([c, d]) => d <= max)
            .sort((a,b) => a[1]-b[1])
            .map(([c, d]) => `<span class="origin-tag" title="${this.getName(c)}">${c}</span>`)
            .join(' ');
        this.els.originList.innerHTML = html;
    }

    renderDashboard() {
        if (!this.data.flights?.current_best || !this.data.config) return;
        const maxDist = parseInt(this.els.originDist.value);
        const maxPrice = parseInt(this.els.filterPrice.value);
        const minD = parseInt(this.els.minDur.value);
        const maxD = parseInt(this.els.maxDur.value);
        const sortBy = this.els.sortBy.value;
        const w = { p: parseFloat(this.els.wPrice.value), d: parseFloat(this.els.wDist.value), we: parseFloat(this.els.wWeather.value) };

        let filtered = this.data.flights.current_best.filter(f => !f.is_mock && f.price <= maxPrice);

        if (this.currentView === 'citybreak') {
            filtered = filtered.filter(f => {
                const day = new Date(f.departure_date).getDay();
                return f.origin === 'KRK' && 
                       (f.score_breakdown?.duration_days >= 2 && f.score_breakdown?.duration_days <= 4) &&
                       (f.score_breakdown?.days_off <= 2) &&
                       (day === 4 || day === 5);
            });
        } else {
            filtered = filtered.filter(f => {
                const dist = this.data.config.ORIGINS[f.origin] ?? 0;
                const dur = f.score_breakdown?.duration_days || 0;
                return dist <= maxDist && dur >= minD && dur <= maxD;
            });
        }

        const rescored = filtered.map(f => {
            const bd = f.score_breakdown || {};
            const p_s = max(0, 100 - (bd.price_raw - 1500)/60);
            const d_s = max(0, 100 - (bd.dist_km/6));
            const w_s = bd.in_season ? 100 : 20;
            const final = (p_s*w.p + d_s*w.d + w_s*w.we) / (w.p + w.d + w.we);
            return { ...f, ui_score: Math.round(final) };
        });

        if (sortBy === 'price') rescored.sort((a, b) => a.price - b.price);
        else rescored.sort((a, b) => b.ui_score - a.ui_score);

        this.els.totalRoutes.innerText = rescored.length;
        this.els.bestPrice.innerText = rescored.length ? `${rescored[0].price} ${rescored[0].currency}` : "--";
        this.els.dealsGrid.innerHTML = '';
        rescored.forEach(f => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = this.createCardHtml(f);
            const pBtn = card.querySelector('.btn-precision');
            if (pBtn) {
                pBtn.onclick = () => this.triggerPrecisionScan(f.origin, f.destination, f.departure_date, f.return_date, pBtn);
            }
            this.els.dealsGrid.appendChild(card);
        });
        this.renderHistory();
    }

    createCardHtml(f) {
        const bd = f.score_breakdown || {};
        const s = f.ui_score;
        const sCls = s > 80 ? 'score-excellent' : s > 60 ? 'score-good' : s > 40 ? 'score-fair' : 'score-poor';
        const itin = f.duration_out ? `<div class="mini-itin"><div class="itin-main"><span class="itin-duration">${f.duration_out}</span><div class="itin-line"><div class="itin-dot" style="left:0"></div><div class="itin-dot" style="left:100%"></div></div></div><div class="itin-badge-list">${(f.layovers_out || []).map(l => `<span class="badge badge-${l.status}" title="${this.getName(l.airport)}">${l.airport}</span>`).join('')}</div></div>` : `<div class="mini-itin"><button class="btn-book btn-precision" style="width:100%; font-size:0.75rem; padding:0.4rem; margin:0;">🔍 Precision Scan Details</button></div>`;

        return `
            <div class="card-top">
                <div class="card-dest">${this.getName(f.destination)}</div>
                <div class="card-price">${f.price} ${f.currency}</div>
            </div>
            ${itin}
            <div class="score-tag ${sCls}">${s}% Match</div>
            <div class="trip-highlight">
                <div class="highlight-item"><span class="highlight-label">Dates</span><span class="highlight-val">${f.departure_date} to ${f.return_date || '?'}</span></div>
                <div class="highlight-item"><span class="highlight-label">Days Off</span><span class="highlight-val">${bd.days_off || 0} Work Days</span></div>
            </div>
            <div class="card-details">
                <div class="row"><span>From</span> <span title="${this.getName(f.origin)}">${this.getName(f.origin)}</span></div>
                <div class="row"><span>Airline</span> <span>${this.getAirline(f.airline)}</span></div>
                <div class="row"><span>Duration</span> <span>${bd.duration_days || '?'} Days</span></div>
            </div>
            <a href="${f.link}" target="_blank" class="btn-book">Open on Google Flights</a>
        `;
    }

    renderDestinations() {
        if (!this.data.config?.DESTINATIONS) return;
        let h = '';
        Object.entries(this.data.config.DESTINATIONS).forEach(([cCode, airports]) => {
            h += `<div class="country-group"><div class="country-header">${this.getName(cCode)}</div><div class="tag-cloud">${airports.length ? airports.map(a => `<div class="tag" title="${this.getName(a)}"><span>${a}</span><span class="tag-remove" onclick="window.app.removeDest('${cCode}', '${a}')">×</span></div>`).join('') : `<div class="tag"><span>Any</span><span class="tag-remove" onclick="window.app.removeDest('${cCode}', null)">×</span></div>`}</div></div>`;
        });
        this.els.destList.innerHTML = h;
    }

    async removeDest(c, a) {
        if (!a) delete this.data.config.DESTINATIONS[c];
        else { this.data.config.DESTINATIONS[c] = this.data.config.DESTINATIONS[c].filter(x => x !== a); if (!this.data.config.DESTINATIONS[c].length) delete this.data.config.DESTINATIONS[c]; }
        await this.saveConfigLocally(); this.renderDestinations();
    }

    renderHistory() {
        const hist = this.data.flights.history; if (!hist?.length) return;
        const ctx = document.getElementById('historyChart').getContext('2d');
        const labels = hist.map(h => new Date(h.date).toLocaleDateString());
        const countries = [...new Set(hist.flatMap(h => Object.keys(h.stats || {})))];
        const datasets = countries.map((c, i) => ({ label: this.getName(c), data: hist.map(h => h.stats?.[c]?.avg || null), borderColor: ['#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6'][i % 5], tension: 0.3, fill: false }));
        if (this.chart) this.chart.destroy();
        this.chart = new Chart(ctx, { type: 'line', data: { labels, datasets }, options: { responsive: true, maintainAspectRatio: false } });
    }
}

function max(a, b) { return a > b ? a : b; }
window.app = new FlightPlanner();
