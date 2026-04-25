// Copilot pricing data story — D3.js visualizations
// All charts share Primer-inspired tokens via CSS variables.

const FMT = {
  money: d3.format("$,.2f"),
  moneyS: d3.format("$,.3f"),
  pct: d3.format(".1%"),
  num: d3.format(",.0f"),
  delta: d => (d >= 0 ? "+" : "") + d3.format("$,.3f")(d),
};

const PROVIDER_COLOR = {
  Anthropic: "var(--p-anthropic)",
  OpenAI: "var(--p-openai)",
  Google: "var(--p-google)",
};
const TIER_COLOR = {
  "Included":         "#8250df",
  "Budget Premium":   "#1a7f37",
  "Standard Premium": "#0969da",
  "High Premium":     "#bf8700",
  "Ultra Premium":    "#cf222e",
};

const tooltip = d3.select("#tooltip");
function showTip(html, ev) {
  tooltip
    .html(html)
    .style("opacity", 1)
    .style("left", (ev.clientX + 14) + "px")
    .style("top",  (ev.clientY + window.scrollY + 14) + "px");
}
function moveTip(ev) {
  tooltip
    .style("left", (ev.clientX + 14) + "px")
    .style("top",  (ev.clientY + window.scrollY + 14) + "px");
}
function hideTip() { tooltip.style("opacity", 0); }

// ---------- KPI cards ----------
function renderKPIs() {
  const ultra = window.MODELS.find(m => m.name === "Claude Opus 4.7");
  const ratio = ultra.pruCost / ultra.tokenCost;
  d3.select("#kpi-markup").text(`${ratio.toFixed(1)}×`);

  const gpt4o = window.MODELS.find(m => m.name === "GPT-4o");
  d3.select("#kpi-subsidy").text(FMT.moneyS(gpt4o.tokenCost) + "/chat");

  d3.select("#kpi-count").text(window.MODELS.length);
}

// ---------- Chart 1: PRU multipliers ----------
function renderMultipliers() {
  const data = [...window.MODELS].sort((a, b) => a.mult - b.mult || d3.ascending(a.name, b.name));
  const container = d3.select("#chart-multipliers");
  container.selectAll("*").remove();

  const margin = { top: 16, right: 24, bottom: 30, left: 160 };
  const width  = container.node().clientWidth;
  const height = data.length * 26 + margin.top + margin.bottom;

  const svg = container.append("svg").attr("viewBox", `0 0 ${width} ${height}`);

  const x = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.mult) * 1.05])
    .range([margin.left, width - margin.right]);
  const y = d3.scaleBand()
    .domain(data.map(d => d.name))
    .range([margin.top, height - margin.bottom])
    .padding(0.18);

  // grid
  svg.append("g")
    .attr("class", "grid")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x)
      .ticks(6)
      .tickSize(-(height - margin.top - margin.bottom))
      .tickFormat(""));

  // axes
  svg.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).ticks(6).tickFormat(d => d + "×"));

  svg.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).tickSize(0))
    .call(g => g.select(".domain").remove());

  // bars
  svg.append("g").selectAll("rect.bar")
    .data(data)
    .join("rect")
      .attr("class", "bar")
      .attr("x", x(0))
      .attr("y", d => y(d.name))
      .attr("height", y.bandwidth())
      .attr("width", 0)
      .attr("rx", 3)
      .attr("fill", d => TIER_COLOR[d.tier])
      .attr("opacity", 0.9)
      .on("mouseenter", (ev, d) => {
        showTip(`
          <strong>${d.name}</strong><br>
          <div class="row"><span class="k">Tier</span><span class="v">${d.tier}</span></div>
          <div class="row"><span class="k">Multiplier</span><span class="v">${d.mult}×</span></div>
          <div class="row"><span class="k">PRU cost / chat</span><span class="v">${FMT.moneyS(d.pruCost)}</span></div>
          <div class="row"><span class="k">Token cost / chat</span><span class="v">${FMT.moneyS(d.tokenCost)}</span></div>
        `, ev);
      })
      .on("mousemove", (ev) => moveTip(ev))
      .on("mouseleave", hideTip)
    .transition()
      .duration(700)
      .delay((d, i) => i * 18)
      .attr("width", d => x(d.mult) - x(0));

  // value labels
  svg.append("g").selectAll("text.val")
    .data(data)
    .join("text")
      .attr("class", "val")
      .attr("x", d => x(d.mult) + 6)
      .attr("y", d => y(d.name) + y.bandwidth() / 2)
      .attr("dy", "0.35em")
      .style("font-size", "11px")
      .style("fill", "var(--fg-muted)")
      .style("font-variant-numeric", "tabular-nums")
      .style("opacity", 0)
      .text(d => d.mult + "×")
    .transition()
      .duration(700)
      .delay((d, i) => i * 18 + 200)
      .style("opacity", 1);

  // Legend
  const legend = d3.select("#legend-multipliers");
  legend.selectAll("*").remove();
  Object.entries(TIER_COLOR).forEach(([tier, color]) => {
    const item = legend.append("span").attr("class", "legend-item");
    item.append("span").attr("class", "legend-swatch").style("background", color);
    item.append("span").text(tier);
  });
}

