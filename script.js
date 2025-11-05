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

// ====== MOSTRA VERSÃO LEGÍVEL DO SERVICE WORKER ======
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then(reg => {
    reg.active.postMessage({ type: "GET_VERSION" });
  });

  navigator.serviceWorker.addEventListener("message", event => {
    if (event.data && event.data.type === "VERSION") {
      const versaoEl = document.getElementById("versao");

      // 🔧 Formata data local para padrão institucional
      const agora = new Date();
      const dia = String(agora.getDate()).padStart(2, "0");
      const mes = String(agora.getMonth() + 1).padStart(2, "0");
      const ano = agora.getFullYear();
      const hora = String(agora.getHours()).padStart(2, "0");
      const min = String(agora.getMinutes()).padStart(2, "0");
      const dataFormatada = `${dia}/${mes}/${ano} - ${hora}h${min}`;

      // 🔠 Exibe de forma uniforme em todos dispositivos
      versaoEl.textContent = `Versão automática — Atualizada em ${dataFormatada}`;
    }
  });
}
