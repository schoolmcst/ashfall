// attachment balance audit: what each part really changes (after amplifiers) on a reference gun of each class
module.exports = async p => p.evaluate(() => {
  const A = window.__A, refs = { ar: 'marc', smg: 'viper', lmg: 'anvil', mr: 'sentinel', sr: 'hawkeye', sg: 'breacher', pi: 'sidearm' };
  const keys = [['dmg', 'DMG', 1], ['interval', 'RATE', -1], ['eff', 'RANGE', 1], ['recoil', 'RECOIL', -1], ['spread', 'HIP', -1], ['adsSpread', 'ADS ACC', -1], ['adsTime', 'ADS TIME', -1], ['move', 'MOVE', 1], ['reload', 'RELOAD', -1], ['magSize', 'MAG', 1]];
  const rows = [];
  for (const a of A.ATTS ? Object.values(A.ATTS) : []) {}
  const list = (typeof ATT !== 'undefined') ? ATT : A.ATT;
  for (const att of list) {
    if (!att.mods || !Object.keys(att.mods).length) continue;
    const cat = att.c.find(c => refs[c]); if (!cat) continue;
    const d = A.ARM[refs[cat]]; if (att.not && att.not.includes(d.id)) continue; if (att.only && !att.only.includes(d.id)) continue;
    const base = A.computeStats(d, null, true), w = A.computeStats(d, att, true);
    const ch = []; let score = 0;
    for (const [k, lab, dir] of keys) { const b = base[k], v = w[k]; if (!b || Math.abs(v - b) / b < 0.005) continue; const pct = (v / b - 1) * 100; ch.push(`${lab} ${pct > 0 ? '+' : ''}${pct.toFixed(0)}%`); score += Math.max(-60, Math.min(60, pct)) * dir; }
    rows.push(`${att.slot.padEnd(11)} ${att.name.padEnd(20)} (${d.name}) score ${score.toFixed(0).padStart(4)} | ${ch.join(', ')}`);
  }
  return rows.join('\n');
});
