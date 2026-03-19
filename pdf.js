// ============================================================
// pdf.js - L'Argentique Events
// Export PDF : Devis & Factures
// Dépendances : jsPDF + jsPDF-AutoTable (chargés dans index.html)
// ============================================================

// ─── Couleurs & config ────────────────────────────────────────
const PDF_COLORS = {
  primary:   [30,  30,  30],   // noir profond
  accent:    [180, 140, 80],   // or/argentique
  light:     [245, 245, 245],  // gris très clair
  white:     [255, 255, 255],
  gray:      [120, 120, 120],
  darkgray:  [60,  60,  60],
};

// ─── Helpers ──────────────────────────────────────────────────

function formatDateFR(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('fr-FR');
}

function formatEuro(val) {
  const n = parseFloat(val) || 0;
  return n.toFixed(2).replace('.', ',') + ' €';
}

function getNumeroDocument(devis) {
  return devis.NUMERO || 'BROUILLON';
}

// ─── En-tête société ──────────────────────────────────────────

function drawHeader(doc, devis) {
  const pageW = doc.internal.pageSize.getWidth();

  // Bande noire en haut
  doc.setFillColor(...PDF_COLORS.primary);
  doc.rect(0, 0, pageW, 38, 'F');

  // Bande dorée fine
  doc.setFillColor(...PDF_COLORS.accent);
  doc.rect(0, 38, pageW, 3, 'F');

  // Logo texte
  doc.setTextColor(...PDF_COLORS.white);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text("L'Argentique Events", 14, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...PDF_COLORS.accent);
  doc.text('Son  •  Lumière  •  Vidéo  •  Structure', 14, 23);

  // Coordonnées société (droite)
  doc.setTextColor(...PDF_COLORS.white);
  doc.setFontSize(7.5);
  const societyLines = [
    'contact@largentique-events.fr',
    'www.largentique-events.fr',
  ];
  societyLines.forEach((line, i) => {
    doc.text(line, pageW - 14, 14 + i * 6, { align: 'right' });
  });

  // Type de document
  const typeLabel = (devis.TYPE || 'DEVIS').toUpperCase();
  doc.setFillColor(...PDF_COLORS.accent);
  doc.roundedRect(pageW - 70, 42, 56, 16, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...PDF_COLORS.white);
  doc.text(typeLabel, pageW - 42, 53, { align: 'center' });

  // Numéro document
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...PDF_COLORS.darkgray);
  doc.text('N° ' + getNumeroDocument(devis), 14, 52);
  doc.text('Date : ' + formatDateFR(devis.DATE_CREATION), 14, 59);

  return 68; // Y après header
}

// ─── Bloc client + infos location ─────────────────────────────

function drawClientBlock(doc, devis, startY) {
  const pageW = doc.internal.pageSize.getWidth();

  // Bloc client
  doc.setFillColor(...PDF_COLORS.light);
  doc.roundedRect(14, startY, 90, 44, 3, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...PDF_COLORS.accent[0], ...PDF_COLORS.accent.slice(1));
  doc.setTextColor(180, 140, 80);
  doc.text('CLIENT', 18, startY + 8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...PDF_COLORS.primary);

  const nomClient = [devis.CLIENT_PRENOM, devis.CLIENT_NOM].filter(Boolean).join(' ')
    || devis.CLIENT_ENTREPRISE || 'Client inconnu';
  doc.text(nomClient, 18, startY + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...PDF_COLORS.darkgray);

  if (devis.CLIENT_ENTREPRISE && (devis.CLIENT_NOM || devis.CLIENT_PRENOM)) {
    doc.text(devis.CLIENT_ENTREPRISE, 18, startY + 23);
  }
  if (devis.CLIENT_ADRESSE) {
    const addrLines = doc.splitTextToSize(devis.CLIENT_ADRESSE, 80);
    addrLines.forEach((line, i) => {
      doc.text(line, 18, startY + 30 + i * 5);
    });
  }

  // Bloc infos location
  doc.setFillColor(...PDF_COLORS.primary);
  doc.roundedRect(110, startY, 85, 44, 3, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...PDF_COLORS.accent);
  doc.text('INFORMATIONS LOCATION', 114, startY + 8);

  const infoLines = [
    ['Départ :', formatDateFR(devis.DATE_DEBUT)],
    ['Retour :',  formatDateFR(devis.DATE_FIN)],
    ['Durée :',   (devis.NB_JOURS || '-') + ' jour(s)'],
    ['Coefficient :', 'x' + (devis.COEFFICIENT || 1)],
  ];

  doc.setFontSize(8);
  infoLines.forEach(([label, val], i) => {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...PDF_COLORS.gray);
    doc.text(label, 114, startY + 17 + i * 7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_COLORS.white);
    doc.text(val, 175, startY + 17 + i * 7, { align: 'right' });
  });

  return startY + 52;
}

