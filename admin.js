/* ============================================
   ADMIN.JS — MIL DETALLES LAS TRES Y
   ============================================ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, getDocs, setDoc, deleteDoc, doc, addDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ── REEMPLAZA ESTOS DATOS CON LOS DE TU FIREBASE ──
const firebaseConfig = {
  apiKey: "AIzaSyCR8gKJwYzHsmc17-03mAP-sxlPCD0aA8g",
  authDomain: "reposteria-tresy.firebaseapp.com",
  projectId: "reposteria-tresy",
  storageBucket: "reposteria-tresy.firebasestorage.app",
  messagingSenderId: "416685984119",
  appId: "1:416685984119:web:dbeda575a2c032de6b7972"
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);
const DEFAULT_ADMIN = { user: 'admin', pass: 'admin123' };
let adminProducts = [];

document.addEventListener('DOMContentLoaded', () => {
  if (!localStorage.getItem('mtdy_admin_creds')) localStorage.setItem('mtdy_admin_creds', JSON.stringify(DEFAULT_ADMIN));
  if (localStorage.getItem('mtdy_admin_session') === 'active') showAdminPanel();
});

window.adminLogin = function() {
  const user = document.getElementById('adm-user').value.trim();
  const pass = document.getElementById('adm-pass').value;
  const creds = JSON.parse(localStorage.getItem('mtdy_admin_creds') || '{}');
  if (user === (creds.user||DEFAULT_ADMIN.user) && pass === (creds.pass||DEFAULT_ADMIN.pass)) {
    localStorage.setItem('mtdy_admin_session', 'active'); showAdminPanel();
  } else { showToast('Credenciales incorrectas', 'error'); }
};

window.adminLogout = function() {
  localStorage.removeItem('mtdy_admin_session');
  document.getElementById('admin-panel').style.display = 'none';
  document.getElementById('admin-login-screen').style.display = 'flex';
  showToast('Sesión cerrada', 'info');
};

async function showAdminPanel() {
  document.getElementById('admin-login-screen').style.display = 'none';
  document.getElementById('admin-panel').style.display = 'grid';
  await loadAdminProducts();
  renderDashboard(); renderAdminProducts(); renderOrders(); renderUsers(); loadSettingsForm();
}

async function loadAdminProducts() {
  try {
    const snapshot = await getDocs(collection(db, 'products'));
    adminProducts = [];
    snapshot.forEach(d => adminProducts.push({ id: d.id, ...d.data() }));
  } catch (e) { showToast('Error conectando Firebase', 'error'); }
}

window.adminTab = function(name, btn) {
  document.querySelectorAll('.admin-tab').forEach(t => { t.style.display = 'none'; t.classList.remove('active'); });
  document.querySelectorAll('.snav-btn').forEach(b => b.classList.remove('active'));
  const tab = document.getElementById(`tab-${name}`);
  if (tab) { tab.style.display = 'block'; tab.classList.add('active'); }
  if (btn) btn.classList.add('active');
  const titles = { dashboard:'Dashboard', products:'Productos', orders:'Pedidos', users:'Usuarios', settings:'Ajustes' };
  const el = document.getElementById('admin-page-title');
  if (el) el.textContent = titles[name] || name;
};

function renderDashboard() {
  document.getElementById('stat-products').textContent = adminProducts.length;
  const orders = JSON.parse(localStorage.getItem('mtdy_orders') || '[]');
  const users  = JSON.parse(localStorage.getItem('mtdy_users')  || '[]');
  const revenue = orders.reduce((s, o) => s + (o.total || 0), 0);
  document.getElementById('stat-orders').textContent  = orders.length;
  document.getElementById('stat-users').textContent   = users.length;
  document.getElementById('stat-revenue').textContent = '$' + Number(revenue).toLocaleString('es-CO');
  const lowStock = adminProducts.filter(p => p.stock <= 5);
  const el = document.getElementById('low-stock-list');
  if (el) el.innerHTML = lowStock.length === 0
    ? '<p style="color:var(--gray);font-size:.88rem;">✅ Todos tienen stock suficiente</p>'
    : lowStock.map(p => `<div class="low-stock-item"><span>${p.name}</span><span class="stock-badge">${p.stock === 0 ? 'AGOTADO' : `${p.stock} restantes`}</span></div>`).join('');
}

function renderAdminProducts() {
  const query    = document.getElementById('admin-search')?.value.toLowerCase() || '';
  const filtered = adminProducts.filter(p => p.name.toLowerCase().includes(query));
  const list     = document.getElementById('admin-products-list');
  if (!list) return;
  if (filtered.length === 0) { list.innerHTML = '<p style="color:var(--gray);">No se encontraron productos.</p>'; return; }
  list.innerHTML = filtered.map(p => `
    <div class="admin-product-card">
      <img class="admin-prod-img" src="${p.img||''}" alt="${p.name}" onerror="this.src=''" />
      <div class="admin-prod-info">
        <h4>${p.name}</h4>
        <p>${p.category} • Stock: <strong>${p.stock}</strong></p>
        <p class="ap-price">$${Number(p.price).toLocaleString('es-CO')}</p>
        <div class="admin-prod-actions">
          <button class="btn-edit" onclick="editProduct('${p.id}')"><i class="fas fa-edit"></i> Editar</button>
          <button class="btn-delete" onclick="deleteProduct('${p.id}')"><i class="fas fa-trash"></i> Eliminar</button>
        </div>
      </div>
    </div>`).join('');
}
window.renderAdminProducts = renderAdminProducts;

window.openProductForm = function(id = null) {
  const titleEl = document.getElementById('product-form-title');
  if (titleEl) titleEl.innerHTML = id ? '<i class="fas fa-edit"></i> Editar producto' : '<i class="fas fa-box"></i> Agregar producto';
  ['pf-id','pf-name','pf-price','pf-oldprice','pf-stock','pf-desc','pf-imgurl'].forEach(f => { const el = document.getElementById(f); if (el) el.value = ''; });
  document.getElementById('pf-category').value = '';
  document.getElementById('pf-featured').checked = false;
  const preview = document.getElementById('pf-img-preview');
  if (preview) { preview.style.display = 'none'; preview.src = ''; }

  if (id) {
    const p = adminProducts.find(x => x.id === id);
    if (p) {
      document.getElementById('pf-id').value       = p.id;
      document.getElementById('pf-name').value     = p.name;
      document.getElementById('pf-category').value = p.category;
      document.getElementById('pf-price').value    = p.price;
      document.getElementById('pf-oldprice').value = p.oldPrice || '';
      document.getElementById('pf-stock').value    = p.stock;
      document.getElementById('pf-desc').value     = p.desc || '';
      document.getElementById('pf-featured').checked = !!p.featured;
      if (p.img) { document.getElementById('pf-imgurl').value = p.img; if (preview) { preview.src = p.img; preview.style.display = 'block'; } }
    }
  }
  openAdminModal('product-form-modal');
};

window.editProduct = id => window.openProductForm(id);

window.saveProduct = async function(e) {
  e.preventDefault();
  const id       = document.getElementById('pf-id').value;
  const name     = document.getElementById('pf-name').value.trim();
  const category = document.getElementById('pf-category').value;
  const price    = parseFloat(document.getElementById('pf-price').value);
  const oldPrice = parseFloat(document.getElementById('pf-oldprice').value) || 0;
  const stock    = parseInt(document.getElementById('pf-stock').value);
  const desc     = document.getElementById('pf-desc').value.trim();
  const img      = document.getElementById('pf-imgurl').value.trim();
  const featured = document.getElementById('pf-featured').checked;
  const productId   = id || 'p' + Date.now();
  const productData = { name, category, price, oldPrice, stock, desc, img, featured };
  try {
    showToast('Guardando...', 'info');
    await setDoc(doc(db, 'products', productId), productData);
    await loadAdminProducts(); renderAdminProducts(); renderDashboard(); closeProductForm();
    showToast(id ? '✅ Producto actualizado — visible para todos' : '✅ Producto agregado — visible para todos', 'success');
  } catch (e) { showToast('Error guardando el producto', 'error'); }
};

window.deleteProduct = async function(id) {
  if (!confirm('¿Eliminar este producto?')) return;
  try {
    await deleteDoc(doc(db, 'products', id));
    await loadAdminProducts(); renderAdminProducts(); renderDashboard();
    showToast('Producto eliminado', 'info');
  } catch (e) { showToast('Error eliminando', 'error'); }
};

window.previewImgUrl = function(url) {
  const preview = document.getElementById('pf-img-preview');
  if (!preview) return;
  if (url) { preview.src = url; preview.style.display = 'block'; }
  else { preview.style.display = 'none'; }
};

window.closeProductForm = function(e) { if (!e || e.target.id === 'product-form-modal') closeAdminModal('product-form-modal'); };

function renderOrders() {
  const orders = JSON.parse(localStorage.getItem('mtdy_orders') || '[]');
  const list   = document.getElementById('orders-list');
  if (!list) return;
  list.innerHTML = orders.length === 0
    ? '<div class="order-card"><p style="color:var(--gray);">No hay pedidos aún.</p></div>'
    : orders.map(o => `
        <div class="order-card">
          <div>
            <h4>🎂 ${o.name}</h4>
            <p>📍 ${o.address}, ${o.city}</p>
            <p>📞 ${o.phone} ${o.email ? '• 📧 ' + o.email : ''}</p>
            <p style="font-size:.78rem;color:var(--gray);margin-top:4px;">${new Date(o.date).toLocaleString('es-CO')}</p>
            <div style="margin-top:8px;font-size:.82rem;">${(o.items||[]).map(i => `<div>• ${i.name} x${i.qty}</div>`).join('')}</div>
          </div>
          <div class="order-total">$${Number(o.total||0).toLocaleString('es-CO')}</div>
        </div>`).join('');
}

function renderUsers() {
  const users = JSON.parse(localStorage.getItem('mtdy_users') || '[]');
  const list  = document.getElementById('users-list');
  if (!list) return;
  list.innerHTML = users.length === 0
    ? '<div class="user-card"><p style="color:var(--gray);">No hay usuarios registrados.</p></div>'
    : users.map(u => `
        <div class="user-card">
          <div><h4><i class="fas fa-user" style="color:var(--primary)"></i> ${u.name}</h4><p>@${u.username} • ${u.email}</p></div>
          <button class="btn-delete" onclick="deleteUser('${u.id}')"><i class="fas fa-user-times"></i></button>
        </div>`).join('');
}

window.deleteUser = function(id) {
  if (!confirm('¿Eliminar este usuario?')) return;
  let users = JSON.parse(localStorage.getItem('mtdy_users') || '[]');
  users = users.filter(u => u.id !== id); localStorage.setItem('mtdy_users', JSON.stringify(users));
  renderUsers(); showToast('Usuario eliminado', 'info');
};

function loadSettingsForm() {
  const socials = JSON.parse(localStorage.getItem('mtdy_socials') || '{}');
  const info    = JSON.parse(localStorage.getItem('mtdy_store_info') || '{}');
  const logoUrl = localStorage.getItem('mtdy_logo') || '';
  if (document.getElementById('s-facebook'))  document.getElementById('s-facebook').value  = socials.facebook  || '';
  if (document.getElementById('s-instagram')) document.getElementById('s-instagram').value = socials.instagram || '';
  if (document.getElementById('s-whatsapp'))  document.getElementById('s-whatsapp').value  = socials.whatsapp  || '573165389152';
  if (document.getElementById('s-tiktok'))    document.getElementById('s-tiktok').value    = socials.tiktok    || '';
  if (document.getElementById('s-storename')) document.getElementById('s-storename').value = info.name  || 'Mil Detalles Las Tres Y';
  if (document.getElementById('s-storedesc')) document.getElementById('s-storedesc').value = info.desc  || '';
  if (document.getElementById('s-email'))     document.getElementById('s-email').value     = info.email || '';
  if (document.getElementById('s-logourl'))   document.getElementById('s-logourl').value   = logoUrl;
  loadLogoPreviewAdmin();
}

window.previewLogoUrl = function(url) {
  const el = document.getElementById('logo-preview-admin');
  if (!el) return;
  if (url) el.innerHTML = `<img src="${url}" alt="Logo preview" style="max-height:70px;" />`;
  else loadLogoPreviewAdmin();
};

window.saveLogoFromUrl = function() {
  const url = document.getElementById('s-logourl')?.value.trim();
  if (!url) { showToast('Ingresa una URL válida', 'error'); return; }
  localStorage.setItem('mtdy_logo', url);
  loadLogoPreviewAdmin();
  showToast('Logo guardado ✅', 'success');
};

window.removeLogo = function() {
  localStorage.removeItem('mtdy_logo');
  if (document.getElementById('s-logourl')) document.getElementById('s-logourl').value = '';
  loadLogoPreviewAdmin(); showToast('Logo eliminado', 'info');
};

function loadLogoPreviewAdmin() {
  const el = document.getElementById('logo-preview-admin');
  if (!el) return;
  const logo = localStorage.getItem('mtdy_logo');
  el.innerHTML = logo ? `<img src="${logo}" alt="Logo" style="max-height:70px;" />` : `<span style="color:var(--gray);font-size:2rem;">🎂</span>`;
}

window.saveSocials = function() {
  localStorage.setItem('mtdy_socials', JSON.stringify({
    facebook:  document.getElementById('s-facebook').value.trim(),
    instagram: document.getElementById('s-instagram').value.trim(),
    whatsapp:  document.getElementById('s-whatsapp').value.trim(),
    tiktok:    document.getElementById('s-tiktok').value.trim(),
  })); showToast('Redes guardadas ✅', 'success');
};

window.saveStoreInfo = function() {
  localStorage.setItem('mtdy_store_info', JSON.stringify({
    name:  document.getElementById('s-storename').value.trim(),
    desc:  document.getElementById('s-storedesc').value.trim(),
    email: document.getElementById('s-email').value.trim(),
  })); showToast('Información guardada ✅', 'success');
};

window.changeAdminPass = function() {
  const oldp  = document.getElementById('s-oldpass').value;
  const newp  = document.getElementById('s-newpass').value;
  const conf  = document.getElementById('s-confpass').value;
  const creds = JSON.parse(localStorage.getItem('mtdy_admin_creds') || '{}');
  if (oldp !== (creds.pass || DEFAULT_ADMIN.pass)) { showToast('Contraseña actual incorrecta', 'error'); return; }
  if (newp.length < 6) { showToast('Mínimo 6 caracteres', 'error'); return; }
  if (newp !== conf)   { showToast('Las contraseñas no coinciden', 'error'); return; }
  creds.pass = newp; localStorage.setItem('mtdy_admin_creds', JSON.stringify(creds));
  ['s-oldpass','s-newpass','s-confpass'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  showToast('Contraseña cambiada ✅', 'success');
};

function openAdminModal(id) { const m = document.getElementById(id); if (m) { m.style.display = 'flex'; setTimeout(() => m.classList.add('open'), 10); } document.body.style.overflow = 'hidden'; }
function closeAdminModal(id) { const m = document.getElementById(id); if (m) { m.classList.remove('open'); setTimeout(() => { m.style.display = 'none'; }, 250); } document.body.style.overflow = ''; }
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAdminModal('product-form-modal'); });

function showToast(msg, type = 'info') {
  const tc = document.getElementById('toast-container');
  if (!tc) return;
  const icons = { success:'fa-check-circle', error:'fa-times-circle', info:'fa-info-circle' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i class="fas ${icons[type]||'fa-info-circle'}"></i> ${msg}`;
  tc.appendChild(toast);
  setTimeout(() => { toast.style.animation = 'toastOut .3s ease forwards'; setTimeout(() => toast.remove(), 320); }, 2800);
}
