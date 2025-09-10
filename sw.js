// sw.js — cache versionado + network-first para JS/HTML
const CACHE = 'mp-cache-v10';

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then((cache) =>
      cache.addAll([
        './',
        './index.html?v=10',
        './style.css?v=10',
        './manifest.json?v=10',
        './main.js?v=10',
        './auth.js?v=10',
        './state.js?v=10',
        './ui.js?v=10',
        './tabs.js?v=10',
        './checkout.js?v=10',
        './returns.js?v=10',
        './render_return.js?v=10',
        './openouts.js?v=10',
        './exports.js?v=10',
        './exports_bind.js?v=10',
        './finance.js?v=10',
        './ui_users.js?v=10'
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