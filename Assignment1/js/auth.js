// Authentication against the (simulated) user table and the session guard for protected pages.
(function () {
  const auth = {
    current() {
      const session = CF.storage.get(CF.db.KEYS.session);
      return session ? CF.db.user(session.userId) : null;
    },

    // Throws Error with a user-facing message on any validation/credential problem.
    login(username, password) {
      username = (username || '').trim();
      if (!username || !password) throw new Error('Please enter both username and password.');
      const user = CF.db.users().find((u) => u.username.toLowerCase() === username.toLowerCase());
      if (!user || user.password !== password) throw new Error('Incorrect username or password.');
      CF.db.updateUser(user.id, { lastLogin: new Date().toISOString() });
      if (!CF.storage.set(CF.db.KEYS.session, { userId: user.id })) {
        throw new Error('Your browser blocked local storage, so you cannot stay signed in.');
      }
      return user;
    },

    logout() {
      CF.storage.remove(CF.db.KEYS.session);
      window.location.href = 'index.html';
    },

    // Redirects to the login page when nobody is signed in.
    require() {
      const user = auth.current();
      if (!user) window.location.replace('index.html');
      return user;
    },
  };

  CF.auth = auth;
})();
