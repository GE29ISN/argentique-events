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
      const results = await Promise.allSettled([
        SHEETS.getStock(),
        SHEETS.getDevis(),
        SHEETS.getLignesDevis(),
        SHEETS.getCategories(),
        SHEETS.getLogs(),
        SHEETS.getParametres()
      ]);

      const [stock, devis, lignesDevis, categories, logs, parametres] = results.map(r =>
        r.status === 'fulfilled' ? r.value : { success: false, data: [] }
      );

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
      case 'stock':        await this.renderStock();        break;
      case 'devis':        await this.renderDevis();        break;
      case 'calendrier':   await this.renderCalendrier();   break;
      case 'logs':         await this.renderLogs();         break;
      case 'parametres':   await this.renderParametres();   break;
      case 'utilisateurs': await this.renderUtilisateurs(); break;
    }
  },

  // ==================== STOCK ====================

  async renderStock() {
    const res = await SHEETS.getStock();
    if (res.success) this.stock = res.data;

    const container = document.getElementById('page-stock');
    if (!container) return;

    const actifs = this.stock.filter(s => s.ACTIF !== 'NON');
    const user = Auth.getUser();

    container.innerHTML = `
      <div class="page-header">
        <h2><i class="fas fa-boxes"></i> Stock</h2>
        ${user?.role === 'admin' ? `<button class="btn btn-primary" onclick="APP.openModalAjoutStock()"><i class="fas fa-plus"></i> Ajouter</button>` : ''}
      </div>
      ${actifs.length === 0
        ? '<p class="empty-msg">Aucun article en stock.</p>'
        : `<div class="table-wrapper">
            <table class="table">
              <thead>
                <tr>
                  <th>Référence</th><th>Nom</th><th>Catégorie</th>
                  <th>Famille</th><th>Qté</th><th>Prix Location</th>
                  <th>État</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${actifs.map(s => `
                  <tr>
                    <td>${s.REFERENCE || ''}</td>
                    <td>${s.NOM || ''}</td>
                    <td>${s.CATEGORIE || ''}</td>
                    <td>${s.FAMILLE || ''}</td>
                    <td>${s.QUANTITE || 0}</td>
                    <td>${s.PRIX_LOCATION ? s.PRIX_LOCATION + ' €' : '-'}</td>
                    <td><span class="badge">${s.ETAT || ''}</span></td>
                    <td>
                      <button class="btn btn-sm" onclick="APP.openModalSortieStock('${s.REFERENCE}')">Sortie</button>
                      ${user?.role === 'admin' ? `
                        <button class="btn btn-sm btn-secondary" onclick="APP.openModalEditStock('${s.REFERENCE}')">Modifier</button>
                        <button class="btn btn-sm btn-danger" onclick="APP.deleteStock('${s.REFERENCE}')">Suppr.</button>
                      ` : ''}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>`
      }
    `;
  },

  async deleteStock(ref) {
    if (!confirm('Supprimer cet article ?')) return;
    const res = await SHEETS.deleteStock({ reference: ref, utilisateur: Auth.getFullName() });
    if (res.success) await this.renderStock();
    else alert('Erreur: ' + res.error);
  },

  openModalAjoutStock() {
    const cats = this.categories;
    const familles = [...new Set(cats.map(c => c.FAMILLE))];
    this.openModal('Ajouter au stock', `
      <div class="form-grid">
        <div class="form-group">
          <label>Référence *</label>
          <input type="text" id="s-ref" placeholder="REF-001" />
        </div>
        <div class="form-group">
          <label>Nom *</label>
          <input type="text" id="s-nom" />
        </div>
        <div class="form-group">
          <label>Famille</label>
          <select id="s-famille" onchange="APP.filterCategoriesByFamille()">
            <option value="">-- Famille --</option>
            ${familles.map(f => `<option value="${f}">${f}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Catégorie</label>
          <select id="s-categorie">
            <option value="">-- Catégorie --</option>
            ${cats.map(c => `<option value="${c.NOM}">${c.NOM}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Modèle</label>
          <input type="text" id="s-modele" />
        </div>
        <div class="form-group">
          <label>Quantité</label>
          <input type="number" id="s-quantite" value="1" min="0" />
        </div>
        <div class="form-group">
          <label>Prix achat (€)</label>
          <input type="number" id="s-prix-achat" value="0" step="0.01" />
        </div>
        <div class="form-group">
          <label>Prix location (€)</label>
          <input type="number" id="s-prix-location" value="0" step="0.01" />
        </div>
        <div class="form-group">
          <label>Prix vente (€)</label>
          <input type="number" id="s-prix-vente" value="0" step="0.01" />
        </div>
        <div class="form-group">
          <label>État</label>
          <select id="s-etat">
            <option>Bon</option><option>Moyen</option><option>Mauvais</option><option>HS</option>
          </select>
        </div>
        <div class="form-group">
          <label>N° Série</label>
          <input type="text" id="s-serial" />
        </div>
        <div class="form-group">
          <label>Date achat</label>
          <input type="date" id="s-date-achat" />
        </div>
        <div class="form-group">
          <label>Fournisseur</label>
          <input type="text" id="s-fournisseur" />
        </div>
        <div class="form-group">
          <label>Consommable</label>
          <select id="s-consommable">
            <option value="false">Non</option>
            <option value="true">Oui</option>
          </select>
        </div>
        <div class="form-group full-width">
          <label>Notes</label>
          <textarea id="s-notes" rows="2"></textarea>
        </div>
      </div>
    `, async () => {
      const data = {
        reference:     document.getElementById('s-ref').value.trim(),
        nom:           document.getElementById('s-nom').value.trim(),
        categorie:     document.getElementById('s-categorie').value,
        modele:        document.getElementById('s-modele').value,
        famille:       document.getElementById('s-famille').value,
        quantite:      document.getElementById('s-quantite').value,
        prix_achat:    document.getElementById('s-prix-achat').value,
        prix_location: document.getElementById('s-prix-location').value,
        prix_vente:    document.getElementById('s-prix-vente').value,
        etat:          document.getElementById('s-etat').value,
        serial:        document.getElementById('s-serial').value,
        date_achat:    document.getElementById('s-date-achat').value,
        fournisseur:   document.getElementById('s-fournisseur').value,
        consommable:   document.getElementById('s-consommable').value,
        notes:         document.getElementById('s-notes').value,
        utilisateur:   Auth.getFullName()
      };
      if (!data.reference || !data.nom) { alert('Référence et Nom obligatoires'); return; }
      const res = await SHEETS.addStock(data);
      if (res.success) { this.closeModal(); await this.renderStock(); }
      else alert('Erreur: ' + res.error);
    });
  },

  filterCategoriesByFamille() {
    const famille = document.getElementById('s-famille')?.value;
    const select = document.getElementById('s-categorie');
    if (!select) return;
    const filtered = famille ? this.categories.filter(c => c.FAMILLE === famille) : this.categories;
    select.innerHTML = '<option value="">-- Catégorie --</option>' +
      filtered.map(c => `<option value="${c.NOM}">${c.NOM}</option>`).join('');
  },

  openModalEditStock(ref) {
    const s = this.stock.find(x => x.REFERENCE === ref);
    if (!s) return;
    this.openModal('Modifier article', `
      <div class="form-grid">
        <div class="form-group">
          <label>Référence</label>
          <input type="text" id="s-ref" value="${s.REFERENCE}" disabled />
        </div>
        <div class="form-group">
          <label>Nom</label>
          <input type="text" id="s-nom" value="${s.NOM || ''}" />
        </div>
        <div class="form-group">
          <label>Catégorie</label>
          <input type="text" id="s-categorie" value="${s.CATEGORIE || ''}" />
        </div>
        <div class="form-group">
          <label>Famille</label>
          <input type="text" id="s-famille" value="${s.FAMILLE || ''}" />
        </div>
        <div class="form-group">
          <label>Modèle</label>
          
