// ProPOS Service Worker - v1.1.0
const CACHE_NAME = 'propos-v1';
const RUNTIME_CACHE = 'propos-runtime-v1';

// Asset yang di-cache saat install (App Shell + CDN penting)
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js',
  'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js',
  'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@500'
];

// CDN origins yang akan menggunakan stale-while-revalidate
const CDN_ORIGINS = [
  'cdn.jsdelivr.net',
  'unpkg.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com'
];

// ===== INSTALL =====
self.addEventListener('install', event => {
  console.log('[SW] Installing ProPOS Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Pre-caching app shell and critical assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        console.log('[SW] Install complete');
        return self.skipWaiting();
      })
      .catch(err => console.log('[SW] Pre-cache failed (offline ok):', err))
  );
});

// ===== ACTIVATE =====
self.addEventListener('activate', event => {
  console.log('[SW] Activating ProPOS Service Worker...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map(name => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      console.log('[SW] Activate complete');
      return self.clients.claim();
    })
  );
});

// ===== FETCH =====
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip non-GET & non-http(s)
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;

  // Cache First untuk app shell & file lokal
  if (url.origin === self.location.origin || url.pathname.endsWith('.html')) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  // Stale While Revalidate untuk CDN assets
  if (CDN_ORIGINS.some(origin => url.hostname.includes(origin))) {
    event.respondWith(staleWhileRevalidate(event.request));
    return;
  }

  // Network with fallback untuk yang lain
  event.respondWith(networkWithFallback(event.request));
});

// ===== STRATEGIES =====

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return offlineFallback(request);
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then(response => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => null);

  return cached || await fetchPromise || offlineFallback(request);
}

async function networkWithFallback(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || offlineFallback(request);
  }
}

function offlineFallback(request) {
  const url = new URL(request.url);
  if (request.headers.get('accept')?.includes('text/html')) {
    return caches.match('./index.html');
  }
  if (url.pathname.match(/\.(js|css)$/)) {
    return new Response('', { status: 200, statusText: 'Offline (cached fallback)' });
  }
  return new Response('', { status: 408, statusText: 'Offline' });
}

// ===== BACKGROUND SYNC (future) =====
self.addEventListener('sync', event => {
  if (event.tag === 'sync-sales') {
    console.log('[SW] Background sync: sales data');
  }
});

// ===== PUSH NOTIFICATION (future) =====
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    self.registration.showNotification(data.title || 'ProPOS', {
      body: data.body || '',
      icon: './icon-192.png',
      badge: './icon-192.png'
    });
  }
});