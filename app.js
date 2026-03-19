// ============================================
// ARGENTIQUE EVENTS - APPLICATION PRINCIPALE
// ============================================

const App = {
    stock: [],
    devis: [],
    lignesDevis: [],
    categories: [],
    logs: [],
    currentDevis: null,
    currentDevisLignes: [],
    username: localStorage.getItem('username') || 'Utilisateur',

    defaultCategories: [
        { ID: 'cat_001', NOM: 'Câblage son', FAMILLE: 'SON' },
        { ID: 'cat_002', NOM: 'Console son', FAMILLE: 'SON' },
        { ID: 'cat_003', NOM: 'Périphérique son', FAMILLE: 'SON' },
        { ID: 'cat_004', NOM: 'Micro HF', FAMILLE: 'SON' },
        { ID: 'cat_005', NOM: 'Interphonie', FAMILLE: 'SON' },
        { ID: 'cat_006', NOM: 'Rigg son', FAMILLE: 'SON' },
        { ID: 'cat_007', NOM: 'Testeur', FAMILLE: 'SON' },
        { ID: 'cat_008', NOM: 'Tio', FAMILLE: 'SON' },
        { ID: 'cat_009', NOM: 'Carte son', FAMILLE: 'SON' },
        { ID: 'cat_010', NOM: 'Diffusion', FAMILLE: 'SON' },
        { ID: 'cat_011', NOM: 'Câblage lumière', FAMILLE: 'LUMIERE' },
        { ID: 'cat_012', NOM: 'Source LED', FAMILLE: 'LUMIERE' },
        { ID: 'cat_013', NOM: 'Source traditionnel', FAMILLE: 'LUMIERE' },
        { ID: 'cat_014', NOM: 'Accessoires LED', FAMILLE: 'LUMIERE' },
        { ID: 'cat_015', NOM: 'Accessoires traditionnel', FAMILLE: 'LUMIERE' },
        { ID: 'cat_016', NOM: 'Console lumière', FAMILLE: 'LUMIERE' },
        { ID: 'cat_017', NOM: 'Périphérique lumière', FAMILLE: 'LUMIERE' },
        { ID: 'cat_018', NOM: 'Fumée', FAMILLE: 'LUMIERE' },
        { ID: 'cat_019', NOM: 'Câblage vidéo', FAMILLE: 'VIDEO' },
        { ID: 'cat_020', NOM: 'Vidéo-projection', FAMILLE: 'VIDEO' },
        { ID: 'cat_021', NOM: 'Poutre carrée', FAMILLE: 'STRUCTURE' },
        { ID: 'cat_022', NOM: 'Poutre triangle', FAMILLE: 'STRUCTURE' },
        { ID: 'cat_023', NOM: 'Accroche', FAMILLE: 'STRUCTURE' },
        { ID: 'cat_024', NOM: 'Pied', FAMILLE: 'STRUCTURE' },
        { ID: 'cat_025', NOM: 'Praticable', FAMILLE: 'STRUCTURE' },
        { ID: 'cat_026', NOM: 'Flight case', FAMILLE: 'TRANSPORT' },
        { ID: 'cat_027', NOM: 'Sac', FAMILLE: 'TRANSPORT' },
        { ID: 'cat_028', NOM: 'Consommable', FAMILLE: 'DIVERS' },
        { ID: 'cat_029', NOM: 'Outillage', FAMILLE: 'DIVERS' },
        { ID: 'cat_030', NOM: 'Divers', FAMILLE: 'DIVERS' }
    ]
};

// ============================================
// UTILITAIRES
// ============================================

function generateId(prefix = 'ID') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
}

function generateNumeroDevis() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const count = App.devis.length + 1;
    return `DEV-${year}${month}-${String(count).padStart(3, '0')}`;
}

function formatCurrency(value) {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value || 0);
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
        return new Date(dateStr).toLocaleDateString('fr-FR');
    } catch { return dateStr; }
}

function formatDateTime(dateStr) {
    if (!dateStr) return '';
    try {
        return new Date(dateStr).toLocaleString('fr-FR');
    } catch { return dateStr; }
}

function getStatusClass(statut) {
    const classes = {
        'En cours': 'bg-warning text-dark',
        'Envoyé': 'bg-info',
        'Accepté': 'bg-success',
        'Refusé': 'bg-danger',
        'Facturé': 'bg-primary'
    };
    return classes[statut] || 'bg-secondary';
}

function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 4000);
}

function showLoader(show) {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.classList.toggle('hidden', !show);
    }
}

