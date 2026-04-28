/* optimization.js — UBB Optimisation Insights page.
   Reads aggregated usage from sessionStorage (uploaded via usage.html) when available,
   otherwise falls back to window.DEMO_USAGE bundled in demo-data.js.
   All scenario math runs locally. */

(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const tooltip = d3.select('#tooltip');
  const fmtInt = d3.format(',');
  const fmtMoney = (v) => (v < 0 ? '-' : '') + '$' + Math.abs(v).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const fmtMoney2 = (v) => (v < 0 ? '-' : '') + '$' + Math.abs(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtMoneyShort = (v) => {
    const a = Math.abs(v); const sign = v < 0 ? '-' : '';
    if (a >= 1e6) return sign + '$' + (a/1e6).toFixed(2) + 'M';
    if (a >= 1e3) return sign + '$' + (a/1e3).toFixed(1) + 'k';
    return sign + '$' + a.toFixed(0);
  };
  const fmtCompact = d3.format('.2~s');
  const PRU_RATE = 0.04;
  const CREDIT_RATE = 0.01;

  // --------------- model lookup (mirrors cost-analysis.js) ---------------
  const MODEL_INDEX = (function () {
    const idx = new Map();
    const add = (slug, m) => { if (slug) idx.set(slug.toLowerCase(), m); };
    for (const m of (window.MODELS || [])) {
      add(m.name, m); add(m.name.replace(/\s+/g, '-'), m); add(m.name.replace(/\s+/g, '').toLowerCase(), m);
    }
    const aliases = {
      'claude-4.6-sonnet':'Claude Sonnet 4.6','claude-sonnet-4.6':'Claude Sonnet 4.6',
      'claude-4.5-sonnet':'Claude Sonnet 4.5','claude-sonnet-4.5':'Claude Sonnet 4.5',
      'claude-4.0-sonnet':'Claude Sonnet 4','claude-sonnet-4':'Claude Sonnet 4',
      'claude-haiku-4.5':'Claude Haiku 4.5','claude-4.5-haiku':'Claude Haiku 4.5',
      'claude-opus-4.5':'Claude Opus 4.5','claude-opus-4.6':'Claude Opus 4.6',
      'claude-opus-4.6-1m':'Claude Opus 4.6','claude-opus-4.7':'Claude Opus 4.7',
      'gemini-3.1-pro':'Gemini 3.1 Pro','gemini-3.0-flash':'Gemini 2.5 Pro','gemini-2.5-pro':'Gemini 2.5 Pro',
      'gpt-4.1':'GPT-4.1','gpt-4o':'GPT-4o','gpt-5-mini':'GPT-5 mini','gpt-5.4-mini':'GPT-5.4 mini',
      'gpt-5.1':'GPT-5.2','gpt-5.1-codex':'GPT-5.2-Codex','gpt-5.1-codex-max':'GPT-5.2-Codex',
      'gpt-5.1-codex-mini':'GPT-5.4 mini','gpt-5-codex':'GPT-5.2-Codex',
      'gpt-5.2':'GPT-5.2','gpt-5.2-codex':'GPT-5.2-Codex','gpt-5.3-codex':'GPT-5.3-Codex',
      'gpt-5.4':'GPT-5.4','gpt-5.5':'GPT-5.5',
    };
    const byName = new Map((window.MODELS || []).map(m => [m.name, m]));
    for (const [slug, name] of Object.entries(aliases)) {
      const m = byName.get(name); if (m) idx.set(slug.toLowerCase(), m);
    }
    return idx;
  })();
  const lookupModel = (slug) => slug ? (MODEL_INDEX.get(slug.toLowerCase()) || null) : null;

  // --------------- workflow + feature mapping ----------------------------
  const FEATURE_DEFAULT_PROFILE = {
    'chat_inline':'chat-simple','chat_panel_ask_mode':'chat-simple','chat_panel_unknown_mode':'chat-simple',
    'chat_panel_edit_mode':'chat-context','chat_panel_custom_mode':'chat-context',
    'chat_panel_plan_mode':'agent-mode','chat_panel_agent_mode':'agent-mode','agent_edit':'agent-mode',
    'copilot_cli':'cli','others':'chat-simple','code_completion':'chat-simple',
  };
  const FEATURE_LABELS = {
    'chat_inline':'Inline chat','chat_panel_ask_mode':'Chat — Ask','chat_panel_unknown_mode':'Chat — (unspec)',
    'chat_panel_edit_mode':'Chat — Edit','chat_panel_custom_mode':'Chat — Custom','chat_panel_plan_mode':'Chat — Plan',
    'chat_panel_agent_mode':'Chat — Agent mode','agent_edit':'Agent edit (auto)','copilot_cli':'Copilot CLI',
    'code_completion':'Code completion','others':'Other',
  };
  const WF_BY_ID = new Map((window.WORKFLOWS || []).map(w => [w.id, w]));

  // --------------- substitution recommendations -------------------------
  // From analysis/model-comparison.md §"Performance-per-dollar leaders" and
  // §"Recommendations by user persona". Each row says: if you currently use X,
  // and the workload is general coding, swap to Y. SWE-bench/$ improvements
  // are computed live from MODELS data.
  const SUBSTITUTIONS = {
    'Claude Opus 4.7':   { to: 'Claude Opus 4.6', reason: 'Same price family, equivalent SWE-bench. Pick the latest priced sibling (Opus 4.6 = same $5/$25) — the 7.5× multiplier era is over so there is no model-tier reason to prefer 4.7 unless you specifically need its long-context tuning.' },
    'GPT-5.5':           { to: 'Claude Opus 4.7', reason: '12.5% cheaper output ($25 vs $30/MTok), same performance band, stronger SWE-bench evidence.' },
    'Claude Sonnet 4.6': { to: 'Gemini 3.1 Pro',  reason: 'Gemini 3.1 Pro at $2/$12 undercuts Sonnet 4.6 ($3/$15) by ~25% on a typical chat with comparable SWE-bench (74.2% vs 71–72%).' },
    'Claude Sonnet 4.5': { to: 'Gemini 3.1 Pro',  reason: 'Same provider-tier downgrade; ~25% cheaper at equal solve-rate.' },
    'Claude Sonnet 4':   { to: 'Gemini 3.1 Pro',  reason: 'Cheaper and stronger on SWE-bench bash-only.' },
    'Claude Opus 4.5':   { to: 'Claude Opus 4.6', reason: 'Same price, slightly newer training. No reason to stay on 4.5.' },
    'GPT-5.4':           { to: 'GPT-5.2-Codex',   reason: 'Codex variant is $1.75/$14 vs $2.50/$15 for general coding — 30% input saving, near-equal SWE-bench.' },
    'GPT-5.2':           { to: 'Gemini 3.1 Pro',  reason: 'Both 1× under PRU; under credits Gemini is meaningfully cheaper for general work.' },
    'Claude Haiku 4.5':  { to: 'Grok Code Fast 1',reason: 'Grok Code Fast 1 at $0.20/$1.50 lands at $0.0038/chat vs Haiku $0.014 — 73% cheaper for similar lightweight tasks. Keep Haiku for instruction-following critical work.' },
    'GPT-5.4 mini':      { to: 'GPT-5 mini',      reason: 'GPT-5 mini at $0.005/chat vs $0.012/chat. ~58% cheaper, lower SWE-bench but adequate for completions/triage.' },
    'GPT-4.1':           { to: 'GPT-5 mini',      reason: 'GPT-5 mini is 80% cheaper and scores higher on SWE-bench bash-only.' },
    'GPT-4o':            { to: 'GPT-5 mini',      reason: 'GPT-5 mini at $0.005/chat vs GPT-4o $0.030/chat — 83% cheaper.' },
    'Gemini 2.5 Pro':    { to: 'Gemini 3.1 Pro',  reason: 'Newer generation, stronger SWE-bench, similar pricing.' },
  };

  // --------------- routing rules per workflow ---------------------------
  // For workflow routing: each workflow has a recommended "router" model that
  // most interactions should land on, with the more expensive model reserved
  // for the synthesis turn only (we model this as 70/30 cheap/expensive).
  const WF_ROUTER = {
    'chat-simple':   { cheap: 'GPT-5 mini',         premium: 'Claude Sonnet 4.6', cheapShare: 0.85 },
    'chat-context':  { cheap: 'Claude Haiku 4.5',   premium: 'Gemini 3.1 Pro',    cheapShare: 0.70 },
    'agent-mode':    { cheap: 'Claude Haiku 4.5',   premium: 'Claude Opus 4.6',   cheapShare: 0.75 },
    'cli':           { cheap: 'Claude Haiku 4.5',   premium: 'Claude Opus 4.6',   cheapShare: 0.80 },
    'cli-subagents': { cheap: 'Claude Haiku 4.5',   premium: 'Claude Opus 4.6',   cheapShare: 0.85 },
    'cloud-small':   { cheap: 'Claude Haiku 4.5',   premium: 'Claude Opus 4.6',   cheapShare: 0.80 },
    'cloud-large':   { cheap: 'Claude Haiku 4.5',   premium: 'Claude Opus 4.6',   cheapShare: 0.85 },
  };

  // ======================================================================
  //  BOOT — pick uploaded data if available, else demo
  // ======================================================================
  let DATA = null; let IS_DEMO = false;
  try {
    const raw = sessionStorage.getItem('copilotUsageData');
    if (raw) DATA = JSON.parse(raw);
  } catch (e) { /* ignore */ }
  if (!DATA) {
    DATA = window.DEMO_USAGE || null;
    IS_DEMO = true;
  } else {
    IS_DEMO = false;
  }
  if (!DATA) {
    // No data at all — render blank state
    $('data-source-label').innerHTML = 'No usage data available. <a href="usage.html">Upload an export →</a>';
    return;
  }
  // Source pill
  const sourceEl = $('data-source');
  const sourceLbl = $('data-source-label');
  if (IS_DEMO) {
    sourceEl.classList.add('fallback');
    const meta = DATA.meta || {};
    sourceLbl.innerHTML = `Demo fleet · ${fmtInt(meta.users || 0)} active users · ${meta.reportStart || '?'} → ${meta.reportEnd || '?'} · <a href="usage.html">Upload your own →</a>`;
  } else {
    sourceEl.classList.remove('fallback');
    const meta = DATA.meta || {};
    sourceLbl.innerHTML = `Your upload · ${fmtInt(meta.users || 0)} users · ${meta.reportStart || '?'} → ${meta.reportEnd || '?'}`;
  }

  // ======================================================================
  //  CORE COMPUTATIONS
  // ======================================================================

  // Total credits at full-rate, no caching, baseline workflow profiles.
  function computeBaseline() {
    const cells = DATA.modelFeatureCells || [];
    let totalCredits = 0;
    let totalInputTok = 0;
    let totalOutputTok = 0;
    const byModel = new Map();
    const byFeature = new Map();
    const byCell = []; // {model, feature, interactions, credits, inTok, outTok}
    for (const c of cells) {
      const interactions = c.interactions || 0;
      if (!interactions) continue;
      const m = lookupModel(c.model);
      if (!m) continue;
      const wfId = FEATURE_DEFAULT_PROFILE[c.feature] || 'chat-simple';
      const wf = WF_BY_ID.get(wfId);
      let inTok, outTok;
      if (c.feature === 'copilot_cli' && DATA.cli && DATA.cli.requests) {
        const cliShare = interactions / Math.max(1, DATA.cliInteractionsTotal || 1);
        inTok = (DATA.cli.prompt || 0) * cliShare;
        outTok = (DATA.cli.output || 0) * cliShare;
      } else if (c.feature === 'code_completion') {
        // completions stay free; treat as zero token cost
        inTok = 0; outTok = 0;
      } else {
        inTok = wf.inTok * interactions;
        outTok = wf.outTok * interactions;
      }
      const dollars = (inTok * m.in + outTok * m.out) / 1e6;
      const credits = dollars / CREDIT_RATE;
      totalCredits += credits; totalInputTok += inTok; totalOutputTok += outTok;
      byCell.push({ model: m, feature: c.feature, wfId, interactions, credits, dollars, inTok, outTok });
      const mk = m.name;
      const mr = byModel.get(mk) || { model: m, interactions: 0, credits: 0, inTok: 0, outTok: 0 };
      mr.interactions += interactions; mr.credits += credits; mr.inTok += inTok; mr.outTok += outTok;
      byModel.set(mk, mr);
      const fk = c.feature;
      const fr = byFeature.get(fk) || { feature: fk, interactions: 0, credits: 0, inTok: 0, outTok: 0 };
      fr.interactions += interactions; fr.credits += credits; fr.inTok += inTok; fr.outTok += outTok;
      byFeature.set(fk, fr);
    }
    return { totalCredits, totalInputTok, totalOutputTok, byModel, byFeature, byCell };
  }

  // Cost in dollars for a given model + workflow + interactions (cache% applied to input).
  function costForCell(model, wf, interactions, cachePct) {
    const inTok = wf.inTok * interactions;
    const outTok = wf.outTok * interactions;
    const cachedShare = Math.max(0, Math.min(1, cachePct));
    const inDollars = (inTok * (model.in * (1 - cachedShare) + (model.cached || model.in * 0.1) * cachedShare)) / 1e6;
    const outDollars = (outTok * model.out) / 1e6;
    return { dollars: inDollars + outDollars, credits: (inDollars + outDollars) / CREDIT_RATE };
  }

  const BASELINE = computeBaseline();

  // Persona segmentation. Uploaded payloads from cost-analysis don't include
  // byUser, so demo data carries it explicitly. If absent, synthesise four
  // bands from total interactions assuming a heavy-tailed Pareto-ish split.
  function buildPersonas() {
    const usersArr = DATA.byUser;
    const days = (DATA.meta && DATA.meta.days) || 28;
    const totalCredits = BASELINE.totalCredits;
    const bands = [
      { id: 'power',   label: 'Power',    minRate: 30, color: 'var(--danger-emphasis)',  desc: 'Heavy agent / CLI / cloud-agent use. Drive the right tail of the credits distribution.' },
      { id: 'regular', label: 'Regular',  minRate: 8,  color: 'var(--attention-emphasis)', desc: 'Daily active developer. Mostly chat + agent mode, modest token-per-interaction footprint.' },
      { id: 'light',   label: 'Light',    minRate: 1,  color: 'var(--accent-emphasis)',  desc: 'Casual chats, occasional refactor help. Mostly under per-seat allowance.' },
      { id: 'dormant', label: 'Dormant',  minRate: 0,  color: 'var(--fg-subtle)',        desc: 'Provisioned seat with little to no recorded activity. Pure pool donor — first reclamation candidate.' },
    ];
    const totalInteractions = DATA.byUser
      ? DATA.byUser.reduce((s, u) => s + u.interactions, 0)
      : (BASELINE.byFeature ? Array.from(BASELINE.byFeature.values()).reduce((s, f) => s + f.interactions, 0) : 0);
    const usersBands = { power: [], regular: [], light: [], dormant: [] };
    if (Array.isArray(usersArr)) {
      for (const u of usersArr) {
        const dailyRate = u.activeDays > 0 ? u.interactions / u.activeDays : 0;
        let bandId = 'dormant';
        if (dailyRate >= 30) bandId = 'power';
        else if (dailyRate >= 8) bandId = 'regular';
        else if (dailyRate >= 1) bandId = 'light';
        // Per-user credits = proportional to interactions (not perfect, but
        // closest given we only have aggregate token costs).
        const credits = totalInteractions > 0 ? (u.interactions / totalInteractions) * totalCredits : 0;
        usersBands[bandId].push({ login: u.login, interactions: u.interactions, activeDays: u.activeDays, credits });
      }
    } else {
      // Synthesise from total interactions: 10% power, 25% regular, 50% light, 15% dormant.
      const totalUsers = (DATA.meta && DATA.meta.users) || 100;
      const distribute = (n, share, baseRate) => {
        const out = [];
        for (let i = 0; i < Math.round(n * share); i++) {
          out.push({ login: `seat-${out.length}`, interactions: Math.round(baseRate * days * (0.6 + Math.random() * 0.8)), activeDays: Math.round(days * 0.7), credits: 0 });
        }
        return out;
      };
      usersBands.power = distribute(totalUsers, 0.10, 50);
      usersBands.regular = distribute(totalUsers, 0.25, 15);
      usersBands.light = distribute(totalUsers, 0.50, 4);
      usersBands.dormant = distribute(totalUsers, 0.15, 0.2);
      // Re-distribute credits proportionally
      const allUsers = [].concat(usersBands.power, usersBands.regular, usersBands.light, usersBands.dormant);
      const allInts = allUsers.reduce((s, u) => s + u.interactions, 0) || 1;
      allUsers.forEach(u => { u.credits = (u.interactions / allInts) * totalCredits; });
    }
    return bands.map(b => ({ ...b, users: usersBands[b.id], count: usersBands[b.id].length, credits: usersBands[b.id].reduce((s, u) => s + u.credits, 0) }));
  }

  const PERSONAS = buildPersonas();

  // ======================================================================
  //  RENDERERS
  // ======================================================================

  function renderHeadline() {
    const seats = (DATA.meta && DATA.meta.users) || 100;
    const days = (DATA.meta && DATA.meta.days) || 28;
    const monthScale = 30 / days; // normalise to 30-day month
    const monthlyCredits = BASELINE.totalCredits * monthScale;
    const monthlyDollars = monthlyCredits * CREDIT_RATE;
    const interactionsPerMo = Object.values(DATA.byFeature || {}).reduce((s, f) => s + (f.interactions || 0), 0) * monthScale;

    $('hdl-seats').textContent = fmtInt(seats);
    $('hdl-seats-sub').textContent = `${fmtInt(days)} active days in upload`;
    $('hdl-int').textContent = fmtCompact(interactionsPerMo).replace(/G/, 'B');
    $('hdl-baseline').textContent = fmtMoneyShort(monthlyDollars);
    $('hdl-baseline-sub').textContent = `${fmtCompact(monthlyCredits).replace(/G/, 'B')} credits/mo`;

    // Optimised: recompute when scenario sliders change
    refreshScenario();
  }

  // ----- Persona cards & distribution chart -----
  function renderPersonas() {
    const root = $('persona-cards'); root.innerHTML = '';
    const total = PERSONAS.reduce((s, p) => s + p.credits, 0) || 1;
    const totalSeats = PERSONAS.reduce((s, p) => s + p.count, 0) || 1;
    for (const p of PERSONAS) {
      const card = document.createElement('div');
      card.className = 'persona-card';
      const pctSeats = (p.count / totalSeats) * 100;
      const pctCredits = (p.credits / total) * 100;
      const monthScale = 30 / ((DATA.meta && DATA.meta.days) || 28);
      const dollars = p.credits * CREDIT_RATE * monthScale;
      const planFit = p.id === 'power' ? 'Enterprise (3,900–7,000 c/seat)' : p.id === 'regular' ? 'Business or Enterprise pool donor' : p.id === 'light' ? 'Business (1,900–3,000 c/seat)' : 'Reclaim or downgrade to Free';
      card.innerHTML = `
        <div class="top-bar" style="background:${p.color}"></div>
        <h4>${p.label} users</h4>
        <div class="meta">${fmtInt(p.count)} seats · ${pctSeats.toFixed(0)}% of fleet</div>
        <div class="v">${fmtMoneyShort(dollars)}<span style="font-size:13px;color:var(--fg-muted);font-weight:500"> /mo</span></div>
        <div class="sub">${pctCredits.toFixed(0)}% of total credits</div>
        <div class="desc">${p.desc}</div>
        <div class="desc" style="margin-top:6px"><strong>Best plan fit:</strong> ${planFit}</div>
      `;
      root.appendChild(card);
    }
    renderDistribution();
    renderPersonaFeatures();
  }

  function renderDistribution() {
    const allUsers = PERSONAS.flatMap(p => p.users.map(u => ({ ...u, band: p.id, color: p.color })));
    if (!allUsers.length) return;
    allUsers.sort((a, b) => b.credits - a.credits);
    const monthScale = 30 / ((DATA.meta && DATA.meta.days) || 28);
    allUsers.forEach(u => { u.creditsPerMo = u.credits * monthScale; });

    const W = 1100, H = 320;
    const margin = { top: 16, right: 24, bottom: 36, left: 64 };
    const w = W - margin.left - margin.right;
    const h = H - margin.top - margin.bottom;
    const c = d3.select('#chart-distribution').html('');
    const svg = c.append('svg').attr('viewBox', `0 0 ${W} ${H}`);
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().domain([0, allUsers.length]).range([0, w]);
    const yMax = d3.max(allUsers, d => d.creditsPerMo) || 1;
    const y = d3.scaleLog().domain([Math.max(0.5, yMax / 1e4), yMax * 1.1]).range([h, 0]).clamp(true);

    g.append('g').attr('class', 'grid')
      .call(d3.axisLeft(y).ticks(5, '~s').tickSize(-w).tickFormat(''));

    g.append('g').attr('class', 'axis').attr('transform', `translate(0,${h})`)
      .call(d3.axisBottom(x).ticks(8).tickFormat(d => fmtInt(d)));
    g.append('g').attr('class', 'axis')
      .call(d3.axisLeft(y).ticks(6, '~s').tickFormat(d => fmtCompact(d).replace(/G/, 'B') + 'c'));

    g.append('text').attr('class','axis-label').attr('x', w/2).attr('y', h+28).attr('text-anchor','middle').text('Seat rank (descending by credits/mo)');
    g.append('text').attr('class','axis-label').attr('transform','rotate(-90)').attr('x',-h/2).attr('y',-46).attr('text-anchor','middle').text('Credits / month (log)');

    g.selectAll('rect.bar').data(allUsers).enter().append('rect')
      .attr('x', (_, i) => x(i)).attr('width', Math.max(1, w / allUsers.length - 1))
      .attr('y', d => y(Math.max(0.5, d.creditsPerMo))).attr('height', d => h - y(Math.max(0.5, d.creditsPerMo)))
      .attr('fill', d => d.color).attr('opacity', 0.9)
      .on('mousemove', function (e, d) {
        tooltip.style('opacity', 1).style('left', (e.pageX + 12) + 'px').style('top', (e.pageY - 24) + 'px')
          .html(`<div class="row"><span class="k">${d.login || 'seat'}</span></div>
                 <div class="row"><span class="k">Band</span><span class="v">${d.band}</span></div>
                 <div class="row"><span class="k">Credits/mo</span><span class="v">${fmtInt(Math.round(d.creditsPerMo))}c</span></div>
                 <div class="row"><span class="k">Interactions</span><span class="v">${fmtInt(d.interactions)}</span></div>
                 <div class="row"><span class="k">Active days</span><span class="v">${d.activeDays}</span></div>`);
      })
      .on('mouseleave', () => tooltip.style('opacity', 0));

    // Reference lines: per-seat allowance lines (Business, Enterprise, std + promo)
    const lines = [
      { v: 1900, label: 'Business 1,900', color: 'var(--accent-emphasis)' },
      { v: 3000, label: 'Business promo 3,000', color: 'var(--accent-fg)', dash: '3,2' },
      { v: 3900, label: 'Enterprise 3,900', color: 'var(--success-emphasis)' },
      { v: 7000, label: 'Enterprise promo 7,000', color: 'var(--success-fg)', dash: '3,2' },
    ];
    for (const l of lines) {
      if (l.v > yMax * 1.1) continue;
      g.append('line').attr('x1', 0).attr('x2', w).attr('y1', y(l.v)).attr('y2', y(l.v))
        .attr('stroke', l.color).attr('stroke-width', 1.5).attr('stroke-dasharray', l.dash || null);
      g.append('text').attr('x', w - 4).attr('y', y(l.v) - 4).attr('text-anchor', 'end')
        .attr('font-size', 10).attr('fill', l.color).text(l.label + 'c');
    }
  }

  function renderPersonaFeatures() {
    // Stacked bars: for each persona, share of interactions across the top features.
    // We don't have per-user feature breakdown for synthetic personas, so use
    // the global feature mix and weight it slightly by band (heavier agent
    // concentration in power band, more chat in light).
    const features = Array.from(BASELINE.byFeature.entries())
      .filter(([f]) => f !== 'code_completion')
      .map(([f, v]) => ({ feature: f, label: FEATURE_LABELS[f] || f, interactions: v.interactions }))
      .sort((a, b) => b.interactions - a.interactions)
      .slice(0, 6);
    const total = d3.sum(features, d => d.interactions) || 1;
    const baseShares = features.map(f => f.interactions / total);

    // Tilt per band: power → multiply agent-mode-ish by 1.4, chat-simple by 0.6; reverse for light.
    const isHeavy = (f) => /agent|cli|plan|custom/.test(f);
    const isLight = (f) => /ask|inline|unknown/.test(f);
    const tilts = { power: { heavy: 1.5, light: 0.4, mid: 0.9 }, regular: { heavy: 1.1, light: 0.85, mid: 1 }, light: { heavy: 0.5, light: 1.6, mid: 1 }, dormant: { heavy: 0.7, light: 1.2, mid: 1 } };
    const personaSeries = PERSONAS.map(p => {
      const t = tilts[p.id];
      let raw = features.map((f, i) => {
        const w = isHeavy(f.feature) ? t.heavy : isLight(f.feature) ? t.light : t.mid;
        return baseShares[i] * w;
      });
      const sum = d3.sum(raw) || 1;
      return { id: p.id, label: p.label, color: p.color, shares: raw.map(v => v / sum) };
    });

    const W = 1100, H = 280;
    const margin = { top: 12, right: 24, bottom: 32, left: 90 };
    const w = W - margin.left - margin.right;
    const h = H - margin.top - margin.bottom;
    const c = d3.select('#chart-persona-features').html('');
    const svg = c.append('svg').attr('viewBox', `0 0 ${W} ${H}`);
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const y = d3.scaleBand().domain(personaSeries.map(p => p.label)).range([0, h]).padding(0.2);
    const x = d3.scaleLinear().domain([0, 1]).range([0, w]);
    const colors = d3.schemeTableau10;

    g.append('g').attr('class','axis').call(d3.axisLeft(y));
    g.append('g').attr('class','axis').attr('transform',`translate(0,${h})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d3.format('.0%')));

    for (const p of personaSeries) {
      let acc = 0;
      for (let i = 0; i < features.length; i++) {
        const v = p.shares[i];
        g.append('rect').attr('x', x(acc)).attr('y', y(p.label)).attr('width', x(v))
          .attr('height', y.bandwidth()).attr('fill', colors[i % colors.length])
          .on('mousemove', (e) => tooltip.style('opacity', 1).style('left', (e.pageX+12)+'px').style('top',(e.pageY-24)+'px')
            .html(`<div class="row"><span class="k">${p.label}</span></div>
                   <div class="row"><span class="k">${features[i].label}</span><span class="v">${(v*100).toFixed(0)}%</span></div>`))
          .on('mouseleave', () => tooltip.style('opacity', 0));
        acc += v;
      }
    }

    const lg = d3.select('#legend-persona-features').html('');
    features.forEach((f, i) => {
      lg.append('span').attr('class','legend-item').html(
        `<span class="legend-swatch" style="background:${colors[i % colors.length]}"></span>${f.label}`
      );
    });
  }

  // ----- Plan-mix sweep --------------------------------------------------
  function renderPlanMix() {
    const seatsEl = $('mix-seats');
    const periodEl = $('mix-period');
    const powerShareEl = $('mix-power-share');
    const powerMultEl = $('mix-power-mult');
    const seats = +seatsEl.value;
    $('mix-seats-val').textContent = fmtInt(seats);
    $('mix-power-share-val').textContent = powerShareEl.value;
    $('mix-power-mult-val').textContent = (+powerMultEl.value).toFixed(1);

    const biz = (window.AI_CREDITS && window.AI_CREDITS.plans.find(p => p.id === 'business')) || { price: 19, credits: 1900, promoCredits: 3000 };
    const ent = (window.AI_CREDITS && window.AI_CREDITS.plans.find(p => p.id === 'enterprise')) || { price: 39, credits: 3900, promoCredits: 7000 };
    const isPromo = periodEl.value === 'promo';
    const bizPerSeat = isPromo ? (biz.promoCredits || biz.credits) : biz.credits;
    const entPerSeat = isPromo ? (ent.promoCredits || ent.credits) : ent.credits;

    const monthScale = 30 / ((DATA.meta && DATA.meta.days) || 28);
    const need = BASELINE.totalCredits * monthScale; // total monthly credits needed
    // Apply uploaded fleet → projected fleet scaling (uploaded users → seats slider)
    const uploadedUsers = (DATA.meta && DATA.meta.users) || seats;
    const seatScale = seats / Math.max(1, uploadedUsers);
    const scaledNeed = need * seatScale;

    // Pareto-style usage skew: top X% of seats consume Y× per-seat allowance.
    // Simulate: compute headroom for each (bizPct) split.
    const powerShare = (+powerShareEl.value) / 100;
    const powerMult = +powerMultEl.value;
    const lightFraction = Math.max(0.1, 1 - powerShare * powerMult); // residual

    const sweep = [];
    for (let bizPct = 0; bizPct <= 100; bizPct += 5) {
      const bizSeats = Math.round(seats * bizPct / 100);
      const entSeats = seats - bizSeats;
      const pool = bizSeats * bizPerSeat + entSeats * entPerSeat;
      const subs = bizSeats * biz.price + entSeats * ent.price;
      const overage = Math.max(0, scaledNeed - pool);
      const total = subs + overage * CREDIT_RATE;
      sweep.push({ bizPct, bizSeats, entSeats, pool, subs, overage, total });
    }
    const optimum = sweep.reduce((best, s) => (!best || s.total < best.total) ? s : best, null);

    // Draw chart
    const W = 1100, H = 360;
    const margin = { top: 16, right: 96, bottom: 36, left: 64 };
    const w = W - margin.left - margin.right;
    const h = H - margin.top - margin.bottom;
    const c = d3.select('#chart-mix-sweep').html('');
    const svg = c.append('svg').attr('viewBox', `0 0 ${W} ${H}`);
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    const x = d3.scaleLinear().domain([0, 100]).range([0, w]);
    const yMax = d3.max(sweep, s => s.total) * 1.1 || 1;
    const y = d3.scaleLinear().domain([0, yMax]).range([h, 0]);
    g.append('g').attr('class', 'grid').call(d3.axisLeft(y).ticks(5).tickSize(-w).tickFormat(''));
    g.append('g').attr('class', 'axis').attr('transform', `translate(0,${h})`)
      .call(d3.axisBottom(x).ticks(11).tickFormat(d => d + '%'));
    g.append('g').attr('class', 'axis')
      .call(d3.axisLeft(y).ticks(6).tickFormat(d => fmtMoneyShort(d)));
    g.append('text').attr('class','axis-label').attr('x',w/2).attr('y',h+28).attr('text-anchor','middle').text('% of seats on Business (rest on Enterprise)');
    g.append('text').attr('class','axis-label').attr('transform','rotate(-90)').attr('x',-h/2).attr('y',-46).attr('text-anchor','middle').text('Total monthly cost (subs + overage)');

    const lineSubs = d3.line().x(d => x(d.bizPct)).y(d => y(d.subs));
    const lineOver = d3.line().x(d => x(d.bizPct)).y(d => y(d.overage * CREDIT_RATE));
    const lineTotal = d3.line().x(d => x(d.bizPct)).y(d => y(d.total));

    g.append('path').datum(sweep).attr('fill','none').attr('stroke','var(--accent-emphasis)').attr('stroke-width',2).attr('d', lineSubs);
    g.append('path').datum(sweep).attr('fill','none').attr('stroke','var(--danger-emphasis)').attr('stroke-width',2).attr('stroke-dasharray','3,2').attr('d', lineOver);
    g.append('path').datum(sweep).attr('fill','none').attr('stroke','var(--success-emphasis)').attr('stroke-width',3).attr('d', lineTotal);

    // Optimum marker
    if (optimum) {
      g.append('line').attr('x1', x(optimum.bizPct)).attr('x2', x(optimum.bizPct))
        .attr('y1', 0).attr('y2', h)
        .attr('stroke','var(--success-emphasis)').attr('stroke-width', 1.5).attr('stroke-dasharray','4,3');
      g.append('text').attr('x', x(optimum.bizPct) + 4).attr('y', 14).attr('font-size', 11).attr('fill','var(--success-fg)').attr('font-weight', 600)
        .text(`Optimum: ${optimum.bizPct}% Business · ${fmtMoneyShort(optimum.total)}/mo`);
    }
    g.selectAll('circle.pt').data(sweep).enter().append('circle').attr('class','pt')
      .attr('cx', d => x(d.bizPct)).attr('cy', d => y(d.total)).attr('r', 3).attr('fill','var(--success-emphasis)')
      .on('mousemove', (e, d) => tooltip.style('opacity',1).style('left',(e.pageX+12)+'px').style('top',(e.pageY-24)+'px')
        .html(`<div class="row"><span class="k">${d.bizPct}% Business</span></div>
               <div class="row"><span class="k">Biz seats</span><span class="v">${fmtInt(d.bizSeats)}</span></div>
               <div class="row"><span class="k">Ent seats</span><span class="v">${fmtInt(d.entSeats)}</span></div>
               <div class="row"><span class="k">Pool</span><span class="v">${fmtInt(d.pool)}c</span></div>
               <div class="row"><span class="k">Subs</span><span class="v">${fmtMoney(d.subs)}/mo</span></div>
               <div class="row"><span class="k">Overage</span><span class="v">${fmtMoneyShort(d.overage*CREDIT_RATE)}</span></div>
               <div class="row"><span class="k">Total</span><span class="v">${fmtMoneyShort(d.total)}/mo</span></div>`))
      .on('mouseleave', () => tooltip.style('opacity', 0));

    // Strategy spotlight cards: best, all-Business, all-Enterprise
    const allBiz = sweep.find(s => s.bizPct === 100);
    const allEnt = sweep.find(s => s.bizPct === 0);
    const cards = [
      { ribbon: 'OPTIMAL', best: true, title: `${optimum.bizPct}% Business · ${100 - optimum.bizPct}% Enterprise`, total: optimum.total, breakdown: `Subs ${fmtMoney(optimum.subs)} + overage ${fmtMoneyShort(optimum.overage*CREDIT_RATE)} = ${fmtMoneyShort(optimum.total)}/mo. ${optimum.bizSeats} Business seats · ${optimum.entSeats} Enterprise seats. ${optimum.overage > 0 ? 'Some overage at this mix; trying to fully cover with subs costs more.' : 'Pool fully absorbs the projected month with no overage.'}` },
      { ribbon: '', best: false, title: 'All-Business (cheap subs, more overage)', total: allBiz.total, breakdown: `${fmtInt(seats)} Business seats · pool ${fmtInt(allBiz.pool)}c. Saves ${fmtMoneyShort(allEnt.subs - allBiz.subs)} on subs but adds ${fmtMoneyShort(allBiz.overage * CREDIT_RATE - allEnt.overage * CREDIT_RATE)} of overage vs all-Enterprise. Net delta to optimum: ${fmtMoneyShort(allBiz.total - optimum.total)}.` },
      { ribbon: '', best: false, title: 'All-Enterprise (premium subs, headroom)', total: allEnt.total, breakdown: `${fmtInt(seats)} Enterprise seats · pool ${fmtInt(allEnt.pool)}c (${(allEnt.pool/scaledNeed).toFixed(1)}× this month). Worst-case never overages but pays ${fmtMoneyShort(allEnt.total - optimum.total)} more than the optimum.` },
    ];
    const sg = $('strat-grid'); sg.innerHTML = '';
    for (const cd of cards) {
      const el = document.createElement('div');
      el.className = 'strat-card' + (cd.best ? ' best' : '');
      el.innerHTML = `${cd.ribbon ? `<span class="ribbon">${cd.ribbon}</span>` : ''}
        <h4>${cd.title}</h4>
        <div class="v">${fmtMoneyShort(cd.total)}<span style="font-size:13px;color:var(--fg-muted);font-weight:500"> /mo</span></div>
        <div class="sub">${fmtMoneyShort(cd.total * 12)} annualised</div>
        <div class="breakdown">${cd.breakdown}</div>`;
      sg.appendChild(el);
    }
    return optimum;
  }

  // ----- Substitution table & waterfall ---------------------------------
  function renderSubstitutions() {
    const monthScale = 30 / ((DATA.meta && DATA.meta.days) || 28);
    const rows = Array.from(BASELINE.byModel.values())
      .filter(r => r.credits > 0)
      .map(r => {
        const sub = SUBSTITUTIONS[r.model.name];
        const target = sub ? (window.MODELS.find(m => m.name === sub.to)) : null;
        const currentCreditsPerInteraction = r.interactions ? r.credits / r.interactions : 0;
        // Recompute target credits at the workflow mix this model actually used
        let targetCredits = r.credits; // default = no swap → no saving
        if (target) {
          targetCredits = 0;
          for (const c of BASELINE.byCell) {
            if (c.model.name !== r.model.name) continue;
            if (c.feature === 'code_completion') continue;
            const wf = WF_BY_ID.get(c.wfId);
            const inTok = c.inTok, outTok = c.outTok;
            const dollars = (inTok * target.in + outTok * target.out) / 1e6;
            targetCredits += dollars / CREDIT_RATE;
          }
        }
        const targetCreditsPerInteraction = r.interactions ? targetCredits / r.interactions : 0;
        const swePerDollarCurrent = r.model.swe ? (r.model.swe / r.model.tokenCost) : null;
        const swePerDollarTarget = target && target.swe ? (target.swe / target.tokenCost) : null;
        const savingPerMo = (r.credits - targetCredits) * CREDIT_RATE * monthScale * 0.7;
        return { current: r.model, target, sub, interactions: r.interactions,
          creditsCurrent: r.credits, creditsTarget: targetCredits,
          deltaPerInteraction: currentCreditsPerInteraction - targetCreditsPerInteraction,
          swePerDollarCurrent, swePerDollarTarget,
          savingPerMo,
          monthlyCreditsCurrent: r.credits * monthScale,
          monthlyCreditsTarget: targetCredits * monthScale,
        };
      })
      .sort((a, b) => b.savingPerMo - a.savingPerMo);

    // Table
    const tbody = $('swap-table').querySelector('tbody');
    tbody.innerHTML = '';
    for (const row of rows) {
      const tr = document.createElement('tr');
      const targetName = row.target ? row.target.name : '<span class="muted">no swap</span>';
      const targetReason = row.sub ? `<div class="muted" style="font-size:11px;text-align:left;white-space:normal">${row.sub.reason}</div>` : '';
      tr.innerHTML = `
        <td><strong>${row.current.name}</strong> <span class="muted">${row.current.provider}</span></td>
        <td><span class="badge">${row.current.tier}</span></td>
        <td class="num">${fmtInt(row.interactions)}</td>
        <td class="num">${fmtInt(Math.round(row.monthlyCreditsCurrent))}c</td>
        <td class="num">${row.swePerDollarCurrent ? fmtInt(Math.round(row.swePerDollarCurrent)) : '<span class="muted">—</span>'}</td>
        <td>${targetName}${targetReason}</td>
        <td class="num ${row.deltaPerInteraction > 0 ? 'pos' : row.deltaPerInteraction < 0 ? 'neg' : 'muted'}">${row.deltaPerInteraction ? (row.deltaPerInteraction > 0 ? '−' : '+') + Math.abs(row.deltaPerInteraction).toFixed(2) + 'c' : '—'}</td>
        <td class="num ${row.savingPerMo > 0 ? 'pos' : ''}">${row.savingPerMo > 0 ? fmtMoney(row.savingPerMo) : '—'}</td>
      `;
      tbody.appendChild(tr);
    }

    // Waterfall
    const W = 1100, H = 360;
    const margin = { top: 20, right: 24, bottom: 60, left: 80 };
    const w = W - margin.left - margin.right;
    const h = H - margin.top - margin.bottom;
    const c = d3.select('#chart-waterfall').html('');
    const svg = c.append('svg').attr('viewBox', `0 0 ${W} ${H}`);
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const baseline = rows.reduce((s, r) => s + r.monthlyCreditsCurrent * CREDIT_RATE, 0);
    const swappable = rows.filter(r => r.savingPerMo > 0).slice(0, 8);
    const steps = [{ label: 'Baseline', delta: 0, value: baseline, type: 'start' }];
    let running = baseline;
    for (const r of swappable) {
      running -= r.savingPerMo;
      steps.push({ label: r.current.name + ' → ' + (r.target ? r.target.name : '?'), delta: -r.savingPerMo, value: running, type: 'step' });
    }
    steps.push({ label: 'Optimised', delta: 0, value: running, type: 'end' });
    const x = d3.scaleBand().domain(steps.map((_, i) => i)).range([0, w]).padding(0.18);
    const y = d3.scaleLinear().domain([0, baseline * 1.05]).range([h, 0]);
    g.append('g').attr('class','grid').call(d3.axisLeft(y).ticks(5).tickSize(-w).tickFormat(''));
    g.append('g').attr('class','axis').attr('transform',`translate(0,${h})`)
      .call(d3.axisBottom(x).tickFormat(i => steps[i].label.length > 22 ? steps[i].label.slice(0,20)+'…' : steps[i].label))
      .selectAll('text').attr('transform','rotate(-22)').attr('text-anchor','end').attr('dx','-6').attr('dy','6');
    g.append('g').attr('class','axis').call(d3.axisLeft(y).ticks(6).tickFormat(d => fmtMoneyShort(d)));

    steps.forEach((s, i) => {
      const isStart = s.type === 'start' || s.type === 'end';
      const top = isStart ? y(s.value) : y(s.value - s.delta);
      const bot = isStart ? y(0) : y(s.value);
      const color = s.type === 'start' ? 'var(--danger-emphasis)' : s.type === 'end' ? 'var(--success-emphasis)' : 'var(--accent-emphasis)';
      g.append('rect').attr('x', x(i)).attr('width', x.bandwidth())
        .attr('y', Math.min(top, bot)).attr('height', Math.abs(bot - top))
        .attr('fill', color).attr('opacity', 0.85);
      g.append('text').attr('x', x(i) + x.bandwidth()/2).attr('y', Math.min(top, bot) - 4)
        .attr('text-anchor', 'middle').attr('font-size', 11).attr('fill', 'var(--fg-default)')
        .text(fmtMoneyShort(s.value));
      if (s.delta && i < steps.length - 1) {
        const next = steps[i + 1];
        if (next.type !== 'end') {
          g.append('line').attr('x1', x(i) + x.bandwidth()).attr('x2', x(i + 1))
            .attr('y1', y(s.value)).attr('y2', y(s.value))
            .attr('stroke','var(--fg-muted)').attr('stroke-dasharray','2,2');
        }
      }
    });

    // Save for scenario use
    SUB_ROWS = rows;
  }

  // ----- Workflow routing -------------------------------------------------
  function renderWorkflow() {
    const monthScale = 30 / ((DATA.meta && DATA.meta.days) || 28);
    const features = Array.from(BASELINE.byFeature.values())
      .filter(f => f.feature !== 'code_completion' && f.interactions > 0)
      .sort((a, b) => b.credits - a.credits);

    // Compute current avg credits/interaction and routed
    const data = features.map(f => {
      const wfId = FEATURE_DEFAULT_PROFILE[f.feature] || 'chat-simple';
      const wf = WF_BY_ID.get(wfId);
      const router = WF_ROUTER[wfId] || WF_ROUTER['chat-simple'];
      const cheap = window.MODELS.find(m => m.name === router.cheap);
      const premium = window.MODELS.find(m => m.name === router.premium);
      // Routed credits: cheapShare with cheap model, rest with premium, on the
      // *same* token volume as observed.
      const totalIn = f.inTok, totalOut = f.outTok;
      const cheapDollars = ((totalIn * router.cheapShare) * cheap.in + (totalOut * router.cheapShare) * cheap.out) / 1e6;
      const premDollars = ((totalIn * (1 - router.cheapShare)) * premium.in + (totalOut * (1 - router.cheapShare)) * premium.out) / 1e6;
      const routedCredits = (cheapDollars + premDollars) / CREDIT_RATE;
      const currentPer = f.credits / Math.max(1, f.interactions);
      const routedPer = routedCredits / Math.max(1, f.interactions);
      const savingPerMo = Math.max(0, (f.credits - routedCredits) * CREDIT_RATE * monthScale);
      return {
        feature: f.feature, label: FEATURE_LABELS[f.feature] || f.feature,
        wfLabel: wf.name, currentPer, routedPer,
        currentMonthly: f.credits * monthScale * CREDIT_RATE,
        routedMonthly: routedCredits * monthScale * CREDIT_RATE,
        savingPerMo, router, cheap, premium,
      };
    });

    // Bar chart: current vs routed credits/interaction
    const W = 1100, H = 320;
    const margin = { top: 16, right: 24, bottom: 70, left: 64 };
    const w = W - margin.left - margin.right;
    const h = H - margin.top - margin.bottom;
    const c = d3.select('#chart-workflow').html('');
    const svg = c.append('svg').attr('viewBox', `0 0 ${W} ${H}`);
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand().domain(data.map(d => d.label)).range([0, w]).padding(0.2);
    const x1 = d3.scaleBand().domain(['current','routed']).range([0, x.bandwidth()]).padding(0.05);
    const yMax = d3.max(data, d => Math.max(d.currentPer, d.routedPer)) * 1.1 || 1;
    const y = d3.scaleLinear().domain([0, yMax]).range([h, 0]);
    g.append('g').attr('class','grid').call(d3.axisLeft(y).ticks(5).tickSize(-w).tickFormat(''));
    g.append('g').attr('class','axis').attr('transform',`translate(0,${h})`)
      .call(d3.axisBottom(x))
      .selectAll('text').attr('transform','rotate(-18)').attr('text-anchor','end').attr('dx','-6').attr('dy','6');
    g.append('g').attr('class','axis').call(d3.axisLeft(y).ticks(6).tickFormat(d => d.toFixed(1) + 'c'));

    for (const d of data) {
      g.append('rect').attr('x', x(d.label) + x1('current')).attr('y', y(d.currentPer))
        .attr('width', x1.bandwidth()).attr('height', h - y(d.currentPer))
        .attr('fill','var(--accent-emphasis)').attr('opacity', 0.9)
        .on('mousemove', (e) => tooltip.style('opacity',1).style('left',(e.pageX+12)+'px').style('top',(e.pageY-24)+'px')
          .html(`<div class="row"><span class="k">${d.label} · current</span></div>
                 <div class="row"><span class="k">${d.currentPer.toFixed(2)}c / interaction</span></div>
                 <div class="row"><span class="k">Workflow</span><span class="v">${d.wfLabel}</span></div>`))
        .on('mouseleave', () => tooltip.style('opacity', 0));
      g.append('rect').attr('x', x(d.label) + x1('routed')).attr('y', y(d.routedPer))
        .attr('width', x1.bandwidth()).attr('height', h - y(d.routedPer))
        .attr('fill','var(--success-emphasis)').attr('opacity', 0.9)
        .on('mousemove', (e) => tooltip.style('opacity',1).style('left',(e.pageX+12)+'px').style('top',(e.pageY-24)+'px')
          .html(`<div class="row"><span class="k">${d.label} · routed</span></div>
                 <div class="row"><span class="k">${d.routedPer.toFixed(2)}c / interaction</span></div>
                 <div class="row"><span class="k">Cheap (${(d.router.cheapShare*100).toFixed(0)}%)</span><span class="v">${d.cheap.name}</span></div>
                 <div class="row"><span class="k">Premium</span><span class="v">${d.premium.name}</span></div>`))
        .on('mouseleave', () => tooltip.style('opacity', 0));
    }

    // Saving chart: monthly $ saving by feature
    const W2 = 1100, H2 = 240;
    const m2 = { top: 12, right: 24, bottom: 50, left: 80 };
    const w2 = W2 - m2.left - m2.right; const h2 = H2 - m2.top - m2.bottom;
    const c2 = d3.select('#chart-workflow-save').html('');
    const svg2 = c2.append('svg').attr('viewBox', `0 0 ${W2} ${H2}`);
    const g2 = svg2.append('g').attr('transform', `translate(${m2.left},${m2.top})`);
    const x2 = d3.scaleBand().domain(data.map(d => d.label)).range([0, w2]).padding(0.25);
    const yMax2 = d3.max(data, d => d.savingPerMo) || 1;
    const y2 = d3.scaleLinear().domain([0, yMax2 * 1.1]).range([h2, 0]);
    g2.append('g').attr('class','grid').call(d3.axisLeft(y2).ticks(5).tickSize(-w2).tickFormat(''));
    g2.append('g').attr('class','axis').attr('transform',`translate(0,${h2})`)
      .call(d3.axisBottom(x2))
      .selectAll('text').attr('transform','rotate(-18)').attr('text-anchor','end').attr('dx','-6').attr('dy','6');
    g2.append('g').attr('class','axis').call(d3.axisLeft(y2).ticks(5).tickFormat(d => fmtMoneyShort(d)));
    for (const d of data) {
      g2.append('rect').attr('x', x2(d.label)).attr('y', y2(d.savingPerMo))
        .attr('width', x2.bandwidth()).attr('height', h2 - y2(d.savingPerMo))
        .attr('fill','var(--success-emphasis)').attr('opacity', 0.9);
      g2.append('text').attr('x', x2(d.label) + x2.bandwidth()/2).attr('y', y2(d.savingPerMo) - 4)
        .attr('text-anchor','middle').attr('font-size', 11).attr('fill','var(--fg-default)')
        .text(fmtMoneyShort(d.savingPerMo));
    }

    WF_DATA = data;
  }

  // ----- Scenario lever attribution + headline refresh -------------------
  let SUB_ROWS = []; let WF_DATA = []; let LAST_OPT = null;

  function getScenarioInputs() {
    return {
      substitute: (+$('scen-substitute').value) / 100,
      routing:    (+$('scen-routing').value) / 100,
      cache:      (+$('scen-cache').value) / 100,
      loop:       (+$('scen-loop').value) / 100,
      mix:        (+$('scen-mix').value) / 100,
      dormant:    (+$('scen-dormant').value) / 100,
    };
  }

  function refreshScenario() {
    const s = getScenarioInputs();
    Object.entries(s).forEach(([k, v]) => {
      const el = $(`scen-${k}-val`); if (el) el.textContent = Math.round(v * 100) + (k === 'loop' ? '%' : '%');
    });

    const monthScale = 30 / ((DATA.meta && DATA.meta.days) || 28);
    const baselineMonthly = BASELINE.totalCredits * monthScale * CREDIT_RATE;
    let running = baselineMonthly;
    const levers = [];

    // 1. Model substitution (apply to credits, capped by sum of swap savings)
    const subSavingMax = (SUB_ROWS || []).filter(r => r.savingPerMo > 0)
      .reduce((sum, r) => sum + (r.creditsCurrent - r.creditsTarget) * CREDIT_RATE * monthScale, 0);
    const subSaving = subSavingMax * s.substitute;
    levers.push({ key: 'Model substitution', value: subSaving, color: 'var(--accent-emphasis)' });
    running -= subSaving;

    // 2. Workflow routing
    const wfSavingMax = (WF_DATA || []).reduce((sum, d) => sum + d.savingPerMo, 0);
    const wfApplied = wfSavingMax * s.routing * (running / Math.max(1, baselineMonthly));
    levers.push({ key: 'Workflow routing', value: wfApplied, color: 'var(--success-emphasis)' });
    running -= wfApplied;

    // 3. Prompt caching (~90% off cached input → effective discount ≈ 0.4 × inputShare × cacheAdoption × residual)
    // Approximate: input is ~70% of agent-mode token cost; caching reduces input cost by ~90% on cached share.
    const inputShare = 0.65; // typical for agent-heavy fleets
    const cacheSaving = running * inputShare * 0.9 * s.cache;
    levers.push({ key: 'Prompt caching', value: cacheSaving, color: 'var(--done-emphasis)' });
    running -= cacheSaving;

    // 4. Agent-loop tightening: linear reduction in agent-feature credits
    const agentShareOfTotal = (() => {
      const tot = baselineMonthly || 1;
      const agentCredits = (WF_DATA || []).filter(d => /agent|cli|plan|custom/.test(d.feature))
        .reduce((s, d) => s + d.currentMonthly, 0);
      return Math.min(1, agentCredits / tot);
    })();
    const loopSaving = running * agentShareOfTotal * s.loop;
    levers.push({ key: 'Agent-loop tightening', value: loopSaving, color: 'var(--attention-emphasis)' });
    running -= loopSaving;

    // 5. Dormant reclamation: fraction of subscription cost (no token saving — already counted)
    // We model it as a saving on subs side, computed below in plan-mix.
    // 6. Mix shift: marginal effect on overage. Approximate as 5% reduction of credits cost
    //    capped by realistic Enterprise headroom benefit.
    const mixSaving = running * 0.04 * s.mix; // crude — Enterprise covers heavier tail
    levers.push({ key: 'Plan-mix shift to Ent', value: mixSaving, color: 'var(--accent-fg)' });
    running -= mixSaving;

    // Plan-mix optimum gives subscription cost. Add it for a full $/mo figure.
    LAST_OPT = renderPlanMix();
    const subsCost = LAST_OPT ? LAST_OPT.subs : 0;
    const dormantSaving = subsCost * 0.15 * s.dormant; // assume dormant ≈ 15% of fleet
    levers.push({ key: 'Dormant-seat reclamation', value: dormantSaving, color: 'var(--fg-subtle)' });

    const tokenCostOptimised = running;
    const totalOptimised = tokenCostOptimised + subsCost - dormantSaving;
    const totalBaseline = baselineMonthly + subsCost;
    const monthlySavings = totalBaseline - totalOptimised;

    // Headline KPIs
    $('hdl-opt').textContent = fmtMoneyShort(totalOptimised);
    $('hdl-save').textContent = fmtMoneyShort(monthlySavings);
    $('hdl-save-sub').textContent = monthlySavings > 0 ? `${((monthlySavings/totalBaseline)*100).toFixed(0)}% reduction vs baseline` : 'no net saving at these levers';

    // 12-month rough total uses the forecast helper
    const fc = computeForecast({ ...getScenarioInputs(), aggressive: 0 }, baselineMonthly, subsCost);
    const fcAgg = computeForecast(getScenarioInputs(), baselineMonthly, subsCost, true);
    const fcBaseSum = fc.baseline.reduce((s, v) => s + v, 0);
    const fcOptSum = fc.optimised.reduce((s, v) => s + v, 0);
    const fcAggSum = fcAgg.optimised.reduce((s, v) => s + v, 0);
    $('hdl-12').textContent = fmtMoneyShort(fcBaseSum - fcOptSum);

    // Headline callout
    const ratio = totalOptimised > 0 ? totalBaseline / totalOptimised : 0;
    if (monthlySavings > 0) {
      $('headline-callout').className = 'callout success';
      $('headline-callout-title').textContent = `Pulling every lever cuts ${IS_DEMO ? 'this demo fleet' : 'your fleet'}'s monthly bill by ${((monthlySavings/totalBaseline)*100).toFixed(0)}% (${fmtMoneyShort(monthlySavings)}/mo · ${ratio.toFixed(2)}× lower).`;
      $('headline-callout-body').innerHTML = ` Largest single contributor: <strong>${levers.sort((a,b)=>b.value-a.value)[0].key}</strong> at ${fmtMoneyShort(levers[0].value)}/mo. Forecast over 12 months: ${fmtMoneyShort(fcBaseSum)} baseline → ${fmtMoneyShort(fcOptSum)} optimised → ${fmtMoneyShort(fcAggSum)} aggressive (savings of <strong>${fmtMoneyShort(fcBaseSum - fcAggSum)}</strong> vs baseline).`;
    } else {
      $('headline-callout').className = 'callout warn';
      $('headline-callout-title').textContent = 'Sliders are at zero — no optimisation applied.';
      $('headline-callout-body').textContent = ' Drag the scenario sliders below or §6 to apply substitutions, routing, caching, etc.';
    }

    // Lever attribution chart
    renderScenarioLevers(levers, totalOptimised, totalBaseline);
    renderForecast(baselineMonthly, subsCost);
    renderActions(levers, monthlySavings, totalBaseline);
  }

  function renderScenarioLevers(levers, totalOpt, totalBase) {
    const W = 1100, H = 130;
    const margin = { top: 30, right: 24, bottom: 24, left: 24 };
    const w = W - margin.left - margin.right; const h = H - margin.top - margin.bottom;
    const c = d3.select('#chart-scenario').html('');
    const svg = c.append('svg').attr('viewBox', `0 0 ${W} ${H}`);
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    const total = totalBase || 1;
    let acc = 0;
    // First segment = optimised remaining
    const segs = [{ key: 'Optimised cost', value: totalOpt, color: 'var(--success-emphasis)', opacity: 0.95 }]
      .concat(levers.map((l, i) => ({ ...l, opacity: 0.85 })));
    g.append('text').attr('x', 0).attr('y', -14).attr('font-size', 12).attr('font-weight', 600).attr('fill','var(--fg-default)')
      .text(`Total monthly cost composition: ${fmtMoneyShort(totalBase)} baseline → ${fmtMoneyShort(totalOpt)} optimised`);
    for (const seg of segs) {
      const v = Math.max(0, seg.value);
      const wPx = (v / total) * w;
      g.append('rect').attr('x', acc).attr('y', 0).attr('width', wPx).attr('height', h)
        .attr('fill', seg.color).attr('opacity', seg.opacity);
      if (wPx > 60) {
        g.append('text').attr('x', acc + wPx/2).attr('y', h/2 + 4).attr('text-anchor','middle')
          .attr('font-size', 11).attr('fill','#fff').attr('font-weight', 600)
          .text(`${seg.key} · ${fmtMoneyShort(v)}`);
      }
      acc += wPx;
    }
  }

  // ----- Forecast --------------------------------------------------------
  function computeForecast(scen, baselineMonthly, subsCost, aggressive) {
    const months = 12;
    const seatsGrowth = (+$('fc-seats-growth').value) / 100;
    const usageGrowth = (+$('fc-usage-growth').value) / 100;
    const ramp = +$('fc-ramp').value;
    const aggUplift = aggressive ? (+$('fc-aggressive').value) / 100 : 0;

    const out = { months: [], baseline: [], optimised: [], subscription: [] };
    // Anchor month = May 2026 (one month before transition)
    const start = new Date(2026, 4, 1);
    for (let i = 0; i < months; i++) {
      const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
      out.months.push(d);
      const seatFactor = Math.pow(1 + seatsGrowth, i);
      const usageFactor = Math.pow(1 + usageGrowth, i);
      // Pool bonus window: Jun 1 – Sep 1 2026. Apply credit "bonus" reducing
      // overage during promo by ~20% (baseline benefits from larger pool).
      const promo = (d.getFullYear() === 2026 && d.getMonth() >= 5 && d.getMonth() <= 7); // Jun, Jul, Aug
      const promoFactor = promo ? 0.85 : 1; // headline cushion
      const baseToken = baselineMonthly * seatFactor * usageFactor * promoFactor;
      const baseSubs = subsCost * seatFactor;
      out.baseline.push(baseToken + baseSubs);

      // Optimisation ramp: linear 0→1 over `ramp` months
      const rampF = Math.min(1, (i + 1) / ramp);
      const optimisedReduction = (1 - effectiveSavings(scen, aggUplift) * rampF);
      out.optimised.push(baseToken * optimisedReduction + baseSubs * (1 - 0.15 * Math.min(1, (scen.dormant + aggUplift)) * rampF));
      out.subscription.push(baseSubs);
    }
    return out;
  }

  // Approximate total reduction fraction from scenario inputs
  function effectiveSavings(scen, agg) {
    // Compose multiplicatively (each lever applied to the residual)
    const sub = (scen.substitute + agg) * 0.18;          // up to ~18% from sub
    const wf = (scen.routing + agg) * 0.25;              // up to ~25%
    const cache = (scen.cache + agg) * 0.30;             // up to ~30% (cache best case)
    const loop = (scen.loop + agg/2) * 0.50;             // up to 50% on agent share
    let r = 1;
    r *= (1 - Math.min(0.18, sub));
    r *= (1 - Math.min(0.25, wf));
    r *= (1 - Math.min(0.30, cache));
    r *= (1 - Math.min(0.30, loop * 0.4));               // weight loop by agent share ~40%
    return 1 - r;
  }

  function renderForecast(baselineMonthly, subsCost) {
    const scen = getScenarioInputs();
    $('fc-seats-growth-val').textContent = `+${(+$('fc-seats-growth').value).toFixed(1)}%`;
    $('fc-usage-growth-val').textContent = `+${(+$('fc-usage-growth').value).toFixed(1)}%`;
    $('fc-ramp-val').textContent = `${$('fc-ramp').value} mo`;
    $('fc-aggressive-val').textContent = `+${$('fc-aggressive').value}pp`;

    const fc = computeForecast(scen, baselineMonthly, subsCost, false);
    const fcAgg = computeForecast(scen, baselineMonthly, subsCost, true);

    const W = 1100, H = 380;
    const margin = { top: 16, right: 24, bottom: 36, left: 80 };
    const w = W - margin.left - margin.right; const h = H - margin.top - margin.bottom;
    const c = d3.select('#chart-forecast').html('');
    const svg = c.append('svg').attr('viewBox', `0 0 ${W} ${H}`);
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleTime().domain(d3.extent(fc.months)).range([0, w]);
    const yMax = d3.max(fc.baseline) * 1.1 || 1;
    const y = d3.scaleLinear().domain([0, yMax]).range([h, 0]);

    // Promo shaded background
    const promoStart = new Date(2026, 5, 1), promoEnd = new Date(2026, 8, 1);
    g.append('rect').attr('x', x(promoStart)).attr('width', x(promoEnd) - x(promoStart))
      .attr('y', 0).attr('height', h).attr('fill','var(--attention-subtle)').attr('opacity', 0.6);
    g.append('text').attr('x', (x(promoStart) + x(promoEnd))/2).attr('y', 14)
      .attr('text-anchor','middle').attr('font-size', 11).attr('fill','var(--attention-fg)')
      .text('Promo bonus window');

    g.append('g').attr('class','grid').call(d3.axisLeft(y).ticks(5).tickSize(-w).tickFormat(''));
    g.append('g').attr('class','axis').attr('transform',`translate(0,${h})`)
      .call(d3.axisBottom(x).ticks(d3.timeMonth.every(1)).tickFormat(d3.timeFormat('%b %y')));
    g.append('g').attr('class','axis').call(d3.axisLeft(y).ticks(6).tickFormat(d => fmtMoneyShort(d)));

    const seriesLine = (vals, color, dash) => {
      const pts = vals.map((v, i) => ({ d: fc.months[i], v }));
      g.append('path').datum(pts).attr('fill','none').attr('stroke', color).attr('stroke-width', 2.5)
        .attr('stroke-dasharray', dash || null)
        .attr('d', d3.line().x(p => x(p.d)).y(p => y(p.v)));
      return pts;
    };
    const baselinePts = seriesLine(fc.baseline, 'var(--danger-emphasis)');
    const optPts = seriesLine(fc.optimised, 'var(--accent-emphasis)');
    const aggPts = seriesLine(fcAgg.optimised, 'var(--success-emphasis)', '4,3');

    // Hover overlay
    const allMonths = fc.months.map((d, i) => ({ d, b: fc.baseline[i], o: fc.optimised[i], a: fcAgg.optimised[i] }));
    g.selectAll('rect.hover').data(allMonths).enter().append('rect').attr('class','hover')
      .attr('x', (_, i) => x(fc.months[i]) - (w / fc.months.length / 2))
      .attr('width', w / fc.months.length).attr('y', 0).attr('height', h).attr('fill','transparent')
      .on('mousemove', (e, d) => tooltip.style('opacity',1).style('left',(e.pageX+12)+'px').style('top',(e.pageY-24)+'px')
        .html(`<div class="row"><span class="k">${d3.timeFormat('%B %Y')(d.d)}</span></div>
               <div class="row"><span class="k">Baseline</span><span class="v">${fmtMoneyShort(d.b)}</span></div>
               <div class="row"><span class="k">Optimised</span><span class="v">${fmtMoneyShort(d.o)}</span></div>
               <div class="row"><span class="k">Aggressive</span><span class="v">${fmtMoneyShort(d.a)}</span></div>
               <div class="row"><span class="k">Save vs base</span><span class="v">${fmtMoneyShort(d.b-d.o)}</span></div>`))
      .on('mouseleave', () => tooltip.style('opacity', 0));

    // Cumulative chart
    const W2 = 1100, H2 = 220;
    const m2 = { top: 16, right: 24, bottom: 36, left: 80 };
    const w2 = W2 - m2.left - m2.right; const h2 = H2 - m2.top - m2.bottom;
    const c2 = d3.select('#chart-forecast-cumulative').html('');
    const svg2 = c2.append('svg').attr('viewBox', `0 0 ${W2} ${H2}`);
    const g2 = svg2.append('g').attr('transform', `translate(${m2.left},${m2.top})`);

    const cumOpt = []; const cumAgg = [];
    let so = 0, sa = 0;
    fc.months.forEach((d, i) => {
      so += (fc.baseline[i] - fc.optimised[i]); cumOpt.push(so);
      sa += (fc.baseline[i] - fcAgg.optimised[i]); cumAgg.push(sa);
    });
    const yMax2 = Math.max(d3.max(cumAgg), d3.max(cumOpt)) * 1.1 || 1;
    const y2 = d3.scaleLinear().domain([0, yMax2]).range([h2, 0]);
    g2.append('g').attr('class','grid').call(d3.axisLeft(y2).ticks(5).tickSize(-w2).tickFormat(''));
    g2.append('g').attr('class','axis').attr('transform',`translate(0,${h2})`)
      .call(d3.axisBottom(x).ticks(d3.timeMonth.every(1)).tickFormat(d3.timeFormat('%b %y')));
    g2.append('g').attr('class','axis').call(d3.axisLeft(y2).ticks(5).tickFormat(d => fmtMoneyShort(d)));

    const drawCum = (vals, color, fill) => {
      const pts = vals.map((v, i) => ({ d: fc.months[i], v }));
      g2.append('path').datum(pts).attr('fill', fill).attr('opacity', 0.18).attr('stroke','none')
        .attr('d', d3.area().x(p => x(p.d)).y0(h2).y1(p => y2(p.v)));
      g2.append('path').datum(pts).attr('fill','none').attr('stroke', color).attr('stroke-width', 2.5)
        .attr('d', d3.line().x(p => x(p.d)).y(p => y2(p.v)));
    };
    drawCum(cumOpt, 'var(--accent-emphasis)', 'var(--accent-emphasis)');
    drawCum(cumAgg, 'var(--success-emphasis)', 'var(--success-emphasis)');

    // 12-mo KPI cards
    const baseSum = d3.sum(fc.baseline), optSum = d3.sum(fc.optimised), aggSum = d3.sum(fcAgg.optimised);
    $('fc-base-total').textContent = fmtMoneyShort(baseSum);
    $('fc-opt-total').textContent = fmtMoneyShort(optSum);
    $('fc-opt-sub').textContent = `${((1 - optSum/baseSum)*100).toFixed(0)}% lower than baseline`;
    $('fc-save-total').textContent = fmtMoneyShort(baseSum - optSum);
    $('fc-save-sub').textContent = `over Apr 26 → Apr 27 fleet horizon`;
    $('fc-agg-save').textContent = fmtMoneyShort(baseSum - aggSum);
  }

  // ----- Actions list ----------------------------------------------------
  function renderActions(levers, monthlySaving, totalBase) {
    const ul = $('action-list'); ul.innerHTML = '';
    const sorted = [...levers].sort((a, b) => b.value - a.value);
    const monthScale = 30 / ((DATA.meta && DATA.meta.days) || 28);
    const items = [];
    // Top model swap
    const topSwap = (SUB_ROWS || []).find(r => r.savingPerMo > 0);
    if (topSwap) items.push({
      icon: '🔁',
      title: `Swap ${topSwap.current.name} → ${topSwap.target ? topSwap.target.name : '?'}`,
      body: `Saves <span class="num">${fmtMoneyShort(topSwap.savingPerMo)}/mo</span> at 70% adoption · ${fmtMoneyShort(topSwap.savingPerMo*12)} annualised. ${topSwap.sub ? topSwap.sub.reason : ''}`
    });
    // Top workflow routing
    const topWf = (WF_DATA || []).slice().sort((a, b) => b.savingPerMo - a.savingPerMo)[0];
    if (topWf && topWf.savingPerMo > 0) items.push({
      icon: '🛤️',
      title: `Route ${topWf.label} via ${topWf.cheap.name} (${(topWf.router.cheapShare*100).toFixed(0)}%) + ${topWf.premium.name}`,
      body: `Saves <span class="num">${fmtMoneyShort(topWf.savingPerMo)}/mo</span> · ${(topWf.currentPer/topWf.routedPer).toFixed(2)}× cheaper per interaction. Configure model picker rules so traversal turns prefer the lighter model and only synthesis turns escalate.`
    });
    // Plan mix
    if (LAST_OPT) items.push({
      icon: '🏗️',
      title: `Set plan mix to ${LAST_OPT.bizPct}% Business / ${100 - LAST_OPT.bizPct}% Enterprise`,
      body: `Lowest-cost configuration at the current usage projection: <span class="num">${fmtMoneyShort(LAST_OPT.total)}/mo</span> total. ${LAST_OPT.overage > 0 ? `Includes ${fmtMoneyShort(LAST_OPT.overage*CREDIT_RATE)} of overage — set a budget alert at this threshold.` : 'Pool absorbs projected usage with zero overage.'}`
    });
    // Caching
    items.push({
      icon: '⚡',
      title: 'Roll out prompt caching across stable system prompts',
      body: `Cached input is priced at ~10% of full input. Targeting your top 5 system prompts (typically 8–15K tokens of stable scaffolding) cuts agent-mode and CLI input bills by ~30–40%. Anthropic's 90% cache discount and Google's similar discount both apply.`
    });
    // Dormant
    const dormant = PERSONAS.find(p => p.id === 'dormant');
    if (dormant && dormant.count > 0) items.push({
      icon: '🪥',
      title: `Reclaim ${dormant.count} dormant seat${dormant.count === 1 ? '' : 's'}`,
      body: `${dormant.count} seats register near-zero activity in the period. Reclaiming all of them saves ${fmtMoneyShort(dormant.count * 19)}–${fmtMoneyShort(dormant.count * 39)}/mo (Business / Enterprise list rates) without losing pool headroom that was actually being used.`
    });
    // Loop tightening
    items.push({
      icon: '🔄',
      title: 'Audit agent loops for redundant tool-call traffic',
      body: `Most cloud-agent and CLI cost is input tokens — re-sent context every turn. Adding a "summarise tool output > 2K tokens" rule typically removes 20–40% of agent-mode input volume, the single largest token bucket on this fleet.`
    });

    for (const it of items) {
      const li = document.createElement('li');
      li.innerHTML = `<span class="icon">${it.icon}</span><div class="body"><strong>${it.title}</strong>${it.body}</div>`;
      ul.appendChild(li);
    }
  }

  // ======================================================================
  //  WIRE UP CONTROLS
  // ======================================================================
  ['mix-seats','mix-period','mix-power-share','mix-power-mult'].forEach(id => {
    const el = $(id); if (el) el.addEventListener('input', () => { renderPlanMix(); refreshScenario(); renderBudget(); });
  });
  // Default seat slider to upload's user count
  const uploadedUsers = (DATA.meta && DATA.meta.users) || 0;
  if (uploadedUsers > 0) {
    const sl = $('mix-seats'); const v = Math.max(5, Math.round(uploadedUsers / 5) * 5);
    if (v > +sl.max) sl.max = String(Math.ceil(v * 1.5));
    sl.value = String(v);
  }
  ['scen-substitute','scen-routing','scen-cache','scen-loop','scen-mix','scen-dormant',
   'fc-seats-growth','fc-usage-growth','fc-ramp','fc-aggressive'].forEach(id => {
    const el = $(id); if (el) el.addEventListener('input', refreshScenario);
  });

  // ======================================================================
  //  4. PER-USER QUOTAS & ENTERPRISE OVERAGE BUDGET
  // ======================================================================
  // Quantile helper over a numeric array (handles unsorted input).
  function quantile(arr, q) {
    if (!arr || !arr.length) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const pos = (sorted.length - 1) * q;
    const lo = Math.floor(pos), hi = Math.ceil(pos);
    if (lo === hi) return sorted[lo];
    return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
  }

  // Recommended-cap policy per persona (rationale + quantile + buffer).
  const QUOTA_POLICY = {
    power:   { label: 'Power',   color: 'var(--danger-emphasis)',    quant: 0.95, buffer: 1.15, rationale: 'Cap at <strong>P95 × 1.15</strong>. Keeps the top 5% productive on a normal month and only triggers on genuine runaway loops. These seats <em>must</em> sit on Enterprise to fit under cap without burning subs benefit.' },
    regular: { label: 'Regular', color: 'var(--attention-emphasis)', quant: 0.95, buffer: 1.10, rationale: 'Cap at <strong>P95 × 1.10</strong>. Daily-active devs cluster tightly — a 10% buffer covers month-end pushes without leaving room for runaway agent loops.' },
    light:   { label: 'Light',   color: 'var(--accent-emphasis)',    quant: 0.95, buffer: 1.20, rationale: 'Cap at <strong>P95 × 1.20</strong>. Light users have lumpy adoption; a generous buffer prevents friction when someone graduates to regular use.' },
    dormant: { label: 'Dormant', color: 'var(--fg-muted)',           quant: 0.90, buffer: 1.50, rationale: 'Hard cap at the <strong>per-seat Business allowance</strong>. Dormant seats should never need more — and the cap protects against credential reuse / rogue agents on idle accounts.' },
  };

  function buildQuotaModel() {
    const monthScale = 30 / ((DATA.meta && DATA.meta.days) || 28);
    const out = {};
    for (const p of PERSONAS) {
      const policy = QUOTA_POLICY[p.id];
      const monthlyCredits = (p.users || []).map(u => (u.credits || 0) * monthScale);
      const p50 = quantile(monthlyCredits, 0.50);
      const p90 = quantile(monthlyCredits, 0.90);
      const p95 = quantile(monthlyCredits, 0.95);
      const max = monthlyCredits.length ? d3.max(monthlyCredits) : 0;
      const mean = monthlyCredits.length ? d3.mean(monthlyCredits) : 0;
      let recommendedCap = Math.ceil((p95 * policy.buffer) / 50) * 50; // round to nearest 50 credits
      // Floor for dormant — Business per-seat allowance.
      if (p.id === 'dormant') recommendedCap = 1900;
      // Floor for light — at least the Business allowance, otherwise the cap is below the entitlement.
      if (p.id === 'light' && recommendedCap < 1900) recommendedCap = 1900;
      out[p.id] = {
        persona: p, policy,
        p50, p90, p95, max, mean,
        recommendedCap,
        seats: p.count,
        cappedPoolDemand: recommendedCap * p.count, // worst-case if every seat hit cap
      };
    }
    return out;
  }
  let QUOTAS = buildQuotaModel();

  function renderQuotaCards() {
    const grid = $('quota-cards'); if (!grid) return;
    grid.innerHTML = '';
    for (const p of PERSONAS) {
      const q = QUOTAS[p.id];
      const card = document.createElement('div');
      card.className = 'quota-card';
      card.innerHTML = `
        <div class="top-bar" style="background:${q.policy.color}"></div>
        <h4>${q.policy.label} users</h4>
        <div class="meta">${fmtInt(q.seats)} seats · P95 of monthly credits = ${fmtInt(Math.round(q.p95))}c</div>
        <div class="v">${fmtInt(q.recommendedCap)}<span style="font-size:13px;color:var(--fg-muted);font-weight:500"> c/mo cap</span></div>
        <div class="sub">≈ ${fmtMoney(q.recommendedCap * CREDIT_RATE)} per seat at current rates</div>
        <div class="pcts">
          <div>P50<strong>${fmtInt(Math.round(q.p50))}c</strong></div>
          <div>P90<strong>${fmtInt(Math.round(q.p90))}c</strong></div>
          <div>P95<strong>${fmtInt(Math.round(q.p95))}c</strong></div>
        </div>
        <div class="desc">${q.policy.rationale}</div>
      `;
      grid.appendChild(card);
    }
  }

  function renderQuotaDistribution() {
    const W = 1100, H = 320;
    const margin = { top: 16, right: 24, bottom: 36, left: 70 };
    const w = W - margin.left - margin.right;
    const h = H - margin.top - margin.bottom;
    const c = d3.select('#chart-quota-distribution').html('');
    if (!c.node()) return;
    const svg = c.append('svg').attr('viewBox', `0 0 ${W} ${H}`);
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Flatten users with persona id, sorted descending by monthly credits.
    const monthScale = 30 / ((DATA.meta && DATA.meta.days) || 28);
    const all = [];
    for (const p of PERSONAS) {
      for (const u of (p.users || [])) {
        all.push({ persona: p.id, color: QUOTA_POLICY[p.id].color, credits: (u.credits || 0) * monthScale });
      }
    }
    all.sort((a, b) => b.credits - a.credits);
    if (!all.length) {
      g.append('text').attr('x', w / 2).attr('y', h / 2).attr('text-anchor', 'middle')
        .attr('fill', 'var(--fg-muted)').text('No per-user data available.');
      return;
    }

    const x = d3.scaleBand().domain(all.map((_, i) => i)).range([0, w]).padding(0.1);
    const yMax = d3.max(all, d => d.credits) * 1.1 || 1;
    // Use linear scale (log doesn't help with cap-line readability).
    const y = d3.scaleLinear().domain([0, yMax]).range([h, 0]);
    g.append('g').attr('class', 'grid').call(d3.axisLeft(y).ticks(6).tickSize(-w).tickFormat(''));
    g.append('g').attr('class', 'axis').attr('transform', `translate(0,${h})`)
      .call(d3.axisBottom(x).tickValues(x.domain().filter((_, i) => i % 20 === 0)).tickFormat(d => d));
    g.append('g').attr('class', 'axis').call(d3.axisLeft(y).ticks(6).tickFormat(d => fmtCompact(d) + 'c'));
    g.append('text').attr('class','axis-label').attr('x', w/2).attr('y', h+28).attr('text-anchor','middle').text('Seat rank (descending)');

    g.selectAll('rect.bar').data(all).enter().append('rect').attr('class','bar')
      .attr('x', (d,i) => x(i)).attr('y', d => y(d.credits))
      .attr('width', x.bandwidth()).attr('height', d => h - y(d.credits))
      .attr('fill', d => d.color).attr('opacity', 0.85);

    // Cap lines per persona
    for (const id of ['power','regular','light','dormant']) {
      const cap = QUOTAS[id].recommendedCap;
      if (!cap || cap > yMax) continue;
      g.append('line').attr('x1', 0).attr('x2', w).attr('y1', y(cap)).attr('y2', y(cap))
        .attr('stroke', QUOTA_POLICY[id].color).attr('stroke-width', 1.5).attr('stroke-dasharray', '5,3');
      g.append('text').attr('x', w - 4).attr('y', y(cap) - 4)
        .attr('text-anchor', 'end').attr('font-size', 11).attr('fill', QUOTA_POLICY[id].color).attr('font-weight', 600)
        .text(`${QUOTA_POLICY[id].label} cap · ${fmtInt(cap)}c`);
    }

    // Worst-case pool demand label (bottom-right)
    const worstCase = Object.values(QUOTAS).reduce((s, q) => s + q.cappedPoolDemand, 0);
    const monthlyNeed = BASELINE.totalCredits * monthScale;
    const headroomPct = monthlyNeed ? (1 - monthlyNeed / Math.max(1, worstCase)) * 100 : 0;
    g.append('text').attr('x', w - 4).attr('y', 12)
      .attr('text-anchor','end').attr('font-size', 11).attr('fill','var(--fg-muted)')
      .text(`Worst-case pool demand at caps = ${fmtCompact(worstCase)}c (vs ${fmtCompact(monthlyNeed)}c at trend → ${headroomPct.toFixed(0)}% headroom)`);
  }

  // ----- Enterprise overage budget recommender ---------------------------
  // Models monthly token consumption as need × M, where M is log-normal with
  // µ chosen so E[M] = 1 and σ matches user-supplied volatility. The budget
  // ceiling B (credits) caps overage at min(B, max(0, need×M − pool)).
  // Returns: prob(hit), expected paid overage, expected blocked credits.
  function budgetSimulate(need, pool, sigma, budgetCredits) {
    // Discretise log-normal multiplier into 401 quantiles for stable expectations.
    const N = 401;
    const mu = -0.5 * sigma * sigma; // ensures E[M]=1
    let pHit = 0, ePaid = 0, eBlocked = 0;
    for (let i = 0; i < N; i++) {
      const u = (i + 0.5) / N;
      // Inverse normal via Beasley-Springer-Moro approx (good enough)
      const z = inverseNormal(u);
      const m = Math.exp(mu + sigma * z);
      const realisedNeed = need * m;
      const overage = Math.max(0, realisedNeed - pool);
      const paid = Math.min(overage, budgetCredits);
      const blocked = overage - paid;
      ePaid += paid / N;
      eBlocked += blocked / N;
      if (overage > budgetCredits) pHit += 1 / N;
    }
    return { pHit, ePaid, eBlocked };
  }
  // Acklam-style inverse normal (truncated; accurate enough for our risk math).
  function inverseNormal(p) {
    const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
    const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];
    const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
    const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];
    const pl = 0.02425, ph = 1 - pl;
    let q, r;
    if (p < pl) { q = Math.sqrt(-2 * Math.log(p)); return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1); }
    if (p <= ph) { q = p - 0.5; r = q*q; return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q / (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1); }
    q = Math.sqrt(-2 * Math.log(1 - p)); return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
  }

  function getBudgetInputs() {
    return {
      target: (+$('bud-target').value) / 100,
      sigma:  (+$('bud-vol').value) / 100,
      quotasOn: $('bud-quotas-on').value === 'on',
    };
  }

  function renderBudget() {
    const s = getBudgetInputs();
    $('bud-target-val').textContent = Math.round(s.target * 100);
    $('bud-vol-val').textContent = Math.round(s.sigma * 100);

    const monthScale = 30 / ((DATA.meta && DATA.meta.days) || 28);
    const baseNeed = BASELINE.totalCredits * monthScale;
    // If quotas active, projected need is min(need, sum of capped pools by class).
    const cappedNeed = Object.values(QUOTAS).reduce((sum, q) => {
      // For each persona, capped monthly credits = sum(min(user_credits, cap))
      const cap = q.recommendedCap;
      return sum + (q.persona.users || []).reduce((s2, u) => s2 + Math.min((u.credits || 0) * monthScale, cap), 0);
    }, 0);
    const need = s.quotasOn ? cappedNeed : baseNeed;

    // Pool size from the plan-mix optimum we already computed.
    const opt = LAST_OPT;
    const pool = opt ? opt.pool : 0;
    const subsCost = opt ? opt.subs : 0;
    const projectedOverage = Math.max(0, need - pool);

    // Sweep budget multipliers from 0× to 3× of projected overage.
    const series = [];
    const span = Math.max(1, projectedOverage);
    for (let mult = 0; mult <= 3.0001; mult += 0.05) {
      const B = span * mult;
      const r = budgetSimulate(need, pool, s.sigma, B);
      series.push({ mult, budgetCredits: B, budgetDollars: B * CREDIT_RATE, ...r });
    }
    // Recommendation: smallest budget where pHit ≤ target.
    const reco = series.find(d => d.pHit <= s.target) || series[series.length - 1];
    const uncapped = series[series.length - 1]; // ~3× treats as "no cap"

    // KPI cards
    $('bud-pool').textContent = fmtCompact(pool) + 'c';
    $('bud-pool-sub').textContent = `${opt ? `${opt.bizPct}% Business / ${100 - opt.bizPct}% Enterprise` : '—'} (section 3)`;
    $('bud-need').textContent = fmtCompact(need) + 'c';
    $('bud-need-sub').textContent = s.quotasOn
      ? `${fmtMoneyShort(need * CREDIT_RATE)}/mo · per-user caps active`
      : `${fmtMoneyShort(need * CREDIT_RATE)}/mo · uncapped`;
    $('bud-reco').textContent = fmtMoneyShort(reco.budgetDollars);
    $('bud-reco-sub').textContent = `expected spend ${fmtMoneyShort(reco.ePaid * CREDIT_RATE)}/mo · ${(reco.pHit*100).toFixed(1)}% cap-hit risk`;
    // Worst-case (P99) month: capped = subs + budget (hard ceiling); uncapped = subs + P99(overage)
    const z99 = 2.326; // ~P99
    const p99Need = need * Math.exp(-0.5 * s.sigma * s.sigma + s.sigma * z99);
    const p99Overage = Math.max(0, p99Need - pool);
    const cappedP99 = subsCost + reco.budgetDollars;
    const uncappedP99 = subsCost + p99Overage * CREDIT_RATE;
    $('bud-save').textContent = fmtMoneyShort(cappedP99);
    $('bud-save-sub').textContent = `vs ${fmtMoneyShort(uncappedP99)} uncapped (saves ${fmtMoneyShort(uncappedP99 - cappedP99)} on tail months)`;

    // Chart
    const W = 1100, H = 360;
    const margin = { top: 16, right: 70, bottom: 40, left: 80 };
    const w = W - margin.left - margin.right;
    const h = H - margin.top - margin.bottom;
    const c = d3.select('#chart-budget-curve').html('');
    if (!c.node()) return;
    const svg = c.append('svg').attr('viewBox', `0 0 ${W} ${H}`);
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().domain([0, 3]).range([0, w]);
    const yL = d3.scaleLinear().domain([0, d3.max(series, d => d.ePaid * CREDIT_RATE) * 1.1 || 1]).range([h, 0]);
    const yR = d3.scaleLinear().domain([0, 1]).range([h, 0]);

    g.append('g').attr('class','grid').call(d3.axisLeft(yL).ticks(5).tickSize(-w).tickFormat(''));
    g.append('g').attr('class','axis').attr('transform',`translate(0,${h})`)
      .call(d3.axisBottom(x).ticks(7).tickFormat(d => d.toFixed(1) + '×'));
    g.append('g').attr('class','axis').call(d3.axisLeft(yL).ticks(6).tickFormat(d => fmtMoneyShort(d)));
    g.append('g').attr('class','axis').attr('transform',`translate(${w},0)`)
      .call(d3.axisRight(yR).ticks(5).tickFormat(d3.format('.0%')));
    g.append('text').attr('class','axis-label').attr('x', w/2).attr('y', h+30).attr('text-anchor','middle')
      .text('Budget cap as a multiple of projected monthly overage');
    g.append('text').attr('class','axis-label').attr('transform','rotate(-90)').attr('x', -h/2).attr('y', -52).attr('text-anchor','middle')
      .text('Expected paid overage / mo');
    g.append('text').attr('class','axis-label').attr('transform','rotate(-90)').attr('x', -h/2).attr('y', w + 50).attr('text-anchor','middle').attr('fill','var(--danger-emphasis)')
      .text('Probability of hitting cap');

    const linePaid = d3.line().x(d => x(d.mult)).y(d => yL(d.ePaid * CREDIT_RATE));
    const lineRisk = d3.line().x(d => x(d.mult)).y(d => yR(d.pHit));
    g.append('path').datum(series).attr('fill','none').attr('stroke','var(--accent-emphasis)').attr('stroke-width',2.5).attr('d', linePaid);
    g.append('path').datum(series).attr('fill','none').attr('stroke','var(--danger-emphasis)').attr('stroke-width',2).attr('stroke-dasharray','4,3').attr('d', lineRisk);

    // Recommendation marker
    g.append('line').attr('x1', x(reco.mult)).attr('x2', x(reco.mult)).attr('y1', 0).attr('y2', h)
      .attr('stroke','var(--success-emphasis)').attr('stroke-width', 2).attr('stroke-dasharray','5,3');
    g.append('text').attr('x', x(reco.mult) + 6).attr('y', 14)
      .attr('font-size', 11).attr('fill','var(--success-fg)').attr('font-weight', 600)
      .text(`Recommended: ${reco.mult.toFixed(2)}× = ${fmtMoneyShort(reco.budgetDollars)}/mo`);
    // Target risk horizontal
    g.append('line').attr('x1', 0).attr('x2', w).attr('y1', yR(s.target)).attr('y2', yR(s.target))
      .attr('stroke','var(--danger-emphasis)').attr('stroke-width', 1).attr('stroke-dasharray','2,2').attr('opacity',0.5);

    // Callout summary
    const totalAtReco = subsCost + reco.ePaid * CREDIT_RATE;
    $('budget-callout-title').innerHTML = `Set the org overage budget to <strong>${fmtMoneyShort(reco.budgetDollars)} / month</strong> (${fmtInt(Math.round(reco.budgetCredits))} credits)`;
    $('budget-callout-body').innerHTML = `
      Above the ${fmtCompact(pool)}-credit pool from your optimum mix${s.quotasOn ? ' and per-user caps' : ''}.
      At this budget, the cap is breached in <strong>${(reco.pHit*100).toFixed(1)}% of months</strong> (≤ your ${(s.target*100).toFixed(0)}% target),
      expected paid overage is <strong>${fmtMoneyShort(reco.ePaid * CREDIT_RATE)}/mo</strong>,
      and you save <strong>${fmtMoneyShort((uncapped.ePaid - reco.ePaid) * CREDIT_RATE)}/mo</strong> in expectation
      vs an uncapped policy that lets the worst-case tail flow through unchecked.
      Combined cost at this configuration ≈ <strong>${fmtMoneyShort(totalAtReco)}/mo</strong>
      (subs ${fmtMoneyShort(subsCost)} + expected overage ${fmtMoneyShort(reco.ePaid * CREDIT_RATE)}).
    `;
  }

  function renderQuotasAndBudget() {
    QUOTAS = buildQuotaModel();
    renderQuotaCards();
    renderQuotaDistribution();
    renderBudget();
  }

  // Wire budget controls
  ['bud-target','bud-vol','bud-quotas-on'].forEach(id => {
    const el = $(id); if (el) el.addEventListener('input', renderBudget);
    if (el && el.tagName === 'SELECT') el.addEventListener('change', renderBudget);
  });

  // ======================================================================
  //  GO
  // ======================================================================
  renderHeadline();
  renderPersonas();
  renderSubstitutions();
  renderWorkflow();
  refreshScenario();
  renderQuotasAndBudget();
})();