// ---------- Chart 2: Subsidy diverging bars ----------
function renderSubsidy() {
  const data = window.SUBSIDY;
  const container = d3.select("#chart-subsidy");
  container.selectAll("*").remove();

  const margin = { top: 24, right: 24, bottom: 36, left: 160 };
  const width = container.node().clientWidth;
  const height = data.length * 26 + margin.top + margin.bottom;

  const svg = container.append("svg").attr("viewBox", `0 0 ${width} ${height}`);

  const xMax = d3.max(data, d => Math.abs(d.delta));
  const x = d3.scaleLinear()
    .domain([-xMax * 1.05, xMax * 1.05])
    .range([margin.left, width - margin.right]);

  const y = d3.scaleBand()
    .domain(data.map(d => d.name))
    .range([margin.top, height - margin.bottom])
    .padding(0.18);

  // grid
  svg.append("g")
    .attr("class", "grid")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x)
      .ticks(6)
      .tickSize(-(height - margin.top - margin.bottom))
      .tickFormat(""));

  // zero rule
  svg.append("line")
    .attr("x1", x(0)).attr("x2", x(0))
    .attr("y1", margin.top).attr("y2", height - margin.bottom)
    .attr("stroke", "var(--border-default)")
    .attr("stroke-width", 1.5);

  // x axis
  svg.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).ticks(6).tickFormat(d => FMT.delta(d)));

  // y axis
  svg.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).tickSize(0))
    .call(g => g.select(".domain").remove());

  // bars
  svg.append("g").selectAll("rect")
    .data(data)
    .join("rect")
      .attr("y", d => y(d.name))
      .attr("height", y.bandwidth())
      .attr("rx", 3)
      .attr("x", x(0))
      .attr("width", 0)
      .attr("fill", d => d.delta >= 0 ? "var(--danger-fg)" : "var(--success-fg)")
      .attr("opacity", 0.85)
      .on("mouseenter", (ev, d) => {
        const label = d.delta >= 0
          ? `<span style="color:var(--danger-fg)">PRU overcharges by ${FMT.delta(d.delta)}</span>`
          : `<span style="color:var(--success-fg)">PRU undercharges by ${FMT.delta(-d.delta)}</span>`;
        showTip(`
          <strong>${d.name}</strong><br>
          <div class="row"><span class="k">PRU / chat</span><span class="v">${FMT.moneyS(d.pru)}</span></div>
          <div class="row"><span class="k">Tokens / chat</span><span class="v">${FMT.moneyS(d.tok)}</span></div>
          <div style="margin-top:6px">${label}</div>
        `, ev);
      })
      .on("mousemove", moveTip)
      .on("mouseleave", hideTip)
    .transition()
      .duration(800)
      .delay((d, i) => i * 18)
      .attr("x", d => x(Math.min(0, d.delta)))
      .attr("width", d => Math.abs(x(d.delta) - x(0)));

  // labels at bar end
  svg.append("g").selectAll("text.subval")
    .data(data)
    .join("text")
      .attr("y", d => y(d.name) + y.bandwidth() / 2)
      .attr("dy", "0.35em")
      .style("font-size", "11px")
      .style("fill", "var(--fg-muted)")
      .style("font-variant-numeric", "tabular-nums")
      .style("opacity", 0)
      .attr("text-anchor", d => d.delta >= 0 ? "start" : "end")
      .attr("x", d => d.delta >= 0 ? x(d.delta) + 6 : x(d.delta) - 6)
      .text(d => FMT.delta(d.delta))
    .transition()
      .duration(800)
      .delay((d, i) => i * 18 + 250)
      .style("opacity", 1);

  // Annotations - over/under labels
  svg.append("text")
    .attr("x", x(0) + 8)
    .attr("y", margin.top - 8)
    .style("fill", "var(--danger-fg)")
    .style("font-size", "11px")
    .style("font-weight", 600)
    .text("← PRU overcharges (subsidizing others)").attr("text-anchor", "start");
  svg.append("text")
    .attr("x", x(0) - 8)
    .attr("y", margin.top - 8)
    .style("fill", "var(--success-fg)")
    .style("font-size", "11px")
    .style("font-weight", 600)
    .style("text-anchor", "end")
    .text("PRU undercharges (subsidized) →");
}

