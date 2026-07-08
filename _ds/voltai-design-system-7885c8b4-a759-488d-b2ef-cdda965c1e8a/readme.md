# Voltai Design System

> The design system for **Voltai** — the holistic AI partner for semiconductor
> and electronic-hardware development. This repository encodes Voltai's brand:
> its color, type, motion, iconography, reusable UI components, product UI kits,
> and a slide template. Consuming projects link one file (`styles.css`) and pull
> components from the compiled bundle.

---

## 1. Company & product context

Voltai builds AI models and agents that **learn, evaluate, plan, experiment, and
interact with the physical world** to design PCBs and ASICs. The thesis: the most
performant systems of the future come from co-designed software + hardware +
manufacturing, and superintelligent systems that reason across the entire stack
will enable it. Voltai's world models let agents run *billions* of simulated
experiments, then verify results in the real world to collect rich datasets.

**Traction:** Works with most of the world's largest semiconductor companies, plus
large consumer-electronics and automotive companies; a board-level priority for
customers; engaged by sovereign nations. Backed by Stanford and top Silicon Valley
investors; team includes ex-Stanford professors, SAIL researchers, Olympiad
medalists, and former CTOs of Synopsys & GlobalFoundries.

### Products (from the company deck)
- **Polaris** — semiconductor / IC line: Design Verification, Multiphysics Simulation.
- **SuperNova** — hardware / systems line: Component Selection, PCB Design.
- **Thunderbolt** (formerly Spec Agents) — rapid RTL bring-up + in-house formal engines.
- **System Design** — schematic review, design chat with circuit-level understanding.
- **Knowledge / Library / Parts / Web Agents** — "semiconductor expertise at your fingertips."
- **Multi-GPU / Multi-Physics simulation** — unified solver (parasitics, EM, thermal).

### Sources provided (store for reference — reader may not have access)
- `uploads/1. Voltai_Logo_Black.png`, `uploads/8. Voltai_Logo_White.png` — wordmark lockups (→ `assets/logo/`).
- `uploads/ChatGPT Image ….png` ×2 — diffraction-grating / wafer-microgrid mood imagery (→ `assets/imagery/`).
- `uploads/Screenshot 2026-06-25 at 1.28.46 AM.png` — futuristic mood board (cinematic dark, Swiss-technical type, spectral light).
- `uploads/deck.pdf` — *"[Rough version for Laya]"* company deck, 39 pp. Used for **content/context only — not design.** Brand red, cream canvas, line icons, and capsule/circle motifs were sampled from it.

No codebase or Figma was attached. UI kits below are **plausible reconstructions** of Voltai's product surfaces built from the deck's product descriptions + the brand foundations — they are not pixel traces of shipping screens. **Flag for the user:** attach the real product codebase or Figma to make the UI kits authoritative.

---

## 2. Content fundamentals — how Voltai writes

- **Voice:** precise, confident, engineering-grade. Voltai speaks like a principal
  engineer who has earned the room — declarative, never hype-y. *"We become your
  formal team — the entire job, from testplanning to sign-off."*
- **Person:** "we"/"Voltai" for the company; "you/your" for the customer's team and
  workflow. *"Voltai can connect to it."* / *"Don't see what you need? Don't worry."*
- **Casing:** Sentence case for headlines and body. **ALL-CAPS mono** is reserved for
  the technical register: classification banners (`CONFIDENTIAL · NDA RESTRICTED`),
  eyebrows, section indices (`| 01 BACKGROUND`), metric labels, and table headers.
- **Numbers do the talking.** Claims are quantified and specific: `32× solver speedup`,
  `28 min full extraction`, `201M degrees of freedom`, `93% accuracy`, `30–40% timeline
  reduction`, `10X` formal efficiency. Pair a big number with a terse mono caption.
- **Trademark:** the company is rendered **Voltai™** in running text and `VOLTAI™ 2026`
  in lockups/footers. Footer line: `© Voltai Inc. 2026`.
- **Tone words used as section headers in brand copy:** TRANSISTORS, BITS, SIGNALS,
  AMPLIFIERS — physics/electronics terms used as evocative chapter markers.
- **No emoji. Ever.** No exclamatory marketing-speak. Sentences are short and load-bearing.
- **Em dashes and middots** structure technical lists (`features · abstractions · reductions`).

---

## 3. Visual foundations

**Overall vibe:** futuristic, cinematic, cool. The **dark "void"** register leads —
near-black blue-black surfaces, the wafer-diffraction microgrid, electric volt-blue
accents and icy highlights. A cool **light** register (neutral off-white, ink, the
same volt blue) exists for docs and spec sheets. No warm tones; no red anywhere.

- **Color:** Built on **Ink/Void** (cool near-black blues, `#04080c`), a cool
  off-white surface (`#f6f8fb`), and **Volt** — Voltai’s electric steel-blue accent
  (`#1f5e85` brand → `#4fb0e6` electric), sampled from the wafer-diffraction imagery.
  **Ice** highlights (`#9dbbd4` → `#fafcfe`) carry glow. A cool neutral gray ramp does
  the structural work. **Spectral accents** (cyan/blue/violet/teal/amber) appear *only*
  in data viz and glows — never as decorative gradients. **No red, no warm tones.**
- **Type:** **Space Grotesk** for display/headings (geometric, technical),
  **IBM Plex Sans** for body/UI (engineering-neutral), **IBM Plex Mono** for every
  label/metric/spec line. Display is tight-tracked (`-0.015 to -0.03em`); mono
  eyebrows are wide-tracked (`0.12–0.22em`) and uppercase. *(Substitutes for Voltai's
  proprietary wordmark face — see Caveats.)*
