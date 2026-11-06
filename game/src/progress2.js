/* ================================================================== TROPHIES: achievements, style, prestige shop, heatmaps (1.2.87)
   ACHIEVEMENTS - 50 of them across every mode. Each one unlocks its own calling card (a banner for your player card) and
     a toast when you get it; a few are secret until you do. Counted in PROG.cnt, unlocked in PROG.ach.
   STYLE        - your bullet TRACER colour and your KILL EFFECT (what bursts out of the people you kill), and your EMOTE.
     They unlock with levels, prestige and achievements.
   EMOTES       - J opens the emote wheel in a match (1-6 to pick): the people near you see it over your head; your pick is
     also what you do on the podium.
   PODIUM       - the end-of-match screen shows the top three on a podium, with their cards and emotes.
   PRESTIGE SHOP - spend PRESTIGE TOKENS (2 for every prestige, 1 for every 5 achievements) on items from seasons and
     events you missed.
   HEATMAPS     - where you get your kills and where you die, per map, drawn over the map from above.
   CREW WARS    - (crewhouse.js) this week's crews, ranked by crew kills. */
const ACH = [
  ['first', 'FIRST BLOOD', 'Get your first kill', 'kills', 1], ['k100', 'CENTURY', '100 kills', 'kills', 100], ['k1000', 'THOUSAND YARD', '1,000 kills', 'kills', 1000], ['k5000', 'CHRONIC', '5,000 kills', 'kills', 5000],
  ['h50', 'HEADSPACE', '50 headshots', 'heads', 50], ['h500', 'HEADY', '500 headshots', 'heads', 500],
  ['w1', 'WINNER', 'Win a match', 'wins', 1], ['w25', 'ON A ROLL', 'Win 25 matches', 'wins', 25], ['w100', 'TOP SHELF', 'Win 100 matches', 'wins', 100],
  ['m50', 'REGULAR', 'Play 50 matches', 'matches', 50], ['m250', 'LIFER', 'Play 250 matches', 'matches', 250],
  ['br1', 'LAST TOKE', 'Win a LAST TOKE', 'brwins', 1], ['br10', 'ISLAND KING', 'Win 10 LAST TOKEs', 'brwins', 10], ['sq1', 'SQUAD GOALS', 'Win LAST TOKE in duos or squads', 'sqwins', 1],
  ['duel', 'BACK FROM THE HOTBOX', 'Win THE HOTBOX DUEL', 'duelwins', 1], ['duelbr', 'SECOND WIND', 'Win THE HOTBOX DUEL and then the whole LAST TOKE', 'duelbr', 1, 1],
  ['rev10', 'MEDIC', 'Pick up 10 downed squadmates', 'revives', 10], ['plate50', 'BULLETPROOF', 'Put on 50 armor plates', 'plates', 50], ['drop', 'AIRMAIL', 'Open a SUPPLY DROP', 'drops', 1],
  ['job10', 'CONTRACTOR', 'Finish 10 contracts', 'contracts', 10], ['zip', 'WHEEE', 'Ride a zipline', 'zips', 1], ['pad', 'LIFT OFF', 'Use a jump pad', 'pads', 1],
  ['veh10', 'ROAD RAGE', 'Run over 10 enemies', 'vehkills', 10, 1], ['wall10', 'THROUGH THE WALL', '10 wallbang kills', 'wallkills', 10], ['knife25', 'STABBY', '25 throwing knife kills', 'knifekills', 25],
  ['xbow10', 'SILENT NIGHT', '10 crossbow kills', 'xbowkills', 10], ['slide10', 'SLIDE IN', '10 kills while sliding', 'slidekills', 10], ['prone10', 'SNAKE', '10 kills while prone', 'pronekills', 10],
  ['z10', 'STILL BREATHING', 'Reach round 10 in zombies', 'zround', 10], ['z30', 'NIGHTSHADE PROOF', 'Reach round 30 in zombies', 'zround', 30], ['z50', 'IMMUNE', 'Reach round 50 in zombies', 'zround', 50, 1],
  ['heist5', 'BAG MAN', 'Deliver 5 stash bags in THE HEIST', 'hbags', 5], ['plug', 'SPECIAL DELIVERY', 'Get out alive as THE PLUG', 'plugouts', 1], ['grow20', 'GREEN THUMB', 'Take 20 spots in GROW WARS or TURF WAR', 'grows', 20],
  ['oic', 'ONE SHOT', 'Win ONE IN THE CHAMBER', 'oicwins', 1], ['hso', 'BRAINS', 'Win HEADSHOTS ONLY', 'hsowins', 1], ['kf', 'KNIFE PARTY', 'Win KNIFE FIGHT', 'kfwins', 1],
  ['fu25', 'HANDY', 'Use 25 field upgrades', 'fus', 25], ['trophy10', 'NOT TODAY', 'Shoot down 10 grenades with a trophy system', 'trophies', 10], ['stk50', 'CALL IT IN', 'Use 50 scorestreaks', 'streaks', 50],
  ['ping100', 'SPOTTER', 'Ping 100 times', 'pings', 100], ['photo', 'SMILE', 'Save a picture in photo mode', 'photos', 1], ['code', 'SHARING IS CARING', 'Share a build code', 'codes', 1],
  ['invite', 'THE MORE THE MERRIER', 'Invite a friend to your party', 'invites', 1], ['rejoin', 'NOT DONE YET', 'Rejoin a match you dropped out of', 'rejoins', 1],
  ['pres1', 'RE-UP', 'Prestige for the first time', 'pres', 1], ['pres10', 'VETERAN GROWER', 'Reach prestige 10', 'pres', 10], ['lvl55', 'MAXED OUT', 'Reach level 55', 'lvl', 55],
  ['all', 'MARY JANE LEGEND', 'Unlock 40 other achievements', 'achs', 40, 1],
].map(([id, n, d, k, v, secret]) => ({ id, n, d, k, v, secret: !!secret }));
const ACH_ICON = ['leaf', 'star', 'skull', 'crown', 'eye', 'flame'];
const TRACERS = [{ id: 'std', n: 'CLASSIC', col: 0xffe2a0, need: 0 }, { id: 'green', n: 'KUSH GREEN', col: 0x5dff7a, need: 10 }, { id: 'purple', n: 'PURPLE HAZE', col: 0xc070ff, need: 20 }, { id: 'red', n: 'HOT BOX', col: 0xff4a3a, need: 30 }, { id: 'blue', n: 'ICE', col: 0x5ac8ff, need: 40 }, { id: 'rainbow', n: 'RAINBOW', col: -1, need: 'ach20' }];
const KILLFX = [{ id: 'none', n: 'NONE', need: 0 }, { id: 'smoke', n: 'SMOKE PUFF', need: 5 }, { id: 'leaves', n: 'LEAF BURST', need: 15 }, { id: 'confetti', n: 'CONFETTI', need: 25 }, { id: 'fire', n: 'FIRE', need: 'pres1' }, { id: 'stars', n: 'STARS', need: 'ach30' }];
const EMOTES = [{ id: 'wave', n: 'WAVE', i: '👋' }, { id: 'puff', n: 'PUFF PUFF', i: '💨' }, { id: 'dance', n: 'DANCE', i: '🕺' }, { id: 'laugh', n: 'LAUGH', i: '😂' }, { id: 'gg', n: 'GG', i: '🤝' }, { id: 'taunt', n: 'TOO EASY', i: '😎' }];
// the calling cards (banners) the achievements unlock
(() => {
  const cols = ['#7fd16b', '#5ac8ff', '#c070ff', '#ff7a2a', '#ff4fa3', '#9adf5a'];
  ACH.forEach((a, i) => { const c = cols[i % cols.length]; const it = { id: 'ach_' + a.id, name: a.n, kind: 'banner', r: a.v >= 100 || a.secret ? 3 : a.v >= 10 ? 2 : 1, ach: 1, g: { t: ['grad', 'rays', 'stars'][i % 3], c: i % 3 === 2 ? ['#05040b', c, '#1a3a1a'] : ['#0b1410', c, '#1a2a1a'], em: [ACH_ICON[i % ACH_ICON.length], c, '#0b0c0d'] } }; COSM.push(it); COS[it.id] = it; });
})();
const TRO = { toastQ: [], toastT: 0 };
function achCnt() { PROG.cnt = PROG.cnt || {}; PROG.ach = PROG.ach || {}; return PROG.cnt; }
function achAdd(k, n = 1) { if (G && G.bench) return; const c = achCnt(); c[k] = (c[k] | 0) + n; achCheck(); }
function achMax(k, v) { const c = achCnt(); if ((c[k] | 0) < v) { c[k] = v; achCheck(); } }
function achCheck() {
  const c = achCnt(), A = PROG.ach; c.pres = PROG.pres | 0; try { c.lvl = lvlInfo(PROG.xp).l | 0; } catch (e) {} c.achs = Object.keys(A).length;
  let got = false;
  for (const a of ACH) { if (A[a.id]) continue; if ((c[a.k] | 0) >= a.v) { A[a.id] = Date.now(); PROG.owned['ach_' + a.id] = 1; got = true; TRO.toastQ.push(a); c.achs = Object.keys(A).length; } }
  if (got) { try { saveProg(); } catch (e) {} p2Toast(); }
}
function p2Toast() {
  if (!TRO.toastQ.length || $('achToast')) return; const a = TRO.toastQ.shift();
  const t = document.createElement('div'); t.id = 'achToast'; t.innerHTML = `<i style="background-image:url(${bannerUrl('ach_' + a.id)})"></i><div><small>ACHIEVEMENT</small><b>${a.n}</b><span>${a.d} · new calling card</span></div>`;
  document.body.appendChild(t); try { sfx.streak(); } catch (e) {} setTimeout(() => { t.remove(); p2Toast(); }, 4200);
}
// a kill (from onKill): the counters that care how you got it
function achKill(e, head, boom) {
  achAdd('kills'); if (head) achAdd('heads');
  const src = G.killSrc || '', w = WEAPONS[G.cur], cat = w && w.def ? w.def.cat : '';
  if (src === 'wall') achAdd('wallkills'); if (src === 'knife') achAdd('knifekills'); if (src === 'veh') achAdd('vehkills');
  if (src === 'bolt' || (!src && w && w.def && w.def.id === 'crossbow')) achAdd('xbowkills');
  if (P.slideT > 0) achAdd('slidekills'); if (P.prone) achAdd('pronekills');
  try { kfxBurst(e); } catch (er) {}
  try { heatAdd('k', P.x, P.z); } catch (er) {}
}
// the end of a match (from finishMatchStats via endMatch)
function achMatch(won) {
  if (!M || !inMatch() || M.mode === 'range') return; achAdd('matches');
  if (won !== 1) return; achAdd('wins');
  if (M.br) { achAdd('brwins'); if (M.squad > 1) achAdd('sqwins'); if (M.br.duelUsed && M.br.duelWon) achAdd('duelbr'); }
  if (M.mode === 'oic') achAdd('oicwins'); if (M.mode === 'hso') achAdd('hsowins'); if (M.mode === 'kf') achAdd('kfwins');
}
// small cached pictures of the calling cards for the TROPHIES grid (the full ones are 512 wide)
const TRO_THUMB = {};
function achThumb(id) { if (TRO_THUMB[id]) return TRO_THUMB[id]; try { const src = cosmCanvas(id, 512).cc, c = document.createElement('canvas'); c.width = 192; c.height = 48; c.getContext('2d').drawImage(src, 0, 0, 192, 48); return (TRO_THUMB[id] = c.toDataURL('image/jpeg', 0.8)); } catch (e) { return bannerUrl(id); } }
/* ---------- STYLE: tracers, kill effects, emotes */
function styleOk(need) { if (!need) return true; if (typeof need === 'number') { try { return (lvlInfo(PROG.xp).l | 0) >= need || (PROG.pres | 0) > 0; } catch (e) { return false; } } if (need.startsWith('pres')) return (PROG.pres | 0) >= +need.slice(4); if (need.startsWith('ach')) return Object.keys(PROG.ach || {}).length >= +need.slice(3); return false; }
const needTxt = need => typeof need === 'number' ? `LEVEL ${need}` : need.startsWith('pres') ? `PRESTIGE ${need.slice(4)}` : `${need.slice(3)} ACHIEVEMENTS`;
// my tracers get my colour (from shoot, right after addTracer)
function trcPaint() {
  const id = PROG.trc || 'std'; if (id === 'std') return; const T = TRACERS.find(t => t.id === id); if (!T || !styleOk(T.need)) return;
  const t = typeof tracers !== 'undefined' ? tracers.filter(q => q.on).sort((a, b) => b.life - a.life)[0] : null; if (!t) return;
  t.m.material.color.setHex(T.col < 0 ? new THREE.Color().setHSL((NOW * 0.5) % 1, 1, 0.6).getHex() : T.col); t.paint = 1;
}
function trcReset() { if (typeof tracers === 'undefined') return; for (const t of tracers) if (!t.on && t.paint) { t.paint = 0; t.m.material.color.setHex(0xffe2a0); } }
function kfxBurst(e) {
  const id = PROG.kfx || 'none'; if (id === 'none' || !e || !e.group) return; const K = KILLFX.find(k => k.id === id); if (!K || !styleOk(K.need)) return;
  const p = e.group.position;
  if (id === 'smoke') puff(p.x, p.y + 1.2, p.z, { color: 0xb8c8b0, size: 0.9, grow: 1.6, life: 1.1, vy: 0.6, op: 0.55 });
  if (id === 'leaves') for (let i = 0; i < 3; i++) chunks('leaf', new THREE.Vector3(p.x, p.y + 1.3, p.z), 8, 3, 0.8);
  if (id === 'confetti') for (let i = 0; i < 3; i++) chunks('confetti', new THREE.Vector3(p.x, p.y + 1.5, p.z), 10, 3.5, 0.9);
  if (id === 'fire') { puff(p.x, p.y + 1, p.z, { color: 0xff7a2a, size: 0.8, grow: 1.4, life: 0.7, vy: 1.2, op: 0.7 }); puff(p.x, p.y + 1.4, p.z, { color: 0xffd23a, size: 0.5, grow: 1, life: 0.5, vy: 1.6, op: 0.7 }); }
  if (id === 'stars') for (let i = 0; i < 6; i++) puff(p.x + rnd(-0.6, 0.6), p.y + 1 + Math.random(), p.z + rnd(-0.6, 0.6), { color: 0xfff6a0, size: 0.18, grow: 0.4, life: 0.8, vy: 1, op: 0.9 });
}
// EMOTES: J in a match
function emoteWheel() {
  if (!M || !inMatch() || G.state !== 'playing' || $('emoteWheel')) return;
  const w = document.createElement('div'); w.id = 'emoteWheel'; w.innerHTML = EMOTES.map((e, i) => `<button data-em="${i}"><i>${e.i}</i><b>${i + 1}</b><span>${e.n}</span></button>`).join('');
  document.body.appendChild(w);
  const close = () => { w.remove(); removeEventListener('keydown', k, true); }, pick = i => { close(); emoteDo(i); };
  const k = e => { const n = +e.key; if (n >= 1 && n <= EMOTES.length) { e.preventDefault(); e.stopPropagation(); pick(n - 1); } else if (e.code === 'Escape' || e.code === bind('emote')) { e.preventDefault(); e.stopPropagation(); close(); } };
  addEventListener('keydown', k, true); for (const b of w.querySelectorAll('[data-em]')) b.onclick = () => pick(+b.dataset.em);
  setTimeout(() => { if (w.isConnected) close(); }, 4000);
}
function emoteDo(i) {
  const E = EMOTES[i]; if (!E) return; PROG.emote = E.id; TRO.emSeq = (TRO.emSeq | 0) + 1; TRO.emOut = { seq: TRO.emSeq, i, until: NOW + 4 };
  try { showMsg(`${E.i}  ${E.n}`); sfx.ui(); saveProg(); } catch (e) {}
}
const emotePack = () => TRO.emOut && TRO.emOut.until > NOW ? [TRO.emOut.seq, TRO.emOut.i] : undefined;
// another player's emote over their head
function emoteRemote(R, a) {
  if (!Array.isArray(a) || !R || !R.bot) return; const key = R.peer || ''; TRO.emSeen = TRO.emSeen || {}; if ((TRO.emSeen[key] | 0) >= (a[0] | 0)) return; TRO.emSeen[key] = a[0] | 0;
  const E = EMOTES[a[1] | 0]; if (!E) return; const g = R.bot.group;
  const c = document.createElement('canvas'); c.width = 128; c.height = 128; const x = c.getContext('2d'); x.font = '96px serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(E.i, 64, 70);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthWrite: false, transparent: true })); s.scale.set(0.8, 0.8, 1); s.position.y = 2.5 / ((g.userData && g.userData.scale) || 1); g.add(s);
  setTimeout(() => { g.remove(s); }, 3500);
}
/* ---------- PODIUM (results screen) */
function podiumHtml() {
  if (!M || !M.entries || M.mode === 'zomb' || M.mode === 'range' || M.mode === 'camp' || M.mode === 'surv') return '';
  const top = M.entries.slice().sort((a, b) => (b.score - a.score) || (b.kills - a.kills)).slice(0, 3); if (top.length < 2) return '';
  const em = id => (EMOTES.find(e => e.id === id) || EMOTES[0]).i;
  const card = (en, place) => `<div class="pod pod${place}"><div class="pod-em">${en.isPlayer ? em(PROG.emote) : EMOTES[(en.name.length + place) % EMOTES.length].i}</div><div class="pod-card" style="background-image:url(${bannerUrl(en.isPlayer ? PROG.banner : 'bn_default')})"><b>${en.isPlayer ? NET.nick || 'YOU' : en.name}</b><span>${en.kills} KILLS · ${en.score}</span></div><div class="pod-step">${place}</div></div>`;
  return `<div class="podium">${top[1] ? card(top[1], 2) : ''}${card(top[0], 1)}${top[2] ? card(top[2], 3) : ''}</div>`;
}
/* ---------- PRESTIGE SHOP */
const ptokens = () => Math.max(0, (PROG.pres | 0) * 2 + Math.floor(Object.keys(PROG.ach || {}).length / 5) - (PROG.ptokSpent | 0));
const pshopItems = () => COSM.filter(c => !PROG.owned[c.id] && ((c.bp && c.bp < PASS.season) || c.ev) && !c.secret);
function pshopBuy(id) { if (ptokens() < 1 || !COS[id] || PROG.owned[id]) return false; PROG.owned[id] = 1; PROG.ptokSpent = (PROG.ptokSpent | 0) + 1; saveProg(); try { sfx.streak(); } catch (e) {} return true; }
/* ---------- HEATMAPS */
function heatAdd(k, x, z) { if (!M || !inMatch() || M.mode === 'range') return; PROG.heat = PROG.heat || {}; const h = PROG.heat[curMap] || (PROG.heat[curMap] = { k: [], d: [] }); h[k].push([Math.round(x * 2) / 2, Math.round(z * 2) / 2]); if (h[k].length > 400) h[k].splice(0, h[k].length - 400); }
function heatDraw(cv, mapId) {
  const g = cv.getContext('2d'), W = cv.width, H = cv.height, m = MAPS[mapId], pr = (m && m.play) || [-44, 44, -44, 44], h = (PROG.heat || {})[mapId] || { k: [], d: [] };
  g.fillStyle = '#0a0d0c'; g.fillRect(0, 0, W, H);
  try { if (typeof RP_PLAN !== 'undefined' && RP_PLAN[mapId]) g.drawImage(RP_PLAN[mapId], 0, 0, W, H); } catch (e) {}
  g.strokeStyle = 'rgba(255,255,255,.08)'; for (let i = 1; i < 8; i++) { g.beginPath(); g.moveTo(i * W / 8, 0); g.lineTo(i * W / 8, H); g.moveTo(0, i * H / 8); g.lineTo(W, i * H / 8); g.stroke(); }
  const px = x => (x - pr[0]) / (pr[1] - pr[0]) * W, pz = z => (z - pr[2]) / (pr[3] - pr[2]) * H;
  g.globalCompositeOperation = 'lighter';
  for (const [k, col] of [['k', '93,255,122'], ['d', '255,74,58']]) for (const [x, z] of h[k]) { const rg = g.createRadialGradient(px(x), pz(z), 0, px(x), pz(z), 16); rg.addColorStop(0, `rgba(${col},.35)`); rg.addColorStop(1, `rgba(${col},0)`); g.fillStyle = rg; g.fillRect(px(x) - 16, pz(z) - 16, 32, 32); }
  g.globalCompositeOperation = 'source-over';
  return { k: h.k.length, d: h.d.length };
}
/* ---------- the TROPHIES screen */
let TRO_TAB = 'ach';
function openTrophies(tab) {
  if (tab) TRO_TAB = tab; let o = $('trophies'); if (!o) { o = document.createElement('div'); o.id = 'trophies'; o.className = 'screen center hide'; document.body.appendChild(o); }
  if (!SCREENS.includes('trophies')) SCREENS.push('trophies');
  renderTrophies(); showScreen('trophies');
}
function renderTrophies() {
  const o = $('trophies'); if (!o) return; achCheck();
  const A = PROG.ach || {}, C = achCnt(), tabs = [['ach', 'ACHIEVEMENTS'], ['style', 'STYLE'], ['shop', 'PRESTIGE SHOP'], ['heat', 'HEATMAPS']];
  let body = '';
  if (TRO_TAB === 'ach') body = `<div class="p2-sum">${Object.keys(A).length} / ${ACH.length} UNLOCKED</div><div class="p2-grid">${ACH.map(a => { const got = !!A[a.id], hid = a.secret && !got; return `<div class="p2-a${got ? ' got' : ''}"><i style="background-image:url(${achThumb('ach_' + a.id)})"></i><b>${hid ? '???' : a.n}</b><span>${hid ? 'secret' : a.d}</span><small>${got ? 'UNLOCKED' : `${Math.min(a.v, C[a.k] | 0)} / ${a.v}`}</small></div>`; }).join('')}</div>`;
  else if (TRO_TAB === 'style') {
    const row = (title, list, cur, key) => `<div class="p2-h">${title}</div><div class="p2-row">${list.map(t => { const ok = styleOk(t.need); return `<button class="p2-s${(cur || list[0].id) === t.id ? ' on' : ''}${ok ? '' : ' off'}" data-st="${key}:${t.id}"${ok ? '' : ' disabled'}>${t.i ? `<i>${t.i}</i>` : t.col !== undefined ? `<i style="background:${t.col < 0 ? 'linear-gradient(90deg,#f33,#ff3,#3f3,#3ff,#33f,#f3f)' : '#' + t.col.toString(16).padStart(6, '0')}"></i>` : ''}<b>${t.n}</b>${ok ? '' : `<span>${needTxt(t.need)}</span>`}</button>`; }).join('')}</div>`;
    body = row('BULLET TRACERS', TRACERS, PROG.trc, 'trc') + row('KILL EFFECT', KILLFX, PROG.kfx, 'kfx') + row('EMOTE (J IN A MATCH · ON THE PODIUM)', EMOTES.map(e => Object.assign({ need: 0 }, e)), PROG.emote, 'emote');
  } else if (TRO_TAB === 'shop') { const items = pshopItems(); body = `<div class="p2-sum">${ptokens()} PRESTIGE TOKEN${ptokens() === 1 ? '' : 'S'} · 2 for every prestige, 1 for every 5 achievements</div><div class="p2-grid">${items.length ? items.slice(0, 60).map(c => `<button class="p2-a p2-buy" data-buy="${c.id}"${ptokens() < 1 ? ' disabled' : ''}><b>${c.name}</b><span>${String(c.kind).toUpperCase()}${c.bp ? ' · SEASON ' + c.bp : ' · EVENT'}</span><small>1 TOKEN</small></button>`).join('') : '<div class="p2-sum">Nothing from past seasons left to get.</div>'}</div>`; }
  else { const maps = Object.keys(PROG.heat || {}).filter(id => MAPS[id]); const sel = TRO.heatMap && maps.includes(TRO.heatMap) ? TRO.heatMap : maps[0];
    body = maps.length ? `<div class="p2-row">${maps.map(id => `<button class="p2-s${id === sel ? ' on' : ''}" data-hm="${id}"><b>${mapName(id)}</b></button>`).join('')}</div><canvas id="p2Heat" width="520" height="520"></canvas><div class="p2-sum" id="p2HeatSum"><b style="color:#5dff7a">GREEN</b> where you get kills · <b style="color:#ff4a3a">RED</b> where you die</div>` : '<div class="p2-sum">Play a few matches and your kills and deaths show up here.</div>'; TRO.heatMap = sel; }
  o.innerHTML = `<div class="panel p2"><h2>TROPHIES</h2><div class="tabs">${tabs.map(([k, n]) => `<button class="tab${k === TRO_TAB ? ' on' : ''}" data-p2t="${k}">${n}</button>`).join('')}</div><div class="body p2-body">${body}</div><div class="actions"><span></span><button class="btn primary" data-p2t="back">BACK</button></div></div>`;
  for (const b of o.querySelectorAll('[data-p2t]')) b.onclick = () => { try { sfx.ui(); } catch (e) {} if (b.dataset.p2t === 'back') return showScreen(TRO.ret || 'menu'); TRO_TAB = b.dataset.p2t; renderTrophies(); };
  for (const b of o.querySelectorAll('[data-st]')) b.onclick = () => { const [k, id] = b.dataset.st.split(':'); PROG[k] = id; saveProg(); try { sfx.ui(); } catch (e) {} renderTrophies(); };
  for (const b of o.querySelectorAll('[data-buy]')) b.onclick = () => { if (pshopBuy(b.dataset.buy)) renderTrophies(); };
  for (const b of o.querySelectorAll('[data-hm]')) b.onclick = () => { TRO.heatMap = b.dataset.hm; renderTrophies(); };
  const cv = $('p2Heat'); if (cv) heatDraw(cv, TRO.heatMap);
}
(() => {
  const s = document.createElement('style'); s.textContent = `#achToast{position:fixed;left:50%;top:84px;transform:translateX(-50%);z-index:80;display:flex;gap:12px;align-items:center;padding:10px 16px;background:rgba(8,12,10,.92);border:1px solid #5dff7a;box-shadow:0 0 18px rgba(93,255,122,.3);pointer-events:none;animation:achIn .4s}
#achToast i{width:120px;height:40px;background-size:cover;background-position:center}#achToast small{display:block;font-size:9px;letter-spacing:.3em;color:#5dff7a}#achToast b{display:block;font-size:15px;letter-spacing:.16em;color:#fff}#achToast span{font-size:10px;color:var(--dim)}@keyframes achIn{from{opacity:0;transform:translate(-50%,-14px)}}
#emoteWheel{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:70;display:grid;grid-template-columns:repeat(3,110px);gap:8px}#emoteWheel button{pointer-events:auto;cursor:pointer;padding:10px;background:rgba(8,10,12,.85);border:1px solid var(--line);color:#fff;font:inherit;text-align:center}#emoteWheel button:hover{border-color:var(--accent)}#emoteWheel i{display:block;font-style:normal;font-size:30px}#emoteWheel b{font-size:10px;color:var(--accent)}#emoteWheel span{display:block;font-size:10px;letter-spacing:.14em}
.podium{display:flex;align-items:flex-end;justify-content:center;gap:10px;margin:4px 0 12px}.pod{display:flex;flex-direction:column;align-items:center;width:200px}.pod-em{font-size:30px;margin-bottom:2px;animation:podBob 1.2s ease-in-out infinite alternate}@keyframes podBob{to{transform:translateY(-6px)}}
.pod-card{width:100%;height:64px;background-size:cover;background-position:center;border:1px solid var(--line);display:flex;flex-direction:column;justify-content:flex-end;padding:6px 8px;box-sizing:border-box}.pod-card b{font-size:12px;letter-spacing:.14em;text-shadow:0 0 4px #000}.pod-card span{font-size:9px;letter-spacing:.12em;color:#ddd;text-shadow:0 0 4px #000}
.pod-step{width:100%;text-align:center;font-weight:800;font-size:22px;color:#111;background:linear-gradient(#e8e8e0,#a8a8a0)}.pod1 .pod-step{height:64px;line-height:64px;background:linear-gradient(#9adf5a,#3fae5a)}.pod2 .pod-step{height:44px;line-height:44px}.pod3 .pod-step{height:30px;line-height:30px;background:linear-gradient(#d8a878,#a8784a)}
.p2{width:min(1100px,94vw)}.p2-body{max-height:62vh;overflow:auto;padding:10px 20px}.p2-sum{font-size:11px;letter-spacing:.2em;color:var(--dim);margin:6px 0 10px;text-align:left}.p2-h{font-size:11px;letter-spacing:.3em;color:var(--accent);margin:12px 0 6px;text-align:left}
.p2-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px}.p2-a{text-align:left;padding:8px;border:1px solid var(--line);background:rgba(255,255,255,.03);opacity:.55;font:inherit;color:var(--ink)}.p2-a.got,.p2-buy{opacity:1}.p2-a.got{border-color:rgba(93,255,122,.5)}
.p2-a i{display:block;height:34px;background-size:cover;background-position:center;margin-bottom:6px;filter:grayscale(1)}.p2-a.got i{filter:none}.p2-a b{display:block;font-size:12px;letter-spacing:.14em}.p2-a span{display:block;font-size:10px;color:var(--dim)}.p2-a small{font-size:9px;letter-spacing:.2em;color:var(--accent)}
.p2-buy{pointer-events:auto;cursor:pointer}.p2-row{display:flex;flex-wrap:wrap;gap:6px}.p2-s{pointer-events:auto;cursor:pointer;display:flex;align-items:center;gap:6px;padding:7px 10px;border:1px solid var(--line);background:rgba(255,255,255,.03);color:var(--ink);font:inherit}.p2-s.on{border-color:var(--accent);background:rgba(224,180,74,.14)}.p2-s.off{opacity:.4}
.p2-s i{display:inline-block;width:18px;height:18px;font-style:normal;font-size:16px;line-height:18px}.p2-s b{font-size:11px;letter-spacing:.14em}.p2-s span{font-size:9px;color:var(--dim)}#p2Heat{display:block;margin:10px auto;max-width:100%;border:1px solid var(--line)}`;
  document.head.appendChild(s);
})();
