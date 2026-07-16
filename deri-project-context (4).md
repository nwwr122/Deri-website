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

### [7/16/2026]
**What changed:** Four related usability fixes:
1. **Language now actually persists** — previously the selected language reset to English on
   every new page (clicking into a profile, clicking the logo, etc.) because it was only ever
   held in a JS variable that reset on each page load. Now saved to `localStorage` and read back
   on every page load, via `getSavedLang()`/`setLang()`.
2. **Default language changed to Badini Kurdish** (`ku`) instead of English, for first-time
   visitors with no saved preference yet.
3. **Fixed the "brushy/blurry" Arabic-script heading font** — swapped the decorative `Katibeh`
   display font (used for RTL headings) for `Cairo` at heavier weight, matching the cleaner body
   font already used elsewhere. Removed the now-unused Katibeh font import.
4. **Added consistent icons per business category** — a `CATEGORY_ICONS` map with one
   recognizable icon per category (shopping bag, wrench, medical cross, utensils, coffee cup,
   phone, book, scissors, etc.), shown on the category filter pills and on every business card's
   category tag (directory, showcase, and profile pages), for faster visual scanning.
**Why:** Direct feedback from testing — language selection not sticking was a real usability
break, the Katibeh font was hard to read, and category names alone were slower to scan than
icon + text together.
**Files touched:** `app.js` (`getSavedLang`, `syncLangButtonsUI`, `applyLangDirection`,
`CATEGORY_ICONS`, `categoryIcon()`, bootstrap order), `showcase.js`/`profile.js` (category icon
on tags), `style.css` (font stack, `.cat-pill`/`.cat-tag` flex alignment for icons).

### [7/16/2026]
**What changed:** Added client-side QR code generation to the admin panel. Each business row now
has a "QR Code" button that generates a QR code (via the `qrcode` library, loaded from CDN) for
that exact business's `profile.html?id=...` URL — shown in a modal with a "Download PNG" button
for dropping straight into leaflet designs. QR codes are also generated automatically right after
adding a new business (not on edits). New `SITE_BASE_URL` constant in `admin.js` controls what
domain gets encoded — must be updated manually if a custom domain is ever connected.
**Why:** Removes manual copy-pasting of profile URLs into a third-party QR generator, keeps QR
generation entirely client-side (no data sent to any external service), and ties QR codes
directly and reliably to the correct business ID every time.
**Files touched:** `admin.html` (QR library script tag, modal markup, table column), `admin.js`
(`showQrCode`, `closeQrModal`, `SITE_BASE_URL`, auto-trigger after adding), `style.css` (modal
styling).

### [7/16/2026]
**What changed:** Replaced all Latin-script Kurmanji (`ku`) user-facing text throughout the
project with natural Badini Kurdish written in Arabic script — covers `STRINGS.ku` (all pages),
`CATEGORIES`, `CITIES`, the showcase page's extra strings, and the admin form's Kurdish name/
description fields (now also set to `dir="rtl"`, and the tab relabeled "Kurdish (Badini)" since
the script changed). Several admin-panel-only messages (add/edit/delete labels, confirmation and
validation text) that were previously English-only were also translated to Badini, per direct
request. Fixed `setLang()` so selecting Kurdish now also switches the page to right-to-left
layout (previously only Arabic did this — Kurdish text was Latin/LTR before, so this wasn't
needed until now). "View on Maps"/"Get Directions" on the profile page were moved from hardcoded
English into the proper translation system (`viewOnMaps`/`getDirections` keys, all three
languages) so they now actually translate instead of always showing English. Added Noto Sans
Arabic as a font fallback for broader Kurdish-specific letter coverage.
**Why:** Direct request — the target audience (Duhok/Shexan) reads Badini in Arabic script, and
Latin-script Kurmanji wasn't the right fit for real users. English and Arabic translations were
left untouched, only Kurdish changed.
**Files touched:** `app.js` (`STRINGS.ku`, `CATEGORIES`, `CITIES`, `setLang` RTL logic, new
`viewOnMaps`/`getDirections` keys added to all languages), `showcase.js` (extra `ku` strings),
`profile.js` (map buttons now translated), `admin.html` (ku field placeholders/labels/dir, tab
label), `admin.js` (hardcoded UI strings), `style.css` (font stack).

