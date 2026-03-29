/* ── Config ──────────────────────────────────────────────────── */
const API = "/api";

/* ── Helpers ─────────────────────────────────────────────────── */
const $ = id => document.getElementById(id);

async function apiFetch(path) {
  const res = await fetch(API + path);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

/* ── Local fallback calculations ─────────────────────────────── */
function calcTeorica(k) {
  if (k <= 1) return 0;
  let p = 1;
  for (let i = 0; i < k; i++) p *= (365 - i) / 365;
  return 1 - p;
}

/* ── Chart: main theoretical curve ──────────────────────────── */
let chartMain = null;
let currentN = 40;

function buildMainChart(puntos, n) {
  const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const textColor = dark ? "rgba(200,200,190,0.65)" : "rgba(60,55,50,0.65)";
  const gridColor = dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";
  const labels = puntos.map(p => p.n);
  const values = puntos.map(p => p.p);

  const ctx = $("chart-main").getContext("2d");
  chartMain = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "P teórica",
          data: values,
          borderColor: "#2e6da4",
          backgroundColor: "rgba(46,109,164,0.07)",
          borderWidth: 1.5,
          pointRadius: 0,
          fill: true,
          tension: 0.35,
        },
        {
          label: "50%",
          data: labels.map(() => 0.5),
          borderColor: "rgba(139,44,44,0.3)",
          borderWidth: 1,
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false,
        },
        {
          label: "Seleccionado",
          data: labels.map((l, i) => l === n ? values[i] : null),
          borderColor: "#1a3a5c",
          backgroundColor: "#1a3a5c",
          pointRadius: labels.map(l => l === n ? 5 : 0),
          showLine: false,
          fill: false,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 250 },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: items => `${items[0].label} personas`,
            label: item => `P = ${(item.parsed.y * 100).toFixed(2)}%`
          },
          backgroundColor: "rgba(28,28,26,0.9)",
          titleFont: { family: "JetBrains Mono, monospace", size: 11 },
          bodyFont:  { family: "JetBrains Mono, monospace", size: 12 },
          padding: 10,
        }
      },
      scales: {
        x: {
          title: { display: true, text: "k (personas)", color: textColor, font: { size: 11, family: "JetBrains Mono, monospace" } },
          ticks: { color: textColor, font: { size: 10, family: "JetBrains Mono, monospace" }, maxTicksLimit: 10 },
          grid: { color: gridColor },
        },
        y: {
          min: 0, max: 1,
          ticks: {
            color: textColor,
            font: { size: 10, family: "JetBrains Mono, monospace" },
            callback: v => (v * 100).toFixed(0) + "%"
          },
          grid: { color: gridColor },
        }
      }
    }
  });
}

function updateMainMarker(n) {
  if (!chartMain) return;
  const labels = chartMain.data.labels;
  const values = chartMain.data.datasets[0].data;
  chartMain.data.datasets[2].data = labels.map((l, i) => l === n ? values[i] : null);
  chartMain.data.datasets[2].pointRadius = labels.map(l => l === n ? 5 : 0);
  chartMain.update("none");
}

/* ── Chart: Monte Carlo simulation ───────────────────────────── */
let chartSim = null;

