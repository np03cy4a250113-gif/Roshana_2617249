(async function () {
  requireAuth();
  await ensureSeedData();
  renderSidebar('events');

  const contentSlot = document.getElementById('content-slot');
  consumePendingFlash(document.getElementById('flash-slot'));
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  const evt = id ? EventStore.find(id) : null;

  if (!evt) {
    contentSlot.innerHTML = `
      <div class="empty-state card">
        <h3>Event not found</h3>
        <p>It may have been deleted. Head back to the event list.</p>
      </div>`;
    return;
  }

  const attendees = (evt.attendeeIds || []).map(aid => AttendeeStore.find(aid)).filter(Boolean);

  contentSlot.innerHTML = `
    <header class="view-head">
      <p class="eyebrow">Event details</p>
      <h1>${escapeHtml(evt.name)}</h1>
      <div class="view-facts">
        <div><span class="lbl">Date</span>${formatDate(evt.date)}</div>
        <div><span class="lbl">Time</span>${formatTime(evt.time)}</div>
        <div><span class="lbl">Location</span>${escapeHtml(evt.location || '—')}</div>
        <div><span class="lbl">Attending</span>${attendees.length}</div>
      </div>
    </header>

    <div class="two-col">
      <div class="card card-pad">
        <h2 class="section-title">About this event</h2>
        <p style="line-height:1.6; color:var(--ink-soft);">${evt.description ? escapeHtml(evt.description) : 'No description provided yet.'}</p>

        <div class="form-actions" style="justify-content:flex-start; margin-top:22px;">
          <a href="event-form.html?id=${encodeURIComponent(evt.id)}" class="btn btn-teal btn-sm">Edit event</a>
          <button id="delete-btn" class="btn btn-danger btn-sm" type="button">Delete event</button>
        </div>
      </div>

      <div class="card card-pad">
        <h2 class="section-title">
          Registered attendees
          <a href="event-form.html?id=${encodeURIComponent(evt.id)}#registration" class="btn btn-ghost btn-sm">Manage</a>
        </h2>
        ${attendees.length === 0
          ? `<p style="color:var(--ink-soft); font-size:.88rem;">No one is registered for this event yet.</p>`
          : attendees.map(a => `
            <div class="attendee-chip">
              <div>
                <div class="who">${escapeHtml(a.name)}</div>
                <div class="contact">${escapeHtml(a.email)}</div>
              </div>
              <div class="contact">${escapeHtml(a.phone)}</div>
            </div>
          `).join('')
        }
      </div>
    </div>
  `;

  document.getElementById('delete-btn').addEventListener('click', () => {
    if (confirm(`Delete "${evt.name}"? This can't be undone.`)) {
      EventStore.remove(evt.id);
      setPendingFlash(`${evt.name} was deleted.`, 'good');
      location.href = 'events.html';
    }
  });
})();