// ---------- Chart 3: Scatter (cost vs SWE-bench) ----------
let scatterMode = "pru";
function renderScatter() {
  const data = window.MODELS.filter(m => m.swe !== null);
  const container = d3.select("#chart-scatter");
  container.selectAll("*").remove();

  const margin = { top: 20, right: 30, bottom: 50, left: 60 };
  const width = container.node().clientWidth;
  const height = 480;

  const svg = container.append("svg").attr("viewBox", `0 0 ${width} ${height}`);

  // Scales — recreated per render so axes update with mode
  const xKey = scatterMode === "pru" ? "pruCost" : "tokenCost";
  const xMax = d3.max(data, d => d[xKey]) * 1.1 + 0.001;
  const x = d3.scaleLinear().domain([0, xMax]).range([margin.left, width - margin.right]);
  const y = d3.scaleLinear().domain([50, 80]).range([height - margin.bottom, margin.top]);

  // Grid
  svg.append("g")
    .attr("class", "grid")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).ticks(8).tickSize(-(height - margin.top - margin.bottom)).tickFormat(""));
  svg.append("g")
    .attr("class", "grid")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(6).tickSize(-(width - margin.left - margin.right)).tickFormat(""));

  // Axes
  svg.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).ticks(8).tickFormat(d => "$" + d.toFixed(d < 0.05 ? 3 : 2)));
  svg.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(6).tickFormat(d => d + "%"));

  // Axis labels
  svg.append("text")
    .attr("class", "axis-label")
    .attr("x", (margin.left + width - margin.right) / 2)
    .attr("y", height - 10)
    .attr("text-anchor", "middle")
    .text(scatterMode === "pru" ? "PRU cost per chat (USD, $0.04 × multiplier)" : "Token cost per chat (USD, 4K in + 2K out at list price)");
  svg.append("text")
    .attr("class", "axis-label")
    .attr("transform", `translate(16,${(margin.top + height - margin.bottom) / 2}) rotate(-90)`)
    .attr("text-anchor", "middle")
    .text("SWE-bench bash-only · % resolved");

  // "Frontier" reference: show diagonal isovalue lines for $/% (only on token mode)
  // (skip for clarity)

  // Points
  const points = svg.append("g").selectAll("g.pt").data(data, d => d.name).join("g").attr("class", "pt");

  points.append("circle")
    .attr("cx", d => x(d[xKey]))
    .attr("cy", d => y(d.swe))
    .attr("r", 0)
    .attr("fill", d => PROVIDER_COLOR[d.provider] || "var(--p-other)")
    .attr("opacity", 0.85)
    .attr("stroke", "var(--canvas-default)")
    .attr("stroke-width", 1.5)
    .on("mouseenter", (ev, d) => {
      showTip(`
        <strong>${d.name}</strong><br>
        <div class="row"><span class="k">Provider</span><span class="v">${d.provider}</span></div>
        <div class="row"><span class="k">SWE-bench</span><span class="v">${d.swe.toFixed(1)}%</span></div>
        <div class="row"><span class="k">PRU / chat</span><span class="v">${FMT.moneyS(d.pruCost)}</span></div>
        <div class="row"><span class="k">Tokens / chat</span><span class="v">${FMT.moneyS(d.tokenCost)}</span></div>
        ${d.estimated ? '<div style="margin-top:4px;color:var(--attention-fg);font-size:11px">SWE-bench estimated</div>' : ''}
      `, ev);
    })
    .on("mousemove", moveTip)
    .on("mouseleave", hideTip)
    .transition().duration(700).delay((d, i) => i * 30)
    .attr("r", 8);

  // Labels (only for top performers + interesting outliers, to reduce clutter)
  const labelSet = new Set([
    "Claude Opus 4.7", "Claude Opus 4.6", "Claude Opus 4.5",
    "GPT-5.5", "GPT-5.2-Codex", "Claude Haiku 4.5",
    "Gemini 3.1 Pro", "GPT-5 mini", "Claude Sonnet 4.5", "GPT-5.2",
  ]);
  points.filter(d => labelSet.has(d.name))
    .append("text")
      .attr("x", d => x(d[xKey]) + 11)
      .attr("y", d => y(d.swe) + 4)
      .style("font-size", "10.5px")
      .style("fill", "var(--fg-default)")
      .style("font-weight", 500)
      .style("opacity", 0)
      .text(d => d.name)
    .transition().duration(500).delay((d, i) => 700)
      .style("opacity", 1);

  // Legend (providers)
  const legend = d3.select("#legend-scatter");
  legend.selectAll("*").remove();
  Object.entries(PROVIDER_COLOR).forEach(([provider, color]) => {
    const item = legend.append("span").attr("class", "legend-item");
    item.append("span").attr("class", "legend-swatch").style("background", color);
    item.append("span").text(provider);
  });
  legend.append("span").attr("class", "legend-item")
    .style("color", "var(--fg-subtle)")
    .text("· Up-and-to-the-left is best.");
}
function bindScatterToggle() {
  d3.selectAll("#scatter-toggle button").on("click", function () {
    d3.selectAll("#scatter-toggle button").classed("active", false);
    d3.select(this).classed("active", true);
    scatterMode = this.dataset.mode;
    renderScatter();
  });
}

