/* =============================================================================
   auth.js — session + route protection
   Include this at the top of every protected page, right after data.js.
   ============================================================================= */

const Session = {
  KEY: DB_KEYS.session,
  get() {
    try { return JSON.parse(sessionStorage.getItem(this.KEY)); }
    catch (e) { return null; }
  },
  set(username) {
    sessionStorage.setItem(this.KEY, JSON.stringify({ username, at: Date.now() }));
  },
  clear() {
    sessionStorage.removeItem(this.KEY);
  },
  isLoggedIn() {
    return !!this.get();
  },
};

/* Guard: if there is no active session, bounce straight to the login page.
   Pages call requireAuth() before rendering anything else so protected
   data is never displayed to a logged-out visitor. */
function requireAuth() {
  if (!Session.isLoggedIn()) {
    const next = encodeURIComponent(location.pathname.split('/').pop());
    location.replace('login.html?next=' + next);
  }
}

function logout() {
  Session.clear();
  location.replace('login.html');
}

function currentUsername() {
  const s = Session.get();
  return s ? s.username : '';
}