### [7/15/2026]
**What changed:** Three usability improvements bundled together:
1. **Admin save/delete feedback** — a small toast notification ("✓ Business added." /
   "✓ Business updated." / "Business deleted.") now appears briefly after every admin action,
   so it's clear something actually happened, instead of the form just silently clearing.
2. **Icons on action buttons** — Call, WhatsApp, Instagram, Facebook, View on Maps, and Get
   Directions buttons now show a small icon alongside their text everywhere they appear
   (directory cards, showcase cards, profile page). Instagram and Facebook are now shown as
   two separate buttons when both are set, instead of one generic "Social" link picking
   whichever was set first.
3. **Area filter redesigned to be visually distinct from Category** — the Duhok/Shexan/All
   Areas toggle is now a labeled, indigo-colored segmented control ("Area"), clearly different
   in shape and color from the rust-colored Category pills below it (also now labeled
   "Category"), so the two can't be confused for each other at a glance.
**Why:** Feedback came directly from testing: no confirmation after saving in admin, text-only
buttons were slower to scan than icons would be, and the two filter rows looked too similar to
tell apart.
**Files touched:** `admin.html`/`admin.js` (toast), `app.js` (`ICONS` object, `city-pill` class,
filter labels/translations, directory card buttons), `showcase.js`/`profile.js` (icon buttons,
split Instagram/Facebook), `index.html` (labeled filter groups), `style.css` (toast, icon
alignment, segmented-control area toggle styling).

### [7/14/2026]
**What changed:** Added an area toggle — Duhok / Shexan / All Areas — to the main directory
page (`index.html`), styled the same as the existing category pills, filtering the business
grid alongside search and category. New `city` column on `businesses` (defaults to `duhok`).
New required "City / Area" dropdown in the admin form. Neighborhood text on every card and the
profile page now shows alongside its city (e.g. "Nwroz, Duhok") for context. The toggle itself
was deliberately **not** added to `showcase.html`, keeping that page a pure, unfiltered gallery
as originally decided.
**Why:** The founder operates leaflet distribution personally in Shexan (a town) alongside the
larger city of Duhok, and wanted people to be able to narrow the directory to just the area
relevant to them.
**Files touched:** `sql/schema.sql` (reference copy; live DB updated via a one-off `alter table`
in Supabase SQL Editor), `app.js` (`CITIES` array, `cityLabel()`, `activeCity` filter state,
`renderCityStrip()`, row↔business mapping, card display), `showcase.js` / `profile.js` (city
shown next to neighborhood, no filtering added), `index.html` (new `#cityStrip` element),
`admin.html` (new City/Area select, admin table column), `admin.js` (populate/read/write city).

### [7/13/2026]
**What changed:** "View on Maps" now opens the exact pasted Google Maps link as-is (when a link
was pasted), instead of rebuilding a bare-pin link from extracted coordinates. This means it now
shows the real business profile page (reviews, photos, hours) rather than just a dropped pin —
and it also means shortened share links now work fine for this specific button. The embed preview
and "Get Directions" still need actual coordinates or a plain address to work meaningfully, so
they now hide gracefully (rather than showing something broken) when only a shortened link with
no usable coordinates was pasted.
**Why:** The person testing this pointed out that clicking through only showed a generic
coordinate pin, not the actual business listing — losing all the useful info Google already had
attached to the original link.
**Files touched:** `app.js` (`buildMapLinks` — added `isUrl` handling and per-field fallbacks),
`profile.js` (renders each map element conditionally based on which URLs are available),
`admin.html` (updated field guidance).

### [7/13/2026]
**What changed:** Fixed coordinate extraction from pasted Google Maps links picking the wrong
coordinate. Reordered the patterns in `extractLatLng()` so the precise place-marker coordinate
(`!3d...!4d...`) is checked before the map-viewport-center coordinate (`@lat,lng`). Also updated
the admin field's guidance to lead with right-clicking a spot in Google Maps and pasting the
exact coordinates shown, as the most reliable method — pasting a full link is best-effort since
Google's URL format can shift.
**Why:** Found through testing — pasting a full Google Maps link sometimes showed a location on
the map that wasn't the exact business, because the `@` coordinate in that link is where the map
happened to be centered/panned when the link was copied, not necessarily the precise pin. The
`!3d!4d` values in the same link are the actual marker position and are more reliable.
**Files touched:** `app.js` (`extractLatLng` pattern order), `admin.html` (field guidance text).

