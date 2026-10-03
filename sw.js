const CACHE_NAME = 'mekha-weather-v24';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/thai-districts.json',
  '/icon.jpg',
  '/icon-192.png',
  '/icon-512.png',
  '/og-hero.jpg'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).catch(() => {})
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.endsWith('.apk')) return;

  if (event.request.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' }).then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return res;
      }).catch(() =>
        // caches.match() คืน Promise (truthy เสมอ) ต้องเทียบภายใน .then จึงจะ fallback ไปหน้า index ได้
        caches.match(event.request).then(hit => hit || caches.match('/index.html'))
      )
    );
    return;
  }

  event.respondWith(
    fetch(event.request).then(res => {
      const clone = res.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
      return res;
    }).catch(() => caches.match(event.request))
  );
});
