// ==================== PRODUCTS ====================
let products = JSON.parse(localStorage.getItem('p_db_pro')) || [];
let produkListFilter = '';
let produkKasirFilter = '';

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => m==='&'?'&amp;':m==='<'?'&lt;':'&gt;');
}

const formatRp = (n) => "Rp " + Number(n).toLocaleString('id-ID');

function saveProduct() {
    let barcode = document.getElementById('p-barcode').value.trim();
    const nama = document.getElementById('p-nama').value.trim();
    const harga = parseInt(document.getElementById('p-harga').value);
    const stok = parseInt(document.getElementById('p-stok').value) || 0;
    if (!nama || isNaN(harga)) { alert("Nama dan harga harus diisi!"); return; }
    if (barcode === "") barcode = "PRD" + Date.now() + Math.floor(Math.random() * 1000);
    const idx = products.findIndex(p => p.barcode === barcode);
    if (idx > -1) {
        products[idx] = { barcode, nama, harga, stok };
        alert(`Produk ${nama} berhasil diupdate!`);
    } else {
        products.push({ barcode, nama, harga, stok });
        alert(`✅ Produk ${nama} berhasil disimpan!\nBarcode: ${barcode}`);
    }
    localStorage.setItem('p_db_pro', JSON.stringify(products));
    renderInventoryList();
    renderProdukList();
    renderProdukKasirGrid();
    ['p-barcode','p-nama','p-harga','p-stok'].forEach(id => document.getElementById(id).value = '');
}

function editProduct(barcode) {
    const p = products.find(p => p.barcode === barcode);
    if (!p) return;
    document.getElementById('p-barcode').value = p.barcode;
    document.getElementById('p-nama').value = p.nama;
    document.getElementById('p-harga').value = p.harga;
    document.getElementById('p-stok').value = p.stok;
    document.querySelector('#tab-inventory .card').scrollIntoView({ behavior: 'smooth' });
}

function hapusProduk(barcode) {
    if (!confirm('Hapus produk ini?')) return;
    products = products.filter(p => p.barcode !== barcode);
    localStorage.setItem('p_db_pro', JSON.stringify(products));
    renderInventoryList();
    renderProdukList();
    renderProdukKasirGrid();
}

function renderInventoryList() {
    const container = document.getElementById('list-inventory');
    document.getElementById('prod-count').innerText = products.length;
    if (!products.length) { container.innerHTML = '<div class="cart-empty">📦 Belum ada produk</div>'; return; }
    container.innerHTML = products.map(p => `
        <div class="inventory-item">
            <div>🏷</div>
            <div class="inventory-info">
                <b>${escapeHtml(p.nama)}</b><br>
                <small>${escapeHtml(p.barcode)}</small>
                <div class="inventory-price">${formatRp(p.harga)}</div>
            </div>
            <div><span class="inventory-stock">Stok: ${p.stok}</span></div>
            <div>
                <button class="edit-btn" onclick="editProduct('${escapeHtml(p.barcode)}')">✏️</button>
                <button class="delete-btn" onclick="hapusProduk('${escapeHtml(p.barcode)}')">×</button>
            </div>
        </div>
    `).join('');
}

function renderProdukList() {
    const container = document.getElementById('produk-list-container');
    if (!container) return;
    const f = produkListFilter.toLowerCase();
    const filtered = f
        ? products.filter(p => p.nama.toLowerCase().includes(f) || p.barcode.toLowerCase().includes(f))
        : products;
    if (!filtered.length) { container.innerHTML = '<div class="cart-empty">📦 Tidak ada produk ditemukan</div>'; return; }
    container.innerHTML = filtered.map(p => `
        <div class="product-card">
            <h4>${escapeHtml(p.nama)}</h4>
            <div class="product-price">${formatRp(p.harga)}</div>
            <div class="product-stock ${p.stok <= 5 ? 'low' : ''}">Stok: ${p.stok}</div>
            <button class="btn-add-cart" onclick="addToCart('${escapeHtml(p.barcode)}')" ${p.stok <= 0 ? 'disabled' : ''}>➕ Tambah</button>
        </div>
    `).join('');
}

function filterProdukList() {
    produkListFilter = document.getElementById('search-produk').value;
    renderProdukList();
}

function renderProdukKasirGrid() {
    const container = document.getElementById('produk-kasir-grid');
    if (!container) return;
    const f = produkKasirFilter.toLowerCase();
    const filtered = f
        ? products.filter(p => p.nama.toLowerCase().includes(f) || p.barcode.toLowerCase().includes(f))
        : products;
    if (!filtered.length) { container.innerHTML = '<div class="cart-empty">📦 Tidak ada produk</div>'; return; }
    container.innerHTML = filtered.map(p => `
        <div class="product-card">
            <h4>${escapeHtml(p.nama)}</h4>
            <div class="product-price">${formatRp(p.harga)}</div>
            <div class="product-stock ${p.stok <= 5 ? 'low' : ''}">Stok: ${p.stok}</div>
            <button class="btn-add-cart ${p.stok <= 0 ? 'disabled' : ''}"
                onclick="addToCart('${escapeHtml(p.barcode)}')"
                ${p.stok <= 0 ? 'disabled' : ''}>➕ Tambah</button>
        </div>
    `).join('');
}

function filterProdukKasir() {
    produkKasirFilter = document.getElementById('search-produk-kasir')?.value || '';
    renderProdukKasirGrid();
}