function buildSimChart(resultados) {
  const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const textColor = dark ? "rgba(200,200,190,0.65)" : "rgba(60,55,50,0.65)";
  const gridColor = dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";
  const labels = resultados.map(r => r.k);

  if (chartSim) chartSim.destroy();

  const ctx = $("chart-sim").getContext("2d");
  chartSim = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Teórica",
          data: resultados.map(r => r.p_teorica),
          borderColor: "#2e6da4",
          borderWidth: 1.5,
          pointRadius: 0,
          fill: false,
          tension: 0.35,
          order: 2,
        },
        {
          label: "Simulada (Monte Carlo)",
          data: resultados.map(r => r.p_simulada),
          borderColor: "rgba(139,44,44,0.0)",
          backgroundColor: "rgba(139,44,44,0.75)",
          pointRadius: 3.5,
          pointHoverRadius: 5,
          showLine: false,
          fill: false,
          order: 1,
        },
        {
          label: "50%",
          data: labels.map(() => 0.5),
          borderColor: "rgba(80,80,70,0.25)",
          borderWidth: 1,
          borderDash: [4, 4],
          pointRadius: 0,
          fill: false,
          order: 3,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 400 },
      plugins: {
        legend: {
          display: true,
          position: "top",
          labels: {
            font: { family: "JetBrains Mono, monospace", size: 10 },
            color: textColor,
            boxWidth: 12,
            padding: 12,
          }
        },
        tooltip: {
          callbacks: {
            title: items => `k = ${items[0].label} personas`,
            label: item => `${item.dataset.label}: ${(item.parsed.y * 100).toFixed(2)}%`
          },
          backgroundColor: "rgba(28,28,26,0.9)",
          titleFont: { family: "JetBrains Mono, monospace", size: 11 },
          bodyFont:  { family: "JetBrains Mono, monospace", size: 11 },
          padding: 10,
        }
      },
      scales: {
        x: {
          title: { display: true, text: "k (personas)", color: textColor, font: { size: 11, family: "JetBrains Mono, monospace" } },
          ticks: { color: textColor, font: { size: 10, family: "JetBrains Mono, monospace" }, maxTicksLimit: 13 },
          grid: { color: gridColor },
        },
        y: {
          min: 0, max: 1,
          title: { display: true, text: "Probabilidad", color: textColor, font: { size: 11, family: "JetBrains Mono, monospace" } },
          ticks: {
            color: textColor,
            font: { size: 10, family: "JetBrains Mono, monospace" },
            callback: v => (v * 100).toFixed(0) + "%"
          },
          grid: { color: gridColor },
        }
      }
    }
  });
}

/* ── Table rendering ─────────────────────────────────────────── */
let simResultados = [];

