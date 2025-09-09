// sw.js — Service Worker com cache versionado e network-first para JS/HTML
const CACHE = 'mp-cache-v6'; // <- aumente ao atualizar

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then((cache) =>
      cache.addAll([
        './',
        './index.html?v=6',
        './style.css?v=6',
        './manifest.json?v=6',
        './main.js?v=6',
        './auth.js?v=6',
        './state.js?v=6',
        './ui.js?v=6',
        './tabs.js?v=6',
        './checkout.js?v=6',
        './returns.js?v=6',
        './render_return.js?v=6',
        './openouts.js?v=6',
        './exports.js?v=6',
        './exports_bind.js?v=6',
        './finance.js?v=6',
        './ui_users.js?v=6',
        './gas.js?v=6',
        './gas_bind.js?v=6',
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
  // network-first para scripts e documentos — evita ficar preso no cache
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
  // cache-first para o resto
  e.respondWith(caches.match(req).then(cached => cached || fetch(req)));
});