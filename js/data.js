/* =============================================================================
   data.js
   A tiny localStorage-backed "database" for the Event Desk demo.

   IMPORTANT NOTE ON SECURITY
   This is a static HTML/CSS/JS site with no server, so there is no real
   backend or database — everything lives in the browser's localStorage.
   Passwords are still never stored in plain text: they are hashed with
   SHA-256 (via the browser's built-in SubtleCrypto API) before being saved,
   the same way a server-rendered app would hash before persisting to a
   real database. If you wire this up to an actual backend later, swap the
   functions in this file for real API calls and use a proper server-side
   hash (bcrypt/argon2) + salted storage.
   ============================================================================= */

const DB_KEYS = {
  users: 'ed_users',
  events: 'ed_events',
  attendees: 'ed_attendees',
  session: 'ed_session',
};

/* ------------------------------- utilities -------------------------------- */

function uid(prefix) {
  return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

async function sha256(text) {
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function readStore(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.error('Failed to read store', key, e);
    return fallback;
  }
}

function writeStore(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/* --------------------------------- seeding --------------------------------- */

async function ensureSeedData() {
  if (!localStorage.getItem(DB_KEYS.users)) {
    const passwordHash = await sha256('admin123');
    writeStore(DB_KEYS.users, [
      { id: uid('usr'), username: 'admin', passwordHash },
    ]);
  }

  if (!localStorage.getItem(DB_KEYS.attendees)) {
    const attendees = [
      { id: uid('att'), name: 'Maya Reyes', email: 'maya.reyes@example.com', phone: '555-201-3344' },
      { id: uid('att'), name: 'Owen Park', email: 'owen.park@example.com', phone: '555-118-7723' },
      { id: uid('att'), name: 'Ines Costa', email: 'ines.costa@example.com', phone: '555-982-0091' },
      { id: uid('att'), name: 'Daniel Frost', email: 'daniel.frost@example.com', phone: '555-455-6620' },
    ];
    writeStore(DB_KEYS.attendees, attendees);

    if (!localStorage.getItem(DB_KEYS.events)) {
      const events = [
        {
          id: uid('evt'),
          name: 'Annual Product Summit',
          description: 'A day of keynotes, roadmap reveals, and hands-on workshops for the whole product community.',
          date: '2026-09-14',
          time: '09:00',
          location: 'Bagmati Convention Hall, Kathmandu',
          attendeeIds: [attendees[0].id, attendees[1].id],
        },
        {
          id: uid('evt'),
          name: 'Volunteer Orientation',
          description: 'Kickoff session covering safety training, team assignments, and site logistics for new volunteers.',
          date: '2026-08-22',
          time: '17:30',
          location: 'Community Hall, Room B',
          attendeeIds: [attendees[2].id],
        },
        {
          id: uid('evt'),
          name: 'Autumn Fundraiser Gala',
          description: 'An evening dinner and auction supporting the youth education fund.',
          date: '2026-10-03',
          time: '18:30',
          location: 'Riverside Gardens',
          attendeeIds: [],
        },
      ];
      writeStore(DB_KEYS.events, events);
    }
  } else if (!localStorage.getItem(DB_KEYS.events)) {
    writeStore(DB_KEYS.events, []);
  }
}

/* ---------------------------------- users ---------------------------------- */

const UserStore = {
  all() { return readStore(DB_KEYS.users, []); },
  findByUsername(username) {
    return this.all().find(u => u.username.toLowerCase() === username.toLowerCase());
  },
  async verify(username, password) {
    const user = this.findByUsername(username);
    if (!user) return false;
    const hash = await sha256(password);
    return hash === user.passwordHash;
  },
};

/* --------------------------------- events ----------------------------------- */

const EventStore = {
  all() {
    return readStore(DB_KEYS.events, []).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  },
  find(id) { return this.all().find(e => e.id === id); },
  save(event) {
    const events = readStore(DB_KEYS.events, []);
    if (event.id) {
      const idx = events.findIndex(e => e.id === event.id);
      if (idx > -1) { events[idx] = { ...events[idx], ...event }; }
      else { events.push(event); }
    } else {
      event.id = uid('evt');
      event.attendeeIds = event.attendeeIds || [];
      events.push(event);
    }
    writeStore(DB_KEYS.events, events);
    return event;
  },
  remove(id) {
    const events = readStore(DB_KEYS.events, []).filter(e => e.id !== id);
    writeStore(DB_KEYS.events, events);
  },
  setAttendees(eventId, attendeeIds) {
    const events = readStore(DB_KEYS.events, []);
    const evt = events.find(e => e.id === eventId);
    if (evt) {
      evt.attendeeIds = attendeeIds;
      writeStore(DB_KEYS.events, events);
    }
  },
};

/* -------------------------------- attendees ---------------------------------- */

const AttendeeStore = {
  all() {
    return readStore(DB_KEYS.attendees, []).sort((a, b) => a.name.localeCompare(b.name));
  },
  find(id) { return this.all().find(a => a.id === id); },
  save(attendee) {
    const attendees = readStore(DB_KEYS.attendees, []);
    if (attendee.id) {
      const idx = attendees.findIndex(a => a.id === attendee.id);
      if (idx > -1) { attendees[idx] = { ...attendees[idx], ...attendee }; }
      else { attendees.push(attendee); }
    } else {
      attendee.id = uid('att');
      attendees.push(attendee);
    }
    writeStore(DB_KEYS.attendees, attendees);
    return attendee;
  },
  remove(id) {
    const attendees = readStore(DB_KEYS.attendees, []).filter(a => a.id !== id);
    writeStore(DB_KEYS.attendees, attendees);
    // also detach from any events
    const events = readStore(DB_KEYS.events, []).map(e => ({
      ...e,
      attendeeIds: (e.attendeeIds || []).filter(aid => aid !== id),
    }));
    writeStore(DB_KEYS.events, events);
  },
  eventsFor(attendeeId) {
    return readStore(DB_KEYS.events, []).filter(e => (e.attendeeIds || []).includes(attendeeId));
  },
};
