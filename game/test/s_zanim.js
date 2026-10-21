// perk animation frames at fixed moments: SHOTS=dir node run.js s_zanim.js
const path = require('path');
module.exports = async p => {
  const out = process.env.SHOTS || '/tmp';
  await p.evaluate(() => { const A = window.__A; A.ZL.net = 'solo'; A.openZLobby(); A.zombAct('z-start'); const s = document.getElementById('hcSplash'); if (s) s.remove(); A.G.health = 1e9; Object.assign(A.P, { x: 3, z: 26, y: 0, yaw: 0, pitch: 0 }); });
  const plan = process.env.ONLY ? { joint: [0.35, 1.2, 2.3], edible: [0.5, 0.9, 1.5] } : { bowl: [0.45, 1.35, 1.75, 2.75, 3.3], joint: [0.35, 1.2, 2.3, 2.95], edible: [0.5, 0.9, 1.5, 2.1] }, done = [];
  for (const [anim, times] of Object.entries(plan)) for (const t of times) {
    await p.evaluate(({ anim, t }) => { const A = window.__A, pk = A.ZPERKS.find(q => q.anim === anim); A.G.noRender = true; A.ZP.freeze = false; A.zpStartAnim(pk); A.ZP.freeze = true; A.ZP.freeze = false; let k = 0; const step = 1 / 60; while (A.ZP.anim && A.ZP.anim.t < t && k++ < 1000) A.zpTick(step); A.ZP.freeze = true; A.G.noRender = false; }, { anim, t });
    await p.waitForTimeout(900); await p.screenshot({ path: path.join(out, `za_${anim}_${t}.png`) }); done.push(`${anim}@${t}`);
  }
  await p.evaluate(() => { window.__A.ZP.freeze = false; });
  return done;
};
