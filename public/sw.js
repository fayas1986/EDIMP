// EDIMP Platform Service Worker v1.0
// Caches application shell, assets, and migration job metadata for offline access

const CACHE_NAME = 'edimp-shell-v2';
const DATA_CACHE_NAME = 'edimp-metadata-cache-v2';

// Static resources to pre-cache on install
const PRECACHE_RESOURCES = [
  '/',
  '/index.html',
];

// Install event: Pre-cache app shell and skip waiting
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing EDIMP Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching application shell...');
      return cache.addAll(PRECACHE_RESOURCES).catch((err) => {
        console.warn('[Service Worker] Non-critical precache error:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate event: Clean up legacy caches and claim clients
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating EDIMP Service Worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== DATA_CACHE_NAME) {
            console.log('[Service Worker] Clearing legacy cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event: Network-first for API requests, Cache-first/Stale-while-revalidate for static assets
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Handle API Requests (Network First, fallback to cache or synthetic offline JSON)
  if (requestUrl.pathname.startsWith('/api/')) {
    console.log('[Service Worker] Fetching API:', requestUrl.pathname);
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // If valid response, clone into metadata cache
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(DATA_CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          console.log('[Service Worker] Network failed. Serving cached API metadata:', requestUrl.pathname);
          const cachedResponse = await caches.match(event.request);
          if (cachedResponse) {
            return cachedResponse;
          }

          // Fallback synthetic response for offline API queries
          return new Response(
            JSON.stringify({
              offline: true,
              cachedAt: new Date().toISOString(),
              message: 'Offline Mode: Serving cached migration job metadata & system activity.',
              success: true,
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        })
    );
    return;
  }

  // Handle Static Assets & HTML Navigation (Cache First with Network Fallback & Update)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch background update for cache revalidation
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse);
            });
          }
        }).catch(() => {/* Offline background refresh silent catch */});

        return cachedResponse;
      }

      // If not in cache, fetch from network
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // If HTML page request fails offline, serve index.html
        if (event.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('/index.html') || caches.match('/');
        }
      });
    })
  );
});

// Handle custom message commands from main thread (e.g. Purge Cache, Manual Sync)
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'CLEAR_OFFLINE_CACHE') {
    caches.delete(DATA_CACHE_NAME).then(() => {
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ success: true, message: 'Offline metadata cache cleared.' });
      }
    });
  }

  if (event.data.type === 'GET_CACHE_STATS') {
    Promise.all([
      caches.open(CACHE_NAME).then(c => c.keys()),
      caches.open(DATA_CACHE_NAME).then(c => c.keys()),
    ]).then(([shellKeys, dataKeys]) => {
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({
          shellCount: shellKeys.length,
          dataCount: dataKeys.length,
          timestamp: new Date().toISOString()
        });
      }
    });
  }
});
