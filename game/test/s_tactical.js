// TACTICAL GEAR: decoy pulls bots, motion sensor reveals, trophy eats enemy grenades; all in the equipment list
module.exports = async p => {
  await p.evaluate(() => { for (const o of document.querySelectorAll('.onb-ov,#hcSplash')) o.remove(); window.__A.startMatch('tdm', { map: 'dispensary' }); });
  await p.waitForTimeout(5000); await p.evaluate(() => { const A = window.__A; A.G.holdT = 0.01; A.G.loadT = 0; A.G.health = A.G.maxHp = 1e9; }); await p.waitForTimeout(1500);
  return await p.evaluate(() => {
    const A = window.__A, T = THREE, r = {}; const foes = A.enemies.filter(e => !A.isFriend || e.team !== A.M.myTeam);
    r.equip = ['decoy', 'sensor', 'trophy'].every(k => A.EQUIP[k]);
    // decoy next to an enemy
    const f = A.enemies.find(e => e.team !== A.M.myTeam); f.tgt = null; f.lkp = null; f.iq = 1; const fp = f.group.position;
    A.tacDetonate({ kind: 'decoy', m: { position: new T.Vector3(fp.x + 6, 0.2, fp.z) }, by: 'player' }); for (let i = 0; i < 40; i++) A.tacTick(0.05);
    r.decoy = { pulled: !!(f.lkp && Math.hypot(f.lkp.x - (fp.x + 6), f.lkp.z - fp.z) < 4) };
    // sensor next to another enemy
    const g = A.enemies.filter(e => e.team !== A.M.myTeam)[1]; A.tacDetonate({ kind: 'sensor', m: { position: g.group.position.clone() }, by: 'player' }); A.tacTick(0.05);
    r.sensor = { sensed: A.tacSensed(g), seen: A.stkSeen ? A.stkSeen(g) : 'n/a' };
    // trophy, then an enemy grenade flying at it
    A.tacDetonate({ kind: 'trophy', m: { position: new T.Vector3(0, 0.2, 0) }, by: 'player' });
    const m = new T.Mesh(new T.SphereGeometry(0.06), new T.MeshBasicMaterial()); m.position.set(1.5, 1.2, 1); A.scene.add(m); A.grenadesInFlight.push({ m, grav: 13, vx: 0, vy: 0, vz: 0, fuse: 3, spin: 0, kind: 'frag', by: f });
    const n0 = A.grenadesInFlight.length; A.tacTick(0.05); r.trophy = { removed: n0 - A.grenadesInFlight.length, charges: A.TAC.trophies[0] && A.TAC.trophies[0].charges };
    // my own grenade isn't touched
    const m2 = new T.Mesh(new T.SphereGeometry(0.06), new T.MeshBasicMaterial()); m2.position.set(1, 1.2, 1); A.scene.add(m2); A.grenadesInFlight.push({ m: m2, grav: 13, vx: 0, vy: 0, vz: 0, fuse: 3, spin: 0, kind: 'frag' });
    const n1 = A.grenadesInFlight.length; A.tacTick(0.05); r.mineKept = n1 === A.grenadesInFlight.length;
    return r;
  });
};
