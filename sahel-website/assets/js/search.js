async function fetchJSON(url) { const r = await fetch(url); return r.json(); }
const debounce = (fn, ms=250) => { let t; return (...a) => { clearTimeout(t); t=setTimeout(()=>fn(...a), ms);} };

async function renderSuggestions(input, list) {
  const q = input.value.trim();
  if (!q) { list.innerHTML=''; return; }
  const items = await fetchJSON(`/api/search/suggest?q=${encodeURIComponent(q)}`);
  list.innerHTML = items.map(i => `<li data-id="${i.id}">${i.name}</li>`).join('');
}

async function renderResults(container, queryParams) {
  const q = queryParams.get('q') || '';
  const data = await fetchJSON(`/api/search?q=${encodeURIComponent(q)}`);
  container.innerHTML = data.map(p => `
    <div class="card">
      <img src="${p.images?.[0] || '/assets/images/placeholder.svg'}" onerror="this.src='/assets/images/placeholder.svg'" alt="${p.name}">
      <h3>${p.name}</h3>
      <p>${new Intl.NumberFormat('ar-EG',{style:'currency',currency:'EGP'}).format(p.price)}</p>
      <a class="details" href="/product-details.html?id=${p.id}">تفاصيل</a>
    </div>
  `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  const input = document.querySelector('#search-input');
  const suggestions = document.querySelector('#suggestions');
  const results = document.querySelector('#results');
  if (input && suggestions) {
    input.addEventListener('input', debounce(()=>renderSuggestions(input, suggestions), 200));
    suggestions.addEventListener('click', (e)=>{
      const li = e.target.closest('li[data-id]');
      if (!li) return;
      window.location.href = `/product-details.html?id=${li.getAttribute('data-id')}`;
    });
  }
  if (results) {
    renderResults(results, new URLSearchParams(window.location.search));
  }
});