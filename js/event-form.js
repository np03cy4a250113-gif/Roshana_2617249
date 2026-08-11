(async function () {
  requireAuth();
  await ensureSeedData();
  renderSidebar('events');

  const params = new URLSearchParams(location.search);
  const editId = params.get('id');
  const existing = editId ? EventStore.find(editId) : null;

  if (editId && !existing) {
    document.querySelector('.main').innerHTML = `
      <div class="empty-state card"><h3>Event not found</h3><p>It may have already been deleted.</p></div>`;
    return;
  }

  document.getElementById('form-eyebrow').textContent = existing ? 'Editing event' : 'New event';
  document.getElementById('form-title').textContent = existing ? 'Edit event' : 'New event';
  document.getElementById('submit-btn').textContent = existing ? 'Save changes' : 'Save event';

  const nameEl = document.getElementById('name');
  const descEl = document.getElementById('description');
  const dateEl = document.getElementById('date');
  const timeEl = document.getElementById('time');
  const locationEl = document.getElementById('location');
  const checklist = document.getElementById('attendee-checklist');
  const flashSlot = document.getElementById('flash-slot');
  const form = document.getElementById('event-form');

  if (existing) {
    nameEl.value = existing.name;
    descEl.value = existing.description || '';
    dateEl.value = existing.date;
    timeEl.value = existing.time;
    locationEl.value = existing.location;
  }

  const allAttendees = AttendeeStore.all();
  const selectedIds = new Set(existing ? existing.attendeeIds || [] : []);

  function renderChecklist() {
    if (allAttendees.length === 0) {
      checklist.innerHTML = `<p style="grid-column:1/-1; color:var(--ink-soft); font-size:.85rem;">
        No attendees on file yet. <a href="attendee-form.html">Add one</a> first, then come back to register them.
      </p>`;
      return;
    }
    checklist.innerHTML = allAttendees.map(a => `
      <label class="checkbox-item">
        <input type="checkbox" value="${a.id}" ${selectedIds.has(a.id) ? 'checked' : ''}>
        ${escapeHtml(a.name)}
      </label>
    `).join('');
  }
  renderChecklist();

  function fieldValidators() {
    return [
      [nameEl, document.getElementById('err-name'), () => Validate.required(nameEl.value, 'Event name')],
      [dateEl, document.getElementById('err-date'), () => Validate.date(dateEl.value)],
      [timeEl, document.getElementById('err-time'), () => Validate.time(timeEl.value)],
      [locationEl, document.getElementById('err-location'), () => Validate.required(locationEl.value, 'Location')],
    ];
  }

  function validateAll() {
    let ok = true;
    for (const [field, errEl, check] of fieldValidators()) {
      const msg = check();
      setFieldError(field, errEl, msg);
      if (msg) ok = false;
    }
    return ok;
  }

  // live-clear errors as the user types
  for (const [field, errEl, check] of fieldValidators()) {
    field.addEventListener('input', () => setFieldError(field, errEl, check() && field.value ? check() : ''));
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    flashSlot.innerHTML = '';

    if (!validateAll()) {
      showFlash(flashSlot, 'Please fix the highlighted fields before saving.', 'error');
      return;
    }

    const checkedIds = $all('#attendee-checklist input[type=checkbox]:checked').map(cb => cb.value);

    const payload = {
      id: existing ? existing.id : undefined,
      name: nameEl.value.trim(),
      description: descEl.value.trim(),
      date: dateEl.value,
      time: timeEl.value,
      location: locationEl.value.trim(),
      attendeeIds: checkedIds,
    };

    const saved = EventStore.save(payload);
    setPendingFlash(`${saved.name} was ${existing ? 'updated' : 'added'}.`, 'good');
    location.href = 'event-view.html?id=' + encodeURIComponent(saved.id);
  });
})();
