const APP = {
  stock: [],
  devis: [],
  lignesDevis: [],
  categories: [],
  logs: [],
  parametres: {},
  currentPage: 'stock',
  calendarDate: new Date(),
  devisFilter: 'TOUS',
  currentDevis: null,
  currentDevisLignes: [],

  async init() {
    Auth.init();
    if (!Auth.isLoggedIn()) {
      this.showLogin();
      return;
    }
    this.updateUserDisplay();
    await this.loadAllData();
    this.renderPage('stock');
  },

  showLogin() {
    document.getElementById('login-screen')?.classList.remove('hidden');
    document.getElementById('app-screen')?.classList.add('hidden');
  },

  showApp() {
    document.getElementById('login-screen')?.classList.add('hidden');
    document.getElementById('app-screen')?.classList.remove('hidden');
  },

  updateUserDisplay() {
    const el = document.getElementById('user-display');
    if (el) el.textContent = Auth.getFullName();
  },

  async loadAllData() {
    try {
      const [stock, devis, lignesDevis, categories, logs, parametres] = await Promise.all([
        SHEETS.getStock(),
        SHEETS.getDevis(),
        SHEETS.getLignesDevis(),
        SHEETS.getCategories(),
        SHEETS.getLogs(),
        SHEETS.getParametres()
      ]);

      this.stock       = stock?.data       || [];
      this.devis       = devis?.data       || [];
      this.lignesDevis = lignesDevis?.data || [];
      this.categories  = categories?.data  || [];
      this.logs        = logs?.data        || [];
      this.parametres  = parametres?.data  || {};

    } catch(e) {
      console.error('Erreur chargement données:', e);
    }
  },

  async loadCategories() {
    const res = await SHEETS.getCategories();
    if (res.success) this.categories = res.data;
  },

  navigate(page) {
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.getElementById('nav-' + page)?.classList.add('active');
    document.querySelectorAll('.page').forEach(p => {
      p.classList.add('hidden');
      p.classList.remove('active');
    });
    const pageEl = document.getElementById('page-' + page);
    if (pageEl) {
      pageEl.classList.remove('hidden');
      pageEl.classList.add('active');
    }
    this.currentPage = page;
    this.renderPage(page);
  },

  async renderPage(page) {
    switch(page) {
      case 'stock':      await this.renderStock();      break;
      case 'devis':      await this.renderDevis();      break;
      case 'calendrier': await this.renderCalendrier(); break;
      case 'logs':       await this.renderLogs();       break;
      case 'parametres': await this.renderParametres(); break;
    }
  },

  // ==================== STOCK ====================

  async renderStock() {
    const res = await SHEETS.getStock();
    if (res.success) this.stock = res.data;

    const container = document.getElementById('stock-list');
    if (!container) return;

    if (this.stock.length === 0) {
      container.innerHTML = '<p class="empty-msg">Aucun article en stock.</p>';
      return;
    }

    container.innerHTML = this.stock.map(item => `
      <div class="stock-card">
        <div class="stock-info">
          <strong>${item.DESIGNATION || ''}</strong>
          <span class="badge">${item.CATEGORIE || ''}</span>
          <span>Réf: ${item.REFERENCE || ''}</span>
          <span>Qté: <b>${item.QUANTITE || 0}</b></span>
          <span>PU: ${parseFloat(item.PRIX_UNITAIRE || 0).toFixed(2)} €</span>
        </div>
        <div class="stock-actions">
          <button onclick="APP.editStock('${item.REFERENCE}')">✏️</button>
          <button onclick="APP.deleteStock('${item.REFERENCE}')">🗑️</button>
        </div>
      </div>
    `).join('');
  },

  async addStock(data) {
    const res = await SHEETS.addStock(data);
    if (res.success) {
      await this.renderStock();
    }
    return res;
  },

  async editStock(ref) {
    const item = this.stock.find(s => s.REFERENCE === ref);
    if (!item) return;
    // Ouvrir modal d'édition — à adapter selon ton HTML
    console.log('Editer:', item);
  },

  async deleteStock(ref) {
    if (!confirm('Supprimer cet article ?')) return;
    const res = await SHEETS.deleteStock({ reference: ref });
    if (res.success) await this.renderStock();
  },

  // ==================== DEVIS ====================

  async renderDevis() {
    const res = await SHEETS.getDevis();
    if (res.success) this.devis = res.data;

    const container = document.getElementById('devis-list');
    if (!container) return;

    let filtered = this.devis;
    if (this.devisFilter !== 'TOUS') {
      filtered = this.devis.filter(d => d.STATUT === this.devisFilter);
    }

    if (filtered.length === 0) {
      container.innerHTML = '<p class="empty-msg">Aucun devis.</p>';
      return;
    }

    container.innerHTML = filtered.map(d => `
      <div class="devis-card">
        <div class="devis-info">
          <strong>${d.NUMERO || ''}</strong>
          <span>${d.CLIENT || ''}</span>
          <span class="badge badge-${(d.STATUT||'').toLowerCase()}">${d.STATUT || ''}</span>
          <span>${parseFloat(d.TOTAL_TTC || 0).toFixed(2)} €</span>
        </div>
        <div class="devis-actions">
          <button onclick="APP.openDevis('${d.NUMERO}')">👁️</button>
          <button onclick="APP.deleteDevis('${d.NUMERO}')">🗑️</button>
        </div>
      </div>
    `).join('');
  },

  async openDevis(numero) {
    this.currentDevis = this.devis.find(d => d.NUMERO === numero);
    const res = await SHEETS.getLignesDevis(numero);
    this.currentDevisLignes = res.success ? res.data : [];
    // Ouvrir modal devis — à adapter selon ton HTML
    console.log('Ouvrir devis:', this.currentDevis, this.currentDevisLignes);
  },

  async deleteDevis(numero) {
    if (!confirm('Supprimer ce devis ?')) return;
    const res = await SHEETS.deleteDevis({ numero });
    if (res.success) await this.renderDevis();
  },

  setDevisFilter(filter) {
    this.devisFilter = filter;
    this.renderDevis();
  },

  // ==================== CALENDRIER ====================

  async renderCalendrier() {
    const container = document.getElementById('calendrier-content');
    if (!container) return;

    const res = await SHEETS.getDevis();
    if (res.success) this.devis = res.data;

    const year  = this.calendarDate.getFullYear();
    const month = this.calendarDate.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const monthNames = ['Janvier','Février','Mars','Avril','Mai','Juin',
                        'Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

    let html = `
      <div class="calendar-header">
        <button onclick="APP.prevMonth()">◀</button>
        <h3>${monthNames[month]} ${year}</h3>
        <button onclick="APP.nextMonth()">▶</button>
      </div>
      <div class="calendar-grid">
        <div class="cal-day-name">Dim</div>
        <div class="cal-day-name">Lun</div>
        <div class="cal-day-name">Mar</div>
        <div class="cal-day-name">Mer</div>
        <div class="cal-day-name">Jeu</div>
        <div class="cal-day-name">Ven</div>
        <div class="cal-day-name">Sam</div>
    `;

    for (let i = 0; i < firstDay; i++) {
      html += '<div class="cal-empty"></div>';
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const events  = this.devis.filter(dv => (dv.DATE_EVENEMENT || '').startsWith(dateStr));
      const hasEvent = events.length > 0;
      html += `
        <div class="cal-day ${hasEvent ? 'has-event' : ''}" onclick="APP.showDayEvents('${dateStr}')">
          <span>${d}</span>
          ${hasEvent ? `<span class="event-dot">${events.length}</span>` : ''}
        </div>
      `;
    }

    html += '</div>';
    container.innerHTML = html;
  },

  prevMonth() {
    this.calendarDate.setMonth(this.calendarDate.getMonth() - 1);
    this.renderCalendrier();
  },

  nextMonth() {
    this.calendarDate.setMonth(this.calendarDate.getMonth() + 1);
    this.renderCalendrier();
  },

  showDayEvents(dateStr) {
    const events = this.devis.filter(d => (d.DATE_EVENEMENT || '').startsWith(dateStr));
    if (events.length === 0) return;
    alert(events.map(e => `${e.NUMERO} - ${e.CLIENT} - ${e.STATUT}`).join('\n'));
  },

  // ==================== LOGS ====================

  async renderLogs() {
    const res = await SHEETS.getLogs();
    if (res.success) this.logs = res.data;

    const container = document.getElementById('logs-list');
    if (!container) return;

    if (this.logs.length === 0) {
      container.innerHTML = '<p class="empty-msg">Aucun log.</p>';
      return;
    }

    container.innerHTML = this.logs.map(l => `
      <div class="log-entry">
        <span class="log-date">${l.DATE || ''}</span>
        <span class="log-module badge">${l.MODULE || ''}</span>
        <span class="log-action">${l.ACTION || ''}</span>
        <span class="log-detail">${l.DETAIL || ''}</span>
        <span class="log-user">${l.UTILISATEUR || ''}</span>
      </div>
    `).join('');
  },

  // ==================== PARAMETRES ====================

  async renderParametres() {
    const res = await SHEETS.getParametres();
    if (res.success) this.parametres = res.data;

    const container = document.getElementById('parametres-content');
    if (!container) return;

    container.innerHTML = `
      <div class="params-grid">
        ${Object.entries(this.parametres).map(([cle, valeur]) => `
          <div class="param-row">
            <label>${cle}</label>
            <input type="text" id="param-${cle}" value="${valeur}" />
          </div>
        `).join('')}
        <button onclick="APP.saveParametres()">💾 Enregistrer</button>
      </div>
    `;
  },

  async saveParametres() {
    const updated = {};
    Object.keys(this.parametres).forEach(cle => {
      const el = document.getElementById('param-' + cle);
      if (el) updated[cle] = el.value;
    });
    const res = await SHEETS.saveParametres(updated);
    if (res.success) alert('Paramètres sauvegardés ✅');
  },

  // ==================== LOGOUT ====================

  logout() {
    Auth.logout();
    this.showLogin();
  }
};

// Démarrage
document.addEventListener('DOMContentLoaded', () => APP.init());
