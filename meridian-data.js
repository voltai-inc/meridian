/* ============================================================================
   Voltai Meridian — shared data layer for the AI Factory Site Intelligence app.
   DOM-free so it can be unit-tested under node and reused across pages.

   This module is the single source of truth for:
     · CHIPS   — GPU platform catalog (mirrors site-intelligence.html)
     · SITES   — candidate site pipeline (mirrors site-selection.html)
     · CLI     — climate archetype model
     · getPUE  — climate → modeled PUE (mirrors site-intelligence.html)
     · REGION_POWER — regional industrial electricity price + grid facts
   All figures are MODELED estimates for planning, not measured commitments.
   ============================================================================ */
"use strict";

// ─── GPU PLATFORMS ──────────────────────────────────────────────────────────
// g = GPUs per rack · kw/kw_max = rack power · rate = assumed rental $/GPU-hr
// cap = all-in capex $/GPU (server + fabric share) · smooth = on-board power
// smoothing frac · mt/mi = MFU train/infer · tf = TFLOPS BF16/GPU · hbm = TB/s
// leadHi = worst-case lead months · volt = electrical arch compatibility.
const CHIPS = {
  GB300:  {n:'NVIDIA GB300 NVL72',  g:72, kw:130, kw_max:142, cool:'CDU', rate:5.00, cap:70000, smooth:0.50, mt:.58, mi:.72, tf:1400, hbm:8.0,  ver:true,  st:'ship', lead:'12–14 mo', leadHi:14, volt:'both'},
  GB200:  {n:'NVIDIA GB200 NVL36',  g:36, kw:65,  kw_max:72,  cool:'CDU', rate:4.00, cap:58000, smooth:0.35, mt:.57, mi:.71, tf:1400, hbm:8.0,  ver:true,  st:'ship', lead:'12–14 mo', leadHi:14, volt:'both'},
  B200:   {n:'NVIDIA B200 SXM',     g:48, kw:90,  kw_max:100, cool:'CDU', rate:3.25, cap:50000, smooth:0.10, mt:.62, mi:.76, tf:900,  hbm:8.0,  ver:true,  st:'ship', lead:'12–14 mo', leadHi:14, volt:'ac480'},
  H200:   {n:'NVIDIA H200 SXM',     g:48, kw:70,  kw_max:80,  cool:'CDU', rate:2.50, cap:38000, smooth:0.00, mt:.55, mi:.68, tf:990,  hbm:4.8,  ver:true,  st:'ship', lead:'8–10 mo',  leadHi:10, volt:'ac480'},
  H100:   {n:'NVIDIA H100 SXM5',    g:48, kw:70,  kw_max:80,  cool:'CDU', rate:2.00, cap:28000, smooth:0.00, mt:.50, mi:.65, tf:990,  hbm:3.35, ver:true,  st:'ship', lead:'6–8 mo',   leadHi:8,  volt:'ac480'},
  VERA:   {n:'Vera Rubin NVL72',    g:72, kw:210, kw_max:227, cool:'CDU', rate:7.00, cap:90000, smooth:0.60, mt:.60, mi:.74, tf:1800, hbm:10.0, ver:false, st:'road', lead:'2026→',    leadHi:18, volt:'dc800'},
  MI355X: {n:'AMD MI355X DLC',      g:96, kw:220, kw_max:250, cool:'DLC', rate:3.00, cap:42000, smooth:0.15, mt:.45, mi:.62, tf:1300, hbm:5.3,  ver:false, st:'ship', lead:'14–16 mo', leadHi:16, volt:'dc800'},
  MI300X: {n:'AMD MI300X OAM',      g:64, kw:110, kw_max:125, cool:'CDU', rate:1.75, cap:22000, smooth:0.00, mt:.38, mi:.55, tf:1307, hbm:7.68, ver:false, st:'ship', lead:'10–12 mo', leadHi:12, volt:'ac480'},
  GAUDI3: {n:'Intel Gaudi 3',       g:64, kw:90,  kw_max:110, cool:'CDU', rate:1.00, cap:18000, smooth:0.00, mt:.42, mi:.60, tf:800,  hbm:3.7,  ver:false, st:'ship', lead:'12–14 mo', leadHi:14, volt:'ac480'},
};

