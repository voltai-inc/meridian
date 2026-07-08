/* @ds-bundle: {"format":3,"namespace":"VoltaiDesignSystem_389303","components":[{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Callout","sourcePath":"components/core/Callout.jsx"},{"name":"Tag","sourcePath":"components/core/Tag.jsx"}],"sourceHashes":{"assets/glyph-field.js":"24f09ab1c0f3","assets/line-field.js":"42f7217979ee","assets/sand-grain.js":"103b10a933dc","assets/vortex-grid.js":"95b5fb102f77","assets/warp-grid.js":"4f024dc59621","components/core/Button.jsx":"5613dfa81be8","components/core/Callout.jsx":"71de996988f3","components/core/Tag.jsx":"b2084e6ab15e"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.VoltaiDesignSystem_389303 = window.VoltaiDesignSystem_389303 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// assets/glyph-field.js
try { (() => {
/* ============================================================
   VOLTAI — GLYPH FIELD
   The component-glyph counterpart to the warp grid: a dense
   field of tiny electronic-component glyphs (IC packages,
   resistors, capacitors, vias) that MASS into a word. A bold
   word is rendered to an offscreen mask; cells whose center
   falls inside the letterforms draw at full ink, the rest fall
   back to a faint connective texture — so the components
   themselves spell the word, the way ASCII art does with type.

   One cell — never more — lights signal-green (brand rule).

   Pure canvas, no dependencies. Same mount/draw contract as
   VoltaiWarp / VoltaiLines so the deck engine treats them alike.

   Usage:
     <canvas class="glyphs" data-text="CONCORD"></canvas>
     VoltaiGlyphs.mount(canvasEl, { text:'CONCORD', invert:true })

   Options:
     text        word the glyphs mass into       default 'CONCORD'
     cell        grid cell size in px            default 22
     glyphs      palette (weighted)              ['ic','res','cap','via']
     invert      true → light glyphs on void     default false
     onAlpha     glyph opacity inside the word   default 0.95
     offAlpha    glyph opacity in the texture    default 0.085
     offDensity  fraction of texture cells drawn default 0.55
     color       glyph stroke override           default themed ink
     accent      green override                  default themed green
     accentAt    'center' | 'auto' | null        default 'auto'
     weight      mask font weight                default 700
     family      mask font family                default Space Grotesk
     fit         'width' | 'height'              default 'width'
     pad         mask inset fraction             default 0.05
     squareCells force square mask scaling       default false
     seed        rng seed                        default 7
   ============================================================ */
