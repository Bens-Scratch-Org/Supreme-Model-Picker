# AI Model Analysis: SWE-bench, Scale Labs & GitHub Copilot Cost Analysis

> **Last updated:** April 25, 2026
>
> A comprehensive analysis of frontier AI models across software engineering, coding, and general capability benchmarks sourced from [SWE-bench](https://www.swebench.com/) and [Scale Labs](https://labs.scale.com/), combined with a cost/performance analysis using [GitHub Copilot](https://docs.github.com/en/copilot/concepts/billing/copilot-requests) and [GitHub Models](https://docs.github.com/en/billing/reference/costs-for-github-models) pricing.

> [!CAUTION]
> **Claude Opus 4.7's promotional 7.5x multiplier expires April 30, 2026.** After this date, the multiplier is expected to increase significantly. If you rely on Opus 4.7 in Copilot, budget accordingly.

> [!NOTE]
> **Copilot Pro, Pro+, and Student signups are temporarily paused** as of April 20, 2026 ([source](https://docs.github.com/en/copilot/about-github-copilot/subscription-plans-for-github-copilot)). Existing subscribers are unaffected. GPT-5.5 was released on April 23, 2026.

---

## Table of Contents

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
- [Best-Suited Use Cases](#best-suited-use-cases)
- [Key Takeaways](#key-takeaways)
- [Methodology Notes](#methodology-notes)
- [Sources](#sources)

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

| Rank | Model | % Resolved | Avg Cost/Instance |
|------|-------|-----------|-------------------|
| 🥇 1 | Claude 4.5 Opus (high reasoning) | **76.8%** | $0.75 |
| 🥈 2 | Gemini 3 Flash (high reasoning) | **75.8%** | — |
| 🥈 2 | MiniMax M2.5 (high reasoning) | **75.8%** | — |
| 4 | Claude Opus 4.6 | **75.6%** | — |
| 5 | Claude 4.5 Opus medium | **74.4%** | — |
| 6 | Gemini 3 Pro Preview | **74.2%** | — |
| 7 | GPT-5-2 Codex | **72.8%** | — |
| 7 | GLM-5 (high reasoning) | **72.8%** | — |
| 7 | GPT-5-2 (high reasoning) | **72.8%** | — |
| 10 | GPT-5.2 (high reasoning, Dec 2025) | **71.8%** | — |
| 11 | Claude 4.5 Sonnet (high reasoning) | **71.4%** | — |
| 12 | Kimi K2.5 (high reasoning) | **70.8%** | — |
| 13 | Claude 4.5 Sonnet | **70.6%** | — |
| 14 | DeepSeek V3.2 (high reasoning) | **70.0%** | — |
| 15 | Gemini 3 Pro | **69.6%** | — |
| 16 | GPT-5.2 | **69.0%** | — |
| 17 | Claude 4 Opus | **67.6%** | — |
| 18 | Claude 4.5 Haiku (high reasoning) | **66.6%** | — |
| 19 | GPT-5.1-codex (medium reasoning) | **66.0%** | — |
| 19 | GPT-5.1 (medium reasoning) | **66.0%** | — |
| 21 | GPT-5 (medium reasoning) | **65.0%** | — |
| 22 | Claude 4 Sonnet | **64.9%** | — |
| 23 | Kimi K2 Thinking | **63.4%** | — |
| 24 | Minimax M2 | **61.0%** | — |
| 25 | DeepSeek V3.2 Reasoner | **60.0%** | — |
| 26 | GPT-5 mini (medium reasoning) | **59.8%** | — |
| 27 | o3 | **58.4%** | — |
| 28 | Devstral small (2512) | **56.4%** | — |
| 29 | GPT-5 Mini | **56.2%** | — |
| 30 | Qwen3-Coder 480B/A35B Instruct | **55.4%** | — |

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
| 🥇 1 | GUIRepair + o3 | **35.98%** |
| 🥇 1 | Codefuse_Pycfuse_SVR | **35.98%** |
| 🥉 3 | Refact.ai Agent | **35.59%** |
| 4 | OpenHands-Versa (Claude-Sonnet 4) | **34.43%** |
| 5 | GUIRepair + o4-mini | **33.85%** |
| 6 | OpenHands-Versa (Claude-3.7 Sonnet) | **31.33%** |
| 7 | GUIRepair + GPT 4.1 | **31.14%** |
| 8 | Zencoder | **30.56%** |
| 9 | GUIRepair + GPT 4o | **30.37%** |
| 10 | Globant Code Fixer Agent | **29.59%** |

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

> ¹ Subject to change. ² Promotional multipliers — Claude Opus 4.7 promotional rate valid until **April 30, 2026**; GPT-5.5 is also at a promotional 7.5x rate (no end date announced).

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

### Hypothetical: Token-Based Pricing Scenario

> **Scenario:** What if GitHub switched Copilot from the current Premium Request Unit (PRU) model to direct token-based billing — while keeping the existing model multipliers as cost weighting factors?

#### Provider Direct API Pricing (per 1M tokens)

This is what each model actually costs at the provider level:

| Model | Provider | Input $/MTok | Output $/MTok | Cached Input $/MTok |
|-------|----------|:------------:|:-------------:|:-------------------:|
| **GPT-5.5** | OpenAI | $5.00 | $30.00 | $0.50 |
| **GPT-5.4** | OpenAI | $2.50 | $15.00 | $0.25 |
| **GPT-5.4 mini** | OpenAI | $0.75 | $4.50 | $0.07 |
| **GPT-5.2** | OpenAI | $1.75 | $14.00 | $0.17 |
| **GPT-5 mini** | OpenAI | $0.25 | $2.00 | $0.02 |
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
| **Gemini 2.5 Pro** | Google | $1.25 | $10.00 | $0.12 |
| **Gemini 2.5 Flash** | Google | $0.30 | $2.50 | $0.03 |
| **Grok 4** | xAI | $3.00 | $15.00 | — |
| **Grok 3** | xAI | $3.00 | $15.00 | $0.75 |
| **Grok 3 Mini** | xAI | $0.30 | $0.50 | $0.07 |

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

**Users who benefit from current PRU model:**
- Heavy users of **included models** (GPT-5 mini, GPT-4.1, GPT-4o) — these are completely free on paid plans
- Users of **budget premium models** (Haiku 4.5, GPT-5.4 mini) — 0.25x multiplier is an excellent deal
- Users of **Claude Opus 4.5/4.6** — the 1.25x multiplier significantly under-prices the actual $0.07/interaction token cost

**Users who would benefit from token-based pricing:**
- Heavy users of **ultra-premium models** (GPT-5.5, Claude Opus 4.7) — the 7.5x multiplier massively overcharges versus actual token cost ($0.30 vs ~$0.07-0.08)
- Users of **Gemini models** — Gemini is consistently cheaper at the token level than its Copilot multiplier suggests
- Users of **GPT-5.4** — actual token cost ($0.04) is 20% less than the 1.25x PRU cost ($0.05)

#### The Hidden Subsidy Structure

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

9. **Claude Opus 4.5/4.6 at 1.25x is the sweet spot.** Just 25% more than standard premium models, but delivering the highest SWE-bench scores (75-77%). The 7.5x ultra-premium models (Opus 4.7, GPT-5.5) cost 6x more for marginal gains. Note: Opus 4.7's promotional 7.5x rate expires April 30, 2026 — expect a higher multiplier after that date.

10. **GPT-5 mini is free and viable.** At 56.2% SWE-bench and 0x multiplier on paid Copilot plans, it can handle the majority of routine coding tasks at zero premium cost.

11. **Open-weight models are competitive but trail.** DeepSeek V3.2 (70%) and GLM-5 (72.8%) are within striking distance of proprietary leaders, making self-hosted coding assistants increasingly practical.

12. **The benchmark landscape is fragmenting.** SWE-bench and Scale Labs measure very different things — autonomous bug fixing vs. human preference — and top models differ across these axes. Choose your benchmark based on your use case.

---

## Methodology Notes

- **SWE-bench Bash-Only** scores use [mini-SWE-agent v2.0](https://github.com/SWE-agent/mini-swe-agent) with a standardized ReAct loop and bash shell. This provides the fairest direct model comparison. Results from v1.x and v2.x may not be directly comparable due to differences in action invocation (string parsing vs. tool calling).
- **SWE-bench Verified** allows any agent system. Scores reflect the best system built around each model.
- **Scale Labs Showdown** uses blind pairwise comparisons with Elo-style ratings from organic user votes across 80+ countries.
- Scores are pulled from the official leaderboard data as of **February–April 2026**.
- Some models appear in multiple benchmarks; others are only tested in specific contexts.
- "High reasoning" / "medium reasoning" denotes extended thinking/chain-of-thought modes enabled during inference.
- **Copilot pricing** is based on the Premium Request Unit (PRU) model. For agentic features, only user-initiated prompts count — autonomous tool calls do not consume premium requests.
- **Provider API pricing** was cross-referenced against Anthropic's published rates, GitHub Models docs, xAI docs, and the [LiteLLM pricing database](https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json). All prices verified as of April 25, 2026.

---

## Sources

- **SWE-bench Official Website:** [swebench.com](https://www.swebench.com/)
- **SWE-bench Leaderboard Data:** [github.com/SWE-bench/swe-bench.github.io](https://github.com/SWE-bench/swe-bench.github.io) (`data/leaderboards.json`)
- **SWE-bench Experiments:** [github.com/swe-bench/experiments](https://github.com/swe-bench/experiments)
- **Scale Labs:** [labs.scale.com](https://labs.scale.com/)
- **Scale Labs Showdown:** [labs.scale.com/showdown](https://labs.scale.com/showdown)
- **Scale Labs Leaderboards:** [labs.scale.com/leaderboard](https://labs.scale.com/leaderboard)
- **GitHub Copilot Billing — Premium Requests:** [docs.github.com](https://docs.github.com/en/copilot/concepts/billing/copilot-requests)
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
