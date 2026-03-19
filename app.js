const APP = {
  stock: [],
  devis: [],
  categories: [],
  currentPage: 'stock',
  calendarDate: new Date(),
  devisFilter: 'TOUS',

  async init() {
    await this.loadCategories();
    this.renderPage('stock');
  },

  async loadCategories() {
    const res = await SHEETS.getCategories();
    if (res.success) this.categories = res.data;
  },

  navigate(page) {
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.getElementById('nav-' + page)?.classList.add('active');
    document.querySelectorAll('.page').forEach(p => { p.classList.add('hidden'); p.classList.remove('active'); });
    const pageEl = document.getElementById('page-' + page);
    if (pageEl) { pageEl.classList.remove('hidden'); pageEl.classList.add('active'); }
    this.currentPage = page;
    this.renderPage(page);
  },

  async renderPage(page) {
