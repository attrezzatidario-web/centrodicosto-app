/* Centro di Costo — service worker: app utilizzabile anche offline */
const CACHE = 'centro-costo-v157';
const SHELL = ['./', 'index.html', 'style.css', 'cdc.css', 'app.js', 'settori.js', 'auth-fx.js', 'motion.js', 'tour.js', 'analisi.js', 'dipendenti.js', 'presenze/index.html', 'presenze/presenze.js', 'presenze/presenze.css', 'presenze/manifest.json', 'tour.css', 'gls-geo.js', 'manifest.json', 'manifest-pv.json', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'logo.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return; // i dati Google passano diretti
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' }).then(r => {
      const copy = r.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return r;
    }).catch(() => caches.match(e.request).then(r => r || (u.pathname.includes('/console/') ? caches.match('console/index.html') : u.pathname.includes('/presenze/') ? caches.match('presenze/index.html') : caches.match('index.html'))))
  );
});
