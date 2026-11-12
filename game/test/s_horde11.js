// HOTBOX HORDE batch F (45-52): the track, trophies, collection book, prestige, seasons
module.exports = async p => { const r = {}; try { await run(p, r); } catch (e) { r.FAIL = String(e).slice(0, 400); } return r; };
const run = async (p, r) => {
  const SH = process.env.SHOTS || '/tmp', ev = (f, a) => p.evaluate(f, a);
  const shot = async (n, ms) => { await ev(() => { window.__A.G.noRender = false; }); await p.waitForTimeout(ms || 1800); await p.screenshot({ path: SH + '/hh11_' + n + '.png' }); await ev(() => { window.__A.G.noRender = true; }); };
  const boot = async () => { await p.waitForTimeout(9000); await ev(() => { const A = window.__A; A.G.holdT = 0.01; A.G.loadT = 0; for (const e of A.enemies) if (e.entry) { e.acc = 0; e.dmg = 0; } }); await p.waitForTimeout(1500); await ev(() => { const A = window.__A; if (A.G.state === 'paused') { A.G.state = 'playing'; A.showScreen(null); } A.G.health = A.G.maxHp = 1e9; }); };
  await ev(() => { for (const o of document.querySelectorAll('.onb-ov,#hcSplash,.app-notes')) o.remove(); try { localStorage.removeItem('ashfall.hh.v1'); } catch (e) {} const A = window.__A; A.HHS_GET().force = 'winter'; const s = A.hhL.load(); s.tutSeen = 1; s.tutDone = 1; s.cash = 30000; s.mis = 7; s.diff = 3; s.unl = { 7: 3 }; A.hhL.save(s); A.showScreen('menu'); A.hhOpenL(); for (const o of document.querySelectorAll('.onb-ov')) o.remove(); });
  r.lobby = await ev(() => [...document.querySelectorAll('.hhp-row b, .hhp-ev b')].map(b => b.textContent));
  await p.waitForTimeout(300); await p.screenshot({ path: SH + '/hh11_lobby.png' });
  // a winter mission on COOKED: frost burnouts, snow, the track, trophies, event seeds, the book
  await ev(() => { window.__A.G.noRender = true; window.__A.actions('hh-start'); }); await boot();
  r.winter = await ev(() => { const A = window.__A, H = A.HHM_GET(), e = A.hhMobL('smasher', A.P.x + 6, A.P.z - 4, A.P.y); return { snow: !!(A.HHS_GET().fx && A.HHS_GET().fx.parent), season: e.season, di: H.di }; });
  await ev(() => { const A = window.__A; A.P.pitch = 0.05; }); await shot('winter', 2500);
  r.end = await ev(() => { const A = window.__A, H = A.HHM_GET(); const tx0 = H.s.tx | 0; for (const e of H.mobs.slice()) A.damageEnemy(e, 1e6, false, null, false, 'player'); A.hhEndL(true); const s = A.hhL.load(); return { tx: (s.tx | 0) - tx0, frost: s.seeds.frost | 0, book: s.col && Object.keys(s.col.mob), cnt: { hhw: A.PROG.cnt.hhw, hhcook: A.PROG.cnt.hhcook }, achs: Object.keys(A.PROG.ach).filter(k => k.startsWith('hh')) }; });
  await p.waitForTimeout(1500);
  // the track: enough XP for 3 tiers, claim
  r.track = await ev(() => { const A = window.__A; A.leaveGame(); const s = A.hhL.load(); A.hhpXPL(s, 3200); const c0 = s.cash; const got = A.hhpClaimL(s); A.hhL.save(s); return { tier: Math.floor(s.tx / 1000), got, cash: s.cash - c0, claimed: s.tclaim }; });
  await ev(() => { window.__A.hhOpenL(); window.__A.actions('hhp-track'); }); await p.waitForTimeout(500); await p.screenshot({ path: SH + '/hh11_track.png' });
  await ev(() => { document.getElementById('hhpTr').remove(); window.__A.actions('hhp-book'); }); await p.waitForTimeout(500); await p.screenshot({ path: SH + '/hh11_book.png' });
  r.book = await ev(() => document.getElementById('hhpBook').innerText.split('\n').filter(l => / \/ /.test(l)));
  await ev(() => document.getElementById('hhpBook').remove());
  // prestige: refuses below level 5; then works
  r.pres = await ev(() => { const A = window.__A; const no = A.hhpPrestigeL(); const s = A.hhL.load(); s.base.lv = 5; s.base.pieces = [{ id: 'wall', ix: 2, iz: 1, lv: 0, dir: 0, mat: 'stone' }, { id: 'wall', ix: 9, iz: 1, lv: 0, dir: 0, mat: 'stone' }]; const st0 = s.inv.stone, c0 = s.cash; A.hhL.save(s); const err = A.hhpPrestigeL(); const s2 = A.hhL.load(); return { no, err, lv: s2.base.lv, hpres: s2.hpres, pieces: s2.base.pieces.length, stoneBack: s2.inv.stone - st0, cashHalf: s2.cash === Math.round(c0 * 0.5), ach: !!A.PROG.ach.hhpres }; });
  // leaderboard columns
  await ev(() => { const A = window.__A; A.FRIENDS_ARR.push({ n: 'DANK DAVE', c: 'XXXXXX', on: true, s: [1, 1, 1, 1, 1, 1], hz: [52000, 2, 9, 14, 3100, 7, 2] }); A.lbL('horde'); }); await p.waitForTimeout(400);
  r.lb = await ev(() => document.getElementById('lbBody').innerText.split('\n').slice(0, 3));
  await p.screenshot({ path: SH + '/hh11_lb.png' });
  // summer: the festival strain sells for 50% more
  r.summer = await ev(() => { const A = window.__A; A.HHS_GET().force = 'summer'; return A.hhpSeasonL(); });
};
