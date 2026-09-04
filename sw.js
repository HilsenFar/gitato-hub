// GITATO hub service worker — tiny site, network first with cache fallback.
// Bump VERSION when the site changes.
const VERSION = 'gitato-v18';

const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './ds.css',
  './icons.svg',
  './assets/sprunkiverse-cover.png',
  './assets/gitato-game-cover.png',
  './assets/beatsurfer-cover.png',
  './assets/frequencypilot-cover.png',
  './assets/addson-cover.png',
  './assets/mediestudio-cover.png',
  './assets/command-cover.png',
  './assets/rltracker-cover.png',
  './assets/rankoverlay-cover.png',
  './assets/roll-cover.png',
  './assets/icons/icon-192.png',
  './assets/icons/icon-180.png',
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

// Exact match only: /rl-tracker/index.html and /rts/index.html are real pages
// on this origin and must never be stored as the hub shell.
const isShellNav = (url) => url.pathname === '/' || url.pathname === '/index.html';

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
      // offline: only the hub shell may answer a navigation; a deep link
      // (/rl-tracker/, /rts/) gets the browser's own offline page instead of
      // the hub html with its relative paths broken
      .catch(() => (nav && !isShellNav(url)) ? Response.error() : caches.match(nav ? './index.html' : req)),
  );
});
