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
    document.getElementById('app')?.classList.add('hidden');
  },

  showApp() {
    document.getElementById('login-screen')?.classList.add('hidden');
    document.getElementById('app')?.classList.remove('hidden');
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

    const container = document.getElementById('page-stock');
    if (!container) return;

    if (this.stock.length === 0) {
      container.innerHTML = '<p class="empty-msg">Aucun article en stock.</p>';
      return;
    }

    container.innerHTML = `
      <div class="page-header">
        <h2><i class="fas fa-boxes"></i> Stock</h2>
        <button class="btn btn-primary" onclick="APP.openAddStock()">
          <i class="fas fa-plus"></i> Ajouter
        </button>
      </div>
      <div class="stock-grid">
        ${this.stock.map(item => `
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
        `).join('')}
      </div>
    `;
  },

  openAddStock() {
    const modal = document.getElementById('modal');
    const overlay = document.getElementById('modal-overlay');
    modal.innerHTML = `
      <div class="modal-header">
        <h3>Ajouter un article</h3>
        <button onclick="closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>Référence</label>
          <input type="text" id="add-ref" placeholder="REF001">
        </div>
        <div class="form-group">
          <label>Désignation</label>
          <input type="text" id="add-designation">
        </div>
        <div class="form-group">
          <label>Catégorie</label>
          <select id="add-categorie">
            ${this.categories.map(c => `<option value="${c.NOM || c}">${c.NOM || c}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Quantité</label>
          <input type="number" id="add-quantite" value="1" min="0">
        </div>
        <div class="form-group">
          <label>Prix unitaire (€)</label>
          <input type="number" id="add-prix" value="0" step="0.01" min="0">
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="closeModal()">Annuler</button>
        <button class="btn btn-primary" onclick="APP.saveNewStock()">💾 Enregistrer</button>
      </div>
    `;
    modal.classList.remove('hidden');
    overlay.classList.remove('hidden');
  },

  async saveNewStock() {
    const data = {
      reference:    document.getElementById('add-ref')?.value.trim(),
      designation:  document.getElementById('add-designation')?.value.trim(),
      categorie:    document.getElementById('add-categorie')?.value,
      quantite:     document.getElementById('add-quantite')?.value,
      prix_unitaire: document.getElementById('add-prix')?.value
    };
    if (!data.reference || !data.designation) {
      alert('Référence et désignation obligatoires.');
      return;
    }
    const res = await SHEETS.addStock(data);
    if (res.success) {
      closeModal();
      await this.renderStock();
    } else {
      alert('Erreur: ' + (res.message || 'inconnue'));
    }
  },

  async editStock(ref) {
    const item = this.stock.find(s => s.REFERENCE === ref);
    if (!item) return;
    const modal = document.getElementById('modal');
    const overlay = document.getElementById('modal-overlay');
    modal.innerHTML = `
      <div class="modal-header">
        <h3>Modifier l'article</h3>
        <button onclick="closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>Référence</label>
          <input type="text" id="edit-ref" value="${item.REFERENCE}" readonly>
        </div>
        <div class="form-group">
          <label>Désignation</label>
          <input type="text" id="edit-designation" value="${item.DESIGNATION || ''}">
        </div>
        <div class="form-group">
          <label>Catégorie</label>
          <select id="edit-categorie">
            ${this.categories.map(c => {
              const nom = c.NOM || c;
              return `<option value="${nom}" ${nom === item.CATEGORIE ? 'selected' : ''}>${nom}</option>`;
            }).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Quantité</label>
          <input type="number" id="edit-quantite" value="${item.QUANTITE || 0}" min="0">
        </div>
        <div class="form-group">
          <label>Prix unitaire (€)</label>
          <input type="number" id="edit-prix" value="${item.PRIX_UNITAIRE || 0}" step="0.01" min="0">
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="closeModal()">Annuler</button>
        <button class="btn btn-primary" onclick="APP.saveEditStock('${ref}')">💾 Enregistrer</button>
      </div>
    `;
    modal.classList.remove('hidden');
    overlay.classList.remove('hidden');
  },

  async saveEditStock(ref) {
    const data = {
      reference:     ref,
      designation:   document.getElementById('edit-designation')?.value.trim(),
      categorie:     document.getElementById('edit-categorie')?.value,
      quantite:      document.getElementById('edit-quantite')?.value,
      prix_unitaire: document.getElementById('edit-prix')?.value
    };
    const res = await SHEETS.updateStock(data);
    if (res.success) {
      closeModal();
      await this.renderStock();
    } else {
      alert('Erreur: ' + (res.message || 'inconnue'));
    }
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

    const container = document.getElementById('page-devis');
    if (!container) return;

    let filtered = this.devis;
    if (this.devisFilter !== 'TOUS') {
      filtered = this.devis.filter(d => d.STATUT === this.devisFilter);
    }

    container.innerHTML = `
      <div class="page-header">
        <h2><i class="fas fa-file-invoice"></i> Devis</h2>
        <button class="btn btn-primary" onclick="APP.openAddDevis()">
          <i class="fas fa-plus"></i> Nouveau devis
        </button>
      </div>
      <div class="devis-filters">
        ${['TOUS','BROUILLON','ENVOYÉ','CONFIRMÉ','ANNULÉ'].map(f => `
          <button class="filter-btn ${this.devisFilter === f ? 'active' : ''}"
                  onclick="APP.setDevisFilter('${f}')">${f}</button>
        `).join('')}
      </div>
      ${filtered.length === 0
        ? '<p class="empty-msg">Aucun devis.</p>'
        : `<div class="devis-list">
            ${filtered.map(d => `
              <div class="devis-card">
                <div class="devis-info">
                  <strong>${d.NUMERO || ''}</strong>
                  <span>${d.CLIENT || ''}</span>
                  <span>${d.DATE_EVENEMENT || ''}</span>
                  <span class="badge badge-${(d.STATUT||'').toLowerCase()}">${d.STATUT || ''}</span>
                  <span>${parseFloat(d.TOTAL_TTC || 0).toFixed(2)} €</span>
                </div>
                <div class="devis-actions">
                  <button onclick="APP.openDevis('${d.NUMERO}')">👁️</button>
                  <button onclick="APP.deleteDevis('${d.NUMERO}')">🗑️</button>
                </div>
              </div>
            `).join('')}
          </div>`
      }
    `;
  },

  openAddDevis() {
    const modal = document.getElementById('modal');
    const overlay = document.getElementById('modal-overlay');
    const numero = 'DEV-' + Date.now();
    modal.innerHTML = `
      <div class="modal-header">
        <h3>Nouveau devis</h3>
        <button onclick="closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>Numéro</label>
          <input type="text" id="new-numero" value="${numero}">
        </div>
        <div class="form-group">
          <label>Client</label>
          <input type="text" id="new-client">
        </div>
        <div class="form-group">
          <label>Date événement</label>
          <input type="date" id="new-date-event">
        </div>
        <div class="form-group">
          <label>Lieu</label>
          <input type="text" id="new-lieu">
        </div>
        <div class="form-group">
          <label>Statut</label>
          <select id="new-statut">
            <option>BROUILLON</option>
            <option>ENVOYÉ</option>
            <option>CONFIRMÉ</option>
            <option>ANNULÉ</option>
          </select>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="closeModal()">Annuler</button>
        <button class="btn btn-primary" onclick="APP.saveNewDevis()">💾 Créer</button>
      </div>
    `;
    modal.classList.remove('hidden');
    overlay.classList.remove('hidden');
  },

  async saveNewDevis() {
    const data = {
      numero:          document.getElementById('new-numero')?.value.trim(),
      client:          document.getElementById('new-client')?.value.trim(),
      date_evenement:  document.getElementById('new-date-event')?.value,
      lieu:            document.getElementById('new-lieu')?.value.trim(),
      statut:          document.getElementById('new-statut')?.value,
    };
    if (!data.client) { alert('Client obligatoire.'); return; }
    const res = await SHEETS.addDevis(data);
    if (res.success) {
      closeModal();
      await this.renderDevis();
    } else {
      alert('Erreur: ' + (res.message || 'inconnue'));
    }
  },

  async openDevis(numero) {
    this.currentDevis = this.devis.find(d => d.NUMERO === numero);
    const res = await SHEETS.getLignesDevis(numero);
    this.currentDevisLignes = res.success ? res.data : [];

    const modal = document.getElementById('modal');
    const overlay = document.getElementById('modal-overlay');
    const d = this.currentDevis;

    modal.innerHTML = `
      <div class="modal-header">
        <h3>Devis ${d.NUMERO}</h3>
        <button onclick="closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <p><strong>Client :</strong> ${d.CLIENT || ''}</p>
        <p><strong>Événement :</strong> ${d.DATE_EVENEMENT || ''} — ${d.LIEU || ''}</p>
        <p><strong>Statut :</strong> <span class="badge badge-${(d.STATUT||'').toLowerCase()}">${d.STATUT || ''}</span></p>
        <hr>
        <h4>Lignes</h4>
        ${this.currentDevisLignes.length === 0
          ? '<p class="empty-msg">Aucune ligne.</p>'
          : `<table class="table">
              <thead><tr><th>Désignation</th><th>Qté</th><th>PU</th><th>Total</th></tr></thead>
              <tbody>
                ${this.currentDevisLignes.map(l => `
                  <tr>
                    <td>${l.DESIGNATION || ''}</td>
                    <td>${l.QUANTITE || 0}</td>
                    <td>${parseFloat(l.PRIX_UNITAIRE || 0).toFixed(2)} €</td>
                    <td>${parseFloat(l.TOTAL || 0).toFixed(2)} €</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>`
        }
        <p class="total-line"><strong>Total TTC : ${parseFloat(d.TOTAL_TTC || 0).toFixed(2)} €</strong></p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="closeModal()">Fermer</button>
        <button class="btn btn-primary" onclick="PDF.generateDevis('${numero}')">📄 PDF</button>
      </div>
    `;
    modal.classList.remove('hidden');
    overlay.classList.remove('hidden');
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
    const container = document.getElementById('page-calendrier');
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
      <div class="page-header">
        <h2><i class="fas fa-calendar-alt"></i> Calendrier</h2>
      </div>
      <div class="calendar-header">
        <button class="btn btn-secondary" onclick="APP.prevMonth()">◀</button>
        <h3>${monthNames[month]} ${year}</h3>
        <button class="btn btn-secondary" onclick="APP.nextMonth()">▶</button>
      </div>
      <div class="calendar-grid">
        <div class="cal-day-name">Lun</div>
        <div class="cal-day-name">Mar</div>
        <div class="cal-day-name">Mer</div>
        <div class="cal-day-name">Jeu</div>
        <div class="cal-day-name">Ven</div>
        <div class="cal-day-name">Sam</div>
        <div class="cal-day-name">Dim</div>
    `;

    const startDay = (firstDay === 0 ? 6 : firstDay - 1);
    for (let i = 0; i < startDay; i++) {
      html += '<div class="cal-empty"></div>';
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const events  = this.devis.filter(dv => (dv.DATE_EVENEMENT || '').startsWith(dateStr));
      const hasEvent = events.length > 0;
      html += `
        <div class="cal-day ${hasEvent ? 'has-event' : ''}" onclick="APP.showDayEvents('${dateStr}')">
          <span class="cal-day-num">${d}</span>
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
    const modal = document.getElementById('modal');
    const overlay = document.getElementById('modal-overlay');
    modal.innerHTML = `
      <div class="modal-header">
        <h3>Événements du ${dateStr}</h3>
        <button onclick="closeModal()">✕</button>
      </div>
      <div class="modal-body">
        ${events.map(e => `
          <div class="devis-card">
            <strong>${e.NUMERO}</strong> — ${e.CLIENT}
            <span class="badge badge-${(e.STATUT||'').toLowerCase()}">${e.STATUT}</span>
          </div>
        `).join('')}
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="closeModal()">Fermer</button>
      </div>
    `;
    modal.classList.remove('hidden');
    overlay.classList.remove('hidden');
  },

  // ==================== LOGS ====================

  async renderLogs() {
    const res = await SHEETS.getLogs();
    if (res.success) this.logs = res.data;

    const container = document.getElementById('page-logs');
    if (!container) return;

    container.innerHTML = `
      <div class="page-header">
        <h2><i class="fas fa-history"></i> Logs</h2>
      </div>
      ${this.logs.length === 0
        ? '<p class="empty-msg">Aucun log.</p>'
        : `<div class="logs-list">
            ${this.logs.map(l => `
              <div class="log-entry">
                <span class="log-date">${l.DATE || ''}</span>
                <span class="log-module badge">${l.MODULE || ''}</span>
                <span class="log-action">${l.ACTION || ''}</span>
                <span class="log-detail">${l.DETAIL || ''}</span>
                <span class="log-user">${l.UTILISATEUR || ''}</span>
              </div>
            `).join('')}
          </div>`
      }
    `;
  },

  // ==================== PARAMETRES ====================

  async renderParametres() {
    const res = await SHEETS.getParametres();
    if (res.success) this.parametres = res.data;

    const container = document.getElementById('page-parametres');
    if (!container) return;

    container.innerHTML = `
      <div class="page-header">
        <h2><i class="fas fa-cog"></i> Paramètres</h2>
      </div>
      <div class="params-grid">
        ${Object.entries(this.parametres).map(([cle, valeur]) => `
          <div class="param-row">
            <label>${cle}</label>
            <input type="text" id="param-${cle}" value="${valeur || ''}" />
          </div>
        `).join('')}
        <div class="param-actions">
          <button class="btn btn-primary" onclick="APP.saveParametres()">💾 Enregistrer</button>
        </div>
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
    else alert('Erreur: ' + (res.message || 'inconnue'));
  },

  // ==================== LOGOUT ====================

  logout() {
    Auth.logout();
    this.showLogin();
  }
};

// Démarrage
document.addEventListener('DOMContentLoaded', () => APP.init());