// ---------- Chart 4: Calculator ----------
function renderCalculator() {
  const sel = d3.select("#calc-model");
  sel.selectAll("option").remove();
  const grouped = d3.groups(window.MODELS, d => d.tier);
  const tierOrder = ["Included", "Budget Premium", "Standard Premium", "High Premium", "Ultra Premium"];
  tierOrder.forEach(tier => {
    const grp = grouped.find(g => g[0] === tier);
    if (!grp) return;
    const og = sel.append("optgroup").attr("label", tier);
    grp[1].forEach(m => og.append("option").attr("value", m.name).text(m.name));
  });
  sel.property("value", "Claude Opus 4.7");

  // bind events
  d3.select("#calc-model").on("change", updateCalc);
  d3.select("#calc-chats").on("input", updateCalc);
  d3.select("#calc-in").on("input", updateCalc);
  d3.select("#calc-out").on("input", updateCalc);

  updateCalc();
}

function updateCalc() {
  const modelName = d3.select("#calc-model").property("value");
  const chats = +d3.select("#calc-chats").property("value");
  const inTok = +d3.select("#calc-in").property("value");
  const outTok = +d3.select("#calc-out").property("value");

  d3.select("#calc-chats-val").text(d3.format(",")(chats));
  d3.select("#calc-in-val").text(d3.format(",")(inTok));
  d3.select("#calc-out-val").text(d3.format(",")(outTok));

  const model = window.MODELS.find(m => m.name === modelName);
  // PRU monthly: chats * mult * $0.04 (this is the overage rate; assumes overage)
  const pruMonthly = chats * model.mult * 0.04;
  const tokenMonthly = chats * (model.in * inTok + model.out * outTok) / 1e6;
  const delta = pruMonthly - tokenMonthly;

  d3.select("#calc-pru").text(FMT.money(pruMonthly));
  d3.select("#calc-tok").text(FMT.money(tokenMonthly));
  d3.select("#calc-delta").text((delta >= 0 ? "+" : "") + FMT.money(delta));
  d3.select("#calc-delta-pill")
    .classed("delta-up", delta > 0.005)
    .classed("delta-down", delta < -0.005);

  drawCalcChart(pruMonthly, tokenMonthly);
}

