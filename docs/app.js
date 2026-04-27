// Copilot pricing data story — D3 rendering
(function () {
  const fmtUSD = (v, dp = 2) => (v < 0 ? "−$" : "$") + Math.abs(v).toFixed(dp);
  const fmtUSDk = v => {
    const a = Math.abs(v);
    if (a >= 1000) return (v < 0 ? "−$" : "$") + (a / 1000).toFixed(1) + "k";
    return (v < 0 ? "−$" : "$") + a.toFixed(0);
  };
  const fmtTok = v => {
    if (v >= 1e6) return (v / 1e6).toFixed(1) + "M";
    if (v >= 1e3) return (v / 1e3).toFixed(0) + "k";
    return String(v);
  };
  const fmtInt = d3.format(",");

  const PROVIDER_COLOR = {
    "Anthropic": "#cf5226",
    "OpenAI":    "#1a7f37",
    "Google":    "#0969da",
  };
  const TIER_COLOR = {
    "Included":         "#8250df",
    "Budget Premium":   "#1a7f37",
    "Standard Premium": "#0969da",
    "High Premium":     "#bf8700",
    "Ultra Premium":    "#cf222e",
  };

  // -------- Tooltip helpers --------
  const tip = d3.select("#tooltip");
  function showTip(html, evt) {
    tip.html(html).style("opacity", 1);
    moveTip(evt);
  }
  function moveTip(evt) {
    const w = tip.node().offsetWidth || 200;
    const h = tip.node().offsetHeight || 40;
    let x = evt.clientX + window.scrollX + 12;
    let y = evt.clientY + window.scrollY + 12;
    if (x + w > window.scrollX + window.innerWidth - 8) x = evt.clientX + window.scrollX - w - 12;
    if (y + h > window.scrollY + window.innerHeight - 8) y = evt.clientY + window.scrollY - h - 12;
    tip.style("left", x + "px").style("top", y + "px");
  }
  function hideTip() { tip.style("opacity", 0); }

  // -------- KPIs --------
  function renderKPIs() {
    const opus = MODELS.find(m => m.name === "Claude Opus 4.7");
    if (opus) {
      const ratio = opus.pruCost / opus.tokenCost;
      d3.select("#kpi-markup").text(ratio.toFixed(1) + "×");
      // cloud-agent flip: Opus tokens at 1M in / 200K out
      const cloudTok = (opus.in * 1000 + opus.out * 200);
      const cloudRatio = cloudTok / opus.pruCost;
      d3.select("#kpi-cloud").text(cloudRatio.toFixed(0) + "×");
    }
  }

  // -------- Tier rationale cards --------
  function renderTierRationale() {
    const grid = d3.select("#tier-grid");
    grid.selectAll("*").remove();
    TIER_RATIONALE.forEach(t => {
      const card = grid.append("div")
        .attr("class", "tier-card")
        .style("--tier-color", t.color);
      const head = card.append("div").attr("class", "tier-head");
      head.append("div").attr("class", "tier-name").text(t.tier);
      head.append("div").attr("class", "tier-mult").text(t.mult);
      const tokRange = t.tokenChatLo === t.tokenChatHi
        ? "$" + t.tokenChatLo.toFixed(3)
        : "$" + t.tokenChatLo.toFixed(3) + "–$" + t.tokenChatHi.toFixed(3);
      card.append("div").attr("class", "tier-cost")
        .html("PRU charge: <b>$" + t.pruChat.toFixed(2) + "</b>/chat <span class='arrow'>vs</span> token cost: <b>" + tokRange + "</b>/chat");
      const models = card.append("div").attr("class", "tier-models");
      t.examples.forEach(m => models.append("span").attr("class", "tier-model").text(m));
      card.append("div").attr("class", "tier-rationale").text(t.rationale);
      card.append("div").attr("class", "tier-fairness").text(t.fairness);
    });
  }

  // -------- Multipliers (horizontal bars) --------
  function renderMultipliers() {
    const data = MODELS.slice().sort((a, b) => d3.ascending(a.mult, b.mult) || d3.ascending(a.name, b.name));
    const margin = { top: 10, right: 80, bottom: 28, left: 160 };
    const width = 880, height = data.length * 22 + margin.top + margin.bottom;
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const svg = d3.select("#chart-multipliers").append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`);
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().domain([0, d3.max(data, d => d.mult) * 1.05 || 1]).range([0, innerW]);
    const y = d3.scaleBand().domain(data.map(d => d.name)).range([0, innerH]).padding(0.18);

    g.append("g").attr("class", "axis").call(d3.axisLeft(y).tickSize(0)).select(".domain").remove();
    g.append("g").attr("class", "axis grid")
      .attr("transform", `translate(0,${innerH})`)
      .call(d3.axisBottom(x).ticks(6).tickSize(-innerH).tickFormat(d => d + "×"));

    g.selectAll("rect.bar").data(data).enter().append("rect")
      .attr("class", "bar")
      .attr("x", 0).attr("y", d => y(d.name))
      .attr("height", y.bandwidth())
      .attr("width", d => Math.max(1, x(d.mult)))
      .attr("fill", d => TIER_COLOR[d.tier])
      .attr("rx", 3)
      .on("mouseenter", (e, d) => showTip(
        `<strong>${d.name}</strong><br>` +
        `<div class='row'><span class='k'>Tier</span><span class='v'>${d.tier}</span></div>` +
        `<div class='row'><span class='k'>Multiplier</span><span class='v'>${d.mult}×</span></div>` +
        `<div class='row'><span class='k'>PRU / chat</span><span class='v'>${fmtUSD(d.pruCost, 3)}</span></div>` +
        `<div class='row'><span class='k'>Token / chat</span><span class='v'>${fmtUSD(d.tokenCost, 3)}</span></div>` +
        `<div class='row'><span class='k'>Provider</span><span class='v'>${d.provider}</span></div>`,
        e))
      .on("mousemove", moveTip).on("mouseleave", hideTip);

    g.selectAll("text.val").data(data).enter().append("text")
      .attr("x", d => x(d.mult) + 6)
      .attr("y", d => y(d.name) + y.bandwidth() / 2)
      .attr("dy", "0.35em")
      .attr("font-size", 11)
      .attr("fill", "var(--fg-muted)")
      .text(d => d.mult === 0 ? "Included" : d.mult + "×");

    const legend = d3.select("#legend-multipliers");
    legend.selectAll("*").remove();
    Object.entries(TIER_COLOR).forEach(([k, v]) => {
      const item = legend.append("span").attr("class", "legend-item");
      item.append("span").attr("class", "legend-swatch").style("background", v);
      item.append("span").text(k);
    });
  }

  // -------- Subsidy diverging bars (with chat/agent toggle) --------
  let subsidyMode = "chat";
  function renderSubsidy() {
    const data = (subsidyMode === "chat" ? SUBSIDY_CHAT : SUBSIDY_AGENT)
      .slice().sort((a, b) => d3.descending(a.delta, b.delta));

    const container = d3.select("#chart-subsidy");
    container.selectAll("*").remove();

    const margin = { top: 10, right: 130, bottom: 32, left: 170 };
    const width = 880, height = data.length * 22 + margin.top + margin.bottom;
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const svg = container.append("svg").attr("viewBox", `0 0 ${width} ${height}`);
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const ext = d3.extent(data, d => d.delta);
    const max = Math.max(Math.abs(ext[0]), Math.abs(ext[1]));
    const x = d3.scaleLinear().domain([-max, max]).range([0, innerW]);
    const y = d3.scaleBand().domain(data.map(d => d.name)).range([0, innerH]).padding(0.18);

    g.append("g").attr("class", "axis grid")
      .attr("transform", `translate(0,${innerH})`)
      .call(d3.axisBottom(x).ticks(8).tickSize(-innerH).tickFormat(d => fmtUSD(d, 2)));
    g.append("g").attr("class", "axis").call(d3.axisLeft(y).tickSize(0)).select(".domain").remove();

    g.append("line")
      .attr("x1", x(0)).attr("x2", x(0))
      .attr("y1", 0).attr("y2", innerH)
      .attr("stroke", "var(--fg-muted)").attr("stroke-width", 1);

    g.selectAll("rect.bar").data(data).enter().append("rect")
      .attr("class", "bar")
      .attr("x", d => d.delta < 0 ? x(d.delta) : x(0))
      .attr("y", d => y(d.name))
      .attr("width", d => Math.max(1, Math.abs(x(d.delta) - x(0))))
      .attr("height", y.bandwidth())
      .attr("fill", d => d.delta < 0 ? "var(--success-fg)" : "var(--danger-fg)")
      .attr("rx", 3)
      .on("mouseenter", (e, d) => showTip(
        `<strong>${d.name}</strong><br>` +
        `<div class='row'><span class='k'>PRU charge</span><span class='v'>${fmtUSD(d.pru, 3)}</span></div>` +
        `<div class='row'><span class='k'>Token cost</span><span class='v'>${fmtUSD(d.tok, 3)}</span></div>` +
        `<div class='row'><span class='k'>Delta (PRU − Tok)</span><span class='v'>${fmtUSD(d.delta, 3)}</span></div>` +
        (d.delta < 0
          ? `<em style='color:var(--success-fg)'>PRU undercharges by ${(d.tok / d.pru || 0).toFixed(1)}× — user wins</em>`
          : `<em style='color:var(--danger-fg)'>PRU overcharges by ${(d.pru / Math.max(d.tok, 0.001)).toFixed(1)}× — GitHub wins</em>`),
        e))
      .on("mousemove", moveTip).on("mouseleave", hideTip);

    g.selectAll("text.val").data(data).enter().append("text")
      .attr("x", d => d.delta < 0 ? x(d.delta) - 6 : x(d.delta) + 6)
      .attr("text-anchor", d => d.delta < 0 ? "end" : "start")
      .attr("y", d => y(d.name) + y.bandwidth() / 2)
      .attr("dy", "0.35em")
      .attr("font-size", 11)
      .attr("fill", "var(--fg-muted)")
      .text(d => fmtUSD(d.delta, subsidyMode === "agent" ? 1 : 3));

    g.append("text")
      .attr("x", innerW).attr("y", -2)
      .attr("text-anchor", "end").attr("font-size", 11)
      .attr("fill", "var(--danger-fg)").text("PRU overcharges →");
    g.append("text")
      .attr("x", 0).attr("y", -2)
      .attr("text-anchor", "start").attr("font-size", 11)
      .attr("fill", "var(--success-fg)").text("← PRU undercharges (user wins)");
  }
  d3.selectAll("#subsidy-toggle button").on("click", function () {
    d3.selectAll("#subsidy-toggle button").classed("active", false);
    d3.select(this).classed("active", true);
    subsidyMode = this.dataset.mode;
    renderSubsidy();
  });

  // -------- Workflow modes (log scale) --------
  function renderWorkflows() {
    const data = WORKFLOWS.slice();
    const margin = { top: 10, right: 90, bottom: 56, left: 220 };
    const width = 880, height = data.length * 38 + margin.top + margin.bottom;
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const svg = d3.select("#chart-workflows").append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`);
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLog()
      .domain([3000, d3.max(data, d => d.inTok + d.outTok) * 1.4])
      .range([0, innerW]);
    const y = d3.scaleBand().domain(data.map(d => d.id)).range([0, innerH]).padding(0.25);

    g.append("g").attr("class", "axis grid")
      .attr("transform", `translate(0,${innerH})`)
      .call(d3.axisBottom(x).ticks(6, "~s").tickSize(-innerH));
    g.append("g").attr("class", "axis")
      .call(d3.axisLeft(y).tickFormat(id => {
        const w = data.find(d => d.id === id);
        return (w.icon || "") + "  " + w.name;
      }).tickSize(0))
      .select(".domain").remove();

    g.selectAll("rect.bar").data(data).enter().append("rect")
      .attr("class", "bar")
      .attr("x", x(3000))
      .attr("y", d => y(d.id))
      .attr("height", y.bandwidth())
      .attr("width", d => Math.max(1, x(d.inTok + d.outTok) - x(3000)))
      .attr("fill", "var(--accent-emphasis)")
      .attr("opacity", 0.85)
      .attr("rx", 3)
      .on("mouseenter", (e, d) => showTip(
        `<strong>${d.name}</strong><br>` +
        `<div class='row'><span class='k'>Input tokens</span><span class='v'>${fmtTok(d.inTok)}</span></div>` +
        `<div class='row'><span class='k'>Output tokens</span><span class='v'>${fmtTok(d.outTok)}</span></div>` +
        `<div class='row'><span class='k'>Total</span><span class='v'>${fmtTok(d.inTok + d.outTok)}</span></div>` +
        `<div class='row'><span class='k'>vs simple chat</span><span class='v'>${d.multX}×</span></div>` +
        `<div style='margin-top:4px;color:var(--fg-muted)'>${d.desc}</div>`,
        e))
      .on("mousemove", moveTip).on("mouseleave", hideTip);

    g.selectAll("text.val").data(data).enter().append("text")
      .attr("x", d => x(d.inTok + d.outTok) + 6)
      .attr("y", d => y(d.id) + y.bandwidth() / 2)
      .attr("dy", "0.35em")
      .attr("font-size", 11)
      .attr("font-weight", 600)
      .attr("fill", "var(--fg-default)")
      .text(d => d.multX + "× chat");

    g.append("text")
      .attr("x", innerW / 2).attr("y", innerH + 38)
      .attr("text-anchor", "middle").attr("font-size", 11)
      .attr("fill", "var(--fg-muted)")
      .text("Total tokens per task (log scale)");

    // Detail rows
    const tbl = d3.select("#workflow-table");
    tbl.selectAll("*").remove();
    data.forEach(d => {
      const row = tbl.append("div").attr("class", "workflow-row");
      row.append("div").attr("class", "icon").text(d.icon || "•");
      const middle = row.append("div");
      middle.append("div").attr("class", "name").text(d.name);
      middle.append("div").attr("class", "desc").text(d.desc);
      row.append("div").attr("class", "factor").text(fmtTok(d.inTok + d.outTok));
    });
  }

  // -------- Scatter (PRU vs token toggle) --------
  let scatterMode = "pru";
  function renderScatter() {
    const data = MODELS.filter(m => m.swe !== null);
    const container = d3.select("#chart-scatter");
    container.selectAll("*").remove();

    const margin = { top: 20, right: 24, bottom: 50, left: 60 };
    const width = 880, height = 460;
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const svg = container.append("svg").attr("viewBox", `0 0 ${width} ${height}`);
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const xVal = d => scatterMode === "pru" ? d.pruCost : d.tokenCost;
    const xMax = d3.max(data, xVal) * 1.15;
    const x = d3.scaleLinear().domain([0, xMax]).range([0, innerW]).nice();
    const y = d3.scaleLinear().domain([50, 80]).range([innerH, 0]).nice();

    g.append("g").attr("class", "axis grid")
      .attr("transform", `translate(0,${innerH})`)
      .call(d3.axisBottom(x).ticks(7).tickSize(-innerH).tickFormat(d => "$" + d.toFixed(2)));
    g.append("g").attr("class", "axis grid")
      .call(d3.axisLeft(y).ticks(7).tickSize(-innerW).tickFormat(d => d + "%"));

    g.append("text")
      .attr("x", innerW / 2).attr("y", innerH + 38)
      .attr("text-anchor", "middle").attr("font-size", 12).attr("fill", "var(--fg-muted)")
      .text(scatterMode === "pru" ? "Cost per chat (PRU pricing)" : "Cost per chat (token pricing, 4K + 2K)");
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerH / 2).attr("y", -42)
      .attr("text-anchor", "middle").attr("font-size", 12).attr("fill", "var(--fg-muted)")
      .text("SWE-bench bash-only resolve rate");

    const dots = g.selectAll("circle.dot").data(data);
    dots.enter().append("circle")
      .attr("class", "dot")
      .attr("r", 9)
      .attr("cx", d => x(xVal(d)))
      .attr("cy", d => y(d.swe))
      .attr("fill", d => PROVIDER_COLOR[d.provider])
      .attr("opacity", 0.85)
      .attr("stroke", "var(--canvas-default)")
      .attr("stroke-width", 1.5)
      .on("mouseenter", (e, d) => showTip(
        `<strong>${d.name}</strong><br>` +
        `<div class='row'><span class='k'>SWE-bench</span><span class='v'>${d.swe}%</span></div>` +
        `<div class='row'><span class='k'>PRU / chat</span><span class='v'>${fmtUSD(d.pruCost, 3)}</span></div>` +
        `<div class='row'><span class='k'>Token / chat</span><span class='v'>${fmtUSD(d.tokenCost, 3)}</span></div>` +
        `<div class='row'><span class='k'>Provider</span><span class='v'>${d.provider}</span></div>`,
        e))
      .on("mousemove", moveTip).on("mouseleave", hideTip);

    g.selectAll("text.lbl").data(data).enter().append("text")
      .attr("class", "lbl")
      .attr("x", d => x(xVal(d)) + 12)
      .attr("y", d => y(d.swe) + 4)
      .attr("font-size", 11)
      .attr("fill", "var(--fg-default)")
      .text(d => d.name);

    const legend = d3.select("#legend-scatter");
    legend.selectAll("*").remove();
    Object.entries(PROVIDER_COLOR).forEach(([k, v]) => {
      const item = legend.append("span").attr("class", "legend-item");
      item.append("span").attr("class", "legend-swatch").style("background", v);
      item.append("span").text(k);
    });
  }
  d3.selectAll("#scatter-toggle button").on("click", function () {
    d3.selectAll("#scatter-toggle button").classed("active", false);
    d3.select(this).classed("active", true);
    scatterMode = this.dataset.mode;
    renderScatter();
  });

  // -------- Calculator --------
  function renderCalculator() {
    const modelSel = document.getElementById("calc-model");
    MODELS.forEach((m, i) => {
      const opt = document.createElement("option");
      opt.value = i;
      opt.textContent = m.name + "  ·  " + m.tier + "  ·  " + (m.mult === 0 ? "Included" : m.mult + "×");
      modelSel.appendChild(opt);
    });
    modelSel.value = MODELS.findIndex(m => m.name === "Claude Opus 4.7");

    const wfSel = document.getElementById("calc-workflow");
    WORKFLOWS.forEach((w, i) => {
      const opt = document.createElement("option");
      opt.value = i;
      opt.textContent = w.name + "  (" + fmtTok(w.inTok) + " in / " + fmtTok(w.outTok) + " out)";
      wfSel.appendChild(opt);
    });
    wfSel.value = 0;

    const chats = document.getElementById("calc-chats");
    const inIn = document.getElementById("calc-in");
    const inOut = document.getElementById("calc-out");
    const wfHint = document.getElementById("calc-workflow-hint");

    let lockTokens = false;

    function applyWorkflowDefaults() {
      const w = WORKFLOWS[+wfSel.value];
      inIn.value = w.inTok;
      inOut.value = w.outTok;
      // expand range to fit
      if (+inIn.max < w.inTok) inIn.max = w.inTok * 2;
      if (+inOut.max < w.outTok) inOut.max = w.outTok * 2;
      wfHint.textContent = w.desc;
    }
    applyWorkflowDefaults();

    wfSel.onchange = () => { applyWorkflowDefaults(); update(); };

    function update() {
      const m = MODELS[+modelSel.value];
      const n = +chats.value;
      const inT = +inIn.value, outT = +inOut.value;
      document.getElementById("calc-chats-val").textContent = fmtInt(n);
      document.getElementById("calc-in-val").textContent = fmtInt(inT);
      document.getElementById("calc-out-val").textContent = fmtInt(outT);

      const pruPer = m.pruCost;
      const tokPer = (m.in * inT + m.out * outT) / 1e6;
      const pruTotal = pruPer * n;
      const tokTotal = tokPer * n;
      const delta = pruTotal - tokTotal;

      document.getElementById("calc-pru").textContent = fmtUSDk(pruTotal);
      document.getElementById("calc-tok").textContent = fmtUSDk(tokTotal);
      document.getElementById("calc-delta").textContent = (delta >= 0 ? "+" : "") + fmtUSDk(delta);
      const pill = document.getElementById("calc-delta-pill");
      pill.classList.remove("delta-up", "delta-down");
      pill.classList.add(delta >= 0 ? "delta-up" : "delta-down");

      // Render bar comparison
      const container = d3.select("#chart-calc");
      container.selectAll("*").remove();
      const data = [
        { label: "PRU billing (today)", value: pruTotal, color: "var(--accent-emphasis)" },
        { label: "Token billing (hypothetical)", value: tokTotal, color: "var(--done-emphasis)" },
      ];
      const margin = { top: 10, right: 110, bottom: 28, left: 170 };
      const width = 700, height = 140;
      const innerW = width - margin.left - margin.right;
      const innerH = height - margin.top - margin.bottom;
      const svg = container.append("svg").attr("viewBox", `0 0 ${width} ${height}`);
      const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
      const x = d3.scaleLinear().domain([0, Math.max(pruTotal, tokTotal) * 1.1 || 1]).range([0, innerW]);
      const y = d3.scaleBand().domain(data.map(d => d.label)).range([0, innerH]).padding(0.25);

      g.append("g").attr("class", "axis grid")
        .attr("transform", `translate(0,${innerH})`)
        .call(d3.axisBottom(x).ticks(5).tickSize(-innerH).tickFormat(fmtUSDk));
      g.append("g").attr("class", "axis").call(d3.axisLeft(y).tickSize(0)).select(".domain").remove();

      g.selectAll("rect.bar").data(data).enter().append("rect")
        .attr("class", "bar")
        .attr("x", 0).attr("y", d => y(d.label))
        .attr("height", y.bandwidth())
        .attr("width", d => Math.max(1, x(d.value)))
        .attr("fill", d => d.color).attr("rx", 4);

      g.selectAll("text.val").data(data).enter().append("text")
        .attr("x", d => x(d.value) + 8)
        .attr("y", d => y(d.label) + y.bandwidth() / 2)
        .attr("dy", "0.35em").attr("font-size", 12).attr("font-weight", 600)
        .attr("fill", "var(--fg-default)")
        .text(d => fmtUSDk(d.value));
    }

    [modelSel, chats, inIn, inOut].forEach(el => el.addEventListener("input", update));
    update();
  }

  // -------- Impact (winners/losers) --------
  function renderImpact() {
    const data = IMPACT.slice();
    const container = d3.select("#chart-impact");
    container.selectAll("*").remove();

    const margin = { top: 16, right: 200, bottom: 40, left: 240 };
    const width = 880, height = data.length * 60 + margin.top + margin.bottom;
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const svg = container.append("svg").attr("viewBox", `0 0 ${width} ${height}`);
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const xMax = d3.max(data, d => Math.max(d.today, d.hi)) * 1.05 || 1;
    const x = d3.scaleLinear().domain([0, xMax]).range([0, innerW]).nice();
    const y = d3.scaleBand().domain(data.map(d => d.profile)).range([0, innerH]).padding(0.25);

    g.append("g").attr("class", "axis grid")
      .attr("transform", `translate(0,${innerH})`)
      .call(d3.axisBottom(x).ticks(7).tickSize(-innerH).tickFormat(fmtUSDk));
    g.append("g").attr("class", "axis").call(d3.axisLeft(y).tickSize(0)).select(".domain").remove();

    g.append("text")
      .attr("x", innerW / 2).attr("y", innerH + 32)
      .attr("text-anchor", "middle").attr("font-size", 12).attr("fill", "var(--fg-muted)")
      .text("Estimated monthly cost (USD)");

    const rows = g.selectAll("g.row").data(data).enter().append("g")
      .attr("class", "row")
      .attr("transform", d => `translate(0,${y(d.profile)})`);

    // Token range bar (purple)
    rows.append("rect")
      .attr("x", d => x(d.lo))
      .attr("y", y.bandwidth() * 0.10)
      .attr("width", d => Math.max(2, x(d.hi) - x(d.lo)))
      .attr("height", y.bandwidth() * 0.35)
      .attr("fill", "var(--done-emphasis)")
      .attr("opacity", 0.85)
      .attr("rx", 3);

    // Today bar (blue)
    rows.append("rect")
      .attr("x", 0)
      .attr("y", y.bandwidth() * 0.55)
      .attr("width", d => Math.max(2, x(d.today)))
      .attr("height", y.bandwidth() * 0.32)
      .attr("fill", "var(--accent-emphasis)")
      .attr("opacity", 0.85)
      .attr("rx", 3);

    rows.append("text")
      .attr("x", d => x(d.hi) + 8)
      .attr("y", y.bandwidth() * 0.10 + y.bandwidth() * 0.18)
      .attr("dy", "0.35em")
      .attr("font-size", 11)
      .attr("fill", d => d.direction === "win" ? "var(--success-fg)" : "var(--danger-fg)")
      .attr("font-weight", 600)
      .text(d => {
        const range = d.lo === d.hi ? fmtUSDk(d.lo) : fmtUSDk(d.lo) + "–" + fmtUSDk(d.hi);
        const arrow = d.direction === "win" ? "↓" : "↑";
        return `tokens: ${range} ${arrow}`;
      });

    rows.append("text")
      .attr("x", d => x(d.today) + 8)
      .attr("y", y.bandwidth() * 0.55 + y.bandwidth() * 0.16)
      .attr("dy", "0.35em")
      .attr("font-size", 11)
      .attr("fill", "var(--fg-muted)")
      .text(d => "today: " + fmtUSDk(d.today));

    // Tooltip overlay per row
    rows.append("rect")
      .attr("x", 0).attr("y", 0)
      .attr("width", innerW).attr("height", y.bandwidth())
      .attr("fill", "transparent")
      .style("cursor", "help")
      .on("mouseenter", (e, d) => showTip(
        `<strong>${d.profile}</strong><br>` +
        `<div class='row'><span class='k'>Today (PRU)</span><span class='v'>${fmtUSDk(d.today)}/mo</span></div>` +
        `<div class='row'><span class='k'>Tomorrow (tokens)</span><span class='v'>${fmtUSDk(d.lo)}–${fmtUSDk(d.hi)}/mo</span></div>` +
        `<div style='margin-top:6px;color:var(--fg-muted)'>${d.blurb}</div>`,
        e))
      .on("mousemove", moveTip).on("mouseleave", hideTip);

    // legend
    const lg = svg.append("g").attr("transform", `translate(${margin.left},${height - 12})`);
    const items = [
      { c: "var(--accent-emphasis)", t: "Today (PRU pricing)" },
      { c: "var(--done-emphasis)",   t: "Hypothetical token pricing range" },
    ];
    items.forEach((it, i) => {
      const sg = lg.append("g").attr("transform", `translate(${i * 250},0)`);
      sg.append("rect").attr("width", 14).attr("height", 10).attr("fill", it.c).attr("rx", 2);
      sg.append("text").attr("x", 20).attr("y", 9).attr("font-size", 11).attr("fill", "var(--fg-muted)").text(it.t);
    });
  }

  // -------- Pooling visualization (Business / Enterprise) --------
  function renderPooling() {
    const planSel = document.getElementById("pool-plan");
    const seats   = document.getElementById("pool-seats");
    const seatsV  = document.getElementById("pool-seats-val");
    const period  = document.getElementById("pool-promo");
    const grid    = document.getElementById("pool-grid");
    if (!planSel || !grid || !window.AI_CREDITS || !window.POOL_SCENARIOS) return;

    const fmtC = d3.format(",");

    function draw() {
      const planId = planSel.value;
      const plan = window.AI_CREDITS.plans.find(p =>
        (planId === "business" && p.id === "business") ||
        (planId === "enterprise" && p.id === "enterprise"));
      if (!plan) return;
      const isPromo = period.value === "promo";
      const perSeat = isPromo && plan.promoCredits ? plan.promoCredits : plan.credits;
      const n = +seats.value;
      seatsV.textContent = fmtC(n);
      const pool = n * perSeat;

      d3.select("#pool-total").text(fmtC(pool) + " credits");
      d3.select("#pool-dollar").text("$" + fmtC(Math.round(pool / 100)) + "/mo");
      d3.select("#pool-perseat").text(fmtC(perSeat) + "c" + (isPromo ? " (promo)" : ""));

      grid.innerHTML = "";
      window.POOL_SCENARIOS.forEach(s => {
        const powerSeats  = Math.max(1, Math.round(n * s.powerShare));
        const lightSeats  = n - powerSeats;
        const powerCred   = powerSeats * perSeat * s.powerMultiple;
        const lightCred   = lightSeats * perSeat * s.lightFraction;
        const total       = powerCred + lightCred;
        const overage     = Math.max(0, total - pool);
        const headroom    = Math.max(0, pool - total);
        // scale axis: max of pool or total
        const axisMax = Math.max(pool, total) * 1.05;

        const card = document.createElement("div");
        card.className = "pool-card";
        const pct = v => (100 * v / axisMax).toFixed(2) + "%";
        const poolPct = (100 * pool / axisMax).toFixed(2) + "%";

        // Build segments inside the bar: power, light, then either headroom (under pool) OR overage (beyond pool)
        let segs = "";
        let acc = 0;
        segs += `<div class="seg power" style="left:${pct(acc)};width:${pct(powerCred)}" title="Power-user credits"></div>`;
        acc += powerCred;
        segs += `<div class="seg light" style="left:${pct(acc)};width:${pct(lightCred)}" title="Light-user credits"></div>`;
        acc += lightCred;
        if (headroom > 0) {
          segs += `<div class="seg unused" style="left:${pct(acc)};width:${pct(headroom)}" title="Headroom"></div>`;
        }
        if (overage > 0) {
          segs += `<div class="seg over" style="left:${poolPct};width:${pct(overage)}" title="Paid overage"></div>`;
        }

        const fitClass = overage > 0 ? "loss" : "win";
        const fitLabel = overage > 0
          ? `Over by $${fmtC(Math.round(overage / 100))}/mo`
          : `Fits with $${fmtC(Math.round(headroom / 100))}/mo headroom`;

        card.innerHTML = `
          <h4>${s.label}</h4>
          <p class="pool-note">${s.note}</p>
          <div class="pool-bar">
            <div class="ref-line" style="left:${poolPct}"></div>
            <div class="ref-label" style="left:${poolPct}">Pool: $${fmtC(Math.round(pool/100))}</div>
            ${segs}
          </div>
          <div style="margin-top:14px;display:flex;flex-wrap:wrap;gap:14px">
            <span class="pool-stat"><span>Total need</span><strong>${fmtC(Math.round(total))}c · $${fmtC(Math.round(total/100))}</strong></span>
            <span class="pool-stat"><span>Power seats</span><strong>${fmtC(powerSeats)} (${(s.powerShare*100).toFixed(0)}%)</strong></span>
            <span class="pool-stat"><span>Verdict</span><strong style="color:var(--${overage>0?'danger':'success'}-fg)">${fitLabel}</strong></span>
          </div>
        `;
        grid.appendChild(card);
      });
    }

    [planSel, seats, period].forEach(el => el.addEventListener("input", draw));
    draw();
  }


  document.addEventListener("DOMContentLoaded", () => {
    renderKPIs();
    renderTierRationale();
    renderMultipliers();
    renderSubsidy();
    renderWorkflows();
    renderScatter();
    renderCalculator();
    renderImpact();
    renderPooling();
  });
})();
