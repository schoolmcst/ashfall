// THE VAULTS (key cards, the door, the boss, the loot inside) and LAST TOKE BOTS 2.0 (floor loot, hiding, phases)
module.exports = async p => {
  const r = {}, SH = process.env.SHOTS || '/tmp';
  await p.evaluate(() => { for (const o of document.querySelectorAll('.onb-ov,#hcSplash')) o.remove(); const A = window.__A; A.G.noRender = true; A.startMatch('br', { map: 'stashisle' }); });
  await p.waitForTimeout(12000); await p.evaluate(() => { const A = window.__A; A.G.holdT = 0.01; A.G.loadT = 0; }); await p.waitForTimeout(1500);
  r.setup = await p.evaluate(() => { const A = window.__A, V = A.BRB_GET(), L = A.BRL_GET(); return { vaults: V.vaults.length, bosses: V.bosses.length, keys: L.items.filter(i => i.k === 'key').length, vaultItems: L.items.filter(i => i.set.kind === 'vault').map(i => i.k + (i.tier !== undefined ? i.tier : '')).join(',') }; });
  // outside a vault, picture
  const v0 = await p.evaluate(() => { const A = window.__A, v = A.BRB_GET().vaults[0], D = v.door; A.P.x = D.cx + D.nx * 6; A.P.z = D.cz + D.nz * 6; A.P.y = v.y; A.P.yaw = Math.atan2(D.nx, D.nz); A.P.pitch = 0; A.G.health = A.G.maxHp = 100; for (const e of A.enemies) if (e.entry) { e.acc = 0; e.dmg = 0; } return { side: v.side }; });
  await p.evaluate(() => { window.__A.G.noRender = false; }); await p.waitForTimeout(1300); await p.screenshot({ path: SH + '/brbots_vault.png' }); await p.evaluate(() => { window.__A.G.noRender = true; });
  // locked without a key; open with one
  r.locked = await p.evaluate(async () => { const A = window.__A, v = A.BRB_GET().vaults[0], D = v.door; A.P.x = D.cx + D.nx * 1.2; A.P.z = D.cz + D.nz * 1.2; A.keys.KeyE = true; await new Promise(r => setTimeout(r, 2000)); A.keys.KeyE = false; return v.open; });
  r.opened = await p.evaluate(async () => { const A = window.__A, v = A.BRB_GET().vaults[0]; A.BRL_GET().keys = 1; A.keys.KeyE = true; await new Promise(r => setTimeout(r, 2600)); A.keys.KeyE = false; return { open: v.open, keysLeft: A.BRL_GET().keys, boss: A.BRB_GET().bosses[0].awake }; });
  // the boss shoots
  const h0 = await p.evaluate(() => { const A = window.__A; A.G.health = 100; A.G.spawnProt = 0; return A.G.health; }); await p.waitForTimeout(5000);
  r.bossHurt = await p.evaluate(h0 => Math.round(h0 - window.__A.G.health), h0);
  await p.evaluate(() => { const A = window.__A, v = A.BRB_GET().vaults[0], D = v.door; A.G.health = 100; A.P.x = D.cx - D.nx * 1.0; A.P.z = D.cz - D.nz * 1.0; A.P.yaw = Math.atan2(D.nx, D.nz) + Math.PI; A.P.pitch = -0.2; const b = A.BRB_GET().bosses[0]; b.armor = 0; b.spawnProt = 0; A.damageEnemy(b, 9999, true, null, false, 'player'); });
  await p.waitForTimeout(800); r.bossDead = await p.evaluate(() => !window.__A.enemies.includes(window.__A.BRB_GET().bosses[0]));
  await p.evaluate(() => { window.__A.G.noRender = false; window.__A.G.health = 100; }); await p.waitForTimeout(1300); await p.screenshot({ path: SH + '/brbots_inside.png' }); await p.evaluate(() => { window.__A.G.noRender = true; });
  // bots take floor guns over time; hide in the last circles
  await p.evaluate(() => { const A = window.__A; A.P.y += 0; for (const e of A.enemies) if (e.entry) e.spawnProt = 99; });
  await p.waitForTimeout(25000);
  r.botLoot = await p.evaluate(() => { const A = window.__A, L = A.BRL_GET(); return { taken: L.out.length, tiers: A.enemies.filter(e => e.entry).map(e => e.brTier === undefined ? 'u' : e.brTier).join('') }; });
  r.pack = await p.evaluate(() => { const a = window.__A.brPack(); return a[a.length - 1]; });
  return r;
};
