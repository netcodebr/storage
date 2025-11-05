// =============================
// 🔄 SERVICE WORKER - Rede primeiro + versão fixa + links.txt sempre online
// =============================

const BUILD_VERSION = "20251105-01"; // 🧠 altere SOMENTE ao publicar nova versão

// 🕒 Data fixa (Horário de Brasília)
const agora = new Date();
const ano = agora.getUTCFullYear();
const mes = String(agora.getUTCMonth() + 1).padStart(2, "0");
const dia = String(agora.getUTCDate()).padStart(2, "0");
const horaUTC = agora.getUTCHours();
const min = String(agora.getUTCMinutes()).padStart(2, "0");
const horaBR = String((horaUTC - 3 + 24) % 24).padStart(2, "0");
const dataLegivel = `${dia}/${mes}/${ano}, ${horaBR}h${min} (Horário de Brasília)`;

const versaoCodigo = BUILD_VERSION;
const CACHE_NAME = "repositorio-cache-" + BUILD_VERSION;

// Lista de arquivos cacheáveis
const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./manifest.webmanifest",
  "./icons/icon-96.png",
  "./linksoff.txt"
];

// Instala o SW e salva arquivos essenciais
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

// Estratégia: rede primeiro + links.txt sempre online
self.addEventListener("fetch", event => {
  const url = event.request.url;

  // 🟦 Força links.txt sempre da rede, sem cache
  if (url.includes("links.txt")) {
    event.respondWith(
      fetch(event.request, { cache: "no-store" })
        .then(response => response)
        .catch(() => Promise.reject("Falha ao buscar links.txt"))
    );
    return;
  }

  // 🟩 Outros arquivos: rede primeiro, depois cache
  event.respondWith(
    fetch(event.request)
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

console.log(`[PWA] Service Worker ativo — Versão ${versaoCodigo} — Atualizado em ${dataLegivel}`);
