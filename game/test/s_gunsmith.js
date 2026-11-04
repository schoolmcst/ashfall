// GUNSMITH 2.0: every new attachment on every gun that takes it (stats + 3D parts), the inspect controls, the new charms
const path = require('path');
module.exports = async p => {
  const out = process.env.SHOTS || '/tmp', r = {};
  const NEW = ['flashhider', 'ported', 'handstop', 'taclight', 'jungle', 'heavystock', 'match'];
  r.fit = await p.evaluate(NEW => { const A = window.__A, res = {}, errs = [];
    for (const id of NEW) { const a = A.ATT_BY_ID[id]; let n = 0;
      for (const d of A.ARMORY) { if (!A.attOK(a, d)) continue; n++;
        try { const st = A.computeStats(d, a); if (!isFinite(st.recoil + st.adsTime + st.move + st.spread)) errs.push(id + '@' + d.id + ' stats');
          const g = A.buildGunModel(d, true); A.attachVisuals(g, d, false, g.userData.len + st.lenAdd, a); A.attachVisuals(g, d, false, g.userData.len, null);   // fit, then swap back (the old parts must go)
          let extra = 0; g.traverse(o => { if (o.isMesh) extra++; }); } catch (e) { errs.push(id + '@' + d.id + ' ' + e.message); } }
      res[id] = n; }
    return { res, errs, pros: NEW.map(id => { const a = A.ATT_BY_ID[id], d = A.ARMORY.find(d => A.attOK(a, d)); return id + ': ' + JSON.stringify(A.prosCons(a, d)); }) }; }, NEW);
  // the loadout preview with a few of them fitted, then turned and zoomed
  await p.evaluate(() => { const h = document.getElementById('hcSplash'); if (h) h.remove(); const A = window.__A, d = A.ARM[A.activeClass().p];
    A.ATTS[d.id] = { muzzle: 'flashhider', underbarrel: 'taclight', magazine: 'jungle', stock: 'heavystock' }; A.openLoadout('menu'); });
  await p.waitForTimeout(2500); await p.screenshot({ path: path.join(out, 'gs_loadout.png') });
  const cvBox = await p.evaluate(() => { const c = document.getElementById('loPrev'); if (!c) return null; const b = c.getBoundingClientRect(); return [b.x, b.y, b.width, b.height]; });
  r.canvas = cvBox;
  if (cvBox) {
    const cx = cvBox[0] + cvBox[2] / 2, cy = cvBox[1] + cvBox[3] / 2;
    await p.mouse.move(cx, cy); await p.mouse.down(); for (let i = 0; i < 12; i++) await p.mouse.move(cx + i * 14, cy + i * 3); await p.mouse.up();
    await p.waitForTimeout(800); await p.screenshot({ path: path.join(out, 'gs_turned.png'), clip: { x: cvBox[0] - 10, y: cvBox[1] - 10, width: cvBox[2] + 20, height: cvBox[3] + 20 } });
    for (let i = 0; i < 6; i++) { await p.mouse.wheel(0, -120); await p.waitForTimeout(60); }
    await p.waitForTimeout(800); await p.screenshot({ path: path.join(out, 'gs_zoom.png'), clip: { x: cvBox[0] - 10, y: cvBox[1] - 10, width: cvBox[2] + 20, height: cvBox[3] + 20 } });
    r.ins = await p.evaluate(() => { const I = window.__A.PV.ins; return { yaw: +I.yaw.toFixed(2), pitch: +I.pitch.toFixed(2), zoom: +I.zoom.toFixed(2) }; });
  }
  // the new charms, each built and hung on a gun in the preview
  r.charms = await p.evaluate(() => { const A = window.__A, ids = Object.keys(A.COS).filter(k => ['ch_leaf', 'ch_lighter', 'ch_brownie', 'ch_grinder', 'ch_jar', 'ch_joint', 'ch_bong', 'ch_purple'].includes(k)), res = {};
    for (const id of ids) { try { const g = A.charmBuild(id); let n = 0; g.traverse(o => { if (o.isMesh) n++; }); res[id] = n; } catch (e) { res[id] = 'ERR ' + e.message; } } return res; });
  const shots = [];
  for (const id of ['ch_leaf', 'ch_jar', 'ch_joint', 'ch_bong', 'ch_lighter', 'ch_brownie', 'ch_grinder', 'ch_purple']) {
    await p.evaluate(id => { const A = window.__A, d = A.ARM[A.activeClass().p]; A.PV.key = ''; A.PV.want = { def: d, ovr: null, camo: null, stk: null, chm: id }; Object.assign(A.PV.ins, { yaw: 0.9, pitch: 0.1, zoom: 0.45, px: -0.3, py: 0, idle: 0 }); }, id);
    await p.waitForTimeout(900);
    shots.push(await p.evaluate(() => document.getElementById('loPrev').toDataURL('image/png')));
  }
  require('fs').writeFileSync(path.join(out, 'gs_charms.json'), JSON.stringify(shots));
  return r;
};
