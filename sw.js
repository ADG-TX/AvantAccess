/* GOTA HVAC Management — offline support.
 *
 * The app used to need a live connection just to start: five scripts come from
 * CDNs and the page itself from GitHub Pages. In a metal garage with no bars
 * that meant it would not open at all. This caches the shell so it launches
 * offline; Firestore's own persistence then queues anything logged while out
 * of range and replays it on the way back.
 *
 * Bump CACHE_VERSION on release — old caches are dropped on activate.
 */
const CACHE_VERSION = 'gota-v3';
const SHELL = CACHE_VERSION + '-shell';

// Everything needed to render the app with no network at all.
const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './apple-touch-icon.png',
  './icon-192.png',
  './icon-512.png',
  './favicon-32.png',
  './IMG_9065.JPG',
  'https://cdn.tailwindcss.com',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-storage-compat.js',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js',
];

// Live data and uploads must never be served from cache — Firestore and
// Storage handle their own offline behaviour and their URLs carry auth tokens.
const NEVER_CACHE = [
  'firestore.googleapis.com',
  'firebasestorage.googleapis.com',
  'storage.googleapis.com',
  'identitytoolkit.googleapis.com',
  'securetoken.googleapis.com',
  'api.anthropic.com',
  'firebaseinstallations.googleapis.com',
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL);
    // One bad URL must not fail the whole install, so add them individually.
    await Promise.all(PRECACHE.map(async url => {
      try { await cache.add(new Request(url, { cache: 'reload' })); }
      catch (e) { console.warn('[sw] could not precache', url, e.message); }
    }));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => !k.startsWith(CACHE_VERSION)).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (NEVER_CACHE.some(h => url.hostname.includes(h))) return;   // straight to network

  // The page itself: prefer the network so a deploy lands immediately, but
  // fall back to cache the moment the network is unavailable or slow.
  if (req.mode === 'navigate' || (req.destination === 'document')) {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(SHELL);
        cache.put('./index.html', fresh.clone());
        return fresh;
      } catch (e) {
        const cached = await caches.match('./index.html', { ignoreSearch: true });
        return cached || new Response(
          '<h1 style="font-family:system-ui;padding:40px">Offline</h1><p style="font-family:system-ui;padding:0 40px">Open the app once with a connection and it will work offline after that.</p>',
          { headers: { 'Content-Type': 'text/html' }, status: 503 });
      }
    })());
    return;
  }

  // Everything else in the shell — icons, the background photo, the CDN
  // scripts: serve from cache instantly, refresh in the background.
  event.respondWith((async () => {
    const cached = await caches.match(req, { ignoreSearch: true });
    const network = fetch(req).then(res => {
      if (res && (res.ok || res.type === 'opaque')) {
        caches.open(SHELL).then(c => c.put(req, res.clone())).catch(() => {});
      }
      return res;
    }).catch(() => null);
    return cached || (await network) || new Response('', { status: 504 });
  })());
});
