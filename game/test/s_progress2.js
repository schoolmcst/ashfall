// TROPHIES: achievements, style, emotes, podium, prestige shop, heatmaps, crew wars, season 3
module.exports = async p => {
  const r = {};
  r.base = await p.evaluate(() => { const A = window.__A; return { ach: A.ACH.length, banners: A.ACH.every(a => A.COS['ach_' + a.id]), noBox: !A.BOX_POOL.some(c => c.ach), s3: A.BP3_ITEMS.length, s3prem: A.BP3_ITEMS.filter(x => x[1] === 100).length, seasons: A.SEASONS.map(s => s.name) }; });
  r.counts = await p.evaluate(() => { const A = window.__A; A.PROG.ach = {}; A.PROG.cnt = {}; A.achAdd('kills'); A.achAdd('pings', 100); return { first: !!A.PROG.ach.first, ping: !!A.PROG.ach.ping100, owned: !!A.PROG.owned.ach_first, toast: !!document.getElementById('achToast') }; });
  // in a match
  await p.evaluate(() => { for (const o of document.querySelectorAll('.onb-ov,#hcSplash')) o.remove(); try { window.__A.leaveGame(); } catch (e) {} window.__A.G.noRender = true; window.__A.startMatch('tdm', { map: 'random' }); });
  await p.waitForTimeout(5000); await p.evaluate(() => { const A = window.__A; A.G.holdT = 0.01; A.G.loadT = 0; }); await p.waitForTimeout(2500);
  r.kill = await p.evaluate(() => { const A = window.__A, k0 = A.achCnt().kills | 0, e = A.enemies.find(x => x.entry && !A.isFriend(x)); e.spawnProt = 0; A.G.killSrc = ''; A.damageEnemy(e, 999, true, null, false, 'player'); const c = A.achCnt(); return { kills: (c.kills | 0) - k0, heads: c.heads | 0, heat: Object.values(A.PROG.heat || {}).reduce((t, h) => t + h.k.length, 0) }; });
  r.tracer = await p.evaluate(() => { const A = window.__A; A.PROG.trc = 'green'; A.PROG.xp = 1e9; const t = A.tracers[0]; t.on = true; t.life = 1; A.trcPaint(); const col = t.m.material.color.getHex(); t.on = false; return col.toString(16); });
  r.emote = await p.evaluate(() => { const A = window.__A; A.G.state = 'playing'; A.emoteWheel(); const w = !!document.getElementById('emoteWheel'); document.querySelector('#emoteWheel [data-em="2"]').click(); return { wheel: w, pack: A.emotePack(), saved: A.PROG.emote }; });
  r.podium = await p.evaluate(() => { const h = window.__A.podiumHtml(); return { ok: h.includes('podium'), n: (h.match(/class="pod pod/g) || []).length }; });
  r.end = await p.evaluate(() => { const A = window.__A, m0 = A.achCnt().matches | 0; A.endMatch(A.M.myTeam); return { matches: (A.achCnt().matches | 0) - m0, podiumShown: !!document.querySelector('#resBoard .podium') }; });
  await p.waitForTimeout(800);
  r.shop = await p.evaluate(() => { const A = window.__A; A.PROG.pres = 1; A.PROG.ptokSpent = 0; const t0 = A.ptokens(), it = A.pshopItems()[0]; const ok = it ? A.pshopBuy(it.id) : 'none'; return { t0, ok, t1: A.ptokens(), items: A.pshopItems().length }; });
  r.screen = await p.evaluate(() => { const A = window.__A; try { A.leaveGame(); } catch (e) {} const out = {}; for (const t of ['ach', 'style', 'shop', 'heat']) { A.openTrophies(t); out[t] = document.querySelector('#trophies .p2-body').innerHTML.length; } return out; });
  await p.screenshot({ path: (process.env.SHOTS || '/tmp') + '/trophies_heat.png' });
  await p.evaluate(() => window.__A.openTrophies('ach')); await p.waitForTimeout(300); await p.screenshot({ path: (process.env.SHOTS || '/tmp') + '/trophies_ach.png' });
  await p.evaluate(() => window.__A.openTrophies('style')); await p.waitForTimeout(300); await p.screenshot({ path: (process.env.SHOTS || '/tmp') + '/trophies_style.png' });
  r.crew = await p.evaluate(() => { const A = window.__A; A.PROG.crew = { id: 'X-1', name: 'TEST CREW', tag: 'TST', own: 1 }; const s = A.cwStandings(); return { n: s.length, mine: s.some(x => x.mine), html: A.cwHtml().length }; });
  return r;
};
