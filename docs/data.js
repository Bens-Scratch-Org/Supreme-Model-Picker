// Data extracted from analysis/model-comparison.md
// All figures sourced from that document; see footnotes there for caveats.

// Models with: PRU multiplier, token costs, SWE-bench bash-only score.
// Token cost per typical chat = 4K input + 2K output tokens at provider list price.
window.MODELS = [
  // name, provider, multiplier, inputPerMTok, outputPerMTok, sweBench, tier
  { name: "GPT-5 mini",        provider: "OpenAI",    mult: 0,    in: 0.25, out: 2.00,  swe: 56.2, tier: "Included",        included: true },
  { name: "GPT-4.1",           provider: "OpenAI",    mult: 0,    in: 2.00, out: 8.00,  swe: null, tier: "Included",        included: true },
  { name: "GPT-4o",            provider: "OpenAI",    mult: 0,    in: 2.50, out: 10.00, swe: null, tier: "Included",        included: true },
  { name: "Claude Haiku 4.5",  provider: "Anthropic", mult: 0.25, in: 1.00, out: 5.00,  swe: 66.6, tier: "Budget Premium" },
  { name: "GPT-5.4 mini",      provider: "OpenAI",    mult: 0.25, in: 0.75, out: 4.50,  swe: null, tier: "Budget Premium" },
  { name: "GPT-5.2",           provider: "OpenAI",    mult: 1,    in: 1.75, out: 14.00, swe: 69.0, tier: "Standard Premium" },
  { name: "GPT-5.2-Codex",     provider: "OpenAI",    mult: 1,    in: 1.75, out: 14.00, swe: 72.8, tier: "Standard Premium" },
  { name: "GPT-5.3-Codex",     provider: "OpenAI",    mult: 1,    in: 1.75, out: 14.00, swe: null, tier: "Standard Premium" },
  { name: "Claude Sonnet 4",   provider: "Anthropic", mult: 1,    in: 3.00, out: 15.00, swe: 64.9, tier: "Standard Premium" },
  { name: "Claude Sonnet 4.5", provider: "Anthropic", mult: 1,    in: 3.00, out: 15.00, swe: 71.4, tier: "Standard Premium" },
  { name: "Claude Sonnet 4.6", provider: "Anthropic", mult: 1,    in: 3.00, out: 15.00, swe: null, tier: "Standard Premium" },
  { name: "Gemini 2.5 Pro",    provider: "Google",    mult: 1,    in: 1.25, out: 10.00, swe: null, tier: "Standard Premium" },
  { name: "Gemini 3.1 Pro",    provider: "Google",    mult: 1,    in: 2.00, out: 12.00, swe: 74.2, tier: "Standard Premium" },
  { name: "GPT-5.4",           provider: "OpenAI",    mult: 1.25, in: 2.50, out: 15.00, swe: null, tier: "High Premium" },
  { name: "Claude Opus 4.5",   provider: "Anthropic", mult: 1.25, in: 5.00, out: 25.00, swe: 76.8, tier: "High Premium" },
  { name: "Claude Opus 4.6",   provider: "Anthropic", mult: 1.25, in: 5.00, out: 25.00, swe: 75.6, tier: "High Premium" },
  { name: "Claude Opus 4.7",   provider: "Anthropic", mult: 7.5,  in: 5.00, out: 25.00, swe: 77.0, tier: "Ultra Premium",   estimated: true },
  { name: "GPT-5.5",           provider: "OpenAI",    mult: 7.5,  in: 5.00, out: 30.00, swe: 75.0, tier: "Ultra Premium",   estimated: true },
];

// Compute derived: PRU cost (overage rate) vs token cost per typical chat (4K in, 2K out)
window.MODELS.forEach(m => {
  m.pruCost = +(m.mult * 0.04).toFixed(4);
  m.tokenCost = +((m.in * 4 + m.out * 2) / 1000).toFixed(4); // (4K * in + 2K * out) / 1M  -> dollars
  m.delta = +(m.pruCost - m.tokenCost).toFixed(4); // positive = PRU overcharges (token wins)
});

// Plan tiers
window.PLANS = [
  { name: "Free",       price: 0,  pru: 50,    overage: null },
  { name: "Pro",        price: 10, pru: 300,   overage: 0.04 },
  { name: "Pro+",       price: 39, pru: 1500,  overage: 0.04 },
  { name: "Business",   price: 19, pru: 300,   overage: 0.04 },
  { name: "Enterprise", price: 39, pru: 1000,  overage: 0.04 },
];

// Personas from the recommendation table
window.PERSONAS = [
  { name: "Casual user",      chats: 50,   today: "GPT-5 mini",      tomorrow: "GPT-5 mini → Haiku",
    summary: "Pricing model barely matters at this volume. Token billing adds <$1/mo." },
  { name: "Daily developer",  chats: 350,  today: "Sonnet 4.5/4.6",  tomorrow: "Gemini 3.1 Pro",
    summary: "Gemini 3.1 Pro at $0.032/chat undercuts Sonnet ($0.042) with similar SWE-bench scores." },
  { name: "Power user",       chats: 1000, today: "Mostly 1× models",tomorrow: "Opus 4.7 freely",
    summary: "Opus 4.7 drops from $0.30 → $0.07/chat — 4× cheaper than today's PRU rate." },
  { name: "Agentic-heavy",    chats: 500,  today: "Tool calls free", tomorrow: "Match model to task",
    summary: "Where token pricing hurts: a 50K-token agent run on Opus is $0.65; same on Haiku is $0.13." },
  { name: "Multilingual team",chats: 400,  today: "Sonnet + Gemini", tomorrow: "Gemini 3 Flash default",
    summary: "Gemini 3 Flash leads multilingual SWE-bench (72.7%) at 1/4 the cost of Sonnet." },
];

// Hidden-subsidy snapshot (from the markdown's subsidy box)
window.SUBSIDY = window.MODELS
  .filter(m => m.swe !== null || m.included)
  .map(m => ({ name: m.name, delta: m.delta, pru: m.pruCost, tok: m.tokenCost, included: !!m.included }))
  .sort((a, b) => b.delta - a.delta);
