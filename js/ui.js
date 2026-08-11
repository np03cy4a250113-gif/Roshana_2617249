/* =============================================================================
   ui.js — small shared helpers used across pages
   ============================================================================= */

function $(sel, ctx) { return (ctx || document).querySelector(sel); }
function $all(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d)) return iso;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatTime(t) {
  if (!t) return '—';
  const [h, m] = t.split(':').map(Number);
  if (isNaN(h)) return t;
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = ((h + 11) % 12) + 1;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

/* Renders the sidebar into any element with id="sidebar-slot".
   `active` should be one of: events, attendees */
function renderSidebar(active) {
  const slot = document.getElementById('sidebar-slot');
  if (!slot) return;
  slot.innerHTML = `
    <aside class="sidebar">
      <div>
        <div class="brand">
          <img src="img/brand-mark.svg" alt="" width="34" height="34">
          <span class="brand-name">Event Desk</span>
        </div>
        <div class="brand-tagline">ticketing &amp; rosters</div>
      </div>
      <nav>
        <a class="nav-link ${active === 'events' ? 'active' : ''}" href="events.html">
          <span class="dot"></span> Events
        </a>
        <a class="nav-link ${active === 'attendees' ? 'active' : ''}" href="attendees.html">
          <span class="dot"></span> Attendees
        </a>
      </nav>
      <div class="nav-foot">
        <div class="who-am-i">Signed in as<br><strong>${escapeHtml(currentUsername())}</strong></div>
        <button class="btn-logout" id="logout-btn" type="button">Log out</button>
      </div>
    </aside>
  `;
  document.getElementById('logout-btn').addEventListener('click', logout);
}

/* ------------------------------- validation --------------------------------
   Generic, reusable field validators. Each returns an error string, or ''
   when the value is valid. */

const Validate = {
  required(value, label) {
    return String(value ?? '').trim() ? '' : `${label} is required.`;
  },
  email(value) {
    if (!value.trim()) return 'Email is required.';
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
    return ok ? '' : 'Enter a valid email address.';
  },
  phone(value) {
    if (!value.trim()) return 'Phone number is required.';
    const digits = value.replace(/\D/g, '');
    return digits.length >= 7 ? '' : 'Enter a valid phone number.';
  },
  date(value) {
    return value ? '' : 'Date is required.';
  },
  time(value) {
    return value ? '' : 'Time is required.';
  },
};

/* Attaches an error message under a field and toggles the invalid style.
   fieldEl = the input/textarea, errorEl = the small element that shows text */
function setFieldError(fieldEl, errorEl, message) {
  if (message) {
    fieldEl.classList.add('invalid');
    errorEl.textContent = message;
  } else {
    fieldEl.classList.remove('invalid');
    errorEl.textContent = '';
  }
}

function showFlash(container, message, kind) {
  container.innerHTML = `<div class="flash flash-${kind}">${escapeHtml(message)}</div>`;
}

/* -------------------------- cross-page flash messages -----------------------
   Used when we save/delete something and then redirect to a list page —
   stashes a message in sessionStorage so the *next* page can show a
   confirmation banner ("Attendee added.") instead of the save looking
   like it silently did nothing. */
function setPendingFlash(message, kind) {
  sessionStorage.setItem('ed_pending_flash', JSON.stringify({ message, kind: kind || 'good' }));
}

function consumePendingFlash(container) {
  const raw = sessionStorage.getItem('ed_pending_flash');
  if (!raw || !container) return;
  sessionStorage.removeItem('ed_pending_flash');
  try {
    const { message, kind } = JSON.parse(raw);
    showFlash(container, message, kind);
  } catch (e) { /* ignore malformed flash */ }
}
