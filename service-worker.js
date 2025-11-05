// =============================
// 🔄 SERVICE WORKER - Rede primeiro + versão automática legível
// =============================

// Gera versão automática (ex: repositorio-cache-20251105-1342)
const dataAgora = new Date();
const dataFormatada = dataAgora.toISOString().slice(0, 16).replace(/[-:T]/g, "");
const CACHE_NAME = "repositorio-cache-" + dataFormatada;

// Lista de arquivos essenciais para cache inicial
const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./links.txt",
  "./manifest.webmanifest",
  "./icons/icon-96.png"
];

// Instala o SW e salva os arquivos básicos
self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

// Ativa o SW, limpa caches antigos e assume controle
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  clients.claim();
});

// Estratégia: rede primeiro, fallback para cache
self.addEventListener("fetch", event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(event.request);
        return (
          cachedResponse ||
          new Response("Offline - conteúdo não disponível", {
            headers: { "Content-Type": "text/plain; charset=utf-8" }
          })
        );
      })
  );
});

// Envia a versão e data legível para o front-end
self.addEventListener("message", event => {
  if (event.data && event.data.type === "GET_VERSION") {
    const dataLocal = new Date().toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
    event.source.postMessage({
      type: "VERSION",
      value: CACHE_NAME,
      dataLegivel: dataLocal
    });
  }
});
