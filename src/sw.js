const CACHE_NAME = "image-converter-v3";
const ASSETS_TO_CACHE = [
    "./",
    "./index.html",
    "./style.css",
    "./script.js",
    "./manifest.json",
    "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js",
    "https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js"
];

// 1. Install Event: Cache files
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log("Opened cache");
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// 2. Fetch Event: Serve from cache if available, otherwise fetch from network
self.addEventListener("fetch", (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            // Return cached response if found
            if (response) {
                return response;
            }
            // Otherwise, fetch from network and cache it
            return fetch(event.request).then((fetchResponse) => {
                // Don't cache if not a valid response
                if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type === 'error') {
                    return fetchResponse;
                }
                
                // Cache the new response for next time
                const responseToCache = fetchResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });
                
                return fetchResponse;
            }).catch(() => {
                // If offline and not cached, return a basic response
                return new Response('Offline - resource not cached', {
                    status: 503,
                    statusText: 'Service Unavailable'
                });
            });
        })
    );
});

// 3. Activate Event: Clean up old caches (if you update version)
self.addEventListener("activate", (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (!cacheWhitelist.includes(cacheName)) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});