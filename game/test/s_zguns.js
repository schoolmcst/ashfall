// gun viewmodels in zombies vs a normal match, same guns: SHOTS=dir node run.js s_zguns.js
const path = require('path');
module.exports = async p => {
  const out = process.env.SHOTS || '/tmp', guns = (process.env.GUNS || 'sidearm,warden,marc,titan').split(','), res = {};
  for (const mode of ['zomb', 'surv']) {
    await p.evaluate(mode => { const A = window.__A; if (mode === 'zomb') { A.ZL.net = 'solo'; A.openZLobby(); A.zombAct('z-start'); } else { A.toMenu(); A.startMatch('surv'); } A.G.health = 1e9; A.G.maxHp = 1e9; A.G.holdT = 0; A.G.loadT = 0; const s = document.getElementById('hcSplash'); if (s) s.remove(); const l = document.getElementById('loadscr'); if (l) l.classList.add('hide'); }, mode);
    for (const g of guns) {
      const info = await p.evaluate(({ mode, g }) => { const A = window.__A; if (mode === 'zomb') { A.Z.guns = g === 'sidearm' ? ['sidearm'] : [g, 'sidearm']; A.zombEquip(0); } else { A.equipClass({ p: g === 'sidearm' ? 'marc' : g, s: 'sidearm', e: 'frag', k: 'none' }); if (g === 'sidearm') { A.G.cur = 1; A.gunObjs.forEach((o, i) => { o.visible = i === 1; }); } }
        A.G.state = 'playing'; Object.assign(A.P, mode === 'zomb' ? { x: 0, z: 30, y: 0, yaw: 0, pitch: 0 } : { pitch: 0 }); A.G.holdT = 0; const w = A.W[A.G.cur], o = A.gunObjs[A.G.cur];
        return { name: w.name, dmg: w.dmg, mag: w.magSize, scale: o.scale.toArray().map(v => +v.toFixed(3)), pos: o.position.toArray().map(v => +v.toFixed(3)), kids: o.children.length }; }, { mode, g });
      await p.waitForTimeout(1500); await p.screenshot({ path: path.join(out, `zg_${mode}_${g}.png`) }); res[mode + ':' + g] = info;
    }
  }
  return res;
};