### [7/13/2026]
**What changed:** The profile page's map section is now a hybrid: a reliable "View on Maps" and
"Get Directions" button pair (plain links, always open Google Maps in a new tab) alongside the
existing embedded map preview. `buildMapEmbedUrl()` was replaced with `buildMapLinks()`, which
returns all three URLs (embed preview, view, directions) from the same parsing logic as before.
**Why:** The embedded iframe preview alone isn't fully reliable — it can be blocked by some
browser extensions/ad-blockers (encountered directly while testing: "custom add-ons couldn't be
displayed"). Buttons that open Google Maps directly always work regardless of that, and
"Get Directions" is arguably more useful to someone browsing the directory than a picture-only
preview anyway.
**Files touched:** `app.js` (`buildMapEmbedUrl` → `buildMapLinks`), `profile.js` (renders the
button pair plus the existing iframe preview).

### [7/13/2026]
**What changed:** The "Map location" field now also accepts pasted Google Maps links (copied
from a desktop browser's address bar), not just raw coordinates or a plain address. Added
`extractLatLng()` and `buildMapEmbedUrl()` helpers in `app.js` that recognize several common
Google Maps URL formats and pull the coordinates out automatically.
**Why:** The person testing this found that pasting a real Google Maps link didn't work — only
coordinates or a typed address did, which isn't how most people naturally copy a location.
**Approach chosen / limitation:** Shortened share links (`maps.app.goo.gl/...`, what mobile's
"Share" button usually gives) can't be resolved this way — reading where they redirect to would
require a server-side request, which this static site doesn't have. The admin field's helper
text now explains this and tells the admin to copy the full link from a desktop browser instead.
If shortened-link support becomes important later, it would need a small server-side redirect
resolver (e.g. a Supabase Edge Function).
**Files touched:** `app.js` (new helpers), `profile.js` (uses `buildMapEmbedUrl` instead of
building the URL inline), `admin.html` (updated field helper text).

### [7/12/2026]
**What changed:** Added a location map to individual business profile pages (`profile.html`
only — deliberately not on the directory/showcase cards, to avoid crowding them). New
`map_location` text column on the `businesses` table. New "Map location" field in the admin
panel, accepting either coordinates ("lat,lng") or a plain address/place name. Renders as an
embedded Google Maps iframe on the profile page only if a value is set.
**Why:** Lets visitors see exactly where a business is located once they've clicked into its
profile, without cluttering the browsing/showcase grid views.
**Approach chosen:** Used Google's no-API-key embed pattern (`google.com/maps?q=...&output=embed`)
rather than the official Maps Embed API, which requires an API key and billing setup. This keeps
the feature free and simple, consistent with the rest of the project's low-overhead approach.
If this ever needs to become more robust (custom markers, styling, multiple pins), revisit with
a real Maps API key at that point.
**Files touched:** `sql/schema.sql` (reference copy; live DB updated via a one-off `alter table`
in Supabase SQL Editor), `app.js` (row↔business mapping), `profile.js` (map rendering, shown
conditionally), `style.css` (`.profile-map` container), `admin.html` (new Map location field),
`admin.js` (read/write that field).

### [7/12/2026]
**What changed:** Added a photo/profile picture for businesses. New `image_url` text column on
the `businesses` table (Supabase). New "Photo URL" field in the admin panel. Business cards on
the directory, showcase, and profile pages now show that photo if set, or a letter-avatar
fallback (first letter of the business name, styled like the plaque badge) if no photo is set.
**Why:** To give each business a little visual branding/identity on their card, making listings
more recognizable at a glance rather than plain text-only cards.
**Approach chosen:** Store a link (URL) to an image already hosted elsewhere (e.g. an Instagram
photo, a public Google Drive image link), rather than building direct file upload via Supabase
Storage. This kept the change small and consistent with how Instagram/Facebook links already
work in this project. Direct file upload is a reasonable future upgrade if pasting links proves
inconvenient in practice.
**Files touched:** `sql/schema.sql` (reference copy updated; live DB updated via a one-off
`alter table` run directly in Supabase SQL Editor), `app.js` (row↔business mapping, avatar
helper, directory card), `showcase.js` (showcase card), `profile.js` (profile page), `style.css`
(`.plaque-avatar` / `.plaque-avatar-fallback` / `.profile-avatar` styles), `admin.html` (new
Photo URL field), `admin.js` (read/write that field).
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

