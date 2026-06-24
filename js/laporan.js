// ==================== LAPORAN ====================
let sales = JSON.parse(localStorage.getItem('s_db_pro')) || [];

function renderLaporan() {
    const total = sales.reduce((a, b) => a + b.total, 0);
    document.getElementById('stat-trx').innerText = sales.length;
    document.getElementById('stat-omset').innerText = formatRp(total);
    const container = document.getElementById('list-laporan');
    if (!sales.length) { container.innerHTML = '<div class="cart-empty">📊 Belum ada transaksi</div>'; return; }
    container.innerHTML = sales.slice().reverse().map(s => `
        <div class="laporan-card" onclick='showStruk(${JSON.stringify(s)})'>
            <div>🧾</div>
            <div>
                <div>${s.id}</div>
                <div style="font-size:12px">${s.tgl}</div>
            </div>
            <div style="margin-left:auto;font-weight:800">${formatRp(s.total)}</div>
        </div>
    `).join('');
}