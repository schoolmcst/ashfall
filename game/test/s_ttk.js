// TTK table for every gun: shots to kill on chest / stomach / legs, up close and far, base and with the most damage parts
module.exports = async p => p.evaluate(() => {
  const A = window.__A, out = [];
  for (const d of A.ARMORY) {
    if (d.cat === 'la') continue;
    const row = { id: d.id, cat: d.cat, name: d.name };
    const calc = (dmg, pel, interval, fallMin) => {
      const z = { chest: 1.1, stom: 1, leg: 0.8, head: d.head };
      const r = {};
      for (const [k, m] of Object.entries(z)) for (const [rk, f] of [['', 1], ['Far', fallMin]]) {
        const per = dmg * m * f * (pel > 1 ? pel * 0.6 : 1); const n = Math.ceil(100 / per - 1e-9); r[k + rk] = n; if (k !== 'head') r['ttk' + k + rk] = Math.round((n - 1) * interval * 1000);
      }
      return r;
    };
    row.base = calc(d.dmg, d.pellets, d.interval, d.fallMin === undefined ? 0.6 : d.fallMin);
    const att = (A.slotsFor(d) || []);
    let best = d.dmg * (1 + ((att.includes('barrel') && !(d.id === 'coach')) ? 0.04 : 0) + ((att.includes('ammo') && d.cat !== 'sg') ? 0.06 : 0));
    row.maxDmg = +best.toFixed(1);
    row.max = calc(best, d.pellets, d.interval, d.fallMin === undefined ? 0.6 : d.fallMin);
    row.dmg = d.dmg; row.rpm = Math.round(60 / d.interval); row.eff = d.eff; row.head = d.head;
    out.push(row);
  }
  return out.map(r => `${r.cat.padEnd(4)} ${r.name.padEnd(14)} dmg ${String(r.dmg).padStart(3)}(${String(r.maxDmg).padStart(5)}) rpm ${String(r.rpm).padStart(4)} eff ${String(r.eff).padStart(3)} | chest ${r.base.chest}/${r.base.ttkchest}ms stom ${r.base.stom}/${r.base.ttkstom}ms leg ${r.base.leg} head ${r.base.head} far-chest ${r.base.chestFar} | MAXPARTS chest ${r.max.chest}/${r.max.ttkchest}ms stom ${r.max.stom}/${r.max.ttkstom}ms`).join('\n');
});
