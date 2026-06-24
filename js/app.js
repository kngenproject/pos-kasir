// ==================== APP INIT ====================
let deferredInstallPrompt = null;
let audioCtx = null;

// --- Audio ---
function initAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume().catch(e => console.warn('Audio resume gagal:', e));
    return audioCtx;
}

function playBeep() {
    const ctx = initAudio();
    if (!ctx || ctx.state !== 'running') { if (navigator.vibrate) navigator.vibrate(100); return; }
    try {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'sine'; osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.8, now);
        gain.gain.exponentialRampToValueAtTime(0.00001, now + 0.25);
        osc.start(now); osc.stop(now + 0.25);
    } catch(e) { console.warn('Beep gagal:', e); }
    if (navigator.vibrate) navigator.vibrate(100);
}

// --- Toast ---
function showMiniToast(msg) {
    const toast = document.getElementById('mini-toast');
    toast.textContent = msg;
    toast.style.opacity = '1';
    setTimeout(() => { toast.style.opacity = '0'; }, 1500);
}

// --- Hard Refresh ---
async function hardRefresh() {
    if (!confirm("🔄 Refresh akan membersihkan cache & mengambil versi terbaru.\nData produk dan transaksi Anda tetap aman. Lanjutkan?")) return;
    showMiniToast("⚡ Membersihkan cache & memuat ulang...");
    if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (let r of regs) await r.unregister();
    }
    if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
    }
    window.location.reload(true);
}

// --- PWA Install ---
window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredInstallPrompt = e;
    if (!localStorage.getItem('install_dismissed'))
        setTimeout(() => document.getElementById('install-banner').style.display = 'flex', 3000);
});
function installPWA() {
    deferredInstallPrompt?.prompt();
    deferredInstallPrompt?.userChoice.then(() => document.getElementById('install-banner').style.display = 'none');
}
function dismissInstall() {
    localStorage.setItem('install_dismissed', '1');
    document.getElementById('install-banner').style.display = 'none';
}

// --- Service Worker ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').then(reg => {
            reg.onupdatefound = () => {
                const w = reg.installing;
                w.onstatechange = () => {
                    if (w.state === 'installed' && navigator.serviceWorker.controller) {
                        const toast = document.getElementById('update-toast');
                        toast.style.display = 'flex';
                        setTimeout(() => { if (toast.style.display === 'flex') toast.style.display = 'none'; }, 30000);
                    }
                };
            };
        }).catch(err => console.log('SW gagal:', err));
    });
}

// --- Online Status ---
function updateOnlineStatus() {
    const b = document.getElementById('online-badge');
    b.textContent = navigator.onLine ? '● Online' : '● Offline';
    b.className = navigator.onLine ? 'online' : 'offline';
}
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

// --- Clock ---
function startClock() {
    const el = document.getElementById('header-clock');
    setInterval(() => {
        el.textContent = new Date().toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
    }, 1000);
}

// --- Navigasi ---
function showTab(tabId, navEl) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    if (navEl) navEl.classList.add('active');
    if (isKasirScanning) stopKasirScanner();
    if (tabId === 'tab-inventory') renderInventoryList();
    if (tabId === 'tab-laporan') renderLaporan();
    if (tabId === 'tab-produk-list') renderProdukList();
}
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => showTab(item.getAttribute('data-tab'), item));
});

// --- Init ---
window.onload = () => {
    startClock();
    updateOnlineStatus();
    renderInventoryList();
    renderProdukList();
    renderProdukKasirGrid();
    renderLaporan();
    updateCartUI();
    initAudio();
};