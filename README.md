# DERÎ — local business directory (prototype)

This is a working prototype, not a production website. It's meant to (1) let you test the
concept with real business owners today, and (2) hand cleanly to a developer later.

## Files

- `index.html` — the public directory page (browse/search all businesses)
- `showcase.html` — a filter-free gallery view of every business, useful for pitching
- `profile.html` — a single business's full profile page — **this is what each QR code should point to**
- `admin.html` — the admin panel, where you add/edit/delete business listings
- `style.css` — all visual design, shared by all pages
- `app.js` — shared data (sample businesses, categories, translations) and the directory page's rendering logic
- `showcase.js` — rendering logic specific to the showcase gallery
- `profile.js` — rendering logic for the single business profile page
- `admin.js` — admin-only logic (login gate, form handling, table)

## QR codes — how they connect to this site

Every business card on `index.html` and `showcase.html` is clickable and links to
`profile.html?id=<business id>`. That same URL is what a QR code on that business's printed
leaflet should encode — e.g. a leaflet for "Simko Grill House" (id `b1`) would use a QR code
pointing to `profile.html?id=b1`.

Each time `profile.html` loads, it increments that business's scan count by 1 (see the note at
the top of `profile.js`) — a stand-in for real scan tracking. In production this should be
logged server-side instead, ideally per leaflet batch/neighborhood, so you can eventually see
scan counts by area rather than just a single running total.

## How to run it

**Simplest:** double-click `index.html` to open it in a browser. This mostly works, but some
browsers restrict localStorage for files opened directly from disk (`file://`), which can make
admin edits not show up on the public page.

**Recommended (2 minutes, avoids that issue):** open a terminal in this folder and run one of:

```
python3 -m http.server 8000
```
then visit `http://localhost:8000` in your browser.

or, if you have Node.js installed:
```
npx serve .
```

## How to use it right now

1. Open `admin.html`, sign in with the demo password `admin123`.
2. Add a real business: name (in whichever languages you have — English/Kurmanji/Arabic),
   category, neighborhood, phone, WhatsApp, and social links.
3. Open `index.html` in another tab to see it appear on the public directory instantly.
4. Use the language switch (KU / AR / EN) top-right to preview it in each language.

The 6 sample businesses are placeholder data — use "Reset demo data" in the admin panel to
restore them if you want to start over.

## Setting up Supabase (one-time, ~10 minutes)

This project now uses [Supabase](https://supabase.com) for real shared data storage and real
admin login. Free tier is plenty for this stage.

1. **Create a project** at supabase.com (free account, new project, pick any region — closer to
   your users is slightly faster but not critical at this scale).
2. **Run the setup script**: Dashboard → SQL Editor → New query → paste the entire contents of
   `sql/schema.sql` → Run. This creates the `businesses` table, the security rules that make the
   admin panel actually secure, the scan-counting function, and loads the 8 sample businesses.
3. **Create your admin account**: Dashboard → Authentication → Users → Add user. Use your own
   real email and a real password. This is the *only* account that will ever be able to sign in
   — there is no public sign-up anywhere on the site.
4. **Get your API keys**: Dashboard → Settings → API. Copy the "Project URL" and the "anon public"
   key.
5. **Fill in `supabase-config.js`**: replace the two placeholder strings with the values from
   step 4.
6. Open `admin.html`, sign in with the account from step 3 — you're live.

## What's real vs. what's a stand-in

| Piece | Status |
|---|---|
| Data storage | **Real** — a Supabase Postgres database, shared across every visitor and device |
| Admin login | **Real** — Supabase Auth; no password lives in any file, ever |
| Who can add/edit/delete businesses | **Real** — enforced server-side by Row Level Security, not just hidden in the UI |
| QR scan counts | **Real** — incremented server-side via a Postgres function each time `profile.html` loads for a given business |
| Hosting | Still needs a step — see below |

## Notes for whoever builds this further

- The `sql/schema.sql` file **is** the database schema — `businesses` table, one row per
  business, flattened per-language columns (`name_en`/`name_ku`/`name_ar`, same for `desc`).
- Security comes from the Row Level Security policies in that file, not from anything in the
  JavaScript. Read access is public (the directory needs that); write access requires a logged-in
  session. This is the correct way to do this — don't be tempted to "hide" admin logic in
  client-side code instead.
- The scan counter uses a dedicated Postgres function (`increment_scan`) instead of a normal
  update, specifically so anonymous visitors can bump a count without being able to touch
  anything else in the row.
- For scan analytics by neighborhood/leaflet batch later: add a `batch` text column to
  `businesses` (or a separate `scan_events` table with a timestamp per scan) and pass a batch
  identifier in the QR URL, e.g. `profile.html?id=b1&batch=malta-july`.
- The Kurdish (Kurmanji) and Arabic sample text is placeholder — have it reviewed by a native
  speaker before this goes live, especially since Duhok-area readers are mostly Kurmanji
  (Latin script), not Sorani (Arabic script). Confirm which script your real audience needs
  before writing real copy.

## Hosting (once Supabase is set up)

This is still a plain static site (HTML/CSS/JS), so any static host works — Netlify, Vercel, or
GitHub Pages (see `git-github-quick-reference.md` for the GitHub Pages steps). Just make sure
`supabase-config.js` has your real values filled in before you deploy — the anon key is safe to
expose publicly, that's expected.
