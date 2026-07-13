# DERÎ — Project Context & Continuation Brief

Paste this whole document at the start of any new conversation about this project, so
whichever AI you're talking to has full context immediately, without re-explaining from scratch.

---

## Instruction for Claude (read this first, every time)

If you are Claude, reading this at the start of a conversation about DERÎ: whenever the person
asks you to make or help make a change to this project — a new feature, a fix, a design change,
a schema change, anything — after the change is done, **append a new entry to the "Changelog"
section at the very bottom of this document**. Each entry should be short but real:

- **Date** (ask the person if you don't know today's date, don't guess)
- **What changed** (one or two sentences, plain language)
- **Why / the reasoning** (what problem this solved, or what tradeoff was made — the "thought
  process," not just the output)
- **Files touched**

Then remind the person, in your normal reply, to save the updated document back into their
project folder and push it along with the code change — the same commit is fine. Don't skip this
step even for small changes; small entries are what keep this document trustworthy as a real
history instead of a stale snapshot. If the person is clearly just asking a question rather than
requesting a change, no changelog entry is needed.

---

## 1. What DERÎ is

A bilingual (Kurdish/Arabic, plus English) local business directory for the Kurdistan Region,
built around a specific idea: printed doorstep leaflets carry a QR code per business, which
opens that business's profile page on this site. This lets the leaflet business (the founder's
main venture) track real engagement per business/neighborhood, while giving residents one
simple place to find and contact local businesses.

Brand name: **DERÎ** — Kurmanji for "door," referencing the doorstep-delivery concept the whole
business model is built on. Visual design uses a "door number plaque" motif (numbered badges on
business cards) to reinforce this.

## 2. Current technical state (as of last session)

- **Frontend:** Plain HTML/CSS/JS — no framework, no build step. Deliberately kept simple so it
  stays editable by hand and easy to hand off to a professional developer later.
- **Backend:** Supabase (Postgres database + Supabase Auth), already set up and live.
- **Hosting:** GitHub Pages, already live at:
  **https://nwwr122.github.io/Deri-website/**
- **GitHub repo:** `nwwr122/Deri-website` — **public** (required for free GitHub Pages hosting).
  Since it's public, a future conversation can fetch the live code directly from
  `https://github.com/nwwr122/Deri-website` instead of needing everything re-pasted.
- **Custom domain:** not yet set up (optional future step — `deri-kurdistan.com` or a `.krd`
  domain were being considered, not yet purchased).

## 3. File structure

```
index.html        → public directory (search + category filter + business grid)
showcase.html      → gallery view of every business, no filtering (for pitching to businesses)
profile.html       → single business profile page — this is what each QR code points to
                     (URL pattern: profile.html?id=<business-id>)
admin.html         → admin panel (add/edit/delete businesses) — requires real login
style.css          → shared design system for all pages
app.js             → shared data layer (Supabase calls), categories, translations, directory rendering
showcase.js         → showcase page rendering
profile.js         → profile page rendering + scan-count increment
admin.js           → admin panel logic (login, form, table)
supabase-config.js → holds the real SUPABASE_URL and SUPABASE_ANON_KEY (already filled in)
sql/schema.sql     → the database setup script (already run once against the live Supabase project)
README.md          → setup/handoff notes written during original build
```

## 4. Data model (businesses table in Supabase)

Columns: `id` (text, uuid default), `category`, `neighborhood`, `phone`, `whatsapp`, `instagram`,
`facebook`, `scans` (integer), `name_en`/`name_ku`/`name_ar`, `desc_en`/`desc_ku`/`desc_ar`,
`created_at`.

The JS layer converts this into a nested shape at runtime: `business.name.en`, `business.desc.ar`,
etc. — see `rowToBusiness()` / `businessToRow()` in `app.js` if adding new fields.

## 5. Security model — important, don't casually change this

- **Row Level Security (RLS)** is enabled. Public/anonymous users can only **read** (`select`).
  Only an authenticated session (i.e. someone logged into `admin.html` with the one real admin
  account) can insert/update/delete. This is enforced by Postgres itself, not just hidden in the
  UI — that's what makes it actually secure.
- **Scan counting** goes through a dedicated Postgres function (`increment_scan`), grantable to
  anonymous users specifically, so visitors can bump a scan count without any broader write access.
- **Never** put the Supabase `service_role` / secret key anywhere in these files — only the
  `anon public` key belongs in `supabase-config.js`. The anon key being publicly visible is
  expected and safe; the service_role key is not.
- There is no public sign-up — only the one admin account created manually in the Supabase
  dashboard (Authentication → Users) can ever log in.

## 6. Current categories

All, Grocery & Household Goods, Home Services, Clinics & Pharmacies, Restaurants, Cafés &
Entertainment, Mobile & Electronics, Tutoring, Salon & Barber, Other — each with EN/KU/AR labels
in the `CATEGORIES` array in `app.js`.

## 7. Known placeholders / open items

- **Kurdish (Kurmanji) and Arabic sample text throughout is placeholder**, written without a
  native speaker's review. Flag this before any real public launch push — get it proofread,
  especially since the target audience (Duhok area) mostly reads Kurmanji in **Latin script**,
  not Sorani in Arabic script.
- **Scan tracking is currently a single running total per business.** A previously discussed
  next step: add a `batch` field (or a separate `scan_events` table with timestamps) so scans
  can be tracked per leaflet run/neighborhood, not just an all-time count. A QR URL like
  `profile.html?id=b1&batch=malta-july` was the planned approach.
  Note: a similar-in-spirit request — "WhatsApp click tracking" (recording business_id + timestamp
  whenever the WhatsApp button is clicked, separate from the QR scan count) — was mentioned as a
  future want and has **not** been built yet.
- **Custom domain** not yet purchased/connected — optional polish, not a blocker.
- **No automated tests** — this is a hand-edited static site; changes should be tested locally
  (Live Server or similar) before pushing.

## 8. Design system reference (style.css)

- Palette: warm limestone background, charcoal ink text, deep rust/brick accent, dusty sage
  green secondary, dusk indigo for links/admin chrome, brass tone for the plaque badge numerals.
- Fonts: Fraunces (display/English headings), Inter (body), Cairo + Katibeh (Arabic/Sorani
  headings/body).
- Signature element: "plaque" cards with a numbered badge (`No. 001`, etc.) on every business
  card, echoing physical door-number plaques.

---

# Standard Operating Procedure — how we work on this project going forward

Follow this every time, to avoid lost context or broken deploys:

1. **Starting a new conversation:** paste this whole document first. If asking for a
   non-trivial change, also mention the repo is public at `github.com/nwwr122/Deri-website` so
   the current live code can be fetched directly rather than assumed from memory.
2. **Describing a change:** just describe it in plain language — the desired outcome, not
   necessarily the technical how. Expect back: an explanation of the approach, then exact code
   and exactly which file(s) to edit, with copy-paste-ready snippets.
3. **Before applying a change:** if it touches the database (`sql/schema.sql`) or security rules,
   flag that explicitly — those need extra care since they affect data safety, not just appearance.
4. **After applying a change locally:** test with Live Server (or equivalent) before pushing —
   catches mistakes before they're visible to real visitors.
5. **Pushing:**
   ```
   git add .
   git commit -m "short description of what changed"
   git push
   ```
   GitHub Pages redeploys automatically within about a minute.
6. **Never paste the Supabase `service_role`/secret key into any conversation or file** — only
   the `anon public` key belongs in this project, ever.
7. **If something breaks after a push:** describe exactly what you see (error message, blank
   page, wrong data) rather than just "it's broken" — exact wording of errors is what makes fast
   troubleshooting possible.

---

# Changelog

*Newest entries at the top.*

### [Date not recorded — original build, prior to this document existing]
**What changed:** Built the full initial project — public directory (`index.html`), showcase
gallery (`showcase.html`), individual business profile pages (`profile.html`, one per business
via `?id=`), and the admin panel (`admin.html`). Migrated data storage from browser localStorage
to a real Supabase database, and admin login from a client-side password to real Supabase Auth.
Set up Row Level Security so only a logged-in admin can write, while reads stay public. Updated
the category list to focus on household goods/services plus a new Cafés & Entertainment category.
Deployed live via GitHub Pages at https://nwwr122.github.io/Deri-website/.
**Why:** To get from prototype to a genuinely public, securely-editable, shared-data website that
real businesses and residents could use — and to give the leaflet-distribution business a way to
measure real reach via QR-code-driven scan counts per business.
**Files touched:** all of them (initial build).

