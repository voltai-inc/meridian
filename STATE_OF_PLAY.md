# STATE OF PLAY — read this first

**This repo is the source of truth for Voltai's data-center project (Meridian).** A new working session — human or AI — should be able to orient from this file alone: what the project is, where everything lives, what's currently in motion, and what to do next.

_Last updated: 2026-07-21._

## What this project is

Voltai builds AI for semiconductors (chip/board design & verification). This project extends that expertise up the stack — chip → board → rack → data center — into two intertwined tracks:

1. **Sites**: develop/de-risk powered data-center sites — a large project in South Korea plus a pipeline of 10–200 MW US sites (mostly powered brownfield retrofits) — and monetize via flip, partner-funded build, or lease.
2. **Software (Meridian)**: the workload→power simulation and site-intelligence platform in this repo — pre-power-study screening, per-workload power modeling, serving/capacity planning, feasibility → spec-sheet → financing collateral.

The two feed each other: the software makes our sites credible to tenants and financiers; the site work generates the ground truth that makes the software real.

## Repo map

| Path | What it is |
|---|---|
| `index.html` | Dashboard — pipeline story: 01 Find → 02 Evaluate (Meridian) → 03 Procure |
| `site-selection.html` | 01 Find — live site map (syncs from Eric's site-tracker Google Sheet) |
| `site-intelligence.html` | 02 Evaluate — Meridian workspace (feasibility, workload power, serving plan) |
| `serving-model.js` | DOM-free roofline serving/sizing engine (has `selfTest()`) |
| `power-validation.js`, `power-signoff.html` | Workload-power validation + envelope check / design review |
| `helio.html` + `support.js` | Helio reference design (Rev 0.6; generated — don't hand-edit support.js) |
| `procurement.html` | 03 Procure placeholder (teammate's build; consumes Meridian's BOM) |
| `example-feasibility-study.html` | Example utility feasibility study (Meridian's expected input) |
| `intel/` | **Field intel** — conference/call digests, market learnings, contacts, strategy |
| `MERIDIAN_PRIMER.md`, `MERIDIAN_TEAM_DOC.md` | Product thinking, worth-it assessment, kill-tests |
| `PRODUCT_PICTURE.md`, `PRODUCT_STRUCTURE.md` | Team walkthrough w/ screenshots; training/inference mode fork spec |
| `TEAM_BRIEF_POWER_MODEL.md` | Power-model brief + EE-review questions (+ `scripts_sensitivity_sweep.js`) |
| `UPDATE_*.md`, `STRUCTURAL_CHANGE_*.md` | Dated changelogs |
| `VERTIV_ASK.md` | Vertiv collaboration ask (per-chip cooling/power data) |

## Current state (as of 2026-07-21)

- **Jul 21 — site tracker updated** (`site-selection.html`, now ahead of the source sheet — reconcile on next sheet sync): added 851 Buckeye Ct Milpitas CA (18 MW total / 10 MW now, ~$18M, C&W data room received Jul 13, above the sub-$800K/MW screen), Crossett AR (200-ac tree farm, 15 MW Entergy confirmation in progress — questionnaires received Jul 20), Warren AR (mayor engaged, 116 kV claim unconfirmed), Boaz AL (Cresa; Tenneco leasehold to 2043, early). Status fixes: 19120 Hwy 51 is Hazlehurst **MS** (Entergy ~10 MW possible), 501 Denim Way effectively dead, Foti/Donaldsonville deprioritized (substation likely customer-dedicated), Encova — KBC coordinating AEP expansion (sketch requested Jul 14). Partner-facing pipeline doc v2 drafted in Google Drive same day.

- **Branch:** `workload-sim-v2` (Serving Plan module, training/inference mode fork, Helio 0.6) is **merged into `main`** as of Jul 19. Work from `main`.
- **Live deploy:** voltai.world (Vercel, deploys from this repo).
- **Intel:** `intel/2026-07-16_conference-week.md` is the master digest of the PowerUp DC Austin conference (Jul 14–16) + the week's utility/vendor/partner calls — key learnings, ~20 named contacts, full site-pipeline snapshot, financing instruments, strategy framing (the "offtake decoded" section), and a prioritized next-steps list. **Start there for anything commercial.**
- **Top commercial threads right now:** Project Sanjac (E. Houston ~100 MW, interconnect in hand — NDA/data room), NVIDIA follow-up (Jared Carl — workload-sim gap validated, Sim Ready/Max LPS intro paths), Grid Apex Japan (Omitama 50 MW TEPCO + MIE 100 MW Chubu — tech-partner positioning), General Compute (ASIC inference neocloud — colocation fit for brownfield sites), heavy follow-up cluster week of Jul 20 (Kevin Hughes feasibility firm, Paces, INS, K&M, Pennybacker, Rabobank→Rabib) and PACE presentation week of Jul 27.
- **Product next:** deepen workload sim per the Jul 10/13 syncs; auto-generated offtaker/financier spec-sheet from a confirmed site; demand-side optimizer direction (nonlinear GPU power, load flexibility) pending EE validation — see `TEAM_BRIEF_POWER_MODEL.md`.
- **Jul 19 — per-model power differentiation shipped** (`UPDATE_2026-07-19.md`): Workload Power now derives the trace from a named model (dense vs MoE → different forcing frequency, checkpoint signature, duty), adds a five-model comparison strip and an adjacent-racks heatmap (three tenants on one chain), and a data-provenance panel carrying the "here's what we'd do with your data" narrative — directly addressing the gap NVIDIA's Global AI DC Lead named. **How we communicate it → `intel/2026-07-19_nvidia-followup-comms.md`** (Eric's thread: Jared package = flyer + design-spec brief + site tracker; demo stays in-house until Sim Ready/Max LPS engineers engage; Erfan/Labib sync is for alignment only).

## Where non-repo assets live

- **Local work files:** `~/VoltAI/data-center/<project>/` (intel, site-selection, korea, equipment, design, btm, hiring, regular-outreach). Third-party **confidential** docs (e.g., Grid Apex/YJW decks in `site-selection/japan-grid-apex/`) stay there — never commit them here (public repo).
- **Site tracker:** Eric's Google Sheet (embedded snapshot in `site-selection.html`; re-sync manually).
- **Meeting notes:** Granola (searchable); digests get distilled into `intel/`.

## Conventions

- New week/conference digests → `intel/YYYY-MM-DD_<slug>.md`, and update the "Current state" section here.
- This is a **public** repo: no third-party confidential documents, no API keys, no personal contact info beyond business cards freely given. Product codenames (Meridian/Helio) are internal — use plain names in customer-facing material.
- Dated changelog docs (`UPDATE_*`, `STRUCTURAL_CHANGE_*`) are append-only history — don't rewrite them.