// ─── Tableau des lignes ────────────────────────────────────────

function drawLignesTable(doc, lignes, startY) {
  if (!lignes || lignes.length === 0) return startY + 10;

  // Grouper par catégorie
  const groups = {};
  lignes.forEach(l => {
    const cat = l.CATEGORIE || l.FAMILLE || 'Divers';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(l);
  });

  const body = [];
  Object.entries(groups).forEach(([cat, items]) => {
    // Ligne de catégorie
    body.push([{ content: cat.toUpperCase(), colSpan: 6, styles: {
      fillColor: PDF_COLORS.primary,
      textColor: PDF_COLORS.accent,
      fontStyle: 'bold',
      fontSize: 8,
    }}]);

    items.forEach(item => {
      const offert = String(item.OFFERT).toLowerCase() === 'oui' || item.OFFERT === true;
      const prixU  = parseFloat(item.PRIX_UNITAIRE) || 0;
      const remise = parseFloat(item.REMISE) || 0;
      const qte    = parseFloat(item.QUANTITE) || 0;
      const total  = offert ? 0 : parseFloat(item.TOTAL_LIGNE) || (prixU * qte * (1 - remise / 100));

      body.push([
        item.REF || '',
        item.DESIGNATION || '',
        qte,
        formatEuro(prixU),
        remise > 0 ? remise + '%' : '-',
        offert ? { content: 'OFFERT', styles: { textColor: [80, 160, 80], fontStyle: 'bold' } }
               : formatEuro(total),
      ]);
    });
  });

  doc.autoTable({
    startY,
    margin: { left: 14, right: 14 },
    head: [[
      { content: 'Réf.',        styles: { halign: 'left'   } },
      { content: 'Désignation', styles: { halign: 'left'   } },
      { content: 'Qté',         styles: { halign: 'center' } },
      { content: 'PU HT',       styles: { halign: 'right'  } },
      { content: 'Remise',      styles: { halign: 'center' } },
      { content: 'Total HT',    styles: { halign: 'right'  } },
    ]],
    body,
    theme: 'plain',
    styles: {
      fontSize: 8,
      cellPadding: 3,
      textColor: PDF_COLORS.darkgray,
    },
    headStyles: {
      fillColor: PDF_COLORS.accent,
      textColor: PDF_COLORS.white,
      fontStyle: 'bold',
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [250, 250, 248],
    },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 14, halign: 'center' },
      3: { cellWidth: 26, halign: 'right' },
      4: { cellWidth: 18, halign: 'center' },
      5: { cellWidth: 26, halign: 'right' },
    },
    didDrawPage: (data) => {
      drawFooter(doc);
    },
  });

  return doc.lastAutoTable.finalY + 6;
}

// ─── Bloc totaux ───────────────────────────────────────────────

