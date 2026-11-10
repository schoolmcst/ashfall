// LAST TOKE FIGHTS: ladders, weed balloons, damage numbers, deployable cover, molotov, healing smoke, sniper glint
module.exports = async p => {
  const r = {}, SH = process.env.SHOTS || '/tmp';
  await p.evaluate(() => { for (const o of document.querySelectorAll('.onb-ov,#hcSplash')) o.remove(); const A = window.__A; A.G.noRender = true; A.startMatch('br', { map: 'stashisle' }); });
  await p.waitForTimeout(12000); await p.evaluate(() => { const A = window.__A; A.G.holdT = 0.01; A.G.loadT = 0; }); await p.waitForTimeout(1500);
  await p.evaluate(() => { const A = window.__A; A.G.health = A.G.maxHp = 1e6; for (const e of A.enemies) if (e.entry) { e.acc = 0; e.dmg = 0; } });
  r.setup = await p.evaluate(() => { const F = window.__A.BRFG_GET(); return { ladders: F.ladders.length, stands: F.stands.length }; });
  // a ladder: from the bottom, hold forward
  r.ladder = await p.evaluate(async () => { const A = window.__A, L = A.BRFG_GET().ladders[0]; A.P.x = L.x + L.nx * 0.3; A.P.z = L.z + L.nz * 0.3; A.P.y = L.y0; A.P.yaw = Math.atan2(L.nx, L.nz); A.P.pitch = 0.3; A.keys.KeyW = true; await new Promise(r => setTimeout(r, 400)); const mid = A.BRFG_GET().climb ? 'climbing' : 'no';
    await new Promise(r => setTimeout(r, Math.max(2000, (L.y1 - L.y0) / 3.2 * 1000 + 1500))); A.keys.KeyW = false; return { mid, y: +A.P.y.toFixed(1), top: L.y1, onRoof: Math.abs(A.P.y - L.y1) < 0.6 }; });
  await p.evaluate(() => { const A = window.__A, L = A.BRFG_GET().ladders[0]; A.P.x = L.x + L.nx * 4; A.P.z = L.z + L.nz * 4; A.P.y = A.TH(A.P.x, A.P.z) + 0.1; A.P.yaw = Math.atan2(L.nx, L.nz); A.P.pitch = 0.25; window.__A.G.noRender = false; }); await p.waitForTimeout(1300); await p.screenshot({ path: SH + '/brfight_ladder.png' }); await p.evaluate(() => { window.__A.G.noRender = true; });
  // a weed balloon
  r.balloon = await p.evaluate(async () => { const A = window.__A, s = A.BRFG_GET().stands[0]; A.P.x = s.x + 1; A.P.z = s.z; A.P.y = s.y; A.P.yaw = Math.atan2(1, 0); A.P.pitch = 0; await new Promise(r => setTimeout(r, 900)); A.keys.KeyE = true; await new Promise(r => setTimeout(r, 800)); A.keys.KeyE = false; let mx = 0; for (let i = 0; i < 40; i++) { await new Promise(r => setTimeout(r, 150)); mx = Math.max(mx, A.P.y - s.y); } return { up: Math.round(mx), float: A.BRF_GET().float, left: s.left }; });
  await p.evaluate(() => { const A = window.__A; A.BRF_GET().float = false; A.BRF_GET().lift = 0; const s = A.BRFG_GET().stands[1]; A.P.x = s.x + 3; A.P.z = s.z + 3; A.P.y = s.y; A.P.yaw = Math.atan2(3, 3); A.P.pitch = 0.2; A.G.noRender = false; }); await p.waitForTimeout(1300); await p.screenshot({ path: SH + '/brfight_balloons.png' }); await p.evaluate(() => { window.__A.G.noRender = true; });
  // damage numbers
  r.nums = await p.evaluate(() => { const A = window.__A, e = A.enemies.find(e => e.entry); e.spawnProt = 0; A.damageEnemy(e, 23, false, null, false, 'player'); A.damageEnemy(e, 41, true, null, false, 'player'); const b = document.getElementById('dmgNums'); return b ? [...b.children].map(c => c.textContent + (c.className ? '*' : '')).join(',') : 'none'; });
  // deployable cover
  r.cover = await p.evaluate(async () => { const A = window.__A; A.BRL_GET().covers = 1; await new Promise(r => setTimeout(r, 900)); A.keys.Digit6 = true; await new Promise(r => setTimeout(r, 800)); A.keys.Digit6 = false; return { left: A.BRL_GET().covers }; });
  // a molotov next to a bot, healing smoke on me
  r.fire = await p.evaluate(async () => { const A = window.__A, e = A.enemies.find(e => e.entry && !e.downed); e.spawnProt = 0; e.hp = e.maxHp = 100; const g = e.group.position; A.smkCloudL({ x: g.x, y: g.y, z: g.z }, 'molotov', true); await new Promise(r => setTimeout(r, 2500)); return Math.round(100 - (A.enemies.includes(e) ? e.hp : 0)); });
  r.heal = await p.evaluate(async () => { const A = window.__A; A.G.maxHp = 100; A.G.health = 40; A.smkCloudL({ x: A.P.x, y: A.P.y, z: A.P.z }, 'heal', true); await new Promise(r => setTimeout(r, 3000)); return Math.round(A.G.health); });
  // sniper glint
  r.glint = await p.evaluate(async () => { const A = window.__A, e = A.enemies.find(e => e.entry && !e.downed), sr = Object.keys(A.ARM).find(k => A.ARM[k].cat === 'sr'); A.botGunProfile ? 0 : 0; e.gunId = sr; e.group.position.set(A.P.x + 80, A.P.y, A.P.z); e.group.rotation.y = Math.atan2(-80, 0); e.tgt = 'P'; e.aim = 1; await new Promise(r => setTimeout(r, 300)); e.tgt = 'P'; e.aim = 1; e.group.rotation.y = Math.atan2(-80, 0); await new Promise(r => setTimeout(r, 50)); return A.BRFG_GET().glints.size; });
  // a molotov picture
  await p.evaluate(() => { const A = window.__A; A.G.health = 1e6; A.G.maxHp = 1e6; const x = A.P.x + 5, z = A.P.z; A.smkCloudL({ x, y: A.TH(x, z), z }, 'molotov', true); A.P.yaw = -Math.PI / 2; A.P.pitch = -0.2; A.G.noRender = false; }); await p.waitForTimeout(1300); await p.screenshot({ path: SH + '/brfight_fire.png' });
  return r;
};
