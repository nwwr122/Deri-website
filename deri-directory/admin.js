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
  await STORE.fetchAll();
  renderAdminTable();
}

function populateCategorySelect() {
  const sel = document.getElementById('categorySelect');
  sel.innerHTML = CATEGORIES.filter(c => c.id !== 'all')
    .map(c => `<option value="${c.id}">${c.en} / ${c.ku} / ${c.ar}</option>`)
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
      <td>${catLabel(b.category)}</td>
      <td>${escapeHtml(b.neighborhood)}</td>
      <td>${b.scans || 0}</td>
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
  document.getElementById('formTitle').textContent = 'Add a business';
  document.getElementById('submitBtnLabel').textContent = 'Save business';
  setFormLang('en');
}

function editBusiness(id) {
  const list = STORE.getCached();
  const b = list.find(x => x.id === id);
  if (!b) return;
  editingId = id;
  document.getElementById('formTitle').textContent = 'Edit business';
  document.getElementById('submitBtnLabel').textContent = 'Update business';

  document.getElementById('name_en').value = b.name.en || '';
  document.getElementById('name_ku').value = b.name.ku || '';
  document.getElementById('name_ar').value = b.name.ar || '';
  document.getElementById('desc_en').value = b.desc.en || '';
  document.getElementById('desc_ku').value = b.desc.ku || '';
  document.getElementById('desc_ar').value = b.desc.ar || '';
  document.getElementById('categorySelect').value = b.category;
  document.getElementById('neighborhoodInput').value = b.neighborhood;
  document.getElementById('phoneInput').value = b.phone;
  document.getElementById('whatsappInput').value = b.whatsapp;
  document.getElementById('instagramInput').value = b.instagram;
  document.getElementById('facebookInput').value = b.facebook;
  document.getElementById('scansInput').value = b.scans || 0;

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function deleteBusiness(id) {
  if (!confirm('Delete this business listing? This cannot be undone.')) return;
  const ok = await STORE.remove(id);
  if (ok) renderAdminTable();
}

async function submitBizForm(e) {
  e.preventDefault();

  const record = {
    category: document.getElementById('categorySelect').value,
    neighborhood: document.getElementById('neighborhoodInput').value.trim(),
    phone: document.getElementById('phoneInput').value.trim(),
    whatsapp: document.getElementById('whatsappInput').value.trim(),
    instagram: document.getElementById('instagramInput').value.trim(),
    facebook: document.getElementById('facebookInput').value.trim(),
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
    alert('Please enter a business name in at least one language.');
    return;
  }

  const ok = editingId
    ? await STORE.update(editingId, record)
    : await STORE.insert(record);

  if (!ok) {
    alert('Something went wrong saving this business — check the browser console for details.');
    return;
  }

  clearForm();
  renderAdminTable();
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
