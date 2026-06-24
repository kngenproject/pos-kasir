// ==================== SCANNER ====================
let html5QrCode = null;
let isKasirScanning = false;
let isInventoryScanning = false;
let lastCode = "", lastTime = 0;

async function startKasirScanner() {
    if (isKasirScanning) return;
    initAudio();
    document.getElementById('kasir-scanner-preview').classList.add('active');
    document.getElementById('kasir-scanner-video-small').innerHTML = '';
    document.getElementById('btn-start-scan').style.display = 'none';
    document.getElementById('btn-stop-scan').style.display = 'inline-block';
    try {
        html5QrCode = new Html5Qrcode("kasir-scanner-video-small");
        await html5QrCode.start(
            { facingMode: "environment" },
            { fps: 20, qrbox: { width: 100, height: 100 } },
            onKasirScanSuccess
        );
        isKasirScanning = true;
    } catch (err) {
        console.error(err);
        alert("Gagal mengakses kamera. Pastikan izin diberikan.");
        stopKasirScanner();
    }
}

function onKasirScanSuccess(code) {
    const now = Date.now();
    if (code === lastCode && (now - lastTime) < 2000) return;
    lastCode = code; lastTime = now;
    playBeep();
    const product = products.find(p => p.barcode === code);
    if (product) {
        if (product.stok <= 0) { showMiniToast(`⚠️ Stok ${product.nama} habis!`); return; }
        addToCart(code);
        showMiniToast(`✅ ${product.nama} ditambahkan`);
    } else {
        showMiniToast(`❌ Barcode ${code} tidak ditemukan`);
    }
}

async function stopKasirScanner() {
    if (html5QrCode && isKasirScanning) {
        try { await html5QrCode.stop(); } catch(e) {}
        html5QrCode = null;
    }
    isKasirScanning = false;
    document.getElementById('kasir-scanner-preview').classList.remove('active');
    document.getElementById('kasir-scanner-video-small').innerHTML = '';
    document.getElementById('btn-start-scan').style.display = 'inline-block';
    document.getElementById('btn-stop-scan').style.display = 'none';
}

async function startProductScanner() {
    if (isInventoryScanning) return;
    document.getElementById('scanner-modal').classList.add('active');
    document.getElementById('scanner-video').innerHTML = '';
    try {
        let tempScanner = new Html5Qrcode("scanner-video");
        await tempScanner.start(
            { facingMode: "environment" },
            { fps: 20, qrbox: { width: 250, height: 200 } },
            onInventoryScanSuccess
        );
        isInventoryScanning = true;
        window.tempScanner = tempScanner;
    } catch (err) {
        alert("Gagal mengakses kamera.");
        closeScanner();
    }
}

function onInventoryScanSuccess(code) {
    playBeep();
    document.getElementById('p-barcode').value = code;
    const product = products.find(p => p.barcode === code);
    if (product) {
        document.getElementById('p-nama').value = product.nama;
        document.getElementById('p-harga').value = product.harga;
        document.getElementById('p-stok').value = product.stok;
    } else {
        document.getElementById('p-nama').value = '';
        document.getElementById('p-harga').value = '';
        document.getElementById('p-stok').value = '';
    }
    closeScanner();
}

async function closeScanner() {
    if (window.tempScanner && isInventoryScanning) {
        try { await window.tempScanner.stop(); } catch(e) {}
        window.tempScanner = null;
    }
    isInventoryScanning = false;
    document.getElementById('scanner-modal').classList.remove('active');
    document.getElementById('scanner-video').innerHTML = '';
}