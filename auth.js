const Auth = {
  currentUser: null,

  init() {
    const saved = sessionStorage.getItem('currentUser');
    if (saved) {
      this.currentUser = JSON.parse(saved);
    }
  },

  async login(nom, prenom, password) {
    try {
      const users = await Sheets.getUtilisateurs();
      const user = users.find(u =>
        u.nom.toLowerCase() === nom.toLowerCase() &&
        u.prenom.toLowerCase() === prenom.toLowerCase() &&
        u.password === password
      );
      if (user) {
        this.currentUser = user;
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        return { success: true, user };
      } else {
        return { success: false, message: 'Identifiants incorrects' };
      }
    } catch (e) {
      return { success: false, message: 'Erreur de connexion' };
    }
  },

  logout() {
    this.currentUser = null;
    sessionStorage.removeItem('currentUser');
  },

  isLoggedIn() {
    return this.currentUser !== null;
  },

  getFullName() {
    if (!this.currentUser) return '';
    return `${this.currentUser.prenom} ${this.currentUser.nom}`;
  }
};
