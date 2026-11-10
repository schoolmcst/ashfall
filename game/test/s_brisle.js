// LAST TOKE ISLAND LIFE: death boxes, hold to swap, grow tents, plywood sheds, night, wind, tunnels, the train, swimming
module.exports = async p => {
  const r = {}, SH = process.env.SHOTS || '/tmp', shot = async n => { await p.evaluate(() => { window.__A.G.noRender = false; }); await p.waitForTimeout(1300); await p.screenshot({ path: SH + '/brisle_' + n + '.png' }); await p.evaluate(() => { window.__A.G.noRender = true; }); };
  await p.evaluate(() => { for (const o of document.querySelectorAll('.onb-ov,#hcSplash')) o.remove(); const A = window.__A; A.G.noRender = true; A.startMatch('br', { map: 'stashisle' }); });
  await p.waitForTimeout(12000); await p.evaluate(() => { const A = window.__A; A.G.holdT = 0.01; A.G.loadT = 0; }); await p.waitForTimeout(1500);
  await p.evaluate(() => { const A = window.__A; A.G.health = A.G.maxHp = 1e6; for (const e of A.enemies) if (e.entry) { e.acc = 0; e.dmg = 0; } });
  r.setup = await p.evaluate(() => { const I = window.__A.BRI_GET(); return { tents: I.tents.length, sheds: I.sheds.length, tun: I.tun.length, train: !!I.train, trainLoot: window.__A.BRL_GET().items.filter(i => i.set.kind === 'train').length, wind: I.wind.map(v => +v.toFixed(1)) }; });
  // a bot dies -> a stash box; open it, take the gun
  r.box = await p.evaluate(async () => { const A = window.__A, e = A.enemies.find(e => e.entry && !e.brFloat); e.gunId = Object.keys(A.ARM).find(k => A.ARM[k].cat === 'ar'); e.brTier = 2; await new Promise(r => setTimeout(r, 500)); e.spawnProt = 0; const g = e.group.position.clone(); A.damageEnemy(e, 9999, false, null, false, 'player'); await new Promise(r => setTimeout(r, 800));
    const I = A.BRI_GET(), b = I.boxes[I.boxes.length - 1]; if (!b) return 'no box'; A.P.x = b.x + 1; A.P.z = b.z; A.P.y = b.y; await new Promise(r => setTimeout(r, 500)); A.keys.KeyE = true; await new Promise(r => setTimeout(r, 400)); A.keys.KeyE = false; await new Promise(r => setTimeout(r, 300));
    const open = !!document.getElementById('brBox'), items = b.items.map(i => i.k).join(','); const btn = document.querySelector('#brBox [data-bx="0"]'); if (btn) btn.click(); const w = A.W[0].def.id; document.querySelector('#brBox [data-close]') && document.querySelector('#brBox [data-close]').click(); return { open, items, gun: w, left: b.items.length }; });
  // tents: harvest a plant
  r.tent = await p.evaluate(async () => { const A = window.__A, t = A.BRI_GET().tents[0], pl = t.plants[0], w = pl.p.getWorldPosition(new THREE.Vector3()); A.P.x = w.x + 0.6; A.P.z = w.z; A.P.y = t.y; const c0 = A.LT.cash; await new Promise(r => setTimeout(r, 400)); A.keys.KeyE = true; await new Promise(r => setTimeout(r, 2400)); A.keys.KeyE = false; return { cash: A.LT.cash - c0, ripe: pl.ripe }; });
  await p.evaluate(() => { const A = window.__A, t = A.BRI_GET().tents[0]; A.P.x = t.x - 6; A.P.z = t.z + 0.5; A.P.y = t.y; A.P.yaw = -Math.PI / 2; A.P.pitch = -0.1; }); await shot('tent');
  // the tunnels: down a hatch ladder, walk, up another
  r.tunnel = await p.evaluate(async () => { const A = window.__A, L = A.BRFG_GET().ladders.filter(l => l.tunnel); if (!L.length) return 'no ladders'; const a = L[0]; A.P.x = a.wx - a.nx * 0.85; A.P.z = a.wz - a.nz * 0.85; A.P.y = a.y1; A.P.yaw = Math.atan2(-a.nx, -a.nz); await new Promise(r => setTimeout(r, 400)); A.keys.KeyC = true; await new Promise(r => setTimeout(r, Math.min(9000, (a.y1 - a.y0) / 3.2 * 1000 + 1500))); A.keys.KeyC = false; await new Promise(r => setTimeout(r, 1200)); return { y: +A.P.y.toFixed(1), floor: a.y0, th: +A.TH(A.P.x, A.P.z).toFixed(1) }; });
  await p.evaluate(() => { const A = window.__A; A.P.yaw = Math.PI; A.P.pitch = 0; A.P.z += 2; }); await shot('tunnel');
  // the train: stand on the last car
  r.train = await p.evaluate(async () => { const A = window.__A, T = A.BRI_GET().train, c = T.cars[2]; A.P.x = c.x; A.P.z = 134; A.P.y = c.y + c.top + 0.3; A.P.vy = 0; await new Promise(r => setTimeout(r, 6000)); return { onIt: Math.abs(A.P.y - (c.y + c.top)) < 0.3, carX: +c.x.toFixed(1), meX: +A.P.x.toFixed(1) }; });
  await p.evaluate(() => { const A = window.__A, T = A.BRI_GET().train; A.P.x = T.x + 9; A.P.z = 126; A.P.y = A.TH(A.P.x, 126); A.P.yaw = Math.atan2(9, -8); A.P.pitch = -0.08; }); await shot('train');
  // swimming
  r.swim = await p.evaluate(async () => { const A = window.__A; A.P.x = 0; A.P.z = -194.5; A.P.y = 2; await new Promise(r => setTimeout(r, 2500)); return { y: +A.P.y.toFixed(2), th: +A.TH(0, -194.5).toFixed(1), swim: A.BRI_GET().swim }; });
  // night: jump to the 4th circle
  await p.evaluate(() => { const A = window.__A; A.M.br.phase = 4; A.M.br.closing = true; A.BRI_GET().envT = 0; const t = A.BRI_GET().tents[0]; A.P.x = t.x - 14; A.P.z = t.z; A.P.y = A.TH(A.P.x, A.P.z); A.P.yaw = -Math.PI / 2; }); await p.waitForTimeout(1500); r.night = await p.evaluate(() => +window.__A.BRI_GET().nightK.toFixed(2)); await shot('night');
  // a shed: shoot it to pieces
  r.shed = await p.evaluate(() => { const A = window.__A, o = A.BRI_GET().sheds[0]; return { kind: o.kind, hp: o.hp }; });
  return r;
};
