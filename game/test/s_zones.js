// hit zones: shoot (aimed, first shot = perfect) at a soldier's head, chest, stomach, arm, legs and read the damage
module.exports = async p => {
  return await p.evaluate(async () => {
    const A = window.__A; A.startMatch('tdm', { score: 999, time: 0, perTeam: 1, custom: true, map: 'docks' }); A.G.holdT = 0; A.G.loadT = 0;
    for (const e of A.enemies.slice()) { e.group.visible = false; e.group.position.set(500, -50, 500); }
    const out = {}, w = A.W[A.G.cur];
    const e = A.makeEnemy('rifleman', A.P.x, A.P.z - 6); A.enemies.push(e); e.team = 1; e.cd = 99; e.group.rotation.y = 0; e.hp = 1e6;
    await new Promise(r => setTimeout(r, 300));
    const bones = {}; e.group.traverse(o => { if (o.isBone) bones[o.name] = o; });
    const v = new THREE.Vector3();
    const aims = { head: ['head', 0.02], chest: ['torso', 0.48], stomach: ['torso', 0.12], arm: ['armR', -0.12], thigh: ['legL', -0.2], shin: ['kneeL', -0.25] };
    for (const [k, [b, dy]] of Object.entries(aims)) {
      e.group.updateMatrixWorld(true); bones[b].localToWorld(v.set(0, dy, 0.05));
      const cam = A.camera; const dx = v.x - cam.position.x, dz = v.z - cam.position.z, dyy = v.y - cam.position.y;
      cam.lookAt(v); cam.updateMatrixWorld();
      A.G.adsOn = true; A.G.ads = 1; A.G.lastShotTime = -9; A.G.cool = 0; const hp = e.hp; A.shoot(); out[k] = Math.round(hp - e.hp);
    }
    out.gun = w.def ? w.def.name : A.G.cur; out.dmg = w.dmg;
    return out;
  });
};