function searchStock() {
    const val = document.getElementById('search-stock').value;
    renderStock(val);
}

function searchDevis() {
    const val = document.getElementById('search-devis').value;
    renderDevis(val);
}

async function refreshData() {
    await loadAllData();
    showAlert('Données actualisées', 'success');
}

async function loadAllData() {
    showLoader(true);
    try {
        App.stock = await Sheets.getStock();
        App.devis = await Sheets.getDevis();
        App.lignesDevis = await Sheets.getLignesDevis();
        App.categories = await Sheets.getCategories();
        if (!App.categories || App.categories.length === 0) {
            App.categories = App.defaultCategories;
        }
        renderStock();
        renderDevis();
        updateDashboard();
    } catch (e) {
        console.error(e);
        showAlert('Erreur lors du chargement des données', 'error');
    }
    showLoader(false);
}

// ============================================
// NAVIGATION
// ============================================

function showSection(section) {
    document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
    const target = document.getElementById(`section-${section}`);
    if (target) target.classList.remove('hidden');

    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    const navLink = document.querySelector(`[onclick="showSection('${section}')"]`);
    if (navLink) navLink.classList.add('active');
}

// ============================================
// DASHBOARD
// ============================================

function updateDashboard() {
    const totalArticles = App.stock.length;
    const devisEnCours = App.devis.filter(d => d.STATUT === 'En cours').length;
    const devisAcceptes = App.devis.filter(d => d.STATUT === 'Accepté').length;
    const caTotal = App.devis
        .filter(d => d.STATUT === 'Accepté' || d.STATUT === 'Facturé')
        .reduce((sum, d) => sum + (parseFloat(d.TOTAL_TTC) || 0), 0);

    const el = id => document.getElementById(id);
    if (el('stat-articles')) el('stat-articles').textContent = totalArticles;
    if (el('stat-devis-cours')) el('stat-devis-cours').textContent = devisEnCours;
    if (el('stat-devis-acceptes')) el('stat-devis-acceptes').textContent = devisAcceptes;
    if (el('stat-ca')) el('stat-ca').textContent = formatCurrency(caTotal);
}

// ============================================
// STOCK
// ============================================

function renderStock(search = '') {
    const tbody = document.getElementById('stock-tbody');
    if (!tbody) return;

    let items = App.stock;
    if (search) {
        const s = search.toLowerCase();
        items = items.filter(i =>
            (i.NOM || '').toLowerCase().includes(s) ||
            (i.CATEGORIE || '').toLowerCase().includes(s) ||
            (i.REFERENCE || '').toLowerCase().includes(s)
        );
    }

    tbody.innerHTML = items.length === 0
        ? '<tr><td colspan="7" class="text-center text-muted">Aucun article trouvé</td></tr>'
        : items.map(item => `
            <tr>
                <td>${item.REFERENCE || ''}</td>
                <td>${item.NOM || ''}</td>
                <td>${item.CATEGORIE || ''}</td>
                <td>${item.QUANTITE || 0}</td>
                <td>${formatCurrency(item.PRIX_JOUR)}</td>
                <td>${item.ETAT || ''}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="editArticle('${item.ID}')">✏️</button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteArticle('${item.ID}')">🗑️</button>
                </td>
            </tr>
        `).join('');
}

function openModal(modalId) {
    const modal = new bootstrap.Modal(document.getElementById(modalId));
    modal.show();
}

function openAddArticle() {
    document.getElementById('form-article').reset();
    document.getElementById('article-id').value = '';
    populateCategoriesSelect();
    openModal('modal-article');
}

function populateCategoriesSelect() {
    const select = document.getElementById('article-categorie');
    if (!select) return;
    const cats = App.categories.length > 0 ? App.categories : App.defaultCategories;
    select.innerHTML = cats.map(c => `<option value="${c.NOM}">${c.NOM} (${c.FAMILLE})</option>`).join('');
}

async function saveArticle() {
    const id = document.getElementById('article-id').value;
    const article = {
        NOM: document.getElementById('article-nom').value,
        REFERENCE: document.getElementById('article-reference').value,
        CATEGORIE: document.getElementById('article-categorie').value,
        QUANTITE: document.getElementById('article-quantite').value,
        PRIX_JOUR: document.getElementById('article-prix').value,
        ETAT: document.getElementById('article-etat').value,
        DESCRIPTION: document.getElementById('article-description').value
    };

    if (!article.NOM) { showAlert('Le nom est obligatoire', 'warning'); return; }

    showLoader(true);
    try {
        if (id) {
            article.ID = id;
            await Sheets.updateArticle(article);
            showAlert('Article modifié', 'success');
        } else {
            article.ID = generateId('ART');
            await Sheets.addArticle(article);
            showAlert('Article ajouté', 'success');
        }
        bootstrap.Modal.getInstance(document.getElementById('modal-article')).hide();
        await loadAllData();
    } catch (e) {
        console.error(e);
        showAlert('Erreur lors de la sauvegarde', 'error');
    }
    showLoader(false);
}

