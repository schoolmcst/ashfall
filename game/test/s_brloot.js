// LAST TOKE LOOT 2.0: floor loot on furniture, rarity, the kit, ammo types, heals (+ pictures in SHOTS)
module.exports = async p => {
  const r = {}, SH = process.env.SHOTS || '/tmp';
  await p.evaluate(() => { for (const o of document.querySelectorAll('.onb-ov,#hcSplash')) o.remove(); const A = window.__A; A.G.noRender = true; A.startMatch('br', { map: 'stashisle' }); });
  await p.waitForTimeout(12000); await p.evaluate(() => { const A = window.__A; A.G.holdT = 0.01; A.G.loadT = 0; }); await p.waitForTimeout(1500);
  r.setup = await p.evaluate(() => { const A = window.__A, L = A.BRL_GET(); const kinds = {}; for (const s of L.sets) kinds[s.kind] = (kinds[s.kind] || 0) + 1; return { sets: L.sets.length, items: L.items.length, kinds, crates: A.M.br.crates.length, seed: L.seed > 0, ammo: JSON.stringify(L.ammo), reserve: A.W[A.G.cur].reserve }; });
  // stand next to a gun item (a table or a rack), looking at it
  const go = k => p.evaluate(k => { const A = window.__A, L = A.BRL_GET(), it = L.items.find(i => !i.gone && i.k === k && (k !== 'gun' || i.set.kind === 'table')) || L.items.find(i => !i.gone && i.k === k); if (!it) return null;
    it.mesh.updateWorldMatrix(true, false); const w = it.mesh.getWorldPosition(new THREE.Vector3()), g = it.set.g, fx = Math.sin(g.rotation.y), fz = Math.cos(g.rotation.y);
    A.P.x = w.x - fx * 1.1; A.P.z = w.z - fz * 1.1; A.P.y = it.set.y; A.P.yaw = Math.atan2(fx, fz) + Math.PI; A.P.pitch = Math.atan2(w.y + 0.08 - (A.P.y + 1.7), 1.1); A.G.health = 100; return it.id; }, k);
  const use = async () => { await p.waitForTimeout(600); await p.evaluate(() => { window.__A.keys[window.__A.S.binds && window.__A.S.binds.use || 'KeyE'] = true; }); await p.waitForTimeout(400); await p.evaluate(() => { window.__A.keys[window.__A.S.binds && window.__A.S.binds.use || 'KeyE'] = false; }); await p.waitForTimeout(250); };
  r.gunAt = await go('gun'); await p.waitForTimeout(900);
  await p.evaluate(() => { window.__A.G.noRender = false; }); await p.waitForTimeout(1200); await p.screenshot({ path: SH + '/brloot_table.png' }); await p.evaluate(() => { window.__A.G.noRender = true; });
  r.nearGun = await p.evaluate(() => { const n = window.__A.BRL_GET().near; return n && n.k; });
  const d0 = await p.evaluate(() => window.__A.W[0].dmg);
  await use();
  r.dbg = await p.evaluate(() => { const A = window.__A, L = A.BRL_GET(); return { out: L.out.slice(), alive: A.G.state, w: A.W.map(w => w.def.id), heal: !!L.heal }; });
  r.took = await p.evaluate(d0 => { const A = window.__A, L = A.BRL_GET(), w = A.W[0], t = L.rar[w.def.id] | 0; return { gun: w.def.id, cat: w.def.cat, tier: t, dmgRatio: +(w.dmg / w.def.dmg).toFixed(3), reserve: w.reserve, ammo: JSON.stringify(L.ammo), nameCol: document.getElementById('wname').style.color }; }, d0);
  // an attachment
  r.attAt = await go('att'); await p.waitForTimeout(500); await use();
  r.kit = await p.evaluate(() => JSON.stringify(window.__A.BRL_GET().kit));
  // ammo
  r.ammoAt = await go('ammo'); await p.waitForTimeout(500); const a0 = await p.evaluate(() => JSON.stringify(window.__A.BRL_GET().ammo)); await use(); r.ammo = [a0, await p.evaluate(() => JSON.stringify(window.__A.BRL_GET().ammo))];
  // a heal: pick one up, get hurt, press 5
  r.healAt = await go('heal'); await p.waitForTimeout(500); await use();
  r.heals = await p.evaluate(() => JSON.stringify(window.__A.BRL_GET().heals));
  await p.evaluate(() => { const A = window.__A; A.G.health = 40; A.keys.Digit5 = true; }); await p.waitForTimeout(200); await p.evaluate(() => { window.__A.keys.Digit5 = false; }); await p.waitForTimeout(6000);
  r.healed = await p.evaluate(() => Math.round(window.__A.G.health));
  // the reserve follows the pool after a reload
  r.reload = await p.evaluate(() => { const A = window.__A, w = A.W[0]; return { before: w.reserve }; });
  // a rack picture and a shelf picture
  for (const k of ['rack', 'shelf', 'pallet']) {
    const ok = await p.evaluate(k => { const A = window.__A, L = A.BRL_GET(), s = L.sets.find(s => s.kind === k); if (!s) return false; const g = s.g, fx = Math.sin(g.rotation.y), fz = Math.cos(g.rotation.y), back = k === 'pallet' ? 2.2 : 2.6 - (s.wz || 0);
      A.P.x = s.x - fx * back; A.P.z = s.z - fz * back; A.P.y = s.y; A.P.yaw = Math.atan2(fx, fz) + Math.PI; A.P.pitch = k === 'pallet' ? -0.5 : -0.12; return true; }, k);
    if (!ok) continue; await p.evaluate(() => { window.__A.G.noRender = false; }); await p.waitForTimeout(1300); await p.screenshot({ path: SH + `/brloot_${k}.png` }); await p.evaluate(() => { window.__A.G.noRender = true; });
  }
  await p.evaluate(() => { window.__A.G.noRender = false; window.__A.G.cur = 0; }); await p.waitForTimeout(600); await p.screenshot({ path: SH + '/brloot_gun.png' });
  r.pack = await p.evaluate(() => { const a = window.__A.brPack(); return a[a.length - 1] === window.__A.BRL_GET().seed; });
  return r;
};
