// Copilot pricing data story — datasets
// All figures sourced from analysis/model-comparison.md (see footnotes there)

// -------------------- Models --------------------
// Provider list-price token rates ($ per 1M tokens) and Copilot PRU multiplier.
window.MODELS = [
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

window.MODELS.forEach(m => {
  m.pruCost = +(m.mult * 0.04).toFixed(4);
  m.tokenCost = +((m.in * 4 + m.out * 2) / 1000).toFixed(4); // 4K in + 2K out
  m.delta = +(m.pruCost - m.tokenCost).toFixed(4);
});

// -------------------- Workflow modes --------------------
// Token profiles validated against Anthropic 4×/15× and SWE-bench measured costs
window.WORKFLOWS = [
  { id: "chat-simple",   name: "IDE chat (simple)",          inTok: 4000,    outTok: 2000,    multX: 1,    desc: "Stand-alone Q&A, single file open. The original 'baseline chat' the analysis assumed.", icon: "💬" },
  { id: "chat-context",  name: "IDE chat with @workspace",   inTok: 25000,   outTok: 6000,    multX: 4,    desc: "RAG-retrieved chunks dominate input. Gemini-style 'open many files' workflows.", icon: "📁" },
  { id: "agent-mode",    name: "IDE Agent Mode (one task)",  inTok: 60000,   outTok: 15000,   multX: 7,    desc: "5–30 autonomous tool calls per user prompt. Each turn re-sends growing history.", icon: "🛠️" },
  { id: "cli",           name: "Copilot CLI (interactive)",  inTok: 100000,  outTok: 25000,   multX: 17,   desc: "10–100 turns with plan mode + bash. The terminal-native agent.", icon: "⌨️" },
  { id: "cli-subagents", name: "CLI with sub-agents",        inTok: 250000,  outTok: 60000,   multX: 50,   desc: "Lead agent + 3–5 parallel sub-agents. Anthropic's measured 15× chat token figure.", icon: "🌐" },
  { id: "cloud-small",   name: "Cloud agent (small task)",   inTok: 300000,  outTok: 75000,   multX: 60,   desc: "Bug fixes, doc updates. Plan → research → implement → test → PR loop.", icon: "☁️" },
  { id: "cloud-large",   name: "Cloud agent (large task)",   inTok: 1000000, outTok: 200000,  multX: 200,  desc: "Refactors, migrations. 50–500 turns on a GitHub Actions runner.", icon: "🏗️" },
];

// -------------------- PRU tier rationale --------------------
// Each tier explained against actual provider token costs at chat sizes
window.TIER_RATIONALE = [
  {
    tier: "Included",
    mult: "0×",
    pruChat: 0.00,
    tokenChatLo: 0.005,
    tokenChatHi: 0.030,
    examples: ["GPT-5 mini", "GPT-4.1", "GPT-4o"],
    color: "#8250df",
    rationale: "Zero marginal cost per chat — bundled into the seat fee, which more than covers negotiated provider rates at typical usage. The $0.005–$0.03/chat figure is provider list price, not GitHub's actual cost-to-serve.",
    fairness: "Zero-marginal-cost bundle. User-perceived subsidy at list price; on GitHub's books the seat fee covers negotiated inference costs.",
  },
  {
    tier: "Budget Premium",
    mult: "0.25×",
    pruChat: 0.01,
    tokenChatLo: 0.012,
    tokenChatHi: 0.014,
    examples: ["Claude Haiku 4.5", "GPT-5.4 mini", "Grok Code Fast 1"],
    color: "#1a7f37",
    rationale: "Roughly fair pricing. The 0.25× multiplier closely tracks actual token cost for short chats.",
    fairness: "Within 30% of token cost. Honest pricing.",
  },
  {
    tier: "Standard Premium",
    mult: "1×",
    pruChat: 0.04,
    tokenChatLo: 0.025,
    tokenChatHi: 0.042,
    examples: ["GPT-5.2", "Claude Sonnet 4.5", "Gemini 3.1 Pro"],
    color: "#0969da",
    rationale: "Slight chat-mode overcharge for cheaper-token models (Gemini at $0.025), roughly fair for Anthropic Sonnet at $3/$15. Becomes a subsidy in agent modes.",
    fairness: "Chat: PRU charges 5–60% more than tokens. Agent mode: PRU is 5–10× cheaper than tokens.",
  },
  {
    tier: "High Premium",
    mult: "1.25×",
    pruChat: 0.05,
    tokenChatLo: 0.040,
    tokenChatHi: 0.070,
    examples: ["Claude Opus 4.5", "Claude Opus 4.6", "GPT-5.4"],
    color: "#bf8700",
    rationale: "Significant chat-mode subsidy: Opus actually costs $0.07/chat at list price, charged at $0.05. The cloud-agent subsidy reaches 200× for large tasks.",
    fairness: "Always favors the user. 1.4× chat subsidy, 10–200× agent subsidy.",
  },
  {
    tier: "Ultra Premium",
    mult: "7.5×",
    pruChat: 0.30,
    tokenChatLo: 0.070,
    tokenChatHi: 0.340,
    examples: ["Claude Opus 4.7", "GPT-5.5"],
    color: "#cf222e",
    rationale: "Designed to fund the rest of the system. Looks like a 4× markup against simple chats but is near-fair against workspace chats and a subsidy against any agent workflow.",
    fairness: "Chat: PRU charges 1.4–4× tokens. Cloud agent: PRU is 11–33× cheaper than tokens.",
  },
];

// -------------------- Plans --------------------
window.PLANS = [
  { name: "Free",       price: 0,  pru: 50 },
  { name: "Pro",        price: 10, pru: 300 },
  { name: "Pro+",       price: 39, pru: 1500 },
  { name: "Business",   price: 19, pru: 300 },
  { name: "Enterprise", price: 39, pru: 1000 },
];

// -------------------- Winners & losers by profile --------------------
// Updated from the corrected impact-analysis table
window.IMPACT = [
  { profile: "Chat-only, included models",        today: 0,  lo: 1,    hi: 6,    direction: "lose",  blurb: "Free becomes $1–6/mo. Included tier disappears." },
  { profile: "Chat-only, ultra-premium (200/mo)", today: 60, lo: 14,   hi: 16,   direction: "win",   blurb: "Saves $44/mo: 7.5× multiplier finally meets actual token cost." },
  { profile: "Mixed: chat + occasional agent",    today: 60, lo: 80,   hi: 150,  direction: "lose",  blurb: "Loses $20–90/mo. Agent-mode tool calls now bill." },
  { profile: "Heavy IDE Agent Mode",              today: 60, lo: 200,  hi: 600,  direction: "lose",  blurb: "Loses $140–540/mo. 5–30 tool calls per prompt × 200 prompts." },
  { profile: "Heavy CLI / sub-agent",             today: 60, lo: 400,  hi: 1500, direction: "lose",  blurb: "Loses $340–1,440/mo. Sub-agent fan-out is unbounded." },
  { profile: "Heavy cloud-agent (5/day, Opus)",   today: 60, lo: 500,  hi: 2500, direction: "lose",  blurb: "Loses $440–2,440/mo. One large refactor task = $10+ of tokens." },
];

// -------------------- Hidden subsidy (chat baseline + agentic) --------------------
window.SUBSIDY_CHAT = window.MODELS
  .filter(m => m.swe !== null || m.included)
  .map(m => ({ name: m.name, delta: m.delta, pru: m.pruCost, tok: m.tokenCost, included: !!m.included }))
  .sort((a, b) => b.delta - a.delta);

// Same models, but with token cost computed at agent-mode size (60K in / 15K out) — illustrating the flip
window.SUBSIDY_AGENT = window.MODELS
  .filter(m => m.swe !== null || m.included)
  .map(m => {
    const tok = +((m.in * 60 + m.out * 15) / 1000).toFixed(3);
    return { name: m.name, delta: +(m.pruCost - tok).toFixed(3), pru: m.pruCost, tok, included: !!m.included };
  })
  .sort((a, b) => b.delta - a.delta);
