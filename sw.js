// MUMS Progressive Web App – Service Worker v4
// Bumping version triggers automatic update detection
const CACHE_VERSION = 'v4';
const CACHE_NAME = `mums-app-cache-${CACHE_VERSION}`;
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './recipes_db.js',
  './data.js',
  './app.js',
  './manifest.json',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png'
];

// Install: cache alle app-filer. Vent IKKE med at skifte til ny worker (skipWaiting).
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(err => {
        console.warn('[SW] Fejl ved caching:', err);
      });
    })
    // skipWaiting() kaldes IKKE her – vi venter på at brugeren godkender opdatering
  );
});

// Activate: slet gamle caches og overtag alle klienter
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('[SW] Sletter gammel cache:', key);
          return caches.delete(key);
        }
      }));
    }).then(() => self.clients.claim())
  );
});

// Fetch: network-first med cache-fallback
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          if (event.request.mode === 'navigate') return caches.match('./index.html');
          return new Response('Offline: Indhold ikke tilgængeligt', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({ 'Content-Type': 'text/plain; charset=utf-8' })
          });
        });
      })
  );
});

// Modtag besked fra app om at aktivere opdatering nu
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
