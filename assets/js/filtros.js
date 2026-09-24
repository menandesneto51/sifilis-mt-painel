/**
 * Filtros Regional → Município
 */
(function (global) {
  "use strict";

  async function initFiltros(onChange) {
    const territorio = await SifilisApp.load("territorio.json");
    const regEl = document.getElementById("filtro-regional");
    const munEl = document.getElementById("filtro-municipio");
    if (!regEl) return { territorio: territorio };

    const regs = (territorio.regionais || [])
      .slice()
      .sort(function (a, b) {
        return a.nome.localeCompare(b.nome, "pt-BR");
      });

    regEl.innerHTML = '<option value="">Todas as regionais (estado)</option>';
    regs.forEach(function (r) {
      const o = document.createElement("option");
      o.value = r.id;
      o.textContent = r.nome;
      regEl.appendChild(o);
    });

    function fillMun() {
      if (!munEl) return;
      const rid = regEl.value;
      munEl.innerHTML = "";
      if (!rid) {
        munEl.disabled = true;
        munEl.innerHTML = '<option value="">Selecione a regional</option>';
        return;
      }
      munEl.disabled = false;
      const reg = regs.find(function (r) {
        return r.id === rid;
      });
      munEl.innerHTML = '<option value="">Todos os municípios da regional</option>';
      (reg.municipios || [])
        .slice()
        .sort(function (a, b) {
          return a.nome.localeCompare(b.nome, "pt-BR");
        })
        .forEach(function (m) {
          const o = document.createElement("option");
          o.value = m.ibge;
          o.textContent = m.nome;
          munEl.appendChild(o);
        });
    }

    function emit() {
      if (onChange)
        onChange({
          regionalId: regEl.value,
          municipioIbge: munEl ? munEl.value : "",
          territorio: territorio,
        });
    }

    regEl.addEventListener("change", function () {
      fillMun();
      emit();
    });
    if (munEl) munEl.addEventListener("change", emit);
    fillMun();
    emit();
    return { territorio: territorio };
  }

  global.SifilisFiltros = { init: initFiltros };
})(window);