(function (global) {
  /* ---- glyph drawers: center (x,y), radius r, all stroke-based ---- */
  function gIC(ctx, x, y, r) {
    const w = r * 1.25,
      h = r * 1.55;
    ctx.strokeRect(x - w / 2, y - h / 2, w, h);
    const pins = 3,
      span = h * 0.74,
      y0 = y - span / 2,
      dy = span / (pins - 1);
    const ext = r * 0.42;
    for (let i = 0; i < pins; i++) {
      const py = y0 + i * dy;
      ctx.beginPath();
      ctx.moveTo(x - w / 2, py);
      ctx.lineTo(x - w / 2 - ext, py);
      ctx.moveTo(x + w / 2, py);
      ctx.lineTo(x + w / 2 + ext, py);
      ctx.stroke();
    }
    // pin-1 notch dot
    ctx.beginPath();
    ctx.arc(x - w * 0.28, y - h * 0.3, r * 0.12, 0, Math.PI * 2);
    ctx.stroke();
  }
  function gRes(ctx, x, y, r) {
    const w = r * 1.15,
      h = r * 0.6,
      lead = r * 0.55;
    ctx.beginPath();
    ctx.moveTo(x - w / 2 - lead, y);
    ctx.lineTo(x - w / 2, y);
    ctx.moveTo(x + w / 2, y);
    ctx.lineTo(x + w / 2 + lead, y);
    ctx.stroke();
    ctx.strokeRect(x - w / 2, y - h / 2, w, h);
  }
  function gCap(ctx, x, y, r) {
    const gap = r * 0.26,
      ph = r * 1.05,
      lead = r * 0.62;
    ctx.beginPath();
    ctx.moveTo(x - gap, y - ph / 2);
    ctx.lineTo(x - gap, y + ph / 2);
    ctx.moveTo(x + gap, y - ph / 2);
    ctx.lineTo(x + gap, y + ph / 2);
    ctx.moveTo(x - gap - lead, y);
    ctx.lineTo(x - gap, y);
    ctx.moveTo(x + gap, y);
    ctx.lineTo(x + gap + lead, y);
    ctx.stroke();
  }
  function gVia(ctx, x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r * 0.42, 0, Math.PI * 2);
    ctx.moveTo(x + r * 0.16, y);
    ctx.arc(x, y, r * 0.16, 0, Math.PI * 2);
    ctx.stroke();
  }
  const DRAWERS = {
    ic: gIC,
    res: gRes,
    cap: gCap,
    via: gVia
  };
  const WEIGHT = {
    ic: 3,
    res: 3,
    cap: 3,
    via: 1
  };
  function buildBag(glyphs) {
    const bag = [];
    glyphs.forEach(g => {
      for (let i = 0; i < (WEIGHT[g] || 1); i++) bag.push(g);
    });
    return bag.length ? bag : ['ic'];
  }
  function draw(canvas, options) {
    const opts = Object.assign({
      text: 'CONCORD',
      cell: 22,
      glyphs: ['ic', 'res', 'cap', 'via'],
      invert: false,
      onAlpha: 0.95,
      offAlpha: 0.085,
      offDensity: 0.55,
      color: null,
      accent: null,
      accentAt: 'auto',
      weight: 700,
      family: "'Space Grotesk', sans-serif",
      fit: 'width',
      pad: 0.05,
      squareCells: false,
      lineWidth: 1.05,
      seed: 7
    }, options || {});
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const W = Math.max(1, Math.round(rect.width));
    const H = Math.max(1, Math.round(rect.height));
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const css = getComputedStyle(document.documentElement);
    const ink = (css.getPropertyValue('--ink-900') || '#0A0A0A').trim();
    const paper = (css.getPropertyValue('--paper-0') || '#F4F4F2').trim();
    const accent = opts.accent || (css.getPropertyValue('--accent-green') || '#00B894').trim();
    const stroke = opts.color || (opts.invert ? paper : ink);

    // ---- build the word mask on an offscreen canvas ----
    const mask = document.createElement('canvas');
    mask.width = W;
    mask.height = H;
    const mctx = mask.getContext('2d');
    let maskData = null;
    const text = (opts.text || '').toUpperCase();
    if (text) {
      const padX = W * opts.pad,
        padY = H * opts.pad;
      const availW = W - padX * 2,
        availH = H - padY * 2;
      let fs = 200;
      mctx.font = `${opts.weight} ${fs}px ${opts.family}`;
      const m = mctx.measureText(text);
      const tw = m.width;
      const th = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent || fs * 0.72;
      const scale = opts.fit === 'height' ? availH / th : Math.min(availW / tw, availH / th);
      fs = Math.max(8, fs * scale);
      mctx.font = `${opts.weight} ${fs}px ${opts.family}`;
      mctx.fillStyle = '#000';
      mctx.textAlign = 'center';
      mctx.textBaseline = 'middle';
      mctx.fillText(text, W / 2, H / 2 + fs * 0.02);
      maskData = mctx.getImageData(0, 0, W, H).data;
    }
    const inside = (px, py) => {
      if (!maskData) return false;
      const ix = Math.max(0, Math.min(W - 1, px | 0));
      const iy = Math.max(0, Math.min(H - 1, py | 0));
      return maskData[(iy * W + ix) * 4 + 3] > 110;
    };

    // ---- grid ----
    let s = opts.seed >>> 0;
    const rnd = () => {
      s = s * 1664525 + 1013904223 >>> 0;
      return s / 4294967296;
    };
    const cell = opts.cell;
    const cols = Math.ceil(W / cell);
    const rows = Math.ceil(H / cell);
    const offX = (W - cols * cell) / 2 + cell / 2;
    const offY = (H - rows * cell) / 2 + cell / 2;
    const r = cell * 0.30;
    const bag = buildBag(opts.glyphs);
    ctx.lineWidth = opts.lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = stroke;
    const onCells = [];
    const cellsToDraw = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const cx = offX + col * cell;
        const cy = offY + row * cell;
        const on = inside(cx, cy);
        const rv = rnd();
        const gv = rnd();
        if (!on && rv > opts.offDensity) continue;
        const glyph = bag[gv * bag.length | 0];
        const item = {
          cx,
          cy,
          glyph,
          on
        };
        cellsToDraw.push(item);
        if (on) onCells.push(item);
      }
    }

    // ---- pass 1: faint connective texture ----
    ctx.globalAlpha = opts.offAlpha;
    for (const it of cellsToDraw) {
      if (it.on) continue;
      (DRAWERS[it.glyph] || gIC)(ctx, it.cx, it.cy, r);
    }

    // ---- pass 2: the word, full ink ----
    ctx.globalAlpha = opts.onAlpha;
    for (const it of cellsToDraw) {
      if (!it.on) continue;
      (DRAWERS[it.glyph] || gIC)(ctx, it.cx, it.cy, r);
    }

    // ---- the single green cell ----
    if (opts.accentAt && onCells.length) {
      let pick = null;
      if (opts.accentAt === 'center') {
        let best = Infinity;
        for (const it of onCells) {
          const d = Math.hypot(it.cx - W / 2, it.cy - H / 2);
          if (d < best) {
            best = d;
            pick = it;
          }
        }
      } else {
        pick = onCells[rnd() * onCells.length | 0];
      }
      if (pick) {
        ctx.globalAlpha = 1;
        ctx.strokeStyle = accent;
        ctx.fillStyle = accent;
        ctx.lineWidth = opts.lineWidth + 0.4;
        (DRAWERS[pick.glyph] || gIC)(ctx, pick.cx, pick.cy, r);
        // solid green core so it reads as the live component
        ctx.fillRect(pick.cx - r * 0.34, pick.cy - r * 0.34, r * 0.68, r * 0.68);
      }
    }
    ctx.globalAlpha = 1;
  }
  const VoltaiGlyphs = {
    draw,
    mount(canvas, options) {
      if (!canvas) return;
      const opts = Object.assign({}, options);
      if (canvas.dataset) {
        const d = canvas.dataset;
        if (d.text != null && opts.text == null) opts.text = d.text;
        if (d.cell) opts.cell = parseFloat(d.cell);
        if (d.invert === 'true') opts.invert = true;
        if (d.accentAt) opts.accentAt = d.accentAt === 'none' ? null : d.accentAt;
        if (d.offAlpha) opts.offAlpha = parseFloat(d.offAlpha);
        if (d.onAlpha) opts.onAlpha = parseFloat(d.onAlpha);
        if (d.offDensity) opts.offDensity = parseFloat(d.offDensity);
        if (d.fit) opts.fit = d.fit;
        if (d.seed) opts.seed = parseInt(d.seed, 10);
      }
      const render = () => draw(canvas, opts);
      // fonts must be ready or the mask measures with a fallback face
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(render);
      }
      render();
      let raf;
      const ro = new ResizeObserver(() => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(render);
      });
      ro.observe(canvas);
      return {
        redraw: render,
        destroy: () => ro.disconnect()
      };
    }
  };
  global.VoltaiGlyphs = VoltaiGlyphs;
})(window);
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/glyph-field.js", error: String((e && e.message) || e) }); }

