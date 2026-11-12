// HOTBOX HORDE co-op extras: ready check, gifts, a base visit with a like, shared pings, kick
const { mpPages } = require('./mp_lib.js');
const SH = process.env.SHOTS || '/tmp';
(async () => {
  const { pages, errs, close, ev } = await mpPages(2, 39581), [A, B] = pages, log = {};
  for (const p of pages) await ev(p, () => { for (const o of document.querySelectorAll('.onb-ov')) o.remove(); const A = window.__A, s = A.hhL.load(); s.tutSeen = 1; s.cash = 20000; Object.assign(s.inv, { wood: 500, stone: 300, metal: 300, wire: 30 }); s.seeds.haze = 6; A.hhL.save(s); A.hhOpenL(); for (const o of document.querySelectorAll('.onb-ov')) o.remove(); });
  await ev(A, () => window.__A.hcJoinL('ZXCVB')); await A.waitForTimeout(4000);
  await ev(B, () => window.__A.hcJoinL('ZXCVB')); await A.waitForTimeout(7000);
  // ready check
  await ev(A, () => { window.__A.hhOpenL(); document.querySelector('[data-hcx="rc"]').click(); }); await A.waitForTimeout(3000);
  log.rcB = await ev(B, () => !!document.querySelector('[data-hcx="rd"]'));
  await ev(B, () => document.querySelector('[data-hcx="rd"]').click()); await A.waitForTimeout(3000);
  log.rcA = await ev(A, () => [...document.querySelectorAll('.hcx-p i')].map(i => i.textContent));
  await A.screenshot({ path: SH + '/hhc2_lobbyA.png' });
  // B gives A 10 wire and 3 haze seeds
  const w0 = await ev(A, () => window.__A.hhL.load().inv.wire);
  log.give = await ev(B, () => { const A_ = window.__A, peer = [...A_.HC_GET().rem.values()][0].peer; return [A_.hhpGiveL(peer, 'wire', 10), A_.hhpGiveL(peer, 'seed:haze', 3), A_.hhL.load().inv.wire]; });
  await A.waitForTimeout(3500);
  log.gotA = await ev(A, w0 => { const s = window.__A.hhL.load(); return { wire: s.inv.wire - w0, haze: s.seeds.haze }; }, w0);
  // A goes to THE HOMESTEAD, B visits and likes it; pings shared
  await ev(A, () => window.__A.actions('hh-base')); await A.waitForTimeout(18000);
  for (const p of pages) await ev(p, () => { const A = window.__A; A.G.holdT = 0.01; A.G.loadT = 0; if (A.G.state === 'paused') { A.G.state = 'playing'; A.showScreen(null); } });
  await A.waitForTimeout(3000);
  log.visit = await ev(B, () => { const H = window.__A.HHM_GET(); return H ? { client: H.client, base: H.base } : null; });
  await ev(B, () => window.__A.hhpLikeL()); await A.waitForTimeout(3000);
  log.likes = await ev(A, () => window.__A.HHM_GET().s.likes | 0);
  await ev(B, () => { const A_ = window.__A; A_.pingAdd({ kind: 'go', x: A_.P.x + 3, y: A_.P.y || 0, z: A_.P.z - 4 }, 'me'); }); await A.waitForTimeout(3000);
  log.pingA = await ev(A, () => window.__A.PING_GET().list.filter(p => p.who !== 'me').map(p => p.kind + ':' + p.who));
  // A kicks B
  await ev(A, () => { const A_ = window.__A; A_.leaveGame(); A_.hhOpenL(); document.querySelector('[data-hcx^="kick:"]').click(); }); await A.waitForTimeout(4000);
  log.kick = await ev(B, () => ({ on: window.__A.HC_GET().on, err: window.__A.HC_GET().err }));
  console.log(JSON.stringify(log, null, 1)); console.log(errs.length ? 'ERRORS:\n' + errs.slice(0, 10).join('\n') : 'NO ERRORS');
  await close(); process.exit(0);
})();
