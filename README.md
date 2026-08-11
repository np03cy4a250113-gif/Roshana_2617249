# Event Desk — Event Management System

A static HTML/CSS/JS admin tool for managing events, attendees, and event
registrations. No build step, no server required — open it in a browser.

## Getting started

1. Unzip the folder.
2. Open `index.html` in a browser (double-click it, or serve the folder
   with any static server if your browser blocks `file://` localStorage).
3. Log in with the demo account:
   - **Username:** `admin`
   - **Password:** `admin123`

## What's inside

- `index.html` – redirects to the login page or the events page depending
  on whether you're signed in.
- `login.html` / `js/login.js` – sign-in form.
- `events.html` / `js/events.js` – event list with search.
- `event-view.html` / `js/event-view.js` – single event detail + roster.
- `event-form.html` / `js/event-form.js` – add/edit an event, including
  checking off which attendees are registered.
- `attendees.html` / `js/attendees.js` – attendee list with search.
- `attendee-form.html` / `js/attendee-form.js` – add/edit an attendee.
- `js/data.js` – the "database" layer (see below).
- `js/auth.js` – session handling + route protection.
- `js/ui.js` – shared helpers (sidebar, formatting, validation).
- `css/style.css` – the whole design system.
- `img/` – hand-built SVG illustrations used across the app (brand mark,
  login artwork, empty states).

## How data is stored

This is a front-end-only project, so there's no real server or database.
All data (events, attendees, the admin account) lives in the browser's
**localStorage**, seeded automatically the first time you open the app.
That means:

- Data persists across page reloads, but only in that browser/profile.
- Clearing site data / localStorage resets everything back to the seed data.
- There is no multi-user sync — this is a demo/prototype data layer.

Passwords are **never stored in plain text**. They're hashed client-side
with SHA-256 (via the browser's built-in `crypto.subtle` API) before being
saved, mirroring how a real backend would hash before persisting to a
database. If you connect this UI to a real backend later, replace the
functions in `js/data.js` with real API calls, and hash passwords
server-side with bcrypt/argon2 + a salt — client-side SHA-256 alone is not
sufficient for production security.

## Route protection

Every page except `login.html` calls `requireAuth()` at the top of its
script. If there's no active session, the browser is redirected straight
to `login.html` before any event or attendee data is rendered.

## Validation

- Event form: name, date, time, and location are required.
- Attendee form: name is required; email must look like a real email and
  be unique; phone must contain at least 7 digits.
- Errors are shown inline under each field, and the form won't submit
  until they're resolved.

## A note on the images

The brand mark, login illustration, and empty-state graphics in `img/`
are original SVG illustrations built for this project rather than
downloaded stock photography — the sandbox this was built in only had
network access to package registries (npm, PyPI, GitHub, etc.), not image
or stock-photo sites. If you'd like real photography instead, drop your
own files into `img/` and swap the `src` attributes in the HTML/JS
(the login art is referenced in `login.html`, the empty states in
`js/events.js` and `js/attendees.js`).
