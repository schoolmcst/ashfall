// JUMP PADS and ZIPLINES on STASH ISLAND, stepped at 60 fps; a picture from the zipline
const path = require('path');
module.exports = async p => {
  const out = process.env.SHOTS || '/tmp';
  await p.evaluate(() => { for (const o of document.querySelectorAll('.onb-ov,#hcSplash')) o.remove(); window.__A.startMatch('br', { map: 'random' }); });
  await p.waitForTimeout(5000); await p.evaluate(() => { const A = window.__A; A.G.holdT = 0.01; A.G.loadT = 0; A.G.health = A.G.maxHp = 1e9; }); await p.waitForTimeout(1500);
  const r = await p.evaluate(() => {
    const A = window.__A, P = A.P, K = A.keys, r = {}, d = A.MOVERS.stashisle; const step = n => { for (let i = 0; i < n; i++) { A.moversTick(1 / 60); A.updatePlayer(1 / 60); } };
    for (const [i, pd] of d.pads.entries()) { for (const k in K) K[k] = false; P.x = pd.x; P.z = pd.z; P.y = 0; P.vx = P.vz = P.vy = 0; P.onGround = true; A.MV2.cd = 0; A.MV2.fly = null; step(240); r['pad' + i] = { x: +P.x.toFixed(1), y: +P.y.toFixed(1), z: +P.z.toFixed(1), want: pd.to }; }
    const z = d.zips[0]; P.x = z.a.x; P.z = z.a.z; P.y = z.a.y - 1.9; P.vy = 0; P.onGround = true; A.MV2.cd = 0; K.KeyE = true; step(2); K.KeyE = false; r.zipOn = !!A.MV2.zip; step(30);
    r.zipMid = { k: A.MV2.zip ? +A.MV2.zip.k.toFixed(2) : -1, y: +P.y.toFixed(1) };
    return r;
  });
  await p.evaluate(() => { const A = window.__A; A.P.pitch = -0.15; A.P.yaw = Math.atan2(-(A.MOVERS.stashisle.zips[0].b.x - A.P.x), -(A.MOVERS.stashisle.zips[0].b.z - A.P.z)); }); await p.waitForTimeout(800);
  await p.screenshot({ path: path.join(out, 'zipline.png'), timeout: 120000 });
  r.zipEnd = await p.evaluate(() => { const A = window.__A, P = A.P; for (let i = 0; i < 400 && A.MV2.zip; i++) A.updatePlayer(1 / 60); for (let i = 0; i < 90; i++) A.updatePlayer(1 / 60); const b = A.MOVERS.stashisle.zips[0].b; return { off: !A.MV2.zip, dist: +Math.hypot(P.x - b.x, P.z - b.z).toFixed(1), y: +P.y.toFixed(1), ground: P.onGround }; });
  return r;
};
