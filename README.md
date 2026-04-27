# Supreme Model Picker

🔗 **Live site: https://bens-scratch-org.github.io/Supreme-Model-Picker/**

> [!IMPORTANT]
> **April 27, 2026 — GitHub Copilot is moving to usage-based billing on June 1, 2026.**
> Premium Request Units (PRUs) are being replaced by **GitHub AI Credits** (1 credit = $0.01 USD), billed per token at published API rates. Plan prices are unchanged. **Copilot Business and Enterprise pool every seat's allowance into one organization-wide bucket** with an introductory ~58–80% credit bonus from June 1 to September 1, 2026. Read the [official announcement](https://github.blog/news-insights/company-news/github-copilot-is-moving-to-usage-based-billing/), the [pooling concept doc](https://docs.github.com/en/copilot/concepts/billing/usage-based-billing-for-organizations-and-enterprises), and the [per-token rate card](https://docs.github.com/en/enterprise-cloud@latest/copilot/reference/copilot-billing/models-and-pricing).
>
> The "hypothetical" token-billing scenario this repo modelled in early 2026 is now **confirmed reality**. Both the analysis document and the website have been updated to reflect the transition, including:
> - A new top-level **GitHub AI Credits & Usage-Based Billing** section in [`analysis/model-comparison.md`](analysis/model-comparison.md) covering allowances, pooling, per-token pricing, the rebased annual-multiplier table, and budget controls.
> - A new **Pooling for Business & Enterprise** section on the website with an interactive fleet-shape visualization.
> - A new **AI Credits view** toggle and **Pooled allowance fit** projection on the cost-analysis page (after upload).

> **What changes when GitHub Copilot stops charging in *premium request units* and starts charging in *tokens* on June 1, 2026 — who actually wins, and who silently pays the bill?**

Today (until May 31, 2026) a Copilot chat with **GPT-4o costs $0**. The same chat with **Claude Opus 4.7 costs $0.30**. The actual provider token cost of those two conversations? Roughly **$0.03** and **$0.07**. PRU and tokens disagree by an order of magnitude — *in opposite directions*. And which way they disagree depends entirely on **how** you use Copilot.

This repo is a deep dive into that disagreement and into the June 1, 2026 transition that resolves it.

## 🔗 Read the story

