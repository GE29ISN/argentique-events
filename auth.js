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
      const result = await SHEETS.getUtilisateurs();
      const users = result.data;
      const user = users.find(u =>
        u.NOM.toLowerCase() === nom.toLowerCase() &&
        u.PRENOM.toLowerCase() === prenom.toLowerCase() &&
        u.PASSWORD === password
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
    return `${this.currentUser.PRENOM} ${this.currentUser.NOM}`;
  }
};
