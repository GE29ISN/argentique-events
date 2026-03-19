// ============================================
// ARGENTIQUE EVENTS - APPLICATION PRINCIPALE
// ============================================

// État global
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
        // SON
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
        // LUMIERE
        { ID: 'cat_011', NOM: 'Câblage lumière', FAMILLE: 'LUMIERE' },
        { ID: 'cat_012', NOM: 'Source LED', FAMILLE: 'LUMIERE' },
        { ID: 'cat_013', NOM: 'Source traditionnel', FAMILLE: 'LUMIERE' },
        { ID: 'cat_014', NOM: 'Accessoires LED', FAMILLE: 'LUMIERE' },
        { ID: 'cat_015', NOM: 'Accessoires traditionnel', FAMILLE: 'LUMIERE' },
        { ID: 'cat_016', NOM: 'Console lumière', FAMILLE: 'LUMIERE' },
        { ID: 'cat_017', NOM: 'Périphérique lumière', FAMILLE: 'LUMIERE' },
        { ID: 'cat_018', NOM: 'Fumée', FAMILLE: 'LUMIERE' },
        // VIDEO
        { ID: 'cat_019', NOM: 'Câblage vidéo', FAMILLE: 'VIDEO' },
        { ID: 'cat_020', NOM: 'Vidéo-projection', FAMILLE: 'VIDEO' },
        // STRUCTURE
        { ID: 'cat_021', NOM: 'Poutre carrée', FAMILLE: 'STRUCTURE' },
        { ID: 'cat_022', NOM: 'Poutre triangle', FAMILLE: 'STRUCTURE' },
        { ID: 'cat_023', NOM: 'Accroche', FAMILLE: 'STRUCTURE' },
        { ID: 'cat_024', NOM: 'Pied', FAMILLE: 'STRUCTURE' },
        { ID: 'cat_025', NOM: 'Praticable', FAMILLE: 'STRUCTURE' },
        // TRANSPORT
        { ID: 'cat_026', NOM: 'Flight case', FAMILLE: 'TRANSPORT' },
        { ID: 'cat_027', NOM: 'Sac', FAMILLE: 'TRANSPORT' },
        // DIVERS
        { ID: 'cat_028', NOM: 'Consommable', FAMILLE: 'DIVERS' },
        { ID: 'cat_029', NOM: 'Outillage', FAMILLE: 'DIVERS' },
        { ID: 'cat_030', NOM: 'Divers', FAMILLE: 'DIVERS' }
    ]
};

// ============================================
// INITIALISATION
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Argentique Events - Démarrage...');
    
    // Vérifier la config Google Sheets
    if (!CONFIG.SPREADSHEET_ID || CONFIG.SPREADSHEET_ID === 'VOTRE_SPREADSHEET_ID') {
        showAlert('⚠️ Veuillez configurer votre Google Sheets dans config.js', 'warning');
    }

    // Charger les données
    await loadAllData();

    // Initialiser la navigation
    initNavigation();

    // Afficher le dashboard par défaut
    showSection('dashboard');

    // Mettre à jour l'affichage du nom d'utilisateur
    updateUsernameDisplay();

    console.log('✅ Application chargée');
});

// ============================================
// CHARGEMENT DES DONNÉES
// ============================================

async function loadAllData() {
    showLoader(true);
    try {
        const [stock, devis, lignesDevis, categories, logs] = await Promise.all([
            Sheets.getStock(),
            Sheets.getDevis(),
            Sheets.getLignesDevis(),
            Sheets.getCategories(),
            Sheets.getLogs()
        ]);

        App.stock = stock || [];
        App.devis = devis || [];
        App.lignesDevis = lignesDevis || [];
        App.logs = logs || [];

        // Utiliser les catégories du sheet ou les défauts
        App.categories = (categories && categories.length > 0) 
            ? categories 
            : App.defaultCategories;

        updateDashboard();
        renderStock();
        renderDevis();
        renderCategories();
        renderLogs();

    } catch (error) {
        console.error('Erreur chargement données:', error);
        showAlert('Erreur lors du chargement des données', 'error');
        // Utiliser les catégories par défaut en cas d'erreur
        App.categories = App.defaultCategories;
    }
    showLoader(false);
}

// ============================================
// NAVIGATION
// ============================================

