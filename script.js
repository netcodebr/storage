// =============================
// 📂 SCRIPT PRINCIPAL - Rede + versão sincronizada via GitHub (Horário de Brasília)
// =============================

async function carregarLinks(arquivo = "links.txt") {
  const lista = document.getElementById("lista");

  try {
    const resposta = await fetch(arquivo, { cache: "no-store" });
    if (!resposta.ok) throw new Error("Erro ao buscar " + arquivo);

    const texto = await resposta.text();
    const urls = texto.split(/\r?\n/).filter(l => l.trim() !== "");
    lista.innerHTML = "";

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

    console.log(`[PWA] Links carregados com sucesso: ${arquivo}`);
  } catch (err) {
    console.warn(`[PWA] Falha ao carregar ${arquivo}:`, err);
    if (arquivo === "links.txt") {
      carregarLinks("linksoff.txt");
      Swal.fire({
        title: "Modo Offline Ativado",
        text: "Sem conexão. Mostrando lista offline (linksoff.txt).",
        icon: "warning",
        confirmButtonColor: "#004aad"
      });
    }
  }
}

carregarLinks();

// =============================
// 🧭 SERVICE WORKER + VERSÃO COMPLETA DO GITHUB
// =============================
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js");

  const versaoEl = document.getElementById("versao");
  function exibirVersao(v, d) {
    versaoEl.textContent = `Versão — ${v} — Registrada em ${d}`;
  }

  // Recupera versão salva localmente
  const vSalva = localStorage.getItem("versaoCodigo");
  const dSalva = localStorage.getItem("versaoData");
  if (vSalva && dSalva) exibirVersao(vSalva, dSalva);

  // Sempre busca a versão mais recente do GitHub
  async function verificarVersaoGitHub() {
    try {
      const resposta = await fetch(`version.json?nocache=${Date.now()}`);
      const json = await resposta.json();

      const novaVersao = json.build;
      const antigaVersao = localStorage.getItem("versaoCodigo");

      const autor = json.autor || "Desconhecido";
      const mensagem = json.mensagem || "Atualização de versão";
      const execucao = json.execucao || "N/A";
      const branch = json.branch || "main";
      const dataFormatada = json.data || "—";

      // Só alerta se realmente houver nova versão
      if (novaVersao !== antigaVersao) {
        localStorage.setItem("versaoCodigo", novaVersao);
        localStorage.setItem("versaoData", dataFormatada);

        Swal.fire({
          title: "Nova versão detectada!",
          html: `
            <div style="text-align:left;font-size:0.95rem;">
              🧱 <b>Versão:</b> ${novaVersao}<br>
              💬 <b>Mensagem:</b> ${mensagem}<br>
              👤 <b>Autor:</b> ${autor}<br>
              🌿 <b>Branch:</b> ${branch}<br>
              🔢 <b>Execução:</b> ${execucao}<br>
              ⏰ <b>Registrada em:</b> ${dataFormatada}
            </div>
          `,
          icon: "info",
          showConfirmButton: false,
          timer: 4500,
          background: "#f5f7fa",
          color: "#004aad"
        });
      }

      exibirVersao(novaVersao, dataFormatada);
    } catch (err) {
      console.warn("[PWA] Erro ao verificar version.json:", err);
    }
  }

  // Verifica a versão mais recente do GitHub
  verificarVersaoGitHub();

  // Atualiza service worker e força sincronização
  navigator.serviceWorker.ready.then(reg => reg.update());
}

// =============================
// 🌐 INDICADOR DE REDE + TOAST
// =============================
const statusEl = document.getElementById("status-rede");
const toast = document.getElementById("toast-status");

function mostrarToast(msg, cor) {
  toast.textContent = msg;
  toast.style.background = cor;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

function atualizarStatus() {
  if (navigator.onLine) {
    statusEl.textContent = "🟢 Online";
    statusEl.className = "online";
    mostrarToast("🟢 Conectado à Internet", "linear-gradient(90deg, #004aad, #00aaff)");
  } else {
    statusEl.textContent = "🔴 Offline";
    statusEl.className = "offline";
    mostrarToast("🔴 Sem conexão", "linear-gradient(90deg, #8b0000, #b22222)");
  }
}

window.addEventListener("online", atualizarStatus);
window.addEventListener("offline", atualizarStatus);
document.addEventListener("DOMContentLoaded", atualizarStatus);
