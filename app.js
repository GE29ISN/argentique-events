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

    // Catégories par défaut
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
        {
