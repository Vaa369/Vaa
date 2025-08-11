async function fetchJSON(url, opts){ const r = await fetch(url, opts); const d = await r.json(); if(!r.ok) throw new Error(d.message||'Error'); return d; }

async function loadProductsAdmin(){
  const table = document.getElementById('admin-products');
  if(!table) return;
  const list = await fetchJSON('/api/products');
  table.innerHTML = `<tr><th>الاسم</th><th>السعر</th><th>القسم</th><th></th></tr>` + list.map(p=>
    `<tr>
      <td><input value="${p.name}" data-id="${p.id}" data-k="name"></td>
      <td><input value="${p.price}" data-id="${p.id}" data-k="price" type="number"></td>
      <td><input value="${p.category}" data-id="${p.id}" data-k="category"></td>
      <td>
        <button data-save="${p.id}">حفظ</button>
        <button data-del="${p.id}">حذف</button>
      </td>
    </tr>`).join('');
}

document.addEventListener('click', async (e)=>{
  const saveId = e.target.getAttribute('data-save');
  if(saveId){
    const inputs = [...document.querySelectorAll(`input[data-id='${saveId}']`)];
    const body = Object.fromEntries(inputs.map(i=>[i.getAttribute('data-k'), i.type==='number'?Number(i.value):i.value]));
    await fetchJSON(`/api/products/${saveId}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)});
    alert('تم الحفظ');
  }
  const delId = e.target.getAttribute('data-del');
  if(delId){
    await fetchJSON(`/api/products/${delId}`, { method:'DELETE' });
    alert('تم الحذف');
    loadProductsAdmin();
  }
  if(e.target.id==='create-product'){
    const name = prompt('اسم المنتج');
    if(!name) return;
    await fetchJSON('/api/products', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name, price:0, category:'' })});
    loadProductsAdmin();
  }
});

document.addEventListener('DOMContentLoaded', loadProductsAdmin);