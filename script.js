// ====== Gera URL de favicon com fallback automático ======
function gerarFavicon(siteUrl) {
  try {
    const baseUrl = new URL(siteUrl);
    const dominio = baseUrl.hostname;

    // Usa a API do Google para obter o favicon do domínio
    return `https://www.google.com/s2/favicons?domain=${dominio}&sz=128`;
  } catch {
    return "icons/icon-96.png";
  }
}

// ====== Carrega e exibe os links ======
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
        base.pathname.split("/")[2] ||
        base.hostname.replace("www.", "") ||
        "Projeto";

      const favicon = gerarFavicon(url);

      const div = document.createElement("div");
      div.className = "card";
      div.innerHTML = `
        <img src="${favicon}" alt="favicon" onerror="this.src='icons/icon-96.png'">
        <div>
          <a href="${url}" target="_blank">${nomeProjeto}</a>
          <small>${url}</small>
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
