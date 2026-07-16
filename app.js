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
    city: row.city || 'duhok',
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
    city: b.city,
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
  { id: 'all', en: 'All', ku: 'هەمی', ar: 'الكل' },
  { id: 'grocery', en: 'Grocery & Household Goods', ku: 'دوکان و کەلوپەلێن مالێ', ar: 'بقالة ولوازم منزلية' },
  { id: 'household_services', en: 'Home Services', ku: 'خزمەتگوزاریێن مالێ', ar: 'خدمات منزلية' },
  { id: 'clinic', en: 'Clinics & Pharmacies', ku: 'کلینیک و دەرمانخانە', ar: 'عيادات وصيدليات' },
  { id: 'restaurant', en: 'Restaurants', ku: 'خواردنگەه', ar: 'مطاعم' },
  { id: 'cafe_entertainment', en: 'Cafés & Entertainment', ku: 'قاوەخانە و شوێنێن شایی', ar: 'مقاهي وترفيه' },
  { id: 'mobile', en: 'Mobile & Electronics', ku: 'مۆبایل و ئەلیکترۆنیات', ar: 'موبايلات وإلكترونيات' },
  { id: 'tutoring', en: 'Tutoring', ku: 'فێرکاری', ar: 'دروس خصوصية' },
  { id: 'salon', en: 'Salon & Barber', ku: 'سالۆن و بەربەر', ar: 'صالون وحلاقة' },
  { id: 'other', en: 'Other', ku: 'یێن دی', ar: 'أخرى' }
];

const CITIES = [
  { id: 'all', en: 'All Areas', ku: 'هەمی هەرێمان', ar: 'كل المناطق' },
  { id: 'duhok', en: 'Duhok', ku: 'دهۆک', ar: 'دهوك' },
  { id: 'shexan', en: 'Shexan', ku: 'شێخان', ar: 'الشيخان' }
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
    areaFilterLabel: 'Area', categoryFilterLabel: 'Category',
    viewOnMaps: 'View on Maps', getDirections: 'Get Directions',
    footer: 'DERÎ — a directory built from doorstep leaflets.'
  },
  ku: {
    tagline: 'کاروبارێن هەرێمی، ل بەردەری تە',
    heroTitle: 'کاروبارەکێ باش ل نێزیک خۆ ببینە',
    heroSub: 'DERÎ کاروبارێن راستین یێن هەرێمی تۆمار دکەت — هەمان کاروبارێن کو ب بەڵاوکێن دەرگەهان دگەهنە بەردەری تە. ب ناڤ، پۆل یان گەڕەک بگەڕێ.',
    searchPlaceholder: 'ل کاروبار یان گەڕەک بگەڕێ...',
    resultsFor: 'کاروبار',
    emptyState: 'هیچ کاروبارەک ب گونجانا گەڕانا تە نەهاتە دیتن. پۆلەکێ دی هەوڵ بدە.',
    call: 'تەلەفۆن', whatsapp: 'واتساپ', social: 'تۆڕێن کۆمەڵایەتی',
    scans: 'ژمارا سکانێن بەڵاوکێن ڤێ مانگێ',
    admin: 'ئەدمین',
    areaFilterLabel: 'هەرێم', categoryFilterLabel: 'پۆل',
    viewOnMaps: 'ل نەخشە ببینە', getDirections: 'ڕێنمایا شوێنێ',
    footer: 'DERÎ — بەڕێڤەبەرا کاروباران یا دروستکری ژ بەڵاوکێن دەرگەهان.'
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
    areaFilterLabel: 'المنطقة', categoryFilterLabel: 'الفئة',
    viewOnMaps: 'عرض على الخرائط', getDirections: 'الحصول على الاتجاهات',
    footer: 'DERÎ — دليل مبني من منشورات الأبواب.'
  }
};

const LANG_STORAGE_KEY = 'deri_lang';

function getSavedLang() {
  try {
    return localStorage.getItem(LANG_STORAGE_KEY) || 'ku';
  } catch (e) {
    return 'ku'; // localStorage unavailable (rare) — fall back to default
  }
}

let currentLang = getSavedLang();

function t(key) { return STRINGS[currentLang][key]; }

function syncLangButtonsUI() {
  document.querySelectorAll('.lang-switch button').forEach(b => {
    b.classList.toggle('active', b.dataset.lang === currentLang);
  });
}

function applyLangDirection() {
  document.documentElement.lang = currentLang;
  document.body.dir = (currentLang === 'ar' || currentLang === 'ku') ? 'rtl' : 'ltr';
}

function setLang(lang) {
  currentLang = lang;
  try { localStorage.setItem(LANG_STORAGE_KEY, lang); } catch (e) { /* ignore */ }
  applyLangDirection();
  syncLangButtonsUI();
  renderStaticStrings();
  renderPublicPage();
  if (typeof renderShowcasePage === 'function') renderShowcasePage();
  if (typeof renderProfilePage === 'function') renderProfilePage();
}

