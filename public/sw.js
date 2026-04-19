const CACHE_NAME = 'gwr-cache-v3.3';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './app.js',
  './workers/watermark-worker.js',
  './i18n/en-US.json',
  './i18n/es-ES.json',
  './i18n/pt-BR.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== 'share-target') {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Handle Share Target POST
  if (event.request.method === 'POST' && url.pathname.endsWith('/share')) {
    event.respondWith(
      (async () => {
        const formData = await event.request.formData();
        const file = formData.get('image');

        if (file) {
          const cache = await caches.open('share-target');
          await cache.put('shared-image', new Response(file));
        }

        return Response.redirect('./?share=true', 303);
      })()
    );
    return;
  }

  // Default: Cache first, then network
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