// assets/line-field.js
try { (() => {
/* ============================================================
   VOLTAI — LINE FIELD
   Generative line-art motifs that pair with the warp grid:
     · rings  — concentric circles, slightly de-centered and phase-
                warped, producing a moiré / interference field.
     · burst  — fine radial spokes from a point, fading outward.
   Pure canvas, no dependencies. Same mount/redraw contract as
   VoltaiWarp so the deck engine can treat both identically.

   Usage:
     <canvas class="lines" data-mode="rings"></canvas>
     VoltaiLines.mount(canvasEl, { mode:'rings', ... })

   Options:
     mode        'rings' | 'burst'                default 'rings'
     count       ring count / spoke count         rings 26 · burst 140
     cx, cy      center, 0..1                      default 0.5,0.5
     line        stroke color                      default themed
     lineWidth   px                                default 0.7
     invert      true → light lines on void        default false
     spread      ring spacing skew / burst length  default 1
     warp        ring eccentricity wobble 0..1     default 0.18
   ============================================================ */
(function (global) {
  function draw(canvas, options) {
    const opts = Object.assign({
      mode: 'rings',
      count: null,
      cx: 0.5,
      cy: 0.5,
      line: null,
      lineWidth: 0.7,
      invert: false,
      spread: 1,
      warp: 0.18,
      seed: 11
    }, options || {});
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const W = Math.max(1, Math.round(rect.width));
    const H = Math.max(1, Math.round(rect.height));
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const css = getComputedStyle(document.documentElement);
    const ink = (css.getPropertyValue('--ink-900') || '#0A0A0A').trim();
    const onVoid = (css.getPropertyValue('--void-line') || '#2E2E2B').trim();
    const accent = (css.getPropertyValue('--accent-green') || '#00B894').trim();
    const lineColor = opts.line || (opts.invert ? (css.getPropertyValue('--paper-100') || '#F4F4F2').trim() : ink);
    const cx = opts.cx * W,
      cy = opts.cy * H;
    ctx.lineWidth = opts.lineWidth;
    ctx.strokeStyle = lineColor;
    let s = opts.seed;
    const rnd = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
    if (opts.mode === 'burst') {
      const count = opts.count || 140;
      const maxR = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy)) * opts.spread;
      const inner = Math.min(W, H) * 0.02;
      for (let i = 0; i < count; i++) {
        const a = i / count * Math.PI * 2;
        const jitter = 0.85 + rnd() * 0.3;
        const r = maxR * jitter;
        ctx.globalAlpha = opts.invert ? 0.55 : 0.5;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
        ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.fillStyle = accent;
      ctx.arc(cx, cy, 3.2, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    // rings (default) — concentric, phase-warped circles → moiré field
    const count = opts.count || 26;
    const baseR = Math.min(W, H) * 0.06;
    const step = Math.min(W, H) * 0.46 / count * opts.spread;
    const seg = 180;
    const accentRing = Math.floor(count * 0.62);
    for (let k = 1; k <= count; k++) {
      const rr = baseR + k * step;
      const phase = rnd() * Math.PI * 2;
      const ecc = 1 + Math.sin(k * 0.7) * opts.warp * 0.5;
      ctx.globalAlpha = opts.invert ? 0.28 + 0.5 * (k / count) : 0.3 + 0.45 * (k / count);
      ctx.strokeStyle = k === accentRing ? accent : lineColor;
      ctx.beginPath();
      for (let i = 0; i <= seg; i++) {
        const a = i / seg * Math.PI * 2;
        const wob = 1 + Math.sin(a * 3 + phase) * opts.warp * 0.12;
        const x = cx + Math.cos(a) * rr * wob;
        const y = cy + Math.sin(a) * rr * ecc * wob;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  const VoltaiLines = {
    draw,
    mount(canvas, options) {
      if (!canvas) return;
      const render = () => draw(canvas, options);
      render();
      let raf;
      const ro = new ResizeObserver(() => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(render);
      });
      ro.observe(canvas);
      return {
        redraw: render,
        destroy: () => ro.disconnect()
      };
    }
  };
  global.VoltaiLines = VoltaiLines;
})(window);
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/line-field.js", error: String((e && e.message) || e) }); }

// assets/sand-grain.js
try { (() => {
/* ============================================================
   VOLTAI — SAND GRAIN  (grayscale, smooth)
   A soft, monochrome fog field used to dissolve one surface into
   another. Strictly black & white: a smooth vertical alpha gradient
   carries fine film grain plus very low-frequency cloud variation —
   no colour, no hard streaks.

   Usage:
     <canvas data-sand data-edge="bottom"></canvas>   // auto-mounts
     VoltaiSand.mount(canvasEl, { edge, fog, intensity, start, grain })

   Options:
     edge       'bottom' (fog densest at bottom, fades up) |
                'top'    (fog densest at top, fades down)    default 'bottom'
     fog        [g,g,g] neutral smoke value. Default: near-black for
                'bottom' (paper→ink), light gray for 'top' (smoke→void).
     intensity  overall opacity multiplier 0..1             default 1
     start      fraction of band kept fully clear before fog default 0.22
     grain      film-grain luminance amplitude (px value)   default 20
   ============================================================ */
(function (global) {
  function smoothstep(a, b, x) {
    const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  }
  function draw(canvas, options) {
    const opts = Object.assign({
      edge: 'bottom',
      fog: null,
      intensity: 1,
      start: 0.22,
      grain: 20
    }, options || {});
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const W = Math.max(1, Math.round(rect.width));
    const H = Math.max(1, Math.round(rect.height));
    const DW = W * dpr,
      DH = H * dpr;
    canvas.width = DW;
    canvas.height = DH;
    const ctx = canvas.getContext('2d');

    // neutral grayscale smoke
    const fg = opts.fog || (opts.edge === 'top' ? 210 : 16);
    const fog0 = fg,
      fog1 = fg,
      fog2 = fg;

    // low-frequency cloud grid for subtle, smooth organic variation
    const GW = 8,
      GH = 7;
    const grid = new Float32Array((GW + 1) * (GH + 1));
    for (let i = 0; i < grid.length; i++) grid[i] = Math.random();
    const cloud = (u, v) => {
      const gx = u * GW,
        gy = v * GH;
      const x0 = Math.floor(gx),
        y0 = Math.floor(gy);
      const fx = gx - x0,
        fy = gy - y0;
      const i00 = grid[y0 * (GW + 1) + x0];
      const i10 = grid[y0 * (GW + 1) + x0 + 1];
      const i01 = grid[(y0 + 1) * (GW + 1) + x0];
      const i11 = grid[(y0 + 1) * (GW + 1) + x0 + 1];
      const sx = fx * fx * (3 - 2 * fx),
        sy = fy * fy * (3 - 2 * fy);
      return (i00 * (1 - sx) + i10 * sx) * (1 - sy) + (i01 * (1 - sx) + i11 * sx) * sy;
    };
    const img = ctx.createImageData(DW, DH);
    const d = img.data;
    const gAmp = opts.grain;
    for (let y = 0; y < DH; y++) {
      const ty = y / DH;
      const prof = opts.edge === 'top' ? 1 - ty : ty;
      const base = smoothstep(opts.start, 1, prof);
      for (let x = 0; x < DW; x++) {
        const tx = x / DW;
        // smooth gradient, gently modulated by low-freq cloud
        const c = cloud(tx, prof);
        let a = base * (0.86 + 0.14 * c) * opts.intensity;
        // soften the leading edge so there is no hard line
        const grain = Math.random();
        a *= 0.94 + 0.06 * grain;
        if (a > 1) a = 1;
        // grain lives in luminance only → stays perfectly grayscale
        const lj = (grain - 0.5) * gAmp;
        const i = (y * DW + x) * 4;
        d[i] = fog0 + lj;
        d[i + 1] = fog1 + lj;
        d[i + 2] = fog2 + lj;
        d[i + 3] = a * 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }
  const VoltaiSand = {
    draw,
    mount(canvas, options) {
      if (!canvas) return;
      const render = () => draw(canvas, options);
      render();
      let raf;
      const ro = new ResizeObserver(() => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(render);
      });
      ro.observe(canvas);
      return {
        redraw: render,
        destroy: () => ro.disconnect()
      };
    },
    auto() {
      document.querySelectorAll('canvas[data-sand]').forEach(c => {
        const opts = {};
        if (c.dataset.edge) opts.edge = c.dataset.edge;
        if (c.dataset.intensity) opts.intensity = +c.dataset.intensity;
        if (c.dataset.fog) opts.fog = +c.dataset.fog;
        VoltaiSand.mount(c, opts);
      });
    }
  };
  if (document.readyState !== 'loading') VoltaiSand.auto();else document.addEventListener('DOMContentLoaded', VoltaiSand.auto);
  global.VoltaiSand = VoltaiSand;
})(window);
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/sand-grain.js", error: String((e && e.message) || e) }); }

// assets/vortex-grid.js
try { (() => {
/* ============================================================
   VOLTAI — VORTEX GRID
   A polar "wormhole": concentric rings + radial spokes spiralling
   into an off-centre throat, over a fine powder starfield. Pure
   canvas, self-mounting, no dependencies.

   Usage:
     <canvas data-vortex
             data-cx="0.68" data-cy="0.5"
             data-rings="22" data-spokes="28"
             data-swirl="0.55" data-coil="1.6" data-throat="0.018"
             data-line="#4C4C45" data-powder="1"></canvas>

   It auto-mounts every [data-vortex] canvas and keeps watching the
   DOM (slides come and go), so it survives slide changes and resizes.
   ============================================================ */
(function (global) {
  function draw(canvas, opts) {
    opts = opts || {};
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const W = Math.max(1, Math.round(rect.width));
    const H = Math.max(1, Math.round(rect.height));
    if (W < 2 || H < 2) return false;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (opts.background) {
      ctx.fillStyle = opts.background;
      ctx.fillRect(0, 0, W, H);
    }
    const accent = (getComputedStyle(document.documentElement).getPropertyValue('--accent-green') || '#00B894').trim();
    const line = opts.line || '#4C4C45';
    const cx = (opts.cx == null ? 0.68 : opts.cx) * W;
    const cy = (opts.cy == null ? 0.5 : opts.cy) * H;
    const rings = opts.rings || 22;
    const spokes = opts.spokes || 28;
    const swirl = opts.swirl == null ? 0.55 : opts.swirl;
    const coil = opts.coil == null ? 1.6 : opts.coil;
    const throat = opts.throat == null ? 0.018 : opts.throat;
    const squashY = opts.squashY == null ? 0.96 : opts.squashY;
    // reach the farthest corner so the field always fills the frame
    const maxR = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy)) * 1.16;

    // polar lattice: rings bunch toward the throat (coil), inner rings
    // rotate (swirl) to spiral the spokes into the funnel
    const pts = [];
    for (let r = 0; r <= rings; r++) {
      const tr = r / rings;
      const rho = (throat + (1 - throat) * Math.pow(tr, coil)) * maxR;
      const rot = swirl * (1 - tr) * Math.PI;
      const row = [];
      for (let a = 0; a <= spokes; a++) {
        const ang = a / spokes * Math.PI * 2 + rot;
        row.push([cx + Math.cos(ang) * rho, cy + Math.sin(ang) * rho * squashY]);
      }
      pts.push(row);
    }
    ctx.lineJoin = 'round';
    ctx.lineWidth = opts.lineWidth || 0.7;
    ctx.strokeStyle = line;
    ctx.globalAlpha = 0.95;
    // concentric rings
    for (let r = 0; r <= rings; r++) {
      ctx.beginPath();
      for (let a = 0; a <= spokes; a++) {
        const p = pts[r][a];
        a === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1]);
      }
      ctx.stroke();
    }
    // radial spokes
    for (let a = 0; a <= spokes; a++) {
      ctx.beginPath();
      for (let r = 0; r <= rings; r++) {
        const p = pts[r][a];
        r === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1]);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // fine powder starfield — tiny grains, varied luminance
    if (opts.powder !== false) {
      let s = opts.seed || 7;
      const rnd = () => {
        s = (s * 9301 + 49297) % 233280;
        return s / 233280;
      };
      const count = opts.powderCount || Math.round(W * H / 520);
      for (let i = 0; i < count; i++) {
        const x = rnd() * W,
          y = rnd() * H;
        const b = rnd();
        const rad = b < 0.9 ? 0.4 + rnd() * 0.5 : 0.9 + rnd() * 0.7;
        ctx.beginPath();
        ctx.fillStyle = 'rgba(244,244,242,' + (0.16 + b * 0.62).toFixed(3) + ')';
        ctx.arc(x, y, rad, 0, Math.PI * 2);
        ctx.fill();
      }
      // a single faint accent mote near the throat
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(cx + maxR * throat * 3, cy - maxR * throat * 1.5, 1.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    return true;
  }
  function optsFor(c) {
    const d = c.dataset;
    const o = {};
    if (d.cx) o.cx = +d.cx;
    if (d.cy) o.cy = +d.cy;
    if (d.rings) o.rings = +d.rings;
    if (d.spokes) o.spokes = +d.spokes;
    if (d.swirl !== undefined && d.swirl !== '') o.swirl = +d.swirl;
    if (d.coil) o.coil = +d.coil;
    if (d.throat) o.throat = +d.throat;
    if (d.line) o.line = d.line;
    if (d.powder === '0') o.powder = false;
    if (d.powderCount) o.powderCount = +d.powderCount;
    return o;
  }
  function sweep() {
    document.querySelectorAll('canvas[data-vortex]').forEach(c => {
      if (c.__vortexDone) return;
      if (draw(c, optsFor(c))) c.__vortexDone = true;
    });
  }

  // slides are added/removed (sc-if) and the deck scales — keep checking
  setInterval(sweep, 200);
  window.addEventListener('resize', () => {
    document.querySelectorAll('canvas[data-vortex]').forEach(c => {
      c.__vortexDone = false;
    });
  });
  if (document.readyState !== 'loading') sweep();else document.addEventListener('DOMContentLoaded', sweep);
  global.VoltaiVortex = {
    draw,
    sweep
  };
})(window);
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/vortex-grid.js", error: String((e && e.message) || e) }); }

// assets/warp-grid.js
try { (() => {
/* ============================================================
   VOLTAI — WARP GRID
   The signature generative motif: a fine line lattice that
   pinches toward attractor points, producing a vortex-like
   gravitational warp. Pure canvas, no dependencies.

   Usage:
     <canvas data-warp></canvas>
     VoltaiWarp.mount(canvasEl, { ... })   // or auto-mounts [data-warp]

   Options:
     cells      grid resolution (lines per axis)        default 46
     attractors array of {x,y,pull,radius} in 0..1      default 2 auto
     line       stroke color           default ink
     lineWidth  px                      default 0.6
     nodes      draw filled dot markers at some points  default true
     background fill color or null                      default null
     invert     true → light lines on void              default false
   ============================================================ */
(function (global) {
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function computeField(opts, W, H) {
    const cells = opts.cells;
    const cols = cells,
      rows = Math.round(cells * (H / W));
    const pts = [];
    const atts = opts.attractors.map(a => ({
      x: a.x * W,
      y: a.y * H,
      pull: a.pull == null ? 0.55 : a.pull,
      radius: (a.radius == null ? 0.32 : a.radius) * Math.min(W, H)
    }));
    for (let r = 0; r <= rows; r++) {
      const row = [];
      for (let c = 0; c <= cols; c++) {
        let x = c / cols * W;
        let y = r / rows * H;
        for (const a of atts) {
          const dx = a.x - x,
            dy = a.y - y;
          const dist = Math.hypot(dx, dy) || 0.0001;
          // gaussian falloff → strong pinch near the attractor
          const f = Math.exp(-(dist * dist) / (2 * a.radius * a.radius));
          const move = a.pull * f;
          x = lerp(x, a.x, move);
          y = lerp(y, a.y, move);
        }
        row.push([x, y]);
      }
      pts.push(row);
    }
    return {
      pts,
      cols,
      rows,
      atts
    };
  }
  function draw(canvas, options) {
    const opts = Object.assign({
      cells: 46,
      attractors: null,
      line: null,
      lineWidth: 0.6,
      nodes: true,
      nodeColor: null,
      background: null,
      invert: false,
      seed: 7
    }, options || {});

    // Let the canvas element declare vortex mode + params directly, so it
    // renders correctly no matter how it was mounted (mount layer may not
    // forward these through options).
    const ds = canvas.dataset || {};
    if (!opts.mode && ds.mode) opts.mode = ds.mode;
    if (opts.mode === 'vortex') {
      if (opts.cx == null && ds.cx) opts.cx = +ds.cx;
      if (opts.cy == null && ds.cy) opts.cy = +ds.cy;
      if (opts.rings == null && ds.rings) opts.rings = +ds.rings;
      if (opts.spokes == null && ds.spokes) opts.spokes = +ds.spokes;
      if (opts.swirl == null && ds.swirl !== undefined && ds.swirl !== '') opts.swirl = +ds.swirl;
      if (opts.coil == null && ds.coil) opts.coil = +ds.coil;
      if (opts.throat == null && ds.throat) opts.throat = +ds.throat;
      if (!opts.line && ds.line) opts.line = ds.line;
      if (ds.powder === '0') opts.powder = false;
      return drawVortex(canvas, opts);
    }
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const W = Math.max(1, Math.round(rect.width));
    const H = Math.max(1, Math.round(rect.height));
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const css = getComputedStyle(document.documentElement);
    const ink = (css.getPropertyValue('--ink-900') || '#0A0A0A').trim();
    const onVoid = (css.getPropertyValue('--void-line') || '#2E2E2B').trim();
    const accent = (css.getPropertyValue('--accent-green') || '#00B894').trim();
    const lineColor = opts.line || (opts.invert ? onVoid : ink);
    if (opts.background) {
      ctx.fillStyle = opts.background;
      ctx.fillRect(0, 0, W, H);
    }
    if (!opts.attractors) {
      opts.attractors = [{
        x: 0.62,
        y: 0.52,
        pull: 0.62,
        radius: 0.30
      }, {
        x: 0.30,
        y: 0.40,
        pull: 0.30,
        radius: 0.22
      }];
    }
    const field = computeField(opts, W, H);
    const {
      pts,
      cols,
      rows
    } = field;
    ctx.lineWidth = opts.lineWidth;
    ctx.strokeStyle = lineColor;
    ctx.globalAlpha = opts.invert ? 0.9 : 0.82;

    // horizontal lines
    for (let r = 0; r <= rows; r++) {
      ctx.beginPath();
      for (let c = 0; c <= cols; c++) {
        const [x, y] = pts[r][c];
        c === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    // vertical lines
    for (let c = 0; c <= cols; c++) {
      ctx.beginPath();
      for (let r = 0; r <= rows; r++) {
        const [x, y] = pts[r][c];
        r === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // node markers — sparse, deterministic dots, one accent
    if (opts.nodes) {
      let s = opts.seed;
      const rnd = () => {
        s = (s * 9301 + 49297) % 233280;
        return s / 233280;
      };
      const fillDot = opts.nodeColor || (opts.invert ? '#F4F4F2' : ink);
      const total = Math.round(cols * rows / 160);
      let accentDrawn = false;
      for (let i = 0; i < total; i++) {
        const r = 1 + Math.floor(rnd() * (rows - 1));
        const c = 1 + Math.floor(rnd() * (cols - 1));
        const [x, y] = pts[r][c];
        const useAccent = !accentDrawn && i === Math.floor(total * 0.5);
        ctx.beginPath();
        ctx.fillStyle = useAccent ? accent : fillDot;
        ctx.arc(x, y, useAccent ? 4 : 3, 0, Math.PI * 2);
        ctx.fill();
        if (useAccent) accentDrawn = true;
      }
    }
  }

  /* ----------------------------------------------------------
     VORTEX MODE — a polar wormhole: concentric rings + radial
     spokes spiralling into an off-centre throat, over a fine
     powder starfield. Pure canvas.
     ---------------------------------------------------------- */
  function drawVortex(canvas, opts) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const W = Math.max(1, Math.round(rect.width));
    const H = Math.max(1, Math.round(rect.height));
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (opts.background) {
      ctx.fillStyle = opts.background;
      ctx.fillRect(0, 0, W, H);
    }
    const css = getComputedStyle(document.documentElement);
    const onVoid = (css.getPropertyValue('--void-line') || '#2E2E2B').trim();
    const accent = (css.getPropertyValue('--accent-green') || '#00B894').trim();
    const line = opts.line || onVoid;
    const cx = (opts.cx == null ? 0.72 : opts.cx) * W;
    const cy = (opts.cy == null ? 0.5 : opts.cy) * H;
    const rings = opts.rings || 18;
    const spokes = opts.spokes || 38;
    const swirl = opts.swirl == null ? 0.6 : opts.swirl;
    const throat = opts.throat == null ? 0.03 : opts.throat;
    const coil = opts.coil == null ? 1.25 : opts.coil;
    const squashY = opts.squashY == null ? 0.95 : opts.squashY;
    // reach the farthest corner so the field always fills the frame
    const maxR = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy)) * 1.14;

    // build a polar lattice, bunching rings gently toward the throat and
    // swirling the inner rings to form the funnel
    const pts = [];
    for (let r = 0; r <= rings; r++) {
      const tr = r / rings;
      const rho = (throat + (1 - throat) * Math.pow(tr, coil)) * maxR;
      const rot = swirl * (1 - tr) * Math.PI;
      const row = [];
      for (let a = 0; a <= spokes; a++) {
        const ang = a / spokes * Math.PI * 2 + rot;
        row.push([cx + Math.cos(ang) * rho, cy + Math.sin(ang) * rho * squashY]);
      }
      pts.push(row);
    }
    ctx.lineJoin = 'round';
    ctx.lineWidth = opts.lineWidth || 0.7;
    ctx.strokeStyle = line;
    ctx.globalAlpha = 0.92;
    // rings
    for (let r = 0; r <= rings; r++) {
      ctx.beginPath();
      for (let a = 0; a <= spokes; a++) {
        const [x, y] = pts[r][a];
        a === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    // spokes
    for (let a = 0; a <= spokes; a++) {
      ctx.beginPath();
      for (let r = 0; r <= rings; r++) {
        const [x, y] = pts[r][a];
        r === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // fine powder starfield — tiny grains, varied luminance, one faint accent mote
    if (opts.powder !== false) {
      let s = opts.seed || 7;
      const rnd = () => {
        s = (s * 9301 + 49297) % 233280;
        return s / 233280;
      };
      const count = opts.powderCount || Math.round(W * H / 850);
      for (let i = 0; i < count; i++) {
        const x = rnd() * W,
          y = rnd() * H;
        const b = rnd();
        const rad = b < 0.86 ? 0.45 + rnd() * 0.55 : 0.95 + rnd() * 0.6;
        ctx.beginPath();
        ctx.fillStyle = 'rgba(244,244,242,' + (0.14 + b * 0.6).toFixed(3) + ')';
        ctx.arc(x, y, rad, 0, Math.PI * 2);
        ctx.fill();
      }
      // a single, barely-there accent grain near the throat
      ctx.beginPath();
      ctx.fillStyle = accent;
      ctx.globalAlpha = 0.7;
      ctx.arc(cx + maxR * throat * 2, cy - maxR * throat, 1.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
  const VoltaiWarp = {
    draw,
    mount(canvas, options) {
      if (!canvas) return;
      const render = () => draw(canvas, options);
      render();
      let raf;
      const ro = new ResizeObserver(() => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(render);
      });
      ro.observe(canvas);
      return {
        redraw: render,
        destroy: () => ro.disconnect()
      };
    },
    auto() {
      document.querySelectorAll('canvas[data-warp]').forEach(c => {
        const opts = {};
        if (c.dataset.cells) opts.cells = +c.dataset.cells;
        if (c.dataset.invert != null) opts.invert = true;
        if (c.dataset.nodes === 'false') opts.nodes = false;
        if (c.dataset.attractors) {
          try {
            opts.attractors = JSON.parse(c.dataset.attractors);
          } catch (e) {}
        }
        VoltaiWarp.mount(c, opts);
      });
    }
  };
  if (document.readyState !== 'loading') VoltaiWarp.auto();else document.addEventListener('DOMContentLoaded', VoltaiWarp.auto);
  global.VoltaiWarp = VoltaiWarp;

  /* Self-heal: guarantee every vortex canvas is painted with THIS build,
     even if an older cached build mounted it first and left a stale draw.
     Stamped so each canvas is only (re)drawn once per build. */
  const BUILD = 5;
  function healVortex() {
    document.querySelectorAll('canvas[data-mode="vortex"]').forEach(c => {
      if (c.__warpBuild === BUILD) return;
      const r = c.getBoundingClientRect();
      if (r.width < 2) return;
      draw(c, {
        line: c.dataset.line
      });
      c.__warpBuild = BUILD;
    });
  }
  setInterval(healVortex, 250);
  window.addEventListener('resize', () => {
    document.querySelectorAll('canvas[data-mode="vortex"]').forEach(c => {
      c.__warpBuild = 0;
    });
  });
  if (document.readyState !== 'loading') healVortex();else document.addEventListener('DOMContentLoaded', healVortex);
})(window);
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/warp-grid.js", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Voltai Button — mono, uppercase, wide-tracked, hard corners.
 * The bordered "secondary" is the signature CTA (cf. REQUEST DEMO).
 */
function Button({
  children,
  variant = 'primary',
  size = 'md',
  accent = false,
  full = false,
  disabled = false,
  as = 'button',
  ...rest
}) {
  const pad = {
    sm: '8px 14px',
    md: '12px 20px',
    lg: '16px 28px'
  }[size] || '12px 20px';
  const fontSize = {
    sm: 10.5,
    md: 12,
    lg: 13
  }[size] || 12;
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: full ? '100%' : 'auto',
    padding: pad,
    border: '1px solid var(--ink-900)',
    borderRadius: 0,
    background: 'var(--ink-900)',
    color: 'var(--paper-0)',
    font: `500 ${fontSize}px var(--font-mono)`,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    transition: 'background var(--dur-base) var(--ease-mech), color var(--dur-base) var(--ease-mech)',
    WebkitFontSmoothing: 'antialiased'
  };
  const variants = {
    primary: {},
    secondary: {
      background: 'transparent',
      color: 'var(--ink-900)'
    },
    ghost: {
      background: 'transparent',
      color: 'var(--ink-900)',
      border: '1px solid transparent',
      paddingLeft: 0,
      paddingRight: 0
    },
    inverse: {
      background: 'var(--paper-0)',
      color: 'var(--ink-900)',
      border: '1px solid var(--paper-0)'
    }
  };
  const style = {
    ...base,
    ...(variants[variant] || {})
  };
  const Tag = as;
  const dot = accent ? /*#__PURE__*/React.createElement("span", {
    style: {
      width: 7,
      height: 7,
      background: 'var(--accent-green)',
      display: 'inline-block',
      flexShrink: 0
    }
  }) : null;
  return /*#__PURE__*/React.createElement(Tag, _extends({
    style: style,
    disabled: as === 'button' ? disabled : undefined,
    onMouseEnter: e => {
      if (disabled) return;
      if (variant === 'secondary') {
        e.currentTarget.style.background = 'var(--ink-900)';
        e.currentTarget.style.color = 'var(--paper-0)';
      } else if (variant === 'primary') {
        e.currentTarget.style.background = 'var(--ink-700)';
      } else if (variant === 'ghost') {
        e.currentTarget.style.color = 'var(--accent-green-ink)';
      } else if (variant === 'inverse') {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = 'var(--paper-0)';
      }
    },
    onMouseLeave: e => {
      if (disabled) return;
      Object.assign(e.currentTarget.style, {
        background: style.background,
        color: style.color
      });
    }
  }, rest), dot, children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Callout.jsx
try { (() => {
/**
 * Voltai Callout — an engineering annotation: a FIG/ID code, an optional
 * tick rule, and a label. Reads like a schematic note, not decoration.
 */
function Callout({
  code,
  children,
  align = 'left',
  onVoid = false,
  rule = true
}) {
  const muted = onVoid ? 'var(--on-void-muted)' : 'var(--ink-500)';
  const strong = onVoid ? 'var(--on-void)' : 'var(--ink-900)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: align === 'right' ? 'flex-end' : 'flex-start',
      gap: 8,
      textAlign: align
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 9.5px var(--font-mono)',
      letterSpacing: '0.16em',
      textTransform: 'uppercase',
      color: 'var(--accent-green' + (onVoid ? '' : '-ink') + ')'
    }
  }, code), rule && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 28,
      height: 1,
      background: onVoid ? 'var(--void-line)' : 'var(--ink-200)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 11px var(--font-mono)',
      letterSpacing: '0.12em',
      lineHeight: 1.6,
      textTransform: 'uppercase',
      color: typeof children === 'string' ? muted : strong
    }
  }, children));
}
Object.assign(__ds_scope, { Callout });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Callout.jsx", error: String((e && e.message) || e) }); }

// components/core/Tag.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Voltai Tag — a mono, uppercase, wide-tracked chip for system labels,
 * IDs, statuses. Hard corners. Optional single accent state.
 */
function Tag({
  children,
  variant = 'outline',
  accent = false,
  onVoid = false,
  ...rest
}) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    padding: '5px 9px',
    border: '1px solid',
    borderRadius: 0,
    font: '500 10.5px var(--font-mono)',
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
    lineHeight: 1
  };
  const palettes = {
    outline: onVoid ? {
      borderColor: 'var(--void-line)',
      color: 'var(--on-void-muted)',
      background: 'transparent'
    } : {
      borderColor: 'var(--ink-200)',
      color: 'var(--ink-500)',
      background: 'transparent'
    },
    solid: onVoid ? {
      borderColor: 'var(--paper-0)',
      color: 'var(--void-900)',
      background: 'var(--paper-0)'
    } : {
      borderColor: 'var(--ink-900)',
      color: 'var(--paper-0)',
      background: 'var(--ink-900)'
    },
    signal: onVoid ? {
      borderColor: 'var(--accent-green)',
      color: 'var(--accent-green)',
      background: 'transparent'
    } : {
      borderColor: 'var(--accent-green-ink)',
      color: 'var(--accent-green-ink)',
      background: 'transparent'
    }
  };
  const style = {
    ...base,
    ...(palettes[variant] || palettes.outline)
  };
  const dot = accent ? /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      flexShrink: 0,
      background: onVoid ? 'var(--accent-green)' : 'var(--accent-green-ink)'
    }
  }) : null;
  return /*#__PURE__*/React.createElement("span", _extends({
    style: style
  }, rest), dot, children);
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Tag.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Callout = __ds_scope.Callout;

__ds_ns.Tag = __ds_scope.Tag;

})();
