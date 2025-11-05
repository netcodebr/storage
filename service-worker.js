const CACHE_NAME = "repositorio-cache-v2";
const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./links.txt",
  "./manifest.webmanifest",
  "./icons/icon-96.png"
];

self.addEventListener("install", event => {
  self.skipWaiting(); // ativa imediatamente
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  clients.claim(); // força uso imediato
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response =>
      response ||
      fetch(event.request)
        .then(networkResponse => {
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, networkResponse.clone());
          });
          return networkResponse;
        })
        .catch(() =>
          new Response("Offline - conteúdo não disponível", {
            headers: { "Content-Type": "text/plain" }
          })
        )
    )
  );
});