function initNavigation() {
    document.querySelectorAll('[data-section]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.getAttribute('data-section');
            showSection(section);
        });
    });
}

function showSection(sectionName) {
    // Cacher toutes les sections
    document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
    
    // Afficher la section demandée
    const target = document.getElementById(`section-${sectionName}`);
    if (target) target.classList.remove('hidden');

    // Mettre à jour la navigation active
    document.querySelectorAll('[data-section]').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-section') === sectionName) {
            link.classList.add('active');
        }
    });

    // Rafraîchir selon la section
    if (sectionName === 'dashboard') updateDashboard();
    if (sectionName === 'stock') renderStock();
    if (sectionName === 'devis') renderDevis();
    if (sectionName === 'logs') renderLogs();
    if (sectionName === 'parametres') renderParametres();
}

// ============================================
// DASHBOARD
// ============================================

function updateDashboard() {
    // Total articles en stock
    const totalArticles = App.stock.length;
    const el1 = document.getElementById('stat-total-articles');
    if (el1) el1.textContent = totalArticles;

    // Devis en cours
    const devisEnCours = App.devis.filter(d => d.STATUT === 'En cours' || d.STATUT === 'Envoyé').length;
    const el2 = document.getElementById('stat-devis-en-cours');
    if (el2) el2.textContent = devisEnCours;

    // Valeur du stock
    const valeurStock = App.stock.reduce((sum, item) => {
        return sum + (parseFloat(item.VALEUR || 0) * parseFloat(item.QUANTITE || 0));
    }, 0);
    const el3 = document.getElementById('stat-valeur-stock');
    if (el3) el3.textContent = formatCurrency(valeurStock);

    // Alertes stock faible
    const alertes = App.stock.filter(item => {
        return parseFloat(item.QUANTITE || 0) <= parseFloat(item.QUANTITE_MIN || 0);
    }).length;
    const el4 = document.getElementById('stat-alertes');
    if (el4) el4.textContent = alertes;
}

// ============================================
// STOCK
// ============================================

function renderStock(filter = '') {
    const container = document.getElementById('stock-table-body');
    if (!container) return;

    let items = App.stock;

    // Filtrer
    if (filter) {
        const f = filter.toLowerCase();
        items = items.filter(item => 
            (item.NOM || '').toLowerCase().includes(f) ||
            (item.REFERENCE || '').toLowerCase().includes(f) ||
            (item.CATEGORIE || '').toLowerCase().includes(f)
        );
    }

    if (items.length === 0) {
        container.innerHTML = '<tr><td colspan="8" class="text-center text-muted">Aucun article trouvé</td></tr>';
        return;
    }

    container.innerHTML = items.map(item => {
        const qte = parseFloat(item.QUANTITE || 0);
        const qteMin = parseFloat(item.QUANTITE_MIN || 0);
        const alertClass = qte <= qteMin ? 'text-danger fw-bold' : '';
        
        return `
        <tr>
            <td>${item.REFERENCE || ''}</td>
            <td>${item.NOM || ''}</td>
            <td>${item.CATEGORIE || ''}</td>
            <td class="${alertClass}">${qte}</td>
            <td>${qteMin}</td>
            <td>${item.EMPLACEMENT || ''}</td>
            <td>${formatCurrency(item.VALEUR || 0)}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="editStock('${item.ID}')">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteStock('${item.ID}')">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>`;
    }).join('');
}

function openAddStockModal() {
    document.getElementById('stockForm').reset();
    document.getElementById('stockId').value = '';
    document.getElementById('stockModalTitle').textContent = 'Ajouter un article';
    populateCategoriesSelect('stockCategorie');
    const modal = new bootstrap.Modal(document.getElementById('stockModal'));
    modal.show();
}

function editStock(id) {
    const item = App.stock.find(s => s.ID === id);
    if (!item) return;

    document.getElementById('stockId').value = item.ID;
    document.getElementById('stockNom').value = item.NOM || '';
    document.getElementById('stockReference').value = item.REFERENCE || '';
    document.getElementById('stockCategorie').value = item.CATEGORIE || '';
    document.getElementById('stockQuantite').value = item.QUANTITE || 0;
    document.getElementById('stockQuantiteMin').value = item.QUANTITE_MIN || 0;
    document.getElementById('stockEmplacement').value = item.EMPLACEMENT || '';
    document.getElementById('stockValeur').value = item.VALEUR || 0;
    document.getElementById('stockNotes').value = item.NOTES || '';
    document.getElementById('stockModalTitle').textContent = 'Modifier un article';
    
    populateCategoriesSelect('stockCategorie', item.CATEGORIE);
    const modal = new bootstrap.Modal(document.getElementById('stockModal'));
    modal.show();
}

