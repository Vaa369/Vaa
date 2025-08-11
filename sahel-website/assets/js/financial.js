async function fetchJSON(url){ const r=await fetch(url); return r.json(); }

document.addEventListener('DOMContentLoaded', async ()=>{
  const el = document.getElementById('financial-summary');
  if (!el) return;
  const data = await fetchJSON('/api/financial/reports/summary');
  el.textContent = `إجمالي الطلبات: ${data.totalOrders} | الإيرادات: ${new Intl.NumberFormat('ar-EG',{style:'currency',currency:'EGP'}).format(data.revenue)}`;
});