/* ============================================
   REPOSTERÍA MIL DETALLES LAS TRES Y
   script.js — Versión compatible GitHub Pages
   ============================================ */

const firebaseConfig = {
  apiKey: "AIzaSyCR8gKJwYzHsmc17-03mAP-sxlPCD0aA8g",
  authDomain: "reposteria-tresy.firebaseapp.com",
  projectId: "reposteria-tresy",
  storageBucket: "reposteria-tresy.firebasestorage.app",
  messagingSenderId: "416685984119",
  appId: "1:416685984119:web:dbeda575a2c032de6b7972"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let cart = [];
let products = [];
let currentCategory = 'all';
let currentProductId = null;
let currentQty = 1;
let currentUser = null;

const defaultProducts = [
  { id:'p1', name:'Torta de Cumpleaños Personalizada', category:'reposteria', price:85000, oldPrice:0, stock:20, img:'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80', desc:'Torta artesanal personalizada para tu celebración. Elige el sabor, diseño y mensaje. Elaborada con ingredientes frescos y de calidad.', featured:true },
  { id:'p2', name:'Cupcakes Decorados x12', category:'reposteria', price:55000, oldPrice:70000, stock:30, img:'https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?w=400&q=80', desc:'Docena de cupcakes decorados a mano. Disponibles en sabores variados: vainilla, chocolate, red velvet y más.', featured:true },
  { id:'p3', name:'Macarons Franceses x10', category:'reposteria', price:45000, oldPrice:0, stock:25, img:'https://images.unsplash.com/photo-1569864358642-9d1684040f43?w=400&q=80', desc:'Macarons elaborados con la receta francesa tradicional. Rellenos de ganache y buttercream.', featured:false },
  { id:'p4', name:'Caja de Regalo Romántica', category:'detalles', price:65000, oldPrice:80000, stock:15, img:'https://images.unsplash.com/photo-1513201099705-a9746072231e?w=400&q=80', desc:'Caja de regalo decorada con lazo y detalles especiales. Incluye tarjeta personalizada.', featured:true },
  { id:'p5', name:'Bouquet de Chocolates', category:'detalles', price:75000, oldPrice:0, stock:12, img:'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=400&q=80', desc:'Ramo de chocolates premium decorado artesanalmente. Ideal para regalar.', featured:false },
  { id:'p6', name:'Collar de Perlas Artesanal', category:'joyeria', price:95000, oldPrice:130000, stock:10, img:'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&q=80', desc:'Collar artesanal elaborado con perlas cultivadas y cierre dorado. Incluye caja de regalo.', featured:true },
  { id:'p7', name:'Aretes de Resina Floral', category:'joyeria', price:35000, oldPrice:45000, stock:20, img:'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&q=80', desc:'Aretes artesanales de resina con flores naturales preservadas. Piezas únicas e irrepetibles.', featured:false },
  { id:'p8', name:'Centro de Mesa Floral', category:'decoraciones', price:120000, oldPrice:0, stock:8, img:'https://images.unsplash.com/photo-1487530811015-780a9d47e8be?w=400&q=80', desc:'Centro de mesa elaborado con flores artificiales de alta calidad. Ideal para bodas y quinceañeras.', featured:true },
  { id:'p9', name:'Globos Decorativos Set x20', category:'decoraciones', price:28000, oldPrice:35000, stock:50, img:'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=400&q=80', desc:'Set de globos metalizados y de látex para decoración. Colores variados.', featured:false },
  { id:'p10', name:'Velas Artesanales Aromáticas', category:'otros', price:42000, oldPrice:55000, stock:35, img:'https://images.unsplash.com/photo-1602607242655-a0f0cc99dc44?w=400&q=80', desc:'Velas elaboradas con cera de soja y esencias naturales. Aromas: lavanda, vainilla, rosa y jazmín.', featured:false }
];

document.addEventListener('DOMContentLoaded', async () => {
  showLoading(true);
  await loadProductsFromFirebase();
  showLoading(false);
  const cartStored = localStorage.getItem('mtdy_cart');
  cart = cartStored ? JSON.parse(cartStored) : [];
  renderProducts();
  updateCartBadge();
  loadSocialLinks();
  loadLogoDisplay();
  checkUserSession();
});

function showLoading(show) {
  let loader = document.getElementById('page-loader');
  if (!loader && show) {
    loader = document.createElement('div');
    loader.id = 'page-loader';
    loader.style.cssText = 'position:fixed;inset:0;background:rgba(255,240,245,.97);z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;font-family:Lato,sans-serif;';
    loader.innerHTML = '<div style="width:50px;height:50px;border:5px solid #f8bbd0;border-top-color:#c2185b;border-radius:50%;animation:spin .8s linear infinite;"></div><p style="color:#c2185b;font-weight:700;">Cargando con amor... 🎂</p><style>@keyframes spin{to{transform:rotate(360deg)}}</style>';
    document.body.appendChild(loader);
  }
  if (loader) loader.style.display = show ? 'flex' : 'none';
}

async function loadProductsFromFirebase() {
  try {
    const snapshot = await db.collection('products').get();
    if (snapshot.empty) {
      await uploadDefaultProducts();
    } else {
      products = [];
      snapshot.forEach(d => products.push({ id: d.id, ...d.data() }));
    }
  } catch (e) {
    console.error('Firebase error:', e);
    products = defaultProducts;
  }
}

async function uploadDefaultProducts() {
  try {
    const batch = db.batch();
    defaultProducts.forEach(p => {
      const { id, ...data } = p;
      batch.set(db.collection('products').doc(id), data);
    });
    await batch.commit();
    products = [...defaultProducts];
  } catch (e) {
    products = defaultProducts;
  }
}

async function saveProductToFirebase(product) {
  try {
    const { id, ...data } = product;
    await db.collection('products').doc(id).set(data);
    return true;
  } catch (e) { return false; }
}

function saveCart() { localStorage.setItem('mtdy_cart', JSON.stringify(cart)); }

function renderProducts() {
  const grid  = document.getElementById('products-grid');
  const empty = document.getElementById('empty-state');
  if (!grid) return;
  const query = document.getElementById('search-input') ? document.getElementById('search-input').value.toLowerCase() : '';
  const filtered = products.filter(p => {
    const matchCat = currentCategory === 'all' || p.category === currentCategory;
    const matchQ   = p.name.toLowerCase().includes(query) || (p.desc||'').toLowerCase().includes(query);
    return matchCat && matchQ;
  });
  const countEl = document.getElementById('product-count');
  if (countEl) countEl.textContent = filtered.length + ' productos';
  if (filtered.length === 0) { grid.innerHTML = ''; if (empty) empty.style.display = 'block'; return; }
  if (empty) empty.style.display = 'none';
  grid.innerHTML = filtered.map(function(p) {
    const hasOld  = p.oldPrice && p.oldPrice > 0;
    const noStock = p.stock <= 0;
    return '<div class="product-card" onclick="openProduct(\'' + p.id + '\')">' +
      '<div class="product-img">' +
      (p.img ? '<img src="' + p.img + '" alt="' + p.name + '" loading="lazy" onerror="this.parentNode.innerHTML=\'<div class=no-img>🎂</div>\'" />' : '<div class="no-img">🎂</div>') +
      (p.featured ? '<span class="badge-featured">⭐ Destacado</span>' : '') +
      (p.stock > 0 && p.stock <= 5 ? '<span class="badge-stock-low">Últimas ' + p.stock + '</span>' : '') +
      (noStock ? '<div class="badge-no-stock">AGOTADO</div>' : '') +
      '</div>' +
      '<div class="product-info">' +
      '<div class="product-category-tag">' + categoryLabel(p.category) + '</div>' +
      '<div class="product-name">' + p.name + '</div>' +
      '<div class="product-price-row">' +
      '<span class="product-price">' + formatPrice(p.price) + '</span>' +
      (hasOld ? '<span class="product-old-price">' + formatPrice(p.oldPrice) + '</span>' : '') +
      '</div>' +
      '<button class="btn-add" onclick="event.stopPropagation();addToCart(\'' + p.id + '\')" ' + (noStock ? 'disabled' : '') + '>' +
      '<i class="fas fa-shopping-bag"></i> ' + (noStock ? 'Agotado' : 'Agregar') +
      '</button></div></div>';
  }).join('');
}

function filterProducts() { renderProducts(); }
function goHome() { setCategory('all'); window.scrollTo({top:0,behavior:'smooth'}); }
function scrollToCatalog() { if (document.getElementById('catalog')) document.getElementById('catalog').scrollIntoView({behavior:'smooth'}); }

function setCategory(cat, btn) {
  currentCategory = cat;
  document.querySelectorAll('.cat-btn').forEach(function(b) { b.classList.remove('active'); });
  if (btn) btn.classList.add('active');
  else { const t = document.querySelector('[data-cat="' + cat + '"]'); if (t) t.classList.add('active'); }
  const titles = { all:'✨ Todos los Productos', reposteria:'🎂 Repostería', detalles:'🎁 Detalles', joyeria:'💎 Joyería', decoraciones:'⭐ Decoraciones', otros:'📦 Otros' };
  const el = document.getElementById('catalog-title');
  if (el) el.textContent = titles[cat] || 'Productos';
  renderProducts();
  scrollToCatalog();
}

function openProduct(id) {
  const p = products.find(function(x) { return x.id === id; });
  if (!p) return;
  currentProductId = id; currentQty = 1;
  document.getElementById('modal-img').src = p.img || '';
  document.getElementById('modal-name').textContent = p.name;
  document.getElementById('modal-price').textContent = formatPrice(p.price);
  document.getElementById('modal-desc').textContent = p.desc || 'Sin descripción disponible.';
  document.getElementById('modal-category').textContent = categoryLabel(p.category);
  document.getElementById('modal-qty').textContent = 1;
  const stockEl = document.getElementById('modal-stock');
  if (p.stock <= 0) stockEl.innerHTML = '<span style="color:var(--danger)"><i class="fas fa-times-circle"></i> Agotado</span>';
  else if (p.stock <= 5) stockEl.innerHTML = '<span style="color:var(--primary)"><i class="fas fa-exclamation-circle"></i> Solo quedan ' + p.stock + '</span>';
  else stockEl.innerHTML = '<span><i class="fas fa-check-circle" style="color:var(--success)"></i> Disponible (' + p.stock + ')</span>';
  openModal('product-modal');
}

function changeQty(delta) {
  const p = products.find(function(x) { return x.id === currentProductId; });
  if (!p) return;
  currentQty = Math.max(1, Math.min(currentQty + delta, p.stock));
  document.getElementById('modal-qty').textContent = currentQty;
}

function addToCartFromModal() { if (!currentProductId) return; addToCart(currentProductId, currentQty); closeProductModal(); }

function buyDirectWhatsApp() {
  const p = products.find(function(x) { return x.id === currentProductId; });
  if (!p) return;
  const msg = 'Hola! Quiero pedir:\n- ' + p.name + ' x' + currentQty + '\nPrecio: ' + formatPrice(p.price * currentQty) + '\n\n¿Está disponible?';
  window.open('https://wa.me/573165389152?text=' + encodeURIComponent(msg), '_blank');
}

function closeProductModal(e) { if (!e || e.target.id === 'product-modal') closeModal('product-modal'); }

function addToCart(id, qty) {
  qty = qty || 1;
  const p = products.find(function(x) { return x.id === id; });
  if (!p || p.stock <= 0) { showToast('Producto sin stock', 'error'); return; }
  const existing = cart.find(function(x) { return x.id === id; });
  if (existing) {
    const newQty = existing.qty + qty;
    if (newQty > p.stock) { showToast('Solo hay ' + p.stock + ' disponibles', 'error'); return; }
    existing.qty = newQty;
  } else { cart.push({ id:id, qty:qty, price:p.price, name:p.name, img:p.img }); }
  saveCart(); updateCartBadge();
  showToast('🎂 ' + p.name + ' agregado', 'success');
}

function removeFromCart(id) { cart = cart.filter(function(x) { return x.id !== id; }); saveCart(); updateCartBadge(); renderCart(); }

function updateCartQty(id, delta) {
  const item = cart.find(function(x) { return x.id === id; });
  const p    = products.find(function(x) { return x.id === id; });
  if (!item || !p) return;
  item.qty = Math.max(1, Math.min(item.qty + delta, p.stock));
  saveCart(); updateCartBadge(); renderCart();
}

function clearCart() { cart = []; saveCart(); updateCartBadge(); renderCart(); }

function updateCartBadge() {
  const total = cart.reduce(function(s,i) { return s + i.qty; }, 0);
  const badge = document.getElementById('cart-count');
  if (badge) badge.textContent = total;
}

function openCart() { renderCart(); openModal('cart-modal'); }
function closeCart(e) { if (!e || e.target.id === 'cart-modal') closeModal('cart-modal'); }

function renderCart() {
  const list   = document.getElementById('cart-items-list');
  const footer = document.getElementById('cart-footer');
  if (!list) return;
  if (cart.length === 0) {
    list.innerHTML = '<div class="cart-empty"><i class="fas fa-shopping-bag"></i><p>Tu carrito está vacío 💕</p></div>';
    if (footer) footer.style.display = 'none'; return;
  }
  if (footer) footer.style.display = 'flex';
  list.innerHTML = cart.map(function(item) {
    const p     = products.find(function(x) { return x.id === item.id; });
    const price = p ? p.price : item.price;
    return '<div class="cart-item">' +
      '<img class="cart-item-img" src="' + (item.img||'') + '" alt="' + item.name + '" onerror="this.src=\'\'"/>' +
      '<div class="cart-item-details"><div class="cart-item-name">' + item.name + '</div><div class="cart-item-price">' + formatPrice(price * item.qty) + '</div></div>' +
      '<div class="cart-item-controls">' +
      '<button class="cart-qty-btn" onclick="updateCartQty(\'' + item.id + '\',-1)">−</button>' +
      '<span class="cart-item-qty">' + item.qty + '</span>' +
      '<button class="cart-qty-btn" onclick="updateCartQty(\'' + item.id + '\',1)">+</button>' +
      '<button class="cart-remove" onclick="removeFromCart(\'' + item.id + '\')"><i class="fas fa-trash"></i></button>' +
      '</div></div>';
  }).join('');
  const total = cart.reduce(function(s,i) { const p = products.find(function(x){return x.id===i.id;}); return s+(p?p.price:i.price)*i.qty; }, 0);
  const totalEl = document.getElementById('cart-total-amount');
  if (totalEl) totalEl.textContent = formatPrice(total);
}

function openCheckout() {
  if (cart.length === 0) { showToast('Tu carrito está vacío', 'error'); return; }
  closeCart(); renderCheckoutSummary(); openModal('checkout-modal');
}
function closeCheckout(e) { if (!e || e.target.id === 'checkout-modal') closeModal('checkout-modal'); }

function renderCheckoutSummary() {
  const el = document.getElementById('checkout-summary');
  if (!el) return;
  const total = cart.reduce(function(s,i) { const p=products.find(function(x){return x.id===i.id;}); return s+(p?p.price:i.price)*i.qty; }, 0);
  let html = '<strong>🎂 Resumen del pedido:</strong>';
  cart.forEach(function(i) {
    const p = products.find(function(x){return x.id===i.id;});
    const price = p ? p.price : i.price;
    html += '<div class="cs-item"><span>' + i.name + ' x' + i.qty + '</span><span>' + formatPrice(price*i.qty) + '</span></div>';
  });
  html += '<div class="cs-total"><span>💰 SUBTOTAL</span><span>' + formatPrice(total) + '</span></div>';
  html += '<p style="font-size:.78rem;color:var(--primary);margin-top:8px;font-style:italic;">🚚 El costo de envío será acordado por WhatsApp.</p>';
  el.innerHTML = html;
}

async function submitOrder(e) {
  e.preventDefault();
  const name    = document.getElementById('f-name').value.trim();
  const address = document.getElementById('f-address').value.trim();
  const city    = document.getElementById('f-city').value.trim();
  const phone   = document.getElementById('f-phone').value.trim();
  const email   = document.getElementById('f-email').value.trim();
  const notes   = document.getElementById('f-notes').value.trim();
  const total   = cart.reduce(function(s,i) { const p=products.find(function(x){return x.id===i.id;}); return s+(p?p.price:i.price)*i.qty; }, 0);
  const items   = cart.map(function(i) { const p=products.find(function(x){return x.id===i.id;}); const price=p?p.price:i.price; return '• '+i.name+' x'+i.qty+' = '+formatPrice(price*i.qty); }).join('\n');

  const msg = '🎂 *NUEVO PEDIDO - REPOSTERÍA MIL DETALLES LAS TRES Y*\n\n' +
    '👤 *Cliente:* ' + name + '\n📍 *Dirección:* ' + address + ', ' + city + '\n📞 *Teléfono:* ' + phone +
    (email ? '\n📧 *Correo:* ' + email : '') + '\n\n' +
    '🛍️ *Productos:*\n' + items + '\n\n' +
    '💰 *SUBTOTAL: ' + formatPrice(total) + '*\n' +
    '🚚 *Envío:* A coordinar por WhatsApp' +
    (notes ? '\n\n📝 *Observaciones:* ' + notes : '');

  cart.forEach(async function(item) {
    const p = products.find(function(x){return x.id===item.id;});
    if (p) { p.stock = Math.max(0, p.stock - item.qty); await saveProductToFirebase(p); }
  });

  try { await db.collection('orders').add({ name:name, address:address, city:city, phone:phone, email:email, notes:notes, items:[...cart], total:total, date:new Date().toISOString() }); }
  catch(err) {
    const orders = JSON.parse(localStorage.getItem('mtdy_orders') || '[]');
    orders.unshift({ name:name, address:address, city:city, phone:phone, email:email, notes:notes, items:[...cart], total:total, date:new Date().toISOString() });
    localStorage.setItem('mtdy_orders', JSON.stringify(orders));
  }

  window.open('https://wa.me/573165389152?text=' + encodeURIComponent(msg), '_blank');
  clearCart(); closeCheckout();
  showToast('¡Pedido enviado! 🎉', 'success');
}

function checkUserSession() {
  const u = localStorage.getItem('mtdy_user');
  if (u) { currentUser = JSON.parse(u); updateUserUI(); }
}
function updateUserUI() {
  const label = document.getElementById('user-label');
  if (label) label.textContent = currentUser ? currentUser.name.split(' ')[0] : 'Entrar';
}
function openUserModal() {
  if (currentUser) {
    document.getElementById('login-form-section').style.display = 'none';
    document.getElementById('register-form-section').style.display = 'none';
    document.getElementById('logged-section').style.display = 'block';
    document.getElementById('logged-name').textContent = 'Hola, ' + currentUser.name + '! 💕';
    document.getElementById('logged-email-display').textContent = currentUser.email;
  } else { switchUserTab('login'); }
  openModal('user-modal');
}
function closeUserModal(e) { if (!e || e.target.id === 'user-modal') closeModal('user-modal'); }
function switchUserTab(tab) {
  document.getElementById('tab-login').classList.toggle('active', tab === 'login');
  document.getElementById('tab-register').classList.toggle('active', tab === 'register');
  document.getElementById('login-form-section').style.display = tab === 'login' ? 'block' : 'none';
  document.getElementById('register-form-section').style.display = tab === 'register' ? 'block' : 'none';
  document.getElementById('logged-section').style.display = 'none';
}
function doLogin() {
  const user = document.getElementById('login-user').value.trim();
  const pass = document.getElementById('login-pass').value;
  if (!user || !pass) { showToast('Completa todos los campos', 'error'); return; }
  const users = JSON.parse(localStorage.getItem('mtdy_users') || '[]');
  const found = users.find(function(u) { return (u.username===user||u.email===user) && u.password===pass; });
  if (!found) { showToast('Credenciales incorrectas', 'error'); return; }
  currentUser = found; localStorage.setItem('mtdy_user', JSON.stringify(found)); updateUserUI(); closeUserModal(); showToast('Bienvenida, ' + found.name + '! 💕', 'success');
}
function doRegister() {
  const name  = document.getElementById('reg-name').value.trim();
  const uname = document.getElementById('reg-user').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const pass  = document.getElementById('reg-pass').value;
  if (!name||!uname||!email||!pass) { showToast('Completa todos los campos','error'); return; }
  if (pass.length < 6) { showToast('Mínimo 6 caracteres','error'); return; }
  const users = JSON.parse(localStorage.getItem('mtdy_users') || '[]');
  if (users.find(function(u){return u.username===uname||u.email===email;})) { showToast('Usuario o correo ya registrado','error'); return; }
  const newUser = { id:'u'+Date.now(), name:name, username:uname, email:email, password:pass, created:new Date().toISOString() };
  users.push(newUser); localStorage.setItem('mtdy_users', JSON.stringify(users));
  currentUser = newUser; localStorage.setItem('mtdy_user', JSON.stringify(newUser)); updateUserUI(); closeUserModal(); showToast('Bienvenida, '+name+'! 🎂','success');
}
function doLogout() { currentUser=null; localStorage.removeItem('mtdy_user'); updateUserUI(); closeUserModal(); showToast('Sesión cerrada','info'); }

function loadSocialLinks() {
  const socials   = JSON.parse(localStorage.getItem('mtdy_socials') || '{}');
  const container = document.getElementById('social-links');
  if (!container) return;
  let links = [];
  if (socials.facebook)  links.push('<a href="'+socials.facebook+'" target="_blank"><i class="fab fa-facebook-f"></i></a>');
  if (socials.instagram) links.push('<a href="'+socials.instagram+'" target="_blank"><i class="fab fa-instagram"></i></a>');
  links.push('<a href="https://wa.me/'+(socials.whatsapp||'573165389152')+'" target="_blank"><i class="fab fa-whatsapp"></i></a>');
  if (socials.tiktok) links.push('<a href="'+socials.tiktok+'" target="_blank"><i class="fab fa-tiktok"></i></a>');
  container.innerHTML = links.join('');
}

async function loadLogoDisplay() {
  const el = document.getElementById('logo-display');
  if (!el) return;
  try {
    const doc = await db.collection('settings').doc('logo').get();
    if (doc.exists && doc.data().url) {
      const url = doc.data().url;
      localStorage.setItem('mtdy_logo', url);
      el.innerHTML = '<img src="'+url+'" alt="Logo" style="height:50px;width:50px;object-fit:contain;border-radius:50%;border:2px solid var(--accent);" />';
    } else {
      const localLogo = localStorage.getItem('mtdy_logo');
      if (localLogo) el.innerHTML = '<img src="'+localLogo+'" alt="Logo" style="height:50px;width:50px;object-fit:contain;border-radius:50%;border:2px solid var(--accent);" />';
      else el.innerHTML = '<div class="logo-default"><span class="logo-icon">🎂</span></div>';
    }
  } catch(e) {
    const localLogo = localStorage.getItem('mtdy_logo');
    if (localLogo) el.innerHTML = '<img src="'+localLogo+'" alt="Logo" style="height:50px;width:50px;object-fit:contain;border-radius:50%;border:2px solid var(--accent);" />';
    else el.innerHTML = '<div class="logo-default"><span class="logo-icon">🎂</span></div>';
  }
}

function openModal(id) { const m=document.getElementById(id); if(m){m.style.display='flex';setTimeout(function(){m.classList.add('open');},10);} document.body.style.overflow='hidden'; }
function closeModal(id) { const m=document.getElementById(id); if(m){m.classList.remove('open');setTimeout(function(){m.style.display='none';},250);} document.body.style.overflow=''; }
document.addEventListener('keydown', function(e) { if(e.key==='Escape')['product-modal','cart-modal','checkout-modal','user-modal'].forEach(closeModal); });

function formatPrice(n) { return '$'+Number(n).toLocaleString('es-CO'); }
function categoryLabel(cat) { return {reposteria:'Repostería',detalles:'Detalles',joyeria:'Joyería',decoraciones:'Decoraciones',otros:'Otros'}[cat]||cat; }
function showToast(msg, type) {
  type = type || 'info';
  const tc = document.getElementById('toast-container');
  if (!tc) return;
  const icons = { success:'fa-check-circle', error:'fa-times-circle', info:'fa-info-circle' };
  const toast = document.createElement('div');
  toast.className = 'toast ' + type;
  toast.innerHTML = '<i class="fas '+(icons[type]||'fa-info-circle')+'"></i> '+msg;
  tc.appendChild(toast);
  setTimeout(function(){ toast.style.animation='toastOut .3s ease forwards'; setTimeout(function(){toast.remove();},320); }, 2800);
}
