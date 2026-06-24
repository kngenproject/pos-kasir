// ==================== CART ====================
let cart = [];

function addToCart(bc) {
    const p = products.find(i => i.barcode === bc);
    if (!p) { alert("Produk tidak ditemukan: " + bc); return; }
    if (p.stok <= 0) { alert("Stok habis!"); return; }
    const existing = cart.find(c => c.barcode === bc);
    if (existing) {
        if (existing.qty < p.stok) existing.qty++;
        else alert("Stok tidak mencukupi");
    } else {
        cart.push({ ...p, qty: 1 });
    }
    updateCartUI();
}

function changeQty(idx, delta) {
    const maxStok = products.find(p => p.barcode === cart[idx].barcode)?.stok || 0;
    cart[idx].qty += delta;
    if (cart[idx].qty <= 0) cart.splice(idx, 1);
    else if (cart[idx].qty > maxStok) cart[idx].qty = maxStok;
    updateCartUI();
}

function updateCartUI() {
    const container = document.getElementById('cart-items');
    if (!cart.length) {
        container.innerHTML = '<div class="cart-empty">🛒 Kosong</div>';
        document.getElementById('total-cart').innerText = "Rp 0";
        document.getElementById('subtotal').innerText = "Rp 0";
        document.getElementById('input-bayar').value = '';
        hitungKembalian();
        return;
    }
    let total = 0;
    container.innerHTML = cart.map((c, i) => {
        total += c.harga * c.qty;
        return `
        <div class="cart-item">
            <div>🏷</div>
            <div class="cart-item-info">
                <b>${escapeHtml(c.nama)}</b><br>
                <span>${formatRp(c.harga)}</span>
            </div>
            <div>
                <span>${formatRp(c.harga * c.qty)}</span>
                <div class="qty-ctrl">
                    <button class="qty-btn qty-minus" onclick="changeQty(${i},-1)">−</button>
                    <span>${c.qty}</span>
                    <button class="qty-btn qty-plus" onclick="changeQty(${i},1)">+</button>
                </div>
            </div>
        </div>`;
    }).join('');
    document.getElementById('total-cart').innerText = formatRp(total);
    document.getElementById('subtotal').innerText = formatRp(total);
    hitungKembalian();
}

function hitungKembalian() {
    const total = cart.reduce((a, b) => a + (b.harga * b.qty), 0);
    const bayar = parseFloat(document.getElementById('input-bayar').value) || 0;
    const kembali = bayar - total;
    const el = document.getElementById('total-kembali');
    el.innerText = formatRp(kembali >= 0 ? kembali : 0);
    el.style.color = kembali >= 0 ? "var(--secondary)" : "var(--danger)";
}

function resetKasir() {
    cart = [];
    document.getElementById('input-bayar').value = '';
    updateCartUI();
}

function prosesTransaksi() {
    const total = cart.reduce((a, b) => a + (b.harga * b.qty), 0);
    const bayar = parseFloat(document.getElementById('input-bayar').value) || 0;
    if (!cart.length) { alert("Keranjang kosong"); return; }
    if (bayar < total) { alert("Pembayaran kurang"); return; }
    const trx = {
        id: "TRX" + Date.now(),
        tgl: new Date().toLocaleString('id-ID'),
        items: [...cart],
        total, bayar, kembali: bayar - total
    };
    cart.forEach(c => {
        const p = products.find(pr => pr.barcode === c.barcode);
        if (p) p.stok -= c.qty;
    });
    sales.push(trx);
    localStorage.setItem('p_db_pro', JSON.stringify(products));
    localStorage.setItem('s_db_pro', JSON.stringify(sales));
    showStruk(trx);
    resetKasir();
    renderInventoryList();
    renderProdukList();
    renderProdukKasirGrid();
    renderLaporan();
}

function showStruk(data) {
    document.getElementById('r-tgl').innerText = data.tgl;
    document.getElementById('r-total').innerText = formatRp(data.total);
    document.getElementById('r-bayar').innerText = formatRp(data.bayar);
    document.getElementById('r-kembali').innerText = formatRp(data.kembali);
    document.getElementById('r-id').innerText = data.id;
    document.getElementById('r-list').innerHTML = data.items.map(i =>
        `<div><span>${escapeHtml(i.nama)} x${i.qty}</span><span style="float:right">${formatRp(i.harga * i.qty)}</span></div>`
    ).join('');
    document.getElementById('receipt-modal').style.display = "block";
    try { JsBarcode("#r-barcode-img", data.id, { height: 40, displayValue: false, margin: 0 }); } catch(e) {}
}

function closeReceipt() {
    document.getElementById('receipt-modal').style.display = "none";
}