async function saveStock() {
    const id = document.getElementById('stockId').value;
    const data = {
        NOM: document.getElementById('stockNom').value,
        REFERENCE: document.getElementById('stockReference').value,
        CATEGORIE: document.getElementById('stockCategorie').value,
        QUANTITE: document.getElementById('stockQuantite').value,
        QUANTITE_MIN: document.getElementById('stockQuantiteMin').value,
        EMPLACEMENT: document.getElementById('stockEmplacement').value,
        VALEUR: document.getElementById('stockValeur').value,
        NOTES: document.getElementById('stockNotes').value
    };

    if (!data.NOM) {
        showAlert('Le nom est obligatoire', 'error');
        return;
    }

    showLoader(true);
    try {
        if (id) {
            // Modification
            data.ID = id;
            await Sheets.updateStock(data);
            const idx = App.stock.findIndex(s => s.ID === id);
            if (idx !== -1) App.stock[idx] = { ...App.stock[idx], ...data };
            await addLog('STOCK', 'Modification', `Article modifié : ${data.NOM}`);
        } else {
            // Création
            data.ID = generateId('STK');
            data.DATE_CREATION = new Date().toISOString();
            await Sheets.addStock(data);
            App.stock.push(data);
            await addLog('STOCK', 'Création', `Article créé : ${data.NOM}`);
        }

        renderStock();
        updateDashboard();
        bootstrap.Modal.getInstance(document.getElementById('stockModal')).hide();
        showAlert('Article sauvegardé avec succès', 'success');
    } catch (error) {
        console.error('Erreur saveStock:', error);
        showAlert('Erreur lors de la sauvegarde', 'error');
    }
    showLoader(false);
}

async function deleteStock(id) {
    const item = App.stock.find(s => s.ID === id);
    if (!item) return;

    if (!confirm(`Supprimer "${item.NOM}" ?`)) return;

    showLoader(true);
    try {
        await Sheets.deleteStock(id);
        App.stock = App.stock.filter(s => s.ID !== id);
        await addLog('STOCK', 'Suppression', `Article supprimé : ${item.NOM}`);
        renderStock();
        updateDashboard();
        showAlert('Article supprimé', 'success');
    } catch (error) {
        console.error('Erreur deleteStock:', error);
        showAlert('Erreur lors de la suppression', 'error');
    }
    showLoader(false);
}

// ============================================
// DEVIS
// ============================================

function renderDevis(filter = '') {
    const container = document.getElementById('devis-table-body');
    if (!container) return;

    let items = App.devis;

    if (filter) {
        const f = filter.toLowerCase();
        items = items.filter(d =>
            (d.NUMERO || '').toLowerCase().includes(f) ||
            (d.CLIENT || '').toLowerCase().includes(f) ||
            (d.STATUT || '').toLowerCase().includes(f)
        );
    }

    if (items.length === 0) {
        container.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Aucun devis trouvé</td></tr>';
        return;
    }

    container.innerHTML = items.map(devis => {
        const lignes = App.lignesDevis.filter(l => l.DEVIS_ID === devis.ID);
        const total = lignes.reduce((sum, l) => sum + (parseFloat(l.PRIX_TOTAL || 0)), 0);
        const statusClass = getStatusClass(devis.STATUT);

        return `
        <tr>
            <td>${devis.NUMERO || ''}</td>
            <td>${devis.CLIENT || ''}</td>
            <td>${formatDate(devis.DATE_EVENEMENT)}</td>
            <td>${formatDate(devis.DATE_CREATION)}</td>
            <td><span class="badge ${statusClass}">${devis.STATUT || ''}</span></td>
            <td>${formatCurrency(total)}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="openDevis('${devis.ID}')">
                    <i class="bi bi-eye"></i>
                </button>
                <button class="btn btn-sm btn-outline-success me-1" onclick="exportDevisPDF('${devis.ID}')">
                    <i class="bi bi-file-pdf"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteDevis('${devis.ID}')">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>`;
    }).join('');
}

