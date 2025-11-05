// =============================
// 📂 SCRIPT PRINCIPAL - Rede + versão sincronizada via GitHub
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
// 🧭 SERVICE WORKER + VERSÃO DO GITHUB
// =============================
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js");

  const versaoEl = document.getElementById("versao");
  function exibirVersao(v, d) {
    versaoEl.textContent = `Versão — ${v} — Atualizada em ${d}`;
  }

  // Mostra versão salva (caso já tenha)
  const vSalva = localStorage.getItem("versaoCodigo");
  const dSalva = localStorage.getItem("versaoData");
  if (vSalva && dSalva) exibirVersao(vSalva, dSalva);

  navigator.serviceWorker.ready.then(reg => {
    reg.active.postMessage({ type: "GET_VERSION" });
  });

  // Recebe dados do Service Worker
  navigator.serviceWorker.addEventListener("message", async event => {
    if (event.data && event.data.type === "VERSION") {
      const { versao, data } = event.data;
      const antiga = localStorage.getItem("versaoCodigo");

      // 🔍 Busca version.json completo (com autor e mensagem)
      try {
        const res = await fetch("version.json?cache=" + Date.now());
        const json = await res.json();

        const autor = json.autor || "Desconhecido";
        const mensagem = json.mensagem || "Atualização de versão";

        if (versao !== antiga && versao !== "Indisponível") {
          localStorage.setItem("versaoCodigo", versao);
          localStorage.setItem("versaoData", data);
          Swal.fire({
            title: "Nova versão detectada!",
            html: `
              <div style="text-align:left;font-size:0.95rem;">
                🧱 <b>Versão:</b> ${versao}<br>
                💬 <b>Mensagem:</b> ${mensagem}<br>
                👤 <b>Autor:</b> ${autor}<br>
                ⏰ <b>Data:</b> ${data}
              </div>
            `,
            icon: "info",
            showConfirmButton: false,
            timer: 3500,
            background: "#f5f7fa",
            color: "#004aad"
          });
        }

        exibirVersao(versao, data);
      } catch (err) {
        console.warn("[PWA] Falha ao obter dados completos da versão:", err);
        exibirVersao(versao, data);
      }
    }
  });
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
