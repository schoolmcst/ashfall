// STASH ISLAND's river and lake: depth, swimming, the bridge, pictures
module.exports = async p => {
  const r = {}, SH = process.env.SHOTS || '/tmp', shot = async n => { await p.evaluate(() => { window.__A.G.noRender = false; }); await p.waitForTimeout(1300); await p.screenshot({ path: SH + '/river_' + n + '.png' }); await p.evaluate(() => { window.__A.G.noRender = true; }); };
  await p.evaluate(() => { for (const o of document.querySelectorAll('.onb-ov,#hcSplash')) o.remove(); const A = window.__A; A.G.noRender = true; A.startMatch('br', { map: 'stashisle' }); });
  await p.waitForTimeout(12000); await p.evaluate(() => { const A = window.__A; A.G.holdT = 0.01; A.G.loadT = 0; A.G.health = A.G.maxHp = 1e6; for (const e of A.enemies) if (e.entry) { e.acc = 0; e.dmg = 0; } }); await p.waitForTimeout(1500);
  r.depth = await p.evaluate(() => { const A = window.__A; return [[-100, -24], [-120, -28], [-140, -28], [-170, -30], [-100, -50], [-100, 0]].map(([x, z]) => +A.TH(x, z).toFixed(1)); });
  r.swim = await p.evaluate(async () => { const A = window.__A; A.P.x = -100; A.P.z = -24; A.P.y = 3; await new Promise(r => setTimeout(r, 2500)); return { y: +A.P.y.toFixed(2), swim: A.BRI_GET().swim }; });
  r.bridge = await p.evaluate(async () => { const A = window.__A; A.P.x = -110; A.P.z = -56; A.P.y = A.TH(-110, -56) + 0.2; A.P.yaw = Math.PI; A.keys.KeyW = true; let lo = 99; for (let i = 0; i < 40; i++) { await new Promise(r => setTimeout(r, 200)); if (A.P.z > -48 && A.P.z < 0) lo = Math.min(lo, A.P.y - A.TH(A.P.x, A.P.z)); } A.keys.KeyW = false; return { lo: +lo.toFixed(1), z: +A.P.z.toFixed(1), y: +A.P.y.toFixed(1), bed: +A.TH(-110, -27).toFixed(1) }; });
  await p.evaluate(() => { const A = window.__A; A.P.x = -86; A.P.z = -10; A.P.y = A.TH(-86, -10); A.P.yaw = Math.atan2(14, 14) ; A.P.pitch = -0.15; }); await shot('lake');
  await p.evaluate(() => { const A = window.__A; A.P.x = -128; A.P.z = -48; A.P.y = A.TH(-128, -48); A.P.yaw = Math.atan2(-18, -20) + Math.PI; A.P.pitch = -0.12; }); await shot('bridge');
  return r;
};
