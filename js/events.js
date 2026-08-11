(async function () {
  requireAuth();
  await ensureSeedData();
  renderSidebar('events');

  const eventsSlot = document.getElementById('events-slot');
  const statStrip = document.getElementById('stat-strip');
  const searchInput = document.getElementById('search-input');
  const countPill = document.getElementById('count-pill');

  consumePendingFlash(document.getElementById('flash-slot'));

  function renderStats(events, attendeeCount) {
    const upcoming = events.filter(e => e.date >= todayIso()).length;
    statStrip.innerHTML = `
      <div class="stat-box"><div class="num">${events.length}</div><div class="lbl">Total events</div></div>
      <div class="stat-box"><div class="num">${upcoming}</div><div class="lbl">Upcoming</div></div>
      <div class="stat-box"><div class="num">${attendeeCount}</div><div class="lbl">People on file</div></div>
    `;
  }

  function todayIso() {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  }

  function renderEvents(list) {
    countPill.textContent = `${list.length} event${list.length === 1 ? '' : 's'}`;

    if (list.length === 0) {
      eventsSlot.innerHTML = `
        <div class="empty-state card">
          <img src="img/empty-events.svg" alt="">
          <h3>No events match yet</h3>
          <p>Try a different search, or create your first event.</p>
        </div>`;
      return;
    }

    eventsSlot.innerHTML = `
      <div class="ticket-grid">
        ${list.map(evt => `
          <a class="ticket" href="event-view.html?id=${encodeURIComponent(evt.id)}">
            <div class="ticket-body">
              <div class="ticket-date">${formatDate(evt.date)} · ${formatTime(evt.time)}</div>
              <h3 class="ticket-name">${escapeHtml(evt.name)}</h3>
              <div class="ticket-meta">
                <span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  ${escapeHtml(evt.location || '—')}
                </span>
              </div>
            </div>
            <div class="ticket-stub">
              <span class="stub-num">${(evt.attendeeIds || []).length}</span>
              <span class="stub-label">Attending</span>
            </div>
          </a>
        `).join('')}
      </div>
    `;
  }

  function refresh() {
    const events = EventStore.all();
    const attendees = AttendeeStore.all();
    renderStats(events, attendees.length);

    const q = searchInput.value.trim().toLowerCase();
    const filtered = q ? events.filter(e => e.name.toLowerCase().includes(q)) : events;
    renderEvents(filtered);
  }

  searchInput.addEventListener('input', refresh);
  refresh();
})();