- **Backgrounds:** flat color, not gradients. The signature texture is the
  **diffraction-grating microgrid** — a fine 14px square grid (`.v-grid-texture`) and
  the real wafer/grating photography in `assets/imagery/`. Imagery is cinematic and
  **cool-toned** (steel blues, near-black) with occasional warm spectral refraction;
  high contrast, slight grain, lots of negative space.
- **Geometry & radii:** mostly **hard-edged** and grid-disciplined. Two deliberate
  rounded exceptions: full **pills** (capsule badges, nav, the deck's category labels)
  and **circle** icon-badges (the diagram nodes). Cards use a restrained `10px` radius;
  inputs/buttons `4–6px`.
- **Borders:** hairline. On paper, warm `#ddd9cc`; on void, `rgba(255,255,255,.10)`.
  Borders carry the structure — Voltai prefers a crisp 1px line over a heavy shadow.
- **Elevation:** subtle and cool on the light surface (soft, low-spread shadows). On
  void, almost no drop shadow — instead a faint top inset highlight + ambient depth, and
  an **electric volt glow** (`--glow-volt`) for active/focus moments only.
- **Motion:** precise, **no bounce**. Standard easing `cubic-bezier(0.2,0,0,1)`,
  entrances `cubic-bezier(0.16,1,0.3,1)`. Durations 80/140/220/360ms. Fades and short
  translates; nothing springy or playful.
- **Hover:** step one notch on the volt ramp (light: → `volt-500`; dark: → `volt-300`);
  ghost controls fill with `--surface-fill`. **Press:** step to `volt-700` and a 1px
  settle (no scale-bounce). **Focus:** 2px `--focus-ring` with 2px offset.
- **Transparency & blur:** used sparingly — frosted nav/overlays on the dark register
  (`backdrop-filter: blur`) and low-alpha fills for selection/tints. Not a decorative
  glassmorphism system.
- **Layout rules:** wide gutters, 4px spacing rhythm, mono micro-labels anchored to
  corners (classification top-left/right, page index bottom-right) echoing the deck.

---

## 4. Iconography

- **System:** **Lucide** (CDN) — thin, rounded, consistent-stroke line icons. This
  matches the deck's line-icon language exactly: outlined shield, waveform, chip, and
  PCB glyphs drawn on a single ~1.5–2px stroke, frequently set inside a **circle
  badge** (1px ring) as a diagram node. Load from
  `https://unpkg.com/lucide@latest` (or `lucide-react` in React surfaces).
- **Why Lucide (substitution flag):** the deck's icons are custom but stroke-matched to
  Lucide; no proprietary icon font was provided. If Voltai ships a custom icon set,
  drop it into `assets/icons/` and update this section.
- **Usage:** monochrome — inherit `currentColor`. Default `--text-body`; oxide only for
  active/brand nodes (volt). Inside circle badges for process/diagram steps; inline at
  `1em`–`1.25em` for UI affordances. **No emoji, no multicolor icons, no filled
  pictograms.** Unicode is used only for the trademark `™` and middot `·`.
- **Logo:** wordmark lockups in `assets/logo/` (`voltai-black.png` on light,
  `voltai-white.png` on dark). The mark is the wordmark — there is no separate symbol.
  Give it clear space ≈ the cap height on all sides; never recolor it outside
  ink / surface / volt.

---

## 5. Index / manifest

**Root**
- `styles.css` — entry point (link this). `@import`s every token + font file.
- `readme.md` — this file. `SKILL.md` — portable Agent-Skill wrapper.

**`tokens/`** — `fonts.css` (@font-face), `colors.css`, `typography.css`,
`spacing.css`, `elevation.css` (radius + shadow + motion), `base.css` (reset/helpers).

**`assets/`** — `logo/` (wordmark lockups), `imagery/` (wafer-grid mood photos),
`fonts/` (self-hosted woff2).

**`guidelines/`** — foundation specimen cards (Colors, Type, Spacing, Brand) shown in
the Design System tab.

**`components/`** — reusable React primitives (Button, IconButton, Input, Select,
Textarea, Checkbox, Switch, Badge, Tag, MetricStat, Card, Tabs, Avatar, Banner,
ProgressTrack, Tooltip, Dialog, IconBadge). Each has `.jsx` + `.d.ts` + `.prompt.md`,
grouped under `components/<group>/` with a `*.card.html` thumbnail.

**`ui_kits/`**
- `web/` — Voltai marketing/web surfaces (dark hero, products, footer).
- `product/` — the Voltai product app (System Design + Verification workspace).

**`slides/`** — slide template sample slides (title, section, content, metric,
quote, diagram) at 1280×720.

---

## 6. Caveats / open questions

- **Fonts are substitutes.** Voltai's wordmark uses a proprietary geometric face; this
  system stands in **Space Grotesk** (display) + **IBM Plex Sans/Mono** (text/data).
  *Please send the real brand fonts to swap in.*
- **Icons are Lucide** (stroke-matched substitute). Send the real set if one exists.
- **UI kits are reconstructions** from the deck + foundations, not traced from product
  code. Attach the codebase or Figma to make them authoritative.
- The **volt-blue** accent (`#1f5e85` / `#4fb0e6`) and Ice highlights were sampled from
  the wafer-diffraction imagery; confirm Voltai’s official accent hex.
