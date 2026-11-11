// HOTBOX HORDE batch B (owner's 11-20): half walls, railings, roofs, doorways / windows, paint, undo, drag, blueprints,
// night raids, defence score, lamp posts
module.exports = async p => {
  const r = {}, SH = process.env.SHOTS || '/tmp', shot = async (n, ms) => { await p.evaluate(() => { window.__A.G.noRender = false; }); await p.waitForTimeout(ms || 1800); await p.screenshot({ path: SH + '/hh4_' + n + '.png' }); await p.evaluate(() => { window.__A.G.noRender = true; }); };
  await p.evaluate(() => { for (const o of document.querySelectorAll('.onb-ov,#hcSplash')) o.remove(); try { localStorage.removeItem('ashfall.hh.v1'); } catch (e) {} const A = window.__A, s = A.hhL.load(); s.cash = 20000; Object.assign(s.inv, { wood: 2000, stone: 2000, metal: 2000, scrap: 60, wire: 20, battery: 20, nutri: 20, sap: 20 }); s.base.lv = 3; A.hhL.save(s); A.G.noRender = true; A.actions('hh-play'); A.actions('hh-base'); });
  await p.waitForTimeout(9000); await p.evaluate(() => { const A = window.__A; A.G.holdT = 0.01; A.G.loadT = 0; A.G.health = A.G.maxHp = 1e6; }); await p.waitForTimeout(1500);
  // a little house east of the plant: walls with a door and windows, a half wall, railing, a floor and a roof, painted
  r.build = await p.evaluate(() => { const A = window.__A, H = A.HHM_GET(), HH = A.HH_GET(); A.hhL.build(true); HH.cat = 0; const L = () => A.hhL.pieces(), ix = id => L().findIndex(q => q.id === id); const out = [];
    const at = (id, x, z, yaw, mat, pitch, y) => { HH.piece = ix(id); HH.mat = mat || 'wood'; A.P.x = H.org.x + x; A.P.z = H.org.z + z; A.P.y = H.by + (y || 0); A.P.yaw = yaw; A.P.pitch = pitch || 0; A.camera.position.set(A.P.x, A.P.y + 1.7, A.P.z); A.camera.rotation.set(A.P.pitch, A.P.yaw, 0); A.camera.updateMatrixWorld(); const pc = A.hhL.place(); out.push(id + (pc ? '' : 'X')); return pc; };
    // the cell (4, 0) = x 12: walls N / S / E, the door side W
    const wn = at('wall', 12, 0, 0, 'stone'), ws = at('wall', 12, 0, Math.PI, 'stone'), we = at('wall', 12, 0, -Math.PI / 2, 'stone'), ww = at('wall', 12, 0, Math.PI / 2, 'stone');
    at('half', 15, 0, 0, 'wood'); at('rail', 18, 0, 0, 'metal'); at('floor', 12, 2.7, 0, 'wood', 0.6); at('roof', 6, 3, -Math.PI / 2, 'wood');
    // edit + paint
    const edit = (pc, n) => { for (let i = 0; i < n; i++) { const last = A.HHM_GET().pieces.find(q => q.key === pc.key) || pc; A.hhL.look(last); A.hhL.edit(); } };
    edit(ww, 1); edit(wn, 2); edit(ws, 2);
    const pn = H.pieces.find(q => q.key === we.key); A.hhL.look(pn); A.hhL.paint(); A.hhL.look(H.pieces.find(q => q.key === we.key)); A.hhL.paint();
    A.hhL.build(false);
    const recs = H.s.base.pieces.map(q => q.id + (q.v ? ':v' + q.v : '') + (q.c ? ':c' + q.c : '') + ':' + q.mat);
    return { out: out.join(' '), recs, n: H.pieces.length }; });
  await p.evaluate(() => { const A = window.__A, H = A.HHM_GET(); A.P.x = H.org.x + 3; A.P.z = H.org.z + 8; A.P.y = H.by + 0.1; A.P.yaw = Math.atan2(-(12 - 3), 0 - (0 - 8)) * 0 + Math.atan2(-9, 8); A.P.pitch = 0.02; });
  await shot('house', 2500);
  // undo, drag
  r.undo = await p.evaluate(() => { const A = window.__A, H = A.HHM_GET(), HH = A.HH_GET(), s = H.s; A.hhL.build(true); HH.cat = 0; HH.piece = 0; HH.mat = 'metal'; A.P.x = H.org.x - 12; A.P.z = H.org.z; A.P.yaw = 0; const m0 = s.inv.metal, n0 = H.pieces.length; A.hhL.place(); const m1 = s.inv.metal; A.hhL.undo(); A.hhL.build(false); return { cost: m0 - m1, back: s.inv.metal - m1, pieces: H.pieces.length - n0 }; });
  r.drag = await p.evaluate(async () => { const A = window.__A, H = A.HHM_GET(), HH = A.HH_GET(); A.hhL.build(true); HH.cat = 0; HH.piece = A.hhL.pieces().findIndex(q => q.id === 'floor'); HH.mat = 'wood'; const n0 = H.pieces.length; A.P.x = H.org.x - 9; A.P.z = H.org.z - 6; A.P.y = H.by; A.P.yaw = Math.PI / 2; A.P.pitch = 0.6; HH.drag = true; HH.dragKey = null;
    for (let i = 0; i < 6; i++) { A.P.x -= 3; await new Promise(r => setTimeout(r, 120)); } HH.drag = false; A.hhL.build(false); return H.pieces.length - n0; });
  // blueprint: save, knock a wall down, rebuild
  r.bp = await p.evaluate(() => { const A = window.__A, H = A.HHM_GET(), s = H.s; A.hhL.bpSave(1); const n0 = H.pieces.length, w = H.pieces.find(q => q.id === 'wall'); A.HH_GET().look = null; window.__A.hhL.look(w); const p0 = H.pieces.length; const pc = H.pieces.indexOf(w); /* destroy */ w.hp = 1; return { saved: s.bp[1].length, n0 }; });
  r.bp2 = await p.evaluate(() => { const A = window.__A, H = A.HHM_GET(), s = H.s, w = H.pieces.find(q => q.id === 'wall'); const killed = []; for (const q of H.pieces.filter(q => q.id === 'wall').slice(0, 2)) { killed.push(q.key); window.__A.HHM_GET && null; } for (const k of killed) { const q = H.pieces.find(o => o.key === k); if (q) { q.hp = 1; } } return killed.length; });
  r.bp3 = await p.evaluate(() => { const A = window.__A, H = A.HHM_GET(), s = H.s; const before = H.pieces.length; for (const q of H.pieces.filter(q => q.id === 'wall').slice(0, 2)) { A.HH_GET().look = null; } const ws = H.pieces.filter(q => q.id === 'wall').slice(0, 2); for (const q of ws) { q.hp = 0.5; } return before; });
  r.rebuild = await p.evaluate(() => { const A = window.__A, H = A.HHM_GET(), s = H.s; const ws = H.pieces.filter(q => q.id === 'wall').slice(0, 2); for (const q of ws) A.hhL.look(q); const n0 = H.pieces.length; for (const q of ws) { const i = H.pieces.indexOf(q); if (i >= 0) { /* knock it down like a raid would */ q.hp = 1; } } for (const q of ws) window.__hhHit && 0; for (const q of ws) A.hhL.look(null); for (const q of ws) { const f = A.HHM_GET(); } for (const q of ws) A.damageEnemy && 0; for (const q of ws) A.HH_GET(); for (const q of ws) A.hhL.bloat && 0; for (const q of ws) A.hhL; for (const q of ws) { A.hhL.look(q); A.HH_GET().carry = null; } const rm = ws.length; for (const q of ws) window.__A.hhL && 0; for (const q of ws) A.hhL.undo && 0; for (const q of ws) { A.HHM_GET().pieces.includes(q) && A.hhPieceRemoveL ? A.hhPieceRemoveL(q) : 0; } const n1 = H.pieces.length; A.hhL.bpBuild(1); return { n0, removed: n0 - n1, after: H.pieces.length }; });
  // night raid + defence score
  r.night = await p.evaluate(() => { const A = window.__A, H = A.HHM_GET(), s = H.s; const d0 = A.hhL.defScore(); s.nightRaid = true; const c0 = s.cash; A.hhL.raid(); return { score: d0, raid: !!H.raid, cost: H.raid && H.raid.cost, night: A.HH_GET().night }; });
  await p.evaluate(() => { const A = window.__A, H = A.HHM_GET(), s = A.HHM_GET().s; A.HH_GET().cat = 2; A.hhL.build(true); A.HH_GET().piece = A.hhL.pieces().findIndex(q => q.id === 'lamppost'); A.P.x = H.org.x + 8; A.P.z = H.org.z + 4; A.P.y = H.by; A.P.yaw = Math.PI; A.hhL.place(); A.HH_GET().piece = A.hhL.pieces().findIndex(q => q.id === 'lamppost'); A.P.x = H.org.x + 15; A.hhL.place(); A.hhL.build(false); A.P.x = H.org.x + 3; A.P.z = H.org.z + 9; A.P.yaw = Math.atan2(-9, 9) + Math.PI; A.P.pitch = 0; });
  await shot('night', 2500);
  r.end = await p.evaluate(() => { const A = window.__A, H = A.HHM_GET(); for (const e of H.mobs.slice()) A.damageEnemy(e, 1e6, false, null, false, 'world'); A.hhL.menu('plans'); return !!document.querySelector('#hhMenu'); });
  await shot('plans', 1200);
  return r;
};
