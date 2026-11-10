// LAST TOKE SQUADS 2.0: stash cards + re-up beacons, callouts, carrying, the bong revive, squad spectate
module.exports = async p => {
  const r = {}, SH = process.env.SHOTS || '/tmp';
  await p.evaluate(() => { for (const o of document.querySelectorAll('.onb-ov,#hcSplash')) o.remove(); const A = window.__A; A.G.noRender = true; A.startMatch('br', { map: 'stashisle', squad: 4 }); });
  await p.waitForTimeout(12000); await p.evaluate(() => { const A = window.__A; A.G.holdT = 0.01; A.G.loadT = 0; }); await p.waitForTimeout(1500);
  await p.evaluate(() => { const A = window.__A; A.G.health = A.G.maxHp = 1e9; for (const e of A.enemies) if (e.team !== A.M.myTeam) { e.acc = 0; e.dmg = 0; } });
  const mates = () => p.evaluate(() => window.__A.enemies.filter(e => e.team === window.__A.M.myTeam && e.entry).map(e => e.entry.name));
  r.beacons = await p.evaluate(() => window.__A.BRSQ_GET().beacons.length);
  // a squad bot dies (twice: down, then the bleed-out kill) -> a card
  const name = await p.evaluate(() => { const A = window.__A, e = A.enemies.find(e => e.team === A.M.myTeam && e.entry); e.spawnProt = 0; e.sqFinal = true; A.damageEnemy(e, 999, false, null, false, 'world'); return e.entry.name; });
  await p.waitForTimeout(800);
  r.card = await p.evaluate(() => { const C = window.__A.BRSQ_GET().cards; return C.map(c => c.en.name + ':' + (c.by ? (c.by === 'player' ? 'me' : 'bot') : 'ground')); });
  // I take it to the nearest beacon
  r.reup = await p.evaluate(async () => { const A = window.__A, B = A.BRSQ_GET(), c = B.cards[0]; if (!c) return 'no card'; c.by = 'player'; const b = B.beacons.slice().sort((a, b2) => Math.hypot(a.x - A.P.x, a.z - A.P.z) - Math.hypot(b2.x - A.P.x, b2.z - A.P.z))[0]; A.P.x = b.x + 1; A.P.z = b.z; A.P.y = b.y; A.keys.KeyE = true; await new Promise(r => setTimeout(r, 4500)); A.keys.KeyE = false; return { cards: B.cards.length, back: A.enemies.filter(e => e.team === A.M.myTeam && e.entry && e.brFloat && !e.brFloat.wait).map(e => e.entry.name) }; });
  // a callout: NEED AMMO -> a bot brings ammo
  const a0 = await p.evaluate(() => { const A = window.__A, w = A.W[A.G.cur]; const b = A.enemies.find(e => e.team === A.M.myTeam && e.entry && !e.brFloat); if (b) { A.P.x = b.group.position.x + 3; A.P.z = b.group.position.z; A.P.y = b.group.position.y; } return A.BRL_GET().ammo.light; });
  await p.evaluate(() => window.__A.brsqCallL(0)); await p.waitForTimeout(9000);
  r.ammoCall = [a0, await p.evaluate(() => window.__A.BRL_GET().ammo.light)];
  // the wheel shows the squad row
  r.wheel = await p.evaluate(() => { const A = window.__A; A.emoteWheelL(); const w = document.getElementById('emoteWheel'); const n = w ? w.querySelectorAll('[data-co]').length : -1; if (w) w.remove(); return n; });
  // carry a downed squadmate
  r.carry = await p.evaluate(async () => { const A = window.__A, e = A.enemies.find(e => e.team === A.M.myTeam && e.entry && !e.brFloat && !e.downed); if (!e) return 'none'; e.spawnProt = 0; A.damageEnemy(e, 999, false, null, false, 'world'); if (!e.downed) return 'not downed';
    A.P.x = e.group.position.x + 1; A.P.z = e.group.position.z; A.P.y = e.group.position.y; A.keys.KeyV = true; await new Promise(r => setTimeout(r, 200)); A.keys.KeyV = false; await new Promise(r => setTimeout(r, 400));
    const on = A.BRSQ_GET().carry === e; A.P.x += 6; await new Promise(r => setTimeout(r, 600)); const moved = Math.round(Math.hypot(e.group.position.x - A.P.x, e.group.position.z - A.P.z) * 10) / 10;
    A.keys.KeyE = true; await new Promise(r => setTimeout(r, 3400)); A.keys.KeyE = false; return { on, follows: moved, revived: !e.downed }; });
  // squad spectate: I die -> I watch a squadmate
  await p.evaluate(() => { const A = window.__A; A.G.health = 1; A.G.maxHp = 100; A.G.spawnProt = 0; A.G.downed = false; for (const e of A.enemies) if (e.team === A.M.myTeam) e.group.position.x += 0; });
  await p.evaluate(() => { const A = window.__A; A.G.downed = true; A.G.bleed = 0.01; }); await p.waitForTimeout(6000);
  r.spec = await p.evaluate(() => ({ st: window.__A.G.state, center: (document.getElementById('center') || {}).textContent, card: window.__A.BRSQ_GET().cards.some(c => c.en.isPlayer) }));
  await p.evaluate(() => { window.__A.G.noRender = false; }); await p.waitForTimeout(1200); await p.screenshot({ path: SH + '/brsquad_spec.png' });
  return r;
};
