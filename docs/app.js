/**
 * Flight Planner Pro - Optimized Dashboard
 */

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
            filterPriceLonghaul: q('filter-price-longhaul'), valMaxPriceLonghaul: q('val-max-price-longhaul'),
            filterPriceCitybreak: q('filter-price-citybreak'), valMaxPriceCitybreak: q('val-max-price-citybreak'),
            bestPrice: q('stat-best-price'), totalRoutes: q('stat-total-routes'),
            viewName: q('current-view-name'), addBtn: q('add-dest-btn'), autoInput: q('dest-autocomplete'),
            suggestions: q('dest-suggestions'), originList: q('included-origins'),
            wPrice: q('w-price'), wWeather: q('w-weather'), wEff: q('w-eff'),
            vWPrice: q('val-w-price'), vWWeather: q('val-w-weather'), vWEff: q('val-w-eff'),
            sortBy: q('sort-by'), precisionStatus: q('precision-status')
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
        if (!this.els.suggestions) return;
        let h = '';
        Object.entries(DATA_MAP.COUNTRIES).forEach(([c, n]) => h += `<option value="${n} (${c})"></option>`);
        Object.entries(DATA_MAP.AIRPORTS).forEach(([c, n]) => h += `<option value="${c}: ${n}"></option>`);
        this.els.suggestions.innerHTML = h;
    }

    bindEvents() {
        if (this.els.scanBtn) this.els.scanBtn.onclick = () => this.triggerScan();
        if (this.els.addBtn) this.els.addBtn.onclick = () => this.addFromSmartInput();
        
        document.querySelectorAll('.nav-tab').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentView = btn.dataset.view;
                if (this.els.viewName) this.els.viewName.innerText = this.currentView === 'longhaul' ? 'Long-haul trips' : 'City Break from KRK';
                this.saveConfigLocally();
                this.renderDashboard();
            };
        });

        const sliders = ['originDist', 'filterPriceLonghaul', 'filterPriceCitybreak', 'minDur', 'maxDur', 'wPrice', 'wWeather', 'wEff'];
        sliders.forEach(key => {
            const el = this.els[key];
            if (!el) return;
            el.oninput = (e) => {
                const val = e.target.value;
                if (key === 'originDist' && this.els.valDistKrk) { this.els.valDistKrk.innerText = val; this.renderOriginList(); }
                else if (key === 'filterPriceLonghaul' && this.els.valMaxPriceLonghaul) this.els.valMaxPriceLonghaul.innerText = val;
                else if (key === 'filterPriceCitybreak' && this.els.valMaxPriceCitybreak) this.els.valMaxPriceCitybreak.innerText = val;
                else if (key === 'minDur' && this.els.valMinDur) this.els.valMinDur.innerText = val;
                else if (key === 'maxDur' && this.els.valMaxDur) this.els.valMaxDur.innerText = val;
                else {
                    const labelId = 'val-w-' + key.replace('w', '').toLowerCase();
                    const labelEl = document.getElementById(labelId);
                    if (labelEl) labelEl.innerText = val;
                }
                this.saveConfigLocally();
                this.renderDashboard();
            };
        });

        if (this.els.sortBy) this.els.sortBy.onchange = () => { this.saveConfigLocally(); this.renderDashboard(); };
    }

    async loadConfig() {
        console.log("Loading config...");
        try {
            // 1. Try to load from LocalStorage first (for persistence on static sites)
            const localConfig = localStorage.getItem('fp_config');
            if (localConfig) {
                this.data.config = JSON.parse(localConfig);
                this.applyConfigToUi();
                return;
            }

            // 2. Fallback to server/file if no local config
            let r = await fetch('/api/config');
            if (!r.ok) r = await fetch('./data/config.json');
            this.data.config = await r.json();
            this.applyConfigToUi();
        } catch (e) { console.error("Error loading config:", e); }
    }

    applyConfigToUi() {
        if (!this.data.config || !this.data.config.SETTINGS) return;
        const s = this.data.config.SETTINGS;
        if (this.els.originDist) this.els.originDist.value = s.origin_dist ?? 600;
        if (this.els.filterPriceLonghaul) this.els.filterPriceLonghaul.value = s.max_price_longhaul ?? s.max_price ?? 8000;
        if (this.els.filterPriceCitybreak) this.els.filterPriceCitybreak.value = s.max_price_citybreak ?? 500;
        if (this.els.minDur) this.els.minDur.value = s.min_dur ?? 1;
        if (this.els.maxDur) this.els.maxDur.value = s.max_dur ?? 30;
        if (this.els.wPrice) this.els.wPrice.value = s.w_price ?? 1.0;
        if (this.els.wWeather) this.els.wWeather.value = s.w_weather ?? 0.5;
        if (this.els.wEff) this.els.wEff.value = s.w_eff ?? 0.5;
        
        this.currentView = s.last_view ?? 'longhaul';
        if (this.els.sortBy) this.els.sortBy.value = s.sort_by ?? 'score';
        
        if (this.els.valDistKrk) this.els.valDistKrk.innerText = this.els.originDist?.value || 600;
        if (this.els.valMaxPriceLonghaul) this.els.valMaxPriceLonghaul.innerText = this.els.filterPriceLonghaul?.value || 8000;
        if (this.els.valMaxPriceCitybreak) this.els.valMaxPriceCitybreak.innerText = this.els.filterPriceCitybreak?.value || 500;
        if (this.els.valMinDur) this.els.valMinDur.innerText = this.els.minDur?.value || 1;
        if (this.els.valMaxDur) this.els.valMaxDur.innerText = this.els.maxDur?.value || 30;
        
        // Weights labels
        if (this.els.vWPrice) this.els.vWPrice.innerText = this.els.wPrice?.value || 1.0;
        if (this.els.vWWeather) this.els.vWWeather.innerText = this.els.wWeather?.value || 0.5;
        if (this.els.vWEff) this.els.vWEff.innerText = this.els.wEff?.value || 0.5;
        
        document.querySelectorAll('.nav-tab').forEach(b => b.classList.toggle('active', b.dataset.view === this.currentView));
        if (this.els.viewName) this.els.viewName.innerText = this.currentView === 'longhaul' ? 'Long-haul trips' : 'City Break from KRK';
    }

    async saveConfigLocally() {
        if (!this.data.config) return;
        this.data.config.SETTINGS = {
            origin_dist: parseInt(this.els.originDist?.value || 600),
            max_price_longhaul: parseInt(this.els.filterPriceLonghaul?.value || 8000),
            max_price_citybreak: parseInt(this.els.filterPriceCitybreak?.value || 500),
            min_dur: parseInt(this.els.minDur?.value || 1),
            max_dur: parseInt(this.els.maxDur?.value || 30),
            w_price: parseFloat(this.els.wPrice?.value || 1.0),
            w_weather: parseFloat(this.els.wWeather?.value || 0.5),
            w_eff: parseFloat(this.els.wEff?.value || 0.5),
            last_view: this.currentView,
            sort_by: this.els.sortBy?.value || 'score',
            api_url: this.data.config.SETTINGS?.api_url || ''
        };
        
        // Store in localStorage so UI preferences persist in browser
        localStorage.setItem('fp_config', JSON.stringify(this.data.config));

        // Check if we are on GitHub Pages (static environment)
        const isStatic = window.location.hostname.includes('github.io');
        const apiBase = this.data.config.SETTINGS?.api_url || '';

        // Do not attempt POST if on static site and no custom API URL is set
        if (isStatic && !apiBase) return;

        try {
            const url = apiBase ? `${apiBase}/api/config` : '/api/config';
            const r = await fetch(url, { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify(this.data.config) 
            });
            if (r.status === 405 || r.status === 404) {
                console.warn("API not found. Settings saved locally only.");
                return;
            }
        } catch(e) {
            console.error("Failed to save config to server:", e);
        }
    }

    async loadFlights() {
        try {
            let r = await fetch('/api/flights');
            if (!r.ok) r = await fetch('./data/flights.json');
            this.data.flights = await r.json();
            const lu = this.data.flights.last_updated;
            if (lu && this.els.lastUpdated) this.els.lastUpdated.innerText = `Updated: ${new Date(lu).toLocaleTimeString()}`;
            this.renderDashboard();
        } catch (e) { console.error("Error loading flights:", e); }
    }

    async triggerScan() {
        if (!this.els.scanBtn) return;
        this.els.scanBtn.disabled = true; this.els.scanBtn.innerText = "⏳ Scanning...";

        // Check if we are on GitHub Pages (static environment)
        const isStatic = window.location.hostname.includes('github.io');
        const apiBase = isStatic ? (this.data.config?.SETTINGS?.api_url || '') : '';

        try { 
            const url = apiBase ? `${apiBase}/api/scan` : '/api/scan';
            const r = await fetch(url, { method: 'POST' }); 
            
            if (r.status === 405 || r.status === 404) {
                throw new Error("API not found. GitHub Pages is static and does not support on-demand scanning. To use this feature, run the app locally or configure a live backend URL in Settings.");
            }

            if (!r.ok) {
                const err = await r.json();
                throw new Error(err.output || "Scan failed on server.");
            }
            await this.loadFlights(); 
        } catch (e) {
            console.error("Global Scan Error:", e);
            alert("Error: " + e.message);
        } finally { 
            this.els.scanBtn.disabled = false; this.els.scanBtn.innerText = "🚀 Run Global Scan"; 
        }
    }

    async triggerPrecisionScan(origin, dest, dep, ret, btn) {
        const oldText = btn.innerText;
        btn.disabled = true; btn.innerText = "⏳ Precision...";

        // Check if we are on GitHub Pages (static environment)
        const isStatic = window.location.hostname.includes('github.io');
        const apiBase = isStatic ? (this.data.config?.SETTINGS?.api_url || '') : '';
        
        try {
            const url = apiBase ? `${apiBase}/api/precision` : '/api/precision';
            const r = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ origin, destination: dest, departure_date: dep, return_date: ret })
            });

            if (r.status === 405 || r.status === 404) {
                throw new Error("API not found. GitHub Pages is static and does not support precision scanning. To use this feature, run the app locally or configure a live backend URL in Settings.");
            }
            if (!r.ok) throw new Error("Precision scan failed.");
            const res = await r.json();
            if (res.status === 'success') { await this.loadFlights(); }
            else { alert("Precision Scan failed: " + (res.message || "Unknown error")); }
        } catch (e) { 
            console.error("Precision Scan Error:", e);
            alert("Error: " + e.message); 
        }
        finally { btn.disabled = false; btn.innerText = oldText; }
    }

    async addFromSmartInput() {
        if (!this.els.autoInput) return;
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
        if (!this.data.config || !this.els.originList) return;
        const maxVal = parseInt(this.els.originDist?.value || 600);
        const html = Object.entries(this.data.config.ORIGINS || {})
            .filter(([c, d]) => d <= maxVal)
            .sort((a,b) => a[1]-b[1])
            .map(([c, d]) => {
                const name = this.getName(c);
                return `<span class="origin-tag" title="${name}">${name} (${c})</span>`;
            })
            .join(' ');
        this.els.originList.innerHTML = html;
    }

    renderDashboard() {
        if (!this.data.flights?.current_best || !this.data.config) return;
        
        // UI Toggling for City Break mode
        const isCityBreak = this.currentView === 'citybreak';
        const distCont = document.getElementById('filter-dist-container');
        const priceLonghaulCont = document.getElementById('filter-price-longhaul-container');
        const priceCitybreakCont = document.getElementById('filter-price-citybreak-container');
        const durCont = document.getElementById('filter-dur-container');
        const weightSec = document.getElementById('filter-weights-section');
        const destSec = document.getElementById('filter-destinations-section');
        const analyticsSec = document.getElementById('analytics-section');

        if (distCont) distCont.style.display = isCityBreak ? 'none' : 'flex';
        if (priceLonghaulCont) priceLonghaulCont.style.display = isCityBreak ? 'none' : 'flex';
        if (priceCitybreakCont) priceCitybreakCont.style.display = isCityBreak ? 'flex' : 'none';
        if (durCont) durCont.style.display = isCityBreak ? 'none' : 'flex';
        if (weightSec) weightSec.style.display = isCityBreak ? 'none' : 'flex';
        if (destSec) destSec.style.display = isCityBreak ? 'none' : 'flex';
        if (analyticsSec) analyticsSec.style.display = isCityBreak ? 'none' : 'block';

        const maxDist = parseInt(this.els.originDist?.value || 600);
        const maxPriceLonghaul = parseInt(this.els.filterPriceLonghaul?.value || 8000);
        const maxPriceCitybreak = parseInt(this.els.filterPriceCitybreak?.value || 500);
        const minD = parseInt(this.els.minDur?.value || 1);
        const maxD = parseInt(this.els.maxDur?.value || 30);
        const sortBy = this.els.sortBy?.value || 'score';
        const w = { 
            p: parseFloat(this.els.wPrice?.value || 1.0), 
            we: parseFloat(this.els.wWeather?.value || 0.5),
            ef: parseFloat(this.els.wEff?.value || 0.5)
        };

        const lccCodes = ['FR', 'W6'];
        const currentMaxPrice = isCityBreak ? maxPriceCitybreak : maxPriceLonghaul;

        let filtered = this.data.flights.current_best.filter(f => !f.is_mock && f.price <= currentMaxPrice);

        if (this.currentView === 'longhaul') {
            filtered = filtered.filter(f => {
                // Filter out flights that have LCC segments
                if (f.all_airlines && f.all_airlines.some(a => lccCodes.includes(a))) return false;
                // Travelpayouts often only provides the main airline, but if it's LCC, filter it out too
                if (lccCodes.includes(f.airline)) return false;
                
                const dist = this.data.config.ORIGINS[f.origin] ?? 0;
                const dur = f.score_breakdown?.duration_days || 0;
                return dist <= maxDist && dur >= minD && dur <= maxD;
            });
        } else if (isCityBreak) {
            filtered = filtered.filter(f => {
                if (f.was_precision_scanned) return true; 
                
                const depDate = new Date(f.departure_date);
                const day = depDate.getDay(); // 0=Sun, 4=Thu, 5=Fri
                
                // Weekend logic:
                // 1. Must be from KRK
                // 2. Departure on Thursday (evening) or Friday
                // 3. Return on Sunday or Monday
                // 4. Relaxed to 1 day for visibility
                
                const isWeekendFlight = (day === 4 || day === 5);
                const isShortTrip = f.score_breakdown?.duration_days >= 2 && f.score_breakdown?.duration_days <= 4;
                const noDaysOff = f.score_breakdown?.days_off <= 1;

                return f.origin === 'KRK' && isWeekendFlight && isShortTrip && noDaysOff;
            });
        } else {
            filtered = filtered.filter(f => {
                if (f.was_precision_scanned) return true; // Keep manually analyzed routes
                const dist = this.data.config.ORIGINS[f.origin] ?? 0;
                const dur = f.score_breakdown?.duration_days || 0;
                return dist <= maxDist && dur >= minD && dur <= maxD;
            });
        }

        const rescored = filtered.map(f => {
            const bd = f.score_breakdown || {};
            const p_s = Math.max(0, 100 - (bd.price_raw - 1500)/60);
            const w_s = bd.in_season ? 100 : 20;
            const e_s = Math.max(0, Math.min(100, (bd.efficiency || 0) * 15));
            
            const totalW = w.p + w.we + w.ef;
            const final = (p_s*w.p + w_s*w.we + e_s*w.ef) / totalW;
            return { ...f, ui_score: Math.round(final) };
        });

        if (sortBy === 'price') rescored.sort((a, b) => a.price - b.price);
        else rescored.sort((a, b) => b.ui_score - a.ui_score);

        if (this.els.totalRoutes) this.els.totalRoutes.innerText = rescored.length;
        if (this.els.bestPrice) this.els.bestPrice.innerText = rescored.length ? `${rescored[0].price.toLocaleString()} ${rescored[0].currency}` : "--";
        
        if (this.els.dealsGrid) {
            this.els.dealsGrid.innerHTML = '';
            rescored.forEach(f => {
                const card = document.createElement('div');
                card.className = 'card';
                card.innerHTML = this.createCardHtml(f);
                const pBtn = card.querySelector('.btn-precision');
                if (pBtn) pBtn.onclick = () => this.triggerPrecisionScan(f.origin, f.destination, f.departure_date, f.return_date, pBtn);
                this.els.dealsGrid.appendChild(card);
            });
        }
        if (window.tabler) tabler.replace();
        this.renderHistory();
    }

    createCardHtml(f) {
        const bd = f.score_breakdown || {};
        const s = f.ui_score;
        const sCls = s > 80 ? 'score-excellent' : s > 60 ? 'score-good' : s > 40 ? 'score-fair' : 'score-poor';
        
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
                    ${(f.layovers_out || []).map(l => `<span class="badge badge-${l.status}" title="${this.getName(l.airport)}">${l.airport}</span>`).join('')}
                </div>
            </div>` : `
            <div class="mini-itin">
                <button class="btn-book btn-precision" style="width:100%; font-size:0.75rem; padding:0.6rem; margin:0; border: 1px dashed var(--accent);">
                    <i class="ti ti-zoom-scan" style="margin-right: 4px;"></i> Analyze Route Details
                </button>
            </div>`;

        return `
            <div class="card-top">
                <div class="card-dest">${this.getName(f.destination)}</div>
                <div class="card-price">${f.price.toLocaleString()} ${f.currency}</div>
            </div>
            
            <div style="display: flex; align-items: center; gap: 8px;">
                <div class="score-tag ${sCls}">${s}% Match</div>
                <span style="font-size: 0.7rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">AI Score</span>
            </div>

            ${itin}

            <div class="trip-highlight">
                <div class="highlight-item">
                    <span class="highlight-label"><i class="ti ti-calendar-event"></i> Dates</span>
                    <span class="highlight-val">${f.departure_date} <span style="color: var(--text-muted);">→</span> ${f.return_date || '?'}</span>
                </div>
                <div class="highlight-item">
                    <span class="highlight-label"><i class="ti ti-beach"></i> Holidays</span>
                    <span class="highlight-val">${bd.holiday_count || 0} Free Days</span>
                </div>
            </div>

            <div class="card-details">
                <div class="row"><span>Origin</span> <span title="${this.getName(f.origin)}">${this.getName(f.origin)}</span></div>
                <div class="row"><span>Airline</span> <span>${this.getAirline(f.airline)}</span></div>
                <div class="row"><span>Work Days</span> <span>${bd.days_off || 0} Off</span></div>
                <div class="row"><span>Duration</span> <span>${bd.duration_days || '?'} Days</span></div>
            </div>

            <a href="${f.link}" target="_blank" class="btn-book">
                <i class="ti ti-external-link"></i> Book on Google Flights
            </a>
        `;
    }

    renderDestinations() {
        if (!this.data.config?.DESTINATIONS || !this.els.destList) return;
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
        const hist = this.data.flights?.history; if (!hist?.length) return;
        const canvas = document.getElementById('historyChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const labels = hist.map(h => new Date(h.date).toLocaleDateString());
        const countries = [...new Set(hist.flatMap(h => Object.keys(h.stats || {})))];
        
        // Expanded color palette
        const colors = [
            '#6366f1', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', 
            '#06b6d4', '#ec4899', '#f97316', '#84cc16', '#14b8a6',
            '#3b82f6', '#d946ef', '#fbbf24', '#4ade80', '#fb7185'
        ];

        const datasets = countries.map((c, i) => ({ 
            label: this.getName(c), 
            data: hist.map(h => h.stats?.[c]?.avg || null), 
            borderColor: colors[i % colors.length], 
            backgroundColor: colors[i % colors.length],
            tension: 0.3, 
            fill: false 
        }));
        if (this.chart) this.chart.destroy();
        this.chart = new Chart(ctx, { type: 'line', data: { labels, datasets }, options: { responsive: true, maintainAspectRatio: false } });
    }
}

window.app = new FlightPlanner();
