// ranked SR, daily jobs, crews, events: SHOTS=dir node run.js s_batchE.js
const path = require('path');
module.exports = async p => {
  const out = process.env.SHOTS || '/tmp', r = {};
  const shot = async (n, ms = 700) => { await p.evaluate(() => { window.__A.G.noRender = false; }); await p.waitForTimeout(ms); await p.screenshot({ path: path.join(out, n + '.png'), timeout: 120000 }); await p.evaluate(() => { window.__A.G.noRender = true; }); };
  await p.evaluate(() => { const s = document.getElementById('hcSplash'); if (s) s.remove(); const A = window.__A; A.PROG.rank = null; A.PROG.dj = null; A.PROG.crew = null; A.PROG.ev = {}; delete A.PROG.owned.ev_haunt; });
  // ---- events by date
  r.events = await p.evaluate(() => { const A = window.__A, o = {};
    for (const d of ['2026-10-25T12:00:00', '2027-04-20T12:00:00', '2026-12-28T12:00:00', '2026-11-06T20:00:00', '2026-11-08T10:00:00', '2026-11-13T20:00:00', '2026-11-18T12:00:00']) { A.EVT.fake = d; const e = A.evActive(); o[d.slice(0, 10)] = e ? e.id : null; }
    A.EVT.fake = '2026-10-25T12:00:00'; return o; });
  await p.evaluate(() => { const A = window.__A; A.showScreen('menu'); A.evStrip(); });
  await shot('ev_menu');
  // ---- ranked: six wins and a loss
  await p.evaluate(() => { const A = window.__A; A.startMatch('tdm', { map: 'stackyard', score: 999, time: 0, perTeam: 2, custom: true }); A.G.holdT = 0.05; A.G.loadT = 0.05; A.G.noRender = true; });
  await p.waitForTimeout(1500);
  r.ranked = await p.evaluate(() => { const A = window.__A, o = []; A.M.def = A.MODES.rhp; A.M.online = true;
    for (let i = 0; i < 7; i++) { Object.assign(A.MS, { kills: 12, deaths: 5, caps: 1, time: 300 }); const L = A.rankMatch(i === 4 ? -1 : 1, false); o.push([L.d, L.after]); }
    const S = A.rankState(); return { steps: o, sr: S.sr, played: S.played, div: A.RANKS.filter(x => S.sr >= x.sr).pop().n }; });
  // xp with the event on
  r.evXp = await p.evaluate(() => { const A = window.__A; A.M.online = false; Object.assign(A.MS, { kills: 10, heads: 2, active: true }); const g = A.progMatchXP ? A.progMatchXP(1, false) : null; return g ? g.rows.map(x => x[0] + ' ' + x[1]) : 'no export'; });
  await p.evaluate(() => { const A = window.__A; A.M.over = false; A.M.def = A.MODES.rhp; A.rankState().last.t = Date.now(); A.endMatch(0); });
  await shot('rk_results', 900);
  await p.evaluate(() => { const A = window.__A; A.actions('res-lobby'); A.M.def = A.MODES.tdm; });
  // ---- event card after 3 matches
  r.evCard = await p.evaluate(() => { const A = window.__A; delete A.PROG.owned.ev_haunt; A.PROG.ev = {}; for (let i = 0; i < 3; i++) A.evMatch ? A.evMatch(false) : 0; return { owned: !!A.PROG.owned.ev_haunt, n: JSON.stringify(A.PROG.ev) }; });
  // ---- daily jobs
  r.daily = await p.evaluate(() => { const A = window.__A, D = A.djState(); const list0 = D.list.map(q => q.id + ':' + q.n); const xp0 = A.PROG.xp; A.djMatch({ kills: 30, heads: 9, wins: 1, played: 3, streaks: 3, zkills: 120, finishers: 2, bags: 5, turf: 4, obj: 2 }); return { list0, done: D.list.map(q => q.done), xp: A.PROG.xp - xp0 }; });
  await p.evaluate(() => { const A = window.__A; const D = A.djState(); D.list[2].done = false; D.list[2].have = 0; A.openWeekly(); });
  await shot('dj_weekly');
  // ---- crews
  r.crew = await p.evaluate(() => { const A = window.__A; A.crewMake('Green Thumbs', 'grn'); const C = A.PROG.crew;
    A.FRIENDS.length = 0; A.FRIENDS.push({ c: 'ABC234', n: 'MIKEY', on: true, s: [812, 640, 51, 98, 30000, 90000], z: [12, 9, 900, 2], r: 2140, cw: [C.id, C.name, C.tag] }, { c: 'XYZ789', n: 'DEE', on: false, s: [300, 410, 20, 50, 15000, 40000], z: [5, 3, 200, 0], r: 820, cw: ['other-1', 'NIGHT SHIFT', 'NITE'] });
    return { tag: C.tag, name: C.name }; });
  await p.evaluate(() => { const A = window.__A; A.SOC.lbSort = 'crew'; A.openLeaderboard(); });
  await shot('crew_board');
  await p.evaluate(() => { const A = window.__A; A.SOC.lbSort = 'rank'; A.renderLeaderboard(); });
  await shot('rank_board');
  r.join = await p.evaluate(() => { const A = window.__A; A.crewJoin(A.FRIENDS[1].cw); return A.PROG.crew.tag; });
  await p.evaluate(() => { const A = window.__A; A.FRIENDS.length = 0; A.EVT.fake = null; });
  return r;
};
