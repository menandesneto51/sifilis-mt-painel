/**
 * Sífilis MT — utilitários do dashboard MVP1
 */
(function (global) {
  "use strict";

  const BASE = "data/";

  function fontePreferida() {
    try {
      const q = new URLSearchParams(window.location.search).get("fonte");
      if (q === "demo" || q === "dw") return q;
      return localStorage.getItem("sifilis_fonte") || "dw";
    } catch (e) {
      return "dw";
    }
  }

  function setFonte(f) {
    try {
      localStorage.setItem("sifilis_fonte", f);
    } catch (e) {
      /* ignore */
    }
  }

  async function load(name) {
    let file = name;
    if (name === "epidemiologia.json" && fontePreferida() === "demo") {
      file = "epidemiologia_demo.json";
    }
    const res = await fetch(BASE + file);
    if (!res.ok) {
      if (file !== name) {
        const res2 = await fetch(BASE + name);
        if (!res2.ok) throw new Error("Falha ao carregar " + name);
        return res2.json();
      }
      throw new Error("Falha ao carregar " + name);
    }
    return res.json();
  }

  function fmt(n, casas) {
    if (n == null || isNaN(n)) return "—";
    return Number(n).toLocaleString("pt-BR", {
      minimumFractionDigits: casas != null ? casas : 0,
      maximumFractionDigits: casas != null ? casas : 0,
    });
  }

  function badgePrioridade(p) {
    const map = {
      "MUITO ALTA": "badge-muito-alta",
      ALTA: "badge-alta",
      MÉDIA: "badge-media",
      MEDIA: "badge-media",
      BAIXA: "badge-baixa",
    };
    const cls = map[p] || "badge-na";
    return '<span class="badge ' + cls + '">' + (p || "N/A") + "</span>";
  }

  function metaHtml(meta) {
    const tipo = meta.tipo === "extracao_dw" ? "DW SES-MT (agregado)" : "Demonstração sintética";
    return (
      "Fonte: " +
      tipo +
      " · " +
      (meta.fonte_prevista || "DW/SES-MT") +
      " · Extração: " +
      (meta.extraido_em || "—") +
      (meta.atraso_dias != null ? " · Atraso simulado: " + meta.atraso_dias + " dias" : "") +
      (meta.ano != null ? " · Ano: " + meta.ano : "") +
      (meta.incompleto ? " · Ano corrente incompleto" : "")
    );
  }

  function kpi(rotulo, valor, unidade, fonte) {
    return (
      '<article class="kpi"><p class="kpi-rotulo">' +
      rotulo +
      '</p><p class="kpi-valor">' +
      valor +
      '</p><p class="kpi-unidade">' +
      (unidade || "") +
      '</p><p class="kpi-fonte">' +
      (fonte || "") +
      "</p></article>"
    );
  }

  function barraFonte(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const f = fontePreferida();
    el.innerHTML =
      '<label class="seletor-fonte">Dados: ' +
      '<select id="sel-fonte">' +
      '<option value="dw"' +
      (f === "dw" ? " selected" : "") +
      ">DW SES-MT (agregado)</option>" +
      '<option value="demo"' +
      (f === "demo" ? " selected" : "") +
      ">Demonstração sintética</option>" +
      "</select></label> " +
      '<span id="wrap-ano"></span>';
    const sel = document.getElementById("sel-fonte");
    if (sel) {
      sel.addEventListener("change", function () {
        setFonte(sel.value);
        const u = new URL(window.location.href);
        u.searchParams.set("fonte", sel.value);
        window.location.href = u.toString();
      });
    }
  }

  function anoPreferido(anosDisponiveis, anoPadrao) {
    try {
      const q = new URLSearchParams(window.location.search).get("ano");
      if (q && /^\d{4}$/.test(q)) {
        const y = parseInt(q, 10);
        if (!anosDisponiveis || anosDisponiveis.indexOf(y) >= 0 || (anosDisponiveis || []).map(Number).indexOf(y) >= 0)
          return y;
      }
      const ls = localStorage.getItem("sifilis_ano");
      if (ls && /^\d{4}$/.test(ls)) return parseInt(ls, 10);
    } catch (e) { /* ignore */ }
    return anoPadrao;
  }

  function setAno(y) {
    try {
      localStorage.setItem("sifilis_ano", String(y));
    } catch (e) { /* ignore */ }
  }

  /** Fatia payload com por_ano[ano], mantendo metadados do envelope. */
  function dadoNoAno(payload, ano) {
    if (!payload) return null;
    const y = payload.por_ano && payload.por_ano[String(ano)];
    if (!y) return payload;
    const out = Object.assign({}, payload, y, { ano: ano });
    out.por_ano = payload.por_ano;
    return out;
  }

  function barraAno(containerId, anos, anoAtual) {
    const wrap = document.getElementById(containerId) || document.getElementById("wrap-ano");
    if (!wrap || !anos || !anos.length) return anoAtual;
    const y = anoPreferido(anos, anoAtual);
    wrap.innerHTML =
      '<label class="seletor-fonte">Ano: <select id="sel-ano"></select></label>';
    const sel = document.getElementById("sel-ano");
    anos
      .slice()
      .map(Number)
      .sort(function (a, b) {
        return b - a;
      })
      .forEach(function (a) {
        const o = document.createElement("option");
        o.value = a;
        o.textContent = a;
        if (a === y) o.selected = true;
        sel.appendChild(o);
      });
    sel.addEventListener("change", function () {
      setAno(sel.value);
      const u = new URL(window.location.href);
      u.searchParams.set("ano", sel.value);
      window.location.href = u.toString();
    });
    return y;
  }

  /** Monta estado a partir de por_ano_resumo[ano] quando o usuário muda o ano no DW. */
  function estadoNoAno(epi, ano) {
    if (!epi || epi.tipo !== "extracao_dw" || !epi.por_ano_resumo) return epi ? epi.estado : null;
    const y = epi.por_ano_resumo[String(ano)];
    if (!y) return epi.estado;
    const prev = epi.por_ano_resumo[String(ano - 1)] || {};
    function delta(cur, ant) {
      if (cur == null || ant == null || ant === 0) return null;
      return Math.round(((cur - ant) / ant) * 1000) / 10;
    }
    const gc = (y.gestante || {}).casos;
    const cc = (y.congenita || {}).casos;
    const ac = (y.adquirida || {}).casos;
    return {
      adquirida: {
        casos: ac != null ? ac : (y.adquirida || {}).casos,
        taxa: (y.adquirida || {}).taxa,
        nota: (y.adquirida || {}).nota || (epi.estado && epi.estado.adquirida && epi.estado.adquirida.nota),
        nivel_evidencia: (y.adquirida || {}).nivel_evidencia,
        fonte: (y.adquirida || {}).fonte,
        variacao_anual_pct: delta(ac, (prev.adquirida || {}).casos),
      },
      gestante: {
        casos: gc,
        taxa: (y.gestante || {}).taxa,
        variacao_anual_pct: delta(gc, (prev.gestante || {}).casos),
      },
      congenita: {
        casos: cc,
        taxa: (y.congenita || {}).taxa,
        obitos: (y.congenita || {}).obitos,
        mortalidade_100mil_nv: (y.congenita || {}).mortalidade_100mil_nv,
        variacao_anual_pct: delta(cc, (prev.congenita || {}).casos),
      },
      razao_sc_gestante_pct: y.razao_sc_gestante_pct,
      evitabilidade_sc_pct: y.evitabilidade_sc_pct,
      populacao: y.populacao,
      nascidos_vivos: y.nascidos_vivos,
      variacao_semanas: null,
      equidade_gestante_raca: null,
    };
  }

  function injectCabecalhoLogos() {
    document.querySelectorAll(".cabecalho-inner").forEach(function (inner) {
      if (inner.querySelector(".cabecalho-logos")) return;
      const wrap = document.createElement("div");
      wrap.className = "cabecalho-logos";
      wrap.setAttribute("aria-hidden", "true");
      wrap.innerHTML =
        '<img src="assets/img/ses_mt.png" alt="SES-MT" />' +
        '<img src="assets/img/cievs_mt.png" alt="CIEVS-MT" />';
      inner.insertBefore(wrap, inner.firstChild);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectCabecalhoLogos);
  } else {
    injectCabecalhoLogos();
  }

  global.SifilisApp = {
    load: load,
    fmt: fmt,
    badgePrioridade: badgePrioridade,
    metaHtml: metaHtml,
    kpi: kpi,
    fontePreferida: fontePreferida,
    setFonte: setFonte,
    barraFonte: barraFonte,
    barraAno: barraAno,
    anoPreferido: anoPreferido,
    setAno: setAno,
    estadoNoAno: estadoNoAno,
    dadoNoAno: dadoNoAno,
  };
})(window);