async function editArticle(id) {
    const article = App.stock.find(a => a.ID === id);
    if (!article) return;
    populateCategoriesSelect();
    document.getElementById('article-id').value = article.ID;
    document.getElementById('article-nom').value = article.NOM || '';
    document.getElementById('article-reference').value = article.REFERENCE || '';
    document.getElementById('article-categorie').value = article.CATEGORIE || '';
    document.getElementById('article-quantite').value = article.QUANTITE || '';
    document.getElementById('article-prix').value = article.PRIX_JOUR || '';
    document.getElementById('article-etat').value = article.ETAT || '';
    document.getElementById('article-description').value = article.DESCRIPTION || '';
    openModal('modal-article');
}

async function deleteArticle(id) {
    if (!confirm('Supprimer cet article ?')) return;
    showLoader(true);
    try {
        await Sheets.deleteArticle(id);
        showAlert('Article supprimé', 'success');
        await loadAllData();
    } catch (e) {
        showAlert('Erreur lors de la suppression', 'error');
    }
    showLoader(false);
}

// ============================================
// DEVIS
// ============================================

function renderDevis(search = '') {
    const tbody = document.getElementById('devis-tbody');
    if (!tbody) return;

    let items = App.devis;
    if (search) {
        const s = search.toLowerCase();
        items = items.filter(d =>
            (d.NUMERO || '').toLowerCase().includes(s) ||
            (d.CLIENT || '').toLowerCase().includes(s)
        );
    }

    tbody.innerHTML = items.length === 0
        ? '<tr><td colspan="7" class="text-center text-muted">Aucun devis trouvé</td></tr>'
        : items.map(d => `
            <tr>
                <td>${d.NUMERO || ''}</td>
                <td>${d.CLIENT || ''}</td>
                <td>${formatDate(d.DATE_EVENEMENT)}</td>
                <td>${formatCurrency(d.TOTAL_HT)}</td>
                <td>${formatCurrency(d.TOTAL_TTC)}</td>
                <td><span class="badge ${getStatusClass(d.STATUT)}">${d.STATUT || ''}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="editDevis('${d.ID}')">✏️</button>
                    <button class="btn btn-sm btn-outline-success me-1" onclick="generatePDF('${d.ID}')">📄</button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteDevis('${d.ID}')">🗑️</button>
                </td>
            </tr>
        `).join('');
}

function openAddDevis() {
    document.getElementById('form-devis').reset();
    document.getElementById('devis-id').value = '';
    document.getElementById('devis-numero').value = generateNumeroDevis();
    App.currentDevisLignes = [];
    renderLignesDevis();
    openModal('modal-devis');
}

async function editDevis(id) {
    const devis = App.devis.find(d => d.ID === id);
    if (!devis) return;
    document.getElementById('devis-id').value = devis.ID;
    document.getElementById('devis-numero').value = devis.NUMERO || '';
    document.getElementById('devis-client').value = devis.CLIENT || '';
    document.getElementById('devis-date-evenement').value = devis.DATE_EVENEMENT || '';
    document.getElementById('devis-lieu').value = devis.LIEU || '';
    document.getElementById('devis-statut').value = devis.STATUT || 'En cours';
    document.getElementById('devis-notes').value = devis.NOTES || '';
    App.currentDevisLignes = App.lignesDevis.filter(l => l.DEVIS_ID === id);
    renderLignesDevis();
    openModal('modal-devis');
}

function renderLignesDevis() {
    const tbody = document.getElementById('lignes-devis-tbody');
    if (!tbody) return;
    tbody.innerHTML = App.currentDevisLignes.map((l, i) => `
        <tr>
            <td>${l.NOM || ''}</td>
            <td>${l.QUANTITE || 0}</td>
            <td>${l.JOURS || 1}</td>
            <td>${formatCurrency(l.PRIX_UNITAIRE)}</td>
            <td>${formatCurrency((l.QUANTITE || 0) * (l.JOURS || 1) * (l.PRIX_UNITAIRE || 0))}</td>
            <td><button class="btn btn-sm btn-outline-danger" onclick="removeLigne(${i})">🗑️</button></td>
        </tr>
    `).join('');
    updateTotauxDevis();
}

