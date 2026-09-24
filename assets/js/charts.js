(function (global) {
  "use strict";
  const COR = "#1B3281";
  const charts = {};

  function destroy(id) {
    if (charts[id]) {
      charts[id].destroy();
      delete charts[id];
    }
  }

  function linha(id, labels, data, rotulo) {
    destroy(id);
    const el = document.getElementById(id);
    if (!el || typeof Chart === "undefined") return;
    charts[id] = new Chart(el, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: rotulo,
            data: data,
            borderColor: COR,
            backgroundColor: "rgba(27,50,129,0.12)",
            fill: true,
            tension: 0.2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: "bottom" } },
        scales: { y: { beginAtZero: false } },
      },
    });
  }

  function barrasH(id, labels, data, rotulo) {
    destroy(id);
    const el = document.getElementById(id);
    if (!el || typeof Chart === "undefined") return;
    charts[id] = new Chart(el, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [{ label: rotulo, data: data, backgroundColor: COR }],
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { beginAtZero: true } },
      },
    });
  }

  function funil(id, labels, data) {
    destroy(id);
    const el = document.getElementById(id);
    if (!el || typeof Chart === "undefined") return;
    charts[id] = new Chart(el, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [{ label: "n", data: data, backgroundColor: COR }],
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { beginAtZero: true } },
      },
    });
  }

  function barras(id, labels, data, rotulo) {
    destroy(id);
    const el = document.getElementById(id);
    if (!el || typeof Chart === "undefined") return;
    charts[id] = new Chart(el, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [{ label: rotulo || "%", data: data, backgroundColor: COR }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, max: 100, ticks: { callback: function (v) { return v + "%"; } } },
          x: { ticks: { maxRotation: 45, minRotation: 30, font: { size: 10 } } },
        },
      },
    });
  }

  function linhaMulti(id, labels, datasets) {
    destroy(id);
    const el = document.getElementById(id);
    if (!el || typeof Chart === "undefined") return;
    const cores = ["#1B3281", "#5B7A3A", "#8B4513", "#4A5568"];
    charts[id] = new Chart(el, {
      type: "line",
      data: {
        labels: labels,
        datasets: (datasets || []).map(function (ds, i) {
          return {
            label: ds.rotulo,
            data: ds.data,
            borderColor: cores[i % cores.length],
            backgroundColor: "transparent",
            tension: 0.2,
          };
        }),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: "bottom" } },
        scales: { y: { beginAtZero: false } },
      },
    });
  }

  global.SifilisCharts = { linha: linha, barrasH: barrasH, funil: funil, barras: barras, linhaMulti: linhaMulti };
})(window);
