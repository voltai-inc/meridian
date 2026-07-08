# Vertiv Technical Ask — Draft
**For CTO review before sending · July 2026**

---

## Context

Giordano Albertazzi (Vertiv CEO) agreed in our July 2 call to connect us with Vertiv's technical team for a follow-up discussion. He has accepted an advisory role and is speaking at Labib's Stanford course in the fall.

The initial call was relationship-focused — no specific technical ask was made. This is the right moment to make the ask concrete, but it should be framed as a mutual benefit, not a data request.

---

## What We're Building (the framing)

We've built Meridian, a pre-build AI data center evaluation tool. When a developer evaluates a site, they can input their grid MW, chip choice, and cooling configuration, and get a spec sheet they can hand to an off-taker for an LOI.

Right now, the cooling performance in Meridian is modeled from Vertiv's published spec sheets — steady-state values. That's the best available public data. But AI training workloads are not steady-state: they have checkpoint spikes (10–30 second surges to 130%+ of nominal load), all-reduce phases (periodic high-load synchronization across the cluster), and rapid idle-to-peak transitions that standard CDU specs don't cover.

The gap matters: a site that passes a steady-state analysis might fail a transient analysis, meaning BESS is required, or the CDU is undersized for real workloads. Meridian's "Power Sign-off" module models this — but the CDU performance curves feeding that model are estimated.

If Vertiv provides real transient performance data, every analysis that Meridian produces with Vertiv equipment would carry the label "● verified — Vertiv data." That's a meaningful signal to developers and off-takers. It also positions Vertiv's CDU products as the ones that have been validated against real AI training workloads — a differentiation point that matters as competitors enter the liquid cooling space.

---

## The Specific Ask

Two things:

**1. CDU transient performance under AI training load profiles**
- Specifically: XDU1350 and XDU450 response to checkpoint spike events (rapid load step from 70% to 130%+ nominal, 10–30 second duration)
- Response time, thermal lag, any de-rating required under sustained spike frequency
- Format: any internal test report or performance curve is fine — we're not asking for anything not already tested

**2. Trim cooler efficiency curves at variable ambient wet-bulb**
- Vertiv CoolLoop performance at 25°C / 30°C / 35°C / 40°C ambient wet-bulb
- Currently we use the nameplate rating with a climate adjustment factor — actual curves would let us model hot/humid sites properly
- This matters specifically for Texas, Southeast US, and Korea deployments

---

## What We're NOT Asking For

- No proprietary design specifications
- No future product roadmaps
- No pricing
- Nothing that requires an NDA beyond the standard advisor agreement already in progress

Both requests are about published or tested performance under specific conditions — the kind of data Vertiv's applications engineering team routinely generates.

---

## Suggested Email Draft (from Labib or Erfan to Giordano)

> Hi Giordano,
>
> Great to connect last week. Following up as promised.
>
> I wanted to share something we've built that I think will interest you — and that I'd love Vertiv's input on. We've developed Meridian, a pre-build AI data center evaluation tool that developers use to go from site address → spec sheet in minutes. It models chip selection, cooling design, power infrastructure, and financial return before any engineering engagement starts.
>
> We currently model CDU performance using Vertiv's published spec sheet values, which works well for steady-state analysis. But AI training workloads have significant transient behavior — checkpoint spikes specifically — that steady-state specs don't fully capture. We'd love to incorporate real transient performance data for the XDU1350 and XDU450 under training load profiles, and trim cooler efficiency curves at variable ambient wet-bulb.
>
> If Vertiv provides this, every Meridian analysis using Vertiv equipment carries a "verified — Vertiv data" label. Developers and off-takers see that signal at the point of evaluation, before they've engaged any engineering firm. It's a meaningful differentiation for your CDU product line against emerging competitors.
>
> Happy to show you Meridian first so you can see the context. Would your applications engineering team be the right contact for this kind of data? I can work with whoever makes most sense.
>
> Thanks,
> [Labib / Erfan]

---

## CTO Review Notes

**Why CTO should know before we send:**
- We are effectively proposing that Vertiv's performance data goes into a commercial tool
- Even if the data is not secret, we should be clear internally that this is the direction before we commit to Giordano
- The "verified" label has commercial implications — it implies Voltai endorses Vertiv equipment in the tool (which we do, but it should be a deliberate decision)
- If Vertiv's response is to ask for a formal data sharing agreement or co-marketing arrangement, that's a business development conversation that should involve leadership

**Suggested CTO question:** Is the "verified — Vertiv data" label and co-branding in Meridian something we want to commit to, or should we keep it at "Vertiv CDU" without the verified tag until there's a formal partnership?