function removeLigne(index) {
    App.currentDevisLignes.splice(index, 1);
    renderLignesDevis();
}

function updateTotauxDevis() {
    const totalHT = App.currentDevisLignes.reduce((sum, l) =>
        sum + (l.QUANTITE || 0) * (l.JOURS || 1) * (l.PRIX_UNITAIRE || 0), 0);
    const tva = totalHT * 0.20;
    const totalTTC = totalHT + tva;
    const el = id => document.getElementById(id);
    if (el('devis-total-ht')) el('devis-total-ht').textContent = formatCurrency(totalHT);
    if (el('devis-tva')) el('devis-tva').textContent = formatCurrency(tva);
    if (el('devis-total-ttc')) el('devis-total-ttc').textContent = formatCurrency(totalTTC);
}

function openAddLigne() {
    populateStockSelect();
    openModal('modal-ligne');
}

function populateStockSelect() {
    const select = document.getElementById('ligne-article');
    if (!select) return;
    select.innerHTML = '<option value="">-- Choisir un article --</option>' +
        App.stock.map(a => `<option value="${a.ID}" data-prix="${a.PRIX_JOUR}" data-nom="${a.NOM}">${a.NOM} (${formatCurrency(a.PRIX_JOUR)}/j)</option>`).join('');
}

function addLigne() {
    const select = document.getElementById('ligne-article');
    const option = select.options[select.selectedIndex];
    if (!option || !option.value) { showAlert('Choisir un article', 'warning'); return; }

    const ligne = {
        ID: generateId('LIG'),
        NOM: option.dataset.nom,
        ARTICLE_ID: option.value,
        QUANTITE: parseInt(document.getElementById('ligne-quantite').value) || 1,
        JOURS: parseInt(document.getElementById('ligne-jours').value) || 1,
        PRIX_UNITAIRE: parseFloat(option.dataset.prix) || 0
    };
    App.currentDevisLignes.push(ligne);
    renderLignesDevis();
    bootstrap.Modal.getInstance(document.getElementById('modal-ligne')).hide();
}

async function saveDevis() {
    const id = document.getElementById('devis-id').value;
    const totalHT = App.currentDevisLignes.reduce((sum, l) =>
        sum + (l.QUANTITE || 0) * (l.JOURS || 1) * (l.PRIX_UNITAIRE || 0), 0);

    const devis = {
        NUMERO: document.getElementById('devis-numero').value,
        CLIENT: document.getElementById('devis-client').value,
        DATE_EVENEMENT: document.getElementById('devis-date-evenement').value,
        LIEU: document.getElementById('devis-lieu').value,
        STATUT: document.getElementById('devis-statut').value,
        NOTES: document.getElementById('devis-notes').value,
        TOTAL_HT: totalHT,
        TVA: totalHT * 0.20,
        TOTAL_TTC: totalHT * 1.20,
        DATE_CREATION: new Date().toISOString()
    };

    if (!devis.CLIENT) { showAlert('Le client est obligatoire', 'warning'); return; }

    showLoader(true);
    try {
        if (id) {
            devis.ID = id;
            await Sheets.updateDevis(devis, App.currentDevisLignes);
            showAlert('Devis modifié', 'success');
        } else {
            devis.ID = generateId('DEV');
            await Sheets.addDevis(devis, App.currentDevisLignes);
            showAlert('Devis créé', 'success');
        }
        bootstrap.Modal.getInstance(document.getElementById('modal-devis')).hide();
        await loadAllData();
    } catch (e) {
        console.error(e);
        showAlert('Erreur lors de la sauvegarde', 'error');
    }
    showLoader(false);
}

async function deleteDevis(id) {
    if (!confirm('Supprimer ce devis ?')) return;
    showLoader(true);
    try {
        await Sheets.deleteDevis(id);
        showAlert('Devis supprimé', 'success');
        await loadAllData();
    } catch (e) {
        showAlert('Erreur lors de la suppression', 'error');
    }
    showLoader(false);
}

function generatePDF(id) {
    const devis = App.devis.find(d => d.ID === id);
    if (!devis) return;
    const lignes = App.lignesDevis.filter(l => l.DEVIS_ID === id);
    if (typeof PDF !== 'undefined') {
        PDF.generateDevis(devis, lignes);
    } else {
        showAlert('Module PDF non disponible', 'error');
    }
}

// ============================================
// INITIALISATION
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    showSection('dashboard');
    await loadAllData();
});
