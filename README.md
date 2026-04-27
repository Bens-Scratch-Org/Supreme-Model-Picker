# Supreme Model Picker

> **What if GitHub Copilot stopped charging in *premium request units* and started charging in *tokens* tomorrow — who actually wins, and who silently pays the bill?**

Today a Copilot chat with **GPT-4o costs $0**. The same chat with **Claude Opus 4.7 costs $0.30**. The actual provider token cost of those two conversations? Roughly **$0.03** and **$0.07**. PRU and tokens disagree by an order of magnitude — *in opposite directions*. And which way they disagree depends entirely on **how** you use Copilot.

This repo is a deep dive into that disagreement.

## 🔗 Read the story

| | |
|---|---|
| 📊 **[Interactive data story (GitHub Pages)](https://bens-scratch-org.github.io/Supreme-Model-Picker/)** | D3.js walkthrough — tier explainer, multiplier ladder, subsidy bars (with chat ↔ agent toggle), workflow-mode log scale, cost-vs-SWE-bench scatter, and a live calculator that lets you plug in *your* model + workflow + volume. |
| 📄 **[Full analysis (`analysis/model-comparison.md`)](analysis/model-comparison.md)** | The 1,100-line source document. Benchmarks, multipliers, hidden subsidy structure, the 4K/2K assumption stress-test, mode-by-mode token economics, persona-level winners and losers, and per-task model recommendations under both billing models. |

## 🎯 The fundamental question

The original question looks simple: *"Is the PRU multiplier system fair?"*

The answer changes — sometimes flips — depending on a single hidden variable: **how autonomous is your workflow?**

- 💬 **Plain chat (4K in / 2K out).** Ultra-premium models look badly overcharged. Opus 4.7 PRU = $0.30, list-price tokens = $0.07 → **PRU is 4.3× more expensive.** Tokens win.
- 📁 **Chat with `@workspace` (30K in / 8K out).** The gap closes. Opus 4.7 tokens = $0.35 vs $0.30 PRU. Roughly fair.
- 🛠️ **IDE Agent Mode (60K in / 15K out).** Tokens flip past PRU. **PRU now subsidizes the user 2.3×.**
- ⌨️ **Copilot CLI with sub-agents (250K / 60K).** Anthropic's own measured 15× chat-vs-agent figure. **PRU subsidy is now 9×.**
- ☁️ **Cloud agent on a large refactor (1M / 200K).** Token cost: ~$10. PRU charge: $0.30. **PRU subsidy is 33×.**

That same ratio for Opus 4.5/4.6 on a cloud-agent run hits **200×** — two orders of magnitude. It is the single largest hidden subsidy in Copilot's pricing system, and it is invisible in any per-chat analysis.

## 🧩 What this repo answers

1. **Why are the multipliers what they are?** PRU multipliers correlate with provider list-price token cost at **r ≈ 0.80** — real, but loose. The 1.25× → 7.5× jump is a *6× price step against a 1× cost step*; that gap is reasoning-output volume + promotional pricing + deliberate cross-subsidy of the free tier and agentic workflows.
2. **Who is subsidizing whom?** Ultra-premium chat overcharges fund the zero-cost included tier. PRU's *"tool calls don't count"* rule funds every autonomous workflow on every tier. Both subsidies are user-perceived (vs. provider list price) — GitHub's actual cost-to-serve is lower thanks to negotiated commit rates, the Microsoft↔OpenAI revenue-share, Azure-hosted inference, and prompt caching.
3. **What would a token switch actually do?** A casual chat-only Opus user *saves* ~$44/month. An agent-heavy CLI / cloud-agent user *loses* anywhere from $200 to $2,500/month. The free tier disappears for everyone.
4. **What should you do differently under each model?** Per-persona and per-task recommendations grounded in SWE-bench bash-only resolve rates, leaderboard $/instance data, and the Anthropic 4×/15× agentic-token anchor.

## 🛠️ Methodology snapshot

- **Performance data:** [SWE-bench](https://www.swebench.com/) Verified, Bash-Only, Multilingual, Multimodal · [Scale Labs](https://labs.scale.com/) Showdown, HiL-Bench, SWE Atlas
- **Pricing data:** Provider published API rates (Anthropic, OpenAI, Google, xAI), cross-checked against [LiteLLM's dated pricing database](https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json) · [GitHub Copilot supported-models docs](https://docs.github.com/en/copilot/reference/ai-models/supported-models)
- **Agentic-token anchor:** Anthropic's [How we built our multi-agent research system](https://www.anthropic.com/engineering/built-multi-agent-research-system) — 4× chat tokens for single-agent, 15× for multi-agent
- **Real measured agent cost:** SWE-bench bash-only leaderboard's `cost` field — $/instance for one full agent run on one real GitHub issue at provider list pricing
- **Validation pass:** April 25, 2026

## 📁 Repo layout

```
.
├── README.md                       ← you are here
├── analysis/
│   └── model-comparison.md         ← full written analysis (~1,100 lines)
└── docs/                           ← GitHub Pages site
    ├── index.html
    ├── styles.css                  ← GitHub Primer design tokens
    ├── data.js                     ← all figures sourced from the analysis doc
    └── app.js                      ← D3.js charts + interactive calculator
```

The website and the analysis are kept in lockstep — every chart, tier rationale, and impact range on the site is sourced from the markdown.

## 💬 The bottom line

> Two subsidies hold up Copilot's pricing today. The **ultra-premium overcharge** funds the free tier — that one is the headline. The **"tool calls don't count" rule** funds every autonomous workflow on every tier — that one is much, much bigger, and it is invisible until you change the unit of measurement. Token pricing would expose both. Casual chat users would notice. Agent-heavy users would feel it like a tax.

---

Built with [D3.js](https://d3js.org) · Styled with [GitHub Primer](https://primer.style) · Sources: [SWE-bench](https://www.swebench.com/) · [Copilot billing docs](https://docs.github.com/en/copilot/concepts/billing/copilot-requests) · [Anthropic on multi-agent tokens](https://www.anthropic.com/engineering/built-multi-agent-research-system)