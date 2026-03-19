const SHEETS = {
  API_URL: 'https://script.google.com/macros/s/AKfycby9Ks12d_MAhrPBTcACX_iQ2f7aTSA-QJzZ5k6Ng8eSo9D0yWwpE0kWuU4S3mIZuMM/exec',


  async call(data) {
    const params = new URLSearchParams(data);
    const response = await fetch(this.API_URL + '?' + params.toString());
    if (!response.ok) throw new Error('Erreur réseau: ' + response.status);
    return await response.json();
  },

  async post(data) {
    const response = await fetch(this.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      mode: 'no-cors'
    });
    // no-cors ne retourne pas de body lisible, on refait en GET
    return await this.call(data);
  },

  // STOCK
  async getStock() { return this.call({ action: 'getStock' }); },
  async addStock(d) { return this.call({ ...d, action: 'addStock' }); },
  async updateStock(d) { return this.call({ ...d, action: 'updateStock' }); },
  async deleteStock(d) { return this.call({ ...d, action: 'deleteStock' }); },
  async sortieStock(d) { return this.call({ ...d, action: 'sortieStock' }); },

  // CATEGORIES
  async getCategories() { return this.call({ action: 'getCategories' }); },
  async addCategorie(d) { return this.call({ ...d, action: 'addCategorie' }); },
  async deleteCategorie(d) { return this.call({ ...d, action: 'deleteCategorie' }); },

  // DEVIS
  async getDevis() { return this.call({ action: 'getDevis' }); },
  async addDevis(d) { return this.call({ ...d, action: 'addDevis' }); },
  async updateDevis(d) { return this.call({ ...d, action: 'updateDevis' }); },
  async deleteDevis(d) { return this.call({ ...d, action: 'deleteDevis' }); },

  // LIGNES DEVIS
  async getLignesDevis(numero) { return this.call({ action: 'getLignesDevis', numero_devis: numero }); },
  async saveLignesDevis(numero, lignes) {
    return this.call({ action: 'saveLignesDevis', numero_devis: numero, lignes: JSON.stringify(lignes) });
  },

  // SORTIES
  async getSorties() { return this.call({ action: 'getSorties' }); },

  // LOGS
  async getLogs() { return this.call({ action: 'getLogs' }); },

  // PARAMETRES
  async getParametres() { return this.call({ action: 'getParametres' }); },
  async saveParametres(params) {
    return this.call({ action: 'saveParametres', params: JSON.stringify(params) });
  },

  // UTILISATEURS
  async getUtilisateurs() { return this.call({ action: 'getUtilisateurs' }); },
  async addUtilisateur(d) { return this.call({ ...d, action: 'addUtilisateur' }); }
};
