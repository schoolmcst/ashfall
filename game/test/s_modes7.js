// KNIFE FIGHT, ESCORT THE PLUG, THE HEIST, GROW WARS offline
module.exports = async p => {
  const go = async (m) => { await p.evaluate(m => { for (const o of document.querySelectorAll('.onb-ov,#hcSplash')) o.remove(); try { window.__A.leaveGame(); } catch (e) {} window.__A.G.noRender = true; window.__A.startMatch(m, { map: 'dispensary' }); }, m); await p.waitForTimeout(5000); await p.evaluate(() => { const A = window.__A; A.G.holdT = 0.01; A.G.loadT = 0; A.G.health = A.G.maxHp = 1e9; }); await p.waitForTimeout(3000); };
  const r = {};
  await go('kf');
  r.kf = await p.evaluate(() => { const A = window.__A; const e = A.enemies.find(x => x.entry); return { equip: A.G.equip, knives: A.G.grenades, ammo: A.W.map(w => w.ammo).join(','), botHold: e.hold }; });
  r.kfStab = await p.evaluate(() => { const A = window.__A, e = A.enemies.find(x => x.entry), f = A.enemies.filter(x => x.entry)[1]; f.spawnProt = 0; const hp0 = f.hp; A.kfStabTest(e, f); return { dmg: hp0 - (A.enemies.includes(f) ? f.hp : -999) }; });
  await go('plug');
  r.plug = await p.evaluate(() => { const A = window.__A, X = A.M.plug, pe = A.plugEntity(); return { round: X.round, att: X.att, who: X.who, has: !!pe, isMe: A.plugIsMe(), hud: A.M ? document.getElementById('mhud').innerText.slice(0, 120) : '' }; });
  r.plugWin = await p.evaluate(() => { const A = window.__A, X = A.M.plug, pe = A.plugEntity(), ex = A.LAYOUT.flags[1 - X.att]; if (pe === 'player') { A.P.x = ex.x; A.P.z = ex.z; } else { pe.group.position.set(ex.x, 0, ex.z); } return null; });
  await p.waitForTimeout(2000);
  r.plugWin = await p.evaluate(() => { const A = window.__A, X = A.M.plug; return { state: X.state, score: A.M.teamScore.join('-') }; });
  await p.waitForTimeout(8000);
  r.plugNext = await p.evaluate(() => { const A = window.__A, X = A.M.plug; return { round: X.round, att: X.att, state: X.state }; });
  await go('heist');
  r.heist = await p.evaluate(() => { const A = window.__A, H = A.M.heist; return { bags: H.bags.length, att: H.att, vault: [Math.round(H.vault.x), Math.round(H.vault.z)], van: [Math.round(H.vanP.x), Math.round(H.vanP.z)] }; });
  r.heistRun = await p.evaluate(() => { const A = window.__A, H = A.M.heist; A.M.myTeam = H.att; const b = H.bags[0]; A.P.x = b.x; A.P.z = b.z; return null; });
  await p.waitForTimeout(1500);
  r.heistGot = await p.evaluate(() => { const A = window.__A, H = A.M.heist; const c = A.heistCarrying('player'); A.P.x = H.vanP.x; A.P.z = H.vanP.z; return c; });
  await p.waitForTimeout(1500);
  r.heistScore = await p.evaluate(() => { const A = window.__A, H = A.M.heist; return { delivered: H.bags.filter(b => b.st === 'done').length, score: A.M.teamScore.join('-') }; });
  await go('grow');
  r.grow = await p.evaluate(() => { const A = window.__A; const D = A.M.dom; return { spots: D.pts.length, names: D.pts.map(p => p.n).join('') }; });
  r.growPts = await p.evaluate(() => { const A = window.__A, D = A.M.dom; const p = D.pts[0]; p.own = 0; p.ownT = A.M.t; const a = A.growPts(0); p.ownT = A.M.t - 30; const b = A.growPts(0); p.ownT = A.M.t - 60; const c = A.growPts(0); return [a, b, c].join(','); });
  return r;
};
