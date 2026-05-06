const CACHE_NAME = 'afin-cache-v1';
const OFFLINE_URL = '/';

const urlsToCache = [
  '/',
  '/notes',
  '/pyqs',
  '/assignments',
  '/offline',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only cache GET requests
  if (event.request.method !== 'GET') return;

  // Handle API requests (Network first, then cache)
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // If response is good, clone and cache it
          if (response.ok) {
            const responseClone = response.clone();
            caches.open('afin-api-cache-v1').then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // If network fails, try to return from cache
          return caches.match(event.request).then((response) => {
            if (response) return response;
            return new Response(JSON.stringify({ error: 'You are offline', offline: true }), {
              headers: { 'Content-Type': 'application/json' }
            });
          });
        })
    );
    return;
  }

  // Handle static assets & pages (Stale-while-revalidate)
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          // Fetch new version in background
          fetch(event.request).then((newResponse) => {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, newResponse);
            });
          }).catch(() => {});
          return response;
        }
        
        return fetch(event.request).catch(() => {
          // Return generic offline page or content if not found
          if (event.request.mode === 'navigate') {
            return caches.match(OFFLINE_URL);
          }
        });
      })
  );
});
