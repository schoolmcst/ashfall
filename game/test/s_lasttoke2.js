// LAST TOKE deeper: plates (put on, absorb damage), cash, buy station, contracts (bounty, scavenger), storm, supply drop; pictures
const path = require('path');
module.exports = async p => {
  const out = process.env.SHOTS || '/tmp', r = {};
  await p.evaluate(() => { for (const o of document.querySelectorAll('.onb-ov,#hcSplash')) o.remove(); window.__A.startMatch('br', { map: 'random', squad: 2 }); });
  await p.waitForTimeout(5000); await p.evaluate(() => { const A = window.__A; A.G.holdT = 0.01; A.G.loadT = 0; }); await p.waitForTimeout(2500);
  r.setup = await p.evaluate(() => { const A = window.__A; return { stations: A.LT.stations.length, tablets: A.LT.tablets.length, plates: A.LT.plates, cash: A.LT.cash, hud: document.getElementById('ltHud').innerText }; });
  // plate up, then take a hit
  r.plate = await p.evaluate(() => { const A = window.__A; A.G.spawnProt = 0; A.keys.Digit4 = true; A.ltTick(0.016); A.keys.Digit4 = false; A.ltTick(0.016); for (let i = 0; i < 70; i++) A.ltTick(0.016); const armor = A.G.armor; A.G.health = 100; A.hurtPlayer(30, 0, 0); const o = { armor, armorAfterHit: A.G.armor, health: Math.round(A.G.health), plates: A.LT.plates }; A.G.health = A.G.maxHp = 1e9; return o; });
  // a crate: plates and cash
  r.crate = await p.evaluate(() => { const A = window.__A, c = A.BR_API.BR.crates.find(c => !c.open); const p0 = A.LT.plates, c0 = A.LT.cash; A.BR_API.brOpen(c, 'player'); return { plates: A.LT.plates - p0, cash: A.LT.cash - c0 }; });
  // a kill pays
  r.kill = await p.evaluate(() => { const A = window.__A, e = A.enemies.find(x => x.team !== A.M.myTeam); e.spawnProt = 0; e.armor = 0; const c0 = A.LT.cash; A.damageEnemy(e, 9999, false, null, false, 'player'); A.sqUpdate(30); A.damageEnemy(e, 9999, false, null, false, 'player'); A.ltTick(0.016); return A.LT.cash - c0; });
  // the buy station: stand at one, USE, buy a plate and a UAV
  await p.evaluate(() => { const A = window.__A, s = A.LT.stations[0]; A.LT.cash = 5000; A.P.x = s.x + 1; A.P.z = s.z; A.P.yaw = Math.PI / 2; A.keys.KeyE = true; A.ltTick(0.016); A.keys.KeyE = false; A.ltTick(0.016); });
  await p.waitForTimeout(500); r.buyOpen = await p.evaluate(() => !!document.getElementById('ltBuy'));
  await p.screenshot({ path: path.join(out, 'lt_buy.png'), timeout: 120000 });
  await p.keyboard.press('Digit1'); await p.keyboard.press('Digit4'); await p.waitForTimeout(300);
  r.bought = await p.evaluate(() => { const A = window.__A; return { alive: A.G.state, cash: A.LT.cash, plates: A.LT.plates, uav: Math.round(A.STK.uavT) }; });
  await p.keyboard.press('Escape'); await p.waitForTimeout(300); r.buyClosed = await p.evaluate(() => !document.getElementById('ltBuy'));
  // contracts
  r.bounty = await p.evaluate(() => { const A = window.__A; let tb = A.LT.tablets.find(t => !t.used); const R0 = Math.random; Math.random = () => 0.1; A.ltTakeContract(tb); Math.random = R0; const C = A.LT.contract; const k = C && C.k; if (C && C.k === 'bounty') { C.e.spawnProt = 0; C.e.armor = 0; A.damageEnemy(C.e, 9999, false, null, false, 'player'); A.sqUpdate(30); A.damageEnemy(C.e, 9999, false, null, false, 'player'); } const c0 = A.LT.cash; A.ltTick(0.016); return { k, done: !A.LT.contract, paid: A.LT.cash - c0 }; });
  r.scav = await p.evaluate(() => { const A = window.__A; const R0 = Math.random; Math.random = () => 0.9; const tb = A.LT.tablets.find(t => !t.used); A.ltTakeContract(tb); Math.random = R0; const C = A.LT.contract; if (!C || C.k !== 'scav') return { k: C && C.k }; const c0 = A.LT.cash; for (const c of C.caches) { A.P.x = c.x; A.P.z = c.z; A.ltTick(0.016); } return { k: 'scav', done: !A.LT.contract, paid: A.LT.cash - c0, gun: A.W[0].def.cat }; });
  // the storm and a supply drop
  r.storm = await p.evaluate(() => { const A = window.__A; const f0 = A.scene.fog.density; A.ltStorm(true); for (let i = 0; i < 60; i++) A.ltTick(0.05); return { on: !!A.LT.storm, fogUp: +(A.scene.fog.density / f0).toFixed(1) }; });
  await p.evaluate(() => { const A = window.__A; A.P.pitch = 0.05; }); await p.waitForTimeout(1200); await p.screenshot({ path: path.join(out, 'lt_storm.png'), timeout: 120000 });
  r.drop = await p.evaluate(() => { const A = window.__A, B = A.BR_API.BR; const n0 = B.crates.length; A.ltDrop(); const c = B.crates[B.crates.length - 1]; const y0 = c.g.position.y; for (let i = 0; i < 200; i++) A.ltTick(0.05); return { added: B.crates.length - n0, tier: c.tier, startY: y0, landedY: c.g.position.y, marker: A.markerList().some(m => m.t === 'SUPPLY DROP') }; });
  r.ranked = await p.evaluate(() => !!(window.__A.MODES.rbr && window.__A.MODES.rbr.ranked));
  return r;
};
