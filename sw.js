// GITATO hub service worker — tiny site, network first with cache fallback.
// Bump VERSION when the site changes.
const VERSION = 'gitato-v5';

const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/sprunkiverse-cover.png',
  './assets/gitato-game-cover.png',
  './assets/beatsurfer-cover.png',
  './assets/frequencypilot-cover.png',
  './assets/addson-cover.png',
  './assets/mediestudio-cover.png',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(VERSION)
      .then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: 'reload' })))),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const isShellNav = (url) => url.pathname === '/' || url.pathname.endsWith('/index.html');

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const nav = req.mode === 'navigate';
  e.respondWith(
    fetch(req)
      .then((res) => {
        // only a real shell navigation may refresh the cached shell — a
        // navigated-to image must never overwrite it
        if (res.ok && (!nav || isShellNav(url))) {
          const copy = res.clone();
          e.waitUntil(caches.open(VERSION).then((c) => c.put(nav ? './index.html' : req, copy)));
        }
        return res;
      })
      .catch(() => caches.match(nav ? './index.html' : req)),
  );
});
