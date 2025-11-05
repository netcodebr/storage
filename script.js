// =============================
// 📂 SCRIPT PRINCIPAL DO REPOSITÓRIO - com fallback linksoff.txt + alertas automáticos
// =============================

// Adiciona SweetAlert2
const sweet = document.createElement("script");
sweet.src = "https://cdn.jsdelivr.net/npm/sweetalert2@11";
document.head.appendChild(sweet);

// =============================
// 🧠 Função principal para carregar os links
// =============================
async function carregarLinks(arquivo = "links.txt") {
  const lista = document.getElementById("lista");

  try {
    const resposta = await fetch(arquivo, { cache: "no-store" });
    if (!resposta.ok) throw new Error("Erro ao buscar arquivo: " + arquivo);

    const texto = await resposta.text();
    const urls = texto.split(/\r?\n/).filter(l => l.trim() !== "");

    lista.innerHTML = "";

    if (urls.length === 0) {
      lista.innerHTML = "<p class='mensagem-carregando'>Nenhum link encontrado.</p>";
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

    console.log(`[PWA] Arquivo carregado com sucesso: ${arquivo}`);
  } catch (err) {
    console.warn(`[PWA] Falha ao carregar ${arquivo}:`, err);

    if (arquivo === "links.txt") {
      // Se falhou o principal, tenta o offline
      carregarLinks("linksoff.txt");

      sweet.onload = () => {
        Swal.fire({
          title: "Modo Offline Ativado",
          text: "Sem conexão. Mostrando lista offline (linksoff.txt).",
          icon: "warning",
          confirmButtonText: "OK",
          confirmButtonColor: "#004aad",
          background: "#f5f7fa",
          color: "#004aad",
          backdrop: "rgba(0,0,0,0.4)"
        });
      };
    } else {
      lista.innerHTML = "<p class='mensagem-carregando'>Não foi possível carregar os projetos.</p>";
    }
  }
}

// Inicia o carregamento padrão
carregarLinks();

// =============================
// 🧭 SERVICE WORKER + ALERTA DE NOVA VERSÃO
// =============================

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("service-worker.js")
    .then(() => console.log("[PWA] Service Worker registrado com sucesso."))
    .catch(err => console.error("[PWA] Falha ao registrar SW:", err));

  function exibirVersao(versao, data) {
    const versaoEl = document.getElementById("versao");
    versaoEl.textContent = `Versão — ${versao} — Atualizada em ${data}`;
  }

  const versaoSalva = localStorage.getItem("versaoCodigo");
  const dataSalva = localStorage.getItem("versaoData");
  if (versaoSalva && dataSalva) exibirVersao(versaoSalva, dataSalva);

  navigator.serviceWorker.ready.then(reg => {
    reg.active.postMessage({ type: "GET_VERSION" });
  });

  navigator.serviceWorker.addEventListener("message", event => {
    if (event.data && event.data.type === "VERSION") {
      const versaoCodigo = event.data.versao || "????";
      const dataAtualizacao = event.data.data || "Data desconhecida";

      const versaoAnterior = localStorage.getItem("versaoCodigo");
      if (versaoCodigo !== versaoAnterior) {
        localStorage.setItem("versaoCodigo", versaoCodigo);
        localStorage.setItem("versaoData", dataAtualizacao);

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

      exibirVersao(versaoCodigo, dataAtualizacao);
      console.log(`[PWA] Versão fixa — ${versaoCodigo} — ${dataAtualizacao}`);
    }
  });
}