function renderTable(hasta) {
  const tbody = $("table-body");
  const rows = simResultados.filter(r => r.k <= hasta);
  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="loading">Ejecutá la simulación para ver la tabla…</td></tr>`;
    return;
  }
  tbody.innerHTML = rows.map(r => {
    const barW = Math.round(r.p_simulada * 100);
    const isThresh = r.k === 23;
    return `
      <tr class="${isThresh ? "highlight-row" : ""}">
        <td>${r.k}</td>
        <td>${(r.p_simulada * 100).toFixed(2)}%</td>
        <td>${(r.p_teorica * 100).toFixed(2)}%</td>
        <td class="diff-positive">${(r.diferencia * 100).toFixed(2)}%</td>
        <td class="bar-cell">
          <div class="prob-bar">
            <div class="prob-fill" style="width:${barW}%"></div>
          </div>
        </td>
      </tr>`;
  }).join("");
}

/* ── Simulation runner ───────────────────────────────────────── */
async function runSimulation() {
  const N    = Math.min(1000, Math.max(100, parseInt($("sim-N").value) || 1000));
  const seed = parseInt($("sim-seed").value) || 42;
  const btn  = $("sim-btn");
  const status = $("sim-status");

  btn.disabled = true;
  status.textContent = `Ejecutando N=${N} repeticiones para k=1..50…`;

  try {
    const data = await apiFetch(`/simulacion?k_max=50&N=${N}&seed=${seed}`);
    simResultados = data.resultados;

    // Update stats
    $("sim-thresh").textContent = data.umbral_simulado_50
      ? `${data.umbral_simulado_50} personas`
      : "—";

    const errorMedio = simResultados.reduce((acc, r) => acc + r.diferencia, 0) / simResultados.length;
    $("sim-error").textContent = (errorMedio * 100).toFixed(3) + "%";

    // Show results
    $("sim-results").style.display = "block";

    // Build chart
    buildSimChart(simResultados);

    // Render table
    const hasta = Math.min(50, parseInt($("table-filter").value) || 50);
    renderTable(hasta);

    status.textContent = `✓ Simulación completada — N=${N}, semilla=${seed}`;
  } catch (e) {
    console.error(e);
    status.textContent = "Error al conectar con la API. Usando cálculo local…";
    runLocalSimulation(N);
  } finally {
    btn.disabled = false;
  }
}

/* ── Local simulation fallback ───────────────────────────────── */
function localCumples(k) {
  return Array.from({ length: k }, () => Math.floor(Math.random() * 365) + 1);
}

function localHayCoincidencia(lista) {
  return lista.length !== new Set(lista).size;
}

function localProporcion(k, N) {
  let count = 0;
  for (let i = 0; i < N; i++) {
    if (localHayCoincidencia(localCumples(k))) count++;
  }
  return count / N;
}

function runLocalSimulation(N) {
  const resultados = [];
  for (let k = 1; k <= 50; k++) {
    const pSim = localProporcion(k, N);
    const pTeo = calcTeorica(k);
    resultados.push({
      k, p_simulada: pSim, p_teorica: pTeo,
      diferencia: Math.abs(pSim - pTeo)
    });
  }
  simResultados = resultados;

  const thresh = resultados.find(r => r.p_simulada >= 0.5);
  $("sim-thresh").textContent = thresh ? `${thresh.k} personas` : "—";
  const errMedio = resultados.reduce((a, r) => a + r.diferencia, 0) / resultados.length;
  $("sim-error").textContent = (errMedio * 100).toFixed(3) + "%";

  $("sim-results").style.display = "block";
  buildSimChart(resultados);
  renderTable(parseInt($("table-filter").value) || 50);
}

/* ── Main stats update ───────────────────────────────────────── */
function updateStats(data) {
  $("stat-prob").textContent = data.probabilidad_pct.toFixed(2) + "%";
  $("stat-comp").textContent = data.complemento_pct.toFixed(2) + "%";
  $("hero-number").textContent = data.probabilidad_pct.toFixed(2) + "%";
  $("result-40").textContent = data.probabilidad_pct.toFixed(2) + "%";
}

/* ── Init ────────────────────────────────────────────────────── */
(async function init() {
  try {
    // Theoretical curve
    const curva = await apiFetch("/curva");
    buildMainChart(curva.puntos, currentN);

    // Info / thresholds
    const info = await apiFetch("/info");
    $("stat-thresh").textContent = info.umbral_50 + " personas";
    $("stat-99").textContent     = info.umbral_99 + " personas";

    // Initial stats for k=40
    const stats = await apiFetch("/calcular?n=40");
    updateStats(stats);

  } catch (e) {
    // Fallback to local
    const puntos = Array.from({ length: 79 }, (_, i) => ({ n: i + 2, p: calcTeorica(i + 2) }));
    buildMainChart(puntos, 40);
    const p40 = calcTeorica(40);
    $("stat-prob").textContent = (p40 * 100).toFixed(2) + "%";
    $("stat-comp").textContent = ((1 - p40) * 100).toFixed(2) + "%";
    $("stat-thresh").textContent = "23 personas";
    $("stat-99").textContent    = "57 personas";
    $("hero-number").textContent = (p40 * 100).toFixed(2) + "%";
    $("result-40").textContent  = (p40 * 100).toFixed(2) + "%";
  }

  // Slider
  const slider = $("n-slider");
  let debounce;
  slider.addEventListener("input", () => {
    const n = parseInt(slider.value);
    $("n-display").textContent = n;
    updateMainMarker(n);
    clearTimeout(debounce);
    debounce = setTimeout(async () => {
      try {
        const data = await apiFetch(`/calcular?n=${n}`);
        updateStats(data);
      } catch {
        const p = calcTeorica(n);
        $("stat-prob").textContent = (p * 100).toFixed(2) + "%";
        $("stat-comp").textContent = ((1 - p) * 100).toFixed(2) + "%";
        $("hero-number").textContent = (p * 100).toFixed(2) + "%";
      }
    }, 100);
  });

  // Simulation button
  $("sim-btn").addEventListener("click", runSimulation);

  // Table filter
  $("table-btn").addEventListener("click", () => {
    const hasta = Math.min(50, Math.max(1, parseInt($("table-filter").value) || 50));
    $("table-filter").value = hasta;
    renderTable(hasta);
  });
  $("table-filter").addEventListener("keydown", e => {
    if (e.key === "Enter") $("table-btn").click();
  });
})();
