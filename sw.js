// ProPOS Service Worker - v1.0.0
const CACHE_NAME = 'propos-v1';
const RUNTIME_CACHE = 'propos-runtime-v1';

// Asset yang di-cache saat install (App Shell)
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// CDN resources yang di-cache saat pertama kali diakses
const CDN_ORIGINS = [
  'cdn.jsdelivr.net',
  'unpkg.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com'
];

// ===== INSTALL EVENT =====
self.addEventListener('install', event => {
  console.log('[SW] Installing ProPOS Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Pre-caching app shell');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        console.log('[SW] Install complete');
        return self.skipWaiting();
      })
      .catch(err => console.log('[SW] Pre-cache failed (offline ok):', err))
  );
});

// ===== ACTIVATE EVENT =====
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

// ===== FETCH EVENT =====
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip non-GET & non-http(s) requests
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;

  // Strategy: Cache First for app shell & icons
  if (url.origin === self.location.origin || url.pathname.endsWith('.html')) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  // Strategy: Stale While Revalidate for CDN assets (fonts, scripts)
  if (CDN_ORIGINS.some(origin => url.hostname.includes(origin))) {
    event.respondWith(staleWhileRevalidate(event.request));
    return;
  }

  // Default: Network with fallback
  event.respondWith(networkWithFallback(event.request));
});

// ===== STRATEGIES =====

// Cache First → good for static assets
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

// Stale While Revalidate → good for CDN fonts/scripts
async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then(response => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => null);

  return cached || await fetchPromise || offlineFallback(request);
}

// Network first with offline fallback
async function networkWithFallback(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || offlineFallback(request);
  }
}

// Fallback page when fully offline
function offlineFallback(request) {
  const url = new URL(request.url);
  if (request.headers.get('accept')?.includes('text/html')) {
    return caches.match('./index.html');
  }
  return new Response('', { status: 408, statusText: 'Offline' });
}

// ===== BACKGROUND SYNC (for future use) =====
self.addEventListener('sync', event => {
  if (event.tag === 'sync-sales') {
    console.log('[SW] Background sync: sales data');
  }
});

// ===== PUSH NOTIFICATION (for future use) =====
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
