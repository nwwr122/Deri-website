/* =========================================================
   DERÎ — shared data layer (Supabase-backed)
   -----------------------------------------------------------
   All business data lives in a real Supabase database now.
   The "sb" client and connection details come from
   supabase-config.js, which must be loaded before this file.

   Data is cached in-memory in `cachedBusinesses` after each
   fetch, so language-switching and re-rendering can stay fast
   and synchronous — only STORE.fetchAll() actually talks to
   the network. Writes (insert/update/delete) go straight to
   Supabase and then refresh the cache.
   ========================================================= */

let cachedBusinesses = [];

// Convert a Supabase row (flat columns) into the nested shape
// the rest of the app already expects: { name: {en,ku,ar}, desc: {en,ku,ar}, ... }
function rowToBusiness(row) {
  return {
    id: row.id,
    category: row.category,
    neighborhood: row.neighborhood || '',
    phone: row.phone || '',
    whatsapp: row.whatsapp || '',
    instagram: row.instagram || '',
    facebook: row.facebook || '',
    scans: row.scans || 0,
    imageUrl: row.image_url || '',
    mapLocation: row.map_location || '',
    name: { en: row.name_en || '', ku: row.name_ku || '', ar: row.name_ar || '' },
    desc: { en: row.desc_en || '', ku: row.desc_ku || '', ar: row.desc_ar || '' }
  };
}

// Convert the app's nested business shape back into flat columns for Supabase
function businessToRow(b) {
  return {
    category: b.category,
    neighborhood: b.neighborhood,
    phone: b.phone,
    whatsapp: b.whatsapp,
    instagram: b.instagram,
    facebook: b.facebook,
    scans: b.scans,
    image_url: b.imageUrl,
    map_location: b.mapLocation,
    name_en: b.name.en,
    name_ku: b.name.ku,
    name_ar: b.name.ar,
    desc_en: b.desc.en,
    desc_ku: b.desc.ku,
    desc_ar: b.desc.ar
  };
}

const STORE = {
  // Fetches everything from Supabase and refreshes the local cache.
  // Call this once on page load, and again after any admin write.
  async fetchAll() {
    const { data, error } = await sb
      .from('businesses')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) {
      console.error('DERÎ: failed to load businesses', error);
      cachedBusinesses = [];
      return cachedBusinesses;
    }
    cachedBusinesses = data.map(rowToBusiness);
    return cachedBusinesses;
  },

  // Synchronous read of whatever was last fetched — safe to call
  // often (e.g. on every language switch) without hitting the network.
  getCached() {
    return cachedBusinesses;
  },

  async insert(business) {
    const { error } = await sb.from('businesses').insert(businessToRow(business));
    if (error) { console.error('DERÎ: insert failed', error); return false; }
    await STORE.fetchAll();
    return true;
  },

  async update(id, business) {
    const { error } = await sb.from('businesses').update(businessToRow(business)).eq('id', id);
    if (error) { console.error('DERÎ: update failed', error); return false; }
    await STORE.fetchAll();
    return true;
  },

  async remove(id) {
    const { error } = await sb.from('businesses').delete().eq('id', id);
    if (error) { console.error('DERÎ: delete failed', error); return false; }
    await STORE.fetchAll();
    return true;
  },

  // Public, login-free: bumps a business's scan count by exactly 1
  // via a Postgres function, so a QR scan never needs an admin session.
  async incrementScan(id) {
    const { error } = await sb.rpc('increment_scan', { business_id: id });
    if (error) console.error('DERÎ: scan increment failed', error);
  }
};

const CATEGORIES = [
  { id: 'all', en: 'All', ku: 'Hemû', ar: 'الكل' },
  { id: 'grocery', en: 'Grocery & Household Goods', ku: 'Dikan û Kelûpelên Malê', ar: 'بقالة ولوازم منزلية' },
  { id: 'household_services', en: 'Home Services', ku: 'Xizmetên Malê', ar: 'خدمات منزلية' },
  { id: 'clinic', en: 'Clinics & Pharmacies', ku: 'Klînîk û Dermanxane', ar: 'عيادات وصيدليات' },
  { id: 'restaurant', en: 'Restaurants', ku: 'Xwaringeh', ar: 'مطاعم' },
  { id: 'cafe_entertainment', en: 'Cafés & Entertainment', ku: 'Qehwexane û Cîhên Şahiyê', ar: 'مقاهي وترفيه' },
  { id: 'mobile', en: 'Mobile & Electronics', ku: 'Mobîl û Elektronîk', ar: 'موبايلات وإلكترونيات' },
  { id: 'tutoring', en: 'Tutoring', ku: 'Fêrkirin', ar: 'دروس خصوصية' },
  { id: 'salon', en: 'Salon & Barber', ku: 'Salon û Berber', ar: 'صالون وحلاقة' },
  { id: 'other', en: 'Other', ku: 'Yên din', ar: 'أخرى' }
];

