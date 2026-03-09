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
            filterPrice: q('filter-price'), valMaxPrice: q('val-max-price'),
            bestPrice: q('stat-best-price'), totalRoutes: q('stat-total-routes'),
            viewName: q('current-view-name'), addBtn: q('add-dest-btn'), autoInput: q('dest-autocomplete'),
            suggestions: q('dest-suggestions'), originList: q('included-origins'),
            wPrice: q('w-price'), wDist: q('w-dist'), wWeather: q('w-weather'), wEff: q('w-eff'),
            vWPrice: q('val-w-price'), vWDist: q('val-w-dist'), vWWeather: q('val-w-weather'), vWEff: q('val-w-eff'),
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
                if (this.els.viewName) this.els.viewName.innerText = this.currentView === 'longhaul' ? 'World Explorer' : 'Kraków Weekend';
                this.saveConfigLocally();
                this.renderDashboard();
            };
        });

        const sliders = ['originDist', 'filterPrice', 'minDur', 'maxDur', 'wPrice', 'wDist', 'wWeather', 'wEff'];
        sliders.forEach(key => {
            const el = this.els[key];
            if (!el) return;
            el.oninput = (e) => {
                const val = e.target.value;
                if (key === 'originDist' && this.els.valDistKrk) { this.els.valDistKrk.innerText = val; this.renderOriginList(); }
                else if (key === 'filterPrice' && this.els.valMaxPrice) this.els.valMaxPrice.innerText = val;
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
            let r = await fetch('/api/config');
            if (!r.ok) r = await fetch('./data/config.json');
            this.data.config = await r.json();
            
            if (this.data.config.SETTINGS) {
                const s = this.data.config.SETTINGS;
                if (this.els.originDist) this.els.originDist.value = s.origin_dist ?? 600;
                if (this.els.filterPrice) this.els.filterPrice.value = s.max_price ?? 8000;
                if (this.els.minDur) this.els.minDur.value = s.min_dur ?? 1;
                if (this.els.maxDur) this.els.maxDur.value = s.max_dur ?? 30;
                if (this.els.wPrice) this.els.wPrice.value = s.w_price ?? 1.0;
                if (this.els.wDist) this.els.wDist.value = s.w_dist ?? 0.5;
                if (this.els.wWeather) this.els.wWeather.value = s.w_weather ?? 0.5;
                if (this.els.wEff) this.els.wEff.value = s.w_eff ?? 0.5;
                
                this.currentView = s.last_view ?? 'longhaul';
                if (this.els.sortBy) this.els.sortBy.value = s.sort_by ?? 'score';
                
                if (this.els.valDistKrk) this.els.valDistKrk.innerText = this.els.originDist?.value || 600;
                if (this.els.valMaxPrice) this.els.valMaxPrice.innerText = this.els.filterPrice?.value || 8000;
                if (this.els.valMinDur) this.els.valMinDur.innerText = this.els.minDur?.value || 1;
                if (this.els.valMaxDur) this.els.valMaxDur.innerText = this.els.maxDur?.value || 30;
                
                // Weights labels
                if (this.els.vWPrice) this.els.vWPrice.innerText = this.els.wPrice?.value || 1.0;
                if (this.els.vWDist) this.els.vWDist.innerText = this.els.wDist?.value || 0.5;
                if (this.els.vWWeather) this.els.vWWeather.innerText = this.els.wWeather?.value || 0.5;
                if (this.els.vWEff) this.els.vWEff.innerText = this.els.wEff?.value || 0.5;
                
                document.querySelectorAll('.nav-tab').forEach(b => b.classList.toggle('active', b.dataset.view === this.currentView));
                if (this.els.viewName) this.els.viewName.innerText = this.currentView === 'longhaul' ? 'World Explorer' : 'Kraków Weekend';
            }
        } catch (e) { console.error("Error loading config:", e); }
    }

    async saveConfigLocally() {
        if (!this.data.config) return;
        this.data.config.SETTINGS = {
            origin_dist: parseInt(this.els.originDist?.value || 600),
            max_price: parseInt(this.els.filterPrice?.value || 8000),
            min_dur: parseInt(this.els.minDur?.value || 1),
            max_dur: parseInt(this.els.maxDur?.value || 30),
            w_price: parseFloat(this.els.wPrice?.value || 1.0),
            w_dist: parseFloat(this.els.wDist?.value || 0.5),
            w_weather: parseFloat(this.els.wWeather?.value || 0.5),
            w_eff: parseFloat(this.els.wEff?.value || 0.5),
            last_view: this.currentView,
            sort_by: this.els.sortBy?.value || 'score'
        };
        try {
            await fetch('/api/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(this.data.config) });
        } catch(e) {}
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
        try { 
            const r = await fetch('/api/scan', { method: 'POST' }); 
            if (!r.ok) {
                const err = await r.json();
                throw new Error(err.output || "Scan failed on server.");
            }
            await this.loadFlights(); 
        } catch (e) {
            alert("Error during Global Scan: " + e.message);
        } finally { 
            this.els.scanBtn.disabled = false; this.els.scanBtn.innerText = "🚀 Run Global Scan"; 
        }
    }

    async triggerPrecisionScan(origin, dest, dep, ret, btn) {
        const oldText = btn.innerText;
        btn.disabled = true; btn.innerText = "⏳ Precision...";
        try {
            const r = await fetch('/api/precision', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ origin, destination: dest, departure_date: dep, return_date: ret })
            });
            if (!r.ok) throw new Error("Precision scan failed.");
            const res = await r.json();
            if (res.status === 'success') { await this.loadFlights(); }
            else { alert("Precision Scan failed: " + (res.message || "Unknown error")); }
        } catch (e) { alert("Error connecting to precision engine."); }
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
        const maxDist = parseInt(this.els.originDist?.value || 600);
        const maxPrice = parseInt(this.els.filterPrice?.value || 8000);
        const minD = parseInt(this.els.minDur?.value || 1);
        const maxD = parseInt(this.els.maxDur?.value || 30);
        const sortBy = this.els.sortBy?.value || 'score';
        const w = { 
            p: parseFloat(this.els.wPrice?.value || 1.0), 
            d: parseFloat(this.els.wDist?.value || 0.5), 
            we: parseFloat(this.els.wWeather?.value || 0.5),
            ef: parseFloat(this.els.wEff?.value || 0.5)
        };

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
            const p_s = Math.max(0, 100 - (bd.price_raw - 1500)/60);
            const d_s = Math.max(0, 100 - (bd.dist_km/6));
            const w_s = bd.in_season ? 100 : 20;
            const e_s = Math.max(0, Math.min(100, (bd.efficiency || 0) * 15));
            
            const totalW = w.p + w.d + w.we + w.ef;
            const final = (p_s*w.p + d_s*w.d + w_s*w.we + e_s*w.ef) / totalW;
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
        const datasets = countries.map((c, i) => ({ label: this.getName(c), data: hist.map(h => h.stats?.[c]?.avg || null), borderColor: ['#6366f1', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6'][i % 5], tension: 0.3, fill: false }));
        if (this.chart) this.chart.destroy();
        this.chart = new Chart(ctx, { type: 'line', data: { labels, datasets }, options: { responsive: true, maintainAspectRatio: false } });
    }
}

window.app = new FlightPlanner();
