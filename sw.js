// sw.js — cache versionado + network-first para JS/HTML
const CACHE = 'mp-cache-v9';

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then((cache) =>
      cache.addAll([
        './',
        './index.html?v=9',
        './style.css?v=9',
        './manifest.json?v=9',
        './main.js?v=9',
        './auth.js?v=9',
        './state.js?v=9',
        './ui.js?v=9',
        './tabs.js?v=9',
        './checkout.js?v=9',
        './returns.js?v=9',
        './render_return.js?v=9',
        './openouts.js?v=9',
        './exports.js?v=9',
        './exports_bind.js?v=9',
        './finance.js?v=9',
        './ui_users.js?v=9'
      ])
    )
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.destination === 'script' || req.destination === 'document') {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }
  e.respondWith(caches.match(req).then(cached => cached || fetch(req)));
});