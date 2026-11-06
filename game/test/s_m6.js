// ONE IN THE CHAMBER and HEADSHOTS ONLY offline
module.exports = async p => {
  const go = async m => { await p.evaluate(m => { for (const o of document.querySelectorAll('.onb-ov,#hcSplash')) o.remove(); try { window.__A.leaveGame(); } catch (e) {} window.__A.G.noRender = true; window.__A.startMatch(m, { map: 'random' }); }, m); await p.waitForTimeout(5000); await p.evaluate(() => { const A = window.__A; A.G.holdT = 0.01; A.G.loadT = 0; }); await p.waitForTimeout(2500); };
  const r = {};
  await go('oic');
  r.oic0 = await p.evaluate(() => { const A = window.__A, w = A.oicPistol(); return { mode: A.M.mode, cat: A.W[A.G.cur].def.cat, ammo: w.ammo, reserve: w.reserve, botAmmo: A.enemies.filter(e => e.entry).map(e => e.oicAmmo).join(''), hud: document.getElementById('mhud') ? document.getElementById('mhud').innerText.slice(0, 80) : '' }; });
  r.oicKill = await p.evaluate(() => { const A = window.__A, e = A.enemies.find(x => x.entry); e.spawnProt = 0; const hp = e.hp; A.damageEnemy(e, 10, false, null, false, 'player'); const dead = !A.enemies.includes(e); return { dead, hp }; });
  await p.waitForTimeout(800);
  r.oicAfter = await p.evaluate(() => ({ ammo: window.__A.oicPistol().ammo, kills: window.__A.G.kills }));
  // lose all three lives -> watching
  for (let i = 0; i < 3; i++) { await p.evaluate(() => { const A = window.__A; A.G.spawnProt = 0; if (A.G.state === 'playing') A.hurtPlayer(9999); }); await p.waitForTimeout(9000); await p.evaluate(() => { const A = window.__A; if (A.G.dc) A.G.dc.t = 99; }); }
  r.oicOut = await p.evaluate(() => ({ deaths: window.__A.M.me.deaths, st: window.__A.G.state }));
  // everyone else out of lives -> the match ends
  r.oicEnd = await p.evaluate(() => { const A = window.__A; A.M.me.deaths = 0; for (const en of A.M.entries) if (!en.isPlayer) en.deaths = 3; return null; });
  await p.waitForTimeout(2500); r.oicEnd = await p.evaluate(() => ({ over: window.__A.M.over, result: window.__A.M.result }));
  await go('hso');
  r.hso = await p.evaluate(() => { const A = window.__A, e = A.enemies.find(x => x.entry); e.spawnProt = 0; const hp0 = e.hp; A.damageEnemy(e, 60, false, null, false, 'player'); const body = e.hp; A.damageEnemy(e, 30, true, null, false, 'player'); return { hp0, afterBody: body, deadAfterHead: !A.enemies.includes(e) }; });
  r.hsoBoom = await p.evaluate(() => { const A = window.__A; A.G.spawnProt = 0; A.G.health = 100; A.hurtPlayer(80, 0, 0, true); return Math.round(A.G.health); });
  return r;
};
