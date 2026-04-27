/* usage.js — Copilot Usage Data NDJSON upload + summary visualisations.
   Everything runs client-side. No network calls beyond the static asset load. */

(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const tooltip = d3.select('#tooltip');
  const fmtInt = d3.format(',');
  const fmtPct = d3.format('.1%');
  const fmtCompact = d3.format('.2~s');

  // ----- DOM refs ---------------------------------------------------------
  const dropzone = $('dropzone');
  const fileInput = $('file-input');
  const filePick = $('file-pick');
  const dzMeta = $('dz-meta');
  const resetBtn = $('reset-btn');
  const parseError = $('parse-error');
  const parseErrorMsg = $('parse-error-msg');
  const results = $('results');

  // ----- Upload wiring ----------------------------------------------------
  filePick.addEventListener('click', () => fileInput.click());
  dropzone.addEventListener('click', (e) => {
    if (e.target.closest('button')) return;
    fileInput.click();
  });
  fileInput.addEventListener('change', (e) => {
    const f = e.target.files && e.target.files[0];
    if (f) handleFile(f);
  });

  ['dragenter', 'dragover'].forEach((evt) => {
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault(); e.stopPropagation();
      dropzone.classList.add('is-drag');
    });
  });
  ['dragleave', 'drop'].forEach((evt) => {
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault(); e.stopPropagation();
      dropzone.classList.remove('is-drag');
    });
  });
  dropzone.addEventListener('drop', (e) => {
    const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) handleFile(f);
  });

  resetBtn.addEventListener('click', () => {
    fileInput.value = '';
    dropzone.classList.remove('is-loaded');
    dzMeta.textContent = 'No file loaded yet.';
    resetBtn.hidden = true;
    parseError.hidden = true;
    results.hidden = true;
    try { sessionStorage.removeItem('copilotUsageData'); } catch (e) { /* ignore */ }
    const link = $('cost-analysis-link');
    if (link) link.hidden = true;
  });

  function handleFile(file) {
    parseError.hidden = true;
    dzMeta.textContent = `Reading ${file.name} (${fmtBytes(file.size)})…`;
    const reader = new FileReader();
    reader.onerror = () => showError('Failed to read the file.');
    reader.onload = () => {
      try {
        const rows = parseNdjson(reader.result);
        if (!rows.length) {
          showError('No JSON rows found. Expected NDJSON (one JSON object per line).');
          return;
        }
        dropzone.classList.add('is-loaded');
        dzMeta.textContent = `✓ Parsed ${fmtInt(rows.length)} rows from ${file.name} (${fmtBytes(file.size)})`;
        resetBtn.hidden = false;
        renderAll(rows);
        results.hidden = false;
        // Smooth scroll to overview so the user sees the result.
        const overview = $('overview');
        if (overview) overview.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } catch (err) {
        showError(err.message || String(err));
      }
    };
    reader.readAsText(file);
  }

  function showError(msg) {
    dzMeta.textContent = 'No file loaded yet.';
    parseErrorMsg.textContent = ' ' + msg;
    parseError.hidden = false;
  }

  function fmtBytes(n) {
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
    if (n < 1024 * 1024 * 1024) return (n / 1024 / 1024).toFixed(1) + ' MB';
    return (n / 1024 / 1024 / 1024).toFixed(2) + ' GB';
  }

  function parseNdjson(text) {
    // Tolerant: handles NDJSON, JSONL, or a single JSON array.
    const trimmed = text.replace(/^\uFEFF/, '').trim();
    if (!trimmed) return [];
    if (trimmed.startsWith('[')) {
      const arr = JSON.parse(trimmed);
      if (!Array.isArray(arr)) throw new Error('Top-level JSON is not an array.');
      return arr;
    }
    const rows = [];
    let bad = 0;
    const lines = trimmed.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      try {
        rows.push(JSON.parse(line));
      } catch (e) {
        bad++;
        if (bad <= 3) {
          console.warn(`Skipping unparseable line ${i + 1}:`, e.message);
        }
      }
    }
    if (rows.length === 0) {
      throw new Error('No valid JSON lines parsed. Is this an NDJSON export?');
    }
    if (bad) console.warn(`Skipped ${bad} unparseable line(s).`);
    return rows;
  }

  // ----- Aggregation ------------------------------------------------------

  function aggregate(rows) {
    const a = {
      users: new Set(),
      days: new Set(),
      interactions: 0,
      generations: 0,
      acceptances: 0,
      locSuggested: 0,
      locAdded: 0,
      byDay: new Map(),       // day -> {interactions, generations, acceptances}
      byFeature: new Map(),   // feature -> {interactions, generations, acceptances}
      byModel: new Map(),     // model -> {interactions, generations}
      byLanguage: new Map(),  // lang -> {gens, locAdded, locSuggested}
      byIde: new Map(),       // ide -> interactions
      byUser: new Map(),      // login -> {interactions, generations, acceptances, days}
      modelFeatureCells: [],  // raw [{model, feature, interactions, generations}] for cost-analysis page
      cliInteractionsTotal: 0,
      cli: {
        users: new Set(),
        sessions: 0,
        requests: 0,
        prompt: 0,
        output: 0,
        avgPerReq: 0,
        byDay: new Map(),     // day -> {prompt, output}
      },
    };

    const bumpMap = (m, k, fields) => {
      if (k == null) return;
      let cur = m.get(k);
      if (!cur) { cur = {}; m.set(k, cur); }
      for (const f in fields) cur[f] = (cur[f] || 0) + (fields[f] || 0);
    };

    for (const r of rows) {
      if (!r || typeof r !== 'object') continue;
      const day = r.day;
      const login = r.user_login;
      const interactions = r.user_initiated_interaction_count || 0;
      const gens = r.code_generation_activity_count || 0;
      const accepts = r.code_acceptance_activity_count || 0;
      const locSug = r.loc_suggested_to_add_sum || 0;
      const locAdd = r.loc_added_sum || 0;

      if (login) a.users.add(login);
      if (day) a.days.add(day);
      a.interactions += interactions;
      a.generations += gens;
      a.acceptances += accepts;
      a.locSuggested += locSug;
      a.locAdded += locAdd;

      if (day) bumpMap(a.byDay, day, { interactions, generations: gens, acceptances: accepts });

      if (login) {
        let u = a.byUser.get(login);
        if (!u) { u = { interactions: 0, generations: 0, acceptances: 0, days: new Set() }; a.byUser.set(login, u); }
        u.interactions += interactions;
        u.generations += gens;
        u.acceptances += accepts;
        if (day) u.days.add(day);
      }

      if (Array.isArray(r.totals_by_feature)) {
        for (const f of r.totals_by_feature) {
          bumpMap(a.byFeature, f.feature, {
            interactions: f.user_initiated_interaction_count || 0,
            generations: f.code_generation_activity_count || 0,
            acceptances: f.code_acceptance_activity_count || 0,
          });
        }
      }

      if (Array.isArray(r.totals_by_model_feature)) {
        for (const m of r.totals_by_model_feature) {
          const ints = m.user_initiated_interaction_count || 0;
          const gens = m.code_generation_activity_count || 0;
          bumpMap(a.byModel, m.model, { interactions: ints, generations: gens });
          a.modelFeatureCells.push({
            model: m.model, feature: m.feature, interactions: ints, generations: gens,
          });
          if (m.feature === 'copilot_cli') a.cliInteractionsTotal += ints;
        }
      }

      if (Array.isArray(r.totals_by_language_feature)) {
        for (const lf of r.totals_by_language_feature) {
          bumpMap(a.byLanguage, lf.language, {
            gens: lf.code_generation_activity_count || 0,
            locSuggested: lf.loc_suggested_to_add_sum || 0,
            locAdded: lf.loc_added_sum || 0,
          });
        }
      }

      if (Array.isArray(r.totals_by_ide)) {
        for (const i of r.totals_by_ide) {
          bumpMap(a.byIde, i.ide || 'unknown', {
            interactions: i.user_initiated_interaction_count || 0,
          });
        }
      }

      if (r.used_cli && r.totals_by_cli) {
        const c = r.totals_by_cli;
        a.cli.sessions += c.session_count || 0;
        a.cli.requests += c.request_count || 0;
        const tu = c.token_usage || {};
        a.cli.prompt += tu.prompt_tokens_sum || 0;
        a.cli.output += tu.output_tokens_sum || 0;
        if (login) a.cli.users.add(login);
        if (day) {
          let d = a.cli.byDay.get(day);
          if (!d) { d = { prompt: 0, output: 0 }; a.cli.byDay.set(day, d); }
          d.prompt += tu.prompt_tokens_sum || 0;
          d.output += tu.output_tokens_sum || 0;
        }
        // Synthesize a CLI surface for the IDE breakdown so it's not invisible.
        bumpMap(a.byIde, 'copilot-cli', { interactions: 0 });
      }
    }
    a.cli.avgPerReq = a.cli.requests ? Math.round((a.cli.prompt + a.cli.output) / a.cli.requests) : 0;
    return a;
  }

  // ----- Rendering --------------------------------------------------------

  function renderAll(rows) {
    const a = aggregate(rows);
    renderOverview(rows, a);
    renderDaily(a);
    renderFeatures(a);
    renderModels(a);
    renderLanguages(a);
    renderIde(a);
    renderUsers(a);
    renderCli(a);
    stashForCostAnalysis(rows, a);
  }

  // Persist a compact aggregated payload so the cost-analysis page can read it
  // without re-uploading. Maps and Sets are serialized to plain objects/arrays.
  function stashForCostAnalysis(rows, a) {
    const mapToObj = (m) => {
      const o = {};
      for (const [k, v] of m.entries()) o[k] = v;
      return o;
    };
    const payload = {
      meta: {
        rowCount: rows.length,
        users: a.users.size,
        days: a.days.size,
        reportStart: rows[0] && rows[0].report_start_day || null,
        reportEnd: rows[0] && rows[0].report_end_day || null,
        enterpriseId: rows[0] && rows[0].enterprise_id || null,
        savedAt: new Date().toISOString(),
      },
      byDay: mapToObj(a.byDay),
      byFeature: mapToObj(a.byFeature),
      byModel: mapToObj(a.byModel),
      modelFeatureCells: a.modelFeatureCells,
      cliInteractionsTotal: a.cliInteractionsTotal,
      cli: {
        users: a.cli.users.size,
        sessions: a.cli.sessions,
        requests: a.cli.requests,
        prompt: a.cli.prompt,
        output: a.cli.output,
        byDay: mapToObj(a.cli.byDay),
      },
    };
    try {
      sessionStorage.setItem('copilotUsageData', JSON.stringify(payload));
      const link = $('cost-analysis-link');
      if (link) link.hidden = false;
    } catch (e) {
      // Quota exceeded — page will still work, just no cross-page persistence.
      console.warn('Could not stash usage data for cost analysis page:', e.message);
    }
  }

  function renderOverview(rows, a) {
    $('kpi-users').textContent = fmtInt(a.users.size);
    $('kpi-users-sub').innerHTML = `${fmtInt(rows.length)} rows · ${fmtInt(a.days.size)} days`;
    const sortedDays = [...a.days].sort();
    if (sortedDays.length) {
      $('kpi-range').textContent = `${sortedDays[0]} → ${sortedDays[sortedDays.length - 1]}`;
    } else {
      $('kpi-range').textContent = '—';
    }
    $('kpi-interactions').textContent = fmtInt(a.interactions);
    $('kpi-gens').textContent = fmtInt(a.generations);
    $('kpi-accepts').textContent = fmtInt(a.acceptances);
    const rate = a.generations ? a.acceptances / a.generations : 0;
    $('kpi-accept-rate').textContent = a.generations
      ? `${fmtPct(rate)} accepted of ${fmtInt(a.generations)} suggestions`
      : 'no suggestions recorded';
    $('kpi-loc-added').textContent = fmtInt(a.locAdded);
    $('kpi-loc-suggested').textContent = fmtInt(a.locSuggested);

    const r = rows[0] || {};
    const reportRange = (r.report_start_day && r.report_end_day)
      ? ` Reporting window in file: <code>${r.report_start_day}</code> → <code>${r.report_end_day}</code>.`
      : '';
    const ent = r.enterprise_id ? ` Enterprise <code>${r.enterprise_id}</code>.` : '';
    $('overview-lede').innerHTML = `Headline figures across every row in the file.${ent}${reportRange}`;
  }

  // ----- Daily activity area chart ---------------------------------------
  function renderDaily(a) {
    const data = [...a.byDay.entries()]
      .map(([day, v]) => ({ day, date: new Date(day), ...v }))
      .filter((d) => !isNaN(d.date))
      .sort((x, y) => x.date - y.date);

    const container = d3.select('#chart-daily').html('');
    const legend = d3.select('#legend-daily').html('');
    if (!data.length) {
      container.append('div').attr('class', 'source-line').text('No daily data found.');
      return;
    }

    const series = [
      { key: 'interactions', label: 'Interactions', color: 'var(--accent-emphasis)' },
      { key: 'generations', label: 'Code generations', color: 'var(--done-emphasis)' },
      { key: 'acceptances', label: 'Acceptances', color: 'var(--success-emphasis)' },
    ];

    series.forEach((s) => {
      legend.append('span').attr('class', 'legend-item').html(
        `<span class="legend-swatch" style="background:${s.color}"></span>${s.label}`
      );
    });

    const W = 1100, H = 360;
    const margin = { top: 16, right: 24, bottom: 32, left: 56 };
    const w = W - margin.left - margin.right;
    const h = H - margin.top - margin.bottom;

    const svg = container.append('svg').attr('viewBox', `0 0 ${W} ${H}`);
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    let mode = 'all';

    function visibleSeries() {
      if (mode === 'interactions') return series.filter((s) => s.key === 'interactions');
      if (mode === 'generation') return series.filter((s) => s.key !== 'interactions');
      return series;
    }

    function draw() {
      g.selectAll('*').remove();
      const vis = visibleSeries();
      const x = d3.scaleTime().domain(d3.extent(data, (d) => d.date)).range([0, w]);
      const yMax = d3.max(data, (d) => d3.max(vis, (s) => d[s.key])) || 1;
      const y = d3.scaleLinear().domain([0, yMax]).nice().range([h, 0]);

      g.append('g').attr('class', 'grid')
        .call(d3.axisLeft(y).ticks(5).tickSize(-w).tickFormat(''));

      g.append('g').attr('class', 'axis')
        .attr('transform', `translate(0,${h})`)
        .call(d3.axisBottom(x).ticks(Math.min(8, data.length)).tickFormat(d3.timeFormat('%b %d')));
      g.append('g').attr('class', 'axis')
        .call(d3.axisLeft(y).ticks(5).tickFormat(fmtCompact));

      vis.forEach((s) => {
        const area = d3.area()
          .x((d) => x(d.date))
          .y0(h)
          .y1((d) => y(d[s.key]))
          .curve(d3.curveMonotoneX);
        const line = d3.line()
          .x((d) => x(d.date))
          .y((d) => y(d[s.key]))
          .curve(d3.curveMonotoneX);

        g.append('path').datum(data).attr('fill', s.color).attr('opacity', 0.18).attr('d', area);
        g.append('path').datum(data)
          .attr('fill', 'none').attr('stroke', s.color).attr('stroke-width', 2).attr('d', line);
      });

      // Hover overlay.
      const bisect = d3.bisector((d) => d.date).left;
      const focus = g.append('g').style('display', 'none');
      focus.append('line').attr('y1', 0).attr('y2', h)
        .attr('stroke', 'var(--fg-subtle)').attr('stroke-dasharray', '2 2');
      vis.forEach((s) => {
        focus.append('circle').attr('r', 4)
          .attr('fill', s.color).attr('stroke', 'var(--canvas-default)').attr('stroke-width', 2)
          .attr('data-key', s.key);
      });

      g.append('rect').attr('width', w).attr('height', h).attr('fill', 'transparent')
        .on('mouseenter', () => { focus.style('display', null); tooltip.style('opacity', 1); })
        .on('mouseleave', () => { focus.style('display', 'none'); tooltip.style('opacity', 0); })
        .on('mousemove', (e) => {
          const [mx] = d3.pointer(e);
          const xv = x.invert(mx);
          const i = bisect(data, xv);
          const d0 = data[Math.max(0, i - 1)];
          const d1 = data[Math.min(data.length - 1, i)];
          const d = !d0 ? d1 : !d1 ? d0 : (xv - d0.date > d1.date - xv ? d1 : d0);
          focus.attr('transform', `translate(${x(d.date)},0)`);
          focus.selectAll('circle').attr('cy', function () {
            const k = this.getAttribute('data-key');
            return y(d[k]);
          });
          const rate = d.generations ? fmtPct(d.acceptances / d.generations) : '—';
          tooltip.html(`
            <strong>${d.day}</strong>
            <div class="row"><span class="k">Interactions</span><span class="v">${fmtInt(d.interactions)}</span></div>
            <div class="row"><span class="k">Generations</span><span class="v">${fmtInt(d.generations)}</span></div>
            <div class="row"><span class="k">Acceptances</span><span class="v">${fmtInt(d.acceptances)}</span></div>
            <div class="row"><span class="k">Acceptance rate</span><span class="v">${rate}</span></div>
          `).style('left', (e.pageX + 12) + 'px').style('top', (e.pageY + 12) + 'px');
        });
    }

    draw();

    d3.selectAll('#daily-toggle button').on('click', function () {
      d3.selectAll('#daily-toggle button').classed('active', false);
      d3.select(this).classed('active', true);
      mode = this.dataset.mode;
      draw();
    });
  }

  // ----- Generic horizontal bar (single value) ---------------------------
  function horizontalBar(selector, items, opts = {}) {
    // items: [{label, value, [color], [meta]}]
    const container = d3.select(selector).html('');
    if (!items.length) {
      container.append('div').attr('class', 'source-line').text('No data.');
      return;
    }
    const W = 1100;
    const rowH = opts.rowH || 26;
    const margin = { top: 8, right: 80, bottom: 8, left: opts.leftPad || 180 };
    const h = items.length * rowH;
    const H = h + margin.top + margin.bottom;
    const w = W - margin.left - margin.right;

    const svg = container.append('svg').attr('viewBox', `0 0 ${W} ${H}`);
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    const x = d3.scaleLinear().domain([0, d3.max(items, (d) => d.value) || 1]).range([0, w]);
    const y = d3.scaleBand().domain(items.map((d) => d.label)).range([0, h]).padding(0.18);

    g.append('g').attr('class', 'axis')
      .call(d3.axisLeft(y).tickSize(0).tickPadding(8))
      .call((sel) => sel.select('.domain').remove());

    const rows = g.selectAll('g.row').data(items).join('g')
      .attr('class', 'row')
      .attr('transform', (d) => `translate(0,${y(d.label)})`);

    rows.append('rect')
      .attr('x', 0).attr('y', 0)
      .attr('height', y.bandwidth())
      .attr('width', (d) => x(d.value))
      .attr('fill', (d) => d.color || 'var(--accent-emphasis)')
      .attr('rx', 3);

    rows.append('text')
      .attr('x', (d) => x(d.value) + 6)
      .attr('y', y.bandwidth() / 2 + 4)
      .attr('font-size', 12)
      .attr('fill', 'var(--fg-default)')
      .text((d) => opts.valueFmt ? opts.valueFmt(d) : fmtInt(d.value));

    rows.on('mousemove', (e, d) => {
      tooltip.style('opacity', 1)
        .html(opts.tooltip ? opts.tooltip(d) : `<strong>${d.label}</strong><div class="row"><span class="k">Value</span><span class="v">${fmtInt(d.value)}</span></div>`)
        .style('left', (e.pageX + 12) + 'px').style('top', (e.pageY + 12) + 'px');
    }).on('mouseleave', () => tooltip.style('opacity', 0));
  }

  // ----- Features --------------------------------------------------------
  function renderFeatures(a) {
    const items = [...a.byFeature.entries()]
      .map(([feature, v]) => ({ label: feature || 'unknown', value: v.interactions || 0, ...v }))
      .filter((d) => d.value > 0 || d.generations > 0)
      .sort((x, y) => y.value - x.value);
    horizontalBar('#chart-features', items.slice(0, 12), {
      tooltip: (d) => `
        <strong>${d.label}</strong>
        <div class="row"><span class="k">Interactions</span><span class="v">${fmtInt(d.interactions || 0)}</span></div>
        <div class="row"><span class="k">Generations</span><span class="v">${fmtInt(d.generations || 0)}</span></div>
        <div class="row"><span class="k">Acceptances</span><span class="v">${fmtInt(d.acceptances || 0)}</span></div>`,
    });
  }

  // ----- Models (grouped 2-bar) ------------------------------------------
  function renderModels(a) {
    const items = [...a.byModel.entries()]
      .map(([model, v]) => ({ label: model || 'unknown', interactions: v.interactions || 0, generations: v.generations || 0 }))
      .filter((d) => d.interactions > 0 || d.generations > 0)
      .sort((x, y) => (y.interactions + y.generations) - (x.interactions + x.generations))
      .slice(0, 12);

    const container = d3.select('#chart-models').html('');
    if (!items.length) { container.append('div').attr('class', 'source-line').text('No model data.'); return; }

    const W = 1100, rowH = 38;
    const margin = { top: 8, right: 80, bottom: 8, left: 200 };
    const h = items.length * rowH;
    const H = h + margin.top + margin.bottom;
    const w = W - margin.left - margin.right;
    const svg = container.append('svg').attr('viewBox', `0 0 ${W} ${H}`);
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().domain([0, d3.max(items, (d) => Math.max(d.interactions, d.generations)) || 1]).range([0, w]);
    const y = d3.scaleBand().domain(items.map((d) => d.label)).range([0, h]).padding(0.18);
    const subY = d3.scaleBand().domain(['interactions', 'generations']).range([0, y.bandwidth()]).padding(0.15);

    g.append('g').attr('class', 'axis')
      .call(d3.axisLeft(y).tickSize(0).tickPadding(8))
      .call((sel) => sel.select('.domain').remove());

    const rows = g.selectAll('g.row').data(items).join('g')
      .attr('transform', (d) => `translate(0,${y(d.label)})`);

    const colors = { interactions: 'var(--accent-emphasis)', generations: 'var(--done-emphasis)' };
    ['interactions', 'generations'].forEach((k) => {
      rows.append('rect')
        .attr('y', subY(k))
        .attr('height', subY.bandwidth())
        .attr('x', 0)
        .attr('width', (d) => x(d[k]))
        .attr('fill', colors[k])
        .attr('rx', 2);
      rows.append('text')
        .attr('y', subY(k) + subY.bandwidth() / 2 + 4)
        .attr('x', (d) => x(d[k]) + 6)
        .attr('font-size', 11)
        .attr('fill', 'var(--fg-muted)')
        .text((d) => fmtInt(d[k]));
    });

    rows.on('mousemove', (e, d) => {
      tooltip.style('opacity', 1)
        .html(`<strong>${d.label}</strong>
          <div class="row"><span class="k">Interactions</span><span class="v">${fmtInt(d.interactions)}</span></div>
          <div class="row"><span class="k">Generations</span><span class="v">${fmtInt(d.generations)}</span></div>`)
        .style('left', (e.pageX + 12) + 'px').style('top', (e.pageY + 12) + 'px');
    }).on('mouseleave', () => tooltip.style('opacity', 0));
  }

  // ----- Languages -------------------------------------------------------
  function renderLanguages(a) {
    const items = [...a.byLanguage.entries()]
      .map(([lang, v]) => ({ label: lang || 'unknown', locAdded: v.locAdded || 0, locSuggested: v.locSuggested || 0, gens: v.gens || 0 }))
      .filter((d) => d.locAdded > 0 || d.locSuggested > 0 || d.gens > 0)
      .sort((x, y) => (y.locAdded - x.locAdded) || (y.locSuggested - x.locSuggested))
      .slice(0, 12);

    const container = d3.select('#chart-languages').html('');
    if (!items.length) { container.append('div').attr('class', 'source-line').text('No language data.'); return; }

    const W = 1100, rowH = 30;
    const margin = { top: 8, right: 80, bottom: 8, left: 160 };
    const h = items.length * rowH;
    const H = h + margin.top + margin.bottom;
    const w = W - margin.left - margin.right;
    const svg = container.append('svg').attr('viewBox', `0 0 ${W} ${H}`);
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().domain([0, d3.max(items, (d) => Math.max(d.locAdded, d.locSuggested)) || 1]).range([0, w]);
    const y = d3.scaleBand().domain(items.map((d) => d.label)).range([0, h]).padding(0.18);

    g.append('g').attr('class', 'axis')
      .call(d3.axisLeft(y).tickSize(0).tickPadding(8))
      .call((sel) => sel.select('.domain').remove());

    const rows = g.selectAll('g.row').data(items).join('g')
      .attr('transform', (d) => `translate(0,${y(d.label)})`);

    // suggested = outline behind, added = filled in front
    rows.append('rect')
      .attr('y', 2).attr('x', 0)
      .attr('height', y.bandwidth() - 4)
      .attr('width', (d) => x(d.locSuggested))
      .attr('fill', 'var(--accent-subtle)')
      .attr('stroke', 'var(--accent-emphasis)')
      .attr('rx', 2);
    rows.append('rect')
      .attr('y', 2).attr('x', 0)
      .attr('height', y.bandwidth() - 4)
      .attr('width', (d) => x(d.locAdded))
      .attr('fill', 'var(--success-emphasis)')
      .attr('rx', 2);
    rows.append('text')
      .attr('y', y.bandwidth() / 2 + 4)
      .attr('x', (d) => Math.max(x(d.locSuggested), x(d.locAdded)) + 6)
      .attr('font-size', 12)
      .attr('fill', 'var(--fg-default)')
      .text((d) => `${fmtInt(d.locAdded)} / ${fmtInt(d.locSuggested)}`);

    rows.on('mousemove', (e, d) => {
      const rate = d.locSuggested ? fmtPct(d.locAdded / d.locSuggested) : '—';
      tooltip.style('opacity', 1)
        .html(`<strong>${d.label}</strong>
          <div class="row"><span class="k">Lines added</span><span class="v">${fmtInt(d.locAdded)}</span></div>
          <div class="row"><span class="k">Lines suggested</span><span class="v">${fmtInt(d.locSuggested)}</span></div>
          <div class="row"><span class="k">Acceptance ratio</span><span class="v">${rate}</span></div>
          <div class="row"><span class="k">Generations</span><span class="v">${fmtInt(d.gens)}</span></div>`)
        .style('left', (e.pageX + 12) + 'px').style('top', (e.pageY + 12) + 'px');
    }).on('mouseleave', () => tooltip.style('opacity', 0));
  }

  // ----- IDE donut -------------------------------------------------------
  function renderIde(a) {
    const items = [...a.byIde.entries()]
      .map(([ide, v]) => ({ label: ide, value: v.interactions || 0 }))
      .filter((d) => d.value > 0)
      .sort((x, y) => y.value - x.value);

    horizontalBar('#chart-ide', items, {
      tooltip: (d) => `<strong>${d.label}</strong><div class="row"><span class="k">Interactions</span><span class="v">${fmtInt(d.value)}</span></div>`,
    });
  }

  // ----- Top users -------------------------------------------------------
  function renderUsers(a) {
    const items = [...a.byUser.entries()]
      .map(([login, v]) => ({
        label: login,
        value: v.interactions,
        generations: v.generations,
        acceptances: v.acceptances,
        days: v.days.size,
        rate: v.generations ? v.acceptances / v.generations : 0,
      }))
      .filter((d) => d.value > 0)
      .sort((x, y) => y.value - x.value)
      .slice(0, 15);

    if (!items.length) {
      d3.select('#chart-users').html('').append('div').attr('class', 'source-line').text('No user data.');
      return;
    }

    // Color by acceptance rate.
    const color = d3.scaleLinear()
      .domain([0, 0.15, 0.4])
      .range(['#cf222e', '#bf8700', '#1a7f37'])
      .clamp(true);

    items.forEach((d) => { d.color = color(d.rate); });

    horizontalBar('#chart-users', items, {
      leftPad: 200,
      tooltip: (d) => `<strong>${d.label}</strong>
        <div class="row"><span class="k">Interactions</span><span class="v">${fmtInt(d.value)}</span></div>
        <div class="row"><span class="k">Generations</span><span class="v">${fmtInt(d.generations)}</span></div>
        <div class="row"><span class="k">Acceptances</span><span class="v">${fmtInt(d.acceptances)}</span></div>
        <div class="row"><span class="k">Acceptance rate</span><span class="v">${fmtPct(d.rate)}</span></div>
        <div class="row"><span class="k">Active days</span><span class="v">${d.days}</span></div>`,
    });
  }

  // ----- CLI tokens ------------------------------------------------------
  function renderCli(a) {
    $('kpi-cli-users').textContent = fmtInt(a.cli.users.size);
    $('kpi-cli-sessions').textContent = fmtInt(a.cli.sessions);
    $('kpi-cli-sessions-sub').innerHTML = `${fmtInt(a.cli.requests)} requests`;
    $('kpi-cli-prompt').textContent = fmtCompact(a.cli.prompt);
    $('kpi-cli-output').textContent = fmtCompact(a.cli.output);
    $('kpi-cli-avg-sub').textContent = a.cli.avgPerReq
      ? `${fmtInt(a.cli.avgPerReq)} avg tokens / request`
      : 'no CLI requests';

    const card = $('cli-chart-card');
    const empty = $('cli-empty');
    if (!a.cli.byDay.size) {
      card.hidden = true;
      empty.hidden = false;
      return;
    }
    card.hidden = false;
    empty.hidden = true;

    const data = [...a.cli.byDay.entries()]
      .map(([day, v]) => ({ day, date: new Date(day), prompt: v.prompt, output: v.output }))
      .filter((d) => !isNaN(d.date))
      .sort((x, y) => x.date - y.date);

    const container = d3.select('#chart-cli').html('');
    const W = 1100, H = 320;
    const margin = { top: 16, right: 24, bottom: 32, left: 64 };
    const w = W - margin.left - margin.right;
    const h = H - margin.top - margin.bottom;
    const svg = container.append('svg').attr('viewBox', `0 0 ${W} ${H}`);
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleTime().domain(d3.extent(data, (d) => d.date)).range([0, w]);
    const yMax = d3.max(data, (d) => d.prompt + d.output) || 1;
    const y = d3.scaleLinear().domain([0, yMax]).nice().range([h, 0]);

    g.append('g').attr('class', 'grid').call(d3.axisLeft(y).ticks(5).tickSize(-w).tickFormat(''));
    g.append('g').attr('class', 'axis').attr('transform', `translate(0,${h})`)
      .call(d3.axisBottom(x).ticks(Math.min(8, data.length)).tickFormat(d3.timeFormat('%b %d')));
    g.append('g').attr('class', 'axis').call(d3.axisLeft(y).ticks(5).tickFormat(fmtCompact));

    const stack = d3.stack().keys(['prompt', 'output'])(data);
    const colors = { prompt: 'var(--accent-emphasis)', output: 'var(--done-emphasis)' };
    const area = d3.area()
      .x((d) => x(d.data.date))
      .y0((d) => y(d[0]))
      .y1((d) => y(d[1]))
      .curve(d3.curveMonotoneX);

    g.selectAll('path.layer').data(stack).join('path')
      .attr('class', 'layer')
      .attr('fill', (d) => colors[d.key])
      .attr('opacity', 0.85)
      .attr('d', area);

    // Hover overlay.
    const bisect = d3.bisector((d) => d.date).left;
    g.append('rect').attr('width', w).attr('height', h).attr('fill', 'transparent')
      .on('mouseleave', () => tooltip.style('opacity', 0))
      .on('mousemove', (e) => {
        const [mx] = d3.pointer(e);
        const d = data[Math.max(0, Math.min(data.length - 1, bisect(data, x.invert(mx))))];
        tooltip.style('opacity', 1).html(`
          <strong>${d.day}</strong>
          <div class="row"><span class="k">Prompt tokens</span><span class="v">${fmtInt(d.prompt)}</span></div>
          <div class="row"><span class="k">Output tokens</span><span class="v">${fmtInt(d.output)}</span></div>
          <div class="row"><span class="k">Total</span><span class="v">${fmtInt(d.prompt + d.output)}</span></div>
        `).style('left', (e.pageX + 12) + 'px').style('top', (e.pageY + 12) + 'px');
      });
  }
})();
