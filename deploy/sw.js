const CACHE_NAME = 'cat-game-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/src/main.js',
  '/src/game.js',
  '/src/config.js',
  '/src/creature.js',
  '/src/animation-creature.js',
  '/src/creature-renderer.js',
  '/src/particle.js',
  '/src/sound-manager.js',
  '/src/game-mode.js',
  '/src/animation-mode.js',
  '/src/ui-controller.js',
  '/src/input-handler.js',
  '/src/creature-states.js',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
