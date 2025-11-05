// =============================
// 📂 SCRIPT PRINCIPAL - Rede primeiro + fallback offline + indicadores
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
// 🧭 SERVICE WORKER + VERSÃO FIXA + ALERTAS
// =============================
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js");

  function exibirVersao(v, d) {
    document.getElementById("versao").textContent =
      `Versão — ${v} — Atualizada em ${d}`;
  }

  const vSalva = localStorage.getItem("versaoCodigo");
  const dSalva = localStorage.getItem("versaoData");
  if (vSalva && dSalva) exibirVersao(vSalva, dSalva);

  navigator.serviceWorker.ready.then(reg => {
    reg.active.postMessage({ type: "GET_VERSION" });
  });

  navigator.serviceWorker.addEventListener("message", e => {
    if (e.data && e.data.type === "VERSION") {
      const v = e.data.versao;
      const d = e.data.data;
      if (v !== localStorage.getItem("versaoCodigo")) {
        localStorage.setItem("versaoCodigo", v);
        localStorage.setItem("versaoData", d);
        Swal.fire({
          title: "Nova versão detectada!",
          text: "O sistema está sendo atualizado automaticamente.",
          icon: "info",
          showConfirmButton: false,
          timer: 2500
        });
      }
      exibirVersao(v, d);
    }
  });
}

// =============================
// 🌐 INDICADOR DE REDE + TOAST FLUTUANTE
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
