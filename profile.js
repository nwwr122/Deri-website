/* =========================================================
   DERÎ — single business profile page
   -----------------------------------------------------------
   This page is what a QR code on a printed leaflet should
   point to, one per business: profile.html?id=b1, ?id=b2, etc.

   Scan counting now goes through STORE.incrementScan(), which
   calls the increment_scan() Postgres function (see sql/schema.sql).
   That function is grantable to anonymous visitors specifically —
   so scanning a leaflet never requires logging in, but a visitor
   also can't touch anything else about the record.
   ========================================================= */

function getBusinessIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

function renderProfilePage() {
  const container = document.getElementById('profileContainer');
  if (!container) return;

  const id = getBusinessIdFromUrl();
  const list = STORE.getCached();
  const biz = list.find(b => b.id === id);

  if (!biz) {
    container.innerHTML = `<div class="profile-not-found">No business found for this link.</div>`;
    return;
  }

  const name = biz.name[currentLang] || biz.name.en;
  const desc = biz.desc[currentLang] || biz.desc.en;
  const waLink = biz.whatsapp ? `https://wa.me/${biz.whatsapp.replace(/[^0-9]/g, '')}` : null;
  const idx = list.findIndex(b => b.id === biz.id);
  const num = String(idx + 1).padStart(3, '0');

  const mapLinks = buildMapLinks(biz.mapLocation);

  container.innerHTML = `
    <div class="profile-card">
      <span class="badge">No. ${num}</span>
      ${businessAvatarHtml(biz, name).replace('plaque-avatar', 'plaque-avatar profile-avatar')}
      <span class="cat-tag">${catLabel(biz.category)}</span>
      <h1 class="profile-name">${escapeHtml(name)}</h1>
      <div class="neigh">📍 ${escapeHtml(biz.neighborhood)}${biz.neighborhood ? ', ' : ''}${escapeHtml(cityLabel(biz.city))}</div>
      <p class="desc">${escapeHtml(desc)}</p>
      <div class="profile-actions">
        ${biz.phone ? `<a class="call" href="tel:${biz.phone}">${ICONS.phone}${t('call')}</a>` : ''}
        ${waLink ? `<a class="whatsapp" href="${waLink}" target="_blank" rel="noopener">${ICONS.whatsapp}${t('whatsapp')}</a>` : ''}
        ${biz.instagram ? `<a class="social" href="${biz.instagram}" target="_blank" rel="noopener">${ICONS.instagram}Instagram</a>` : ''}
        ${biz.facebook ? `<a class="social" href="${biz.facebook}" target="_blank" rel="noopener">${ICONS.facebook}Facebook</a>` : ''}
      </div>
      ${mapLinks ? `
        <div class="profile-actions">
          <a class="call" href="${mapLinks.viewUrl}" target="_blank" rel="noopener">${ICONS.pin}View on Maps</a>
          ${mapLinks.directionsUrl ? `<a class="whatsapp" href="${mapLinks.directionsUrl}" target="_blank" rel="noopener">${ICONS.directions}Get Directions</a>` : ''}
        </div>
        ${mapLinks.embedUrl ? `
          <div class="profile-map">
            <iframe src="${mapLinks.embedUrl}" width="100%" height="220" style="border:0;" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
          </div>
        ` : ''}
      ` : ''}
      <div class="scans">📶 ${biz.scans || 0} ${t('scans')}</div>
    </div>
  `;
}

// Called once by app.js's central bootstrap, after STORE.fetchAll()
// has already populated the cache for this page load.
async function profileInit() {
  if (!document.getElementById('profileContainer')) return;
  const id = getBusinessIdFromUrl();
  if (id) {
    await STORE.incrementScan(id);
    await STORE.fetchAll(); // pick up the fresh count before rendering
  }
  renderProfilePage();
}
