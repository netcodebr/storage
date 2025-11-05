// =============================
// 📂 SCRIPT PRINCIPAL DO REPOSITÓRIO
// =============================

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
// 🧭 SERVICE WORKER E VERSÃO FIXA
// =============================

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("service-worker.js")
    .then(() => console.log("[PWA] Service Worker registrado com sucesso."))
    .catch(err => console.error("[PWA] Falha ao registrar SW:", err));

  // Solicita a versão assim que o SW estiver pronto
  navigator.serviceWorker.ready.then(reg => {
    reg.active.postMessage({ type: "GET_VERSION" });
  });

  // Recebe a versão e exibe no rodapé
  navigator.serviceWorker.addEventListener("message", event => {
    if (event.data && event.data.type === "VERSION") {
      const versaoEl = document.getElementById("versao");
      const versaoCodigo = event.data.versao || "????";
      const dataAtualizacao = event.data.data || "Data desconhecida";
      versaoEl.textContent = `Versão — ${versaoCodigo} — Atualizada em ${dataAtualizacao}`;
      console.log(`[PWA] Versão recebida — ${versaoCodigo} — ${dataAtualizacao}`);
    }
  });
}
