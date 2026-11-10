// EVERY ONLINE MODE with two real players (WebRTC, local signalling): both get in, see each other, the joiner's mode state
// follows the host's, and a hit from one player kills the other (when they're on different teams).
// MODES=otdm,oph to run a few; default: all of them.
const { mpPages } = require('./mp_lib.js');
(async () => {
  const { pages, errs, close, ev } = await mpPages(2), [A, B] = pages, out = {};
  const modes = (process.env.MODES ? process.env.MODES.split(',') : await ev(A, () => window.__A.MODE_ORDER_ONLINE()));
  for (const k of modes) {
    const r = { k }; const e0 = errs.length;
    try {
      for (const p of pages) await ev(p, k => { const A_ = window.__A; try { A_.leaveGame(); } catch (e) {} for (const o of document.querySelectorAll('.onb-ov,#hcSplash')) o.remove(); A_.LOBBY.playlist = [k]; A_.LOBBY.mode = k; A_.showScreen('menu'); A_.actions('go-mp'); A_.showScreen('menu'); if (k === 'rbr' || /^obr/.test(k)) { A_.actions('br-play'); const L = A_.BRLOB_GET(); L.net = 'on'; L.sq = k === 'obr4' ? 4 : k === 'obr2' ? 2 : 1; L.rk = k === 'rbr'; } /* LAST TOKE has its own lobby (1.2.93) */ A_.toLobby(); }, k);
      await A.waitForTimeout(1500);
      await ev(A, () => window.__A.actions('lob-start')); await A.waitForTimeout(9000);
      await ev(B, () => window.__A.actions('lob-start')); await A.waitForTimeout(9000);
      for (const p of pages) await ev(p, () => { const N = window.__A.NET; if (N.priv) N.priv.lt = 0.5; });
      await A.waitForTimeout(4000);
      for (const p of pages) await ev(p, () => { const A_ = window.__A; A_.G.holdT = Math.min(A_.G.holdT, 0.3); if (A_.curScreen === 'classpick') try { A_.showScreen(null); } catch (e) {} });
      await A.waitForTimeout(8000);
      const st = p => ev(p, () => { const A_ = window.__A, N = A_.NET, M = A_.M; let pack = null; try { pack = M && M.online ? A_.netObjPack() : null; } catch (e) { pack = 'ERR ' + e.message; }
        return { st: A_.G.state, scr: A_.curScreen, mode: M && M.mode, on: !!(M && M.online), host: !!(N.room && N.room.host), sees: N.rem ? [...N.rem.values()].filter(r => !r.isBot).map(r => r.entry.name) : [], bots: N.rem ? [...N.rem.values()].filter(r => r.isBot).length : 0, team: M && M.myTeam, teams: !!(M && M.def && M.def.teams), map: A_.curMap, pack }; });
      const a = await st(A), b = await st(B); const H = a.host ? a : b, C = a.host ? b : a, hostP = a.host ? A : B, cliP = a.host ? B : A;
      r.in = a.on && b.on && a.mode === b.mode && a.map === b.map; r.see = a.sees.length > 0 && b.sees.length > 0; r.oneHost = a.host !== b.host; r.bots = H.bots; r.map = a.map;
      // the joiner's copy of the mode state against the host's (numbers within 3)
      const near = (x, y) => { if (!Array.isArray(x) || !Array.isArray(y)) return x === y; const n = Math.min(x.length, y.length, 12); for (let i = 0; i < n; i++) { const u = x[i], v = y[i]; if (typeof u === 'number' && typeof v === 'number') { if (Math.abs(u - v) > 3) return false; } else if (typeof u === 'string' && typeof v === 'string' && i === 0 && u !== v) return false; } return true; };
      r.sync = H.pack === null && C.pack === null ? 'no state' : near(H.pack, C.pack) ? 'ok' : { host: JSON.stringify(H.pack).slice(0, 120), joiner: JSON.stringify(C.pack).slice(0, 120) };
      // a kill across the network: the host hits the joiner's avatar hard
      if (a.teams && a.team === b.team) r.kill = 'same team';
      else {
        await ev(cliP, () => { const A_ = window.__A; A_.G.spawnProt = 0; A_.G.health = Math.min(A_.G.health, 100); });
        const d0 = await ev(cliP, () => window.__A.M.me.deaths);
        await ev(hostP, () => { const A_ = window.__A, R = [...A_.NET.rem.values()].find(r => !r.isBot && r.bot); if (R && R.bot) { R.bot.spawnProt = 0; A_.damageEnemy(R.bot, 400, true, null, false, 'player'); } });
        await A.waitForTimeout(5000);
        const d1 = await ev(cliP, () => ({ d: window.__A.M.me.deaths, st: window.__A.G.state, downed: !!window.__A.G.downed, duel: !!(window.__A.DUEL && window.__A.DUEL.on) }));
        r.kill = d1.d > d0 ? 'ok' : d1.downed ? 'downed (squads)' : d1.duel ? 'duel' : d1.st !== 'playing' ? 'dead (' + d1.st + ')' : 'NO HIT';
      }
    } catch (e) { r.err = e.message.slice(0, 160); }
    r.errs = errs.slice(e0, e0 + 3).map(s => s.slice(0, 140));
    out[k] = r; console.log(JSON.stringify(r));
  }
  console.log(errs.length ? 'ERRORS: ' + errs.length : 'NO ERRORS');
  await close(); process.exit(0);
})();
