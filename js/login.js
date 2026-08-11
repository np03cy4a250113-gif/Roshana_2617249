(async function () {
  await ensureSeedData();

  // Already logged in? skip straight to the app.
  if (Session.isLoggedIn()) {
    location.replace('events.html');
    return;
  }

  const form = document.getElementById('login-form');
  const flashSlot = document.getElementById('flash-slot');
  const usernameEl = document.getElementById('username');
  const passwordEl = document.getElementById('password');
  const errUsername = document.getElementById('err-username');
  const errPassword = document.getElementById('err-password');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    flashSlot.innerHTML = '';

    const username = usernameEl.value.trim();
    const password = passwordEl.value;

    const uErr = username ? '' : 'Enter your username.';
    const pErr = password ? '' : 'Enter your password.';
    setFieldError(usernameEl, errUsername, uErr);
    setFieldError(passwordEl, errPassword, pErr);
    if (uErr || pErr) return;

    const submitBtn = form.querySelector('button[type=submit]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Checking…';

    const ok = await UserStore.verify(username, password);

    submitBtn.disabled = false;
    submitBtn.textContent = 'Sign in';

    if (!ok) {
      showFlash(flashSlot, 'Incorrect username or password.', 'error');
      return;
    }

    Session.set(username);
    const params = new URLSearchParams(location.search);
    const next = params.get('next');
    const safe = next && /^[a-z-]+\.html$/.test(next) ? next : 'events.html';
    location.replace(safe);
  });
})();