function catLabel(catId) {
  const c = CATEGORIES.find(c => c.id === catId) || CATEGORIES[CATEGORIES.length - 1];
  return c[currentLang] || c.en;
}

function cityLabel(cityId) {
  const c = CITIES.find(c => c.id === cityId);
  return c ? (c[currentLang] || c.en) : cityId;
}

let activeCategory = 'all';
let activeCity = 'all';
let searchQuery = '';

function renderCategoryStrip() {
  const strip = document.getElementById('categoryStrip');
  if (!strip) return;
  strip.innerHTML = '';
  CATEGORIES.forEach(c => {
    const btn = document.createElement('button');
    btn.className = 'cat-pill' + (activeCategory === c.id ? ' active' : '');
    btn.innerHTML = categoryIcon(c.id) + `<span>${escapeHtml(c[currentLang] || c.en)}</span>`;
    btn.onclick = () => { activeCategory = c.id; renderPublicPage(); };
    strip.appendChild(btn);
  });
}

function renderCityStrip() {
  const strip = document.getElementById('cityStrip');
  if (!strip) return;
  strip.innerHTML = '';
  CITIES.forEach(c => {
    const btn = document.createElement('button');
    btn.className = 'city-pill' + (activeCity === c.id ? ' active' : '');
    btn.textContent = c[currentLang] || c.en;
    btn.onclick = () => { activeCity = c.id; renderPublicPage(); };
    strip.appendChild(btn);
  });
}

function matchesSearch(biz, q) {
  if (!q) return true;
  q = q.toLowerCase();
  const haystack = [
    biz.name.en, biz.name.ku, biz.name.ar,
    biz.neighborhood, catLabel(biz.category), cityLabel(biz.city)
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
    (activeCity === 'all' || b.city === activeCity) &&
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
    return `
      <article class="plaque" onclick="location.href='profile.html?id=${b.id}'">
        <span class="badge">No. ${num}</span>
        ${businessAvatarHtml(b, name)}
        <span class="cat-tag">${categoryIcon(b.category)}${catLabel(b.category)}</span>
        <h3>${escapeHtml(name)}</h3>
        <div class="neigh">📍 ${escapeHtml(b.neighborhood)}${b.neighborhood ? ', ' : ''}${escapeHtml(cityLabel(b.city))}</div>
        <p class="desc">${escapeHtml(desc)}</p>
        <div class="actions">
          ${b.phone ? `<a class="call" href="tel:${b.phone}" onclick="event.stopPropagation()">${ICONS.phone}${t('call')}</a>` : ''}
          ${waLink ? `<a class="whatsapp" href="${waLink}" target="_blank" rel="noopener" onclick="event.stopPropagation()">${ICONS.whatsapp}${t('whatsapp')}</a>` : ''}
          ${b.instagram ? `<a class="social" href="${b.instagram}" target="_blank" rel="noopener" onclick="event.stopPropagation()">${ICONS.instagram}Instagram</a>` : ''}
          ${b.facebook ? `<a class="social" href="${b.facebook}" target="_blank" rel="noopener" onclick="event.stopPropagation()">${ICONS.facebook}Facebook</a>` : ''}
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
    footer: '[data-i18n="footer"]',
    areaFilterLabel: '[data-i18n="areaFilterLabel"]',
    categoryFilterLabel: '[data-i18n="categoryFilterLabel"]'
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
  renderCityStrip();
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
// Small inline icons (generic line-icon style, not brand logos) used
// alongside button text so actions are recognizable at a glance.
const ICONS = {
  phone: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
  whatsapp: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>',
  instagram: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>',
  facebook: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>',
  pin: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  directions: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>'
};

// One consistent icon per category, used on filter pills and card tags
// so categories are recognizable at a glance, not just by reading text.
const CATEGORY_ICONS = {
  all: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
  grocery: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>',
  household_services: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94z"/></svg>',
  clinic: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M12 8v8M8 12h8"/></svg>',
  restaurant: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2a2 2 0 0 0 2-2V2M7 2v20M17 2v20M17 2a4 4 0 0 0-4 4v3a2 2 0 0 0 2 2h2"/></svg>',
  cafe_entertainment: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" y1="2" x2="6" y2="4"/><line x1="10" y1="2" x2="10" y2="4"/><line x1="14" y1="2" x2="14" y2="4"/></svg>',
  mobile: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>',
  tutoring: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
  salon: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>',
  other: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/></svg>'
};

function categoryIcon(catId) {
  return CATEGORY_ICONS[catId] || CATEGORY_ICONS.other;
}

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
  // Apply the visitor's saved language choice (or the Badini default)
  // right away, so the page opens correctly instead of flashing English/LTR first.
  applyLangDirection();
  syncLangButtonsUI();
  renderStaticStrings();

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
