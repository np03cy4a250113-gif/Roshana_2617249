(async function () {
  requireAuth();
  await ensureSeedData();
  renderSidebar('attendees');

  const params = new URLSearchParams(location.search);
  const editId = params.get('id');
  const existing = editId ? AttendeeStore.find(editId) : null;

  if (editId && !existing) {
    document.querySelector('.main').innerHTML = `
      <div class="empty-state card"><h3>Attendee not found</h3><p>They may have already been deleted.</p></div>`;
    return;
  }

  document.getElementById('form-eyebrow').textContent = existing ? 'Editing attendee' : 'New attendee';
  document.getElementById('form-title').textContent = existing ? 'Edit attendee' : 'New attendee';
  document.getElementById('submit-btn').textContent = existing ? 'Save changes' : 'Save attendee';

  const nameEl = document.getElementById('name');
  const emailEl = document.getElementById('email');
  const phoneEl = document.getElementById('phone');
  const flashSlot = document.getElementById('flash-slot');
  const form = document.getElementById('attendee-form');

  if (existing) {
    nameEl.value = existing.name;
    emailEl.value = existing.email;
    phoneEl.value = existing.phone;
  }

  function fieldValidators() {
    return [
      [nameEl, document.getElementById('err-name'), () => Validate.required(nameEl.value, 'Full name')],
      [emailEl, document.getElementById('err-email'), () => Validate.email(emailEl.value)],
      [phoneEl, document.getElementById('err-phone'), () => Validate.phone(phoneEl.value)],
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

  for (const [field, errEl, check] of fieldValidators()) {
    field.addEventListener('blur', () => setFieldError(field, errEl, check()));
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    flashSlot.innerHTML = '';

    if (!validateAll()) {
      showFlash(flashSlot, 'Please fix the highlighted fields before saving.', 'error');
      return;
    }

    // duplicate-email guard
    const dupe = AttendeeStore.all().find(a =>
      a.email.toLowerCase() === emailEl.value.trim().toLowerCase() && a.id !== (existing && existing.id)
    );
    if (dupe) {
      setFieldError(emailEl, document.getElementById('err-email'), 'Another attendee already uses this email.');
      showFlash(flashSlot, 'Please fix the highlighted fields before saving.', 'error');
      return;
    }

    const payload = {
      id: existing ? existing.id : undefined,
      name: nameEl.value.trim(),
      email: emailEl.value.trim(),
      phone: phoneEl.value.trim(),
    };

    AttendeeStore.save(payload);
    setPendingFlash(`${payload.name} was ${existing ? 'updated' : 'added'}.`, 'good');
    location.href = 'attendees.html';
  });
})();
