const E = require('/Users/worktrial/VoltAI/meridian-web/power-validation.js');
const IT = 168.1, CONTRACT = 200;

function design(m={}) {
  const r = x => +(IT*(m.it??1)*x).toFixed(1);
  const it = +(IT*(m.it??1)).toFixed(1);
  return {
    name:'t', revision:'t', critical_it_mw:it, redundancy:'2N',
    genset_firm_mw:r(1.25)*(m.gen??1), genset_step_frac:0.40,
    bess_power_mw:r(0.417)*(m.bess??1), bess_energy_mwh:r(0.208)*(m.bess??1),
    mech_base_mw:r(0.05), mech_cooling_ratio:(m.cool??0.20), mech_lag_s:180,
    path_components:[
      {id:'feed',name:'f',kind:'utility_feed',rating_mw:r(1.425)*(m.path??1),short_time_factor:1.05,efficiency:1.0,warn_loading:0.8},
      {id:'mv_swgr',name:'m',kind:'mv_switchgear',rating_mw:r(1.425)*(m.path??1),short_time_factor:1.10,efficiency:1.0,warn_loading:0.8},
      {id:'tx',name:'t',kind:'transformer',rating_mw:r(1.425)*(m.path??1),short_time_factor:1.10,efficiency:0.99,warn_loading:0.8},
      {id:'lv_swgr',name:'l',kind:'lv_switchgear',rating_mw:r(1.425)*(m.path??1),short_time_factor:1.10,efficiency:1.0,warn_loading:0.8},
      {id:'ups',name:'u',kind:'ups',rating_mw:r(1.0)*(m.ups??1),short_time_factor:1.25,efficiency:0.96,warn_loading:0.85},
      {id:'pdu',name:'p',kind:'pdu',rating_mw:r(1.0)*(m.pdu??1),short_time_factor:1.10,efficiency:0.995,warn_loading:0.8},
    ],
  };
}
function trace(m={}) {
  const s = m.smooth??0, mid=0.725, hs=0.275*(1-s)*(m.swing??1);
  return E.trainingTrace(+(IT*(m.it??1)).toFixed(1), {duration_s:1800, job_end_at_s:1530,
    high_frac:+(mid+hs).toFixed(3), low_frac:+(mid-hs).toFixed(3),
    checkpoint_frac:+(0.15+(mid-0.15)*s*0.5).toFixed(3), noise_frac:+(0.02*(1-s)).toFixed(3),
    iteration_period_s:m.iter??3, checkpoint_every_s:m.ckptE??1200, checkpoint_dur_s:m.ckptD??20,
    sync_fraction:m.sync??1.0});
}
function run(label, m={}) {
  const site = {contracted_mw:CONTRACT*(m.contract??1), ramp_limit_mw_per_s:+(CONTRACT*(m.contract??1)*0.0625*(m.ramp??1)).toFixed(2), osc_p2p_limit_frac:0.10*(m.osc??1)};
  const rep = E.runChecks(E.simulate(design(m), trace(m), 30), site);
  console.log(label.padEnd(46), rep.verdict.padEnd(5), `${rep.counts.FAIL}✗ ${rep.counts.WARN}!`);
  return rep;
}
console.log('BASELINE: 200MW IID, H100-class (no smoothing), fully synced training');
run('baseline');
console.log('\n— DEMAND SIDE —');
run('smoothing 30% (chip)', {smooth:0.3});
run('smoothing 50% (GB300 claim)', {smooth:0.5});
run('smoothing 70%', {smooth:0.7});
run('swing amplitude -20% (low phase higher)', {swing:0.8});
run('swing amplitude +20%', {swing:1.2});
run('synchronized 50% of fleet', {sync:0.5});
run('synchronized 25%', {sync:0.25});
run('iteration 30s (vs 3s)', {iter:30});
run('checkpoint every 5min (vs 20)', {ckptE:300});
console.log('\n— UTILITY / CONTRACT SIDE —');
run('contract +15% (230 MW)', {contract:1.15});
run('contract -10% (180 MW)', {contract:0.9});
run('ramp limit 4x more permissive', {ramp:4});
run('ramp limit 2x stricter', {ramp:0.5});
run('oscillation limit 2x looser', {osc:2});
console.log('\n— FACILITY SUPPLY SIDE —');
run('BESS +100%', {bess:2});
run('BESS -50%', {bess:0.5});
run('gensets +20%', {gen:1.2});
run('gensets -20%', {gen:0.8});
run('passive chain (tx/swgr/feed) +20%', {path:1.2});
run('passive chain -20%', {path:0.8});
run('UPS +20%', {ups:1.2});
run('cooling ratio 0.28 (vs 0.20)', {cool:0.28});
run('cooling ratio 0.12', {cool:0.12});
console.log('\n— SIZING DECISION —');
run('derate IT to 85%', {it:0.85});
run('derate IT 85% + smoothing 50%', {it:0.85, smooth:0.5});
run('derate IT 90% + BESS+50% (no smoothing)', {it:0.9, bess:1.5});
