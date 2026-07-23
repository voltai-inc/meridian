// Vercel serverless function — dashboard chat proxy.
// Holds the Anthropic key server-side (set ANTHROPIC_API_KEY in the Vercel
// project's Environment Variables) so it is never shipped to the browser.
// The browser posts only { messages }; model, system prompt and limits are
// fixed here so the endpoint can't be used as an open relay for the key.

const SYSTEM = `You are the assistant on Voltai's Data Center dashboard — an internal toolkit for finding a site, evaluating it, and reviewing its design. Be concise and direct.
Site Selection (relative links work):
- Site Selection (site-selection.html): map + tracker of candidate powered sites (pipeline and prospecting, synced from the team's site sheet). Click a site to evaluate it.
- Pipeline Analysis (pipeline-analysis.html): guided evaluation — takes site, chip, and workload requirements and ranks candidate sites on readiness, economics, and risk.
Design Review:
- Meridian (site-intelligence.html): the core product — takes a utility study or site power claim and evaluates compute readiness: per-chip compute design, MFU at scale, workload power verdicts, envelope check, economics sensitivity, off-taker spec sheet.
- Power Sign-off (power-signoff.html): the deep-dive review bench behind Meridian's inline verdict — a facility electrical design (scaled Helio block or the EPC's actual values) stress-tested against AI workload transients (UPS/genset/BESS, ramp, oscillation), pass/warn/fail. Power sign-off is the first review dimension; cooling and network are roadmap.
- Digital Twin: interactive 3D facility simulator (not currently linked from the dashboard).
- Compliance Agent: upload documents, run compliance checks against frameworks (ASHRAE TC9.9, NVIDIA DSX CDU, IEC) (not currently linked from the dashboard).
Modules:
- Helio Reference (helio.html): the 2N reference architecture (10→100 MW block) Meridian validates against.
- Procurement Agent (procurement.html): demo of the BOM → RFQ → PO flow — receives Meridian's Build-tab BOM, matches lines to a vendor library, drafts printable RFQs. Production version (equipment-library backed) is in build.
Key concepts you can explain: training vs inference power behavior, MFU, synchronized fleet transients, chip power profiles (GB300 on-board smoothing), the envelope check, supply vs demand. When a question is better answered inside a tool, say which tool and why.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return res.status(500).json({ error: { message: 'Server is missing ANTHROPIC_API_KEY.' } });
  }

  // Vercel parses a JSON body automatically; fall back to manual parse just in case.
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const messages = body && body.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: { message: 'Expected a non-empty "messages" array.' } });
  }

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-8',
        max_tokens: 1024,
        system: SYSTEM,
        messages,
      }),
    });
    const data = await upstream.json();
    return res.status(upstream.status).json(data);
  } catch (e) {
    return res.status(502).json({ error: { message: 'Upstream request failed: ' + e.message } });
  }
}
