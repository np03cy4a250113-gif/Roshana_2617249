(async function () {
  requireAuth();
  await ensureSeedData();
  renderSidebar('attendees');

  const slot = document.getElementById('attendees-slot');
  const searchInput = document.getElementById('search-input');
  const countPill = document.getElementById('count-pill');

  consumePendingFlash(document.getElementById('flash-slot'));

  function render(list) {
    countPill.textContent = `${list.length} attendee${list.length === 1 ? '' : 's'}`;

    if (list.length === 0) {
      slot.innerHTML = `
        <div class="empty-state card">
          <img src="img/empty-attendees.svg" alt="">
          <h3>No attendees match yet</h3>
          <p>Try a different search, or add your first attendee.</p>
        </div>`;
      return;
    }

    slot.innerHTML = `
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>Name</th><th>Email</th><th>Phone</th><th>Events</th><th></th></tr>
          </thead>
          <tbody>
            ${list.map(a => {
              const eventCount = AttendeeStore.eventsFor(a.id).length;
              return `
                <tr>
                  <td class="name-cell">${escapeHtml(a.name)}</td>
                  <td class="mono">${escapeHtml(a.email)}</td>
                  <td class="mono">${escapeHtml(a.phone)}</td>
                  <td><span class="badge">${eventCount} registered</span></td>
                  <td>
                    <div class="row-actions">
                      <a class="btn btn-ghost btn-sm" href="attendee-form.html?id=${encodeURIComponent(a.id)}">Edit</a>
                      <button class="btn btn-danger btn-sm" data-delete="${a.id}" type="button">Delete</button>
                    </div>
                  </td>
                </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;

    $all('[data-delete]', slot).forEach(btn => {
      btn.addEventListener('click', () => {
        const attendee = AttendeeStore.find(btn.dataset.delete);
        if (attendee && confirm(`Delete ${attendee.name}? They will also be removed from any events.`)) {
          AttendeeStore.remove(attendee.id);
          showFlash(document.getElementById('flash-slot'), `${attendee.name} was deleted.`, 'good');
          refresh();
        }
      });
    });
  }

  function refresh() {
    const all = AttendeeStore.all();
    const q = searchInput.value.trim().toLowerCase();
    const filtered = q ? all.filter(a => a.name.toLowerCase().includes(q)) : all;
    render(filtered);
  }

  searchInput.addEventListener('input', refresh);
  refresh();
})();
