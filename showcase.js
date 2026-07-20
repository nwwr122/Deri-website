/* =========================================================
   DERÎ — showcase page logic
   Pure display of every business profile, no search/filter.
   Reuses STORE, CATEGORIES, STRINGS, catLabel, escapeHtml
   and t() from app.js — this file only adds the rendering
   for the expanded profile-card layout.
   ========================================================= */

function renderShowcaseStrings() {
  const map = {
    tagline: '[data-i18n="tagline"]',
    admin: '[data-i18n="admin"]',
    footer: '[data-i18n="footer"]',
    showcaseTitle: '[data-i18n="showcaseTitle"]',
    showcaseSub: '[data-i18n="showcaseSub"]'
  };
  Object.entries(map).forEach(([key, sel]) => {
    const el = document.querySelector(sel);
    if (el && STRINGS[currentLang][key]) el.textContent = STRINGS[currentLang][key];
  });
}

// small additions to the shared STRINGS object, specific to this page
STRINGS.en.showcaseTitle = 'All business profiles';
STRINGS.en.showcaseSub = 'Every business currently listed on DERÎ, in full.';
STRINGS.ku.showcaseTitle = 'هەمی پرۆفایلێن کاروباران';
STRINGS.ku.showcaseSub = 'هەمی کاروبارێن تۆمارکری ل DERÎ، ب تەڤایی.';
STRINGS.ar.showcaseTitle = 'كل ملفات الأعمال';
STRINGS.ar.showcaseSub = 'كل الأعمال المسجّلة حالياً على DERÎ، كاملة.';

function renderShowcaseGrid() {
  const grid = document.getElementById('showcaseGrid');
  const countEl = document.getElementById('showcaseCount');
  if (!grid) return;

  const all = STORE.getCached();

  if (countEl) countEl.textContent = `${all.length} ${t('resultsFor')}`;

  if (all.length === 0) {
    grid.innerHTML = `<div class="empty-state">${t('emptyState')}</div>`;
    return;
  }

  grid.innerHTML = all.map((b) => {
    const name = b.name[currentLang] || b.name.en;
    return `
      <article class="plaque profile-plaque" onclick="location.href='profile.html?id=${b.id}'">
        ${businessAvatarHtml(b, name)}
        <span class="cat-tag">${categoryIcon(b.category)}${catLabel(b.category)}</span>
        <h3>${escapeHtml(name)}</h3>
        <div class="neigh">📍 ${escapeHtml(b.neighborhood)}${b.neighborhood ? ', ' : ''}${escapeHtml(cityLabel(b.city))}</div>
        <div class="scans">📶 ${b.scans || 0} ${t('scans')}</div>
        <div class="view-profile-strip">
          <span>${t('viewProfile')}</span>
          <span class="vp-arrow">${ICONS.chevronRight}</span>
        </div>
      </article>
    `;
  }).join('');
}

function renderShowcasePage() {
  if (!document.getElementById('showcaseGrid')) return;
  renderShowcaseStrings();
  renderShowcaseGrid();
}

// Note: this page's initial render is triggered by app.js's central
// DOMContentLoaded bootstrap, after it fetches data from Supabase —
// see the bottom of app.js.