// Climate archetype: [design dry-bulb °C, mean °C, wet-bulb °C, free-cooling favorability 0-1]
const CLI = {cold_dry:[28,15,10,.88], temperate:[34,22,18,.62], hot_dry:[42,24,22,.42], hot_humid:[36,29,27,.18]};
const CLIMATE_LABEL = {cold_dry:'Cold / dry', temperate:'Temperate', hot_dry:'Hot / dry', hot_humid:'Hot / humid'};

// Climate → modeled annualized PUE (mirrors site-intelligence.html getPUE).
function getPUE(clim){ return {cold_dry:1.09, temperate:1.14, hot_dry:1.19, hot_humid:1.24}[clim] || 1.18; }

// ─── REGIONAL POWER / GRID FACTS ────────────────────────────────────────────
// Industrial electricity price ($/kWh, modeled 2026 estimate), grid operator,
// grid reliability index (0-1), renewable share of generation (0-1), and a
// 2026→ price CAGR used by the forecast model. Estimates for planning only.
const REGION_POWER = {
  'Louisiana':        {price:0.055, grid:'MISO / Entergy',  reliability:0.82, renewable:0.06, cagr:0.045, water:0.85, supply:0.70},
  'Kentucky':         {price:0.058, grid:'MISO / LG&E',     reliability:0.80, renewable:0.09, cagr:0.040, water:0.78, supply:0.66},
  'Ohio':             {price:0.076, grid:'PJM / AEP',       reliability:0.88, renewable:0.14, cagr:0.038, water:0.80, supply:0.78},
  'Mississippi':      {price:0.060, grid:'MISO / Entergy',  reliability:0.81, renewable:0.05, cagr:0.044, water:0.82, supply:0.62},
  'Alberta, Canada':  {price:0.052, grid:'AESO',            reliability:0.85, renewable:0.24, cagr:0.030, water:0.72, supply:0.60},
};
const REGION_DEFAULT = {price:0.065, grid:'Regional utility', reliability:0.78, renewable:0.12, cagr:0.040, water:0.70, supply:0.62};
function regionPower(state){ return REGION_POWER[state] || REGION_DEFAULT; }