| | |
|---|---|
| 📊 **[Interactive data story (GitHub Pages)](https://bens-scratch-org.github.io/Supreme-Model-Picker/)** | D3.js walkthrough — tier explainer, multiplier ladder, subsidy bars (with chat ↔ agent toggle), workflow-mode log scale, cost-vs-SWE-bench scatter, live calculator (PRU vs AI Credits), and an interactive **pooling visualization** for Business & Enterprise. |
| 📄 **[Full analysis (`analysis/model-comparison.md`)](analysis/model-comparison.md)** | The source document — now ~1,400 lines. Executive summary, GitHub AI Credits + pooling section, benchmarks, multipliers, hidden subsidy structure, mode-by-mode token economics, persona-level winners and losers, per-task recommendations, and the rebased annual-subscriber multiplier table. |
| 📈 **[Cost-analysis page (after upload)](https://bens-scratch-org.github.io/Supreme-Model-Picker/cost-analysis.html)** | Drop a Copilot metrics-export NDJSON file in and get a per-org reconciliation in both **PRU view** (today) and **AI Credits view** (June 1 onward), with a pooled-allowance fit projection for Business / Enterprise plans. |

## 🎯 The fundamental question — answered on April 27

The original question looked simple: *"Is the PRU multiplier system fair?"* The answer changes — sometimes flips — depending on a single hidden variable: **how autonomous is your workflow?**

- 💬 **Plain chat (4K in / 2K out).** Ultra-premium models look badly overcharged. Opus 4.7 PRU = $0.30, list-price tokens = $0.07 → **PRU is 4.3× more expensive.** Tokens win.
- 📁 **Chat with `@workspace` (30K in / 8K out).** The gap closes. Opus 4.7 tokens = $0.35 vs $0.30 PRU. Roughly fair.
- 🛠️ **IDE Agent Mode (60K in / 15K out).** Tokens flip past PRU. **PRU now subsidizes the user 2.3×.**
- ⌨️ **Copilot CLI with sub-agents (250K / 60K).** Anthropic's own measured 15× chat-vs-agent figure. **PRU subsidy is now 9×.**
- ☁️ **Cloud agent on a large refactor (1M / 200K).** Token cost: ~$10. PRU charge: $0.30. **PRU subsidy is 33×.**

That same ratio for Opus 4.5/4.6 on a cloud-agent run hits **200×** — two orders of magnitude. It is the single largest hidden subsidy in Copilot's pricing system. **Starting June 1, 2026 GitHub unwinds it.** For Business and Enterprise plans, **pooled credits across the org** are the cushion: a 100-seat Business org gets a single shared 190,000-credit pool ($1,900/month) — 300,000 credits during the introductory June–August window — that absorbs heavy-tail usage from a few power users without blocking light-user seats.

## 🧩 What this repo answers

1. **Why are the multipliers what they are?** PRU multipliers correlate with provider list-price token cost at **r ≈ 0.80** — real, but loose. The 1.25× → 7.5× jump is a *6× price step against a 1× cost step*; that gap is reasoning-output volume + promotional pricing + deliberate cross-subsidy of the included tier and agentic workflows.
2. **Who is subsidizing whom?** Ultra-premium chat overcharges fund the zero-cost included tier. PRU's *"tool calls don't count"* rule funds every autonomous workflow on every tier. Both subsidies are user-perceived (vs. provider list price) — GitHub's actual cost-to-serve is lower thanks to negotiated commit rates, the Microsoft↔OpenAI revenue-share, Azure-hosted inference, and prompt caching.
3. **What does the June 1, 2026 switch actually do?** A casual chat-only Opus user *saves* ~$44/month. An agent-heavy CLI / cloud-agent user *loses* anywhere from $200 to $2,500/month — unless they're on Business/Enterprise, where pooling smooths it. The included tier disappears for everyone.
4. **How does pooling work for Business & Enterprise?** Allowances aggregate at the billing entity level (1,900 c/seat Business, 3,900 c/seat Enterprise; 3,000 / 7,000 during the Jun–Aug intro). Adding licenses mid-cycle increases the pool immediately; removing licenses takes effect at the next cycle. There is no automatic fallback to a cheaper model — admins must set an overage budget or affected users hit a wall.
5. **What about annual Pro / Pro+ subscribers?** They stay on PRU but the per-model multipliers are **rebased significantly** (Opus 4.6 3× → 27×, Sonnet 4.5 1× → 6×, GPT-5.4 mini 0.33× → 6×). Economically equivalent to AI Credits.
6. **What should you do differently under each model?** Per-persona and per-task recommendations grounded in SWE-bench bash-only resolve rates, leaderboard $/instance data, and the Anthropic 4×/15× agentic-token anchor.

## 🛠️ Methodology snapshot

- **Performance data:** [SWE-bench](https://www.swebench.com/) Verified, Bash-Only, Multilingual, Multimodal · [Scale Labs](https://labs.scale.com/) Showdown, HiL-Bench, SWE Atlas
- **Pricing data:** Provider published API rates (Anthropic, OpenAI, Google, xAI), cross-checked against [LiteLLM's dated pricing database](https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json) · [GitHub Copilot supported-models docs](https://docs.github.com/en/copilot/reference/ai-models/supported-models) · [GitHub Copilot per-token rate card (April 2026)](https://docs.github.com/en/enterprise-cloud@latest/copilot/reference/copilot-billing/models-and-pricing)
- **Agentic-token anchor:** Anthropic's [How we built our multi-agent research system](https://www.anthropic.com/engineering/built-multi-agent-research-system) — 4× chat tokens for single-agent, 15× for multi-agent
- **Real measured agent cost:** SWE-bench bash-only leaderboard's `cost` field — $/instance for one full agent run on one real GitHub issue at provider list pricing
- **Usage-based billing transition source:** [GitHub blog announcement (April 27, 2026)](https://github.blog/news-insights/company-news/github-copilot-is-moving-to-usage-based-billing/) · [Pooling for orgs/enterprises](https://docs.github.com/en/copilot/concepts/billing/usage-based-billing-for-organizations-and-enterprises) · [Models and pricing reference](https://docs.github.com/en/enterprise-cloud@latest/copilot/reference/copilot-billing/models-and-pricing)
- **Validation pass:** April 28, 2026 (post-announcement update)

## 📁 Repo layout

```
.
├── README.md                       ← you are here
├── analysis/
│   └── model-comparison.md         ← full written analysis (~1,400 lines)
└── docs/                           ← GitHub Pages site
    ├── index.html                  ← interactive data story (with pooling section)
    ├── usage.html                  ← Copilot metrics-export NDJSON uploader
    ├── cost-analysis.html          ← post-upload PRU vs AI Credits reconciliation
    ├── styles.css                  ← GitHub Primer design tokens
    ├── data.js                     ← models, AI Credits plans, pool scenarios, annual-multiplier rebase table
    ├── app.js                      ← D3 charts + calculator + pooling visualization
    └── cost-analysis.js            ← per-org reconciliation + pooled-allowance fit
```

The website and the analysis are kept in lockstep — every chart, tier rationale, and impact range on the site is sourced from the markdown.

## 💬 The bottom line

> Two subsidies hold up Copilot's pricing today. The **ultra-premium overcharge** funds the included tier — that one is the headline. The **"tool calls don't count" rule** funds every autonomous workflow on every tier — that one is much, much bigger, and it is invisible until you change the unit of measurement. **On June 1, 2026 GitHub changes the unit of measurement to tokens.** Casual chat users will notice. Agent-heavy individual users will feel it like a tax. Business and Enterprise organizations get pooling and an introductory bonus to cushion the move.

---

Built with [D3.js](https://d3js.org) · Styled with [GitHub Primer](https://primer.style) · Sources: [SWE-bench](https://www.swebench.com/) · [Copilot billing docs](https://docs.github.com/en/copilot/concepts/billing/copilot-requests) · [Anthropic on multi-agent tokens](https://www.anthropic.com/engineering/built-multi-agent-research-system) · [Usage-based billing announcement](https://github.blog/news-insights/company-news/github-copilot-is-moving-to-usage-based-billing/)