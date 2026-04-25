# AI Model Analysis: SWE-bench & Scale Labs Benchmarks

> **Last updated:** April 2026
>
> A comprehensive analysis of frontier AI models across software engineering, coding, and general capability benchmarks sourced from [SWE-bench](https://www.swebench.com/) and [Scale Labs](https://labs.scale.com/).

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

8. **Smaller models are approaching viability.** Claude 4.5 Haiku at 66.6% and Devstral Small at 56.4% show that efficient models can handle many coding tasks.

9. **Open-weight models are competitive but trail.** DeepSeek V3.2 (70%) and GLM-5 (72.8%) are within striking distance of proprietary leaders, making self-hosted coding assistants increasingly practical.

10. **The benchmark landscape is fragmenting.** SWE-bench and Scale Labs measure very different things — autonomous bug fixing vs. human preference — and top models differ across these axes. Choose your benchmark based on your use case.

---

## Methodology Notes

- **SWE-bench Bash-Only** scores use [mini-SWE-agent v2.0](https://github.com/SWE-agent/mini-swe-agent) with a standardized ReAct loop and bash shell. This provides the fairest direct model comparison.
- **SWE-bench Verified** allows any agent system. Scores reflect the best system built around each model.
- **Scale Labs Showdown** uses blind pairwise comparisons with Elo-style ratings from organic user votes across 80+ countries.
- Scores are pulled from the official leaderboard data as of **February–April 2026**.
- Some models appear in multiple benchmarks; others are only tested in specific contexts.
- "High reasoning" / "medium reasoning" denotes extended thinking/chain-of-thought modes enabled during inference.

---

## Sources

- **SWE-bench Official Website:** [swebench.com](https://www.swebench.com/)
- **SWE-bench Leaderboard Data:** [github.com/SWE-bench/swe-bench.github.io](https://github.com/SWE-bench/swe-bench.github.io) (`data/leaderboards.json`)
- **SWE-bench Experiments:** [github.com/swe-bench/experiments](https://github.com/swe-bench/experiments)
- **Scale Labs:** [labs.scale.com](https://labs.scale.com/)
- **Scale Labs Showdown:** [labs.scale.com/showdown](https://labs.scale.com/showdown)
- **Scale Labs Leaderboards:** [labs.scale.com/leaderboard](https://labs.scale.com/leaderboard)
- **mini-SWE-agent:** [github.com/SWE-agent/mini-swe-agent](https://github.com/SWE-agent/mini-swe-agent)

---

*This analysis is based on publicly available benchmark data and is subject to change as new models and evaluations are released.*
