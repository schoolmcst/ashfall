// LAST TOKE lobby, stats, placement XP, dailies, loadout drop, kill leader, victory dance
module.exports = async p => {
  const r = {}, SH = process.env.SHOTS || '/tmp';
  await p.evaluate(() => { for (const o of document.querySelectorAll('.onb-ov,#hcSplash')) o.remove(); try { localStorage.removeItem('ashfall.lt.v1'); } catch (e) {} });
  // the lobby
  r.lobby = await p.evaluate(() => { const A = window.__A; A.showScreen('menu'); A.actions('br-play'); return { scr: A.curScreen, kind: document.getElementById('lobKind').textContent, rows: [...document.querySelectorAll('#lobSel .cod-row small')].map(s => s.textContent) }; });
  await p.waitForTimeout(500); await p.screenshot({ path: SH + '/brprog_lobby.png' });
  r.mpNoBr = await p.evaluate(() => { const A = window.__A; A.actions('go-mp'); A.toLobby && A.toLobby(); return { on: A.BRLOB_GET().on }; });
  // play offline from the lobby
  await p.evaluate(() => { const A = window.__A; A.actions('br-play'); A.G.noRender = true; A.actions('bl-start'); });
  await p.waitForTimeout(12000); await p.evaluate(() => { const A = window.__A; A.G.holdT = 0.01; A.G.loadT = 0; }); await p.waitForTimeout(1500);
  r.started = await p.evaluate(() => ({ br: !!window.__A.M.br, map: window.__A.curMap, daily: window.__A.brpLoadL().daily.list.map(c => c.n) }));
  // a loadout drop
  r.drop = await p.evaluate(async () => { const A = window.__A; A.G.health = A.G.maxHp = 1e6; for (const e of A.enemies) if (e.entry) { e.acc = 0; e.dmg = 0; } A.brpDropBuyL(); await new Promise(r => setTimeout(r, 6000)); const D = A.BRP_GET().drop; if (!D) return 'none'; A.P.x = D.x + 0.8; A.P.z = D.z; A.P.y = D.y; await new Promise(r => setTimeout(r, 500)); A.keys.KeyE = true; await new Promise(r => setTimeout(r, 400)); A.keys.KeyE = false; await new Promise(r => setTimeout(r, 300)); return { landed: D.landed, gun: A.W.map(w => w.def.id).join('+'), taken: !A.BRP_GET().drop }; });
  // kill leader: a bot with 4 kills
  r.kl = await p.evaluate(async () => { const A = window.__A, e = A.enemies.find(e => e.entry && e.entry.alive !== false); e.entry.kills = 4; await new Promise(r => setTimeout(r, 1600)); const k = A.BRP_GET().kl; return k ? k.name : null; });
  // the win: everyone else out -> the dance -> results
  await p.evaluate(() => { const A = window.__A; for (const e of A.enemies.slice()) if (e.entry) { e.spawnProt = 0; e.sqFinal = true; A.damageEnemy(e, 99999, false, null, false, 'player'); } });
  await p.waitForTimeout(1500); r.dance = await p.evaluate(() => !!window.__A.BRP_GET().dance);
  await p.evaluate(() => { window.__A.G.noRender = false; }); await p.waitForTimeout(1500); await p.screenshot({ path: SH + '/brprog_dance.png' }); await p.evaluate(() => { window.__A.G.noRender = true; });
  await p.waitForTimeout(8000);
  r.after = await p.evaluate(() => { const A = window.__A, s = A.brpLoadL(); return { state: A.G.state, over: A.M.over, stats: { m: s.m, w: s.w, streak: s.streak, t5: s.t5 }, xp: (A.brpXpRowsL() || []).map(r => r.join(':')) }; });
  await p.screenshot({ path: SH + '/brprog_results.png' });
  return r;
};
