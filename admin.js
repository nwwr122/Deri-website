/* =========================================================
   DERÎ — admin panel logic (Supabase Auth version)
   -----------------------------------------------------------
   Login now goes through Supabase's real authentication system.
   There is no password anywhere in this file — signInWithPassword
   sends the credentials directly to Supabase, which verifies them
   server-side. Only a session Supabase itself issues will let the
   Row Level Security policies (see sql/schema.sql) allow writes.

   SETUP STEP (one-time, done by you, not in this code):
   Supabase Dashboard → Authentication → Users → Add user
   Create exactly one user with your own email + a real password.
   Nobody else can sign up through this page — there is no public
   sign-up form, only sign-in.
   ========================================================= */

let editingId = null;
let formLang = 'en';
let toastTimer = null;

// IMPORTANT: this must be your real live site address, so every QR code
// works from any phone regardless of where the admin panel happens to be
// running (including testing locally). Update this if you ever move to
// a custom domain (see PROJECT_CONTEXT.md).
const SITE_BASE_URL = 'https://nwwr122.github.io/Deri-website';

function showQrCode(id) {
  const list = STORE.getCached();
  const biz = list.find(b => b.id === id);
  if (!biz) return;

  const name = biz.name.en || biz.name.ku || biz.name.ar || 'Business';
  // The &src=qr marker is what lets profile.html tell a real QR scan
  // apart from someone just clicking through the site normally — only
  // visits with this marker increment the scan counter.
  const url = `${SITE_BASE_URL}/profile.html?id=${encodeURIComponent(biz.id)}&src=qr`;

  document.getElementById('qrModalTitle').textContent = name;
  document.getElementById('qrUrlText').textContent = url;

  const canvas = document.getElementById('qrCanvas');
  QRCode.toCanvas(canvas, url, { width: 240, margin: 2 }, (err) => {
    if (err) {
      showToast('Could not generate QR code — check the console.', true);
      console.error(err);
      return;
    }
    document.getElementById('qrModalOverlay').style.display = 'flex';
  });

  const downloadBtn = document.getElementById('qrDownloadBtn');
  downloadBtn.onclick = () => {
    const link = document.createElement('a');
    const safeName = name.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
    link.download = `deri-qr-${safeName}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };
}

function closeQrModal() {
  document.getElementById('qrModalOverlay').style.display = 'none';
}

function showToast(message, isError) {
  const toast = document.getElementById('adminToast');
  if (!toast) return;
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.toggle('error', !!isError);
  toast.classList.add('show');
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

async function checkLogin() {
  const { data } = await sb.auth.getSession();
  return !!data.session;
}

async function attemptLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const err = document.getElementById('loginError');
  err.style.display = 'none';

  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) {
    err.textContent = error.message;
    err.style.display = 'block';
    return;
  }
  await showAdminPanel();
}

async function logout() {
  await sb.auth.signOut();
  location.reload();
}

async function showAdminPanel() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('adminPanel').style.display = 'block';
  populateCategorySelect();
  populateCitySelect();
  await STORE.fetchAll();
  renderAdminTable();
}

function populateCategorySelect() {
  const sel = document.getElementById('categorySelect');
  sel.innerHTML = CATEGORIES.filter(c => c.id !== 'all')
    .map(c => `<option value="${c.id}">${c.en} / ${c.ku} / ${c.ar}</option>`)
    .join('');
}

function populateCitySelect() {
  const sel = document.getElementById('citySelect');
  sel.innerHTML = CITIES.filter(c => c.id !== 'all')
    .map(c => `<option value="${c.id}">${c.en}</option>`)
    .join('');
}

function setFormLang(lang) {
  formLang = lang;
  document.querySelectorAll('.field-tabs button').forEach(b => b.classList.toggle('active', b.dataset.flang === lang));
  document.querySelectorAll('.lang-block').forEach(b => b.classList.remove('active'));
  document.getElementById('langBlock_' + lang).classList.add('active');
}

function renderAdminTable() {
  const list = STORE.getCached();
  const tbody = document.getElementById('bizTableBody');
  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5">No businesses yet — add the first one above.</td></tr>`;
    return;
  }
  tbody.innerHTML = list.map(b => `
    <tr>
      <td>${escapeHtml(b.name.en || b.name.ku || b.name.ar)}</td>
      <td>${cityLabel(b.city)}</td>
      <td>${catLabel(b.category)}</td>
      <td>${escapeHtml(b.neighborhood)}</td>
      <td>${b.scans || 0}</td>
      <td><button class="btn small outline" onclick="showQrCode('${b.id}')">QR Code</button></td>
      <td class="row-actions">
        <button class="btn small outline" onclick="editBusiness('${b.id}')">Edit</button>
        <button class="btn small rust" onclick="deleteBusiness('${b.id}')">Delete</button>
      </td>
    </tr>
  `).join('');
}

