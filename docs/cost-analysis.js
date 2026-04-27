/* cost-analysis.js — PRU vs token cost reconciliation from a Copilot usage NDJSON.
   Reads the aggregated payload stashed by usage.js into sessionStorage.
   No network calls. */

(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const tooltip = d3.select('#tooltip');
  const fmtInt = d3.format(',');
  const fmtMoney = (v) => (v < 0 ? '-' : '') + '$' + Math.abs(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtMoneyShort = (v) => {
    const a = Math.abs(v);
    if (a >= 1000) return (v < 0 ? '-' : '') + '$' + (a / 1000).toFixed(1) + 'k';
    if (a >= 100) return (v < 0 ? '-' : '') + '$' + a.toFixed(0);
    return (v < 0 ? '-' : '') + '$' + a.toFixed(2);
  };
  const fmtPct = d3.format('+.0%');
  const fmtCompact = d3.format('.2~s');
  const PRU_RATE = 0.04; // $ per PRU at standard overage rate

  // ----- Model lookup ----------------------------------------------------
  // The Copilot export emits internal model slugs that don't always match the
  // canonical names in data.js. Build a normalized index keyed on the slug.
  const MODEL_INDEX = buildModelIndex();

  function buildModelIndex() {
    const idx = new Map();
    const add = (slug, m) => { if (slug) idx.set(slug.toLowerCase(), m); };
    for (const m of (window.MODELS || [])) {
      add(m.name, m);
      add(m.name.replace(/\s+/g, '-'), m);
      add(m.name.replace(/\s+/g, '').toLowerCase(), m);
    }
    // Manual aliases: usage-export slug → MODELS entry name
    const aliases = {
      'claude-4.6-sonnet':   'Claude Sonnet 4.6',
      'claude-sonnet-4.6':   'Claude Sonnet 4.6',
      'claude-4.5-sonnet':   'Claude Sonnet 4.5',
      'claude-sonnet-4.5':   'Claude Sonnet 4.5',
      'claude-4.0-sonnet':   'Claude Sonnet 4',
      'claude-sonnet-4':     'Claude Sonnet 4',
      'claude-haiku-4.5':    'Claude Haiku 4.5',
      'claude-4.5-haiku':    'Claude Haiku 4.5',
      'claude-opus-4.5':     'Claude Opus 4.5',
      'claude-opus-4.6':     'Claude Opus 4.6',
      'claude-opus-4.6-1m':  'Claude Opus 4.6',
      'claude-opus-4.7':     'Claude Opus 4.7',
      'gemini-3.1-pro':      'Gemini 3.1 Pro',
      'gemini-3.0-flash':    'Gemini 2.5 Pro', // closest priced sibling — flash lacks a row
      'gpt-4.1':             'GPT-4.1',
      'gpt-4o':              'GPT-4o',
      'gpt-5-mini':          'GPT-5 mini',
      'gpt-5.4-mini':        'GPT-5.4 mini',
      'gpt-5.1':             'GPT-5.2',
      'gpt-5.1-codex':       'GPT-5.2-Codex',
      'gpt-5.1-codex-max':   'GPT-5.2-Codex',
      'gpt-5.1-codex-mini':  'GPT-5.4 mini',
      'gpt-5-codex':         'GPT-5.2-Codex',
      'gpt-5.2':             'GPT-5.2',
      'gpt-5.2-codex':       'GPT-5.2-Codex',
      'gpt-5.3-codex':       'GPT-5.3-Codex',
      'gpt-5.4':             'GPT-5.4',
      'gpt-5.5':             'GPT-5.5',
    };
    const byName = new Map((window.MODELS || []).map(m => [m.name, m]));
    for (const [slug, name] of Object.entries(aliases)) {
      const m = byName.get(name);
      if (m) idx.set(slug.toLowerCase(), m);
    }
    return idx;
  }

  function lookupModel(slug) {
    if (!slug) return null;
    return MODEL_INDEX.get(slug.toLowerCase()) || null;
  }

  // ----- Feature → workflow profile defaults ----------------------------
  // Maps the export's `feature` field to a default token profile from data.js
  // WORKFLOWS. User can override per-feature in the assumptions panel.
  const FEATURE_DEFAULT_PROFILE = {
    'chat_inline':            'chat-simple',
    'chat_panel_ask_mode':    'chat-simple',
    'chat_panel_unknown_mode':'chat-simple',
    'chat_panel_edit_mode':   'chat-context',
    'chat_panel_custom_mode': 'chat-context',
    'chat_panel_plan_mode':   'agent-mode',
    'chat_panel_agent_mode':  'agent-mode',
    'agent_edit':             'agent-mode',
    'copilot_cli':            'cli',
    'others':                 'chat-simple',
  };
  const FEATURE_LABELS = {
    'chat_inline':            'Inline chat',
    'chat_panel_ask_mode':    'Chat — Ask',
    'chat_panel_unknown_mode':'Chat — (unspecified)',
    'chat_panel_edit_mode':   'Chat — Edit',
    'chat_panel_custom_mode': 'Chat — Custom mode',
    'chat_panel_plan_mode':   'Chat — Plan mode',
    'chat_panel_agent_mode':  'Chat — Agent mode',
    'agent_edit':             'Agent edit (autonomous)',
    'copilot_cli':            'Copilot CLI',
    'others':                 'Other',
  };

  // ----- State -----------------------------------------------------------
  let DATA = null;        // raw aggregated payload from usage.js
  let PROFILE = {};       // feature -> workflow id
  let CACHE = null;       // last computed reconciliation
  let dailyMode = 'overlay'; // declared here to avoid TDZ — render() runs before the toggle handler block

  // ----- Boot ------------------------------------------------------------
  const raw = sessionStorage.getItem('copilotUsageData');
  if (!raw) {
    $('no-data').hidden = false;
    return;
  }
  try {
    DATA = JSON.parse(raw);
  } catch (e) {
    $('no-data').hidden = false;
    return;
  }

  // initial profile: defaults per feature found in the file
  for (const [feat] of Object.entries(DATA.byFeature || {})) {
    PROFILE[feat] = FEATURE_DEFAULT_PROFILE[feat] || 'chat-simple';
  }

  $('results').hidden = false;
  buildAssumptionsControls();
  recompute();

  // ======================================================================
  //                            COMPUTATION
  // ======================================================================

  // The export gives us interactions split out by `totals_by_model_feature`
  // which is the only join of model × feature we get. That's the right
  // granularity for cost calc: PRU multiplier comes from the model, token
  // size profile comes from the feature.
  function recompute() {
    const wfById = new Map((window.WORKFLOWS || []).map(w => [w.id, w]));
    const result = {
      totalInteractions: 0,
      totalPru: 0,
      totalPruCost: 0,
      totalTokenCost: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      cliInputTokens: DATA.cli ? DATA.cli.prompt : 0,
      cliOutputTokens: DATA.cli ? DATA.cli.output : 0,
      byModel: new Map(),     // model name -> rollup
      byFeature: new Map(),   // feature -> rollup
      byProvider: new Map(),  // provider -> rollup
      byDay: new Map(),       // day -> {pru, token}
      unknownModels: new Map(),
    };

    const cells = DATA.modelFeatureCells || [];
    for (const c of cells) {
      const interactions = c.interactions || 0;
      if (!interactions) continue;
      const model = lookupModel(c.model);
      const feature = c.feature || 'others';
      const wfId = PROFILE[feature] || FEATURE_DEFAULT_PROFILE[feature] || 'chat-simple';
      const wf = wfById.get(wfId) || wfById.get('chat-simple');

      // PRU side: only premium models accrue PRU charges. Mult 0 = included tier.
      const mult = model ? model.mult : 0;
      const pru = mult * interactions;
      const pruCost = pru * PRU_RATE;

      // Token side: use measured CLI tokens if feature == copilot_cli, else estimate.
      let inTok, outTok;
      if (feature === 'copilot_cli' && DATA.cli && DATA.cli.requests) {
        // Distribute CLI tokens proportionally across CLI cells by interactions.
        const cliShare = interactions / Math.max(1, DATA.cliInteractionsTotal || 1);
        inTok = Math.round(DATA.cli.prompt * cliShare);
        outTok = Math.round(DATA.cli.output * cliShare);
      } else {
        inTok = wf.inTok * interactions;
        outTok = wf.outTok * interactions;
      }

      // $ at provider list price (per 1M tokens)
      const tokenCost = model
        ? (inTok * model.in + outTok * model.out) / 1_000_000
        : 0; // can't price models we don't know

      result.totalInteractions += interactions;
      result.totalPru += pru;
      result.totalPruCost += pruCost;
      result.totalTokenCost += tokenCost;
      result.totalInputTokens += inTok;
      result.totalOutputTokens += outTok;

      // by model
      const mKey = model ? model.name : ('Unknown · ' + c.model);
      let mRow = result.byModel.get(mKey);
      if (!mRow) {
        mRow = {
          name: mKey, slug: c.model, model,
          interactions: 0, pru: 0, pruCost: 0,
          inTok: 0, outTok: 0, tokenCost: 0,
        };
        result.byModel.set(mKey, mRow);
      }
      mRow.interactions += interactions;
      mRow.pru += pru;
      mRow.pruCost += pruCost;
      mRow.inTok += inTok;
      mRow.outTok += outTok;
      mRow.tokenCost += tokenCost;
      if (!model) {
        result.unknownModels.set(c.model, (result.unknownModels.get(c.model) || 0) + interactions);
      }

      // by feature
      let fRow = result.byFeature.get(feature);
      if (!fRow) {
        fRow = {
          feature, label: FEATURE_LABELS[feature] || feature,
          wfId, wfLabel: wf.name,
          interactions: 0, pru: 0, pruCost: 0,
          inTok: 0, outTok: 0, tokenCost: 0,
        };
        result.byFeature.set(feature, fRow);
      }
      fRow.interactions += interactions;
      fRow.pru += pru;
      fRow.pruCost += pruCost;
      fRow.inTok += inTok;
      fRow.outTok += outTok;
      fRow.tokenCost += tokenCost;

      // by provider
      if (model) {
        let pRow = result.byProvider.get(model.provider);
        if (!pRow) {
          pRow = { provider: model.provider, models: new Set(), interactions: 0, inTok: 0, outTok: 0, inCost: 0, outCost: 0, pruCost: 0 };
          result.byProvider.set(model.provider, pRow);
        }
        pRow.models.add(model.name);
        pRow.interactions += interactions;
        pRow.inTok += inTok;
        pRow.outTok += outTok;
        pRow.inCost += (inTok * model.in) / 1_000_000;
        pRow.outCost += (outTok * model.out) / 1_000_000;
        pRow.pruCost += pruCost;
      }
    }

    // by day: distribute model-feature totals proportionally across the day
    // counts already aggregated by usage.js. We don't have per-day×model×feature
    // joins, so we use the day-level interaction share as the apportioning weight.
    const dailyInteractions = DATA.byDay || {};
    const totalDailyInt = Object.values(dailyInteractions).reduce((s, d) => s + (d.interactions || 0), 0);
    if (totalDailyInt > 0) {
      for (const [day, v] of Object.entries(dailyInteractions)) {
        const share = (v.interactions || 0) / totalDailyInt;
        result.byDay.set(day, {
          day,
          pruCost: result.totalPruCost * share,
          tokenCost: result.totalTokenCost * share,
          interactions: v.interactions || 0,
        });
      }
    }

    CACHE = result;
    render();
  }

  // ======================================================================
  //                              RENDER
  // ======================================================================

  function render() {
    renderSummary();
    renderProfilePills();
    renderModelsChart();
    renderModelsTable();
    renderFeaturesChart();
    renderDailyChart();
    renderProviderChart();
    renderProviderTable();
    renderReco();
  }

  // ----- Summary KPIs ----------------------------------------------------
  function renderSummary() {
    const r = CACHE;
    const delta = r.totalPruCost - r.totalTokenCost;

    $('kpi-int').textContent = fmtInt(r.totalInteractions);
    $('kpi-pru').textContent = fmtInt(Math.round(r.totalPru));
    $('kpi-pru-sub').textContent = `${fmtInt(Math.round(r.totalPru))} premium requests · @ $${PRU_RATE.toFixed(2)} each`;
    $('kpi-pru-cost').textContent = fmtMoney(r.totalPruCost);
    $('kpi-tok-cost').textContent = fmtMoney(r.totalTokenCost);
    $('kpi-delta').textContent = (delta >= 0 ? '+' : '') + fmtMoney(delta);
    $('kpi-direct').textContent = fmtMoney(r.totalTokenCost);

    const card = $('kpi-delta-card');
    card.classList.remove('win', 'loss', 'up', 'down');
    if (Math.abs(delta) < 0.01) {
      card.classList.add('up');
    } else if (delta > 0) {
      card.classList.add('loss');
    } else {
      card.classList.add('win');
    }
    $('kpi-delta-sub').textContent = delta > 0
      ? `PRU billing is more expensive than direct tokens for these interactions.`
      : `PRU billing is cheaper — Copilot is subsidising you by ${fmtMoney(-delta)}.`;
    $('kpi-direct-sub').textContent = `${fmtInt(Math.round(r.totalInputTokens / 1e6))}M input + ${fmtInt(Math.round(r.totalOutputTokens / 1e6))}M output tokens at list price`;

    // Callout
    const c = $('summary-callout');
    c.classList.remove('warn', 'success', 'danger');
    let title, body;
    if (r.totalPruCost === 0 && r.totalTokenCost === 0) {
      title = 'No priced interactions found';
      body = ' None of the models in this export match a known PRU multiplier or token rate. Check the model breakdown below for the unrecognised slugs.';
      c.classList.add('warn');
    } else if (delta > 0) {
      const ratio = r.totalTokenCost > 0 ? r.totalPruCost / r.totalTokenCost : Infinity;
      title = `You paid ${ratio.toFixed(1)}× more in PRU than tokens would have cost`;
      body = ` Across this period PRU billed ${fmtMoney(r.totalPruCost)} for interactions whose provider list-price token cost is ${fmtMoney(r.totalTokenCost)}. Net overcharge vs tokens: ${fmtMoney(delta)}. This usually means chat-heavy use of premium-tier models (Opus/GPT-5.5) where the multiplier outruns the actual short-chat token cost.`;
      c.classList.add('warn');
    } else {
      const ratio = r.totalPruCost > 0 ? r.totalTokenCost / r.totalPruCost : Infinity;
      title = `Copilot is subsidising you by ${ratio.toFixed(1)}× — agent workflows beat PRU pricing`;
      body = ` PRU billed ${fmtMoney(r.totalPruCost)}, but the same agent-mode / CLI / coding-agent interactions would cost ${fmtMoney(r.totalTokenCost)} at provider list price. Net subsidy: ${fmtMoney(-delta)}. This is the "tool calls don't count" effect from the analysis — every autonomous turn re-sends growing context but only the user-initiated prompt charges PRU.`;
      c.classList.add('success');
    }
    if (r.unknownModels && r.unknownModels.size) {
      const list = [...r.unknownModels.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([k, v]) => `<code>${k}</code> (${fmtInt(v)})`).join(', ');
      body += ` ${r.unknownModels.size} model slug(s) not in the pricing table were skipped from the cost math: ${list}.`;
    }
    $('summary-callout-title').textContent = title;
    $('summary-callout-body').innerHTML = body;
  }

  // ----- Profile assumption controls ------------------------------------
  function buildAssumptionsControls() {
    const grid = $('profile-grid');
    // remove anything past the headers (3 cells)
    while (grid.children.length > 3) grid.removeChild(grid.lastChild);

    const features = Object.entries(DATA.byFeature || {})
      .map(([feature, v]) => ({ feature, interactions: v.interactions || 0 }))
      .filter(d => d.interactions > 0)
      .sort((a, b) => b.interactions - a.interactions);

    if (!features.length) {
      const empty = document.createElement('div');
      empty.style.gridColumn = '1 / -1';
      empty.className = 'meta';
      empty.textContent = 'No feature breakdown found in this file.';
      grid.appendChild(empty);
      return;
    }

    for (const f of features) {
      const lbl = document.createElement('div');
      lbl.innerHTML = `<div class="feat">${f.feature}</div><div class="meta">${FEATURE_LABELS[f.feature] || ''}</div>`;
      grid.appendChild(lbl);

      const sel = document.createElement('select');
      sel.dataset.feature = f.feature;
      for (const wf of (window.WORKFLOWS || [])) {
        const opt = document.createElement('option');
        opt.value = wf.id;
        opt.textContent = `${wf.icon} ${wf.name} · ${(wf.inTok / 1000).toFixed(0)}K / ${(wf.outTok / 1000).toFixed(0)}K`;
        if (PROFILE[f.feature] === wf.id) opt.selected = true;
        sel.appendChild(opt);
      }
      sel.addEventListener('change', () => {
        PROFILE[f.feature] = sel.value;
        recompute();
      });
      const wrap = document.createElement('div');
      wrap.appendChild(sel);
      grid.appendChild(wrap);

      const meta = document.createElement('div');
      meta.className = 'meta num';
      meta.textContent = fmtInt(f.interactions);
      grid.appendChild(meta);
    }
  }

  function renderProfilePills() {
    $('pill-in').textContent = fmtCompact(CACHE.totalInputTokens);
    $('pill-out').textContent = fmtCompact(CACHE.totalOutputTokens);
    const cliTok = CACHE.cliInputTokens + CACHE.cliOutputTokens;
    $('pill-cli').textContent = cliTok ? fmtCompact(cliTok) : '0 (no CLI activity)';
  }

  // ----- Models grouped bar chart ---------------------------------------
  function renderModelsChart() {
    const items = [...CACHE.byModel.values()]
      .filter(d => d.model && (d.pruCost + d.tokenCost) > 0)
      .sort((a, b) => b.interactions - a.interactions)
      .slice(0, 12);

    const container = d3.select('#chart-models').html('');
    if (!items.length) { container.append('div').attr('class', 'source-line').text('No priced models in this export.'); return; }

    const W = 1100, rowH = 40;
    const margin = { top: 8, right: 90, bottom: 8, left: 220 };
    const h = items.length * rowH;
    const H = h + margin.top + margin.bottom;
    const w = W - margin.left - margin.right;

    const svg = container.append('svg').attr('viewBox', `0 0 ${W} ${H}`);
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear()
      .domain([0, d3.max(items, d => Math.max(d.pruCost, d.tokenCost)) || 1])
      .range([0, w]);
    const y = d3.scaleBand().domain(items.map(d => d.name)).range([0, h]).padding(0.18);

    g.append('g').attr('class', 'axis')
      .call(d3.axisLeft(y).tickSize(0).tickPadding(8))
      .call(sel => sel.select('.domain').remove());
    g.append('g').attr('class', 'axis').attr('transform', `translate(0,${h})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d => '$' + fmtCompact(d)));

    const rows = g.selectAll('g.row').data(items).join('g')
      .attr('class', 'row')
      .attr('transform', d => `translate(0,${y(d.name)})`);

    const subBand = y.bandwidth() / 2 - 2;

    rows.append('rect')
      .attr('y', 0).attr('height', subBand)
      .attr('width', d => x(d.pruCost)).attr('rx', 3)
      .attr('fill', 'var(--accent-emphasis)');
    rows.append('rect')
      .attr('y', subBand + 4).attr('height', subBand)
      .attr('width', d => x(d.tokenCost)).attr('rx', 3)
      .attr('fill', 'var(--p-anthropic)');

    rows.append('text')
      .attr('x', d => x(Math.max(d.pruCost, d.tokenCost)) + 6)
      .attr('y', y.bandwidth() / 2 + 4)
      .attr('font-size', 12).attr('fill', 'var(--fg-default)')
      .text(d => {
        const delta = d.pruCost - d.tokenCost;
        return `${fmtMoneyShort(d.pruCost)} vs ${fmtMoneyShort(d.tokenCost)} (Δ ${(delta >= 0 ? '+' : '') + fmtMoneyShort(delta)})`;
      });

    rows.on('mousemove', (e, d) => {
      const ratio = d.tokenCost > 0 ? d.pruCost / d.tokenCost : null;
      tooltip.style('opacity', 1).html(`
        <strong>${d.name}</strong>
        <div class="row"><span class="k">Provider</span><span class="v">${d.model.provider}</span></div>
        <div class="row"><span class="k">Multiplier</span><span class="v">${d.model.mult}×</span></div>
        <div class="row"><span class="k">Interactions</span><span class="v">${fmtInt(d.interactions)}</span></div>
        <div class="row"><span class="k">PRU charged</span><span class="v">${fmtInt(Math.round(d.pru))}</span></div>
        <div class="row"><span class="k">PRU $</span><span class="v">${fmtMoney(d.pruCost)}</span></div>
        <div class="row"><span class="k">Est. tokens</span><span class="v">${fmtCompact(d.inTok)} in / ${fmtCompact(d.outTok)} out</span></div>
        <div class="row"><span class="k">Token $</span><span class="v">${fmtMoney(d.tokenCost)}</span></div>
        ${ratio !== null ? `<div class="row"><span class="k">PRU ÷ Token</span><span class="v">${ratio.toFixed(2)}×</span></div>` : ''}
      `).style('left', (e.pageX + 12) + 'px').style('top', (e.pageY + 12) + 'px');
    }).on('mouseleave', () => tooltip.style('opacity', 0));
  }

  // ----- Model table ----------------------------------------------------
  function renderModelsTable() {
    const items = [...CACHE.byModel.values()]
      .sort((a, b) => b.interactions - a.interactions);
    const tbody = d3.select('#model-table tbody').html('');
    if (!items.length) {
      tbody.append('tr').append('td').attr('colspan', 10).text('No model data.');
      return;
    }
    for (const d of items) {
      const m = d.model;
      const delta = d.pruCost - d.tokenCost;
      const tr = tbody.append('tr');
      tr.append('td').html(m
        ? `${d.name}<div class="muted">slug: <code>${d.slug}</code></div>`
        : `<span class="badge warn">unknown</span> ${d.name}<div class="muted">no pricing data</div>`);
      tr.append('td').text(m ? m.provider : '—');
      tr.append('td').attr('class', 'num').text(m ? `${m.mult}×` : '—');
      tr.append('td').html(m ? `<span class="badge">${m.tier}</span>` : '—');
      tr.append('td').attr('class', 'num').text(fmtInt(d.interactions));
      tr.append('td').attr('class', 'num').text(fmtInt(Math.round(d.pru)));
      tr.append('td').attr('class', 'num').text(fmtMoney(d.pruCost));
      tr.append('td').attr('class', 'num').text(((d.inTok + d.outTok) / 1e6).toFixed(2));
      tr.append('td').attr('class', 'num').text(m ? fmtMoney(d.tokenCost) : '—');
      tr.append('td').attr('class', 'num ' + (m ? (delta > 0 ? 'neg' : 'pos') : '')).text(m ? ((delta >= 0 ? '+' : '') + fmtMoney(delta)) : '—');
    }
  }

  // ----- Features chart -------------------------------------------------
  function renderFeaturesChart() {
    const items = [...CACHE.byFeature.values()]
      .filter(d => d.interactions > 0)
      .sort((a, b) => b.interactions - a.interactions);
    const container = d3.select('#chart-features').html('');
    if (!items.length) { container.append('div').attr('class', 'source-line').text('No feature data.'); return; }

    const W = 1100, rowH = 44;
    const margin = { top: 8, right: 90, bottom: 8, left: 230 };
    const h = items.length * rowH;
    const H = h + margin.top + margin.bottom;
    const w = W - margin.left - margin.right;

    const svg = container.append('svg').attr('viewBox', `0 0 ${W} ${H}`);
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    const x = d3.scaleLinear().domain([0, d3.max(items, d => Math.max(d.pruCost, d.tokenCost)) || 1]).range([0, w]);
    const y = d3.scaleBand().domain(items.map(d => d.label)).range([0, h]).padding(0.18);

    g.append('g').attr('class', 'axis').call(d3.axisLeft(y).tickSize(0).tickPadding(8)).call(sel => sel.select('.domain').remove());
    g.append('g').attr('class', 'axis').attr('transform', `translate(0,${h})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d => '$' + fmtCompact(d)));

    const rows = g.selectAll('g.row').data(items).join('g')
      .attr('class', 'row').attr('transform', d => `translate(0,${y(d.label)})`);
    const subBand = y.bandwidth() / 2 - 2;

    rows.append('rect').attr('y', 0).attr('height', subBand)
      .attr('width', d => x(d.pruCost)).attr('rx', 3).attr('fill', 'var(--accent-emphasis)');
    rows.append('rect').attr('y', subBand + 4).attr('height', subBand)
      .attr('width', d => x(d.tokenCost)).attr('rx', 3).attr('fill', 'var(--p-anthropic)');

    rows.append('text')
      .attr('x', d => x(Math.max(d.pruCost, d.tokenCost)) + 6)
      .attr('y', y.bandwidth() / 2 + 4)
      .attr('font-size', 12).attr('fill', 'var(--fg-default)')
      .text(d => {
        const delta = d.pruCost - d.tokenCost;
        return `${fmtMoneyShort(d.pruCost)} vs ${fmtMoneyShort(d.tokenCost)} (Δ ${(delta >= 0 ? '+' : '') + fmtMoneyShort(delta)})`;
      });

    rows.on('mousemove', (e, d) => {
      const ratio = d.tokenCost > 0 ? d.pruCost / d.tokenCost : null;
      tooltip.style('opacity', 1).html(`
        <strong>${d.label}</strong>
        <div class="row"><span class="k">Profile</span><span class="v">${d.wfLabel}</span></div>
        <div class="row"><span class="k">Interactions</span><span class="v">${fmtInt(d.interactions)}</span></div>
        <div class="row"><span class="k">PRU charged</span><span class="v">${fmtInt(Math.round(d.pru))}</span></div>
        <div class="row"><span class="k">PRU $</span><span class="v">${fmtMoney(d.pruCost)}</span></div>
        <div class="row"><span class="k">Token $</span><span class="v">${fmtMoney(d.tokenCost)}</span></div>
        ${ratio !== null ? `<div class="row"><span class="k">PRU ÷ Token</span><span class="v">${ratio.toFixed(2)}×</span></div>` : ''}
      `).style('left', (e.pageX + 12) + 'px').style('top', (e.pageY + 12) + 'px');
    }).on('mouseleave', () => tooltip.style('opacity', 0));
  }

  // ----- Daily comparison chart -----------------------------------------
  function renderDailyChart() {
    const data = [...CACHE.byDay.values()]
      .map(d => ({ ...d, date: new Date(d.day) }))
      .filter(d => !isNaN(d.date))
      .sort((a, b) => a.date - b.date);
    const container = d3.select('#chart-daily').html('');
    if (!data.length) { container.append('div').attr('class', 'source-line').text('No daily data.'); return; }

    if (dailyMode === 'cumulative') {
      let pru = 0, tok = 0;
      data.forEach(d => { pru += d.pruCost; tok += d.tokenCost; d.cumPru = pru; d.cumTok = tok; });
    }

    const W = 1100, H = 360;
    const margin = { top: 16, right: 24, bottom: 32, left: 64 };
    const w = W - margin.left - margin.right;
    const h = H - margin.top - margin.bottom;
    const svg = container.append('svg').attr('viewBox', `0 0 ${W} ${H}`);
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleTime().domain(d3.extent(data, d => d.date)).range([0, w]);
    const yMax = dailyMode === 'cumulative'
      ? d3.max(data, d => Math.max(d.cumPru, d.cumTok)) || 1
      : d3.max(data, d => Math.max(d.pruCost, d.tokenCost)) || 1;
    const y = d3.scaleLinear().domain([0, yMax]).nice().range([h, 0]);

    g.append('g').attr('class', 'grid').call(d3.axisLeft(y).ticks(5).tickSize(-w).tickFormat(''));
    g.append('g').attr('class', 'axis').attr('transform', `translate(0,${h})`)
      .call(d3.axisBottom(x).ticks(Math.min(8, data.length)).tickFormat(d3.timeFormat('%b %d')));
    g.append('g').attr('class', 'axis')
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => '$' + fmtCompact(d)));

    const series = dailyMode === 'cumulative'
      ? [
          { key: 'cumPru', color: 'var(--accent-emphasis)' },
          { key: 'cumTok', color: 'var(--p-anthropic)' },
        ]
      : [
          { key: 'pruCost', color: 'var(--accent-emphasis)' },
          { key: 'tokenCost', color: 'var(--p-anthropic)' },
        ];

    series.forEach(s => {
      const area = d3.area().x(d => x(d.date)).y0(h).y1(d => y(d[s.key])).curve(d3.curveMonotoneX);
      const line = d3.line().x(d => x(d.date)).y(d => y(d[s.key])).curve(d3.curveMonotoneX);
      g.append('path').datum(data).attr('fill', s.color).attr('opacity', 0.18).attr('d', area);
      g.append('path').datum(data).attr('fill', 'none').attr('stroke', s.color).attr('stroke-width', 2).attr('d', line);
    });

    const bisect = d3.bisector(d => d.date).left;
    const focus = g.append('g').style('display', 'none');
    focus.append('line').attr('y1', 0).attr('y2', h).attr('stroke', 'var(--fg-subtle)').attr('stroke-dasharray', '2 2');
    series.forEach(s => {
      focus.append('circle').attr('r', 4).attr('fill', s.color)
        .attr('stroke', 'var(--canvas-default)').attr('stroke-width', 2)
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
        focus.selectAll('circle').attr('cy', function () { return y(d[this.getAttribute('data-key')]); });
        const pruVal = dailyMode === 'cumulative' ? d.cumPru : d.pruCost;
        const tokVal = dailyMode === 'cumulative' ? d.cumTok : d.tokenCost;
        const delta = pruVal - tokVal;
        tooltip.html(`
          <strong>${d.day}</strong>
          <div class="row"><span class="k">${dailyMode === 'cumulative' ? 'Cumulative PRU $' : 'PRU $'}</span><span class="v">${fmtMoney(pruVal)}</span></div>
          <div class="row"><span class="k">${dailyMode === 'cumulative' ? 'Cumulative Token $' : 'Token $'}</span><span class="v">${fmtMoney(tokVal)}</span></div>
          <div class="row"><span class="k">Delta</span><span class="v">${(delta >= 0 ? '+' : '') + fmtMoney(delta)}</span></div>
          <div class="row"><span class="k">Interactions</span><span class="v">${fmtInt(d.interactions)}</span></div>
        `).style('left', (e.pageX + 12) + 'px').style('top', (e.pageY + 12) + 'px');
      });
  }
  d3.selectAll('#daily-toggle button').on('click', function () {
    d3.selectAll('#daily-toggle button').classed('active', false);
    d3.select(this).classed('active', true);
    dailyMode = this.dataset.mode;
    renderDailyChart();
  });

  // ----- Provider donut -------------------------------------------------
  function renderProviderChart() {
    const items = [...CACHE.byProvider.values()]
      .map(d => ({ ...d, total: d.inCost + d.outCost }))
      .filter(d => d.total > 0)
      .sort((a, b) => b.total - a.total);
    const container = d3.select('#chart-provider').html('');
    if (!items.length) { container.append('div').attr('class', 'source-line').text('No priced provider data.'); return; }

    const W = 1100, H = 320;
    const svg = container.append('svg').attr('viewBox', `0 0 ${W} ${H}`);

    const r = 130;
    const cx = 200, cy = H / 2;
    const colors = {
      'Anthropic': 'var(--p-anthropic)',
      'OpenAI':    'var(--p-openai)',
      'Google':    'var(--p-google)',
    };
    const pie = d3.pie().value(d => d.total).sort(null);
    const arc = d3.arc().innerRadius(r * 0.55).outerRadius(r);
    const arcs = pie(items);

    const g = svg.append('g').attr('transform', `translate(${cx},${cy})`);
    g.selectAll('path').data(arcs).join('path')
      .attr('d', arc)
      .attr('fill', d => colors[d.data.provider] || 'var(--accent-emphasis)')
      .attr('stroke', 'var(--canvas-default)').attr('stroke-width', 2)
      .on('mousemove', (e, d) => {
        tooltip.style('opacity', 1).html(`
          <strong>${d.data.provider}</strong>
          <div class="row"><span class="k">Total direct $</span><span class="v">${fmtMoney(d.data.total)}</span></div>
          <div class="row"><span class="k">Input $</span><span class="v">${fmtMoney(d.data.inCost)}</span></div>
          <div class="row"><span class="k">Output $</span><span class="v">${fmtMoney(d.data.outCost)}</span></div>
          <div class="row"><span class="k">Interactions</span><span class="v">${fmtInt(d.data.interactions)}</span></div>
        `).style('left', (e.pageX + 12) + 'px').style('top', (e.pageY + 12) + 'px');
      })
      .on('mouseleave', () => tooltip.style('opacity', 0));

    // centre total
    const total = d3.sum(items, d => d.total);
    g.append('text').attr('text-anchor', 'middle').attr('y', -4)
      .attr('font-size', 13).attr('fill', 'var(--fg-muted)').text('Direct API total');
    g.append('text').attr('text-anchor', 'middle').attr('y', 18)
      .attr('font-size', 22).attr('font-weight', 600).attr('fill', 'var(--fg-default)')
      .text(fmtMoney(total));

    // legend / breakdown right of donut
    const lg = svg.append('g').attr('transform', `translate(${cx + r + 80},${cy - items.length * 24 / 2})`);
    items.forEach((d, i) => {
      const row = lg.append('g').attr('transform', `translate(0,${i * 24})`);
      row.append('rect').attr('width', 12).attr('height', 12).attr('rx', 2)
        .attr('fill', colors[d.provider] || 'var(--accent-emphasis)');
      row.append('text').attr('x', 18).attr('y', 10).attr('font-size', 13).attr('fill', 'var(--fg-default)')
        .text(`${d.provider} · ${fmtMoney(d.total)} · ${(d.total / total * 100).toFixed(0)}%`);
    });

    // PRU paid bar comparison below donut
    const pruTotal = d3.sum(items, d => d.pruCost);
    const cmp = svg.append('g').attr('transform', `translate(${cx + r + 80},${cy + items.length * 12 + 24})`);
    const cmpW = 380;
    const max = Math.max(total, pruTotal) || 1;
    cmp.append('text').attr('font-size', 11).attr('fill', 'var(--fg-muted)').attr('y', -6).text('Compared to what you actually paid Copilot:');
    cmp.append('rect').attr('width', cmpW * (pruTotal / max)).attr('height', 16).attr('y', 4).attr('rx', 3).attr('fill', 'var(--accent-emphasis)');
    cmp.append('text').attr('x', cmpW * (pruTotal / max) + 6).attr('y', 16).attr('font-size', 12).attr('fill', 'var(--fg-default)').text(`PRU paid · ${fmtMoney(pruTotal)}`);
    cmp.append('rect').attr('width', cmpW * (total / max)).attr('height', 16).attr('y', 28).attr('rx', 3).attr('fill', 'var(--p-anthropic)');
    cmp.append('text').attr('x', cmpW * (total / max) + 6).attr('y', 40).attr('font-size', 12).attr('fill', 'var(--fg-default)').text(`Direct provider · ${fmtMoney(total)}`);
  }

  function renderProviderTable() {
    const items = [...CACHE.byProvider.values()]
      .map(d => ({ ...d, total: d.inCost + d.outCost }))
      .sort((a, b) => b.total - a.total);
    const tbody = d3.select('#provider-table tbody').html('');
    if (!items.length) {
      tbody.append('tr').append('td').attr('colspan', 9).text('No priced provider data.');
      return;
    }
    for (const d of items) {
      const ratio = d.pruCost > 0 ? d.total / d.pruCost : null;
      const tr = tbody.append('tr');
      tr.append('td').text(d.provider);
      tr.append('td').html([...d.models].map(m => `<span class="badge">${m}</span>`).join(' '));
      tr.append('td').attr('class', 'num').text(fmtInt(d.interactions));
      tr.append('td').attr('class', 'num').text(fmtCompact(d.inTok));
      tr.append('td').attr('class', 'num').text(fmtCompact(d.outTok));
      tr.append('td').attr('class', 'num').text(fmtMoney(d.inCost));
      tr.append('td').attr('class', 'num').text(fmtMoney(d.outCost));
      tr.append('td').attr('class', 'num').text(fmtMoney(d.total));
      tr.append('td').attr('class', 'num ' + (ratio !== null ? (ratio > 1 ? 'neg' : 'pos') : ''))
        .text(ratio !== null ? `${ratio.toFixed(2)}× PRU` : '—');
    }
  }

  // ----- Recommendations -------------------------------------------------
  function renderReco() {
    const r = CACHE;
    const list = $('reco-list');
    list.innerHTML = '';

    const items = [];
    const delta = r.totalPruCost - r.totalTokenCost;

    // Pattern 1: heavy chat on premium
    const heavyChatPremium = [...r.byModel.values()]
      .filter(m => m.model && m.model.mult >= 1.25 && m.pruCost > 0 && (m.pruCost - m.tokenCost) > 5)
      .sort((a, b) => (b.pruCost - b.tokenCost) - (a.pruCost - a.tokenCost))
      .slice(0, 3);
    if (heavyChatPremium.length) {
      items.push({
        kind: 'warn',
        title: 'Premium-tier models in chat-mode are overpaying vs tokens',
        body: `<strong>${heavyChatPremium.map(m => m.name).join(', ')}</strong> account for ${fmtMoney(heavyChatPremium.reduce((s, m) => s + (m.pruCost - m.tokenCost), 0))} of "PRU charged more than tokens would". Under a token-billed Copilot, casual chat with these models would actually get cheaper. Consider routing simple Q&A to a Standard-tier or Included model — the SWE-bench gap on routine tasks is small.`,
      });
    }

    // Pattern 2: agent-mode subsidy
    const agentFeatures = [...r.byFeature.values()]
      .filter(f => ['agent_edit', 'chat_panel_agent_mode', 'chat_panel_plan_mode', 'copilot_cli'].includes(f.feature))
      .sort((a, b) => (b.tokenCost - b.pruCost) - (a.tokenCost - a.pruCost));
    const agentSubsidy = agentFeatures.reduce((s, f) => s + Math.max(0, f.tokenCost - f.pruCost), 0);
    if (agentSubsidy > 1) {
      items.push({
        kind: 'success',
        title: `Agent / CLI workflows are subsidised by ${fmtMoney(agentSubsidy)}`,
        body: `Copilot's "tool calls don't count" rule means autonomous turns re-send growing context but only the original user prompt charges PRU. Your top subsidised feature is <strong>${agentFeatures[0].label}</strong> — token cost ${fmtMoney(agentFeatures[0].tokenCost)} vs PRU charged ${fmtMoney(agentFeatures[0].pruCost)}. If Copilot ever switched to per-token billing, this is exactly the workflow that would get most expensive.`,
      });
    }

    // Pattern 3: included-tier usage
    const includedInteractions = [...r.byModel.values()]
      .filter(m => m.model && m.model.mult === 0)
      .reduce((s, m) => s + m.interactions, 0);
    if (includedInteractions > 0) {
      const includedTokenCost = [...r.byModel.values()]
        .filter(m => m.model && m.model.mult === 0)
        .reduce((s, m) => s + m.tokenCost, 0);
      items.push({
        kind: 'info',
        title: `${fmtInt(includedInteractions)} interactions on Included-tier models`,
        body: `These cost you $0 in PRU but ~${fmtMoney(includedTokenCost)} at provider list price. That's the seat-fee subsidy in action. Under a hypothetical token-billed Copilot, the Included tier disappears — every prompt would carry a marginal cost.`,
      });
    }

    // Pattern 4: overall summary
    if (delta > 0) {
      items.push({
        kind: 'info',
        title: 'Bottom line: tokens would (probably) save you money',
        body: `Across this report window your usage skews towards short interactions on premium-tier models. A token-billed Copilot would cost you roughly <strong>${fmtMoney(r.totalTokenCost)}</strong> for these same actions vs <strong>${fmtMoney(r.totalPruCost)}</strong> in PRU — a ${fmtMoney(delta)} reduction. But this depends entirely on the per-feature token profiles you picked above. Try increasing chat sizes (most enterprise users are closer to the @workspace 25K profile than the bare 4K profile) and watch the gap close.`,
      });
    } else if (delta < 0) {
      items.push({
        kind: 'info',
        title: 'Bottom line: PRU is the better deal for this usage pattern',
        body: `You're an agent-heavy user — most interactions are autonomous tool runs that bill 1 PRU but burn 50–200× the tokens of a plain chat. A token-billed Copilot would cost roughly <strong>${fmtMoney(r.totalTokenCost)}</strong> vs your current <strong>${fmtMoney(r.totalPruCost)}</strong>. The PRU multiplier system is hiding ${fmtMoney(-delta)} of provider cost from you each report period.`,
      });
    }

    for (const it of items) {
      const el = document.createElement('div');
      el.className = 'callout' + (it.kind === 'warn' ? ' warn' : it.kind === 'success' ? ' success' : '');
      el.innerHTML = `<strong>${it.title}</strong>${it.body}`;
      list.appendChild(el);
    }
  }
})();
