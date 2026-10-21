// bot loadouts: every bot's gun, attachments and camo, close-up pictures of a few, and a short fight
const fs = require('fs'), path = require('path');
module.exports = async p => {
  const out = process.env.SHOTS || '/tmp', id = process.env.MAP || 'dustwater';
  const r = await p.evaluate(async id => {
    const A = window.__A; A.G.noRender = true;
    A.startMatch('tdm', { score: 999, time: 0, perTeam: 6, skill: 'regular', custom: true, map: id });
    A.G.spawnProt = 1e9;
    const list = A.enemies.filter(e => e.entry).map(e => ({ name: e.entry.name, job: e.job, gun: e.gunId, cat: A.ARM[e.gunId] && A.ARM[e.gunId].cat, atts: e.atts, camo: e.entry.loadout && e.entry.loadout.camo, dmg: +e.dmg.toFixed(1), gap: +e.gap.toFixed(2), mag: e.magSize, eff: Math.round(e.eff), quiet: e.stealth, vis: !!e.gunVis }));
    await new Promise(res => setTimeout(res, 30000));
    const feed = [...document.querySelectorAll('#feed .fl, #feed div')].map(d => d.textContent).slice(0, 8);
    A.G.noRender = false;
    return { list, feed, kills: A.M.teamScore };
  }, id);
  // close-ups: freeze the bots and frame a few of them
  const shots = await p.evaluate(() => {
    const A = window.__A, rnd = A.renderer, sc = A.scene, res = [];
    const bots = A.enemies.filter(e => e.entry && e.gunVis).slice(0, 6);
    for (const e of bots) {
      const g = e.group, ry = g.rotation.y, fx = Math.sin(ry), fz = Math.cos(ry);
      const cam = new THREE.PerspectiveCamera(40, 16 / 9, 0.05, 200);
      cam.position.set(g.position.x + fx * 1.6 + fz * 1.5, g.position.y + 1.55, g.position.z + fz * 1.6 - fx * 1.5); cam.lookAt(g.position.x + fx * 0.3, g.position.y + 1.2, g.position.z + fz * 0.3);
      const W = rnd.domElement.width, H = rnd.domElement.height; rnd.setSize(960, 540, false); rnd.setViewport(0, 0, 960, 540); rnd.clear(); rnd.render(sc, cam);
      res.push([e.entry.name + ' ' + e.gunId, rnd.domElement.toDataURL('image/jpeg', 0.85)]); rnd.setSize(W, H, false); rnd.setViewport(0, 0, W, H);
    }
    return res;
  });
  shots.forEach(([n, u], i) => fs.writeFileSync(path.join(out, `botgun_${i}.jpg`), Buffer.from(u.split(',')[1], 'base64')));
  return { bots: r.list, feed: r.feed, kills: r.kills, shots: shots.map(s => s[0]) };
};
