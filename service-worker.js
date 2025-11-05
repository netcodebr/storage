// =============================
// 🔄 SERVICE WORKER - Rede primeiro + versão sincronizada com o GitHub
// =============================

const CACHE_NAME = "repositorio-v14";
const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./manifest.webmanifest",
  "./icons/icon-96.png",
  "./linksoff.txt"
];

// Instala o SW e guarda apenas arquivos básicos
self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

// Remove caches antigos
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  clients.claim();
});

// Estratégia: rede primeiro SEMPRE (ignora cache local)
self.addEventListener("fetch", event => {
  const url = event.request.url;

  // Sempre busca da rede esses arquivos dinâmicos
  if (url.includes("links.txt") || url.includes("version.json")) {
    event.respondWith(fetch(event.request, { cache: "no-store" }));
    return;
  }

  // Outros arquivos → tenta rede, cai no cache se offline
  event.respondWith(
    fetch(event.request, { cache: "no-store" })
      .then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        return (
          cached ||
          new Response("Offline - conteúdo não disponível", {
            headers: { "Content-Type": "text/plain; charset=utf-8" }
          })
        );
      })
  );
});

// Envia versão/hora do GitHub para o front-end
self.addEventListener("message", async event => {
  if (event.data && event.data.type === "GET_VERSION") {
    try {
      const response = await fetch("version.json?cache=" + Date.now());
      const data = await response.json();
      event.source.postMessage({
        type: "VERSION",
        versao: data.build,
        data: data.data
      });
    } catch (error) {
      event.source.postMessage({
        type: "VERSION",
        versao: "Indisponível",
        data: "Offline"
      });
    }
  }
});

console.log("[PWA] Service Worker ativo — Versão e hora puxadas direto do GitHub.");
