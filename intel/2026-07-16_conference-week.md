# DC / Meridian — Week in Review (Jul 6–16, 2026)

> Repo copy — source of truth. Source PDFs (Grid Apex teaser / Omitama business plan / Project MIE Series A) are third-party confidential and are NOT committed; they live locally in `~/VoltAI/data-center/site-selection/japan-grid-apex/`. Ask Eric for access.

**Covers:** ~50 meetings — Infocast **PowerUp Data Centers, Austin (Jul 14–16)** panels + 1:1s, plus the prior week's utility/vendor/partner calls (Entergy, Atria, Supermicro, Ocis/Sanjac, Yawei) and internal DC Syncs.

---

## TL;DR — Top 8 takeaways

1. **The Meridian thesis got externally validated — by NVIDIA itself.** Jared Carl (NVIDIA) confirmed nobody — including NVIDIA — models per-workload GPU power draw; they simulate flat % utilization. Synchronized load from up to 800k GPUs in lockstep was named the industry's defining grid challenge on stage. Zerradc independently said the workload/power software layer lags infrastructure and named it as a collaboration area.
2. **Speed-to-power is the universal filter.** >15 MW → customer-owned substation, 36–48 months. Grid interconnection 2–3 yrs minimum. NVIDIA disqualifies 5-yr builds; wants ~6-month shells. This is why brownfields with existing interconnects (Sanjac), BTM turbine+battery bridges, and modular DCs (Supermicro MDC, 4–6 mo) dominate every conversation.
3. **The $50K utility study is the tollbooth Meridian monetizes.** $50K, non-refundable, per site per load scenario, 2–3 months, ~60-day validity — confirmed by Entergy LA, Entergy MS, and multiple conference contacts. Pre-study screening (what Meridian does) is the wedge; two firms (Kevin Hughes' feasibility shop, Paces) already sell versions of it — partner or benchmark.
4. **Financing is abundant, debt-led, and bespoke.** DC project finance ~$100B this year (+60% YoY); capital supply exceeds deal flow. New instruments learned: PACE (7–8%, 80–90% of hard costs, but **not available in LA/MS** — only OH/TX/AR/AL), **Three Point Capital** equipment-deposit bridge financing ($5M+, covers the ~25% deposits), Rabobank supplier finance (pre-NTP, ~BB+ credit), **CVC** equity (Angelo Lacroix, $100M min ticket), DFC (emerging markets only — fits SEA pipeline, not Korea/US).
5. **The credibility gate: land + power + a live offtake conversation.** Financiers are drowning in "phantom deals." A credible offtake dialogue in progress (an existing compute-capacity backstop agreement is a strong card) can satisfy some financiers pre-signature. Offtaker quality sets the financing tier: hyperscaler >> neocloud.
6. **Mississippi is near-dead; Ohio/Arkansas rise.** Entergy MS mandates interruptible service for all DCs (unpredictable load shed), and MS/LA have no PACE. Ohio (Robert's 20 MW) and Arkansas (Crossett, Warren) gain priority.
7. **Equipment scarcity is a time-boxed arbitrage.** Turbine lead times out to late 2028. Available now: Harbinger 650 kW DC-native gensets ($1/W, ~$1.50/W all-in vs $3/W turbines), Peter's 47-turbine inventory, Pennybacker's freed 200 MW Caterpillar PO (hyperscaler walked), Yawei transformers (~4.5 mo to US, 20 days to Korea).
8. **APAC optionality widened.** Zerradc (Ben Boudreau) — Korea developer-operator with two sites (200 MW confirmed substation, ~700 MW) backed by a top-10 Korean conglomerate — wants Voltai's workload/power software and chip-level expertise. Separate Japan lead: **Grid Apex Inc.** with two power-confirmed sites — Omitama 50 MW (TEPCO, →650 MW campus) and MIE 100 MW (Chubu Electric) — seeking capital + a tech partner (see Grid Apex deep-dive section below).

---

## Key learnings by theme

### 1. Utility & interconnection reality
- **Study economics:** Class 5 study = $50K, 10–12 pages, 2–3 months, one load profile. Class 3 follows (3–9 mo, engineering design). No known bypass. Only trigger the $50K spend once minimum MW is verbally credible (Ronaldson Road = live test case).
- **Substation math:** ≤10–15 MW can ride distribution (maybe last-mile rebuild, ~$1M / 7–12 mo for a half-mile); >15–20 MW = dedicated customer-owned substation, 36–48 months; transformer procurement 3–4 yrs via utilities.
- **Queue mechanics (panel):** ~80% withdrawal rate at study-commitment; $50K/MW to enter some queues; utilities can't distinguish real vs speculative load — itself a product angle. FERC weighing federal credit requirements for large loads (watch item, ~2 months out).
- **Utilities have already mapped headroom** and will coordinate siting with developers who have land access — the substation-data gap is solvable through relationships, not data purchase (S&C Electric named as holding the data).
- ERCOT trick learned (GCI): size load agreements under 75 MW to skip new ERCOT batch-study rules.
- Grid-vs-BTM pricing spread is emerging: customers pay a *premium* for grid power over BTM — directly modelable in Meridian.

### 2. Financing stack (new instruments, in order of actionability)
| Instrument | Source | Terms | Fit |
|---|---|---|---|
| PACE | Robbie's firm (AllianceBernstein-funded) | 7–8% fixed, fully amortizing, 80–90% of hard costs, $100M largest closed | OH/AR sites; **not LA/MS**; presentation week of Jul 27 |
| Equipment-deposit bridge | **Three Point Capital** | Finances ~25% deposits as lease/bridge, $5M+ | Transformer/generator deposits, Korea + US |
| Supplier finance | Rabobank (Wouter Hazenberg) | Pre-NTP, 12 mo, any supplier invoice, ~BB+ credit, $1B+ programs typical | Equipment + utility LCs; intro to Rabib pending |
| Equity (infra fund) | **CVC — Angelo Lacroix** (Angelo.lacroix@cvc.com) | $100M minimum ticket; buys flip sites w/o offtake if LOI is firm | Bundle multiple sites; APAC team separate channel for Korea |
| DFC (US gov) | Nnema Byrd | 10–15 yr debt, T+spread; emerging markets only; 12–18 mo process | SEA pipeline only (Malaysia/Indonesia/Philippines) |
| M&A advisory | EOS Capital | Success-fee; ex-GS/Endesa | Offtaker/long-term-owner search |
- Market color: strongest demand is **2027 COD**; 2026 capacity spoken for. Post-offtake FMV step-up can exceed build cost enough to pull equity out. Title diligence (surface vs mineral rights — Louisiana!) and fee simple strongly preferred by lenders.

### 3. Site-selection heuristics (feed into Meridian scoring)
- **Manufacturing brownfields > logistics warehouses** (warehouses lack power); ex-industrial sites with stranded power (Georgia-Pacific closures at Crossett) are gold.
- Midwest hot (Akron, Indiana) but **harder to finance than established corridors** — tension to price in.
- **Community acceptance is now a first-class constraint** comparable to power availability; pick municipalities that need revenue, engage early.
- Public/city/state-owned parcels are a rich off-market source — site-scan code updated Jul 13 to include them; mayors/chambers accelerate permitting.
- Investor bar: firm tenant *discussions* + power secured or utility work underway. "No power = come back later."

### 4. Equipment & speed-to-power
- **Harbinger:** 650 kW units, 800V DC native, 70 MW/acre, $1/W (~$1.50/W all-in vs $3/W combined-cycle, $5/W fuel cells), zero NOx/PM, relocatable bridge power. Deck coming; connect to Korea team.
- **Peter (turbine guy):** 47 turbines incl. deploy-now Allison A05s (5.8 MW @ ~$1.25M trailer-mounted); key insight — turbines can't directly serve spiky training load, need battery buffering (turbine→battery→DC).
- **Pennybacker (TX fund; CyrusOne/Digital Realty ex-CEOs on advisory board):** 300+ MW proven gas gensets, freed 200 MW Caterpillar-class PO (COD Q4 2027/2028), sites 10–100 MW, prefers CRA-before-LOI structure. NDA pending.
- **Yawei Transformer (Hevin):** ~4.5 mo to US, 20 days China→Korea; 10–20 MVA ~3 mo; volume orders don't extend lead time; will prioritize Voltai.
- **Supermicro:** MDC modular DCs at 4–6 mo lead (parallel to 3–4 mo GPU lead); free 2-week cluster-level design proposal once a site locks — cheap offtaker-grade collateral.

### 5. Meridian product & competitive map
- **Confirmed gap (NVIDIA):** no granular per-workload power simulation anywhere; NVIDIA explored and found no good approach. Partnership paths: Sim Ready assets pipeline + Max LPS (internal power balancing); Voltai already builds on Omniverse.
- **Adjacent players met:** Paces ($12K/yr GIS screening, 5-day diligence reports, brownfield filter); Kevin Hughes' firm (PSSE/PSCAD sims on *utility base-case data incl. queued projects*, 2–3 weeks/site vs 60+ days/$50K — partner or benchmark); INS Engineering (interconnection packages, Crusoe is a client); unnamed geospatial founder (substation-level pre-study screening, demo pending).
- **Architecture principle from the transmission panel:** AI layers around a deterministic, certifiably-correct core — never replaces it. One customer saved ~$10M on cluster-process scenario analysis (pricing comp).
- **Demand-side optimizer thread (Mark Tuckwell, Jul 9):** nonlinear GPU power (temp × workload) optimization within a fixed envelope; open question whether NVIDIA/Supermicro already solved it; needs GPU power-curve data and a deep-EE validator. Team gap: no DC/high-power EE on staff → contract power-engineer search running.
- Naming: the Jul 10 sync flagged scrubbing AMD references and the Meridian name from the demo before external sharing — note AMD has **no** product called Meridian (confirmed by Eric Jul 17); the AMD scrub is about not exposing pipeline-customer names, not a trademark collision.

---

## People met (named contacts)

| Who | Org / role | Contact | Why they matter |
|---|---|---|---|
| Jared Carl | NVIDIA | jcarl@nvidia.com | Workload-sim gap confirmed; Sim Ready + Max LPS intro paths; brownfield site tracker + Austin brownfield specialist |
| Ben Boudreau | Zerradc (Korea) | ben.boudreau@zerradc.com | Korea sites (200 MW + ~700 MW), top-10 conglomerate partner; wants Voltai workload/power software |
| Kevin Hughes | Grid-feasibility firm (PE-backed) | via event email | Utility base-case power sims, 2–3 wk/site; team call to schedule |
| Ryan & Victor Castleman | Ocis Energy | ryan.castleman@ / victor.castleman@ocisenergy.com | **Project Sanjac** E. Houston ~100 MW (→250), interconnect in hand, NTP possibly this year |
| Tadhg Scott | Paces | tadhg@paces.com | Site-screening platform; joint demo week of Jul 20 |
| Wouter Hazenberg | Rabobank | wouter.hazenberg@rabobank.com | Supplier finance + utility LCs; intro to Rabib |
| Nnema Byrd | US DFC | — | Development finance for SEA pipeline |
| Ronnie Ahmed | Oracle (cooling/controls SME, ex-MSFT, NYC) | — | Warm Oracle infra contact; potential silicon-verification intro |
| Derek Tong, JS Yang, Sky Hou, Mari Copere | Supermicro | derekt@ / jsy@ / skyh@ / maric@supermicro.com | MDC + free cluster design proposal post-site-lock |
| Mike | City of Crossett, AR | mike@cityofcrossett.net | 200-acre site, possible freed GP power; intake form → Katherine call |
| Melanie Joffrion | Entergy Louisiana | mjoffri@entergy.com | Ronaldson Road gatekeeper; 10 MW threshold call |
| Lauren Gurtowski / Fisher Warren | Entergy Mississippi | lscheel@ / wwarre2@entergy.com | MS process (interruptible mandate) |
| Khalil Shanti / Ira | Atria | khalil@ / ira@askatria.ai | LA/AR site sourcing partner; licensed LA/FL/TX/AR |
| Hevin | Yawei Transformer | hevin@yaweitransformer.com | Transformer lead times/priority production |
| Peter | Independent turbine dealer (ex-Gibbon) | — | 47-turbine inventory + BTM engineering/permitting |
| Phil (+ partner) | NYI founder / GTM catalysts | — | **Princeton site**: 11 MW deployed + 12 MW available |
| Pennybacker team | TX infra fund | — | Sites + 300 MW gas gen + freed 200 MW Caterpillar PO |
| Robbie('s firm) | PACE lender (AllianceBernstein) | — | OH/AR debt stack; presentation week of Jul 27 |
| Angelo Lacroix | CVC (equity) | Angelo.lacroix@cvc.com | $100M-min equity; buys flip sites w/o offtake if LOI is firm; APAC channel for Korea |
| Three Point Capital | Equipment-deposit bridge financing | — | Covers ~25% equipment deposits ($5M+); transformer/generator orders |
| Grid Apex Inc. (Jun Shimaoka CEO, Kazuhiro Makiguchi CEO-Japan, John Ruan COO, Howard Li CSO; YJW Capital advising) | Japan DC developer-sponsor | gridapex.ai | Omitama 50 MW (TEPCO) + MIE 100 MW (Chubu) power-confirmed sites; wants capital + tech partner |
| Mark | NZ/AU investor (via Khalil) | — | AU/NZ powered land; knows a 3x DC builder; call Fri or next week |
| Finn Puklowski (CEO) / Jason Goodison (CTO) | General Compute — ASIC-first inference neocloud (warm intro incoming, Jul 17) | jason@generalcompute.com | $300M SambaNova SN50 order, air-cooled/low-density, actively seeking colocation in existing facilities — prospective offtaker for the brownfield pipeline + heterogeneous-inference software fit |

**Cards-only / unnamed — fold into the contact-list consolidation the team committed to:** Sequoia-backed Midwest developer (Louisiana/MS/OH focus), IB/direct investor (SC bridge deal), fund packager, 350 MW developer (~$300K/MW comps), energy-reconciliation platform founder, HV substation contractor (questionnaire coming), K&M Advisors, INS Engineering, EOS Capital, GCI (Bexar).

---

## Site pipeline snapshot (as of Jul 16)

| Site | Size | Status | Signal |
|---|---|---|---|
| **Project Sanjac** (E. Houston) | ~100 MW → 250 | NDA in motion, data room days away | Interconnect agreement in hand; NTP possibly 2026 — **top large lead** |
| 250 MW TX site | 250 MW | NDA signed, data room pending | First large site; likely premium priced |
| Ronaldson Road (Baton Rouge) | 10–15 MW+ | Intake at 15 MW; Melanie call on 10 MW min | 138 kV substation on site; "hot site" |
| Crossett, AR | 200 acres | Econ-dev intake form (Eric+Madhu) | Possible freed Georgia-Pacific power |
| Warren, AR | ~300k sq ft / 20 ac | Mayor engaged | 116 kV line upgraded; off-market chicken-plant site nearby |
| Princeton | ~11+12 MW | Email Phil's partner (specific subject line) | Matches 10–20 MW brownfield thesis |
| Ohio (Robert/AEP) | 20 MW | Guaranteed capacity | Mediocre economics, but PACE-eligible |
| Louisiana jeans factory | 50 MW / $30M | At auction | Wastewater on site |
| Santa Anara, CA | 18 MW / $18M | In pipeline | — |
| Bexar County (GCI) | 365 ac | Deprioritized | 30-mo AEP timeline kills speed-to-power |
| 501 Denim Way, MS | 10 MW ask | Effectively dead | Entergy can't serve; MS interruptible mandate |
| Japan — Grid Apex Omitama (Ibaraki) | 50 MW → 650 MW | Docs in hand (teaser + business plan) | TEPCO-confirmed, grid works largely done, 2027 power-on; $19.6M for 49% JV ask |
| Japan — Grid Apex MIE (Tsu City) | 100 MW | Docs in hand (Series A deck) | Chubu-confirmed 154 kV, ~$16K interconnect cost; $15M for 37.5% ask; Q1 2028 first revenue |
| Korea (Zerradc) | 200 / ~700 MW | Relationship stage | Their portfolio; software collab angle |

---

## Japan deep-dive: Grid Apex (docs received Jul 17)

Source docs (in `~/Downloads`): `Grid Apex Teaser_v5.pdf` (YJW Capital), `Grid_Apex_Omitama_Business_Plan_June27 2026.pdf`, `Project_MIE_Series A July 26.pdf`.

**Who they are:** Grid Apex Inc. — Delaware sponsor with a Japan KK subsidiary; YJW Capital advising. Team is finance/manufacturing-heavy (Jun Shimaoka CEO — insurance/asset mgmt, ex-listed-co director; John Ruan COO — BYD/Sharp/CSOT LCD plant builds; Howard Li CSO — Wanbang Energy chairman; Kazuhiro Makiguchi — CEO Grid Apex Japan; Aaron Zhang CTO — cyber/cloud, *not* DC power engineering). **They have no DC track record — which is exactly why they want a tech partner.**

**The assets:**
| | Omitama (Ibaraki, Greater Tokyo) | MIE (Tsu City, between Tokyo/Osaka) |
|---|---|---|
| Confirmed power | 50 MW direct TEPCO; grid-side works substantially complete | 100 MW official from Chubu Electric, 154 kV; interconnect cost only ~$16K |
| Expansion | 200 MW → 400 MW+ → 650 MW total (388,495 m²) | 100 MW cap on 51,819 m² |
| Timeline | Power-on 2027–28, containerized | First 10 MW pod Q1 2028; full 100 MW Q4 2028 |
| Ask | **$19.6M for 49%** of project JV ($40M implied) | **$15M Series A for 37.5%** ($25M pre / $40M post) |
| Economics claimed | $4M/MW build, $2M/MW/yr lease revenue, 60% EBITDA, 23–32% IRR | Same benchmarks; ~$120M EBITDA stabilized; claims $2.4B at 20x EBITDA |
| Debt plan | ~$200M build: $160M debt (~9%, 7-yr) + $40M gov subsidy (20% METI/prefecture reimbursement) | $414–514M total: $300–400M non-recourse debt vs. long-term leases + <$100M subsidy |
| Model | AI-ready colocation / "managed powered shell" — tenants bring GPUs, 5–10+ yr leases | Same |

Plus 7 pipeline sites (Aichi 40 MW, Fukuoka 100 MW, Kagoshima 30 MW, Shizuoka 200 MW, Kanagawa 50 MW, Hokkaido 100 MW, Chiba 30 MW).

**Why this matters:** their whole capital plan hinges on the exact chain we've been mapping — confirmed power → tenant lease ("offtake") → non-recourse construction debt → 20% government subsidy. What they *don't* have: DC engineering, workload/power modeling, tenant relationships in the AI world, or credibility with hyperscaler technical diligence. That's Voltai's wedge.

**Voltai positioning options (not mutually exclusive):**
1. **Technical partner / design authority** — Meridian feasibility + workload sim + Supermicro-grade cluster specs become their tenant-facing collateral; fee + success-based comp, zero capital.
2. **Tenant-recruitment partner with a promote** — bring an AI offtaker (or our own AMD-backstop-style capacity commitment) and take carried economics in the JV rather than writing the check.
3. **Small strategic JV equity** — the Omitama 49%/$19.6M or MIE 37.5%/$15M tickets are in the range CVC/other partners could anchor with Voltai as technical GP; only if diligence verifies power.
4. **Pure comps/intel** — even with no deal, their docs are the best benchmark set we have for Japan ($4M/MW build, $2M/MW/yr lease, 20% subsidy, 65% LTC).

**Diligence flags before anything:** (a) power confirmations are the entire value — verify TEPCO/Chubu paperwork directly, not summaries; (b) MIE deck says final permits "guaranteed by June 2026" — that date has passed, ask for the actual permit; (c) Omitama Article 29 permit is a 1.5–2 yr process still ahead; (d) both decks assume lease rates ($2M/MW/yr) at the top of Japanese comps — pressure-test with Zerradc's Japan view (they see Japan slipping to 2028–29 partly on seismic/multi-story constraints — containerized single-story may genuinely dodge this, but ask); (e) team has zero DC operating history.

---

## Strategy: the offtake question, decoded

The word "offtake" got used at the conference for at least three different contracts. Sorting them out answers the lease-vs-own question:

| What people mean by "offtake" | What it actually is | Who owns what | Who it's for |
|---|---|---|---|
| **1. Colocation / powered-shell lease** (what Grid Apex, Pennybacker, and most financiers mean) | Tenant signs 5–15 yr lease for space + power + cooling; tenant brings GPUs | **You own the facility forever; tenant never owns anything.** The lease IS the offtake | Hyperscalers, neoclouds; this is what banks underwrite for non-recourse debt |
| **2. Compute/capacity offtake** (CoreWeave-style, the existing capacity backstop) | Take-or-pay MSA for GPU-hours or dedicated capacity; you own and operate the GPUs | You own facility AND compute; buyer owns nothing | AI labs, enterprises; higher $/MW, but you eat GPU obsolescence |
| **3. Powered-land / site sale** (the flip — Ocis, GCI, the 250 MW TX seller) | You sell the de-risked site + power rights outright | Buyer takes ownership; your "offtake" is just the sale contract | Developers/hyperscalers buying speed |

**Key insight from the financing meetings:** in model 1, *the financiers underwrite the tenant's credit, not yours*. A signed hyperscaler lease converts into $300–400M of non-recourse construction debt (Grid Apex's whole plan; Rabobank said the same; EOS: post-offtake FMV exceeds build cost enough to pull equity out). So "proceeding without taking ownership of financing" is genuinely possible — the scarce inputs are **site + confirmed power + a creditworthy tenant signature**, not our balance sheet.

**The four ways Voltai can play it** (in rising capital intensity):

- **Path A — Software/platform play (zero capital).** Meridian sells the picks: pre-study screening, workload/power sim, feasibility → spec-sheet → financing collateral. Customers = every developer we met (Zerradc named the gap unprompted; Grid Apex needs it; NVIDIA validated it). Revenue is fees; no financing exposure at all.
- **Path B — De-risk and flip powered land (light capital).** Secure site + power, run the $50K-study gauntlet, sell pre-NTP. Comps: Ocis's $17M Tesla exit, ~$300K/MW land benchmarks. **No offtake needed** — but a tenant LOI attached to the site multiplies exit value (EOS/CVC both said LOI firmness moves price). This is the current 10–20 MW brownfield motion.
- **Path C — Zerradc path: build spec, finance without offtake (heavy, partner-funded).** Requires a capital partner comfortable underwriting siting judgment instead of a lease — Zerradc says that's the hard part of their model too. CVC said they'll buy flip sites without offtake but want firm LOIs. Realistically this path = Path B with a deeper-pocketed JV partner (CVC, Pennybacker, Grid Apex-style structures) where Voltai contributes sites + tech for a promote, not cash.
- **Path D — Own compute / sign capacity offtakes (Cerebras/AWS convo).** Sell capacity (model 2) to a lab or neocloud. Highest revenue per MW, and the existing capacity-backstop agreement already puts us halfway there. The Cerebras/AWS conversations are worth having *now* even if we never build: (1) their required specs (density, cooling, network, timeline) become Meridian's target output; (2) an LOI from them — even conditional — is the single highest-leverage artifact for every other path.
  - **Live Path D lead (Jul 17): General Compute** — ASIC-first inference neocloud (SF, $15M seed @ $60M post, FUSE VC; 7 ppl), $300M of SambaNova SN50s on order, **air-cooled/lower-density → drops into existing brownfields with no liquid-cooling retrofit**, CEO publicly hunting colocation deals (incl. crypto-mine conversions). Warm intro incoming. Pitch: match 2–3 pipeline sites (Princeton, OH, AR) with Meridian feasibility collateral → colocation LOI; second thread = Meridian serving-plan module models their exact prefill/decode disaggregated, heterogeneous architecture (capacity planning: tokens/s per MW per site); possible three-way with Zerradc (Asia hetero-inference ask). Cautions: neocloud credit < hyperscaler (LOI sweetens flips, won't anchor non-recourse debt); 7-person/$15M company with $300M chip order — structure colo with deposits/prepay, diligence their chip-order financing (Three Point Capital intro could sweeten).

**Recommendation:** these aren't either/or — A is the constant (it monetizes every path and every competitor), B is the live business, and the Cerebras/AWS conversations (D) should start now purely to manufacture LOIs, which then let us choose between flipping at a premium (B), partner-funded builds (C), or holding (via model-1 leases). The one thing *not* to do is write our own equity into construction — every structure we saw this week exists precisely so the developer doesn't have to.

---

## Next steps (consolidated, prioritized)

### This week (by ~Jul 18)
1. **Sanjac NDA** — sign Victor's mutual NDA (or send Voltai's); review data room when it lands; then commercial discussion.
2. **NVIDIA package** — send Jared company info + product flyers + simulation design specs; submit power sites to his brownfield tracker (unlocks Austin brownfield specialist + Sim Ready/Max LPS teams).
3. **Ronaldson Road** — submit intake at 15 MW; quick call with Melanie on the 10 MW distribution threshold before committing the $50K study.
4. **Crossett** — Eric + Madhu complete the economic-development intake form → schedule Katherine call.
5. **Geospatial platform demo** — was floated for "Friday"; text to confirm.
6. **Mark (NZ/AU) call** — set up group text; Fri or early next week.
7. **Conference contact list** — consolidate all cards/emails (team committed in Jul 16 DC Sync), especially the remaining unnamed ones (Sequoia-backed developer, Phil's partner — use a clear, specific subject line).
8. **Grid Apex** — share the three docs with the team; request TEPCO/Chubu power-confirmation paperwork and the MIE final permit under NDA; draft the technical-partner proposal (Meridian feasibility + workload sim + tenant-spec collateral, fee + promote structure) before discussing any equity ticket.
9. **General Compute (warm intro)** — before the call: pick 2–3 sites matched to air-cooled ASIC specs and generate Meridian feasibility one-pagers; ask = conditional colocation LOI on a named site; offer SN50 capacity-planning modeling as the technical hook.

### Week of Jul 20 (heavy follow-up cluster)
8. **Kevin Hughes feasibility firm** — team briefing call (top Meridian priority: utility base-case data access).
9. **Paces joint demo** — AB + Eric; trial can run parallel to paperwork.
10. **INS Engineering** — follow-up with broader US team; NDA OK'd for their materials.
11. **K&M Advisors** — follow-up call with international-experience colleagues (build-small vs bridge-with-BTM decision).
12. **Pennybacker** — sign NDA, assess sites + CRA structure, follow up on water.
13. **Rabobank** — intro Wouter to Rabib (financing lead).
14. **Harbinger** — expect deck; connect to Korea team for phase-1 bridge/backup.
15. **Peter (turbines)** — email equipment specs/needs.
16. **EOS Capital** — schedule success-fee advisory call.
17. **Substation contractor** — expect questionnaire (transformer sizes/specs for 50–100 MW pipeline sites); respond.
18. **CVC (Angelo Lacroix)** — send most-advanced-site materials; route Korea to their APAC team; flag Grid Apex Japan tickets as a possible co-anchor.
19. **IB/direct investor** — expect SC deal details; schedule structure/offtake call.

### Week of Jul 27
20. **PACE presentation (Robbie's team)** — prerequisite: assemble Ohio + Arkansas site details and identify equity/land co-financing parties.
21. **Sequoia-backed Midwest developer** — follow-up call (they're traveling until then).

### Standing / strategic
- **Offtaker LOIs remain the #1 commercial milestone** — package Helio reference design + site spreadsheet as collateral; A/B test the auto-generated spec-sheet with financier contacts; use Supermicro's free 2-week cluster proposal once a US site locks. Start the Cerebras/AWS capacity conversations now (see Strategy section) — even a conditional LOI is the highest-leverage artifact across every path.
- **Contract power-engineer search** (not FTE, not consulting firm) — still open; Zerradc/K&M/INS conversations all reinforce the need.
- **Scrub pipeline-customer names (e.g., AMD) and internal codenames from the demo** before external sharing; pick a plain customer-facing product name.
- **Watch:** FERC large-load credit-requirement ruling (~Sep); Dallas DICE conference next month.
