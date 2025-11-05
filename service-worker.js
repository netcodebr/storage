// =============================
// 🔄 SERVICE WORKER - Rede primeiro + links.txt sempre online + fallback completo
// =============================

// Cria data UTC e gera código da versão (AAAAMMDDHHMM)
const agora = new Date();
const ano = agora.getUTCFullYear();
const mes = String(agora.getUTCMonth() + 1).padStart(2, "0");
const dia = String(agora.getUTCDate()).padStart(2, "0");
const horaUTC = agora.getUTCHours();
const min = String(agora.getUTCMinutes()).padStart(2, "0");

// Corrige para horário de Brasília (UTC-3)
const horaBR = String((horaUTC - 3 + 24) % 24).padStart(2, "0");

// Código e data fixa
const versaoCodigo = `${ano}${mes}${dia}${horaUTC}${min}`; // Ex: 202511051805 (hora UTC)
const dataLegivel = `${dia}/${mes}/${ano}, ${horaBR}h${min} (Horário de Brasília)`;

// 🚀 Atualize este valor toda vez que publicar nova versão
const CACHE_NAME = "repositorio-cache-v12";

// Lista de arquivos cacheáveis (sem o links.txt)
const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./manifest.webmanifest",
  "./icons/icon-96.png",
  "./linksoff.txt" // ⚙️ Mantemos o linksoff.txt para fallback offline
];

// Instala o SW e salva apenas os arquivos essenciais
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

// Estratégia: rede primeiro, com exceção do links.txt (sempre da rede e sem cache)
self.addEventListener("fetch", event => {
  const url = event.request.url;

  // 🔵 Sempre buscar o links.txt da rede (sem cache, sem fallback interno)
  if (url.includes("links.txt")) {
    event.respondWith(
      fetch(event.request, { cache: "no-store" })
        .then(response => response)
        .catch(() => Promise.reject("Falha ao buscar links.txt"))
    );
    return;
  }

  // 🟩 Para os demais arquivos: rede primeiro, depois cache
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

// Log de depuração
console.log(
  `[PWA] Service Worker ativo — Versão ${versaoCodigo} — Atualizado em ${dataLegivel}`
);
