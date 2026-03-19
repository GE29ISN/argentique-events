const SheetsDB = {

    SPREADSHEET_ID: '1Wkmre2sAa-lRpw5d2GrBL5l1OrPvIFWr',
    API_KEY: 'AKfycby6rLvf98aQDmKtfN5NpHscYb0mGkRgQbip0YKJ0czKGlo8j6pqbFieP4NUbI2IG0U',

    SHEETS: {
        STOCK: 'STOCK'
    },

    baseUrl() {
        return `https://sheets.googleapis.com/v4/spreadsheets/${this.SPREADSHEET_ID}`;
    },

    async read(sheetName) {
        const url = `${this.baseUrl()}/values/${sheetName}?key=${this.API_KEY}`;

        try {
            const res = await fetch(url);
            const data = await res.json();
            return data.values || [];
        } catch (e) {
            console.error(e);
            alert("Erreur Google Sheets");
            return [];
        }
    },

    toObjects(rows) {
        if (rows.length < 2) return [];

        const headers = rows[0];

        return rows.slice(1).map(row => {
            let obj = {};
            headers.forEach((h, i) => {
                obj[h] = row[i] || '';
            });
            return obj;
        });
    },

    async getStock() {
        const rows = await this.read(this.SHEETS.STOCK);
        return this.toObjects(rows);
    }
};
