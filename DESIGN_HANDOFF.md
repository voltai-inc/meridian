# Meridian — Design Handoff
**For UI/design rebuild · July 2026**

> **STATUS: EXECUTED — July 8, 2026.** The rebuild described in this document shipped (commit `beedeb7`). The UI now follows the deal-room model below: light Voltai design-system visual language (tokens + fonts from `_ds/`), a Screen → Design pipeline instead of a mode toggle, a full-width Design workspace (left rail: study facts + workload controls; sticky KPI strip; sections Power / Compute / Economics / Build), a live off-taker spec sheet rail that builds as you explore, and a full-screen Deliverables takeover with two separate documents (2-page Off-Taker Spec Sheet + internal Advisory Report). New modeled outputs: capex per sustained PFLOPS and time-to-first-training-run. The "What's NOT working well" section below describes the PRE-rebuild state and is kept for historical context; the References section remains current.

---

## What Meridian is

A DC site intelligence tool for data center developers. Two distinct modes:

**Mode 1 — Site Brief:** Developer has a site from a broker (unverified power claim). Tool helps them understand what the claim implies, what they could build if it's real, and whether it's worth spending $50K on a utility feasibility study.

**Mode 2 — Design Intelligence:** Developer has a completed utility power study (real confirmed MW). Tool helps them explore chip/cooling/performance/economics options, then generates a professional spec sheet they can share with off-takers and financiers.

Live: `meridian-web-swart.vercel.app`  
GitHub: `github.com/tangeric17/Voltai_DC_Site_Workload_Eval`  
Stack: Single self-contained HTML/JS file. No backend. No build system.

---

## The core product idea

The gap in the DC market: brokers market sites with unverified power numbers. Engineering firms (ARUP etc.) design the physical infrastructure but don't model IT performance. No one tells a DC developer what their GPU cluster will actually do at scale before they commit capital — GPU vendors quote nameplate specs, not operational reality. Large training clusters typically launch at 20–35% MFU before months of software optimization.

Voltai's position: they work on chip-level formal verification (Blackwell, NVIDIA). They understand the full stack from chip to rack to data center. Meridian is that knowledge made into a tool — it translates a utility study + chip selection into a real performance and economics projection.

The key outputs that matter:
- Operational MFU (not nameplate) — the gap between what the GPU spec says and what you'll actually get at scale
- DSX compatibility check — NVIDIA's Data Center Solution Exchange requirements, validated before build
- Equipment BOM with critical path — which items are actually gating your timeline
- Shareable spec sheet — formatted for an off-taker's technical team to review

---

## Current implementation

### What's built and working
- Mode 1 (Site Brief): address input → auto-detects climate/grid operator → advisory brief with power assessment, rough design, utility questions, confidence level
- Mode 2 (Design Intelligence): pre-loaded with real IID Imperial Valley feasibility study (200 MW, 230 kV, May 2025) as demo data; custom study inputs also supported
- Chip data for 9 chips: GB300 NVL72, GB200 NVL36, B200 SXM, H200 SXM, H100 SXM5, Vera Rubin NVL72, MI355X Helios, MI300X OAM, Gaudi 3 — each with TFLOPS, HBM bandwidth, kW/rack, MFU estimates, lead times, voltage architecture (480V AC / 800V DC / both)
- MFU model: accounts for cluster scale (all-reduce overhead), model size, parallelism strategy (TP/PP/DP), network topology
- Inference Pareto chart: tokens/sec/user vs tokens/sec/MW across all chips at 1 MW IT budget, varying batch size 1→512
- Financial model: full 10-year NPV (operator perspective — includes GPU capex), IRR, EBITDA, P&L
- BESS + generator sizing when power service is interruptible (non-firm)
- DSX compatibility check: 6-point NVIDIA DSX validation (voltage, cooling, PUE, power factor, continuity, NVLink)
- Chip rationale: explains WHY a specific chip was selected for this site
- Alternatives comparison table: all other chips with trade-off notes
- Generate Report → clean advisory document
- Shareable URL: state encoded in URL hash, anyone with the link sees the same report
- Print/PDF export

### What's NOT working well (the UI problems)

**Fundamental:** The exploration feels like a static report with some inputs attached, not a genuinely interactive tool. Selecting a chip card technically updates things but it doesn't feel responsive or meaningful because nothing visually dramatic happens.

