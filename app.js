const App = {
    stock: []
};

// ==========================
// INIT
// ==========================

document.addEventListener('DOMContentLoaded', async () => {
    await loadStock();
});

// ==========================
// LOAD DATA
// ==========================

async function loadStock() {
    try {
        App.stock = await SheetsDB.getStock();
        renderStock();
    } catch (e) {
        console.error(e);
        alert("Erreur chargement");
    }
}

// ==========================
// RENDER
// ==========================

function renderStock(search = '') {
    const tbody = document.getElementById('tbody-stock');

    let items = App.stock;

    if (search) {
        const s = search.toLowerCase();
        items = items.filter(i =>
            (i.NOM || '').toLowerCase().includes(s) ||
            (i.REFERENCE || '').toLowerCase().includes(s)
        );
    }

    if (items.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4">Aucun résultat</td></tr>`;
        return;
    }

    tbody.innerHTML = items.map(item => `
        <tr>
            <td>${item.REFERENCE || ''}</td>
            <td>${item.NOM || ''}</td>
            <td>${item.CATEGORIE || ''}</td>
            <td>${item.QUANTITE || 0}</td>
        </tr>
    `).join('');
}

// ==========================
// SEARCH
// ==========================

function searchStock() {
    const val = document.getElementById('search-stock').value;
    renderStock(val);
}
