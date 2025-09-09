// sw.js — cache versionado + network-first para JS/HTML
const CACHE = 'mp-cache-v8';

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then((cache) =>
      cache.addAll([
        './',
        './index.html?v=8',
        './style.css?v=8',
        './manifest.json?v=8',
        './main.js?v=8',
        './auth.js?v=8',
        './state.js?v=8',
        './ui.js?v=8',
        './tabs.js?v=8',
        './checkout.js?v=8',
        './returns.js?v=8',
        './render_return.js?v=8',
        './openouts.js?v=8',
        './exports.js?v=8',
        './exports_bind.js?v=8',
        './finance.js?v=8',
        './ui_users.js?v=8',
        // './gas.js?v=8',
        // './gas_bind.js?v=8',
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