module.exports = async p => {
  const R = {};
  // 1. attachments: every non-factory option on every gun has at least one pro and one con; stats move the way the text says
  R.att = await p.evaluate(() => {
    const A = window.__A, bad = [], cnt = { n: 0 };
    for (const d of A.ARMORY) for (const slot of A.slotsFor(d)) for (const a of A.attFor(d, slot)) {
      if (a === A.stockFor(d, slot)) continue; cnt.n++;
      const pc = A.prosCons(a, d); if (!pc.pros.length || !pc.cons.length) bad.push(`${d.id}/${a.id}: +${pc.pros.length} -${pc.cons.length}`);
      const s0 = A.computeStats(d), s1 = A.computeStats(d, a), r = A.relMods(a, d);
      if (r.dmg > 0 && !(s1.dmg > s0.dmg)) bad.push(`${d.id}/${a.id} dmg`);
      if (r.recoil < 0 && !(s1.recoil < s0.recoil)) bad.push(`${d.id}/${a.id} recoil`);
      if (r.ads < 0 && !(s1.adsTime < s0.adsTime)) bad.push(`${d.id}/${a.id} ads`);
      for (const k of ['dmg', 'interval', 'spread', 'adsSpread', 'recoil', 'reload', 'magSize', 'eff', 'adsTime', 'move', 'adsFov']) if (!isFinite(s1[k]) || s1[k] <= 0) bad.push(`${d.id}/${a.id} ${k}=${s1[k]}`);
    }
    return { combos: cnt.n, bad };
  });
  // 2. every gun fires, reloads, and every attachment builds its model without errors
  R.guns = await p.evaluate(async () => {
    const A = window.__A, out = {}, wait = ms => new Promise(r => setTimeout(r, ms)); A.G.noRender = true;
    A.startGame(); A.G.breakT = 1e9; A.G.health = 1e9;
    for (const d of A.ARMORY) {
      const pri = d.cat !== 'pi' && d.cat !== 'la';
      A.equipClass({ p: pri ? d.id : 'marc', s: pri ? 'sidearm' : d.id, e: 'frag', k: 'none' }); if (!pri) A.switchWeapon(1);
      const w = A.W[A.G.cur], before = w.ammo, g0 = A.grenadesInFlight.length;
      A.G.swapT = 0; A.G.fireT = 0; A.P.pitch = 0.3; A.shoot(false);
      const r = { fired: before - w.ammo, proj: A.grenadesInFlight.length - g0 };
      if (w.burst) { r.burstLeft = A.G.burstLeft; }
      for (const slot of A.slotsFor(d)) for (const a of A.attFor(d, slot)) { A.ATTS[d.id] = { [slot]: a.id }; A.applyLoadout(A.G.cur); }
      delete A.ATTS[d.id]; A.applyLoadout(A.G.cur);
      out[d.id] = r;
    }
    // burst: one click = three shots
    A.equipClass({ p: 'gale', s: 'sidearm', e: 'frag', k: 'none' }); A.G.swapT = 0; A.G.fireT = 0;
    const w = A.W[0], b0 = w.ammo; dispatchEvent(new MouseEvent('mousedown', { button: 0 })); await wait(60); dispatchEvent(new MouseEvent('mouseup', { button: 0 }));
    await wait(2000); out.burstShots = b0 - w.ammo;
    // reload
    w.ammo = 3; A.G.reloading = false; A.startReload(); await wait(w.reload * 1600 + 1500); out.reloaded = w.ammo === w.magSize;
    // rocket explodes and kills
    A.equipClass({ p: 'marc', s: 'hellfire', e: 'frag', k: 'none' }); A.switchWeapon(1); A.G.swapT = 0; A.G.fireT = 0;
    A.P.yaw = 0; A.P.pitch = -0.02; A.P.x = 0; A.P.z = 10;
    const e = A.makeEnemy('rifleman', 0, 2); A.enemies.push(e); e.cd = 99;
    A.shoot(false); out.rocketsInAir = A.grenadesInFlight.length;
    await wait(3000); out.rocketsAfter = A.grenadesInFlight.length; out.enemyDead = !A.enemies.includes(e);
    for (const x of A.enemies.slice()) A.damageEnemy(x, 1e6, false);
    // equipment: semtex sticks, stun stuns
    A.equipClass({ p: 'marc', s: 'sidearm', e: 'stun', k: 'none' }); A.G.grenades = 3;
    const e2 = A.makeEnemy('rifleman', 0, 6); A.enemies.push(e2); e2.cd = 99; A.P.pitch = -0.3; A.throwGrenade(); await wait(3200); out.stunT = +(e2.stunT || 0).toFixed(2); out.e2alive = A.enemies.includes(e2);
    A.equipClass({ p: 'marc', s: 'sidearm', e: 'semtex', k: 'none' }); A.G.grenades = 2; A.P.pitch = 0.1; A.throwGrenade(); await wait(900); out.stuck = A.grenadesInFlight.some(g => g.stuck) || A.grenadesInFlight.length === 0;
    return out;
  });
  // 3. classes: pick class 3, deploy, check what we hold
  R.classes = await p.evaluate(() => {
    const A = window.__A; A.setActive(3); A.startGame();
    return { held: A.W.map(w => w.def.id), equip: A.G.equip, perk: A.G.perk, gren: A.G.grenades, cls: A.CLASSES[3] };
  });
  return R;
};
