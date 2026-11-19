// Offline-first service worker: every file the app needs is stored on the tablet.
// Bump VERSION whenever files change so tablets pick up the update next time they're online.
const VERSION = 'playroom-v11';
const FILES = [
  './', 'index.html', 'manifest.webmanifest', 'css/app.css', 'fonts/nunito.woff2',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png', 'icons/apple-touch-icon.png',
  'js/main.js', 'js/store.js', 'js/audio.js', 'js/fx.js', 'js/characters.js', 'js/words.js',
  'js/games/index.js', 'js/games/bubbles.js', 'js/games/sorter.js', 'js/games/memory.js',
  'js/games/colouring.js', 'js/games/wordbuilder.js', 'js/games/rocket.js',
  'js/games/arcade-kit.js', 'js/games/blockdrop.js', 'js/games/maze.js', 'js/games/rumble.js', 'js/games/racer.js', 'js/games/bricks.js',
  'js/games/snake.js', 'js/games/hop.js', 'js/games/whack.js', 'js/games/space.js', 'js/games/jumper.js', 'js/games/paddle.js', 'js/games/tracing.js', 'js/games/shop.js', 'js/games/clock.js', 'js/games/robot.js', 'js/games/music.js', 'js/games/jigsaw.js', 'js/games/story.js', 'js/games/homes.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

// Online: get the newest file (so updates arrive straight away), and refresh the saved copy.
// Offline or slow (over 3 seconds): use the saved copy, so the app always works without internet.
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const cached = await cache.match(e.request, { ignoreSearch: true });
    const fresh = fetch(e.request, { cache: 'no-cache' }).then(res => {
      if (res.ok) cache.put(e.request, res.clone());
      return res;
    });
    try {
      return await Promise.race([
        fresh,
        new Promise((_, rej) => setTimeout(() => rej(new Error('slow')), cached ? 3000 : 15000)),
      ]);
    } catch {
      return cached || (await cache.match('index.html')) || Response.error();
    }
  })());
});
