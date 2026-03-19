const Auth = {
  currentUser: null,

  init() {
    const saved = sessionStorage.getItem('currentUser');
    if (saved) {
      this.currentUser = JSON.parse(saved);
    }
  },

  async login(username, password) {
    try {
      const result = await SHEETS.call({
        action: 'login',
        username: username,
        password: password
      });
      if (result.success) {
        this.currentUser = result.user;
        sessionStorage.setItem('currentUser', JSON.stringify(result.user));
        return { success: true, user: result.user };
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
