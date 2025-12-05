// --- Cache Configuration ---
const CACHE_VERSION = 10;
const CACHE_NAME = `buvette-plus-cache-v${CACHE_VERSION}`;
const FONT_CACHE_NAME = 'buvette-plus-font-cache-v1';
const CDN_CACHE_NAME = 'buvette-plus-cdn-cache-v1';

// A list of all caches to manage. This helps in cleaning up old, unused caches.
const ALL_CACHES = [CACHE_NAME, FONT_CACHE_NAME, CDN_CACHE_NAME];

// --- App Shell ---
// Files essential for the application's startup. These are cached on install.
const APP_SHELL_URLS = [
  '/', // Serves index.html at the root
  '/index.html',
  '/manifest.json',
  'https://i.ibb.co/3m4x0tW/icon-192.png',
  'https://i.ibb.co/L8d5g2x/icon-512.png'
];

// --- Caching Strategies ---

/**
 * Stale-While-Revalidate Strategy:
 * Responds with the cached version immediately if available (stale),
 * while simultaneously fetching an updated version from the network in the background
 * to update the cache for the next request (revalidate).
 * @param {string} cacheName - The name of the cache to use.
 * @param {Request} request - The request to handle.
 * @returns {Promise<Response>}
 */
const staleWhileRevalidate = (cacheName, request) => {
  return caches.open(cacheName).then(cache => {
    return cache.match(request).then(cachedResponse => {
      const fetchPromise = fetch(request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      }).catch(err => {
         console.warn(`[SW] Network fetch failed for ${request.url}. Serving stale content if available.`, err);
      });
      
      // Return cached response immediately if it exists, otherwise wait for the network response.
      return cachedResponse || fetchPromise;
    });
  });
};

// --- Service Worker Event Listeners ---

// INSTALL: Caches the app shell.
self.addEventListener('install', event => {
  console.log('[SW] Install event');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching app shell.');
        return cache.addAll(APP_SHELL_URLS);
      })
      .then(() => self.skipWaiting()) // Activate the new service worker immediately
      .catch(error => {
        console.error('[SW] App Shell caching failed during install:', error);
      })
  );
});

// ACTIVATE: Cleans up old caches.
self.addEventListener('activate', event => {
  console.log('[SW] Activate event');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => !ALL_CACHES.includes(cacheName))
          .map(cacheName => {
              console.log(`[SW] Deleting old cache: ${cacheName}`);
              return caches.delete(cacheName);
          })
      );
    }).then(() => self.clients.claim()) // Take control of all open clients
  );
});

// FETCH: Intercepts network requests and applies caching strategies.
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-GET requests (e.g., POST) as they are not cacheable.
  if (request.method !== 'GET') {
    return;
  }
  
  // Strategy 1: App Shell & Navigation.
  // Use a cache-first strategy for navigation. This makes the app load instantly offline.
  // The app shell is updated when the service worker itself is updated.
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match('/index.html')
        .then(response => response || fetch('/index.html'))
        .catch(error => {
            console.error('[SW] Failed to serve navigation request for /index.html:', error);
            // You could return a specific offline page here if you had one.
        })
    );
    return;
  }

  // Strategy 2: Cross-origin assets (CDNs, Fonts).
  // Use Stale-While-Revalidate for performance and resilience.
  if (url.origin !== self.origin) {
    const cache = (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com')
      ? FONT_CACHE_NAME
      : CDN_CACHE_NAME;
    event.respondWith(staleWhileRevalidate(cache, request));
    return;
  }

  // Strategy 3: Same-origin assets (JS, CSS bundles).
  // Use a cache-first strategy that populates the cache on miss.
  event.respondWith(
    caches.match(request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }
      
      return fetch(request).then(networkResponse => {
        // If the fetch is successful, cache the response for future offline use.
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      });
    })
  );
});