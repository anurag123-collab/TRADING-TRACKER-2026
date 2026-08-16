// Service Worker for Trading Tracker 2026 - Offline PWA Support
const CACHE_NAME = 'trading-tracker-v1.0.0';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './profile-data.js',
    './qrcode.min.js',
    './profile.jpg',
    './version.json'
];

// Install Event - Pre-cache core app shell
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[ServiceWorker] Caching App Shell');
            return cache.addAll(ASSETS_TO_CACHE);
        }).then(() => self.skipWaiting())
    );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(
                keyList.map((key) => {
                    if (key !== CACHE_NAME) {
                        console.log('[ServiceWorker] Removing old cache', key);
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch Event - Stale-while-revalidate strategy for maximum speed & offline reliability
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    // Ignore API network requests to allow live sync
    if (event.request.url.includes('/api/')) {
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
            }).catch(() => {
                // If offline and request fails, return cached response
                return cachedResponse;
            });

            return cachedResponse || fetchPromise;
        })
    );
});
