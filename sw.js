// ============================================================
// SERVICE WORKER • НАША ИСТОРИЯ (PWA & OFFLINE CACHE)
// ============================================================

const CACHE_NAME = 'love-story-v4';
const STATIC_ASSETS = [
  './',
  './index.html',
  './css/styles.css',
  './js/bundle.js',
  './manifest.json'
];

// Install: Cache critical app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Stale-while-revalidate for local assets, cache-first for stored media, network-first for live API
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Supabase REST queries should always be network-first/live (never cached by SW)
  if (url.hostname.includes('supabase.co') && url.pathname.includes('/rest/v1/')) return;

  // Telegram API bypass
  if (url.hostname.includes('telegram.org')) return;

  // Caching Supabase Storage photos for offline PWA viewing
  const isSupabasePhoto = url.hostname.includes('supabase.co') && url.pathname.includes('/storage/v1/object/public/photos/');
  if (isSupabasePhoto) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          return fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => cachedResponse);
        });
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached and update in background
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse);
            });
          }
        }).catch(() => {});
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }
        // Cache static CDN dependencies
        if (
          url.hostname.includes('cdnjs.cloudflare.com') ||
          url.hostname.includes('cdn.tailwindcss.com') ||
          url.hostname.includes('fonts.googleapis.com') ||
          url.hostname.includes('fonts.gstatic.com') ||
          url.hostname.includes('cdn.jsdelivr.net') ||
          url.hostname.includes('unpkg.com')
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Fallback for HTML navigation
        if (event.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('./index.html');
        }
      });
    })
  );
});
