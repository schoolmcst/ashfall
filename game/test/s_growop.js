// THE GROW OP: plant, water, grow in (simulated) real time, light, feed, harvest, rewards, pots, supplies from a match, pictures
const path = require('path');
module.exports = async p => {
  const out = process.env.SHOTS || '/tmp', r = {};
  r.a = await p.evaluate(() => { const A = window.__A, G = A.GROW_API, g = G.growLoad(); const xp0 = A.PROG.xp, dz0 = A.PROG.dz;
    const res = { start: JSON.parse(JSON.stringify({ seeds: g.seeds, res: g.res })) };
    res.plant = G.growPlant(0, 'og'); res.plantNoSeed = G.growPlant(1, 'haze');
    res.water = G.growWater(0); const p0 = g.pots[0]; res.wet = Math.round(p0.wet / 36e5);
    g.last -= 2 * 36e5; G.growTick(); res.after2h = +(p0.grown / 36e5).toFixed(2);           // two hours pass
    res.light = G.growLight(0); res.after = +(p0.grown / 36e5).toFixed(2); res.feed = G.growFeed(0);
    res.early = G.growHarvest(0);
    g.last -= 1 * 36e5; G.growTick(); const h = G.growHarvest(0); res.harvest = h; res.xpGain = A.PROG.xp - xp0; res.dzGain = A.PROG.dz - dz0; res.camo = !!A.PROG.owned.gr_og;
    // a plant that runs dry pauses
    G.growPlant(1, 'og'); const p1 = g.pots[1]; g.last -= 5 * 36e5; G.growTick(); res.dryGrown = +(p1.grown / 36e5).toFixed(2); res.dryWet = p1.wet;
    G.growMatch(1); res.afterMatch = JSON.parse(JSON.stringify(g.res));
    for (let i = 0; i < 6; i++) { g.harvests = [0, 5, 15, 30][Math.min(3, i)]; }
    return res; });
  await p.evaluate(() => { const A = window.__A, G = A.GROW_API, g = G.growLoad(); g.harvests = 6; g.seeds.blue = 2; g.seeds.haze = 1; g.res.w += 5;
    G.growPlant(2, 'blue'); G.growPlant(3, 'haze'); g.pots[2].grown = 4 * 36e5; g.pots[3].grown = 3 * 36e5; g.pots[3].wet = 3 * 36e5; const h = document.getElementById('hcSplash'); if (h) h.remove(); A.GROW_API.openGrow(); });
  await p.waitForTimeout(1500); await p.evaluate(() => { for (const id of ['hcSplash']) { const h = document.getElementById(id); if (h) h.remove(); } document.querySelectorAll('.hc-ov,.hc-splash,[id^=hc]').forEach(e => { if (e.id !== 'hud') e.remove(); }); });
  await p.waitForTimeout(500); await p.screenshot({ path: path.join(out, 'grow.png') });
  r.tab = await p.evaluate(() => [...document.querySelectorAll('.gr-tab')].map(b => b.className));
  return r;
};