const STRINGS = {
  en: {
    tagline: 'Local businesses, found at your door',
    heroTitle: 'Find a good business near you',
    heroSub: 'DERÎ lists real local businesses — the same ones reaching your doorstep on printed leaflets. Search by name, category, or neighborhood.',
    searchPlaceholder: 'Search businesses or neighborhoods…',
    resultsFor: 'businesses',
    emptyState: 'No businesses match your search yet. Try another category.',
    call: 'Call', whatsapp: 'WhatsApp', social: 'Social',
    scans: 'leaflet scans this month',
    admin: 'Admin',
    footer: 'DERÎ — a directory built from doorstep leaflets.'
  },
  ku: {
    tagline: 'Karsaziyên herêmî, li ber derê te',
    heroTitle: 'Karsaziyek baş li nêzîk xwe bibîne',
    heroSub: 'DERÎ karsaziyên rastîn ên herêmî tomar dike — heman karsaziyên ku bi kaxezên belavokê digihên derê te. Li gorî nav, kategorî, an taxê lêbigere.',
    searchPlaceholder: 'Li karsazî an taxê bigere…',
    resultsFor: 'karsazî',
    emptyState: 'Ti karsazî li gorî lêgerîna te nehat dîtin. Kategorek din biceribîne.',
    call: 'Telefon', whatsapp: 'WhatsApp', social: 'Medya',
    scans: 'skanên belavokê vê mehê',
    admin: 'Admîn',
    footer: 'DERÎ — pêrista ku ji belavokên deriyan pêk hatiye.'
  },
  ar: {
    tagline: 'أعمال محلية، تصلك عند بابك',
    heroTitle: 'ابحث عن عمل جيد قريب منك',
    heroSub: 'دليل DERÎ يضم أعمالاً محلية حقيقية — نفس الأعمال التي تصلك عبر منشورات الأبواب. ابحث بالاسم أو الفئة أو الحي.',
    searchPlaceholder: 'ابحث عن عمل أو حي…',
    resultsFor: 'عمل',
    emptyState: 'لا توجد أعمال مطابقة لبحثك بعد. جرّب فئة أخرى.',
    call: 'اتصال', whatsapp: 'واتساب', social: 'التواصل',
    scans: 'مسح للمنشور هذا الشهر',
    admin: 'الإدارة',
    footer: 'DERÎ — دليل مبني من منشورات الأبواب.'
  }
};

let currentLang = 'en';

function t(key) { return STRINGS[currentLang][key]; }

function setLang(lang) {
  currentLang = lang;
  document.documentElement.lang = lang;
  document.body.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.querySelectorAll('.lang-switch button').forEach(b => {
    b.classList.toggle('active', b.dataset.lang === lang);
  });
  renderStaticStrings();
  renderPublicPage();
  if (typeof renderShowcasePage === 'function') renderShowcasePage();
  if (typeof renderProfilePage === 'function') renderProfilePage();
}

function catLabel(catId) {
  const c = CATEGORIES.find(c => c.id === catId) || CATEGORIES[CATEGORIES.length - 1];
  return c[currentLang] || c.en;
}

let activeCategory = 'all';
let searchQuery = '';

function renderCategoryStrip() {
  const strip = document.getElementById('categoryStrip');
  if (!strip) return;
  strip.innerHTML = '';
  CATEGORIES.forEach(c => {
    const btn = document.createElement('button');
    btn.className = 'cat-pill' + (activeCategory === c.id ? ' active' : '');
    btn.textContent = c[currentLang] || c.en;
    btn.onclick = () => { activeCategory = c.id; renderPublicPage(); };
    strip.appendChild(btn);
  });
}

function matchesSearch(biz, q) {
  if (!q) return true;
  q = q.toLowerCase();
  const haystack = [
    biz.name.en, biz.name.ku, biz.name.ar,
    biz.neighborhood, catLabel(biz.category)
  ].join(' ').toLowerCase();
  return haystack.includes(q);
}

function renderBusinessGrid() {
  const grid = document.getElementById('bizGrid');
  const countEl = document.getElementById('resultCount');
  if (!grid) return;
  const all = STORE.getCached();
  const filtered = all.filter(b =>
    (activeCategory === 'all' || b.category === activeCategory) &&
    matchesSearch(b, searchQuery)
  );

  if (countEl) countEl.textContent = `${filtered.length} ${t('resultsFor')}`;

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="empty-state">${t('emptyState')}</div>`;
    return;
  }

  grid.innerHTML = filtered.map((b, i) => {
    const name = b.name[currentLang] || b.name.en;
    const desc = b.desc[currentLang] || b.desc.en;
    const num = String(i + 1).padStart(3, '0');
    const waLink = b.whatsapp ? `https://wa.me/${b.whatsapp.replace(/[^0-9]/g, '')}` : null;
    const social = b.instagram || b.facebook;
    return `
      <article class="plaque" onclick="location.href='profile.html?id=${b.id}'">
        <span class="badge">No. ${num}</span>
        ${businessAvatarHtml(b, name)}
        <span class="cat-tag">${catLabel(b.category)}</span>
        <h3>${escapeHtml(name)}</h3>
        <div class="neigh">📍 ${escapeHtml(b.neighborhood)}</div>
        <p class="desc">${escapeHtml(desc)}</p>
        <div class="actions">
          ${b.phone ? `<a class="call" href="tel:${b.phone}" onclick="event.stopPropagation()">${t('call')}</a>` : ''}
          ${waLink ? `<a class="whatsapp" href="${waLink}" target="_blank" rel="noopener" onclick="event.stopPropagation()">${t('whatsapp')}</a>` : ''}
          ${social ? `<a class="social" href="${social}" target="_blank" rel="noopener" onclick="event.stopPropagation()">${t('social')}</a>` : ''}
        </div>
        <div class="scans">📶 ${b.scans || 0} ${t('scans')}</div>
      </article>
    `;
  }).join('');
}