function openNewDevis() {
    App.currentDevis = {
        ID: generateId('DEV'),
        NUMERO: generateNumeroDevis(),
        DATE_CREATION: new Date().toISOString(),
        STATUT: 'En cours'
    };
    App.currentDevisLignes = [];

    document.getElementById('devisNumero').textContent = App.currentDevis.NUMERO;
    document.getElementById('devisClient').value = '';
    document.getElementById('devisDateEvenement').value = '';
    document.getElementById('devisLieu').value = '';
    document.getElementById('devisNotes').value = '';
    document.getElementById('devisStatut').value = 'En cours';

    renderDevisLignes();
    
    const modal = new bootstrap.Modal(document.getElementById('devisModal'));
    modal.show();
}

function openDevis(id) {
    const devis = App.devis.find(d => d.ID === id);
    if (!devis) return;

    App.currentDevis = { ...devis };
    App.currentDevisLignes = App.lignesDevis.filter(l => l.DEVIS_ID === id).map(l => ({ ...l }));

    document.getElementById('devisNumero').textContent = devis.NUMERO || '';
    document.getElementById('devisClient').value = devis.CLIENT || '';
    document.getElementById('devisDateEvenement').value = devis.DATE_EVENEMENT ? devis.DATE_EVENEMENT.split('T')[0] : '';
    document.getElementById('devisLieu').value = devis.LIEU || '';
    document.getElementById('devisNotes').value = devis.NOTES || '';
    document.getElementById('devisStatut').value = devis.STATUT || 'En cours';

    renderDevisLignes();

    const modal = new bootstrap.Modal(document.getElementById('devisModal'));
    modal.show();
}

function renderDevisLignes() {
    const container = document.getElementById('devis-lignes-body');
    if (!container) return;

    if (App.currentDevisLignes.length === 0) {
        container.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Aucune ligne - cliquez sur "Ajouter une ligne"</td></tr>';
    } else {
        container.innerHTML = App.currentDevisLignes.map((ligne, idx) => `
        <tr>
            <td>${ligne.REFERENCE || ''}</td>
            <td>${ligne.DESIGNATION || ''}</td>
            <td>${ligne.QUANTITE || 0}</td>
            <td>${formatCurrency(ligne.PRIX_UNITAIRE || 0)}</td>
            <td>${formatCurrency(ligne.PRIX_TOTAL || 0)}</td>
            <td>
                <button class="btn btn-sm btn-outline-danger" onclick="removeDevisLigne(${idx})">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>`).join('');
    }

    // Mettre à jour le total
    const total = App.currentDevisLignes.reduce((sum, l) => sum + parseFloat(l.PRIX_TOTAL || 0), 0);
    const totalEl = document.getElementById('devis-total');
    if (totalEl) totalEl.textContent = formatCurrency(total);
}

function openAddLigneDevis() {
    document.getElementById('ligneDevisForm').reset();
    populateStockSelect();
    const modal = new bootstrap.Modal(document.getElementById('ligneDevisModal'));
    modal.show();
}

function populateStockSelect() {
    const select = document.getElementById('ligneReference');
    if (!select) return;

    select.innerHTML = '<option value="">-- Choisir dans le stock --</option>' +
        App.stock.map(item => 
            `<option value="${item.REFERENCE}" data-nom="${item.NOM}" data-valeur="${item.VALEUR || 0}">
                ${item.REFERENCE} - ${item.NOM}
            </option>`
        ).join('');

    select.addEventListener('change', function() {
        const option = this.options[this.selectedIndex];
        if (option.value) {
            document.getElementById('ligneDesignation').value = option.getAttribute('data-nom') || '';
            document.getElementById('lignePrixUnitaire').value = option.getAttribute('data-valeur') || 0;
            calculateLignTotal();
        }
    });
}

function calculateLignTotal() {
    const qte = parseFloat(document.getElementById('ligneQuantite').value || 0);
    const prix = parseFloat(document.getElementById('lignePrixUnitaire').value || 0);
    const total = qte * prix;
    const el = document.getElementById('lignePrixTotal');
    if (el) el.value = total.toFixed(2);
}

