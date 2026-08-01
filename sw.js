/**
 * 梦天工作台 - Service Worker
 * Offline caching for PWA install
 */
const CACHE_NAME = 'mengtian-v2';
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/storage.js',
  './js/app.js',
  './js/modules/dashboard.js',
  './js/modules/hotspots.js',
  './js/modules/calendar.js',
  './js/modules/todos.js',
  './js/modules/bookshelf.js',
  './js/modules/learning.js',
  './js/modules/water.js',
  './js/modules/review.js',
  './js/modules/exercise.js',
  './js/modules/inspiration.js',
  './manifest.json',
];

// Install: cache all assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS).catch((err) => {
        console.warn('SW: cache addAll partial failure', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

// Fetch: cache-first for assets, network-first for data
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // For same-origin assets, use cache-first
  const url = new URL(event.request.url);
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const fetched = fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone);
            });
          }
          return response;
        }).catch(() => cached);
        return cached || fetched;
      })
    );
  }
});
