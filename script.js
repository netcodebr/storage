// =============================
// 📂 SCRIPT PRINCIPAL DO REPOSITÓRIO COM ALERTA AUTOMÁTICO
// =============================

// Carrega a lista de links do repositório
async function carregarLinks() {
  const lista = document.getElementById("lista");

  try {
    const resposta = await fetch("links.txt");
    const texto = await resposta.text();
    const urls = texto.split(/\r?\n/).filter(l => l.trim() !== "");

    lista.innerHTML = "";

    if (urls.length === 0) {
      lista.innerHTML = "<p class='mensagem-carregando'>Nenhum link encontrado no repositório.</p>";
      return;
    }

    for (const url of urls) {
      const base = new URL(url);
      const nomeProjeto =
        base.pathname.split("/")[2]?.toUpperCase() ||
        base.hostname.replace("www.", "").toUpperCase() ||
        "PROJETO";

      const div = document.createElement("div");
      div.className = "card";
      div.innerHTML = `
        <img src="icons/icon-96.png" alt="favicon">
        <div>
          <a href="${url}" target="_blank">${nomeProjeto}</a>
          <small title="${url}">${url}</small>
        </div>
      `;
      lista.appendChild(div);
    }
  } catch (err) {
    lista.innerHTML = "<p class='mensagem-carregando'>Erro ao carregar os projetos.</p>";
    console.error("Erro:", err);
  }
}

carregarLinks();

// =============================
// 🧭 SERVICE WORKER + SWEETALERT2 (alerta automático)
// =============================

// Adiciona SweetAlert2 (biblioteca visual)
const sweet = document.createElement("script");
sweet.src = "https://cdn.jsdelivr.net/npm/sweetalert2@11";
document.head.appendChild(sweet);

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("service-worker.js")
    .then(() => console.log("[PWA] Service Worker registrado com sucesso."))
    .catch(err => console.error("[PWA] Falha ao registrar SW:", err));

  // Função para exibir a versão no rodapé
  function exibirVersao(versao, data) {
    const versaoEl = document.getElementById("versao");
    versaoEl.textContent = `Versão — ${versao} — Atualizada em ${data}`;
  }

  // Carrega dados salvos (para manter fixo entre recarregamentos)
  const versaoSalva = localStorage.getItem("versaoCodigo");
  const dataSalva = localStorage.getItem("versaoData");

  if (versaoSalva && dataSalva) {
    exibirVersao(versaoSalva, dataSalva);
  }

  // Solicita a versão atual ao service worker
  navigator.serviceWorker.ready.then(reg => {
    reg.active.postMessage({ type: "GET_VERSION" });
  });

  // Recebe mensagem do SW com versão e data
  navigator.serviceWorker.addEventListener("message", event => {
    if (event.data && event.data.type === "VERSION") {
      const versaoCodigo = event.data.versao || "????";
      const dataAtualizacao = event.data.data || "Data desconhecida";

      const versaoAnterior = localStorage.getItem("versaoCodigo");
      const dataAnterior = localStorage.getItem("versaoData");

      // Detecta nova versão
      if (versaoCodigo !== versaoAnterior) {
        // Salva nova versão
        localStorage.setItem("versaoCodigo", versaoCodigo);
        localStorage.setItem("versaoData", dataAtualizacao);

        // Mostra alerta elegante de atualização automática
        sweet.onload = () => {
          Swal.fire({
            title: "Nova versão detectada!",
            text: "O sistema está sendo atualizado automaticamente.",
            icon: "info",
            showConfirmButton: false,
            timer: 2500,
            background: "#f5f7fa",
            color: "#004aad",
            backdrop: "rgba(0,0,0,0.4)"
          });
        };
      }

      // Atualiza exibição no rodapé
      exibirVersao(versaoCodigo, dataAtualizacao);
      console.log(`[PWA] Versão fixa — ${versaoCodigo} — ${dataAtualizacao}`);
    }
  });
}