function addLigneDevis() {
    const ligne = {
        ID: generateId('LIG'),
        DEVIS_ID: App.currentDevis.ID,
        REFERENCE: document.getElementById('ligneReference').value,
        DESIGNATION: document.getElementById('ligneDesignation').value,
        QUANTITE: parseFloat(document.getElementById('ligneQuantite').value || 0),
        PRIX_UNITAIRE: parseFloat(document.getElementById('lignePrixUnitaire').value || 0),
        PRIX_TOTAL: parseFloat(document.getElementById('lignePrixTotal').value || 0)
    };

    if (!ligne.DESIGNATION) {
        showAlert('La désignation est obligatoire', 'error');
        return;
    }

    App.currentDevisLignes.push(ligne);
    renderDevisLignes();
    bootstrap.Modal.getInstance(document.getElementById('ligneDevisModal')).hide();
}

function removeDevisLigne(idx) {
    App.currentDevisLignes.splice(idx, 1);
    renderDevisLignes();
}

async function saveDevis() {
    const devis = App.currentDevis;
    if (!devis) return;

    devis.CLIENT = document.getElementById('devisClient').value;
    devis.DATE_EVENEMENT = document.getElementById('devisDateEvenement').value;
    devis.LIEU = document.getElementById('devisLieu').value;
    devis.NOTES = document.getElementById('devisNotes').value;
    devis.STATUT = document.getElementById('devisStatut').value;

    if (!devis.CLIENT) {
        showAlert('Le nom du client est obligatoire', 'error');
        return;
    }

    showLoader(true);
    try {
        const exists = App.devis.find(d => d.ID === devis.ID);

        if (exists) {
            await Sheets.updateDevis(devis);
            const idx = App.devis.findIndex(d => d.ID === devis.ID);
            if (idx !== -1) App.devis[idx] = { ...devis };

            // Supprimer les anciennes lignes et réinsérer
            await Sheets.deleteLignesDevis(devis.ID);
            for (const ligne of App.currentDevisLignes) {
                await Sheets.addLigneDevis(ligne);
            }
            App.lignesDevis = App.lignesDevis.filter(l => l.DEVIS_ID !== devis.ID);
            App.lignesDevis.push(...App.currentDevisLignes);

            await addLog('DEVIS', 'Modification', `Devis modifié : ${devis.NUMERO} - ${devis.CLIENT}`);
        } else {
            await Sheets.addDevis(devis);
            App.devis.push({ ...devis });

            for (const ligne of App.currentDevisLignes) {
                await Sheets.addLigneDevis(ligne);
            }
            App.lignesDevis.push(...App.currentDevisLignes);

            await addLog('DEVIS', 'Création', `Devis créé : ${devis.NUMERO} - ${devis.CLIENT}`);
        }

        renderDevis();
        bootstrap.Modal.getInstance(document.getElementById('devisModal')).hide();
        showAlert('Devis sauvegardé avec succès', 'success');
    } catch (error) {
        console.error('Erreur saveDevis:', error);
        showAlert('Erreur lors de la sauvegarde du devis', 'error');
    }
    showLoader(false);
}

async function deleteDevis(id) {
    const devis = App.devis.find(d => d.ID === id);
    if (!devis) return;

    if (!confirm(`Supprimer le devis ${devis.NUMERO} ?`)) return;

    showLoader(true);
    try {
        await Sheets.deleteDevis(id);
        await Sheets.deleteLignesDevis(id);
        App.devis = App.devis.filter(d => d.ID !== id);
        App.lignesDevis = App.lignesDevis.filter(l => l.DEVIS_ID !== id);
        await addLog('DEVIS', 'Suppression', `Devis supprimé : ${devis.NUMERO}`);
        renderDevis();
        showAlert('Devis supprimé', 'success');
    } catch (error) {
        console.error('Erreur deleteDevis:', error);
        showAlert('Erreur lors de la suppression', 'error');
    }
    showLoader(false);
}

function exportDevisPDF(id) {
    const devis = App.devis.find(d => d.ID === id);
    if (!devis) return;
    const lignes = App.lignesDevis.filter(l => l.DEVIS_ID === id);
    generateDevisPDF(devis, lignes);
}

// ============================================
// CATEGORIES
// ============================================