function drawCalcChart(pru, tok) {
  const container = d3.select("#chart-calc");
  container.selectAll("*").remove();

  const data = [
    { label: "PRU billing", value: pru, color: "var(--accent-emphasis)" },
    { label: "Token billing", value: tok, color: "var(--done-fg)" },
  ];

  const margin = { top: 16, right: 24, bottom: 30, left: 110 };
  const width = container.node().clientWidth;
  const height = 160;

  const svg = container.append("svg").attr("viewBox", `0 0 ${width} ${height}`);

  const x = d3.scaleLinear()
    .domain([0, Math.max(d3.max(data, d => d.value) * 1.15, 1)])
    .range([margin.left, width - margin.right]);
  const y = d3.scaleBand()
    .domain(data.map(d => d.label))
    .range([margin.top, height - margin.bottom])
    .padding(0.3);

  svg.append("g").attr("class", "grid")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).ticks(5).tickSize(-(height - margin.top - margin.bottom)).tickFormat(""));

  svg.append("g").attr("class", "axis")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).ticks(5).tickFormat(d3.format("$,.0f")));

  svg.append("g").attr("class", "axis")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).tickSize(0))
    .call(g => g.select(".domain").remove());

  svg.selectAll("rect.calc")
    .data(data)
    .join("rect")
      .attr("class", "calc")
      .attr("x", x(0))
      .attr("y", d => y(d.label))
      .attr("height", y.bandwidth())
      .attr("rx", 4)
      .attr("fill", d => d.color)
      .attr("width", 0)
    .transition()
      .duration(450)
      .attr("width", d => x(d.value) - x(0));

  svg.selectAll("text.calcv")
    .data(data)
    .join("text")
      .attr("class", "calcv")
      .attr("x", d => x(d.value) + 6)
      .attr("y", d => y(d.label) + y.bandwidth() / 2)
      .attr("dy", "0.35em")
      .style("font-size", "12px")
      .style("font-variant-numeric", "tabular-nums")
      .style("font-weight", 600)
      .style("fill", "var(--fg-default)")
      .text(d => FMT.money(d.value));
}

// ---------- Personas ----------
function renderPersonas() {
  const wrap = d3.select("#persona-cards");
  wrap.selectAll("*").remove();
  window.PERSONAS.forEach(p => {
    // determine win/lose by typical-chat math (rough heuristic, illustrative)
    let badge, badgeClass;
    if (p.name.startsWith("Power")) { badge = "Big winner"; badgeClass = "win"; }
    else if (p.name.startsWith("Daily")) { badge = "Slight winner"; badgeClass = "win"; }
    else if (p.name.startsWith("Casual")) { badge = "Net loser"; badgeClass = "lose"; }
    else if (p.name.startsWith("Agent")) { badge = "Big loser"; badgeClass = "lose"; }
    else if (p.name.startsWith("Multi")) { badge = "Winner"; badgeClass = "win"; }
    else { badge = "Mixed"; badgeClass = "neutral"; }

    const card = wrap.append("div").attr("class", "persona-card");
    card.append("h4").html(`${p.name} <span class="badge ${badgeClass}">${badge}</span>`);
    card.append("div").attr("class", "arrow-row").html(`
      <span class="from">${p.today}</span>
      <span class="arrow">→</span>
      <span class="to">${p.tomorrow}</span>
    `);
    card.append("p").text(p.summary);
    card.append("p").style("margin-top", "8px").style("color", "var(--fg-subtle)").style("font-size", "12px")
      .text(`~${p.chats} chats/month`);
  });
}

// ---------- Init ----------
function init() {
  renderKPIs();
  renderMultipliers();
  renderSubsidy();
  renderScatter();
  bindScatterToggle();
  renderCalculator();
  renderPersonas();
}

// re-render charts on resize (debounced)
let resizeT;
window.addEventListener("resize", () => {
  clearTimeout(resizeT);
  resizeT = setTimeout(() => {
    renderMultipliers();
    renderSubsidy();
    renderScatter();
    updateCalc();
  }, 200);
});

document.addEventListener("DOMContentLoaded", init);
