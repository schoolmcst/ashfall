// ONLINE LAST TOKE: stash boxes both ways, a vault boss stand-in that takes the joiner's hits, a squad card carried by the joiner
const { mpPages } = require('./mp_lib.js');
(async () => {
  const { pages, errs, close, ev } = await mpPages(2), [A, B] = pages, out = {};
  for (const p of pages) await ev(p, () => { const A_ = window.__A; for (const o of document.querySelectorAll('.onb-ov,#hcSplash')) o.remove(); A_.showScreen('menu'); A_.actions('br-play'); const L = A_.BRLOB_GET(); L.net = 'on'; L.sq = 4; L.rk = false; });
  await A.waitForTimeout(1500);
  await ev(A, () => window.__A.actions('bl-start')); await A.waitForTimeout(9000);
  await ev(B, () => window.__A.actions('bl-start')); await A.waitForTimeout(9000);
  for (const p of pages) await ev(p, () => { const N = window.__A.NET; if (N.priv) N.priv.lt = 0.5; });
  await A.waitForTimeout(4000);
  for (const p of pages) await ev(p, () => { const A_ = window.__A; A_.G.holdT = Math.min(A_.G.holdT, 0.3); if (A_.curScreen === 'classpick') try { A_.showScreen(null); } catch (e) {} });
  await A.waitForTimeout(8000);
  const host = await ev(A, () => !!(window.__A.NET.room && window.__A.NET.room.host)), H = host ? A : B, C = host ? B : A;
  for (const p of pages) await ev(p, () => { const A_ = window.__A; A_.G.health = A_.G.maxHp = 1e6; });
  await ev(H, () => { for (const e of window.__A.enemies) if (e.entry && !e.net) { e.acc = 0; e.dmg = 0; } });
  // 1) a host bot dies -> its box shows on the joiner; the joiner takes an item -> marked taken on the host
  const bot = await ev(H, () => { const A_ = window.__A, myT = [...A_.NET.rem.values()].find(r => !r.isBot && r.bot).bot.team, e = A_.enemies.find(e => e.entry && !e.net && e.team !== myT && e.team !== A_.M.myTeam); e.spawnProt = 0; e.sqFinal = true; A_.damageEnemy(e, 99999, false, null, false, 'player'); return e.entry.name; });
  await A.waitForTimeout(5000);
  out.boxOnJoiner = await ev(C, () => window.__A.BRI_GET().boxes.map(b => b.name + ':' + b.items.length + (b.id ? ':' + b.id : '')));
  const took = await ev(C, () => { const I = window.__A.BRI_GET(), b = I.boxes.find(b => b.id); if (!b) return null; const i = b.items.findIndex(it => it.k !== 'gun'); window.__A.briBoxTakeL(b, i); return b.id + ':' + i; });
  await A.waitForTimeout(4000);
  out.takenOnHost = await ev(H, t => { if (!t) return null; const [id, i] = t.split(':'), b = window.__A.BRI_GET().boxes.find(b => b.id === id); return b ? !!b.items[i | 0].t : 'no box'; }, took);
  // 2) a vault: the host opens one -> the joiner sees the boss and hurts it
  await ev(H, () => { const A_ = window.__A; A_.brbVaultOpenL(0); });
  await A.waitForTimeout(4000);
  out.bossOnJoiner = await ev(C, () => window.__A.enemies.filter(e => e.proxyBoss !== undefined).length);
  const hp0 = await ev(H, () => window.__A.BRB_GET().bosses[0].hp);
  await ev(C, () => { const A_ = window.__A, e = A_.enemies.find(e => e.proxyBoss === 0); if (e) A_.damageEnemy(e, 400, false, null, false, 'player'); });
  await A.waitForTimeout(4000);
  out.bossHp = [Math.round(hp0), await ev(H, () => Math.round(window.__A.BRB_GET().bosses[0].hp) + ' armor ' + Math.round(window.__A.BRB_GET().bosses[0].armor))];
  // 3) a squad card: a host bot in the joiner's squad goes out -> the joiner takes the card to a beacon -> it floats back
  const cardBot = await ev(H, () => { const A_ = window.__A, R = [...A_.NET.rem.values()].find(r => !r.isBot && r.bot), e = A_.enemies.find(e => e.entry && !e.net && e.team === R.bot.team); if (!e) return null; e.spawnProt = 0; e.sqFinal = true; A_.damageEnemy(e, 99999, false, null, false, 'world'); return e.entry.name; });
  await A.waitForTimeout(5000);
  out.cardOnJoiner = await ev(C, () => [...window.__A.BRN_GET().cards.values()].map(c => c.team + ':' + (c.by || '-')));
  out.reup = await ev(C, async () => { const A_ = window.__A, N = A_.BRN_GET(); const c = [...N.cards.values()].find(c => c.team === A_.M.myTeam && !c.by); if (!c) return 'no card for me'; A_.P.x = c.x; A_.P.z = c.z; A_.P.y = c.y; await new Promise(r => setTimeout(r, 4000)); const mine = c.by; const b = A_.BRSQ_GET().beacons[0]; A_.P.x = b.x + 1; A_.P.z = b.z; A_.P.y = b.y; await new Promise(r => setTimeout(r, 1500)); A_.keys.KeyE = true; await new Promise(r => setTimeout(r, 4500)); A_.keys.KeyE = false; await new Promise(r => setTimeout(r, 3000)); return { carried: mine, cardsLeft: N.cards.size }; });
  out.botBack = await ev(H, n => { const e = window.__A.enemies.find(e => e.entry && e.entry.name === n); return e ? (e.brFloat ? 'floating' : 'back') : 'gone'; }, cardBot);
  for (const [k, v] of Object.entries(out)) console.log(k, JSON.stringify(v));
  console.log(errs.length ? 'ERRORS: ' + errs.slice(0, 5).join('\n') : 'NO ERRORS');
  await close(); process.exit(0);
})();
