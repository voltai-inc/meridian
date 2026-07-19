# NVIDIA follow-up — communication plan
_2026-07-19 · Eric owns this thread end-to-end. Companion to `UPDATE_2026-07-19.md` (what shipped in the product) — this file is how we communicate it._

## Source conversations

- **Jul 14, PowerUp DC Austin — Eric + AB × Jared Carl (NVIDIA Global AI Data Center Lead).** Granola `641b01ed`. Jared confirmed the gap in his own words: NVIDIA simulates at a flat utilization percentage ("you're running 80% workload"), with no per-model breakdown and no way to differentiate power draw between models on adjacent racks. He is *not* technical ("I just connect engineer dots") — his value is routing us to the **Sim Ready** team and the **Max LPS** (Land Power Shell, internal power balancing) team.
- **Jul 17, DC sync (Eric/AB/Erfan/Priyanka/Labib).** Granola `37515f4b`. Agreement: strengthen the prototype, but keep external pitches high-level — engineering teams could see through an early-stage demo. Labib: remove the auth layer (done — voltai.world is public). The mitigation for the data gap: a clear "here's what we'd do with your data" narrative.

## What Jared actually asked for — all communications, no demo

1. **"Send me an email with your information including flyers and stuff"** → he pokes Sim Ready + Max LPS internally.
2. **"Shoot me your design specs"** → a document his engineers can read. His literal framing: *"Is your output just a Sim Ready asset, or do you output something else you can translate back into the data center sim load?"*
3. **Site tracker** → he sends his brownfield/power tracker; our sites in it connect us to NVIDIA's brownfield specialist (Austin-based).
4. Unprompted, he flagged the data-access problem and hinted he could help: *"if you need somebody like CoreWeave... to collect their data from it on the modeling."* The "with your data" narrative lands on receptive ears.

## The package (Eric sends, one email this week)

1. **Product flyer** — 1 page: "site address → off-taker-ready spec sheet", the flat-utilization gap, the partner-data ask. Leadership contacts: Priyanka (CEO), Labib (President), Erfan (CTO); Eric's name stays off collateral for now. Drafted — `flyer.html`, PDF exported.
2. **Design-spec brief** — ~2 pages answering Jared's question directly: sim inputs/outputs, mapping to Sim Ready assets / Omniverse, how it could feed Max LPS, what data we'd need and what it unlocks. Framework-credible, no validation overclaims. To write next.
3. **Site list for Jared's tracker** — from the site pipeline; only clearly disclosable sites (brownfields, the 250 MW site); nothing NDA'd or partner-sensitive.

## What the Erfan/Labib sync is for — alignment, not action items

They don't need to do anything; Eric runs the thread. The sync is to confirm, before the email goes out:

- **The story is approved** — the flyer carries leadership names and the Sequoia/Stanford/Alphabet-chairman line; no surprises when Jared forwards it internally.
- **The technical claims are comfortable** — the design-spec brief describes a framework plus a data ask, not validated results; flag anything Erfan wouldn't want in front of NVIDIA engineers.
- **Site disclosure line** — quick yes/no on which pipeline sites can go in an NVIDIA tracker.
- **The "verified — partner data" direction** — same commercial commitment being teed up with Vertiv (`VERTIV_ASK.md`): partners supply measured data → their equipment carries a verified label in front of developers, off-takers and financiers at the point of evaluation. Worth blessing once so the NVIDIA and Vertiv asks stay consistent.

## Demo policy

**The prototype is not part of the Jared package.** The Jul 19 product work (per-model power differentiation, adjacent-racks view, estimated/verified provenance labeling — see `UPDATE_2026-07-19.md`) is for the *second* touch, when Sim Ready / Max LPS engineers engage and may look closely. Until then: high-level only (Labib's standing guidance). When engineers do engage, the demo now leads with the exact gap Jared named and labels every estimated figure — the "see-through" risk is addressed by honesty about provenance, not by hiding the tool.

## Timeline

- **Week of Jul 20:** sync → send Jared the package. (Same week as the Kevin Hughes / Paces / INS / K&M / Pennybacker / Rabobank follow-up cluster — see `intel/2026-07-16_conference-week.md`.)
- **On Jared's reply:** submit sites to tracker; prep for a Sim Ready / Max LPS technical intro using the strengthened demo + "with your data" walk-through.
