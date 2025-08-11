async function fetchJSON(url){ const r=await fetch(url); return r.json(); }

async function loadTracking() {
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get('orderId');
  if (!orderId) return;
  const data = await fetchJSON(`/api/delivery/track/${orderId}`);
  const timeline = document.getElementById('timeline');
  if (timeline) {
    timeline.innerHTML = (data.tracking||[]).map(t => `<li><strong>${t.status}</strong> - ${new Date(t.at).toLocaleString('ar-EG')} ${t.note?(' - '+t.note):''}</li>`).join('');
  }
}

document.addEventListener('DOMContentLoaded', loadTracking);