**Specific issues:**
1. Content is narrow and centered — wastes screen real estate, doesn't feel like a professional tool
2. Charts are unreadable — too small, labels too dense, inference Pareto especially is cramped
3. Chip cards feel disconnected — clicking them scrolls to a comparison table, but the "so what" isn't immediately visible. User wants to click a chip and immediately see the key numbers change
4. Section scroll feels like navigating a long document, not an interactive workspace
5. The "explore → report" transition isn't dramatic enough — the report feels like more of the same, not like a distinct deliverable moment
6. Mode 1 (Site Brief) is a plain scrolling document — fine for now, lower priority

---

## What the ideal UX should feel like

### The mental model
Think of it like a deal room, not a report. The left side is "your site" (static, facts from the study). The right side is "your options" (interactive, changes as you explore). At the bottom is "your deliverable" (generate and share).

### The exploration flow for Mode 2
Someone who just got a utility study walks through this mentally:
1. **Power confirmed** — quick scan: what does my study say? (30 seconds)
2. **What can I build?** — browse chip options, understand trade-offs at a glance (2-3 minutes)
3. **What will it actually do?** — MFU reality, inference efficiency, performance at scale (2 minutes)
4. **Do the numbers work?** — adjust GPU rate, see NPV/EBITDA update immediately (2 minutes)
5. **How do I get there?** — equipment lead times, critical path, what to lock down first (1 minute)
6. **Share it** — generate report, copy link, send to off-taker (30 seconds)

### The chip selection moment is the central interaction
When a user clicks a different chip, they should immediately see:
- The GPU count change
- The MFU % change
- The revenue/NPV change
- The equipment BOM update

This should feel snappy and visual — not just data in a table updating, but the key numbers visually refreshing. This is the core interaction that makes it a tool rather than a report.

### Key layout principle
**Full width, not centered.** The current implementation centers everything in a narrow column. The right experience is:
- Left panel (fixed ~360px): site inputs, study data, confidence level
- Right panel (remaining width): the interactive workspace
- The right panel uses its full width for charts and comparisons

### Charts need to breathe
- MFU vs Cluster Scale: should be large enough to read the percentage labels clearly. Minimum 500px wide, 200px tall. The "This site" marker needs to be visually prominent.
- Inference Pareto: this is actually the most important chart — it shows the tokens/sec/user vs tokens/sec/MW trade-off across all chips. It needs to be large (full width of the section), with readable chip labels, and the ability to hover/interact with individual chips.

### The report as a distinct moment
"Generate Report" should feel like a meaningful state change — not just showing more of the same content. Possible approaches:
- Full screen takeover for the report
- Report appears as a separate overlay/modal that's clearly "the printable output"
- Clear visual differentiation between the exploration workspace and the report document

---

## Strategic positioning to communicate in the UI

The product should convey these things without explicitly stating them:

1. **We know chips.** The chip recommendations come with reasoning, not just numbers. The MFU gap explanation (nameplate vs. operational) is the key knowledge signal.

2. **We know the process.** The utility study integration, the Class 5/Class 3 terminology, the interconnection cost ranges — this isn't a calculator using made-up numbers, it's a tool built by people who've talked to utilities.

3. **We're not a broker tool.** The confidence levels (UNVERIFIED vs STUDY-VERIFIED), the explicit "open items" section, the clear disclaimers — the product is honest about what it knows and doesn't know. That's a trust signal.

4. **The report is investment-grade.** The spec sheet output should look like something you'd find in a serious technical due diligence package — clean, organized, clearly sourced.

---

## Data to work with

All chip data, financial calculations, and the IID study demo are in the single HTML file. Key JS objects:

```javascript
CHIPS = {
  GB300: {n:'NVIDIA GB300 NVL72', g:72, kw:130, mt:.58, mi:.72, tf:1400, hbm:8.0, volt:'both', lead:'12–14 mo', ...},
  H200: {n:'NVIDIA H200 SXM', g:8, kw:70, mt:.55, mi:.68, tf:990, hbm:4.8, volt:'ac480', lead:'8–10 mo', ...},
  // ... 7 more chips
}

IID_DEMO = {
  confirmed_mw: 200, poi_voltage: 230, service_type: 'firm',
  power_factor: 0.95, upgrade_cost_est: 12000000, upgrade_timeline_mo: 18,
  violation_mw: 500, climate: 'hot_dry', study_date: 'May 2025',
  // ...
}
```

