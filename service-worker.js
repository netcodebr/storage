// =============================
// 🔄 SERVICE WORKER - Rede primeiro + versão automática fixa
// =============================

// Cria data atual e gera código da versão no formato AAAAMMDDHHMM
const agora = new Date();
const versaoCodigo = agora
  .toISOString()
  .slice(0, 16)
  .replace(/[-:T]/g, "")
  .slice(0, 12); // Ex: 202511051505

// Gera data legível (fixa)
const dia = String(agora.getDate()).padStart(2, "0");
const mes = String(agora.getMonth() + 1).padStart(2, "0");
const ano = agora.getFullYear();
const hora = String(agora.getHours()).padStart(2, "0");
const min = String(agora.getMinutes()).padStart(2, "0");
const dataLegivel = `${dia}/${mes}/${ano}, ${hora}h${min}`;

const CACHE_NAME = "repositorio-cache-" + versaoCodigo;

// Lista de arquivos essenciais
const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./links.txt",
  "./manifest.webmanifest",
  "./icons/icon-96.png"
];

// Instala e salva os arquivos básicos
self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

// Ativa nova versão e remove caches antigos
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  clients.claim();
});

// Estratégia: rede primeiro, fallback pro cache
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

// Envia versão e data fixa para o front-end
self.addEventListener("message", event => {
  if (event.data && event.data.type === "GET_VERSION") {
    event.source.postMessage({
      type: "VERSION",
      versao: versaoCodigo,
      data: dataLegivel
    });
  }
});

// Log opcional (para debug)
console.log(
  `[PWA] Service Worker ativo — Versão ${versaoCodigo} — Atualizado em ${dataLegivel}`
);
