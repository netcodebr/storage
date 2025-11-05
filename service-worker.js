// =============================
// ⚙️ SERVICE WORKER — Repositório PWA Profissional
// Estratégia: Rede primeiro, fallback pro cache
// version.json sempre vem da rede (sem cache)
// =============================

// Gera código de versão fixo (baseado na data de build)
const agora = new Date();
const versaoCodigo = agora
  .toISOString()
  .slice(0, 16)
  .replace(/[-:T]/g, "")
  .slice(0, 12); // Exemplo: 202511061245

const dia = String(agora.getDate()).padStart(2, "0");
const mes = String(agora.getMonth() + 1).padStart(2, "0");
const ano = agora.getFullYear();
const hora = String(agora.getHours()).padStart(2, "0");
const min = String(agora.getMinutes()).padStart(2, "0");
const dataLegivel = `${dia}/${mes}/${ano}, ${hora}h${min}min (Horário de Brasília)`;

// Nome do cache principal
const CACHE_NAME = "repositorio-cache-" + versaoCodigo;

// Lista de arquivos essenciais (cache básico para modo offline)
const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./links.txt",
  "./manifest.webmanifest",
  "./icons/icon-96.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./new.json"
];

// Instala o SW e adiciona arquivos básicos ao cache
self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
});

// Ativa nova versão e remove caches antigos
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      );
    })
  );
  clients.claim();
});

// =============================
// 🔄 Fetch — Rede primeiro, mas:
// version.json -> sempre rede
// links.txt -> sempre rede se possível
// demais arquivos -> cache se offline
// =============================
self.addEventListener("fetch", event => {
  const req = event.request;
  const url = new URL(req.url);

  // Sempre buscar o version.json direto da rede (sem cache)
  if (url.pathname.endsWith("/version.json")) {
    event.respondWith(fetch(req).catch(() => caches.match(req)));
    return;
  }

  // Buscar sempre o links.txt direto da rede (pra refletir novos projetos)
  if (url.pathname.endsWith("/links.txt")) {
    event.respondWith(
      fetch(req)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
          return response;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Estratégia geral: rede primeiro, fallback pro cache
  event.respondWith(
    fetch(req)
      .then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
        return response;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(req);
        return (
          cachedResponse ||
          new Response("Offline - conteúdo não disponível", {
            headers: { "Content-Type": "text/plain; charset=utf-8" }
          })
        );
      })
  );
});

// =============================
// 📤 Comunicação com o front-end
// =============================
self.addEventListener("message", event => {
  if (event.data && event.data.type === "GET_VERSION") {
    event.source.postMessage({
      type: "VERSION",
      versao: versaoCodigo,
      data: dataLegivel
    });
  }

  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// =============================
// 🪵 Log (para debug no console)
// =============================
console.log(
  `[PWA] Service Worker ativo — Versão ${versaoCodigo} — Atualizado em ${dataLegivel}`
);