Key functions to preserve:
- `getMFU(chip, gpus, modelB, workload)` — the core MFU model
- `calcFinancials(mw, chip, wl, rate, pwrCost, discR, mult, upgCost, climate)` — returns NPV, IRR, EBITDA, mdl (P&L array)
- `buildDSXCheck(chip, poiV, pue, pf, serviceType, clim)` — returns HTML table for DSX compliance
- `buildChipRationale(chip, poiV, clim, wl)` — returns HTML explaining chip selection reasoning
- `buildAlternativesTable(selChip, mw, clim, wl, poiV)` — returns HTML comparison table

---

## What Mode 1 should be (lower priority, not broken just plain)

Mode 1 is a quick pre-study assessment. Inputs: address, claimed MW, claimed voltage, land, target chip, workload. Output: a 1-page Site Brief with:
- Power situation advisory (what the claimed MW implies for timeline/cost/complexity)
- Rough design (what you could build IF confirmed)
- Specific questions to ask the utility before spending $50K
- Confidence clearly labeled UNVERIFIED throughout
- Recommended next step

Doesn't need an exploration flow — the output is inherently short and linear. The main improvement needed is better visual design of the output document.

---

## Context & references

These shaped the product decisions and are useful background for anyone redesigning the UI:

### Public links (accessible to anyone)

