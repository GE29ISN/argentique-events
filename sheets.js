// ============================================
// GOOGLE SHEETS API - CONNEXION
// ============================================

const SheetsDB = {

    // ⚙️ CONFIGURATION - À remplir après setup Google
    SPREADSHEET_ID: localStorage.getItem('sheets_id') || '',
    API_KEY: localStorage.getItem('sheets_api') || '',
    
    // Nom des onglets
    SHEETS: {
        STOCK: 'STOCK',
        DEVIS: 'DEVIS',
        LIGNES_DEVIS: 'LIGNES_DEVIS',
        CLIENTS: 'CLIENTS',
        CATEGORIES: 'CATEGORIES',
        LOGS: 'LOGS',
        SORTIES: 'SORTIES_STOCK'
    },

    baseUrl() {
        return `https://sheets.googleapis.com/v4/spreadsheets/${this.SPREADSHEET_ID}`;
    },

    // Lire une plage
    async read(sheetName, range = '') {
        const fullRange = range ? `${sheetName}!${range}` : `${sheetName}`;
        const url = `${this.baseUrl()}/values/${encodeURIComponent(fullRange)}?key=${this.API_KEY}`;
        
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`Erreur lecture: ${res.status}`);
            const data = await res.json();
            return data.values || [];
        } catch (e) {
            console.error('Erreur read:', e);
            showToast('Erreur de connexion Google Sheets', 'error');
            return [];
        }
    },

    // Écrire/Append une ligne
    async append(sheetName, values) {
        const url = `${this.baseUrl()}/values/${encodeURIComponent(sheetName)}:append?valueInputOption=USER_ENTERED&key=${this.API_KEY}`;
        
        // Pour écriture, on a besoin du token OAuth (pas juste API key)
        // On utilise gapi ou Apps Script comme proxy
        return await this.appsScriptCall('append', { sheet: sheetName, values });
    },

    // Update une ligne spécifique
    async update(sheetName, rowIndex, values) {
        return await this.appsScriptCall('update', { sheet: sheetName, row: rowIndex, values });
    },

    // Supprimer (marquer comme supprimé)
    async delete(sheetName, rowIndex) {
        return await this.appsScriptCall('delete', { sheet: sheetName, row: rowIndex });
    },

    // Appel vers Google Apps Script (proxy pour les écritures)
    async appsScriptCall(action, payload) {
        const APPS_SCRIPT_URL = localStorage.getItem('apps_script_url') || '';
        
        if (!APPS_SCRIPT_URL) {
            showToast('URL Apps Script non configurée', 'error');
            return null;
        }

        try {
            const res = await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, ...payload })
            });
            
            const data = await res.json();
            return data;
        } catch (e) {
            console.error('Erreur Apps Script:', e);
            showToast('Erreur de sauvegarde', 'error');
            return null;
        }
    },

    // Convertir tableau en objets avec headers
    toObjects(rows) {
        if (!rows || rows.length < 2) return [];
        const headers = rows[0];
        return rows.slice(1).map((row, idx) => {
            const obj = { _rowIndex: idx + 2 }; // +2 car header = ligne 1
            headers.forEach((h, i) => {
                obj[h] = row[i] || '';
            });
            return obj;
        }).filter(obj => obj.ID || obj.REF || obj.NUMERO); // Filtrer lignes vides
    },

    // Charger tous les stocks
    async getStock() {
        const rows = await this.read(this.SHEETS.STOCK);
        return this.toObjects(rows);
    },

    // Charger tous les devis
    async getDevis() {
        const rows = await this.read(this.SHEETS.DEVIS);
        return this.toObjects(rows);
    },

    // Charger lignes devis
    async getLignesDevis() {
        const rows = await this.read(this.SHEETS.LIGNES_DEVIS);
        return this.toObjects(rows);
    },

    // Charger catégories
    async getCategories() {
        const rows = await this.read(this.SHEETS.CATEGORIES);
        return this.toObjects(rows);
    },

    // Charger logs
    async getLogs() {
        const rows = await this.read(this.SHEETS.LOGS);
        return this.toObjects(rows);
    },

    // Ajouter un log
    async addLog(type, action, details, user) {
        const now = new Date();
        const values = [
            now.toLocaleDateString('fr-FR'),
            now.toLocaleTimeString('fr-FR'),
            type,
            action,
            details,
            user || localStorage.getItem('username') || 'Inconnu',
            now.toISOString()
        ];
        return await this.append(this.SHEETS.LOGS, values);
    }
};
// À la toute fin de sheets.js
const Sheets = SheetsDB;