function renderStaticStrings() {
  const map = {
    tagline: '[data-i18n="tagline"]',
    heroTitle: '[data-i18n="heroTitle"]',
    heroSub: '[data-i18n="heroSub"]',
    admin: '[data-i18n="admin"]',
    footer: '[data-i18n="footer"]'
  };
  Object.entries(map).forEach(([key, sel]) => {
    const el = document.querySelector(sel);
    if (el) el.textContent = t(key);
  });
  const search = document.getElementById('searchInput');
  if (search) search.placeholder = t('searchPlaceholder');
}

function renderPublicPage() {
  if (!document.getElementById('bizGrid')) return;
  renderStaticStrings();
  renderCategoryStrip();
  renderBusinessGrid();
}

// Tries to pull "lat,lng" out of a pasted Google Maps URL, in whatever
// format Google happens to be using (varies by how the link was copied).
// Returns null if it can't find coordinates — the caller falls back to
// treating the raw text as a place name/address instead.
function extractLatLng(raw) {
  if (!raw) return null;
  const patterns = [
    /!3d(-?\d{1,3}\.\d+)!4d(-?\d{1,3}\.\d+)/,         // precise place-marker coords — check this FIRST
    /[?&]q=(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/,        // ?q=36.86,42.98
    /[?&]ll=(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/,       // ?ll=36.86,42.98
    /^\s*(-?\d{1,3}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)\s*$/,  // plain "lat,lng" typed directly
    /@(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/              // map-viewport-center coords — least precise, check LAST
  ];
  for (const re of patterns) {
    const m = raw.match(re);
    if (m) return `${m[1]},${m[2]}`;
  }
  return null;
}

// Builds all three map-related URLs from whatever the admin pasted:
// coordinates, a full (non-shortened) Google Maps link, or a plain address.
// - embedUrl: for the visual iframe preview (can be blocked by some
//   browser extensions/ad-blockers — not reliable on its own)
// - viewUrl / directionsUrl: plain links that open Google Maps in a new
//   tab — these work everywhere, no embedding involved, so they're the
//   dependable fallback if the preview above them doesn't render.
function buildMapLinks(rawLocation) {
  if (!rawLocation) return null;
  const trimmed = rawLocation.trim();
  const isUrl = /^https?:\/\//i.test(trimmed);
  const coords = extractLatLng(trimmed);

  // "View on Maps": prefer opening the pasted link exactly as-is, so the
  // full business profile (reviews, hours, photos) shows — not just a pin.
  const viewUrl = isUrl
    ? trimmed
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trimmed)}`;

  // The embed preview and "Get Directions" need an actual coordinate or a
  // plain address/name to work — a raw link (especially a shortened one
  // with no coordinates inside it) isn't usable as a search query for
  // these, so skip them gracefully rather than showing something broken.
  const searchableQuery = coords || (!isUrl ? trimmed : null);
  const embedUrl = searchableQuery
    ? `https://www.google.com/maps?q=${encodeURIComponent(searchableQuery)}&output=embed`
    : null;
  const directionsUrl = searchableQuery
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(searchableQuery)}`
    : null;

  return { viewUrl, embedUrl, directionsUrl };
}

// Renders a business's photo if it has one, otherwise a letter-avatar
// fallback so cards without a photo yet still look intentional.
function businessAvatarHtml(business, displayName) {
  if (business.imageUrl) {
    return `<img class="plaque-avatar" src="${escapeHtml(business.imageUrl)}" alt="${escapeHtml(displayName)}" onerror="this.replaceWith(Object.assign(document.createElement('div'), {className:'plaque-avatar plaque-avatar-fallback', textContent:'${escapeHtml((displayName || '?').charAt(0).toUpperCase())}'}))">`;
  }
  const letter = (displayName || '?').charAt(0).toUpperCase();
  return `<div class="plaque-avatar plaque-avatar-fallback">${escapeHtml(letter)}</div>`;
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, s => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[s]);
}

document.addEventListener('DOMContentLoaded', async () => {
  // One fetch from Supabase, shared by whichever page we're on.
  await STORE.fetchAll();

  const search = document.getElementById('searchInput');
  if (search) {
    search.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderBusinessGrid();
    });
  }

  renderPublicPage(); // no-ops on pages without #bizGrid
  if (typeof renderShowcasePage === 'function') renderShowcasePage();
  if (typeof profileInit === 'function') await profileInit();
});
