# AI Model Analysis: SWE-bench, Scale Labs & GitHub Copilot Cost Analysis

> **Last updated:** April 28, 2026
>
> A comprehensive analysis of frontier AI models across software engineering, coding, and general capability benchmarks sourced from [SWE-bench](https://www.swebench.com/) and [Scale Labs](https://labs.scale.com/), combined with a cost/performance analysis using [GitHub Copilot](https://docs.github.com/en/copilot/concepts/billing/copilot-requests) and [GitHub Models](https://docs.github.com/en/billing/reference/costs-for-github-models) pricing.

> [!CAUTION]
> **GitHub Copilot is moving to usage-based billing on June 1, 2026.** Premium Request Units (PRUs) are being replaced by **GitHub AI Credits** (1 credit = $0.01 USD), billed by token consumption at published API rates. Plan prices do not change; **the PRU multiplier system goes away for monthly subscribers** and is replaced by direct token metering. Annual Pro/Pro+ subscribers stay on PRUs but face **substantially higher multipliers** (e.g., Claude Opus 4.6: 3× → **27×**; Sonnet 4.5: 1× → **6×**). See the new [GitHub AI Credits & Usage-Based Billing](#github-ai-credits--usage-based-billing-effective-june-1-2026) section. Sources: [GitHub Blog](https://github.blog/news-insights/company-news/github-copilot-is-moving-to-usage-based-billing/) · [docs: orgs/enterprises](https://docs.github.com/en/copilot/concepts/billing/usage-based-billing-for-organizations-and-enterprises) · [docs: models & pricing](https://docs.github.com/en/enterprise-cloud@latest/copilot/reference/copilot-billing/models-and-pricing).

> [!NOTE]
> **Copilot Pro, Pro+, and Student signups are temporarily paused** as of April 20, 2026 ([source](https://docs.github.com/en/copilot/about-github-copilot/subscription-plans-for-github-copilot)). Existing subscribers are unaffected. GPT-5.5 was released on April 23, 2026. GitHub has stated usage limits will loosen once usage-based billing is in effect.

---

## Table of Contents

- [Executive Summary](#executive-summary)
- [GitHub AI Credits & Usage-Based Billing (Effective June 1, 2026)](#github-ai-credits--usage-based-billing-effective-june-1-2026)
  - [What's Changing in One Page](#whats-changing-in-one-page)
  - [GitHub AI Credits: The New Unit of Billing](#github-ai-credits-the-new-unit-of-billing)
  - [Plan Allowances Under Usage-Based Billing](#plan-allowances-under-usage-based-billing)
  - [Pooled Credits for Organizations and Enterprises](#pooled-credits-for-organizations-and-enterprises)
  - [Budget Controls and What Happens at the Limit](#budget-controls-and-what-happens-at-the-limit)
  - [Per-Token Pricing for Every Copilot Model](#per-token-pricing-for-every-copilot-model)
  - [Cost per Interaction in AI Credits](#cost-per-interaction-in-ai-credits)
  - [Annual Pro / Pro+ Subscribers: Multipliers Are Going Up](#annual-pro--pro-subscribers-multipliers-are-going-up)
  - [What This Confirms About the Rest of This Document](#what-this-confirms-about-the-rest-of-this-document)
- [Benchmark Overview](#benchmark-overview)
  - [SWE-bench Benchmarks](#swe-bench-benchmarks)
  - [Scale Labs Benchmarks](#scale-labs-benchmarks)
- [Model Performance Summary](#model-performance-summary)
  - [SWE-bench Verified — Top Agents](#swe-bench-verified--top-agents)
  - [SWE-bench Bash-Only — Standardized LM Comparison](#swe-bench-bash-only--standardized-lm-comparison)
  - [SWE-bench Multilingual](#swe-bench-multilingual)
  - [SWE-bench Multimodal](#swe-bench-multimodal)
  - [Scale Labs Showdown — Human Preference](#scale-labs-showdown--human-preference)
- [Comprehensive Model Comparison Table](#comprehensive-model-comparison-table)
- [Model Profiles: Strengths & Weaknesses](#model-profiles-strengths--weaknesses)
- [GitHub Copilot Cost & Multiplier Analysis](#github-copilot-cost--multiplier-analysis)
  - [Copilot Plan Overview](#copilot-plan-overview)
  - [Copilot Premium Request Multipliers](#copilot-premium-request-multipliers)
  - [GitHub Models Direct API Pricing](#github-models-direct-api-pricing)
  - [Cost-per-Performance Analysis](#cost-per-performance-analysis)
  - [Effective Monthly Budget Scenarios](#effective-monthly-budget-scenarios)
  - [Cost Optimization Strategies](#cost-optimization-strategies)
  - [Token-Based Pricing Scenario (Now Reality on June 1, 2026)](#token-based-pricing-scenario-now-reality-on-june-1-2026)
  - [Validating the Token Assumption: Real Usage for High-Multiplier Models](#validating-the-token-assumption-real-usage-for-high-multiplier-models)
  - [Chat vs. Agentic Workflows: Token Profiles by Mode](#chat-vs-agentic-workflows-token-profiles-by-mode)
  - [Recommendations Under a Token-Based Copilot](#recommendations-under-a-token-based-copilot)
- [Best-Suited Use Cases](#best-suited-use-cases)
- [Key Takeaways](#key-takeaways)
- [Methodology Notes](#methodology-notes)
- [Sources](#sources)

---

## Executive Summary

This document is a single, end-to-end answer to two questions: **which AI model should I use for software engineering work?** and **how much will it cost me inside GitHub Copilot — both today, and after the June 1, 2026 switch to usage-based billing?**

The analysis combines three independent data sources: the [SWE-bench](https://www.swebench.com/) family of benchmarks (Verified, Bash-Only, Multilingual, Multimodal — the gold standard for measuring coding capability), [Scale Labs](https://labs.scale.com/) human-preference and agentic evaluations, and the published per-token API rates of every model that Copilot exposes. On top of that we layer the GitHub Copilot pricing structure — first the current Premium Request Unit (PRU) system, then the GitHub AI Credits system that replaces it on June 1, 2026 — and translate raw benchmark numbers into a real-money $/SWE-bench-issue figure for each model on each plan.

**Headline findings — capability:**

- **Claude leads software engineering.** Claude 4.5 Opus tops SWE-bench Bash-Only at 76.8%, and Claude-based agent stacks own the Verified leaderboard top three at ~79%. Claude Opus 4.6 is statistically tied with GPT-5.2 for #1 on Scale Labs Showdown human preference.
- **Gemini 3 Flash is the multilingual champion** (72.7% across 9 languages) and a strong cost/performance contender on Bash-Only at 75.8% for $0.36/instance.
- **MiniMax M2.5 is the dark-horse value leader.** Same 75.8% Bash-Only as Gemini 3 Flash, but at **$0.07/instance** — a 10× cost advantage over Claude Opus.
- **Open-weight models are within striking distance.** DeepSeek V3.2 (70%) and GLM-5 (72.8%) close most of the gap to frontier models at a fraction of the price.
- **Multimodal SWE remains hard.** Even the best systems solve only ~36% of issues that include screenshots or diagrams.

**Headline findings — cost (current PRU model, valid through May 31, 2026):**

- **GPT-5 mini, GPT-4.1, and GPT-4o are free on every paid plan.** They are the silent default for routine work.
- **Claude Haiku 4.5 (0.25×) is the cost king of premium models** — 4× the chat volume of any 1× model at 66.6% SWE-bench.
- **Claude Opus 4.5/4.6 (1.25×) is the high-end sweet spot** — top SWE-bench scores at only 25% above the standard premium rate.
- **The 7.5× ultra-premium tier (Claude Opus 4.7, GPT-5.5) overcharges casual chat by ~4×** versus list-price tokens, but **underprices agentic workflows by 30–200×**. Both subsidies are real, both are user-perceived (provider list price vs PRU), and both are about to change.

**Headline findings — billing transition (June 1, 2026):**

- **Premium Request Units are being retired** for monthly subscribers and replaced by **GitHub AI Credits** at a flat 1 credit = $0.01 USD, billed by token consumption (input + output + cached) at the published per-model API rate. Plan prices do not change.
- **Pooled credits across organizations and enterprises** mean stranded per-seat allowances disappear: a 100-user Copilot Business org gets one 190,000-credit pool ($1,900) shared across the org, rising to 300,000 credits during the June–August promotional period.
- **The "tool calls don't count" rule of PRU goes away.** Every input, output, and cached token in every agentic step is now billable. Heavy IDE-Agent, CLI, and cloud-agent users will see real, measurable monthly bills where today they see a flat charge.
- **Annual Pro and Pro+ subscribers stay on PRUs but with much higher multipliers** — Claude Opus 4.6 jumps from 3× to 27×, Sonnet 4.5 from 1× to 6×, GPT-5.4 from 1× to 6×. Annual plans no longer auto-renew and convert to Copilot Free on expiry.
- **Code completions and Next Edit suggestions remain free and unmetered** on all paid plans.
- **Copilot code review additionally consumes GitHub Actions minutes** on top of AI Credits.

**What you should actually do:**

| If you are… | Today (PRU) | After June 1 (AI Credits) |
|-------------|-------------|---------------------------|
| Casual chat user, included models | Free — keep doing what you're doing | Free — keep doing what you're doing |
| Premium chat user (Opus 4.5/4.6 in chat) | Best value in Copilot today | Slight cost increase; still excellent value |
| Heavy ultra-premium chat user (Opus 4.7, GPT-5.5) | Overpaying — 7.5× ≈ 4× true list cost | **Wins** — pay actual token cost, ~75% reduction |
| IDE Agent Mode user, all premium models | Massively subsidized today | **Loses** — every tool call now billable |
| Copilot CLI / sub-agent / cloud-agent user | Massively, massively subsidized today | **Loses by 10–200×** — biggest behaviour change in this transition |
| Annual Pro / Pro+ subscriber | New ~3-9× multipliers eat your allowance | Convert to monthly to access AI Credits, or downgrade to Free at expiry |

The remainder of this document develops each of these findings in detail — capability benchmarks first, then a per-model strengths/weaknesses profile, then the full PRU cost analysis (which still governs billing through May 31, 2026), then a token-based analysis that was originally framed as hypothetical but is now confirmed reality. A new top-level [GitHub AI Credits & Usage-Based Billing](#github-ai-credits--usage-based-billing-effective-june-1-2026) section directly below summarizes the official numbers GitHub has published.

---

## GitHub AI Credits & Usage-Based Billing (Effective June 1, 2026)

> **All figures in this section are sourced from GitHub's official announcement and documentation:** the [GitHub Blog post (April 27, 2026)](https://github.blog/news-insights/company-news/github-copilot-is-moving-to-usage-based-billing/), [Usage-based billing for individuals](https://docs.github.com/en/copilot/concepts/billing/usage-based-billing-for-individuals), [Usage-based billing for organizations and enterprises](https://docs.github.com/en/copilot/concepts/billing/usage-based-billing-for-organizations-and-enterprises), and [Models and pricing](https://docs.github.com/en/enterprise-cloud@latest/copilot/reference/copilot-billing/models-and-pricing). The PRU-based analysis in subsequent sections describes the billing system that remains in effect through **May 31, 2026** and continues to apply to existing annual Pro/Pro+ subscribers until their renewal date.

### What's Changing in One Page

| Aspect | Today (PRU) | June 1, 2026 (AI Credits) |
|--------|-------------|---------------------------|
| **Unit of billing** | Premium Request Units, 1 PRU per chat × model multiplier | GitHub AI Credits — 1 credit = $0.01 USD |
| **What is metered** | User-initiated prompts only; tool calls free | Every input, output, and cached token at published API rates |
| **Plan prices** | Pro $10, Pro+ $39, Business $19, Enterprise $39 | **Unchanged** |
| **Code completions** | Unlimited on paid plans | **Unlimited on paid plans (unchanged)** |
| **Included tier** | GPT-5 mini, GPT-4.1, GPT-4o at 0× on paid plans | No "free models" — every interaction draws credits |
| **Allowance** | PRUs (e.g., 300/mo Pro, 1,500/mo Pro+) | AI Credits worth your subscription price (e.g., 1,000 = $10 Pro) |
| **Overage rate** | $0.04 per additional PRU | $0.01 per AI Credit (= published per-token rate) |
| **Fallback when exhausted** | Auto-downgrade to a cheaper model | **No fallback** — usage gated by budget controls |
| **Pooling (orgs/enterprises)** | Per-seat, isolated buckets | **Pooled across the billing entity** |
| **Code review** | One PRU per review | AI Credits **plus** GitHub Actions minutes for the runner |
| **Annual Pro/Pro+** | PRU multipliers stable | PRU multipliers **increase** (table below); plans don't auto-renew |
| **Preview bill** | n/a | Available in your **Billing Overview** in early May 2026 |

### GitHub AI Credits: The New Unit of Billing

A **GitHub AI Credit** is a flat, denomination-style billing unit defined as **1 credit = $0.01 USD**. When you use any Copilot feature that calls a model, the interaction's input tokens, output tokens, and cached tokens are each priced at that model's published API rate, summed in dollars, and converted into credits at the fixed cent-per-credit rate.

What is billed in AI Credits:

- Copilot **Chat** (IDE, github.com, mobile)
- Copilot **CLI**
- Copilot **cloud agent** (the GitHub Issues→PR autonomous agent)
- Copilot **Spaces** and **Spark**
- **Third-party coding agents** that integrate via Copilot

What is **not** billed in AI Credits (and remains unmetered on paid plans):

- **Code completions** (the original ghost-text autocompletion feature)
- **Next Edit suggestions**

This is a critical preservation: the in-editor "type and accept" experience that drives most of Copilot's daily-active interactions stays free even after the transition.

### Plan Allowances Under Usage-Based Billing

| Plan | Monthly Price | Included AI Credits | Equivalent USD | Promo (Jun–Aug 2026) |
|------|:------------:|:-------------------:|:--------------:|:--------------------:|
| Copilot Free | $0 | (limited; not yet specified by GitHub) | — | — |
| Copilot Pro | $10/mo | **1,000** | $10 | — |
| Copilot Pro+ | $39/mo | **3,900** | $39 | — |
| Copilot Business | $19/seat/mo | **1,900** per user | $19 | **3,000** ($30) |
| Copilot Enterprise | $39/seat/mo | **3,900** per user | $39 | **7,000** ($70) |

The basic equation is "your monthly allowance in dollars equals your subscription price." After the introductory three-month promotional period (June 1 – September 1, 2026), Copilot Business and Enterprise allowances revert to the standard 1,900 / 3,900 numbers above.

### Pooled Credits for Organizations and Enterprises

This is one of the largest *structural* changes. Today, every Copilot Business or Enterprise seat carries an isolated PRU bucket. Heavy users hit their cap while light users leave PRUs on the table.

Under AI Credits, **per-user allowances are pooled at the billing entity level**:

- A 100-seat Copilot Business org receives a single shared pool of **190,000 AI credits** ($1,900) per month — or **300,000 credits** ($3,000) during the June–August promo.
- Power users can draw more than their nominal 1,900-per-seat allowance; light users effectively donate the difference.
- Adding licenses mid-cycle increases the pool immediately. Removing licenses mid-cycle does **not** shrink the pool — the reduction takes effect at the start of the next billing cycle.

This eliminates "stranded capacity" and is a meaningful win for orgs whose usage distribution is heavy-tailed (which, empirically, almost all of them are).

### Budget Controls and What Happens at the Limit

Admins gain a four-level budget hierarchy:

1. **Enterprise-level** — covers all orgs, repos, and cost centers under the enterprise.
2. **Organization-level** — covers all repos in one org.
3. **Cost-center-level** — covers a single cost center.
4. **User-level** — covers a single user. A `$0` user budget = no Copilot access at all.

Budgets are denominated in USD; consumption is reported in AI Credits at the fixed 1 credit = $0.01 conversion. Each level can be configured for alerts only, hard caps, or "allow overage at published rates."

When a pool is exhausted:

- If "additional usage" is **allowed** → usage continues at per-token list rates, billed to the org.
- If "additional usage" is **not allowed** → Copilot is blocked for that scope until the next billing cycle.
- **There is no automatic fallback to a cheaper model.** This removes a behaviour many users currently rely on as a soft safety net.

### Per-Token Pricing for Every Copilot Model

These are the official per-1M-token rates GitHub publishes for converting model usage into AI Credits. All prices in USD per 1 million tokens; "Cache write" is an Anthropic-only line item.

**OpenAI**

| Model | Category | Input | Cached | Cache Write | Output |
|-------|---------|:-----:|:------:|:-----------:|:------:|
| GPT-4.1 ¹ | Versatile | $2.00 | $0.50 | — | $8.00 |
| GPT-5 mini ¹ | Lightweight | $0.25 | $0.025 | — | $2.00 |
| GPT-5.2 | Versatile | $1.75 | $0.175 | — | $14.00 |
| GPT-5.2-Codex | Powerful | $1.75 | $0.175 | — | $14.00 |
| GPT-5.3-Codex | Powerful | $1.75 | $0.175 | — | $14.00 |
| GPT-5.4 ² | Versatile | $2.50 | $0.25 | — | $15.00 |
| GPT-5.4 mini | Lightweight | $0.75 | $0.075 | — | $4.50 |
| GPT-5.4 nano | Lightweight | $0.20 | $0.02 | — | $1.25 |
| GPT-5.5 | Powerful | $5.00 | $0.50 | — | $30.00 |

**Anthropic** (cache write priced separately)

| Model | Category | Input | Cached | Cache Write | Output |
|-------|---------|:-----:|:------:|:-----------:|:------:|
| Claude Haiku 4.5 | Versatile | $1.00 | $0.10 | $1.25 | $5.00 |
| Claude Sonnet 4 | Versatile | $3.00 | $0.30 | $3.75 | $15.00 |
| Claude Sonnet 4.5 | Versatile | $3.00 | $0.30 | $3.75 | $15.00 |
| Claude Sonnet 4.6 | Versatile | $3.00 | $0.30 | $3.75 | $15.00 |
| Claude Opus 4.5 | Powerful | $5.00 | $0.50 | $6.25 | $25.00 |
| Claude Opus 4.6 | Powerful | $5.00 | $0.50 | $6.25 | $25.00 |
| Claude Opus 4.7 | Powerful | $5.00 | $0.50 | $6.25 | $25.00 |

**Google**

| Model | Category | Input | Cached | Output |
|-------|---------|:-----:|:------:|:------:|
| Gemini 2.5 Pro ³ | Powerful | $1.25 | $0.125 | $10.00 |
| Gemini 3 Flash ⁴ | Lightweight | $0.50 | $0.05 | $3.00 |
| Gemini 3.1 Pro ³ | Powerful | $2.00 | $0.20 | $12.00 |

**xAI**

| Model | Category | Input | Cached | Output |
|-------|---------|:-----:|:------:|:------:|
| Grok Code Fast 1 | Lightweight | $0.20 | $0.02 | $1.50 |

**Fine-tuned (GitHub)**

| Model | Category | Input | Cached | Output |
|-------|---------|:-----:|:------:|:------:|
| Raptor mini ⁵ | Versatile | $0.25 | $0.025 | $2.00 |
| Goldeneye ⁶ | Powerful | $1.25 | $0.125 | $10.00 |

> ¹ GPT-4.1 and GPT-5 mini retain "included" status today; under AI Credits they are simply the cheapest billable models.
> ² GPT-5.4 pricing applies to prompts ≤272K tokens; long-context surcharge applies above.
> ³ Gemini 2.5 Pro and 3.1 Pro pricing applies to prompts ≤200K tokens.
> ⁴ Gemini 3 Flash has no long-context surcharge.
> ⁵ Raptor mini reuses GPT-5 mini pricing.
> ⁶ Goldeneye reuses GPT-5.1-Codex (Gemini 2.5 Pro-equivalent) pricing.

### Cost per Interaction in AI Credits

Translating the per-token rates into a useful day-to-day figure: how many credits does a single typical chat consume? Using the same 4K-input / 2K-output assumption used elsewhere in this document (cache misses, no cache write):

| Model | Token cost (4K in + 2K out) | AI Credits | % of Pro $10 budget | % of Pro+ $39 budget |
|-------|:---------------------------:|:----------:|:-------------------:|:--------------------:|
| GPT-5 mini | $0.005 | 0.5 | 0.05% | 0.013% |
| GPT-4.1 | $0.024 | 2.4 | 0.24% | 0.062% |
| GPT-5.4 mini | $0.012 | 1.2 | 0.12% | 0.031% |
| Claude Haiku 4.5 | $0.014 | 1.4 | 0.14% | 0.036% |
| Grok Code Fast 1 | $0.0038 | 0.4 | 0.04% | 0.010% |
| GPT-5.2 / 5.2-Codex / 5.3-Codex | $0.035 | 3.5 | 0.35% | 0.090% |
| Claude Sonnet 4.5 / 4.6 | $0.042 | 4.2 | 0.42% | 0.108% |
| Gemini 3.1 Pro | $0.032 | 3.2 | 0.32% | 0.082% |
| Gemini 3 Flash | $0.008 | 0.8 | 0.08% | 0.021% |
| Gemini 2.5 Pro | $0.025 | 2.5 | 0.25% | 0.064% |
| GPT-5.4 | $0.040 | 4.0 | 0.40% | 0.103% |
| Claude Opus 4.5 / 4.6 / 4.7 | $0.070 | 7.0 | 0.70% | 0.180% |
| GPT-5.5 | $0.080 | 8.0 | 0.80% | 0.205% |

A Copilot Pro subscriber on a $10 / 1,000-credit plan can therefore expect roughly:

- **~143 chats** with Claude Opus 4.7 (≈ 19% **more** than today's 7.5×-multiplier allowance of ~40)
- **~125 chats** with GPT-5.5 (~ 3× today's allowance)
- **~238 chats** with Claude Sonnet 4.5/4.6 (~80% of today's 1× allowance of 300)
- **~714 chats** with Claude Haiku 4.5 (vs ~1,200 today at 0.25× — Haiku gets *worse* relative value since the included-tier subsidy disappears)
- **~2,000 chats** with GPT-5 mini (down from "unlimited" today on paid plans)

This neatly illustrates the directional message of the entire document: **ultra-premium chat gets cheaper, light-and-included usage gets more expensive, and agentic usage gets *much* more expensive** because the per-chat figures above explode when input tokens grow from 4K to 60K, 250K, or 1M tokens (see [Chat vs. Agentic Workflows](#chat-vs-agentic-workflows-token-profiles-by-mode)).

### Annual Pro / Pro+ Subscribers: Multipliers Are Going Up

Subscribers on existing annual Pro or Pro+ plans **stay on the PRU model** until their plan expires, but the multipliers themselves change on June 1, 2026 — almost universally upward. From the official [Models and pricing](https://docs.github.com/en/enterprise-cloud@latest/copilot/reference/copilot-billing/models-and-pricing#model-multipliers-for-annual-copilot-pro-and-copilot-pro-subscribers) docs:

| Model | Current Multiplier | New Multiplier (Jun 1, 2026) | Change |
|-------|:------------------:|:----------------------------:|:------:|
| Claude Haiku 4.5 | 0.33 | 0.33 | — |
| Claude Sonnet 4 | 1 | 1 | — |
| Claude Sonnet 4.5 | 1 | **6** | 6× |
| Claude Sonnet 4.6 | 1 | **9** | 9× |
| Claude Opus 4.5 | 3 | **15** | 5× |
| Claude Opus 4.6 | 3 | **27** | 9× |
| Claude Opus 4.7 | 7.5 | **27** | 3.6× |
| Gemini 2.5 Pro | 1 | 1 | — |
| Gemini 3 Flash | 0.33 | 0.33 | — |
| Gemini 3 Pro | 1 | **6** | 6× |
| Gemini 3.1 Pro | 1 | **6** | 6× |
| GPT-4o | 0 | 0.33 | from free |
| GPT-4o mini | 0 | 0.33 | from free |
| GPT-4.1 | 0 | 1 | from free |
| GPT-5.1 | 1 | **3** | 3× |
| GPT-5.1-Codex | 1 | **3** | 3× |
| GPT-5.1-Codex-Mini | 0.33 | 0.33 | — |
| GPT-5.1-Codex-Max | 1 | **3** | 3× |
| GPT-5.2 | 1 | **3** | 3× |
| GPT-5.2-Codex | 1 | **3** | 3× |
| GPT-5.3-Codex | 1 | **6** | 6× |
| GPT-5.4 | 1 | **6** | 6× |
| GPT-5.4 mini | 0.33 | **6** | 18× |
| GPT-5 mini | 0 | 0.33 | from free |
| Grok Code Fast 1 | 0.25 | 0.33 | 1.3× |
| Raptor mini | 0 | 0.33 | from free |

Annual subscribers should:

1. **Convert to a monthly plan** before renewal to access AI Credits — GitHub will issue prorated credits for the remainder of the annual term.
2. Or **let the annual plan run out**; it auto-converts to Copilot Free at expiry (no auto-renew).
3. Or **cancel** mid-term with a prorated refund.

The "cheapest practical route" depends on workload mix. Heavy chat-based Opus 4.7 users will save money by switching to monthly + AI Credits (token cost is far below the new 27× multiplier). Heavy agentic users on any premium model are losing PRU's tool-call subsidy either way and should evaluate carefully — see the [Recommendations Under a Token-Based Copilot](#recommendations-under-a-token-based-copilot) section.

### What This Confirms About the Rest of This Document

The earlier sections of this document — particularly [Hypothetical: Token-Based Pricing Scenario](#token-based-pricing-scenario-now-reality-on-june-1-2026), [Chat vs. Agentic Workflows](#chat-vs-agentic-workflows-token-profiles-by-mode), and [Recommendations Under a Token-Based Copilot](#recommendations-under-a-token-based-copilot) — were written before GitHub's April 27, 2026 announcement, when the migration to token billing was a thought experiment. They are now **descriptive, not predictive**. Specifically:

- The "PRU vs token" comparisons describe the actual cost difference between billing through May 31, 2026 and billing from June 1, 2026 onward.
- The "hidden subsidy structure" describes what is being unwound: the tool-call subsidy disappears, the ultra-premium overcharge disappears, and the included-tier zero-cost discount disappears.
- The chat-vs-agent token-profile multipliers (4× single-agent, 15× multi-agent, 33× cloud-agent) directly translate to AI-Credit consumption in the new system.
- The persona-level winner/loser table previously labeled "under tokens" is now labeled "after June 1, 2026."

The one thing GitHub's announcement *adds* that the original analysis did not anticipate is **pooling**, which materially softens the impact for orgs with heavy-tailed usage and for any team that has historically left PRUs unspent on lighter seats. The main capability and value rankings — Claude on quality, Haiku on budget, Opus 4.5/4.6 on sweet-spot, MiniMax on raw cost-efficiency, Gemini on multilingual — are unchanged by the billing transition.

---

## Benchmark Overview

### SWE-bench Benchmarks

[SWE-bench](https://www.swebench.com/) evaluates AI systems on their ability to resolve real-world GitHub issues. It is the gold standard for measuring software engineering capability.

| Benchmark | Instances | Description |
|-----------|-----------|-------------|
| **Verified** | 500 | Human-filtered subset; clear descriptions, correct test patches, and solvable tasks. Created with OpenAI. |
| **Bash-Only** | 500 | Standardized LM comparison using [mini-SWE-agent](https://github.com/SWE-agent/mini-swe-agent) — same scaffold for every model (ReAct loop + bash shell). |
| **Lite** | 300 | Cost-efficient subset of self-contained functional bug fixes. Single-file edits only. |
| **Multilingual** | 300 | Tasks across 9 languages: C, C++, Go, Java, JS/TS, PHP, Ruby, Rust. 42 repositories. |
| **Multimodal** | 517 | Issues containing screenshots, mockups, diagrams, and visual error context. |
| **Full (Test)** | 2,294 | Complete benchmark across 12 Python repositories. |

### Scale Labs Benchmarks

[Scale Labs](https://labs.scale.com/) maintains expert-driven evaluations across multiple dimensions. Key benchmarks include:

| Benchmark | Category | Description |
|-----------|----------|-------------|
| **Showdown** | General | Real-world blind pairwise preference votes from 80+ countries. Elo-style ranking. |
| **HiL-Bench** | Agentic | Human-in-the-Loop — tests if agents know when to ask clarifying questions. |
| **SWE Atlas – Test Writing** | Agentic | Evaluates ability to write tests for real codebases. |
| **SWE Atlas – Codebase QnA** | Agentic | Evaluates ability to answer questions about codebases. |
| **MCP Atlas** | Agentic | Evaluates MCP (Model Context Protocol) tool-use capability. |
| **SWE-Bench Pro** | Agentic | Scale's extended SWE-bench with public and private datasets. |
| **Remote Labor Index (RLI)** | Agentic | Measures real-world task completion for enterprise use. |
| **SEAL Coding** | Legacy | Expert-graded coding across languages, disciplines, and task types. |
| **Instruction Following** | Legacy | Evaluates ability to follow complex, multi-constraint instructions. |
| **Adversarial Robustness** | Safety | Tests model resistance to adversarial attacks and jailbreaks. |
| **Humanity's Last Exam** | Legacy | Extremely difficult expert-level questions across all domains. |

---

## Model Performance Summary

### SWE-bench Verified — Top Agents

These results combine **any agent scaffold** with a language model. Scores reflect the best system built around each model.

| Rank | System | % Resolved | Date |
|------|--------|-----------|------|
| 🥇 1 | live-SWE-agent + Claude 4.5 Opus medium | **79.2%** | Dec 2025 |
| 🥇 1 | Sonar Foundation Agent + Claude 4.5 Opus | **79.2%** | Dec 2025 |
| 🥉 3 | TRAE + Doubao-Seed-Code | **78.8%** | Sep 2025 |
| 4 | live-SWE-agent + Gemini 3 Pro Preview | **77.4%** | Nov 2025 |
| 5 | Atlassian Rovo Dev | **76.8%** | Sep 2025 |
| 5 | EPAM AI/Run + Claude 4 Sonnet | **76.8%** | Aug 2025 |
| 5 | mini-SWE-agent + Claude 4.5 Opus (high reasoning) | **76.8%** | Feb 2026 |
| 8 | ACoder | **76.4%** | Aug 2025 |
| 9 | mini-SWE-agent + Gemini 3 Flash (high reasoning) | **75.8%** | Feb 2026 |
| 9 | mini-SWE-agent + MiniMax M2.5 (high reasoning) | **75.8%** | Feb 2026 |
| 11 | Warp | **75.6%** | Sep 2025 |
| 11 | mini-SWE-agent + Claude Opus 4.6 | **75.6%** | Feb 2026 |
| 13 | TRAE + Claude Sonnet 4 + Opus 4 + Sonnet 3.7 + Gemini 2.5 Pro | **75.2%** | Jun 2025 |
| 14 | Harness AI | **74.8%** | Jul 2025 |
| 14 | Sonar Foundation Agent + Claude 4.5 Sonnet | **74.8%** | Nov 2025 |

### SWE-bench Bash-Only — Standardized LM Comparison

This is the **apples-to-apples** comparison: every model runs through the same minimal [mini-SWE-agent](https://github.com/SWE-agent/mini-swe-agent) scaffold — a simple ReAct loop with just a bash shell. No custom tools, no special scaffolding.

Per-instance cost figures below are taken directly from the leaderboard's reported total run cost divided by 500 instances. They reflect provider list pricing at the time of the run, not Copilot multipliers.

| Rank | Model | % Resolved | Avg Cost/Instance | Cost-Efficiency (% per $) |
|------|-------|-----------|:-----------------:|:-------------------------:|
| 🥇 1 | Claude 4.5 Opus (high reasoning) | **76.8%** | $0.754 | 102 |
| 🥈 2 | Gemini 3 Flash (high reasoning) | **75.8%** | $0.356 | 213 |
| 🥈 2 | MiniMax M2.5 (high reasoning) | **75.8%** | **$0.073** | **1,034** ⭐ |
| 4 | Claude Opus 4.6 | **75.6%** | $0.552 | 137 |
| 5 | Claude 4.5 Opus medium | **74.4%** | $0.721 | 103 |
| 6 | Gemini 3 Pro Preview | **74.2%** | $0.460 | 161 |
| 7 | GPT-5-2 Codex | **72.8%** | $0.449 | 162 |
| 7 | GLM-5 (high reasoning) | **72.8%** | $0.534 | 136 |
| 7 | GPT-5-2 (high reasoning) | **72.8%** | $0.474 | 154 |
| 10 | GPT-5.2 (high reasoning, Dec 2025) | **71.8%** | $0.520 | 138 |
| 11 | Claude 4.5 Sonnet (high reasoning) | **71.4%** | $0.658 | 109 |
| 12 | Kimi K2.5 (high reasoning) | **70.8%** | $0.147 | **482** ⭐ |
| 13 | Claude 4.5 Sonnet | **70.6%** | $0.558 | 126 |
| 14 | DeepSeek V3.2 (high reasoning) | **70.0%** | $0.448 | 156 |
| 15 | Gemini 3 Pro | **69.6%** | $0.960 | 73 |
| 16 | GPT-5.2 | **69.0%** | $0.270 | 256 |
| 17 | Claude 4 Opus | **67.6%** | $1.131 | 60 |
| 18 | Claude 4.5 Haiku (high reasoning) | **66.6%** | $0.331 | 201 |
| 19 | GPT-5.1-codex (medium reasoning) | **66.0%** | $0.589 | 112 |
| 19 | GPT-5.1 (medium reasoning) | **66.0%** | $0.306 | 216 |
| 21 | GPT-5 (medium reasoning) | **65.0%** | $0.280 | 232 |
| 22 | Claude 4 Sonnet | **64.9%** | $0.372 | 175 |
| 23 | Kimi K2 Thinking | **63.4%** | $0.438 | 145 |
| 24 | Minimax M2 | **61.0%** | $0.428 | 142 |
| 25 | DeepSeek V3.2 Reasoner | **60.0%** | **$0.028** | **2,137** ⭐ |
| 26 | GPT-5 mini (medium reasoning) | **59.8%** | $0.035 | **1,685** ⭐ |
| 27 | o3 | **58.4%** | $0.334 | 175 |
| 28 | Devstral small (2512) | **56.4%** | n/a ¹ | — |
| 29 | GPT-5 Mini | **56.2%** | $0.047 | **1,191** ⭐ |
| 30 | Qwen3-Coder 480B/A35B Instruct | **55.4%** | $0.248 | 223 |

> ¹ Devstral run used a free local/self-hosted endpoint; per-instance dollar cost is therefore not reported on the leaderboard.
>
> **Cost-efficiency winners** (% Resolved per $1 spent): DeepSeek V3.2 Reasoner, GPT-5 mini, GPT-5 Mini, MiniMax M2.5, and Kimi K2.5 deliver dramatically more solve-rate per dollar than the top-of-leaderboard Claude/Gemini Pro models. **MiniMax M2.5 is the standout**: it ties Gemini 3 Flash for #2 raw performance at roughly **5x lower cost** ($0.073 vs $0.356 per instance) and only 1.0pp behind the #1 Claude 4.5 Opus run that costs **10x more**. **Gemini 3 Pro is the worst value in the top tier** at $0.96/instance for 69.6% — more expensive than Claude 4.5 Opus while solving 7.2pp fewer instances.

### SWE-bench Multilingual

Tasks across C, C++, Go, Java, JS/TS, PHP, Ruby, and Rust — 300 instances total.

| Rank | Model | % Resolved |
|------|-------|-----------|
| 🥇 1 | Gemini 3 Flash | **72.7%** |
| 🥈 2 | Claude 4.6 Opus | **72.0%** |
| 🥉 3 | Claude 4.5 Opus | **70.7%** |
| 4 | GLM-5 | **69.7%** |
| 5 | Gemini 3 Pro | **68.7%** |
| 6 | Minimax 2.5 | **68.3%** |
| 7 | Kimi K2.5 | **67.3%** |
| 8 | Claude 4.5 Sonnet | **67.0%** |
| 9 | GPT-5.2 (high reasoning) | **66.7%** |
| 10 | GPT-5-2 Codex | **66.3%** |
| 11 | Claude 4.5 Haiku | **64.7%** |
| 12 | DeepSeek V3.2 | **59.0%** |
| 13 | GPT-5 mini | **39.7%** |

### SWE-bench Multimodal

Issues containing visual elements — 517 instances.

| Rank | System | % Resolved |
|------|--------|-----------|
| 🥇 1 | GUIRepair + o3 | **35.98%** ¹ |
| 🥇 1 | Codefuse_Pycfuse_SVR | **35.98%** ² |
| 🥉 3 | Refact.ai Agent | **35.59%** |
| 4 | OpenHands-Versa (Claude-Sonnet 4) | **34.43%** |
| 5 | GUIRepair + o4-mini | **33.85%** |
| 6 | OpenHands-Versa (Claude-3.7 Sonnet) | **31.33%** |
| 7 | GUIRepair + GPT 4.1 | **31.14%** |
| 8 | Zencoder | **30.56%** |
| 9 | GUIRepair + GPT 4o | **30.37%** |
| 10 | Globant Code Fixer Agent | **29.59%** |

> ¹ GUIRepair + o3 result dated July 2025. ² Codefuse_Pycfuse_SVR result dated November 2025 — the most recent submission at the joint #1 score.

### Scale Labs Showdown — Human Preference

Blind pairwise votes from real users. Elo-style rating (higher = better).

| Rank | Model | Elo Rating | Votes |
|------|-------|-----------|-------|
| 🥇 1 | Claude Opus 4.6 | **1078.94** | 40.5K |
| 🥇 1 | GPT-5.2 Chat | **1078.45** | 52.5K |
| 🥉 3 | Claude Sonnet 4.6 | **1056.67** | 21.8K |
| 3 | Claude Opus 4.6 (Thinking) | **1054.88** | 32.9K |
| 3 | Claude Opus 4.5 | **1054.43** | 27.6K |

---

## Comprehensive Model Comparison Table

The table below synthesizes performance across all available benchmarks. Scores are the **% resolved** for SWE-bench splits and **Elo rating** for Scale Showdown.

| Model Family | Model | SWE-bench Verified (bash-only) | SWE-bench Multilingual | SWE-bench Verified (best agent) | Showdown Elo | Best Suited For |
|:---|:---|:---:|:---:|:---:|:---:|:---|
| **Anthropic** | Claude 4.5 Opus (high) | **76.8%** | 70.7% | 79.2% | — | Complex SWE, deep reasoning |
| | Claude Opus 4.6 | 75.6% | 72.0% | 75.6% | **1078.94** | All-around best, general + code |
| | Claude 4.5 Sonnet (high) | 71.4% | 67.0% | 74.8% | 1056.67¹ | Cost-effective coding |
| | Claude 4 Opus | 67.6% | — | 76.8%² | — | Strong agent scaffold base |
| | Claude 4 Sonnet | 64.9% | — | 76.8%² | — | Balanced cost/performance |
| | Claude 4.5 Haiku (high) | 66.6% | 64.7% | — | — | Fast + cheap coding tasks |
| **OpenAI** | GPT-5.2 (high) | 72.8% | 66.7% | — | **1078.45** | General chat + reasoning |
| | GPT-5-2 Codex | 72.8% | 66.3% | 72.8% | — | Dedicated code generation |
| | GPT-5.1 (medium) | 66.0% | — | — | — | Mid-tier coding |
| | GPT-5 (medium) | 65.0% | — | 71.8% | — | General purpose |
| | GPT-5 Mini | 56.2% | 39.7% | — | — | Lightweight, high-volume |
| | o3 | 58.4% | — | — | — | Reasoning-heavy tasks |
| **Google** | Gemini 3 Flash (high) | **75.8%** | **72.7%** | 75.8% | — | Multilingual code, fast |
| | Gemini 3 Pro Preview | 74.2% | 68.7% | 77.4% | — | Strong all-round coding |
| | Gemini 3 Pro | 69.6% | 68.7% | — | — | Reliable general coding |
| **MiniMax** | MiniMax M2.5 (high) | **75.8%** | 68.3% | 75.8% | — | Surprising coding strength |
| | MiniMax M2 | 61.0% | — | — | — | Budget coding |
| **DeepSeek** | DeepSeek V3.2 (high) | 70.0% | 59.0% | — | — | Open-weight coding |
| | DeepSeek V3.2 Reasoner | 60.0% | — | — | — | Reasoning-focused tasks |
| **Moonshot** | Kimi K2.5 (high) | 70.8% | 67.3% | — | — | Multilingual coding |
| | Kimi K2 Thinking | 63.4% | — | — | — | Reasoning tasks |
| **Zhipu AI** | GLM-5 (high) | 72.8% | 69.7% | — | — | Strong multilingual coding |
| **Mistral** | Devstral small (2512) | 56.4% | — | — | — | Small/edge deployment |
| **Alibaba** | Qwen3-Coder 480B/A35B | 55.4% | — | — | — | Open-weight coding |

> ¹ Sonnet 4.6 Elo listed; ² With EPAM AI/Run or Atlassian Rovo scaffolds.

---

## Model Profiles: Strengths & Weaknesses

### Anthropic Claude Family

| Aspect | Assessment |
|--------|------------|
| **Strengths** | Consistently #1 or #2 across SWE-bench splits. Claude 4.5 Opus achieves the highest bash-only score (76.8%). Claude Opus 4.6 tops the Scale Showdown Elo. Excellent at complex multi-step reasoning, large codebase navigation, and generating correct patches. Strong multilingual performance (72.0% for Opus 4.6). Wide model range from Haiku (fast/cheap) to Opus (maximum capability). |
| **Weaknesses** | Opus-tier models are expensive. Multimodal SWE-bench scores (via agent scaffolds) are still moderate. Smaller models (Haiku) see significant drops in multilingual tasks. |
| **Best For** | Complex software engineering, agentic coding systems, enterprise development tools, deep debugging. |

### OpenAI GPT Family

| Aspect | Assessment |
|--------|------------|
| **Strengths** | GPT-5.2 ties for #1 on Scale Showdown (Elo 1078.45). Strong general-purpose performance. GPT-5-2 Codex is purpose-built for coding and scores 72.8% on bash-only. Widest user base and ecosystem integration. Good instruction following. |
| **Weaknesses** | Lags behind Claude and Gemini in bash-only SWE-bench by 2–4 points at top tier. GPT-5 Mini suffers heavily on multilingual (39.7%). o3 reasoning model underperforms on practical coding (58.4%) despite strong reasoning benchmarks. |
| **Best For** | General-purpose chat, enterprise integration, coding with Codex variants, user-facing applications. |

### Google Gemini Family

| Aspect | Assessment |
|--------|------------|
| **Strengths** | Gemini 3 Flash (high reasoning) leads multilingual at 72.7% — best of any model. Gemini 3 Pro Preview hits 74.2% on bash-only, and 77.4% with live-SWE-agent scaffold. Excellent cost-to-performance ratio, especially Flash tier. |
| **Weaknesses** | Limited Showdown data (not in top rankings shown). Fewer agent ecosystem integrations compared to Claude/GPT. Pro models haven't yet surpassed Claude Opus in raw coding. |
| **Best For** | Multilingual software engineering, polyglot codebases, cost-sensitive deployments, fast inference. |

### MiniMax

| Aspect | Assessment |
|--------|------------|
| **Strengths** | M2.5 with high reasoning ties Gemini 3 Flash at 75.8% bash-only — a surprising result. Strong multilingual performance (68.3%). Rapidly improving model family. |
| **Weaknesses** | Less proven in production deployments. Smaller ecosystem and tooling support. Limited Showdown/preference data. |
| **Best For** | Teams looking for strong coding capability from a non-Big-3 provider. Cost-conscious SWE tasks. |

### DeepSeek

| Aspect | Assessment |
|--------|------------|
| **Strengths** | Open-weight models competitive with proprietary ones. V3.2 (high reasoning) hits 70% on bash-only. Active research community. |
| **Weaknesses** | Multilingual drops significantly (59.0%). Reasoner variant (60.0%) doesn't translate reasoning ability into practical coding gains. Smaller model ecosystem. |
| **Best For** | Open-source deployments, self-hosted coding assistants, research applications. |

### Moonshot (Kimi)

| Aspect | Assessment |
|--------|------------|
| **Strengths** | K2.5 strong at 70.8% bash-only with good multilingual scores (67.3%). Competitive with GPT-5 tier models. |
| **Weaknesses** | Limited availability outside China. Smaller tool ecosystem. Less data on agent scaffold performance. |
| **Best For** | Multilingual codebases, CJK-heavy projects, cost-effective coding for specific markets. |

### Zhipu AI (GLM)

| Aspect | Assessment |
|--------|------------|
| **Strengths** | GLM-5 (high reasoning) matches GPT-5-2 Codex at 72.8% bash-only. Excellent multilingual (69.7%). |
| **Weaknesses** | Limited western market presence. Less agent ecosystem support. |
| **Best For** | Multilingual enterprise coding, Chinese-market deployments. |

---

## GitHub Copilot Cost & Multiplier Analysis

### Copilot Plan Overview

GitHub Copilot offers tiered plans with different premium request allowances. On paid plans, the **included models** (GPT-5 mini, GPT-4.1, GPT-4o) consume **zero** premium requests — you can use them unlimitedly (subject to rate limits). All other models consume premium requests according to their multiplier.

| Plan | Price | Premium Requests/Month | Additional Requests | Included Models |
|------|-------|----------------------|--------------------|--------------------|
| **Copilot Free** | $0 | 50 | Not available | GPT-5 mini, GPT-4.1, GPT-4o (1x each) |
| **Copilot Student** | Free | 300 | $0.04/request | GPT-5 mini, GPT-4.1, GPT-4o (0x) |
| **Copilot Pro** | $10/mo | 300 | $0.04/request | GPT-5 mini, GPT-4.1, GPT-4o (0x) |
| **Copilot Pro+** | $39/mo | 1,500 | $0.04/request | GPT-5 mini, GPT-4.1, GPT-4o (0x) |
| **Copilot Business** | $19/seat/mo | 300/user | $0.04/request | GPT-5 mini, GPT-4.1, GPT-4o (0x) |
| **Copilot Enterprise** | $39/seat/mo | 1,000/user | $0.04/request | GPT-5 mini, GPT-4.1, GPT-4o (0x) |

> **Key concept:** On Copilot Free, every model costs 1 premium request per interaction. On paid plans, included models are free, and premium models deduct from your allowance based on their multiplier. Additional premium requests beyond your allowance cost **$0.04 each**.
>
> **Agentic billing:** For agentic features (Copilot CLI, Copilot cloud agent, etc.), only the prompts **you** send count as premium requests. Actions Copilot takes autonomously — such as tool calls, file reads, and intermediate reasoning — do **not** consume premium requests.
>
> **Data residency surcharge:** For GitHub Enterprise Cloud, requests processed with data residency or FedRAMP enforcement include an additional **10% multiplier** on top of the model's base multiplier.

### Copilot Premium Request Multipliers

Each premium model in Copilot has a multiplier that determines how many premium requests each interaction consumes. For example, a model with a 1.25x multiplier consumes 1.25 premium requests per prompt.

> **Auto model selection discount:** Using Auto model selection in VS Code gives a 10% multiplier discount (e.g., a 1x model becomes 0.9x). Not available on Copilot Free.

| Model | Provider | Multiplier (Paid Plans) | Multiplier (Free) | Category |
|-------|----------|:-----------------------:|:------------------:|----------|
| **GPT-5 mini** | OpenAI | **0x** (included) | 1x | Included |
| **GPT-4.1** | OpenAI | **0x** (included) | 1x | Included |
| **GPT-4o** | OpenAI | **0x** (included) | 1x | Included |
| GPT-5.4 mini | OpenAI | **0.25x** | 1x | Budget Premium |
| Claude Haiku 4.5 | Anthropic | **0.25x** | 1x | Budget Premium |
| Grok Code Fast 1 | xAI | **0.25x** | — | Budget Premium |
| Raptor mini | Microsoft | **0.25x** | — | Budget Premium |
| GPT-5.2 | OpenAI | **1x** | 1x | Standard Premium |
| GPT-5.3-Codex | OpenAI | **1x** | — | Standard Premium |
| GPT-5.2-Codex | OpenAI | **1x** | — | Standard Premium |
| Claude Sonnet 4 | Anthropic | **1x** | 1x | Standard Premium |
| Claude Sonnet 4.5 | Anthropic | **1x** | 1x | Standard Premium |
| Claude Sonnet 4.6 | Anthropic | **1x** ¹ | 1x | Standard Premium |
| Gemini 2.5 Pro | Google | **1x** | — | Standard Premium |
| Gemini 3.1 Pro | Google | **1x** | — | Standard Premium |
| GPT-5.4 | OpenAI | **1.25x** | — | High Premium |
| Claude Opus 4.5 | Anthropic | **1.25x** | — | High Premium |
| Claude Opus 4.6 | Anthropic | **1.25x** | — | High Premium |
| Claude Opus 4.7 | Anthropic | **7.5x** ² | — | Ultra Premium |
| GPT-5.5 | OpenAI | **7.5x** ² | — | Ultra Premium |

> ¹ Subject to change. ² These 7.5× multipliers apply to monthly subscribers only through May 31, 2026 — on June 1, 2026 monthly subscribers move to AI Credits (no Copilot multiplier; pay published per-token rates). Annual Pro/Pro+ subscribers see Claude Opus 4.7 rebased to **27×** on June 1, 2026 (see the [annual multiplier table](#annual-pro--pro-subscribers-multipliers-are-going-up)). GPT-5.5 was launched on April 23, 2026 at a promotional 7.5× rate.

### GitHub Models Direct API Pricing

For direct API usage via [GitHub Models](https://docs.github.com/en/billing/reference/costs-for-github-models) (outside Copilot), pricing is token-based at a unified rate of **$0.00001 per token unit**, with model-specific multipliers:

| Model | Input Multiplier | Output Multiplier | Input Price (per 1M tokens) | Output Price (per 1M tokens) |
|-------|:----------------:|:-----------------:|:---------------------------:|:----------------------------:|
| OpenAI GPT-4o | 0.25 | 1.0 | $2.50 | $10.00 |
| OpenAI GPT-4o mini | 0.015 | 0.06 | $0.15 | $0.60 |
| OpenAI GPT-4.1-mini | 0.04 | 0.16 | $0.40 | $1.60 |
| OpenAI GPT-4.1 | 0.2 | 0.8 | $2.00 | $8.00 |
| DeepSeek-R1 | 0.135 | 0.54 | $1.35 | $5.40 |
| DeepSeek-R1-0528 | 0.135 | 0.54 | $1.35 | $5.40 |
| DeepSeek-V3-0324 | 0.114 | 0.456 | $1.14 | $4.56 |
| MAI-DS-R1 | 0.135 | 0.54 | $1.35 | $5.40 |
| Grok 3 | 0.3 | 1.5 | $3.00 | $15.00 |
| Grok 3 Mini | 0.025 | 0.127 | $0.25 | $1.27 |
| Llama 4 Maverick 17B | 0.025 | 0.1 | $0.25 | $1.00 |
| Llama-3.3-70B-Instruct | 0.071 | 0.071 | $0.71 | $0.71 |
| Phi-4 | 0.0125 | 0.05 | $0.13 | $0.50 |
| Phi-4-mini-instruct | 0.0075 | 0.03 | $0.08 | $0.30 |
| Phi-4-multimodal-instruct | 0.008 | 0.032 | $0.08 | $0.32 |

### Cost-per-Performance Analysis

This is the core analysis: mapping **Copilot premium request cost** against **SWE-bench coding performance** to find the best value models.

#### Cost to solve one SWE-bench issue (estimated)

Using the $0.04/premium-request overage rate and SWE-bench bash-only scores, we can estimate the relative cost-efficiency of each model available in Copilot:

| Model | SWE-bench Bash-Only | Copilot Multiplier | Premium Requests per Chat | Cost per Request ($0.04) | Relative Value Score ³ |
|-------|:-------------------:|:------------------:|:------------------------:|:------------------------:|:----------------------:|
| GPT-5 mini | 56.2% | **0x** (free) | 0 | **$0.00** | ∞ (free) |
| GPT-4.1 | — | **0x** (free) | 0 | **$0.00** | ∞ (free) |
| GPT-4o | — | **0x** (free) | 0 | **$0.00** | ∞ (free) |
| Claude Haiku 4.5 | 66.6% | 0.25x | 0.25 | **$0.01** | ⭐⭐⭐⭐⭐ |
| GPT-5.2 | 72.8% | 1x | 1 | **$0.04** | ⭐⭐⭐⭐ |
| Claude Sonnet 4.5 | 71.4% | 1x | 1 | **$0.04** | ⭐⭐⭐⭐ |
| Claude Sonnet 4.6 | — ⁴ | 1x | 1 | **$0.04** | ⭐⭐⭐⭐ |
| GPT-5.3-Codex | — ⁴ | 1x | 1 | **$0.04** | ⭐⭐⭐⭐ |
| GPT-5.2-Codex | 72.8% | 1x | 1 | **$0.04** | ⭐⭐⭐⭐ |
| Gemini 3.1 Pro | ~74.2% ⁵ | 1x | 1 | **$0.04** | ⭐⭐⭐⭐⭐ |
| GPT-5.4 | — ⁴ | 1.25x | 1.25 | **$0.05** | ⭐⭐⭐ |
| Claude Opus 4.5 | 76.8% | 1.25x | 1.25 | **$0.05** | ⭐⭐⭐⭐ |
| Claude Opus 4.6 | 75.6% | 1.25x | 1.25 | **$0.05** | ⭐⭐⭐⭐ |
| Claude Opus 4.7 | — ⁴ | 7.5x | 7.5 | **$0.30** | ⭐⭐ |
| GPT-5.5 | — ⁴ | 7.5x | 7.5 | **$0.30** | ⭐ |

> ³ Value Score = Performance ÷ Cost. Higher stars = better value.
> ⁴ No SWE-bench bash-only score available; ranking inferred from family.
> ⁵ Gemini 3 Pro Preview score used as proxy.

#### Key cost/performance insights

```
Performance per Dollar (SWE-bench % per $0.01 of premium request cost)

Claude Haiku 4.5   ████████████████████████████████████████  66.6% @ $0.01  = 6,660%/$
Gemini 3.1 Pro     ██████████████████                        ~74% @ $0.04   = 1,850%/$
GPT-5.2-Codex      █████████████████                         72.8% @ $0.04  = 1,820%/$
Claude Sonnet 4.5  ████████████████                          71.4% @ $0.04  = 1,785%/$
GPT-5.2            █████████████████                         72.8% @ $0.04  = 1,820%/$
Claude Opus 4.5    ██████████████                            76.8% @ $0.05  = 1,536%/$
Claude Opus 4.6    █████████████                             75.6% @ $0.05  = 1,512%/$
Claude Opus 4.7    ████                                      ~78% @ $0.30   =   260%/$
GPT-5.5            ███                                       ~75% @ $0.30   =   250%/$
GPT-5 mini         ∞ (free on paid plans)                    56.2% @ $0.00
```

### Effective Monthly Budget Scenarios

How many premium-model interactions can you get per month on each plan?

| Plan | Monthly Budget | Included Requests | Using 1x Models | Using 1.25x Models | Using 7.5x Models |
|------|---------------|:-----------------:|:----------------:|:-------------------:|:------------------:|
| **Copilot Pro** | $10/mo + 300 PR | 300 | **300 chats** | **240 chats** | **40 chats** |
| **Copilot Pro+** | $39/mo + 1,500 PR | 1,500 | **1,500 chats** | **1,200 chats** | **200 chats** |
| **Business** | $19/seat + 300 PR | 300/user | **300 chats** | **240 chats** | **40 chats** |
| **Enterprise** | $39/seat + 1,000 PR | 1,000/user | **1,000 chats** | **800 chats** | **133 chats** |

**If you go over your allowance** (at $0.04/premium request):

| Monthly Overage Budget | 1x Model Chats | 1.25x Model Chats | 7.5x Model Chats |
|:----------------------:|:--------------:|:------------------:|:-----------------:|
| $10 extra | 250 | 200 | 33 |
| $25 extra | 625 | 500 | 83 |
| $50 extra | 1,250 | 1,000 | 167 |
| $100 extra | 2,500 | 2,000 | 333 |

### Cost Optimization Strategies

Based on this analysis, here are the optimal model selection strategies:

#### 1. **Best free value — GPT-5 mini (0x)**
GPT-5 mini at 56.2% SWE-bench is surprisingly capable and costs nothing on paid plans. For routine coding tasks, boilerplate, and quick questions, this should be your default.

#### 2. **Best budget premium — Claude Haiku 4.5 (0.25x)**
At just 0.25 premium requests per chat, Haiku 4.5 delivers 66.6% SWE-bench performance — that's 4x the interactions of a 1x model from the same allowance. The best bang-for-buck premium model by far.

#### 3. **Best standard premium — Gemini 3.1 Pro or GPT-5.2-Codex (1x)**
At 1 premium request per chat, these models deliver 72-74% SWE-bench performance. GPT-5.2-Codex is purpose-built for coding; Gemini 3.1 Pro excels in multilingual codebases.

#### 4. **Best high-end value — Claude Opus 4.5/4.6 (1.25x)**
Only 25% more expensive than 1x models, but Claude Opus 4.5 scores 76.8% — the highest bash-only score available. The premium-to-performance ratio is excellent.

#### 5. **Use ultra-premium sparingly — Claude Opus 4.7 / GPT-5.5 (7.5x)**
At 7.5x, each interaction costs as much as 7-8 standard premium chats. Reserve these for critical, complex reasoning tasks where the marginal improvement justifies the 6x cost increase over Opus 4.5/4.6.

#### 6. **Use Auto model selection for 10% savings**
Auto mode provides a 10% multiplier discount (e.g., 1x → 0.9x), letting Copilot pick the best available model while saving premium requests.

#### Strategy Summary

| Task Type | Recommended Model | Multiplier | Why |
|-----------|-------------------|:----------:|-----|
| Quick questions, boilerplate | GPT-5 mini | 0x | Free on paid plans |
| Small edits, lightweight code | Claude Haiku 4.5 | 0.25x | 4x the chats vs 1x models |
| General coding, debugging | GPT-5.2-Codex / Sonnet 4.5 | 1x | Best quality at standard price |
| Multilingual codebases | Gemini 3.1 Pro | 1x | Multilingual leader |
| Complex SWE, deep debugging | Claude Opus 4.5 or 4.6 | 1.25x | Top SWE-bench at modest premium |
| Critical reasoning, architecture | Claude Opus 4.7 / GPT-5.5 | 7.5x | Only when nothing else will do |

### Token-Based Pricing Scenario (Now Reality on June 1, 2026)

> **Update (April 28, 2026):** This section was originally written as a thought experiment about what would happen if GitHub switched Copilot from PRUs to token-based billing. **GitHub announced on April 27, 2026 that exactly this transition will occur on June 1, 2026** — see the new [GitHub AI Credits & Usage-Based Billing](#github-ai-credits--usage-based-billing-effective-june-1-2026) section for the official rates and rules. The numerical analysis below — using provider list prices and the existing Copilot multipliers as a comparison baseline — is preserved because it remains the cleanest way to see *who is being subsidized today and who will pay more under AI Credits*. Treat the "PRU vs Token" math as "billing through May 31 vs billing from June 1 onward." One material difference: GitHub's official AI Credits use the published per-token rates **directly** (1 credit = $0.01 USD, no separate Copilot multiplier), so the "Token Cost" column below is exactly the per-interaction AI Credit charge.

> **Original framing (now confirmed):** What if GitHub switched Copilot from the current Premium Request Unit (PRU) model to direct token-based billing — while keeping the existing model multipliers as cost weighting factors?

#### Provider Direct API Pricing (per 1M tokens)

This is what each model actually costs at the provider level:

| Model | Provider | Input $/MTok | Output $/MTok | Cached Input $/MTok |
|-------|----------|:------------:|:-------------:|:-------------------:|
| **GPT-5.5** | OpenAI | $5.00 | $30.00 | $0.50 |
| **GPT-5.4** | OpenAI | $2.50 | $15.00 | $0.25 |
| **GPT-5.4 mini** | OpenAI | $0.75 | $4.50 | $0.075 |
| **GPT-5.3-Codex** | OpenAI | $1.75 | $14.00 | $0.175 |
| **GPT-5.2-Codex** | OpenAI | $1.75 | $14.00 | $0.175 |
| **GPT-5.2** | OpenAI | $1.75 | $14.00 | $0.175 |
| **GPT-5.1** | OpenAI | $1.25 | $10.00 | $0.125 |
| **GPT-5** | OpenAI | $1.25 | $10.00 | $0.125 |
| **GPT-5 mini** | OpenAI | $0.25 | $2.00 | $0.025 |
| **GPT-4.1** | OpenAI | $2.00 | $8.00 | $0.50 |
| **GPT-4.1 mini** | OpenAI | $0.40 | $1.60 | $0.10 |
| **GPT-4o** | OpenAI | $2.50 | $10.00 | $1.25 |
| **GPT-4o mini** | OpenAI | $0.15 | $0.60 | $0.07 |
| **Claude Opus 4.7** | Anthropic | $5.00 | $25.00 | $0.50 |
| **Claude Opus 4.6** | Anthropic | $5.00 | $25.00 | $0.50 |
| **Claude Opus 4.5** | Anthropic | $5.00 | $25.00 | $0.50 |
| **Claude Sonnet 4.6** | Anthropic | $3.00 | $15.00 | $0.30 |
| **Claude Sonnet 4.5** | Anthropic | $3.00 | $15.00 | $0.30 |
| **Claude Haiku 4.5** | Anthropic | $1.00 | $5.00 | $0.10 |
| **Gemini 3.1 Pro** | Google | $2.00 | $12.00 | $0.20 |
| **Gemini 3 Pro** | Google | $2.00 | $12.00 | $0.20 |
| **Gemini 3 Flash** | Google | $0.50 | $3.00 | $0.05 |
| **Gemini 2.5 Pro** | Google | $1.25 | $10.00 | $0.125 |
| **Gemini 2.5 Flash** | Google | $0.30 | $2.50 | $0.03 |
| **Grok 4** | xAI | $3.00 | $15.00 | — |
| **Grok 3** | xAI | $3.00 | $15.00 | $0.75 |
| **Grok 3 Mini** | xAI | $0.30 | $0.50 | $0.075 |

#### Cost per Copilot Interaction: PRU vs Token-Based

Assuming a typical coding chat interaction of **~4,000 input tokens** (system prompt + code context + user query) and **~2,000 output tokens** (code response):

| Model | Copilot PRU Multiplier | PRU Cost ($0.04 × mult) | Token Cost (4K in + 2K out) | Token Cost Ratio vs PRU | Who Wins? |
|-------|:----------------------:|:-----------------------:|:---------------------------:|:-----------------------:|:---------:|
| GPT-5 mini | 0x (free) | **$0.00** | $0.005 | — | PRU 🏆 |
| GPT-4.1 | 0x (free) | **$0.00** | $0.024 | — | PRU 🏆 |
| GPT-4o | 0x (free) | **$0.00** | $0.030 | — | PRU 🏆 |
| Claude Haiku 4.5 | 0.25x | **$0.010** | $0.014 | 1.4x | PRU 🏆 |
| GPT-5.4 mini | 0.25x | **$0.010** | $0.012 | 1.2x | PRU 🏆 |
| GPT-5.2 | 1x | **$0.040** | $0.035 | 0.88x | Tokens 🏆 |
| Claude Sonnet 4.5 | 1x | **$0.040** | $0.042 | 1.05x | ~Tie |
| Claude Sonnet 4.6 | 1x | **$0.040** | $0.042 | 1.05x | ~Tie |
| Gemini 3.1 Pro | 1x | **$0.040** | $0.032 | 0.80x | Tokens 🏆 |
| Gemini 2.5 Pro | 1x | **$0.040** | $0.025 | 0.63x | Tokens 🏆 |
| GPT-5.4 | 1.25x | **$0.050** | $0.040 | 0.80x | Tokens 🏆 |
| Claude Opus 4.5 | 1.25x | **$0.050** | $0.070 | 1.40x | PRU 🏆 |
| Claude Opus 4.6 | 1.25x | **$0.050** | $0.070 | 1.40x | PRU 🏆 |
| GPT-5.5 | 7.5x | **$0.300** | $0.080 | 0.27x | Tokens 🏆🏆🏆 |
| Claude Opus 4.7 | 7.5x | **$0.300** | $0.070 | 0.23x | Tokens 🏆🏆🏆 |

> Token costs assume 4K input + 2K output tokens. Real interactions vary — agentic workflows may use 10-100x more tokens.

#### Impact Analysis: Who Benefits from Each Pricing Model?

> **Important:** The "users who would benefit from token-based pricing" list below was originally derived using the simple 4K-in / 2K-out chat assumption. **That conclusion holds only for IDE chat mode.** For users who spend any meaningful share of their time in IDE Agent Mode, Copilot CLI, sub-agent flows, or the Copilot cloud agent, the impact reverses — see [Chat vs. Agentic Workflows](#chat-vs-agentic-workflows-token-profiles-by-mode) for the full mode-by-mode analysis. The impact lists below now distinguish between the two cases.

**Users who benefit from current PRU model — chat mode only:**
- Heavy users of **included models** (GPT-5 mini, GPT-4.1, GPT-4o) — these are completely free on paid plans
- Users of **budget premium models** (Haiku 4.5, GPT-5.4 mini) — 0.25x multiplier is an excellent deal
- Users of **Claude Opus 4.5/4.6** — the 1.25x multiplier significantly under-prices the actual $0.07/interaction token cost

**Users who benefit from current PRU model — *across the board, dramatically*:**
- **IDE Agent Mode users** on any premium model — one user prompt triggers 5–30 autonomous tool calls; PRU's "tool calls don't count" rule absorbs all of them
- **Copilot CLI users**, especially those using `plan` mode or sub-agents — token consumption per prompt is 10–100× chat
- **Copilot cloud agent users** on *any* model — a single assignment can burn $0.50–$10+ of tokens that PRU charges as one premium request
- **Anyone whose workflows include test/lint/build retry loops** — every failed iteration re-ingests the failure output as billable input under tokens; PRU shields users entirely

**Users who would benefit from token-based pricing — narrow conditions:**
- Heavy users of **ultra-premium models in chat mode only** (no agent, no CLI, no cloud agent) — the 7.5x multiplier overcharges *only* under the simplified chat assumption
- Users of **Gemini models for short, single-turn chats** — Gemini's $2/$12 token rates beat the 1× PRU charge *only* when context stays small
- Users who **cache aggressively** and stay within tightly-scoped prompts — see the caching wildcard analysis above

**Net winner / loser by workflow mix (corrected):**

| User profile | Today (PRU) | Under tokens | Direction |
|--------------|:-----------:|:------------:|:---------:|
| Chat-only, included models | $0/mo | $1–6/mo | Loses ~$5/mo |
| Chat-only, ultra-premium (200 prompts) | $60/mo | $14–16/mo | **Gains $44/mo** |
| Mixed: chat + occasional agent mode | $60/mo | $80–150/mo | **Loses $20–90/mo** |
| Heavy IDE agent mode user | $60/mo | $200–600/mo | **Loses $140–540/mo** |
| Heavy CLI / sub-agent user | $60/mo | $400–1,500/mo | **Loses $340–1,440/mo** |
| Heavy cloud-agent user (5 tasks/day on Opus) | $60/mo | $500–2,500/mo | **Loses $440–2,440/mo** |

The original analysis only modeled the first two rows. **For every row below them, PRU's flat-per-prompt pricing is a multi-hundred-dollar-per-month subsidy** that token billing would unwind.

#### The Hidden Subsidy Structure

> [!IMPORTANT]
> **All "subsidy" figures in this document use provider *list price* as the cost benchmark.** GitHub's actual cost-to-serve is materially lower because of negotiated commit rates (Microsoft↔OpenAI revenue-share, Anthropic and Google volume agreements), Azure-hosted inference for the OpenAI tier, and provider-side prompt caching / batch discounts. The *relative ordering* of subsidies across tiers is preserved, but the *absolute* GitHub→user transfer is smaller than the tables imply — particularly for the Included tier, where the per-seat fee on a paid plan likely covers the negotiated inference cost with margin to spare. Read the numbers below as a *user-perceived* subsidy (i.e., savings vs. going direct to the provider API at list price), not a P&L subsidy on GitHub's books.
>
> **Multiplier↔cost correlation:** Pearson r ≈ 0.80 between PRU multiplier and blended token chat cost across the 13 model rows in this analysis (≈ 0.79 at agent-mode sizes). The correlation is real but loose — only ~64% of multiplier variance is explained by token cost, leaving substantial room for the strategic and promotional factors discussed below. Crucially, **the multiplier is not monotonic in token cost**: the 1.25× tier spans $0.040–$0.070 of list-price chat cost (a 75% range under one multiplier), and the 7.5× tier has the *same* $0.070 list cost as the 1.25× Opus tier despite charging 6× more. The 1.25× → 7.5× jump is therefore **not** justified by raw input/output rates; it reflects (a) reasoning / adaptive-thinking output volume that inflates *realised* output tokens, (b) promotional pricing during launch (Opus 4.7's 7.5× rate expires April 30, 2026), and (c) deliberate cross-subsidy of the free tier and agentic workflows.

The PRU multiplier system creates an internal subsidy structure:

```
Overcharged (subsidizing others)          │  Undercharged (subsidized)
──────────────────────────────────────────┼──────────────────────────────
Claude Opus 4.7   $0.30 PRU vs $0.07 tok │  GPT-5 mini    $0.00 PRU vs $0.005 tok
GPT-5.5           $0.30 PRU vs $0.08 tok │  GPT-4.1       $0.00 PRU vs $0.024 tok
                                          │  GPT-4o        $0.00 PRU vs $0.030 tok
Gemini 2.5 Pro    $0.04 PRU vs $0.025 tok│  Opus 4.5/4.6  $0.05 PRU vs $0.070 tok
Gemini 3.1 Pro    $0.04 PRU vs $0.032 tok│  Haiku 4.5     $0.01 PRU vs $0.014 tok
```

**Key insight:** The 7.5x ultra-premium models are priced at **3.8–4.3x their actual token cost**, while included models are offered at a 100% discount. This means users of Claude Opus 4.7 and GPT-5.5 are effectively subsidizing the free tier. If GitHub switched to token-based pricing, ultra-premium users would save ~$0.22/interaction, but included-model users would start paying ~$0.005–$0.03/interaction.

#### Hypothetical Token-Based Monthly Costs

For a developer making **200 coding interactions/month** with their primary model:

| Model | Current PRU Cost (200 chats) | Token Cost (200 chats) | Monthly Savings/Penalty |
|-------|:---------------------------:|:----------------------:|:-----------------------:|
| GPT-5 mini | **$0.00** | $1.00 | -$1.00 ⬇️ |
| GPT-4.1 | **$0.00** | $4.80 | -$4.80 ⬇️ |
| GPT-4o | **$0.00** | $6.00 | -$6.00 ⬇️ |
| Claude Haiku 4.5 | **$2.00** | $2.80 | -$0.80 ⬇️ |
| GPT-5.2 | **$8.00** | $7.00 | +$1.00 ⬆️ |
| Claude Sonnet 4.6 | **$8.00** | $8.40 | -$0.40 ⬇️ |
| Gemini 3.1 Pro | **$8.00** | $6.40 | +$1.60 ⬆️ |
| Claude Opus 4.6 | **$10.00** | $14.00 | -$4.00 ⬇️ |
| GPT-5.5 | **$60.00** | $16.00 | +$44.00 ⬆️ |
| Claude Opus 4.7 | **$60.00** | $14.00 | +$46.00 ⬆️ |

> Assumes 4K input + 2K output tokens per interaction. PRU costs use $0.04/premium request × multiplier. Included models show only overage cost (free within plan allowance).

#### Token-Based Pricing: Verdict

| Factor | PRU Model (Current) | Token-Based (Hypothetical) |
|--------|:-------------------:|:--------------------------:|
| **Simplicity** | ✅ Simple per-request billing | ❌ Complex per-token metering |
| **Predictability** | ✅ Fixed cost per chat | ❌ Varies by prompt length |
| **Free tier value** | ✅ 3 models completely free | ❌ Every interaction has a cost |
| **Ultra-premium fairness** | ❌ 7.5x massively overcharges | ✅ Pay actual cost |
| **Budget management** | ✅ Easy to forecast monthly spend | ❌ Hard to predict token usage |
| **Agentic workflows** | ✅ Only user prompts count | ❌ All tokens billed (expensive for agents) |
| **Power user value** | ❌ Penalizes heavy Opus/GPT-5.5 users | ✅ Pay proportional to usage |

**Bottom line:** The PRU model strongly favors casual-to-moderate users who stay within included models and occasionally use standard premium. Token-based pricing would dramatically benefit heavy users of ultra-premium models but would remove the zero-cost included tier that makes Copilot's baseline so attractive. The current PRU system is likely a deliberate strategic choice: subsidize the premium tier from ultra-premium overcharges while keeping the base experience free to maximize adoption.

### Validating the Token Assumption: Real Usage for High-Multiplier Models

> **Premise:** Every dollar figure in the [Hypothetical: Token-Based Pricing Scenario](#hypothetical-token-based-pricing-scenario) above sits on top of a single load-bearing assumption — that a "typical Copilot chat" is **4K input + 2K output tokens**. This section pressure-tests that number against published vendor data, model architecture changes (especially adaptive thinking on Claude Opus 4.7), and what we actually know about Copilot's request shape. The headline finding: **the 4K/2K assumption substantially understates real usage for the high-multiplier models the PRU/token comparison most affects.** Re-running the math with realistic figures changes — and in some cases reverses — the verdict.

#### Why 4K/2K is a low-end "simple chat" estimate

The 4K-in / 2K-out figure is reasonable for a *standalone* API call: a short system prompt, a single user question, a moderate code response. Inside Copilot it leaves out at least five major sources of input/output expansion:

1. **Copilot's system prompt and tool schemas.** GitHub doesn't publish exact sizes, but reverse-engineered captures of VS Code Copilot Chat traffic put the system prompt + tool definitions in the **2–7K-token range** before any user input is added. This is a per-turn fixed cost that the 4K input figure is supposed to absorb in its entirety — leaving virtually nothing for actual user code or context.
2. **Workspace / RAG context.** `@workspace` queries, attached files, and the "open editors" auto-context routinely add **5–50K input tokens** depending on workspace size. The Copilot docs explicitly recommend opening multiple relevant files to give the model "a bigger picture of your project" ([source](https://github.blog/ai-and-ml/github-copilot/how-to-use-github-copilot-in-your-ide-tips-tricks-and-best-practices/)) — every one of those files is billable input.
3. **Multi-turn history re-sent each turn.** Stateless chat APIs require re-sending the full conversation on every turn. A five-turn conversation with 2K output each turn means turn 5 carries ~10K of prior assistant output back into input, *plus* the original system prompt and context. Anthropic explicitly notes that "current assistant turn thinking *does* count toward your input tokens" on the next turn ([token counting docs](https://docs.anthropic.com/en/docs/build-with-claude/token-counting)).
4. **Extended / adaptive thinking.** This is the big one for the 7.5× tier and is detailed below.
5. **Tool call traces in agent mode.** Copilot CLI, the cloud agent, and `@workspace` all involve tool calls whose responses are billed as input on the next turn. Anthropic's Claude Code docs say "a single debugging session or codebase exploration might generate and consume tens of thousands of tokens" ([source](https://www.anthropic.com/engineering/claude-code-best-practices)).

#### The Opus 4.7 thinking problem

For ultra-premium models, the assumption breaks even harder because of architecture changes that didn't exist when the original 4K/2K rule of thumb was set:

- **Claude Opus 4.7 supports only [adaptive thinking](https://docs.anthropic.com/en/docs/build-with-claude/adaptive-thinking).** Manual `budget_tokens` is rejected with a 400 error. Thinking is on by default at `effort: high`, and per Anthropic's own documentation: *"At the default effort level (high), Claude almost always thinks. … xhigh — Claude always thinks deeply with extended exploration. Available on Claude Opus 4.7."*
- **Thinking tokens are billed as output.** Opus 4.7 supports up to **128K output tokens**. Even a moderate reasoning trace of 4–10K thinking tokens — well within typical adaptive thinking budgets observed in the wild — adds **2–5× the output volume** of the 2K-out assumption.
- **GPT-5.5 has the same property.** Like other GPT-5-series reasoning models, internal reasoning tokens count against output billing. OpenAI's own pricing pages list GPT-5.5 at $5/$30 per MTok specifically because the $30 output rate is amortizing reasoning tokens.

In other words: for Opus 4.7 and GPT-5.5, the act of using the model *as designed* — with reasoning enabled — guarantees the chat is not 4K/2K. It's much closer to 8K/8K at minimum.

#### Anthropic's own published benchmark

Anthropic's research engineering blog [How we built our multi-agent research system](https://www.anthropic.com/engineering/built-multi-agent-research-system) gives a concrete external reference point:

> *"In our data, agents typically use about **4× more tokens than chat interactions**, and multi-agent systems use about **15× more tokens** than chats."*

This is from production Claude usage, by Anthropic, on the same model family Copilot resells. It is the most credible single-number anchor available for "what does a real agent chat cost." Applied to the 4K/2K baseline:

| Workload type | Multiplier vs. baseline chat | Realistic input + output |
|--------------|:----------------------------:|:------------------------:|
| Standalone simple chat (the doc's baseline) | 1× | 4K + 2K |
| **Typical Copilot chat with workspace context** | ~2× | **8K + 4K** |
| Single-agent run (Anthropic figure) | ~4× | 16K + 8K |
| Multi-agent / cloud-agent run (Anthropic figure) | ~15× | 60K + 30K |

#### Re-running the PRU vs token math at realistic chat sizes

The 4K/2K assumption made every high-multiplier model look like a token-pricing winner. Holding PRU costs constant (they don't depend on token count) and rebasing the token side at realistic sizes for each workload type:

**Claude Opus 4.7 (PRU: $0.30/chat at 7.5× ; tokens: $5 in / $25 out)**

| Scenario | Input | Output | Token cost | Vs. PRU | Winner |
|----------|:-----:|:------:|:----------:|:-------:|:------:|
| Original assumption (no thinking, no context) | 4K | 2K | **$0.070** | 0.23× | Tokens 🏆🏆🏆 |
| Realistic Copilot chat (system prompt + open files + light thinking) | 8K | 4K | **$0.140** | 0.47× | Tokens 🏆🏆 |
| Adaptive thinking at default high effort (4–8K thinking tokens) | 8K | 8K | **$0.240** | 0.80× | Tokens 🏆 (slim) |
| `@workspace` query + xhigh thinking | 30K | 12K | **$0.450** | **1.50×** | **PRU 🏆** |
| Multi-file refactor / agent run with thinking | 50K | 20K | **$0.750** | **2.50×** | **PRU 🏆🏆** |
| Cloud-agent / CLI session (15× per Anthropic) | 60K | 30K | **$1.050** | **3.50×** | **PRU 🏆🏆🏆** |

**GPT-5.5 (PRU: $0.30/chat at 7.5× ; tokens: $5 in / $30 out)**

| Scenario | Input | Output | Token cost | Vs. PRU | Winner |
|----------|:-----:|:------:|:----------:|:-------:|:------:|
| Original assumption | 4K | 2K | **$0.080** | 0.27× | Tokens 🏆🏆🏆 |
| Realistic Copilot chat | 8K | 4K | **$0.160** | 0.53× | Tokens 🏆 |
| With reasoning tokens (output dominates) | 8K | 10K | **$0.340** | **1.13×** | **PRU 🏆** |
| `@workspace` + reasoning | 30K | 12K | **$0.510** | **1.70×** | **PRU 🏆🏆** |
| Agent-style usage | 60K | 30K | **$1.200** | **4.00×** | **PRU 🏆🏆🏆** |

**The reversal point is shockingly close.** Opus 4.7 stops being a "tokens win" pick the moment a chat involves a workspace lookup, an attached PDF, or even a few thousand thinking tokens — all of which are *normal* for the kind of work people actually pay 7.5× for.

#### What about high-multiplier models lower in the stack?

The same exercise for the 1.25× tier (Claude Opus 4.5/4.6, GPT-5.4) and the next-tier-down 7.5× alternative (the as-yet-unreleased successors people might compare against):

**Claude Opus 4.5/4.6 (PRU: $0.05/chat at 1.25× ; tokens: $5 in / $25 out)**

| Scenario | Input | Output | Token cost | Vs. PRU | Winner |
|----------|:-----:|:------:|:----------:|:-------:|:------:|
| Original assumption | 4K | 2K | **$0.070** | 1.40× | PRU 🏆 |
| Realistic Copilot chat | 8K | 4K | **$0.140** | **2.80×** | **PRU 🏆🏆** |
| With workspace context | 30K | 8K | **$0.350** | **7.00×** | **PRU 🏆🏆🏆** |

The PRU model is even *more* of a bargain for Opus 4.5/4.6 than the original analysis suggested. Under realistic usage these models are subsidized by 2–7×, not 1.4×.

**GPT-5.4 (PRU: $0.05/chat at 1.25× ; tokens: $2.50 in / $15 out)**

| Scenario | Input | Output | Token cost | Vs. PRU | Winner |
|----------|:-----:|:------:|:----------:|:-------:|:------:|
| Original assumption | 4K | 2K | **$0.040** | 0.80× | Tokens 🏆 |
| Realistic Copilot chat | 8K | 4K | **$0.080** | **1.60×** | **PRU 🏆** |
| With workspace context | 30K | 8K | **$0.195** | **3.90×** | **PRU 🏆🏆** |

GPT-5.4 also flips: the original analysis called it a "tokens win" only because the assumption was unrealistically small.

#### The caching wildcard

Anthropic and Google both offer **prompt caching at ~90% off** ($0.50/MTok cached read vs $5/MTok input for Opus). If Copilot aggressively caches its system prompt and stable workspace context — which would be the rational thing to do — the input side of the token bill drops substantially:

| Cache hit rate on input | Effective input rate (Opus 4.7) | 30K-input chat cost | Vs. PRU |
|:-----------------------:|:-------------------------------:|:-------------------:|:-------:|
| 0% (no caching, baseline) | $5.00/MTok | $0.450 (30K @ $5 + 12K @ $25) | 1.50× |
| 50% cached | $2.75/MTok | $0.383 | 1.27× |
| 90% cached (hot system prompt) | $0.95/MTok | $0.329 | 1.10× |

Caching reduces but does not eliminate the realistic-usage flip. Even at a 90% cache hit rate, a workspace-context chat with adaptive thinking on Opus 4.7 costs *more* than the PRU charge. **Caching is the lever that keeps token pricing competitive for power users — not a silver bullet that brings ultra-premium back into "always cheaper" territory.**

#### The corrected hidden-subsidy picture

Recomputing the [hidden subsidy structure](#the-hidden-subsidy-structure) with realistic Copilot chat sizes (8K in / 4K out for non-reasoning models, 8K in / 8K out for adaptive-thinking ultra-premium):

```
Overcharged (subsidizing others)              │  Undercharged (subsidized)
──────────────────────────────────────────────┼──────────────────────────────
                                              │  Claude Opus 4.7  $0.30 PRU vs $0.24 tok (light)
                                              │  GPT-5.5          $0.30 PRU vs $0.34 tok (with reasoning)
Gemini 2.5 Pro    $0.04 PRU vs $0.05 tok      │  Opus 4.5/4.6     $0.05 PRU vs $0.14 tok
Gemini 3.1 Pro    $0.04 PRU vs $0.064 tok     │  Haiku 4.5        $0.01 PRU vs $0.028 tok
GPT-5.2           $0.04 PRU vs $0.07 tok      │  GPT-4.1          $0.00 PRU vs $0.048 tok
                                              │  GPT-4o           $0.00 PRU vs $0.060 tok
                                              │  GPT-5 mini       $0.00 PRU vs $0.010 tok
```

The picture flips. **Under realistic usage, only Gemini and GPT-5.2 are meaningfully overcharged by PRU — and even they are within ~30% of token cost.** The 7.5× tier is no longer the giant overcharge the original analysis showed; it's roughly fair pricing for a typical reasoning chat and a *bargain* for any chat that touches workspace context.

#### Implications for the rest of this document

The original [Hypothetical: Token-Based Pricing Scenario](#hypothetical-token-based-pricing-scenario) and [Recommendations Under a Token-Based Copilot](#recommendations-under-a-token-based-copilot) sections are still directionally useful but should be read with these corrections in mind:

1. **"Stop rationing Opus" is conditional, not universal.** It holds for short, single-turn chats without workspace context or thinking. It *fails* for the workflows Opus is most useful in — multi-file work, codebase Q&A, long debugging sessions. For those, PRU's flat per-chat charge is cheaper and dramatically more predictable.
2. **"GPT-5.5 vs Opus 4.7" is closer than the original table suggested.** Both are roughly fair at 7.5× under realistic usage; both become bad deals only on tightly-scoped one-shot chats. The "always pick Opus" recommendation softens to "pick on capability, not price."
3. **Agentic-workflow users are the *biggest* token-pricing losers, not the biggest winners.** PRU's "tool calls don't count" rule is worth substantially more than the original analysis credited — easily $1–10/agent-run for ultra-premium models. The persona table elsewhere in this document undercounts this.
4. **Cache discipline becomes a real budgeting input.** A team that caches its 10K-token Copilot system prompt and stable workspace digests will see a noticeably different token bill than one that doesn't. PRU papers over this entirely.
5. **The "free tier" subsidy is larger than originally shown.** A typical GPT-4o Copilot chat at 8K/4K tokens is $0.06 of token value — 2× the original $0.03 figure. The included tier is even more of a giveaway than it first appears.

#### Methodology and confidence

| Number | Source | Confidence |
|--------|--------|:----------:|
| Anthropic agents = 4× chat tokens, multi-agent = 15× | [Anthropic engineering blog, June 2025](https://www.anthropic.com/engineering/built-multi-agent-research-system) | **High** — first-party data |
| Adaptive thinking is mandatory on Opus 4.7, default `high` effort | [Anthropic adaptive-thinking docs](https://docs.anthropic.com/en/docs/build-with-claude/adaptive-thinking) | **High** — first-party docs |
| Thinking tokens count toward output billing | [Anthropic token-counting docs](https://docs.anthropic.com/en/docs/build-with-claude/token-counting) | **High** — first-party docs |
| Copilot system prompt + tool schemas: 2–7K tokens | Community reverse-engineering of VS Code Copilot traffic; not officially confirmed | **Medium** — directionally established but exact size varies by client and version |
| `@workspace` adds 5–50K input tokens | GitHub Copilot product docs encourage opening many files; consistent with public discussion of indexed-RAG sizing | **Medium** — order-of-magnitude correct, exact figure highly workspace-dependent |
| Realistic adaptive-thinking output: 4–10K tokens for "default high" effort | Inferred from Anthropic's `xhigh` description and observed `budget_tokens` ranges in extended-thinking docs (32K typical ceiling, "may not use the entire budget") | **Medium-low** — exact distribution unpublished |
| Caching at 90% off, 50–90% hit rate for hot system prompts | [Anthropic prompt-caching documentation](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching) | **High** for the rate; **Low** for whether Copilot actually applies it on every call |

**The conclusions in this section depend most heavily on the Anthropic 4×/15× number, which is first-party and well-cited.** Even cutting that figure in half — assuming Copilot chats are only 2× a "simple" chat rather than 4× — the ultra-premium tier still flips from "tokens always win" to "roughly fair." The 4K/2K assumption is the weak point in the original analysis; almost any realistic correction moves the verdict in the same direction.

### Chat vs. Agentic Workflows: Token Profiles by Mode

> **Premise:** The previous section established that even a single Copilot *chat* understates real token usage. This section goes further — it characterizes the four distinct workflow modes Copilot now supports, shows how their token economics diverge by **one to three orders of magnitude**, and re-runs the PRU vs. token comparison for each. The headline finding: **PRU's "only your prompt counts" rule is the single most valuable subsidy in the entire system, and it grows non-linearly with workflow autonomy.**

#### The four Copilot interaction modes

GitHub Copilot in 2026 is no longer one product — it is at least four meaningfully different modes that share a brand and a billing system but have radically different token signatures.

| Mode | Where it runs | What "one user prompt" triggers | Typical turn count | PRU rule |
|------|---------------|-------------------------------|:--------------------:|---------|
| **1. IDE Chat** (ask mode) | VS Code / JetBrains side panel | One model call, optional `@workspace` retrieval | 1 | 1 prompt = 1 PRU |
| **2. IDE Agent Mode** | VS Code "agent" mode | Model + autonomous tool calls (file read, edit, terminal) until task complete | 5–30 turns | 1 user prompt = 1 PRU; tool calls free |
| **3. Copilot CLI** | Local terminal, optional `plan` mode + sub-agents | Model + bash + plan + sub-agent delegation, multi-turn until exit | 10–100+ turns | Per the [Copilot billing docs](https://docs.github.com/en/copilot/concepts/billing/copilot-requests): *"only the prompts you send count as premium requests; actions Copilot takes autonomously to complete your task, such as tool calls, do not"* |
| **4. Copilot cloud agent** | Ephemeral GitHub Actions runner | Full plan → research → implement → test → commit → PR loop | 50–500+ turns | One issue/assignment = one premium request (now tracked in a dedicated SKU per [Nov 2025 docs update](https://docs.github.com/en/copilot/concepts/billing/copilot-requests)) |

The first two modes resemble the "chat" the previous section validated. **Modes 3 and 4 are categorically different** — they are autonomous loops where the model plays both writer and reader of large amounts of intermediate text, and where token consumption scales with task difficulty, not with user prompt count.

#### What "agentic" actually does to token bills

The single best-cited public number for agentic token usage comes from Anthropic's research engineering team ([How we built our multi-agent research system](https://www.anthropic.com/engineering/built-multi-agent-research-system)):

> *"Agents typically use about **4× more tokens** than chat interactions, and multi-agent systems use about **15× more tokens** than chats. … Token usage by itself explains 80% of the [BrowseComp performance] variance."*

That 4×/15× figure was for Anthropic's own Research product (single lead agent + sub-agents in parallel). Coding workloads tend to be even more token-intensive because file contents are large, error traces are verbose, and successful patches require multiple read-modify-test cycles. We can verify this with a far more concrete number: the **SWE-bench bash-only leaderboard reports actual measured per-instance dollar cost** for each model — i.e., what one full agent run on one real GitHub issue costs at provider list pricing. From the [SWE-bench Bash-Only table](#swe-bench-bash-only--standardized-lm-comparison) earlier in this document:

| Model | $/instance (real measured agent run) | Implied tokens per run ¹ | × baseline 4K/2K chat |
|-------|:------------------------------------:|:------------------------:|:---------------------:|
| Claude 4.5 Opus (high reasoning) | $0.754 | ~125K (≈100K in + 25K out) | **~11×** |
| Claude Opus 4.6 | $0.552 | ~92K | ~8× |
| Gemini 3 Pro Preview | $0.460 | ~50K (Gemini's $2/$12 pricing) | ~7× |
| GPT-5.2-Codex | $0.449 | ~38K | ~6× |
| Gemini 3 Flash (high reasoning) | $0.356 | ~120K (cheap-token model takes more turns) | ~17× |
| Claude 4.5 Sonnet | $0.558 | ~85K (Sonnet $3/$15) | ~12× |
| MiniMax M2.5 (high reasoning) | $0.073 | n/a (private pricing) | — |
| DeepSeek V3.2 Reasoner | $0.028 | n/a | — |

> ¹ Token counts are reverse-engineered from the leaderboard's reported total cost, assuming a typical 80/20 input/output token split and the published list-price input/output rates for each model. Counts are approximate.

**Two observations matter:**

1. **A single SWE-bench instance — equivalent to one Copilot cloud-agent task — burns 6–17× the tokens of a "chat."** This is independent of the 4K/2K validity question; it's measured external data on the same model running through a standardized agent loop.
2. **Cheaper-token models burn *more* tokens, not fewer.** Gemini 3 Flash at $0.356/instance is solving the same task as Claude 4.5 Opus at $0.754/instance — but at $0.50/MTok input vs $5.00/MTok, Flash is using roughly **2.5× more tokens** to get there. This is an important nuance for token-pricing optimization: cheaper models tend to compensate for lower per-call quality with more iteration.

#### Token profiles by mode (consolidated)

Combining the validated chat baseline, the Anthropic agentic multipliers, and the SWE-bench measured cost data:

| Mode | Per-task input | Per-task output | × 4K/2K baseline | Notes |
|------|:--------------:|:---------------:|:----------------:|-------|
| **IDE Chat (no context)** | 4–8K | 2–4K | 1× (the baseline) | Stand-alone Q&A, single file open |
| **IDE Chat with `@workspace`** | 15–40K | 4–8K | 3–5× | RAG-retrieved chunks dominate input |
| **IDE Agent Mode (single task)** | 30–80K | 8–20K | 5–10× | 5–30 tool-call turns, each turn re-sends growing history |
| **Copilot CLI interactive (no sub-agents)** | 50–150K | 15–40K | 10–25× | 10–100 turns, plan mode + bash + iteration |
| **Copilot CLI with sub-agents (plan + delegate)** | 150–500K aggregate | 40–120K aggregate | 30–100× | Anthropic's 15× figure is the lower bound here; coding adds file content |
| **Copilot cloud agent (full PR)** | 200K–2M aggregate | 50–300K aggregate | 50–500× | Build, test, retry loops on a GitHub Actions runner; bounded only by the agent's own stop conditions |

The right column is the one that matters for pricing strategy: **the autonomy axis spans nearly three orders of magnitude in token consumption.**

#### Re-running PRU vs token cost for each mode (Claude Opus 4.7)

Holding the model constant at Claude Opus 4.7 (PRU: $0.30/prompt at 7.5×, tokens: $5/$25 per MTok) and walking up the autonomy ladder:

| Mode | Tokens (in/out) | Token cost | PRU cost (1 user prompt) | Token cost ÷ PRU | Winner |
|------|:----------------:|:----------:|:-------------------------:|:----------------:|:------:|
| IDE chat (4K/2K, original baseline) | 4K / 2K | $0.070 | $0.30 | 0.23× | Tokens 🏆🏆🏆 |
| IDE chat with workspace context | 30K / 8K | $0.350 | $0.30 | 1.17× | PRU 🏆 |
| IDE agent mode (one task) | 60K / 15K | $0.675 | $0.30 | **2.25×** | **PRU 🏆🏆** |
| CLI interactive (mid-sized) | 100K / 25K | $1.125 | $0.30 | **3.75×** | **PRU 🏆🏆** |
| CLI with sub-agents (Anthropic's 15×) | 250K / 60K | $2.750 | $0.30 | **9.17×** | **PRU 🏆🏆🏆** |
| Cloud agent — small task | 300K / 75K | $3.375 | $0.30 | **11.3×** | **PRU 🏆🏆🏆** |
| Cloud agent — large task (refactor / migration) | 1M / 200K | $10.000 | $0.30 | **33×** | **PRU 🏆🏆🏆🏆** |

**One Claude Opus 4.7 cloud-agent run on a moderate task costs roughly the same as 11 chat-mode prompts on the same model under PRU billing.** Under tokens, it costs the actual provider rate — which means the "tool calls don't count" rule is silently transferring **~$3 per task** from GitHub to the user. For a developer who runs the cloud agent five times a day across a billing month, that single rule is worth approximately **$300/month**.

For an OpenAI ultra-premium model (GPT-5.5 at $5/$30 per MTok), the picture is even more lopsided because output tokens (which agent loops produce in volume) are 20% more expensive than Anthropic's:

| Mode | Tokens | Token cost | PRU | Ratio | Winner |
|------|:------:|:----------:|:---:|:-----:|:------:|
| Cloud agent — small task | 300K / 75K | $3.750 | $0.30 | **12.5×** | **PRU 🏆🏆🏆** |
| Cloud agent — large task | 1M / 200K | $11.000 | $0.30 | **36.7×** | **PRU 🏆🏆🏆🏆** |

#### Sub-agent dynamics: the multiplier inside the multiplier

Sub-agents introduce a second-order amplification effect that is poorly understood:

- **Parallelism is paid for in tokens, not wall-clock time.** Anthropic's research blog explicitly notes that they spawn "3–5 sub-agents in parallel" and that "complex research might use more than 10 sub-agents with clearly divided responsibilities." Each sub-agent has its own context window, its own system prompt, and its own tool outputs. They run *concurrently* — but the bill is *additive*.
- **The lead agent re-ingests every sub-agent's output.** Sub-agent results return to the orchestrator as tool-call outputs, which become *input tokens* for the lead agent's synthesis turn. A single sub-agent that produces a 5K-token report adds 5K tokens to the lead's next input pass.
- **Coding sub-agents have larger payloads than research sub-agents.** A research sub-agent might return a 2K-token summary; a coding sub-agent returning a refactored file can return 10–50K tokens. This makes Copilot CLI's "sub-agent" feature more token-intensive per delegation than Anthropic's reference Research product.
- **Failure modes amplify cost.** Anthropic's blog mentions early agents "spawning 50 sub-agents for simple queries" and "scouring the web endlessly for non-existent sources." These pathological loops are exactly what PRU's flat rate insulates users from — and exactly what token billing exposes them to.

Putting numbers on it: a single Copilot CLI session that spawns three coding sub-agents — each running 15 tool calls and returning 20K of file content — easily clears **400K aggregate input tokens** before the user types a second prompt. On Claude Opus 4.7 that is **$2.00 of input alone** for what would have been **$0.30 in a single PRU**.

#### The Copilot cloud agent specifically

The cloud agent (formerly "coding agent") is the most token-intensive workflow Copilot offers. Per the [official docs](https://docs.github.com/en/copilot/concepts/agents/coding-agent/about-coding-agent):

> *"Copilot cloud agent has access to its own ephemeral development environment, powered by GitHub Actions, where it can explore your code, make changes, execute automated tests and linters and more."*

This means the agent loop includes:

1. **Repository exploration** — file listings, directory walks, content reads of every file the agent needs to understand the codebase. Easily 50–500K input tokens for a non-trivial repo.
2. **Plan generation** — multi-step plan with file paths and rationale, often 5–15K output tokens.
3. **Iterative implementation** — read → edit → run tests → read failure → revise → repeat. Each cycle re-sends the working set; large refactors can cycle 10–50 times.
4. **Test/lint output ingestion** — failed test output, build logs, linter warnings — all returned as tool-call results that become input on the next turn. 10–100K tokens per failed iteration is normal.
5. **PR description generation** — final synthesis of changes, often 1–3K output tokens.

The leaderboard data anchors this: a single SWE-bench instance — which is a *narrow* coding task with a known fix — costs **$0.55–$0.75** for top Claude models. A real cloud-agent task (which has no curated test suite, no pre-known fix, and operates against arbitrary repositories) is materially harder and more iterative. Real-world cloud-agent tokens are likely **2–4× higher** than SWE-bench's bench-friendly numbers.

GitHub's billing system papers all of this over: **one assignment = one premium request.** The November 2025 update did move cloud-agent requests into a dedicated SKU "for better cost visibility" — but the per-request economics are unchanged, and from a *user* perspective, a $0.30 PRU charge is the entire bill regardless of whether the underlying task burned $0.50 or $50 of tokens.

#### Updating the consolidated cost table

Combining everything, here is the corrected per-mode cost picture for the high-multiplier models the original analysis treated as "always tokens-win":

**Claude Opus 4.7 (1.25× would have been "fair" before; 7.5× is current promotional)**

| Mode | PRU @ 7.5× | Realistic token cost | Net direction |
|------|:----------:|:--------------------:|:-------------:|
| IDE chat (simple) | $0.30 | $0.07 | Tokens win 4.3× |
| IDE chat (workspace) | $0.30 | $0.35 | PRU wins 1.2× |
| IDE agent mode | $0.30 | $0.68 | PRU wins 2.3× |
| CLI interactive | $0.30 | $1.13 | PRU wins 3.8× |
| CLI + sub-agents | $0.30 | $2.75 | **PRU wins 9.2×** |
| Cloud agent (small) | $0.30 | $3.38 | **PRU wins 11×** |
| Cloud agent (large) | $0.30 | $10.00 | **PRU wins 33×** |

**The original analysis showed Opus 4.7 saving $46/month under tokens for a 200-chat user. Under realistic mode mix, that user actually *pays an extra $400–$2,000/month* if they make heavy use of agent or cloud-agent modes.**

#### Cheaper models change shape but not direction

Repeating for Claude Opus 4.5/4.6 (1.25× PRU):

| Mode | PRU @ 1.25× | Token cost | Net direction |
|------|:-----------:|:----------:|:-------------:|
| IDE chat (simple) | $0.05 | $0.07 | Tokens "lose" 1.4× (was always PRU-favored) |
| Cloud agent (small) | $0.05 | $3.38 | **PRU wins 68×** |
| Cloud agent (large) | $0.05 | $10.00 | **PRU wins 200×** |

For Opus 4.5/4.6 the PRU subsidy on cloud-agent runs is **two orders of magnitude**. This is the single largest hidden subsidy in Copilot's pricing system, and it is invisible in any per-chat analysis.

For included models on a paid plan (PRU = $0):

| Mode | PRU | Token cost | Net direction |
|------|:---:|:----------:|:-------------:|
| IDE chat (simple) GPT-4o | $0.00 | $0.03 | Tokens lose ∞× |
| Cloud agent on GPT-4o | $0.00 | ~$1.50 | Tokens lose ∞× |

Tokens always lose against $0, but the *gap widens by 50×* once agent modes are involved.

#### Why this matters even more under token pricing

Under PRU, users have weak incentives to manage token consumption — they only pay per prompt, and PRU rationing is the same whether they're chatting or running a cloud agent. Under token pricing, users would face **bill variance of 1–2 orders of magnitude per task** depending on workflow choice. Three concrete consequences:

1. **Bill predictability collapses.** A user who runs the cloud agent five times in one day might see a $25 spike; the same five prompts in IDE chat mode might cost $0.30. Today's PRU treats both identically.
2. **Failure modes become expensive.** PRU absorbs the cost of agent loops that go off the rails. Token billing exposes it. A 200-turn cloud-agent run that fails to merge a PR could cost $20+ on Opus 4.7 with no result to show for it.
3. **Multi-agent systems become unaffordable for casual use.** Anthropic's own product gates Research multi-agent behind Max subscriptions for exactly this reason. Token-priced Copilot CLI sub-agents would face the same constraint.

#### Methodology and confidence

| Number | Source | Confidence |
|--------|--------|:----------:|
| Anthropic agents = 4× chat tokens, multi-agent = 15× | [Anthropic engineering blog, June 2025](https://www.anthropic.com/engineering/built-multi-agent-research-system) | **High** — first-party measured |
| Multi-agent uses 3-5 parallel sub-agents; complex queries 10+ | Same source | **High** — first-party operational |
| SWE-bench bash-only $/instance figures | [SWE-bench leaderboard `data/leaderboards.json`](https://github.com/SWE-bench/swe-bench.github.io) | **High** — measured run cost at provider list price |
| SWE-bench instance ≈ one cloud-agent task; real tasks 2–4× harder | Inference: SWE-bench is curated/bounded; real repos are not | **Medium** — directionally established, exact factor varies |
| IDE Agent Mode 5–30 turns, CLI 10–100, cloud agent 50–500 | Combination of Copilot product docs and observed agent run logs | **Medium** — order-of-magnitude correct, varies enormously per task |
| Copilot CLI sub-agent payloads larger than Anthropic Research's | Inference from coding-vs-research domain difference (file content is large) | **Medium-low** — qualitatively obvious, no public per-call telemetry |
| "Only your prompt counts" PRU rule | [GitHub Copilot billing docs](https://docs.github.com/en/copilot/concepts/billing/copilot-requests) | **High** — first-party policy |
| Cloud-agent dedicated SKU from Nov 2025 | [Same source](https://docs.github.com/en/copilot/concepts/billing/copilot-requests) | **High** — first-party policy |

#### What this means for the rest of the document

The previous "Token Assumption" section corrected the chat-mode math. **This section corrects the systemic question** — which billing model is structurally fairer when *workflow* (not just model) is the dominant cost variable. Three direct implications:

1. **The "Hypothetical Token-Based Pricing Scenario" tables earlier in this document substantially understate the value of PRU's "tool calls don't count" rule.** That rule is worth more than every other PRU/token comparison combined for any user who touches CLI or the cloud agent.
2. **Recommendations downstream that say "stop rationing Opus" only hold for chat mode.** For agent and cloud-agent modes, the math reverses: under tokens, *Opus becomes the model you most need to ration* because per-task spend is unbounded.
3. **The "agentic-workflow heavy" persona is the biggest token-pricing loser by a wide margin** — bigger than the original analysis credited. A token switch that saves a chat-only power user $40/month would simultaneously cost an agent-heavy user $200–2,000/month.

The next section's recommendations have been updated to reflect mode-by-mode strategy rather than model-by-model.

### Recommendations Under a Token-Based Copilot

> **Premise:** This section answers a single question — *"If GitHub switched Copilot from PRU billing to direct token-based billing tomorrow, how should I change which models I reach for?"* All recommendations below combine the SWE-bench bash-only performance data, the leaderboard's per-instance dollar costs, and the provider list prices in the [Hypothetical: Token-Based Pricing Scenario](#hypothetical-token-based-pricing-scenario) table.
>
> Token math throughout uses a typical Copilot chat turn of **4K input + 2K output tokens** (~$0.012 of "weight" at unit prices). Heavy agentic loops can be 10–100× larger; recommendations call this out where it matters.

#### What changes about model selection

Three structural shifts happen on day one of token pricing:

1. **Included models stop being free.** GPT-5 mini, GPT-4.1, and GPT-4o would all start metering at provider rates ($0.005, $0.024, and $0.030 per typical chat respectively). The "default to GPT-5 mini for routine tasks" rule of thumb still wins — it's just no longer free.
2. **Ultra-premium gets dramatically cheaper.** Claude Opus 4.7 and GPT-5.5 drop from **$0.30/chat (PRU)** to **~$0.07–0.08/chat (tokens)** — a 4× reduction. Reaching for the top-of-the-line model becomes a routine choice, not a rationed one.
3. **Cost discrimination happens at the prompt level, not the model level.** Long context windows, large diffs, or chatty agentic workflows now drive your bill more than model choice does. A 50K-token agent run on Haiku 4.5 ($0.165/run) costs more than a tight 4K-token chat with Opus 4.7 ($0.07/run).

#### Performance-per-dollar leaders under token pricing

Combining SWE-bench bash-only resolve rate with the typical-chat token cost (4K in + 2K out at provider list price):

| Tier | Model | SWE-bench Bash-Only | Typical Chat Cost | % Resolved per $1 |
|------|-------|:-------------------:|:-----------------:|:-----------------:|
| 🆓 Free-tier replacement | **GPT-5 mini** | 56.2% | $0.005 | **11,240** |
| 💰 Best budget premium | **Claude Haiku 4.5** | 66.6% | $0.014 | 4,757 |
| ⚖️ Best mid-tier value | **Gemini 3 Pro / 3.1 Pro** | 69.6–74.2% | $0.032 | 2,318 |
| ⚖️ Mid-tier alternative | **GPT-5.2 / 5.2-Codex** | 69.0–72.8% | $0.035 | 2,080 |
| 🏆 Best frontier value | **Claude Opus 4.6** | 75.6% | $0.070 | 1,080 |
| 🏆 Frontier alternative | **Claude Opus 4.7** ¹ | ~76–78% ² | $0.070 | ~1,090 |
| 🏆 Highest peak performance | **Claude 4.5 Opus (high reasoning)** | 76.8% | $0.070 | 1,097 |
| ⚠️ Worst top-tier value | **GPT-5.5** | ~75% ² | $0.080 | ~940 |

> ¹ Token-priced cost equals Opus 4.6 (same $5/$25 list rates). ² Estimated from family — no public bash-only score yet at the time of this writing.

**Reading the table:**
- **GPT-5 mini's lead is real** — even when no longer free, it delivers more SWE-bench % per dollar than any other model. Make it your reflex default for routine code.
- **Gemini 3 Pro / 3.1 Pro emerges as the new mid-tier sweet spot.** Under PRU pricing it was indistinguishable from GPT-5.2 (both 1×). Under tokens, Gemini's $2/$12 rates beat OpenAI's $1.75/$14 on a typical chat **and** Gemini Flash at $0.5/$3 unlocks an even cheaper sub-tier with strong multilingual scores (72.7%).
- **Claude Opus becomes the obvious frontier choice.** All three Opus generations price identically ($5/$25), so you should always pick the *latest* (4.7 → 4.6 → 4.5) for the same dollar. The 1.25× → 7.5× PRU jump that made 4.7 prohibitive disappears entirely.
- **GPT-5.5 loses its rationale.** It costs **20% more** than Opus 4.7 token-for-token while landing in the same performance band. Under PRU they were tied at 7.5×; under tokens, Opus 4.7 becomes the strictly better pick for premium tasks.

#### Recommendations by user persona

| Persona | Today (PRU) | Token-Based World | Why It Changes |
|---------|-------------|-------------------|----------------|
| **Casual user** (≤50 chats/mo) | GPT-5 mini, occasional Sonnet 4.5 | GPT-5 mini for routine; Haiku 4.5 for anything non-trivial | $0.25–$0.70/month at most — pricing model barely matters |
| **Daily developer** (200–500 chats/mo) | Sonnet 4.5/4.6 (1×), Haiku for triage | **Gemini 3.1 Pro** as default; Opus 4.6/4.7 for hard problems | Gemini 3.1 Pro at $0.032/chat undercuts Sonnet ($0.042) with similar SWE-bench scores |
| **Power user** (1K+ chats/mo) | Mostly 1× models, sparing Opus | Opus 4.7 freely; reserve only for genuinely simple tasks | Opus 4.7 drops from $0.30 → $0.07/chat — 4× cheaper than today's PRU rate |
| **Agentic-workflow heavy** (Copilot CLI / cloud agent users) | PRU's "tool calls don't count" rule keeps cost flat regardless of model size | **All tokens billed.** Match model to task aggressively: Haiku/Flash for traversal, Opus only for synthesis | This is where token pricing hurts — a 50K-token agent run on Opus 4.7 is $0.65; the same on Haiku 4.5 is $0.13 |
| **Multilingual codebase team** | Sonnet 4.5 + occasional Gemini 3 Pro | **Gemini 3 Flash** as default (72.7% multilingual @ $0.50/$3); Opus 4.6 (72% multilingual) only for the hardest patches | Gemini 3 Flash leads multilingual SWE-bench at 1/4 the cost of Sonnet |
| **Open-source-curious** | n/a — open weights aren't in Copilot | If GitHub adds them, **DeepSeek V3.2** ($1.14/$4.56) and **GLM-5** become genuine options at 70–73% SWE-bench | Token pricing makes open-weight provider economics legible — they win on $/% of any closed model except mini variants |
| **Enterprise / data-residency** | +10% data-residency multiplier on top of PRU | Same +10% on tokens — but now also pay for cached-input on long system prompts | Watch context-caching discounts (Anthropic 90% off cached reads); a stable 10K-token system prompt cached at $0.50/MTok is virtually free |

#### Recommendations by task type

| Task Type | Token-Pricing Recommendation | Estimated Cost / Task | Why |
|-----------|------------------------------|:---------------------:|-----|
| Boilerplate, autocomplete, single-line edits | GPT-5 mini | $0.005 | 56% SWE-bench is overkill for this — anything cheaper will do |
| Quick code Q&A, tight refactors | Claude Haiku 4.5 | $0.014 | 66.6% SWE-bench at near-mini cost; better tone/instruction-following than mini |
| General coding, unit tests, debugging | **Gemini 3.1 Pro** *or* GPT-5.2-Codex | $0.032–0.035 | Best mid-tier balance; Codex variant for OpenAI-loyalty teams |
| Multilingual / polyglot work | **Gemini 3 Flash** (high reasoning) | $0.008 | 72.7% multilingual #1 at 6× cheaper than Sonnet |
| Multi-file refactors, architectural changes | **Claude Opus 4.6 or 4.7** | $0.070 | 75–77% SWE-bench, no longer rationed under tokens |
| Hardest bugs, legacy-codebase deep-dives | Claude 4.5 Opus (high reasoning) + an agent scaffold (live-SWE-agent / Sonar) | $0.20–1.00 (varies with agent loop length) | Top-of-leaderboard performance; per-instance leaderboard cost is $0.75 |
| Visual / multimodal issues (screenshots, mockups) | OpenHands-Versa + Claude Sonnet 4 *or* GUIRepair + o3 | $0.05–0.30 | Only systems above 30% on SWE-bench Multimodal |
| High-volume agent loops (Copilot CLI runs) | Tier within a single task: **Haiku** for file reads/searches, **Opus** for the synthesis turn | varies | Token billing rewards routing — most tokens come from low-value traversal |

#### Strategy shifts to make on day one

1. **Stop treating GPT-5 mini as "free, so use it everywhere."** Pricing levels — but it's still the cheapest. Use it where 56% solve-rate is actually enough; promote everything else to Haiku 4.5.
2. **Collapse Sonnet → Gemini 3.1 Pro for general coding.** Gemini wins on $/% under token math (76.8 cents vs 95 cents per SWE-bench point) and matches Sonnet on most real-world tasks.
3. **Stop rationing Opus.** The PRU-era habit of "save 1.25× / 7.5× models for emergencies" is exactly wrong under tokens — Opus 4.6/4.7 is *cheaper per dollar of solve-rate* than every model except the budget tier.
4. **Replace GPT-5.5 with Opus 4.7.** Same performance band, 12.5% lower token cost, plus stronger SWE-bench evidence.
5. **Aggressively cache long system prompts.** Anthropic's $0.50 cached read vs $5 input (90% off) and Gemini's similar discount make stable prompts ~10× cheaper. PRU never rewarded this — token billing absolutely does.
6. **Audit agentic workflows for token bloat.** Under PRU only the user prompt counted; under tokens, every tool call response, every file read, every reasoning trace bills. Tighten retrieval scopes, summarize long tool outputs, and consider mid-agent model downgrades.
7. **Watch for batch-API access.** Anthropic and xAI both offer 50% off batched processing. Useful for nightly codebase analysis, bulk PR review, or test generation — none of which fit the synchronous PRU model but all of which become natural under tokens.

#### When PRU is still the better deal

Token pricing isn't universally better. Stay on PRU (or fight to keep it) if you are:

- **A heavy free-tier user** of GPT-5 mini / GPT-4.1 / GPT-4o on a paid plan — you currently pay $0/chat. Tokens introduce $0.005–$0.030/chat overnight.
- **A predictable-budget enterprise buyer** — finance teams forecast PRU consumption easily; per-token spend has 10–100× variance depending on context size.
- **A user of mid-tier 1× / 1.25× models exclusively** — these are roughly token-cost-neutral, and PRU's "tool calls don't count" rule is a real subsidy for agentic workflows.

For everyone outside those buckets — and especially for power users of Opus, GPT-5.5, or any agent-heavy workflow that isn't dominated by tool-call traffic — token pricing is a net win, *provided* you adjust model selection per the recommendations above.

---

## Best-Suited Use Cases

| Use Case | Recommended Model | Why |
|----------|-------------------|-----|
| **Complex SWE / bug fixing** | Claude 4.5 Opus (high reasoning) | Highest bash-only score (76.8%), best raw problem-solving |
| **Agentic coding system** | Claude 4.5 Opus or Gemini 3 Pro | Best Verified scores with agent scaffolds (~79% and ~77%) |
| **General-purpose assistant** | Claude Opus 4.6 or GPT-5.2 | Joint #1 on Showdown Elo; broadest capability |
| **Multilingual codebase** | Gemini 3 Flash (high reasoning) | #1 multilingual at 72.7% across 9 languages |
| **Cost-sensitive coding** | Claude 4.5 Haiku (high) or Gemini 3 Flash | Strong coding (66%+) at lower price points |
| **High-volume / low-latency** | GPT-5 Mini or Claude 4.5 Haiku | Fast inference, acceptable quality for routine tasks |
| **Open-source / self-hosted** | DeepSeek V3.2 or Qwen3-Coder | Best open-weight coding models (70% and 55%) |
| **Visual / multimodal issues** | o3 + GUIRepair or Claude Sonnet 4 | Top multimodal SWE-bench scores (~36% and ~34%) |
| **Enterprise integration** | GPT-5.2 or Claude Opus 4.6 | Widest API ecosystem, best general-purpose quality |
| **Reasoning-heavy tasks** | Claude 4.5 Opus (high) or Gemini 3 Flash (high) | "High reasoning" mode unlocks significant gains |

---

## Key Takeaways

1. **Claude dominates software engineering.** Anthropic's Claude family consistently leads SWE-bench across Verified, Bash-Only, and agent-assisted configurations. Claude 4.5 Opus (high reasoning) achieves the top raw LM score of 76.8%.

2. **Agent scaffolds matter enormously.** The gap between bash-only scores and best-agent scores can be 2–4 percentage points. The right scaffold (live-SWE-agent, TRAE, Sonar Foundation) can push scores from ~75% to ~79%.

3. **Gemini 3 Flash is the multilingual champion.** Google's Gemini 3 Flash with high reasoning leads the multilingual benchmark at 72.7%, beating all Claude and GPT variants.

4. **MiniMax M2.5 is a dark horse.** Tying Gemini 3 Flash at 75.8% on bash-only SWE-bench places MiniMax in the top tier — a notable result from a less established provider.

5. **GPT-5.2 wins on general preference.** While not the top coder, GPT-5.2 ties Claude Opus 4.6 on Scale Labs Showdown (Elo ~1079), indicating strong real-world user satisfaction.

6. **Reasoning modes unlock significant gains.** Models with "high reasoning" consistently score 3–8 points higher than their standard counterparts.

7. **Multimodal SWE remains hard.** Even the best systems solve only ~36% of visual software issues — a clear area for future improvement.

8. **Claude Haiku 4.5 is the Copilot cost king.** At 0.25x multiplier with 66.6% SWE-bench performance, it delivers 4x the interactions of 1x models — the best cost/performance ratio of any premium model in Copilot.

9. **Claude Opus 4.5/4.6 at 1.25x is the sweet spot.** Just 25% more than standard premium models, but delivering the highest SWE-bench scores (75-77%). The 7.5x ultra-premium models (Opus 4.7, GPT-5.5) cost 6x more for marginal gains. Note: the 7.5× multiplier is moot from June 1, 2026 onward — monthly subscribers move to AI Credits and pay the actual token cost (Opus 4.7 at ~$0.07/chat is ~75% cheaper than today's PRU charge). Annual subscribers see the multiplier rebased to 27× on the same date.

10. **GPT-5 mini is free and viable.** At 56.2% SWE-bench and 0x multiplier on paid Copilot plans, it can handle the majority of routine coding tasks at zero premium cost.

11. **Open-weight models are competitive but trail.** DeepSeek V3.2 (70%) and GLM-5 (72.8%) are within striking distance of proprietary leaderboards leaders, making self-hosted coding assistants increasingly practical.

12. **Cost-per-instance reveals huge value gaps.** The bash-only leaderboard's per-instance cost data shows MiniMax M2.5 hits 75.8% for **$0.07/instance** — within 1pp of the #1 Claude 4.5 Opus run that costs **$0.75/instance** (10x more). Open-weight models like DeepSeek V3.2 Reasoner ($0.03) and Kimi K2.5 ($0.15) deliver 60–71% solve rates at a fraction of frontier pricing. Conversely, Gemini 3 Pro at **$0.96/instance** for only 69.6% is the worst headline value of any top-20 model.

13. **The benchmark landscape is fragmenting.** SWE-bench and Scale Labs measure very different things — autonomous bug fixing vs. human preference — and top models differ across these axes. Choose your benchmark based on your use case.

14. **Copilot is moving to usage-based billing on June 1, 2026.** PRUs become **GitHub AI Credits** (1 credit = $0.01 USD, billed by token at published API rates). Plan prices are unchanged; pooled credits replace per-seat buckets for orgs/enterprises; code completions stay free; there is no fallback model when credits are exhausted. The "tool calls don't count" subsidy that has cushioned heavy IDE-Agent, CLI, and cloud-agent users disappears — making model and workflow choice materially more consequential for cost. Annual Pro/Pro+ plans stay on PRUs but with substantially higher multipliers (e.g., Opus 4.6: 3× → 27×). See the [GitHub AI Credits & Usage-Based Billing](#github-ai-credits--usage-based-billing-effective-june-1-2026) section.

---

## Methodology Notes

- **SWE-bench Bash-Only** scores use [mini-SWE-agent v2.0](https://github.com/SWE-agent/mini-swe-agent) with a standardized ReAct loop and bash shell. This provides the fairest direct model comparison. Results from v1.x and v2.x may not be directly comparable due to differences in action invocation (string parsing vs. tool calling).
- **SWE-bench Bash-Only per-instance costs** are taken from the official leaderboard's reported `cost` field (total dollars across the 500-instance evaluation) divided by 500. Rows where the model provider's run used a free/local endpoint (e.g., Devstral) report no dollar cost on the leaderboard.
- **SWE-bench Verified** allows any agent system. Scores reflect the best system built around each model.
- **Scale Labs Showdown** uses blind pairwise comparisons with Elo-style ratings from organic user votes across 80+ countries. Elo ratings shift continuously as new votes arrive — figures here are a snapshot.
- Scores are pulled from the official leaderboard data as of **February–April 2026**.
- Some models appear in multiple benchmarks; others are only tested in specific contexts.
- "High reasoning" / "medium reasoning" denotes extended thinking/chain-of-thought modes enabled during inference.
- **Copilot pricing** is based on the Premium Request Unit (PRU) model in effect through May 31, 2026. For agentic features under PRU, only user-initiated prompts count — autonomous tool calls do not consume premium requests. From June 1, 2026, monthly Copilot subscribers transition to **GitHub AI Credits** (token-based billing at 1 credit = $0.01 USD). All references to "Hypothetical: Token-Based Pricing" elsewhere in this document describe what that transition makes real. Annual Pro/Pro+ subscribers remain on PRUs with revised multipliers until renewal.
- **Provider API pricing** was cross-referenced against Anthropic's published rates, GitHub Models docs, xAI docs, and the [LiteLLM pricing database](https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json). All prices verified as of April 28, 2026. The per-token rates in the new [GitHub AI Credits](#per-token-pricing-for-every-copilot-model) section come from GitHub's official [Models and pricing](https://docs.github.com/en/enterprise-cloud@latest/copilot/reference/copilot-billing/models-and-pricing) reference.
- **Model release dates verified via LiteLLM dated entries:** GPT-5.5 → `gpt-5.5-2026-04-23`, Claude Opus 4.7 → `claude-opus-4-7-20260416`, Claude Opus 4.6 → `claude-opus-4-6-20260205`, GPT-5.4 → `gpt-5.4-2026-03-05`, GPT-5.2 → `gpt-5.2-2025-12-11`, Claude Opus 4.5 → `claude-opus-4-5-20251101`.
- **Validation pass (April 25, 2026):** Every SWE-bench score in this document was reconciled against [`data/leaderboards.json`](https://raw.githubusercontent.com/SWE-bench/swe-bench.github.io/master/data/leaderboards.json) on the official `swe-bench.github.io` repo. Provider list prices (Anthropic Opus 4.5/4.6/4.7, Sonnet 4/4.5/4.6, Haiku 4.5; OpenAI GPT-5/5.1/5.2/5.3-Codex/5.4/5.4-mini/5.5/4.1/4o; Google Gemini 2.5 Pro/Flash, Gemini 3 Pro/Flash, Gemini 3.1 Pro; xAI Grok 3/3-Mini/4) were re-checked against LiteLLM's dated `model_prices_and_context_window.json` entries and matched to the cent. GitHub Copilot multipliers and the 7.5x promotional notes for Opus 4.7 (until 2026-04-30) and GPT-5.5 were re-verified against `docs.github.com/en/copilot/reference/ai-models/supported-models`.

---

## Sources

- **SWE-bench Official Website:** [swebench.com](https://www.swebench.com/)
- **SWE-bench Leaderboard Data:** [github.com/SWE-bench/swe-bench.github.io](https://github.com/SWE-bench/swe-bench.github.io) (`data/leaderboards.json`)
- **SWE-bench Experiments:** [github.com/swe-bench/experiments](https://github.com/swe-bench/experiments)
- **Scale Labs:** [labs.scale.com](https://labs.scale.com/)
- **Scale Labs Showdown:** [labs.scale.com/showdown](https://labs.scale.com/showdown)
- **Scale Labs Leaderboards:** [labs.scale.com/leaderboard](https://labs.scale.com/leaderboard)
- **GitHub Copilot Billing — Premium Requests:** [docs.github.com](https://docs.github.com/en/copilot/concepts/billing/copilot-requests)
- **GitHub Copilot — Usage-Based Billing Announcement (April 27, 2026):** [github.blog](https://github.blog/news-insights/company-news/github-copilot-is-moving-to-usage-based-billing/)
- **GitHub Copilot — Usage-Based Billing for Individuals:** [docs.github.com](https://docs.github.com/en/copilot/concepts/billing/usage-based-billing-for-individuals)
- **GitHub Copilot — Usage-Based Billing for Organizations and Enterprises:** [docs.github.com](https://docs.github.com/en/copilot/concepts/billing/usage-based-billing-for-organizations-and-enterprises)
- **GitHub Copilot — Models and Pricing (per-token):** [docs.github.com](https://docs.github.com/en/enterprise-cloud@latest/copilot/reference/copilot-billing/models-and-pricing)
- **GitHub Copilot Plans:** [docs.github.com](https://docs.github.com/en/copilot/about-github-copilot/plans-for-github-copilot)
- **GitHub Models Multipliers & Costs:** [docs.github.com](https://docs.github.com/en/billing/reference/costs-for-github-models)
- **GitHub Models Billing:** [docs.github.com](https://docs.github.com/en/billing/concepts/product-billing/github-models)
- **Copilot Supported Models & Multipliers:** [docs.github.com](https://docs.github.com/en/copilot/reference/ai-models/supported-models)
- **Copilot Auto Model Selection:** [docs.github.com](https://docs.github.com/en/copilot/concepts/auto-model-selection)
- **Anthropic API Pricing:** [anthropic.com/pricing](https://www.anthropic.com/pricing)
- **Google Vertex AI Pricing:** [cloud.google.com](https://cloud.google.com/vertex-ai/generative-ai/pricing)
- **OpenAI API Pricing:** via [LiteLLM model prices](https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json) and Azure OpenAI
- **xAI API Pricing:** [docs.x.ai/docs/models](https://docs.x.ai/docs/models)
- **LiteLLM Model Pricing Database:** [github.com/BerriAI/litellm](https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json)
- **mini-SWE-agent:** [github.com/SWE-agent/mini-swe-agent](https://github.com/SWE-agent/mini-swe-agent)

---

*This analysis is based on publicly available benchmark data and is subject to change as new models and evaluations are released.*
