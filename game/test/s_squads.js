// LAST TOKE SQUADS: teams of 4, friends, downed instead of killed, revives (me -> bot, bot -> me), bleed out, squad wipe, the win
const path = require('path');
module.exports = async p => {
  const out = process.env.SHOTS || '/tmp', r = {};
  await p.evaluate(() => { for (const o of document.querySelectorAll('.onb-ov,#hcSplash')) o.remove(); window.__A.actions('br-play'); });   // the LAST TOKE lobby (1.2.93)
  await p.waitForTimeout(800); r.picker = await p.evaluate(() => { const A = window.__A, L = A.BRLOB_GET(); L.net = 'off'; L.sq = 1; const seen = []; for (let i = 0; i < 3; i++) { seen.push(L.sq); A.actions('bl-sq+'); } return seen.map(n => 's' + n).join(','); });
  await p.screenshot({ path: path.join(out, 'sq_picker.png'), timeout: 120000 });
  await p.evaluate(() => { const A = window.__A; A.BRLOB_GET().sq = 4; A.actions('bl-start'); });
  await p.waitForTimeout(5000); await p.evaluate(() => { const A = window.__A; A.G.holdT = 0.01; A.G.loadT = 0; A.G.noRender = true; });
  await p.waitForTimeout(3000);
  r.setup = await p.evaluate(() => { const A = window.__A, t = {}; for (const e of A.M.entries) t[e.team] = (t[e.team] || 0) + 1; const mates = A.enemies.filter(e => e.team === 0);
    return { squad: A.M.squad, teams: t, mates: mates.length, near: mates.map(e => Math.round(Math.hypot(e.group.position.x - A.P.x, e.group.position.z - A.P.z))), hud: (A.BR_API.BR ? 1 : 0) }; });
  r.down = await p.evaluate(() => { const A = window.__A; A.G.spawnProt = 0; const mate = A.enemies.find(e => e.team === 0); mate.spawnProt = 0; A.damageEnemy(mate, 999, false, null, false, 'world'); return { downed: !!mate.downed, alive: A.enemies.includes(mate), hp: mate.hp }; });
  // I revive it: stand next to it, hold USE
  r.revive = await p.evaluate(() => { const A = window.__A, mate = A.enemies.find(e => e.team === 0 && e.downed); A.P.x = mate.group.position.x + 0.8; A.P.z = mate.group.position.z; A.keys.KeyE = true; for (let i = 0; i < 10; i++) A.sqUpdate(0.4); A.keys.KeyE = false; return { downed: !!mate.downed, hp: mate.hp }; });
  // I go down; a squadmate standing next to me picks me up
  r.meDown = await p.evaluate(() => { const A = window.__A; A.G.spawnProt = 0; A.G.health = 100; A.G.maxHp = 100; A.hurtPlayer(500); const st = { downed: !!A.G.downed, state: A.G.state };
    const mate = A.enemies.find(e => e.team === 0 && !e.downed); mate.group.position.set(A.P.x + 1, 0, A.P.z); for (let i = 0; i < 12; i++) A.sqUpdate(0.4); st.after = !!A.G.downed; st.hp = Math.round(A.G.health); return st; });
  // a bot on another squad goes down and bleeds out
  r.bleed = await p.evaluate(() => { const A = window.__A, e = A.enemies.find(x => x.team === 2); e.spawnProt = 0; A.damageEnemy(e, 999, false, null, false, 'player'); const d0 = !!e.downed; for (let i = 0; i < 40; i++) A.sqUpdate(0.5); return { downed: d0, deadAfter: !A.enemies.includes(e) }; });
  // a whole squad (team 3) wiped
  r.wipe = await p.evaluate(() => { const A = window.__A; const t3 = A.enemies.filter(x => x.team === 3); for (const e of t3) { e.spawnProt = 0; A.damageEnemy(e, 999, false, null, false, 'player'); } A.sqUpdate(0.1); return { left: A.enemies.filter(x => x.team === 3).length, teams: [...A.sqTeamsLeft()].sort().join(',') }; });
  // everyone else goes: my squad wins
  r.win = await p.evaluate(() => { const A = window.__A; for (let k = 0; k < 4; k++) { for (const e of A.enemies.filter(x => x.team !== 0)) { e.spawnProt = 0; e.downed = false; A.damageEnemy(e, 9999, false, null, false, 'player'); } A.sqUpdate(0.1); } return { teams: [...A.sqTeamsLeft()].join(',') }; });
  await p.waitForTimeout(3000);
  r.over = await p.evaluate(() => ({ over: window.__A.M.over, result: window.__A.M.result, place: window.__A.BR_API.BR ? window.__A.BR_API.BR.place : 'cleared' }));
  // and a while of real play in DUOS without errors
  await p.evaluate(() => { const A = window.__A; A.leaveGame(); }); await p.waitForTimeout(1500);
  await p.evaluate(() => { window.__A.startMatch('br', { map: 'random', squad: 2 }); }); await p.waitForTimeout(5000);
  await p.evaluate(() => { const A = window.__A; A.G.holdT = 0.01; A.G.loadT = 0; A.G.health = A.G.maxHp = 1e9; }); await p.waitForTimeout(25000);
  r.duos = await p.evaluate(() => { const A = window.__A; return { squad: A.M.squad, t: +A.M.t.toFixed(1), teams: A.sqTeamsLeft().size, downed: A.enemies.filter(e => e.downed).length, mates: A.enemies.filter(e => e.team === 0).length }; });
  return r;
};