function clearForm() {
  editingId = null;
  document.getElementById('bizForm').reset();
  document.getElementById('formTitle').textContent = 'زیادکرنا کاروبارەکێ';
  document.getElementById('submitBtnLabel').textContent = 'پاراستنا کاروبارێ';
  setFormLang('en');
}

function editBusiness(id) {
  const list = STORE.getCached();
  const b = list.find(x => x.id === id);
  if (!b) return;
  editingId = id;
  document.getElementById('formTitle').textContent = 'دەستکاریکرنا کاروبارێ';
  document.getElementById('submitBtnLabel').textContent = 'نویکرنا کاروبارێ';

  document.getElementById('name_en').value = b.name.en || '';
  document.getElementById('name_ku').value = b.name.ku || '';
  document.getElementById('name_ar').value = b.name.ar || '';
  document.getElementById('desc_en').value = b.desc.en || '';
  document.getElementById('desc_ku').value = b.desc.ku || '';
  document.getElementById('desc_ar').value = b.desc.ar || '';
  document.getElementById('citySelect').value = b.city || 'duhok';
  document.getElementById('categorySelect').value = b.category;
  document.getElementById('neighborhoodInput').value = b.neighborhood;
  document.getElementById('phoneInput').value = b.phone;
  document.getElementById('whatsappInput').value = b.whatsapp;
  document.getElementById('instagramInput').value = b.instagram;
  document.getElementById('facebookInput').value = b.facebook;
  document.getElementById('imageUrlInput').value = b.imageUrl || '';
  document.getElementById('mapLocationInput').value = b.mapLocation || '';
  document.getElementById('galleryUrlsInput').value = b.galleryUrls || '';
  document.getElementById('scansInput').value = b.scans || 0;

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function deleteBusiness(id) {
  if (!confirm('ئەرێ دڤێت ئەڤ کاروبارە ژێ ببەی؟ ئەڤ کارە ناگەڕێتەوە.')) return;
  const ok = await STORE.remove(id);
  if (ok) {
    renderAdminTable();
    showToast('کاروبار هاتە ژێبرن.');
  } else {
    showToast('Delete failed — check the console for details.', true);
  }
}

async function submitBizForm(e) {
  e.preventDefault();

  const record = {
    city: document.getElementById('citySelect').value,
    category: document.getElementById('categorySelect').value,
    neighborhood: document.getElementById('neighborhoodInput').value.trim(),
    phone: document.getElementById('phoneInput').value.trim(),
    whatsapp: document.getElementById('whatsappInput').value.trim(),
    instagram: document.getElementById('instagramInput').value.trim(),
    facebook: document.getElementById('facebookInput').value.trim(),
    imageUrl: document.getElementById('imageUrlInput').value.trim(),
    mapLocation: document.getElementById('mapLocationInput').value.trim(),
    galleryUrls: document.getElementById('galleryUrlsInput').value.trim(),
    scans: parseInt(document.getElementById('scansInput').value, 10) || 0,
    name: {
      en: document.getElementById('name_en').value.trim(),
      ku: document.getElementById('name_ku').value.trim(),
      ar: document.getElementById('name_ar').value.trim()
    },
    desc: {
      en: document.getElementById('desc_en').value.trim(),
      ku: document.getElementById('desc_ku').value.trim(),
      ar: document.getElementById('desc_ar').value.trim()
    }
  };

  if (!record.name.en && !record.name.ku && !record.name.ar) {
    alert('تکایە ناڤێ کاروبارێ بەلایەنی کەم ل زمانەکێ بنڤیسە.');
    return;
  }

  const wasEditing = !!editingId;
  const ok = editingId
    ? await STORE.update(editingId, record)
    : await STORE.insert(record);

  if (!ok) {
    showToast('خەلەتەک چێبوو د پاراستنێدا — تکایە کۆنسولا browserê ببینە بۆ زانیاریێن زێدەتر.', true);
    return;
  }

  clearForm();
  renderAdminTable();
  showToast(wasEditing ? '✓ کاروبار هاتە نویکرن.' : '✓ کاروبار هاتە زیادکرن.');

  if (!wasEditing) {
    // Newest business is last, since STORE.fetchAll() orders by created_at ascending.
    const list = STORE.getCached();
    const newest = list[list.length - 1];
    if (newest) showQrCode(newest.id);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  if (await checkLogin()) await showAdminPanel();

  const loginBtn = document.getElementById('loginBtn');
  if (loginBtn) loginBtn.addEventListener('click', attemptLogin);

  document.querySelectorAll('#loginScreen input').forEach(input => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') attemptLogin();
    });
  });

  const form = document.getElementById('bizForm');
  if (form) form.addEventListener('submit', submitBizForm);
});