function renderCategories() {
    const container = document.getElementById('categories-list');
    if (!container) return;

    const familles = [...new Set(App.categories.map(c => c.FAMILLE))];

    container.innerHTML = familles.map(famille => `
        <div class="mb-4">
            <h5 class="text-primary">${famille}</h5>
            <div class="list-group">
                ${App.categories
                    .filter(c => c.FAMILLE === famille)
                    .map(cat => `
                        <div class="list-group-item d-flex justify-content-between align-items-center">
                            <span>${cat.NOM}</span>
                            <div>
                                <button class="btn btn-sm btn-outline-danger" onclick="deleteCategorie('${cat.ID}')">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </div>
                        </div>
                    `).join('')}
            </div>
        </div>
    `).join('');
}

function openAddCategorieModal() {
    document.getElementById('categorieForm').reset();
    const modal = new bootstrap.Modal(document.getElementById('categorieModal'));
    modal.show();
}

async function saveCategorie() {
    const nom = document.getElementById('categorieNom').value;
    const famille = document.getElementById('categorieFamille').value;

    if (!nom || !famille) {
        showAlert('Nom et famille sont obligatoires', 'error');
        return;
    }

    const cat = {
        ID: generateId('CAT'),
        NOM: nom,
        FAMILLE: famille.toUpperCase()
    };

    showLoader(true);
    try {
        await Sheets.addCategorie(cat);
        App.categories.push(cat);
        renderCategories();
        populateCategoriesSelect('stockCategorie');
        bootstrap.Modal.getInstance(document.getElementById('categorieModal')).hide();
        showAlert('Catégorie ajoutée', 'success');
    } catch (error) {
        console.error('Erreur saveCategorie:', error);
        showAlert('Erreur lors de la sauvegarde', 'error');
    }
    showLoader(false);
}

async function deleteCategorie(id) {
    const cat = App.categories.find(c => c.ID === id);
    if (!cat) return;
    if (!confirm(`Supprimer la catégorie "${cat.NOM}" ?`)) return;

    showLoader(true);
    try {
        await Sheets.deleteCategorie(id);
        App.categories = App.categories.filter(c => c.ID !== id);
        renderCategories();
        showAlert('Catégorie supprimée', 'success');
    } catch (error) {
        console.error('Erreur deleteCategorie:', error);
        showAlert('Erreur lors de la suppression', 'error');
    }
    showLoader(false);
}

function populateCategoriesSelect(selectId, selectedValue = '') {
    const select = document.getElementById(selectId);
    if (!select) return;

    select.innerHTML = '<option value="">-- Choisir une catégorie --</option>' +
        App.categories.map(cat =>
            `<option value="${cat.NOM}" ${cat.NOM === selectedValue ? 'selected' : ''}>${cat.FAMILLE} - ${cat.NOM}</option>`
        ).join('');
}

// ============================================
// LOGS
// ============================================

async function addLog(module, action, details) {
    const log = {
        ID: generateId('LOG'),
        DATE: new Date().toISOString(),
        UTILISATEUR: App.username,
        MODULE: module,
        ACTION: action,
        DETAILS: details
    };

    try {
        await Sheets.addLog(log);
        App.logs.unshift(log);
        if (App.logs.length > 200) App.logs = App.logs.slice(0, 200);
    } catch (error) {
        console.error('Erreur addLog:', error);
    }
}

function renderLogs() {
    const container = document.getElementById('logs-table-body');
    if (!container) return;

    if (App.logs.length === 0) {
        container.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Aucune activité enregistrée</td></tr>';
        return;
    }

    container.innerHTML = App.logs.slice(0, 100).map(log => `
        <tr>
            <td>${formatDateTime(log.DATE)}</td>
            <td>${log.UTILISATEUR || ''}</td>
            <td><span class="badge bg-secondary">${log.MODULE || ''}</span></td>
            <td>${log.ACTION || ''}</td>
            <td>${log.DETAILS || ''}</td>
        </tr>
    `).join('');
}

// ============================================
// PARAMÈTRES
// ============================================

function renderParametres() {
    const el = document.getElementById('param-username');
    if (el) el.value = App.username;
}

function saveParametres() {
    const username = document.getElementById('param-username').value;
    if (username) {
        App.username = username;
        localStorage.setItem('username', username);
        updateUsernameDisplay();
        showAlert('Paramètres sauvegardés', 'success');
    }
}

function updateUsernameDisplay() {
    const el = document.getElementById('username-display');
    if (el) el.textContent = App.username;
}

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