// ─── CANDIDATE SITES ────────────────────────────────────────────────────────
// Synced from the site tracker sheet (gid 1481162912), July 9 2026.
// mwNum = conservative lower bound; null = unknown. approx = town-level pin.
const SITES = [
 {id:'vidalia', name:'Vidalia Mills', addr:'1 King Timahoe Dr, Vidalia LA 71373', stage:'Pipeline', state:'Louisiana',
  mw:'50–70 MW', mwNum:50, size:'870K sqft · 68.5 ac', acres:68.5, type:'Auction (former factory)', price:'Beat $30M', priceNum:30e6,
  contact:'Bonnette Auctions', utility:'', climate:'hot_humid', lat:31.5654, lng:-91.4429, approx:true,
  notes:'Competing offer $30M; $1M upfront paid. Auction 9/10 — pre-auction offer possible. By-right zoning likely. Fiber TBD. Flood risk to assess.'},
 {id:'calvert', name:'Calvert City', addr:'Calvert City KY (off-market)', stage:'Pipeline', state:'Kentucky',
  mw:'15 MW now → 50+ MW', mwNum:15, mwCeil:50, size:'200 ac (50 buildable)', acres:200, type:'Powered land', price:'TBD', priceNum:null,
  contact:'Cushman & Wakefield', utility:'', climate:'temperate', lat:37.0334, lng:-88.35, approx:true,
  notes:'15 MW now; 50+ MW in 36 mo. By-right DC zoning. NDA signed — data room forthcoming.'},
 {id:'olds', name:'Canada Olds', addr:'6102/6402 48 Avenue, Olds AB', stage:'Pipeline', state:'Alberta, Canada',
  mw:'20 MW', mwNum:20, size:'448K sqft · 40.3 ac', acres:40.3, type:'Special manufacturing / retrofit', price:'~$30M', priceNum:30e6,
  contact:'JLL (Casey Stuart)', utility:'', climate:'cold_dry', lat:51.7869, lng:-114.1028, approx:false,
  notes:'Rezoning done; power contracts discharged — renegotiation needed. Zayo fiber on-site. Bid deadline July 13. Built 2017–2020.'},
 {id:'sawmill', name:'Sawmill Parkway', addr:'Dublin/Powell area — Columbus OH', stage:'Pipeline', state:'Ohio',
  mw:'~24 MW', mwNum:24, size:'105K sqft · 27.5 ac', acres:27.5, type:'Spec build', price:'TBD (construction cost)', priceNum:null,
  contact:'KBC Advisors', utility:'AEP', climate:'temperate', lat:40.1598, lng:-83.0913, approx:true,
  notes:'AEP delivery 24–36 months — biggest open item; AEP validation pending. Zoning resolved via approved master plan. Developer delivers site with power.'},
 {id:'encova', name:'Encova / New Albany', addr:'6650 New Albany Rd E, New Albany OH', stage:'Pipeline', state:'Ohio',
  mw:'TBD', mwNum:null, size:'Existing DC + expansion land', acres:null, type:'Existing data center', price:'>$15M', priceNum:15e6,
  contact:'KBC Advisors', utility:'AEP', climate:'temperate', lat:40.1034, lng:-82.8042, approx:false,
  notes:'Tenant exiting early 2027 (cloud migration); existing utility relationship; power specs pending.'},
 {id:'southgate', name:'Southgate Spec Build', addr:'Heath OH', stage:'Pipeline', state:'Ohio',
  mw:'20+ MW', mwNum:20, size:'110–152K sqft', acres:null, type:'New spec build', price:'TBD', priceNum:null,
  contact:"Southgate Corp / Atria (Robert O'Neill)", utility:'AEP', climate:'temperate', lat:40.0228, lng:-82.4446, approx:true,
  notes:'Oct 2026 occupancy; 20 MW+ confirmed; exact usable MW and economics need validation. AEP meeting being set.'},
 {id:'sub139', name:'13.9-Acre Substation Site', addr:'Louisiana (exact location TBD)', stage:'Pipeline', state:'Louisiana',
  mw:'10–20 MW', mwNum:10, size:'13.9 ac', acres:13.9, type:'Land (greenfield)', price:'$2.7M', priceNum:2.7e6,
  contact:'LED pipeline', utility:'Entergy', climate:'hot_humid', lat:30.65, lng:-91.7, approx:true,
  notes:'Adjacent to substation; lowest-cost entry. Ground-up — no existing structures. Entergy TBD.'},
 {id:'denim', name:'501 Denim Way', addr:'501 Denim Way, Madison County MS', stage:'Prospecting', state:'Mississippi',
  mw:'10–50 MW+', mwNum:10, mwCeil:50, size:'TBD', acres:null, type:'TBD', price:'TBD', priceNum:null,
  contact:'Madison County EDA (Emily Harrison)', utility:'Entergy', climate:'hot_humid', lat:32.5151, lng:-90.0979, approx:false,
  notes:'Entergy capacity study starting. Needs dedicated substation at this scale.'},
 {id:'foti', name:'Foti Highway 18', addr:'Highway 18 — Louisiana', stage:'Prospecting', state:'Louisiana',
  mw:'TBD', mwNum:null, size:'TBD', acres:null, type:'TBD', price:'TBD', priceNum:null,
  contact:'LED / MMCRE (Ransom Pipes)', utility:'Entergy', climate:'hot_humid', lat:30.03, lng:-90.82, approx:true,
  notes:'Entergy contact pending. Via Louisiana LED (Daniel Michel).'},
 {id:'ronaldson', name:'12555 Ronaldson Rd', addr:'12555 Ronaldson Rd, Baton Rouge LA', stage:'Prospecting', state:'Louisiana',
  mw:'8–10 MW+', mwNum:8, size:'TBD', acres:null, type:'Acquisition', price:'TBD', priceNum:null,
  contact:'Greater Baton Rouge EDA (Jayson Newell)', utility:'Entergy', climate:'hot_humid', lat:30.5605, lng:-91.1764, approx:false,
  notes:'Former Stupp steel operation. Entergy intro pending via Greater BR EDA.'},
 {id:'pepsi', name:'Former Pepsi Plant', addr:'383 West 10th St, Reserve LA', stage:'Prospecting', state:'Louisiana',
  mw:'TBD', mwNum:null, size:'TBD', acres:null, type:'Acquisition', price:'TBD', priceNum:null,
  contact:'portSL (Micah Cormier)', utility:'Entergy', climate:'hot_humid', lat:30.0688, lng:-90.556, approx:true,
  notes:'Reserve site confirmed (not Baton Rouge). Open to other portSL portfolio sites too.'},
 {id:'britco', name:'Britco + Ascension Parish', addr:'Ascension Parish LA', stage:'Prospecting', state:'Louisiana',
  mw:'TBD', mwNum:null, size:'TBD', acres:null, type:'TBD', price:'TBD', priceNum:null,
  contact:'Ascension EDC (Kate MacArthur)', utility:'Entergy', climate:'hot_humid', lat:30.2385, lng:-90.9201, approx:true,
  notes:'Power capacity check pending. Follow-up sent.'},
 {id:'ampacet', name:'Ampacet Warehouse', addr:'DeRidder LA', stage:'Prospecting', state:'Louisiana',
  mw:'TBD', mwNum:null, size:'TBD', acres:null, type:'Acquisition', price:'TBD', priceNum:null,
  contact:'Alliance SWLA (Gus Fontenot) → Greater Beauregard (Lisa Adams)', utility:'', climate:'hot_humid', lat:30.8723, lng:-93.2817, approx:false,
  notes:'Referred to Lisa Adams. No response yet.'},
 {id:'hwy51', name:'19120 Hwy 51', addr:'19120 Hwy 51 — Louisiana', stage:'Prospecting', state:'Louisiana',
  mw:'TBD', mwNum:null, size:'TBD', acres:null, type:'TBD', price:'TBD', priceNum:null,
  contact:'Carpenter Properties (Rob Carpenter)', utility:'Entergy', climate:'hot_humid', lat:30.32, lng:-90.44, approx:true,
  notes:'Called today. Awaiting power details from Rob.'},
 {id:'martco', name:'Martco Mill', addr:'Louisiana', stage:'Prospecting', state:'Louisiana',
  mw:'TBD', mwNum:null, size:'TBD', acres:null, type:'TBD', price:'TBD', priceNum:null,
  contact:'OneAcadiana (Megan)', utility:'', climate:'hot_humid', lat:31.42, lng:-92.79, approx:true,
  notes:'Outreach started. No response yet.'},
 {id:'nwpid', name:'NWPID Site', addr:'US 371 & Henerietta Cullen, LA 71021', stage:'Prospecting', state:'Louisiana',
  mw:'12.7 MW', mwNum:12.7, size:'39 ac', acres:39, type:'Land (greenfield)', price:'TBD', priceNum:null,
  contact:'Webster Parish LED', utility:'', climate:'hot_humid', lat:32.969, lng:-93.4507, approx:false,
  notes:'In discussions with Lisa; initial power study provided (confirm currency) and price pending.'},
 {id:'evangeline', name:'1016 SW Evangeline', addr:'Lafayette LA', stage:'Prospecting', state:'Louisiana',
  mw:'1 MW (raise w/ Entergy)', mwNum:1, size:'12 ac', acres:12, type:'Light manufacturing', price:'$70K/mo', priceNum:null,
  contact:'—', utility:'Entergy', climate:'hot_humid', lat:30.2215, lng:-92.0088, approx:false,
  notes:'Call or email Entergy.'},
];

// ─── EXPORT (node + browser globals) ─────────────────────────────────────────
const MERIDIAN_DATA = { CHIPS, CLI, CLIMATE_LABEL, getPUE, REGION_POWER, REGION_DEFAULT, regionPower, SITES };
if (typeof module !== "undefined" && module.exports) module.exports = MERIDIAN_DATA;
if (typeof window !== "undefined") Object.assign(window, MERIDIAN_DATA, { MERIDIAN_DATA });
