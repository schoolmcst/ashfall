// HOTBOX HORDE CO-OP: A hosts, B joins; A starts a DEFEND mission -> B follows, sees A's burnouts, hits them, A's burnouts hurt B,
// B builds a wall that appears on A; then A visits THE HOMESTEAD with B
process.env.ONLYFIGHT=1;const { mpPages } = require('./mp_lib.js');
const SH = process.env.SHOTS || '/tmp';
(async () => {
  const { pages, errs, close, ev } = await mpPages(2, 39571), [A, B] = pages, log = {};
  for (const p of pages) await ev(p, () => { for (const o of document.querySelectorAll('.onb-ov')) o.remove(); const A = window.__A, s = A.hhL.load(); s.tutSeen = 1; s.cash = 20000; Object.assign(s.inv, { wood: 500, stone: 300, metal: 300 }); s.mis = 7; A.hhL.save(s); A.hhOpenL(); for (const o of document.querySelectorAll('.onb-ov')) o.remove(); });
  await ev(A, () => window.__A.hcJoinL('QWERT')); await A.waitForTimeout(4000);
  await ev(B, () => window.__A.hcJoinL('QWERT')); await A.waitForTimeout(7000);
  log.room = { A: await ev(A, () => ({ host: window.__A.hcHostL(), rem: window.__A.HC_GET().rem.size, box: document.getElementById('hcBox').innerText })), B: await ev(B, () => ({ host: window.__A.hcHostL(), rem: window.__A.HC_GET().rem.size, box: document.getElementById('hcBox').innerText })) };
  await B.screenshot({ path: SH + '/hhc_lobby.png' });
  await ev(A, () => window.__A.actions('hh-start'));
  await A.waitForTimeout(16000);
  for (const p of pages) await ev(p, () => { const A = window.__A; A.G.holdT = 0.01; A.G.loadT = 0; if (A.G.state === 'paused') { A.G.state = 'playing'; A.showScreen(null); } });
  await A.waitForTimeout(2000);
  log.inA = await ev(A, () => { const A_ = window.__A, H = A_.HHM_GET(); return { mode: A_.M.mode, map: A_.curMap, kind: H && H.kind, crew: A_.M.entries.length, phase: H && H.phase }; });
  log.inB = await ev(B, () => { const A_ = window.__A, H = A_.HHM_GET(); return { mode: A_.M && A_.M.mode, map: A_.curMap, client: A_.hcClientL(), crew: A_.M.entries.length, phase: H && H.phase }; });
  // A: start the wave now and put burnouts next to B's avatar
  await ev(A, () => { const A_ = window.__A, H = A_.HHM_GET(); H.t = 0.01; });
  await A.waitForTimeout(3000);
  const bPos = await ev(B, () => ({ x: window.__A.P.x, z: window.__A.P.z, y: window.__A.P.y }));
  await ev(A, b => { const A_ = window.__A; for (let i = 0; i < 3; i++) { const e = A_.hhMobL('burnout', b.x + 1.5 + i * 0.6, b.z + 1, b.y); e.hcTest = 1; } }, bPos);
  await A.waitForTimeout(5000);
  await ev(A, () => { for (const e of window.__A.HHM_GET().mobs) if (e.hcTest) e.atkCd = 0; }); log.fight = { A: await ev(A, () => ({ mobs: window.__A.HHM_GET().mobs.length, av: window.__A.enemies.filter(e => e.hcAv).length })), B: await ev(B, () => ({ prox: window.__A.HC_GET().prox.size, hp: Math.round(window.__A.G.health), bar: (document.getElementById('hhBar') || {}).innerText })) };
  for (const p of pages) await ev(p, () => { window.__A.G.noRender = false; }); await A.waitForTimeout(2500);
  await B.screenshot({ path: SH + '/hhc_friend.png' }); await A.screenshot({ path: SH + '/hhc_host.png' });
  log.dbg = { B: await ev(B, () => { const A_ = window.__A; return { st: A_.G.state, alive: A_.M.me && A_.M.me.alive, gid: A_.HC_GET().gid, inG: A_.HC_GET().inGame }; }), A: await ev(A, () => { const A_ = window.__A; return { gid: A_.HC_GET().gid, rem: [...A_.HC_GET().rem.values()].map(R => ({ inGame: R.inGame, a: R.a, g: R.pr.g, av: !!R.av })) }; }) };
  // B kills one proxy
  const hit = await ev(B, () => { const A_ = window.__A, e = [...A_.HC_GET().prox.values()].find(q => !q.nest); if (!e) return null; A_.hcDmgL(e, 5000, true, null, false, 'player'); return e.hcId; });
  await A.waitForTimeout(3000);
  log.hit = { id: hit, goneOnHost: await ev(A, id => !window.__A.enemies.some(e => e.hcId === id), hit) };
  // B builds a wall
  log.build = await ev(B, async () => { const A_ = window.__A, H = A_.HHM_GET(); A_.hhL.build(true); const L = A_.hhL.pieces(); A_.HH_GET().piece = L.findIndex(x => x.id === 'wall'); const pl = H.plant || H.org; let dbg = null; for (const k of [0.25, 0.35, 0.45, 0.55, 0.65]) { for (const yo of [0, 0.6, -0.6]) { A_.P.x = pl.x * (1 - k); A_.P.z = pl.z * (1 - k); A_.P.yaw = Math.atan2(A_.P.x, A_.P.z) + yo; A_.P.pitch = -0.45; const a = A_.hhL.aim(); dbg = { a: a && a.id, key: a && a.key, bad: a.bad, slots: H.slots.size, slotHit: a.key.split('|').some(k => H.slots.has(k)), cx: a.cx, cz: a.cz, P: [A_.P.x, A_.P.z, A_.P.y], ay: a.y, pr: A_.PLAYRECT_L(), v: A_.hhValidL(a), w: a.w, d: a.d, h: a.h, cl: !!H.client, np: H.pieces.length }; A_.hhPlaceL(); if (A_.HC_GET().br.length) break; } if (A_.HC_GET().br.length) break; } A_.hhL.build(false); return { msg: document.getElementById('msg') && document.getElementById('msg').textContent, wood: H.s.inv.wood, dbg, br: A_.HC_GET().br.length }; });
  await A.waitForTimeout(3000);
  log.build.onHost = await ev(A, () => window.__A.HHM_GET().pieces.length);
  log.build.onFriend = await ev(B, () => window.__A.HHM_GET().pieces.length);
  // the host ends the mission (won): B gets its own pay
  await ev(A, () => window.__A.hhEndL(true));
  await A.waitForTimeout(4000);
  log.end = { A: await ev(A, () => window.__A.curScreen), B: await ev(B, () => ({ scr: window.__A.curScreen, won: window.__A.hhL.load().wins })) };
  // back to the lobby; the host goes to THE HOMESTEAD: B visits
  for (const p of pages) await ev(p, () => { const A_ = window.__A; A_.leaveGame(); A_.hhOpenL(); });
  await A.waitForTimeout(2000);
  await ev(A, () => window.__A.actions('hh-base'));
  await A.waitForTimeout(18000);
  for (const p of pages) await ev(p, () => { const A = window.__A; A.G.holdT = 0.01; A.G.loadT = 0; if (A.G.state === 'paused') { A.G.state = 'playing'; A.showScreen(null); } });
  await A.waitForTimeout(3000);
  log.visit = { A: await ev(A, () => ({ props: window.__A.HHM_GET().props.length, pieces: window.__A.HHM_GET().pieces.length })), B: await ev(B, () => { const H = window.__A.HHM_GET(); return H ? { map: window.__A.curMap, base: H.base, props: H.props.length, pieces: H.pieces.length, noSave: H.noSave } : null; }) };
  await B.screenshot({ path: SH + '/hhc_visit.png' });
  console.log(JSON.stringify(log, null, 1)); console.log(errs.length ? 'ERRORS:\n' + errs.slice(0, 10).join('\n') : 'NO ERRORS');
  await close(); process.exit(0);
})();