**The core problem this product solves:**
- [The Blind Spot in Data Center Design](https://medium.com/@yuxuan1994_44197/the-blind-spot-in-data-center-design-2e3e3298efc7) — Medium article. MFU in practice is 35–45%, not the 50–70% nameplate. Simulation tools (AstraSim, Meta's Arcadia) exist but are all internal. This is the gap Meridian fills.

**Why the inference Pareto chart matters:**
- [Jake Epstein's LinkedIn post](https://www.linkedin.com/posts/jakepstein_inference-acceleration-gets-treated-as-one-activity-7340060000000000000) — "Inference acceleration gets treated as one problem. It's really several collapsed into one. The chip fastest for one user is often the worst per watt at scale." Includes the tokens/sec/user vs tokens/sec/MW chart for 17 chips on DeepSeek V3 decode phase — this is the visualization the Meridian inference Pareto chart is modeled after. The ideal chart is this but interactive and filtered to chips relevant to your site.

**The real utility study used as demo data:**
- [IID Imperial Valley Data Center Feasibility Study (May 2025)](https://www.imperialdatacenter.com/_files/ugd/6bb284_304b224bf287450e90f68dc7c3bfd09a.pdf) — Real power flow analysis for a 150/200/250/500 MW DC campus. 200 MW is clean, 500 MW hits voltage collapse. This is pre-populated in Mode 2 as the demo. Understanding this document helps explain why Mode 2 exists.

**DC interconnection context:**
- [GridLab — Practical Guidance for Large Load Interconnections](https://gridlab.org/wp-content/uploads/2025/03/GridLab-Report-Large-Loads-Interim-Report.pdf) — Explains the utility study process, Class 5 vs Class 3, why power is harder than marketed.

**Voltai product:**
- [voltai.ai](https://www.voltai.ai) — Voltai's existing product: Part Explorer, knowledge agent, schematic review, BOM management for semiconductor/hardware design. Meridian applies the same "spec-to-verified-reality" approach to data centers.

### Internal meeting notes (Granola)

These conversations directly shaped the product direction:

- [DC Sync — Erfan + Eric + AB](https://notes.granola.ai/t/4e86660b-0fa5-4bbc-b6f9-1777f86d63e2-00b881l8) — Core product ideation. Erfan's pitch: "even xAI got it wrong on MFU, most DC builders don't think about workload simulation." Jensen's GTC metrics (performance per dollar, time to first training run, longevity) should be the outputs as you change sliders. Key quote: "the simulation should include the things Jensen talked about in GTC."
- [DC Sync — site updates + Vertiv](https://notes.granola.ai/t/ffccab29-30a9-4a26-9ae1-0e28cba9f380-00b881l8) — Eric describes building the HTML prototype. Vertiv CEO (Giordano Albertazzi) becomes an advisor. Discussion of using Meridian to generate spec sheets for off-takers.
- [Eric (Voltai) x Ian (ARUP)](https://notes.granola.ai/t/d3bf9103-95bc-49ef-ba87-0ab285703532-00b881l8) — ARUP MEP firm: reference designs take 4–6 months. They explicitly do NOT model what happens inside racks — "that's the tenant's job." This is the gap Meridian fills.
- [TBDI / SK Site Results](https://notes.granola.ai/t/6d2ed591-9bad-42da-9173-aac32527ee5d-00b881l8) — Korea site search. 20+ brownfield sites evaluated.
- [Chase x Erfan — DC infrastructure, off-takers](https://notes.granola.ai/t/f0fb086f-f536-4905-91a3-ead884c641d0-00b881l8) — Owner-rep business model. Chase explains: off-taker LOI only needs a 2-page spec sheet, not a full engineering study. "Voltai would drive the build, get % of lease value."
- [Phanos.ai (Dhanasekar)](https://notes.granola.ai/t/1b88d830-2b65-4e60-92d1-79f2404305e1-00b881l8) — Real DC builder. Confirms the problem: "people build for wrong generation, wrong cooling, wrong power." AMD MI455X Helios (800V DC, 250kW/rack) is their chip. GPU utilization in teens on live clusters.
- [Voltai x Giordano (Vertiv CEO)](https://docs.google.com/document/d/15pTTMFtc4hL2_xG8GM0m0YoCWbgg65SZlNGik9zoDB4/edit) — Gemini notes from July 2, 2026 meeting. Giordano accepted advisor role. Agreed to connect technical teams. The Vertiv data ask (CDU transient performance under training loads) is the next step.
- [Atria + Entergy MS](https://notes.granola.ai/t/2c12e862-8500-47e6-aad0-a05b3e8285ba-008umkv4) — Class 5 study explained ($50K, 2–3 months, per site per load scenario, 60-day validity). Entergy MS requires all DC to be interruptible. >15 MW needs dedicated substation (36–48 months). This is why power modeling is not Voltai's lane.
- [Khalil + Entergy LA](https://notes.granola.ai/t/49c16f28-066e-414a-b995-7dc5d734a93a-00b881l8) — Entergy LA perspective. Similar process. Power factor critical on distribution. $50K study per site. Sites being marketed as "powered" often have outdated or unverified data.

### Key product decisions from internal discussions (not publicly linked)

The following shaped the product direction from internal meetings and conversations. The links are private but the decisions are documented here:

- **Power modeling is not Voltai's lane.** Utility capacity data is proprietary, per-site, expires in 60 days. Entergy charges $50K for a Class 5 study. Meridian's job is to take the output of that study and translate it into chip/cooling/performance/financial specifications — not to model the grid.

- **The xAI Colossus / cluster MFU story is the pitch hook.** Large training clusters launch well below nameplate MFU before software optimization. DC developers don't think about this — they assume hardware just works. This is Voltai's opening.

- **The inference Pareto chart is the most important visualization.** Erfan (Voltai CEO) referenced Jensen Huang's GTC metrics: performance per dollar, time to first training run, longevity. The inference chart shows exactly this trade-off: fast per user vs. efficient per MW. No single winner. The chip ranking changes as you vary batch size. This should be the hero chart of the product.

- **DSX (NVIDIA Data Center Solution eXchange) validation is a differentiator.** Voltai works with NVIDIA on Blackwell formal verification. Meridian validates that a proposed DC design meets NVIDIA's DSX requirements. No other consulting firm can claim this from first-principles chip knowledge.

- **The spec sheet is the commercial deliverable.** Off-takers need a 2-page technical spec to issue an LOI. That's the Meridian output that creates business value — not the exploration itself.

- **BESS design changes fundamentally with interruptible power.** Entergy Mississippi requires all data centers to be on non-firm (interruptible) service. This means BESS must be sized to carry 100% IT load independently, not just as a smoothing buffer. This changes equipment BOM, capex, and NPV significantly.

---

## Files in the repo

```
meridian-web/
├── index.html          ← the whole product (2500+ lines, single file)
├── helio.html          ← reference design visual model (keep as-is)
├── power-signoff.html  ← electrical sign-off tool (keep as-is)
├── support.js          ← design system runtime for helio.html
├── vercel.json         ← Vercel deployment config
└── figures/            ← image assets for helio.html
```

External links in nav:
- Power Sign-off ↗ → `power-signoff.html`
- Helio Reference ↗ → `helio.html`

---

## Deployment

Auto-deploys to Vercel on every push to `main`. To deploy manually: `vercel deploy --prod` from the meridian-web directory.
