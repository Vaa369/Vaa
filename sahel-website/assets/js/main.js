async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Request failed');
  return res.json();
}

function formatCurrency(value) {
  return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(value);
}

function getCart() {
  try { return JSON.parse(localStorage.getItem('sahel_cart') || '[]'); } catch { return []; }
}
function setCart(cart) {
  localStorage.setItem('sahel_cart', JSON.stringify(cart));
}
function addToCart(product, qty = 1) {
  const cart = getCart();
  const idx = cart.findIndex((c) => c.id === product.id);
  if (idx >= 0) cart[idx].qty += qty; else cart.push({ id: product.id, name: product.name, price: product.price, qty });
  setCart(cart);
  alert('تم إضافة المنتج إلى السلة');
}

async function loadFeatured() {
  const container = document.querySelector('#featured');
  if (!container) return;
  const all = await fetchJSON('/api/products');
  const featured = all.slice(0, 8);
  container.innerHTML = featured.map(p => `
    <div class="card">
      <img src="${p.images?.[0] || '/assets/images/placeholder.svg'}" onerror="this.src='/assets/images/placeholder.svg'" alt="${p.name}">
      <h3>${p.name}</h3>
      <p>${formatCurrency(p.price)}</p>
      <button data-id="${p.id}">أضف إلى السلة</button>
      <a class="details" href="/product-details.html?id=${p.id}">تفاصيل</a>
    </div>
  `).join('');
  container.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-id]');
    if (btn) {
      const id = btn.getAttribute('data-id');
      const product = await fetchJSON(`/api/products/${id}`);
      addToCart(product, 1);
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadFeatured();
});