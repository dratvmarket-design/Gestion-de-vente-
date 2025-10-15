\
/* app.js - Tata Stock Pro (5 pages) */

// localStorage keys
const LS_PRODUCTS = 'tsp_products_v1';
const LS_SALES = 'tsp_sales_v1';

function loadProducts(){ return JSON.parse(localStorage.getItem(LS_PRODUCTS) || '[]'); }
function saveProducts(list){ localStorage.setItem(LS_PRODUCTS, JSON.stringify(list)); }
function loadSales(){ return JSON.parse(localStorage.getItem(LS_SALES) || '[]'); }
function saveSales(list){ localStorage.setItem(LS_SALES, JSON.stringify(list)); }

/* ---------- PRODUCT PAGE ---------- */
function addProduct(){
  const name = document.getElementById('p_name').value.trim();
  if(!name){ alert('Nom requis'); return; }
  const sku = document.getElementById('p_sku').value.trim();
  const price = parseInt(document.getElementById('p_price').value) || 0;
  const cost = parseInt(document.getElementById('p_cost').value) || 0;
  const qty = parseInt(document.getElementById('p_qty').value) || 0;
  const file = document.getElementById('p_image').files[0];
  const id = 'p_'+Date.now();
  const save = (imgData) => {
    const prod = { id, name, sku, price, cost, qty, image: imgData || null };
    const list = loadProducts();
    list.push(prod);
    saveProducts(list);
    clearForm();
    renderProductList();
    updateDashboard();
    alert('Produit enregistré');
  };
  if(file){
    const reader = new FileReader();
    reader.onload = function(e){ 
      // resize image to reduce size before saving
      const img = new Image();
      img.onload = function(){
        const maxW = 600;
        const scale = Math.min(1, maxW / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img,0,0,canvas.width,canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        save(dataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  } else save(null);
}

function clearForm(){
  ['p_name','p_sku','p_price','p_cost','p_qty','p_image'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value='';});
}

function renderProductList(){
  const container = document.getElementById('productList');
  if(!container) return;
  const list = loadProducts();
  container.innerHTML = '';
  if(!list.length){ container.innerHTML = '<div>Aucun produit</div>'; return; }
  list.forEach(p=>{
    const div = document.createElement('div'); div.className='product-card';
    const img = document.createElement('img'); img.className='product-thumb'; img.src = p.image || placeholderData(); img.alt = p.name;
    const info = document.createElement('div'); info.className='product-info';
    info.innerHTML = `<strong>${p.name}</strong><div>Prix: ${p.price.toLocaleString()} FCFA</div><div>Stock: ${p.qty}</div>`;
    const actions = document.createElement('div'); actions.className='product-actions';
    const del = document.createElement('button'); del.textContent='Suppr'; del.className='btn'; del.onclick = ()=>{ if(confirm('Supprimer ?')){ deleteProduct(p.id); } };
    actions.appendChild(del);
    div.appendChild(img); div.appendChild(info); div.appendChild(actions);
    container.appendChild(div);
  });
}

function placeholderData(){
  // small gray image data URI as placeholder (1x1 png)
  return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIW2NgYGD4DwABBAEAj2bKXwAAAABJRU5ErkJggg==';
}

function deleteProduct(id){
  let list = loadProducts();
  list = list.filter(p=>p.id!==id);
  saveProducts(list);
  renderProductList();
  updateDashboard();
}

/* ---------- DASHBOARD ---------- */
function updateDashboard(){
  const prods = loadProducts();
  const sold = loadSales();
  const count = prods.length;
  let totalQty = 0; let stockVal = 0;
  prods.forEach(p=>{ totalQty += (p.qty||0); stockVal += (p.qty||0) * (p.cost||0); });
  const elem = document.getElementById('statProducts'); if(elem) elem.textContent = count;
  const e2 = document.getElementById('statQty'); if(e2) e2.textContent = totalQty;
  const e3 = document.getElementById('statValue'); if(e3) e3.textContent = stockVal.toLocaleString() + ' FCFA';
}

/* ---------- SELL PAGE ---------- */
function populateSellList(){
  const sel = document.getElementById('sell_product');
  if(!sel) return;
  sel.innerHTML = '';
  const list = loadProducts();
  list.forEach(p=>{
    const opt = document.createElement('option'); opt.value = p.id; opt.text = `${p.name} (stk:${p.qty}) - ${p.price.toLocaleString()} FCFA`;
    sel.appendChild(opt);
  });
  if(!list.length){ const opt = document.createElement('option'); opt.text='Aucun produit'; sel.appendChild(opt); }
}

function createSale(){
  const pid = document.getElementById('sell_product').value;
  const qty = parseInt(document.getElementById('sell_qty').value) || 0;
  if(!pid || qty<=0){ alert('Sélectionner produit et quantité'); return; }
  const prods = loadProducts(); const p = prods.find(x=>x.id===pid);
  if(!p || p.qty < qty){ alert('Stock insuffisant'); return; }
  const client = document.getElementById('client_name').value || '';
  const phone = document.getElementById('client_phone').value || '';
  const city = (document.getElementById('client_city') ? document.getElementById('client_city').value : '') || '';
  // update stock
  p.qty -= qty; saveProducts(prods);
  // create sale
  const sale = { id: 's_'+Date.now(), date: new Date().toISOString(), product_id: p.id, name: p.name, qty, unit_price: p.price, total: p.price * qty, client:{name:client, phone:phone, city: city} };
  const sales = loadSales(); sales.push(sale); saveSales(sales);
  renderProductList(); populateSellList(); updateDashboard();
  generateInvoicePDF(sale);
  alert('Vente enregistrée');
}

/* ---------- HISTORY ---------- */
function renderSales(){
  const list = loadSales();
  const container = document.getElementById('salesList');
  if(!container) return;
  container.innerHTML = '';
  if(!list.length){ container.innerHTML = '<div>Aucune vente</div>'; return; }
  list.slice().reverse().forEach(s=>{
    const div = document.createElement('div'); div.className='sale';
    div.innerHTML = `<strong>${s.name}</strong> • ${s.qty} x ${s.unit_price.toLocaleString()} FCFA = ${s.total.toLocaleString()} FCFA<br><small>${new Date(s.date).toLocaleString()} • ${s.client.name||'Client'} ${s.client.phone||''}</small>`;
    container.appendChild(div);
  });
}

function exportSalesCSV(){
  const sales = loadSales();
  if(!sales.length){ alert('Aucune vente'); return; }
  let csv = 'id,date,produit,quantité,prix_unitaire,total,client,phone\\n';
  sales.forEach(s=> csv += `${s.id},${s.date},"${s.name}",${s.qty},${s.unit_price},${s.total},"${s.client.name||''}","${s.client.phone||''}"\\n`);
  const blob = new Blob([csv], {type:'text/csv'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'sales_export.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

/* ---------- CLEAR ALL ---------- */
function clearAll(){
  if(!confirm('Effacer toutes les données (produits et ventes) ?')) return;
  localStorage.removeItem(LS_PRODUCTS);
  localStorage.removeItem(LS_SALES);
  renderProductList(); renderSales(); updateDashboard();
  alert('Données effacées');
}

/* ---------- PDF invoice (simple) ---------- */
function generateInvoicePDF(sale){
  try{
    if(window.jspdf && window.jspdf.jsPDF){
      const doc = new window.jspdf.jsPDF();
      doc.setFontSize(16); doc.text('Facture - Tata Stock Pro',14,20);
      doc.setFontSize(11);
      doc.text('Produit: '+sale.name,14,34); doc.text('Qté: '+sale.qty,14,40);
      doc.text('Total: '+sale.total.toLocaleString()+' FCFA',14,52);
      doc.text('Client: '+(sale.client?.name||''),14,60);
      doc.text('Téléphone: '+(sale.client?.phone||''),14,66);
      doc.text('Ville: '+(sale.client?.city||''),14,72);
      doc.save('facture_'+sale.id+'.pdf');
    } else {
      const txt = `Facture ${sale.id}\\nProduit: ${sale.name}\\nQté: ${sale.qty}\\nTotal: ${sale.total} FCFA`;
      const blob = new Blob([txt], {type:'text/plain'}); const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='facture_'+sale.id+'.txt'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    }
  }catch(e){ console.error(e); }
}

/* ---------- Init on each page ---------- */
document.addEventListener('DOMContentLoaded', ()=>{
  renderProductList();
  updateDashboard();
  populateSellList();
  renderSales();
  if('serviceWorker' in navigator){ navigator.serviceWorker.register('service-worker.js').catch(()=>console.log('sw failed')); }
});
