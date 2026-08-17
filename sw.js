// Service Worker for Trading Tracker 2026 - Ultra-Fast PWA & Instant Updates
const CACHE_NAME = 'trading-tracker-v2.9.9-' + Date.now();
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './profile-data.js',
    './qrcode.min.js',
    './profile.jpg',
    './version.json'
];

// Install Event - Pre-cache core app shell & skip waiting immediately
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        }).catch((err) => {
            console.warn('[ServiceWorker] Cache install warning:', err);
        })
    );
});

// Activate Event - Immediately purge all old cache versions
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(
                keyList.map((key) => {
                    if (key !== CACHE_NAME) {
                        console.log('[ServiceWorker] Purging old cache version:', key);
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch Event - Network First for HTML, fast cache for static assets
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    if (event.request.url.includes('/api/')) {
        return;
    }

    const isHtml = event.request.mode === 'navigate' || (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html'));

    if (isHtml) {
        event.respondWith(
            fetch(event.request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
                }
                return networkResponse;
            }).catch(() => caches.match(event.request))
        );
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            }).catch(() => cachedResponse);

            return cachedResponse || fetchPromise;
        })
    );
});