function drawTotaux(doc, devis, startY) {
  const pageW = doc.internal.pageSize.getWidth();
  const totalHT  = parseFloat(devis.TOTAL_HT) || 0;
  const remise   = parseFloat(devis.REMISE_GLOBALE) || 0;
  const apresRem = totalHT * (1 - remise / 100);
  const tva      = apresRem * 0.20;
  const ttc      = apresRem + tva;

  const rows = [
    ['Total HT',            formatEuro(totalHT)],
  ];
  if (remise > 0) {
    rows.push(['Remise globale (' + remise + '%)', '- ' + formatEuro(totalHT - apresRem)]);
    rows.push(['Sous-total HT', formatEuro(apresRem)]);
  }
  rows.push(['TVA (20%)', formatEuro(tva)]);

  const boxX = pageW - 14 - 80;
  let y = startY + 6;

  doc.setFontSize(8);
  rows.forEach(([label, val]) => {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...PDF_COLORS.gray);
    doc.text(label, boxX, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_COLORS.darkgray);
    doc.text(val, pageW - 14, y, { align: 'right' });
    y += 7;
  });

  // Ligne séparatrice
  doc.setDrawColor(...PDF_COLORS.accent);
  doc.setLineWidth(0.8);
  doc.line(boxX, y, pageW - 14, y);
  y += 5;

  // Total TTC
  doc.setFillColor(...PDF_COLORS.primary);
  doc.roundedRect(boxX - 4, y - 4, pageW - 14 - boxX + 18, 14, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...PDF_COLORS.white);
  doc.text('TOTAL TTC', boxX, y + 6);
  doc.setTextColor(...PDF_COLORS.accent);
  doc.text(formatEuro(ttc), pageW - 14, y + 6, { align: 'right' });

  return y + 20;
}

// ─── Notes & conditions ───────────────────────────────────────

function drawNotes(doc, devis, startY) {
  if (!devis.NOTES) return startY;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.darkgray);
  doc.text('Notes & conditions :', 14, startY);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.gray);
  const lines = doc.splitTextToSize(devis.NOTES, 180);
  doc.text(lines, 14, startY + 6);

  return startY + 6 + lines.length * 5 + 6;
}

// ─── Pied de page ─────────────────────────────────────────────

function drawFooter(doc) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const pageCount = doc.internal.getNumberOfPages ? doc.internal.getNumberOfPages() : 1;

  doc.setFillColor(...PDF_COLORS.accent);
  doc.rect(0, pageH - 10, pageW, 10, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...PDF_COLORS.white);
  doc.text("L'Argentique Events – Document généré automatiquement", 14, pageH - 3.5);
  doc.text('Page ' + doc.internal.getCurrentPageInfo().pageNumber, pageW - 14, pageH - 3.5, { align: 'right' });
}

// ─── Fonction principale : générer le PDF ─────────────────────

function generatePDF(devis, lignes) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  let y = drawHeader(doc, devis);
  y = drawClientBlock(doc, devis, y);
  y = drawLignesTable(doc, lignes, y);
  y = drawTotaux(doc, devis, y);
  y = drawNotes(doc, devis, y);
  drawFooter(doc);

  const typeLabel = (devis.TYPE || 'DEVIS').toLowerCase();
  const num = getNumeroDocument(devis);
  const nom = (devis.CLIENT_NOM || devis.CLIENT_ENTREPRISE || 'client').replace(/\s+/g, '_');
  const filename = `${typeLabel}_${num}_${nom}.pdf`;

  doc.save(filename);
  showToast('PDF généré : ' + filename, 'success');
}

// ─── Fonction appelable depuis les boutons ─────────────────────

function exportDevisPDF(numeroDevis) {
  // Récupère le devis depuis l'état global (défini dans app.js)
  let devis = null;
  let lignes = [];

  if (typeof state !== 'undefined' && state.devis) {
    devis = state.devis.find(d => d.NUMERO === numeroDevis);
  }
  if (typeof state !== 'undefined' && state.lignesDevis) {
    lignes = state.lignesDevis.filter(l => l.NUMERO_DEVIS === numeroDevis);
  }

  if (!devis) {
    showToast('Devis introuvable pour l\'export PDF', 'error');
    return;
  }

  generatePDF(devis, lignes);
}

// Alias pratique
function exportCurrentDevisPDF() {
  if (typeof currentDevisNumero !== 'undefined' && currentDevisNumero) {
    exportDevisPDF(currentDevisNumero);
  } else {
    showToast('Aucun devis sélectionné', 'warning');
  }
}