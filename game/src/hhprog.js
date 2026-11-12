/* ================================================================== HOTBOX HORDE progress and social (1.2.111, the owner's list F = 45-52)
   45 THE HORDE TRACK: 50 tiers of rewards from playing HORDE (s.tx XP: missions, raids, harvests, sales, building).
   46 HORDE TROPHIES in the TROPHIES screen (counters hh*, each with its calling card).
   47 THE COLLECTION BOOK (s.col): every burnout, strain, trap and gun you have found; $1,000 for a full page.
   48 BASE LIKES: a friend visiting your HOMESTEAD presses L (pad D-PAD DOWN) to like it; s.likes is on the leaderboard.
   49 TRADING: in co-op, GIVE materials, seeds or buds to a friend (presence gv, deduped by seq).
   50 CO-OP LOBBY: READY CHECK (rc / rd), KICK (kick), and pings shared in co-op games (pg).
   51 SEASONS: WINTER HARVEST (Dec-Feb: snow, frost burnouts, FROSTY OG seeds) and SUMMER FESTIVAL (Jun-Aug: fireflies,
      festival burnouts, SUNSHINE HAZE seeds; sold for 50% more while it runs). HHS.force picks one for tests.
   52 HOMESTEAD PRESTIGE (s.hpres, up to 5): at base level 5, start again from level 1 for +10% sale prices and +10%
      materials for good, and a star on the leaderboard. Pieces outside the new edge come back as half their materials. */
const HHP = { gvSeen: {}, rdSeen: {}, pgSeq: 0, gvSeq: 0, likedGid: 0 };
HC.extra = HC.extra || {};
/* ---------- 45 the track */
const HHP_TIERS = 50, HHP_XPT = 1000;
const HHP_REW = (() => { const L = [], seeds = ['haze', 'blue', 'north', 'milk']; for (let t = 1; t <= HHP_TIERS; t++) {
  if (t % 10 === 0) L.push({ k: 'outfit', id: 'out' + t / 10, n: ['DIRT FARMER', 'NEON BLOOM', 'NIGHT SHIFT', 'GOLDEN LEAF', 'THE OVERGROWER'][t / 10 - 1] + ' OUTFIT' });
  else if (t % 5 === 0) L.push({ k: 'seed', id: seeds[(t / 5 - 1) % 4], n: 3 });
  else if (t % 3 === 0) L.push({ k: 'trap', id: ['spikes', 'zapper', 'resin', 'launcher'][(t / 3) % 4], n: 2 + (t / 15 | 0) });
  else if (t % 2 === 0) L.push({ k: 'mat', id: ['scrap', 'wire', 'battery', 'nutri', 'sap'][(t / 2) % 5], n: 6 + t });
  else L.push({ k: 'cash', n: 300 + t * 60 }); } return L; })();
const hhpTier = s => Math.min(HHP_TIERS, Math.floor((s.tx | 0) / HHP_XPT));
const hhpRewTxt = w => w.k === 'cash' ? `$${w.n.toLocaleString()}` : w.k === 'seed' ? `${w.n} ${HH_STR(w.id).n} SEEDS` : w.k === 'trap' ? `${w.n} ${HH_TRAPS[w.id].n}S` : w.k === 'mat' ? `${w.n} ${HH_ALLN(w.id)}` : w.n;
function hhpXP(s, n, why) { const t0 = hhpTier(s); s.tx = (s.tx | 0) + Math.round(n); const t1 = hhpTier(s); if (t1 > t0 && M && M.hh && M.hh.s === s) try { showBanner(`HORDE TRACK · TIER ${t1}`, `${hhpRewTxt(HHP_REW[t1 - 1])} · claim it in the lobby`); sfx.streak(); } catch (e) {} }
function hhpClaim(s) { s.tclaim = s.tclaim | 0; const got = []; while (s.tclaim < hhpTier(s)) { const w = HHP_REW[s.tclaim]; s.tclaim++; got.push(hhpRewTxt(w));
    if (w.k === 'cash') s.cash += w.n; else if (w.k === 'seed') s.seeds[w.id] = (s.seeds[w.id] | 0) + w.n; else if (w.k === 'trap') s.traps[w.id] = (s.traps[w.id] | 0) + w.n; else if (w.k === 'mat') s.inv[w.id] = (s.inv[w.id] | 0) + w.n; else if (w.k === 'outfit') { s.outfits = s.outfits || {}; s.outfits[w.id] = 1; } }
  return got; }
function hhpTrack() {
  const s = hhLoad(), t = hhpTier(s), o = document.createElement('div'); o.className = 'onb-ov'; o.id = 'hhpTr';
  const row = (w, i) => `<div class="hhp-t${i < (s.tclaim | 0) ? ' got' : i < t ? ' rdy' : ''}"><small>${i + 1}</small><b>${hhpRewTxt(w)}</b></div>`;
  o.innerHTML = `<div class="onb-box hh-mbox"><small>HOTBOX HORDE</small><h2 style="margin:0">THE HORDE TRACK · TIER ${t} / ${HHP_TIERS}</h2><span>${(s.tx | 0) % HHP_XPT} / ${HHP_XPT} XP to the next tier · missions, raids, harvests, sales and building all count</span><div class="hhp-grid">${HHP_REW.map(row).join('')}</div>
<div class="onb-acts">${t > (s.tclaim | 0) ? `<button class="btn primary" data-hp="claim">CLAIM ${t - (s.tclaim | 0)}</button>` : ''}<button class="btn" data-close data-hp="x">CLOSE</button></div></div>`;
  document.body.appendChild(o);
  o.addEventListener('click', e => { const b = e.target.closest('[data-hp]'); if (!b) return; try { sfx.ui(); } catch (er) {} if (b.dataset.hp === 'claim') { const s2 = hhLoad(), got = hhpClaim(s2); hhSave(s2); try { showBanner('CLAIMED', got.slice(0, 4).join(' · ') + (got.length > 4 ? ` · +${got.length - 4} MORE` : '')); } catch (er) {} } o.remove(); hhRender(); });
  setTimeout(() => { const b = o.querySelector('[data-hp]'); if (b) b.focus(); }, 40);
}
/* ---------- 46 trophies */
const HHP_ACH = [['hh1', 'FIRST HARVEST', 'Win a HOTBOX HORDE mission', 'hhw', 1], ['hh25', 'GREEN THUMB', 'Win 25 HORDE missions', 'hhw', 25], ['hhk1k', 'WEED WHACKER', 'Take down 1,000 burnouts', 'hhk', 1000],
  ['hhboss', 'OVERGROWN NO MORE', 'Beat THE OVERGROWN', 'hhboss', 1], ['hhcook', 'WELL DONE', 'Win a mission on COOKED', 'hhcook', 1], ['hhlv5', 'LAND BARON', 'Get THE HOMESTEAD to level 5', 'hhlv', 5],
  ['hhcash', 'CASH CROP', 'Earn $100,000 in HORDE', 'hhcash', 100000], ['hhgrow', 'HARVEST MOON', 'Harvest 100 plants', 'hhgrown', 100], ['hhbuild', 'MASTER BUILDER', 'Build 500 pieces', 'hhbuilt', 500],
  ['hhcoop', 'BETTER TOGETHER', 'Win a HORDE mission in co-op', 'hhcoop', 1], ['hhpres', 'FRESH SOIL', 'Prestige THE HOMESTEAD', 'hhpres', 1], ['hhbook', 'COLLECTOR', 'Fill a page of the COLLECTION BOOK', 'hhbook', 1]];
for (const [id, n, d, k, v] of HHP_ACH) { const a = { id, n, d, k, v, secret: false }; ACH.splice(ACH.length - 1, 0, a); const c = ['#9adf5a', '#c070ff', '#ffb84a'][ACH.length % 3], it = { id: 'ach_' + id, name: n, kind: 'banner', r: v >= 100 ? 3 : v >= 5 ? 2 : 1, ach: 1, g: { t: 'rays', c: ['#0b1410', c, '#1a2a1a'], em: ['leaf', c, '#0b0c0d'] } }; COSM.push(it); COS[it.id] = it; }
function hhpAch(s) { try { achMax('hhlv', s.base.lv | 0); achMax('hhcash', s.earn | 0); achMax('hhgrown', s.grown | 0); achMax('hhbuilt', s.built | 0); achMax('hhw', s.wins | 0); achMax('hhk', s.kills | 0); achMax('hhpres', s.hpres | 0); } catch (e) {} }
/* ---------- 47 the collection book */
const hhpCol = s => (s.col = Object.assign({ mob: {}, strain: {}, trap: {}, gun: {} }, s.col));
const HHP_PAGES = () => [['mob', 'BURNOUTS', Object.keys(HH_KINDS).map(k => [k, HH_KINDS[k].n])], ['strain', 'STRAINS', HH_STRAINS.map(x => [x.id, x.n])], ['trap', 'TRAPS', Object.keys(HH_TRAPS).map(k => [k, HH_TRAPS[k].n])], ['gun', 'GUNS', HH_GUNS.map(g => [g.id, g.n])]];
function hhpColScan(s) {
  const c = hhpCol(s); let nw = 0; const mark = (pg, id) => { if (!c[pg][id]) { c[pg][id] = 1; nw++; } };
  for (const x of HH_STRAINS) if ((s.seeds[x.id] | 0) > 0 || (s.buds[x.id] | 0) > 0) mark('strain', x.id);
  for (const k in HH_TRAPS) if ((s.traps[k] | 0) > 0) mark('trap', k);
  for (const g of s.arsenal || []) mark('gun', g.id);
  s.colPaid = s.colPaid || {}; for (const [pg, n, items] of HHP_PAGES()) if (!s.colPaid[pg] && items.every(([id]) => c[pg][id])) { s.colPaid[pg] = 1; s.cash += 1000; try { achAdd('hhbook'); if (M && M.hh) showBanner(`COLLECTION · ${n} PAGE DONE`, '+$1,000'); } catch (e) {} }
  return nw;
}
function hhpBook() {
  const s = hhLoad(), c = hhpCol(s), o = document.createElement('div'); o.className = 'onb-ov'; o.id = 'hhpBook';
  o.innerHTML = `<div class="onb-box hh-mbox"><small>HOTBOX HORDE</small><h2 style="margin:0">THE COLLECTION BOOK</h2>${HHP_PAGES().map(([pg, n, items]) => { const got = items.filter(([id]) => c[pg][id]).length; return `<div class="hhp-pg"><b>${n} · ${got} / ${items.length}${s.colPaid && s.colPaid[pg] ? ' · DONE' : ''}</b><div>${items.map(([id, nm]) => `<span class="${c[pg][id] ? 'on' : ''}"${pg === 'mob' && c[pg][id] ? ` style="--c:${hhqCol(id)}"` : ''}>${c[pg][id] ? (pg === 'mob' ? hhqShape(id) + ' ' : '') + nm : '? ? ?'}</span>`).join('')}</div></div>`; }).join('')}<span>a full page pays $1,000</span><div class="onb-acts"><button class="btn" data-close>CLOSE</button></div></div>`;
  document.body.appendChild(o); o.querySelector('[data-close]').onclick = () => { try { sfx.ui(); } catch (e) {} o.remove(); }; setTimeout(() => o.querySelector('[data-close]').focus(), 40);
}
/* ---------- 52 prestige bonuses */
const hhpPresK = () => { const H = M && M.hh, s = H ? H.s : null; return 1 + 0.1 * Math.min(5, (s ? s.hpres : 0) | 0); };
const _hhpPrice = hhPrice;
hhPrice = function (id) { let p = _hhpPrice.apply(this, arguments); p = Math.round(p * hhpPresK()); if (hhpSeason() === 'summer' && id === 'sun') p = Math.round(p * 1.5); return p; };
const _hhpGive = hhGive;
hhGive = function (k, n) { if (HH_MATS.includes(k)) n = Math.round(n * hhpPresK()); return _hhpGive.call(this, k, n); };
function hhpPrestige() {
  const s = hhLoad(); if ((s.base.lv | 0) < 5) return 'THE HOMESTEAD HAS TO BE LEVEL 5'; if ((s.hpres | 0) >= 5) return 'ALREADY AT THE TOP PRESTIGE';
  const R = HH_BASELV[0].r, back = {}; s.base.pieces = s.base.pieces.filter(rec => { if (Math.max(Math.abs(rec.ix), Math.abs(rec.iz)) <= R) return true; const m = rec.mat; if (m && HH_MAT[m]) back[m] = (back[m] | 0) + 4; return false; });
  for (const k in back) s.inv[k] = (s.inv[k] | 0) + back[k]; s.base.lv = 1; s.hpres = (s.hpres | 0) + 1; s.cash = Math.round(s.cash * 0.5); hhSave(s); hhpAch(s); return '';
}
/* ---------- 51 seasons */
const HHS = { force: null, fx: null };
const hhpSeason = () => { if (HHS.force !== null) return HHS.force; const m = new Date().getMonth(); return m === 11 || m <= 1 ? 'winter' : m >= 5 && m <= 7 ? 'summer' : ''; };
HH_STRAINS.push({ id: 'frost', n: 'FROSTY OG', min: 12, yld: 6, price: 160, seed: 0, col: 0xbfe8ff, ev: 'winter' }, { id: 'sun', n: 'SUNSHINE HAZE', min: 12, yld: 6, price: 140, seed: 0, col: 0xffd84a, ev: 'summer' });
function hhpSeasonFx(H) {
  const ev = hhpSeason(); if (HHS.fx && (HHS.fx.parent !== H.grp || HHS.fx.userData.ev !== ev)) { if (HHS.fx.parent) HHS.fx.parent.remove(HHS.fx); HHS.fx = null; } if (!ev) return;
  if (!HHS.fx) { const n = ev === 'winter' ? 700 : 160, pos = new Float32Array(n * 3); for (let i = 0; i < n; i++) { pos[i * 3] = rnd(-30, 30); pos[i * 3 + 1] = rnd(0, 14); pos[i * 3 + 2] = rnd(-30, 30); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    HHS.fx = new THREE.Points(g, new THREE.PointsMaterial({ color: ev === 'winter' ? 0xffffff : 0xfff07a, size: ev === 'winter' ? 0.09 : 0.12, transparent: true, opacity: ev === 'winter' ? 0.85 : 0.9, depthWrite: false })); HHS.fx.userData.ev = ev; HHS.fx.frustumCulled = false; H.grp.add(HHS.fx); }
  const a = HHS.fx.geometry.attributes.position, d = 1 / 60; HHS.fx.position.set(P.x, 0, P.z);
  for (let i = 0; i < a.count; i++) { if (ev === 'winter') { let y = a.getY(i) - 1.4 * d; if (y < 0) y += 14; a.setY(i, y); a.setX(i, a.getX(i) + Math.sin(NOW + i) * 0.004); } else { a.setY(i, 0.6 + 2 + Math.sin(NOW * 0.7 + i) * 1.5); a.setX(i, a.getX(i) + Math.cos(NOW * 0.5 + i * 3) * 0.01); } }
  a.needsUpdate = true; HHS.fx.material.opacity = ev === 'summer' ? 0.5 + 0.4 * Math.sin(NOW * 3) : 0.85;
}
const _hhpMob = hhMob;
hhMob = function (kind) { const e = _hhpMob.apply(this, arguments), ev = hhpSeason(); if (e && ev && !e.hcProx) { const c = new THREE.Color(ev === 'winter' ? 0x9ad8ff : 0xffb86a); e.group.traverse(o => { if (o.isMesh && o.material && o.material.color && !o.userData.hitbox && !o.isSprite) { o.material = o.material.clone(); o.material.color.lerp(c, 0.35); } }); e.season = ev; } return e; };
/* ---------- XP, trophies, the book: from the save and the end of a mission */
const _hhpSave = hhSave;
hhSave = function (s) {
  if (s && typeof s === 'object' && s.inv) { s.txs = s.txs || { g: s.grown | 0, so: s.sold | 0, b: s.built | 0 };
    const dg = (s.grown | 0) - s.txs.g, ds = (s.sold | 0) - s.txs.so, db = (s.built | 0) - s.txs.b; if (dg > 0 || ds > 0 || db > 0) hhpXP(s, Math.max(0, dg) * 25 + Math.max(0, ds) / 40 + Math.max(0, db) * 3);
    s.txs = { g: s.grown | 0, so: s.sold | 0, b: s.built | 0 }; hhpColScan(s); hhpAch(s); }
  return _hhpSave.apply(this, arguments);
};
const _hhpEnd = hhEnd;
hhEnd = function (won) {
  const H = M && M.hh, first = H && !H.over; const r = _hhpEnd.apply(this, arguments); if (!first || !H) return r; const s = H.s;
  hhpXP(s, won ? 250 + 150 * H.di : 80); if (won) { if (H.di >= 3) achAdd('hhcook'); if (HC.on && HC.inGame) achAdd('hhcoop'); const ev = hhpSeason(); if (ev) { const id = ev === 'winter' ? 'frost' : 'sun', n = 1 + (Math.random() < 0.5 ? 1 : 0); s.seeds[id] = (s.seeds[id] | 0) + n; if (H.res && H.res.pay) H.res.pay['seed:' + id] = n; } }
  hhSave(s); return r;
};
const _hhpRaid = hhRaidEnd;
hhRaidEnd = function (won) { const H = M && M.hh, r = _hhpRaid.apply(this, arguments); if (H && won) { hhpXP(H.s, 400 + 100 * H.s.base.lv); hhSave(H.s); } return r; };
const _hhpDmg = damageEnemy;
damageEnemy = function (e) {
  const was = e && e.hhMob && enemies.includes(e), r = _hhpDmg.apply(this, arguments);
  if (was && !enemies.includes(e) && M && M.hh && !e.hcProx) { const s = M.hh.s, c = hhpCol(s); if (!c.mob[e.hk]) { c.mob[e.hk] = 1; try { showMsg(`NEW IN THE COLLECTION BOOK · ${(HH_KINDS[e.hk] || {}).n}`); } catch (er) {} } if (e.K && e.K.boss) achAdd('hhboss'); }
  return r;
};
/* ---------- 48-50 co-op: likes, gifts, ready checks, kicks, pings */
function hcExtraRead(R, pr) {
  const host = hcHost();
  if (host && pr.lk && pr.lk === HC.gid && M && M.hh && M.hh.base && !R.liked) { R.liked = HC.gid; const s = M.hh.s; s.likes = (s.likes | 0) + 1; hhSave(s); try { showBanner(`${R.n} LIKED YOUR BASE`, `${s.likes} like${s.likes > 1 ? 's' : ''} so far`); sfx.pickup(); } catch (e) {} }
  if (Array.isArray(pr.gv)) for (const g of pr.gv) { const seq = g[0] | 0; if (g[1] !== HC.me || seq <= (HHP.gvSeen[R.peer] | 0)) continue; HHP.gvSeen[R.peer] = seq; const k = String(g[2]), n = clamp(g[3] | 0, 1, 1000), s = HH.cur ? HH.cur.s : hhLoad();
    if (k.startsWith('seed:')) { const id = k.slice(5); if (!HH_STRAINS.some(x => x.id === id)) continue; s.seeds[id] = (s.seeds[id] | 0) + n; } else if (k.startsWith('bud:')) { const id = k.slice(4); if (!HH_STRAINS.some(x => x.id === id)) continue; s.buds[id] = (s.buds[id] | 0) + n; } else if (HH_MAT[k] || HH_CMAT[k]) s.inv[k] = (s.inv[k] | 0) + n; else continue;
    if (!(HH.cur && HH.cur.noSave)) hhSave(s); try { showBanner(`${R.n} SENT YOU A GIFT`, `${n} ${k.includes(':') ? HH_STR(k.split(':')[1]).n + (k.startsWith('seed') ? ' SEEDS' : ' BUDS') : HH_ALLN(k)}`); sfx.pickup(); } catch (e) {} if (HHL.on && curScreen === 'lobby') hhRender(); }
  if (!host && R.ho) { if ((pr.rc | 0) > (HHP.rcSeen | 0)) { HHP.rcSeen = pr.rc | 0; HHP.rcOpen = pr.rc | 0; try { showMsg('READY CHECK · PRESS READY IN THE CO-OP BOX'); tone(880, 0.12, 0.06, 'triangle', 1100); } catch (e) {} if (HHL.on && curScreen === 'lobby') hhRender(); }
    if (Array.isArray(pr.kick) && pr.kick.includes(HC.me)) { hcLeave(); HC.err = 'THE HOST TOOK YOU OUT OF THE GAME'; try { showMsg(HC.err); if (HHL.on && curScreen === 'lobby') hhRender(); } catch (e) {} return; } }
  if (host && (pr.rd | 0) && (pr.rd | 0) === (HC.extra.rc | 0) && HHP.rdSeen[R.peer] !== pr.rd) { HHP.rdSeen[R.peer] = pr.rd; if (HHL.on && curScreen === 'lobby') hhRender(); }
  if (Array.isArray(pr.pg) && HC.inGame && R.inGame) { const seq = pr.pg[0] | 0, key = 'hc' + R.peer; if ((PING.seen[key] | 0) < seq) { PING.seen[key] = seq; const kind = PING_ORDER[pr.pg[1] | 0]; if (kind) try { pingAdd({ kind, x: +pr.pg[2], y: +pr.pg[3], z: +pr.pg[4] }, R.n, true); pingTone(kind); } catch (e) {} } }
}
const _hhgPing = pingAdd;
pingAdd = function (o, who) { const p = _hhgPing.apply(this, arguments); if (p && who === 'me' && HC.on && HC.inGame && M && M.mode === 'hh') { HHP.pgSeq++; HC.extra.pg = [HHP.pgSeq, Math.max(0, PING_ORDER.indexOf(o.kind)), Math.round(o.x * 100) / 100, Math.round((o.y || 0) * 100) / 100, Math.round(o.z * 100) / 100]; } return p; };
function hhpLike() { const H = M && M.hh; if (!H || !H.client || !H.base || !HC.on) return; if (HHP.likedGid === HC.gid) { showMsg('YOU ALREADY LIKED THIS BASE'); return; } HHP.likedGid = HC.gid; HC.extra.lk = HC.gid; try { showMsg('YOU LIKED THIS BASE'); tone(988, 0.12, 0.05, 'triangle', 1480); } catch (e) {} }
addEventListener('keydown', e => { if (e.code === 'KeyL' && !e.repeat && M && M.hh && M.hh.client && M.hh.base && G.state === 'playing' && !curScreen) { e.stopImmediatePropagation(); hhpLike(); } }, true);
const _hhpPad = hhPadTick;
hhPadTick = function () { const was = HHP.padD; let gp = null; try { gp = (navigator.getGamepads ? [...navigator.getGamepads()] : []).find(g => g && g.connected); } catch (e) {} HHP.padD = !!(gp && gp.buttons[13] && gp.buttons[13].pressed); if (HHP.padD && !was && M && M.hh && M.hh.client && M.hh.base && !HH.build) hhpLike(); return _hhpPad.apply(this, arguments); };
function hhpGive(peer, k, n) {
  const s = hhLoad(); let have = 0; if (k.startsWith('seed:')) have = s.seeds[k.slice(5)] | 0; else if (k.startsWith('bud:')) have = s.buds[k.slice(4)] | 0; else have = s.inv[k] | 0;
  n = Math.min(n, have); if (n <= 0) return 'YOU HAVE NONE OF THAT';
  if (k.startsWith('seed:')) s.seeds[k.slice(5)] -= n; else if (k.startsWith('bud:')) s.buds[k.slice(4)] -= n; else s.inv[k] -= n; hhSave(s);
  HHP.gvSeq++; const L = (HC.extra.gv = (HC.extra.gv || []).concat([[HHP.gvSeq, peer, k, n]])); while (L.length > 8) L.shift(); return '';
}
/* ---------- the lobby: rows, and the co-op box extras */
const _hhpRender = hhRender;
hhRender = function () {
  const r = _hhpRender.apply(this, arguments); if (!HHL.on) return r; const sel = $('lobSel'), s = hhLoad(); if (!sel) return r; const t = hhpTier(s), c = hhpCol(s), ev = hhpSeason();
  const tot = HHP_PAGES().reduce((a, [pg, n, it]) => a + it.length, 0), got = HHP_PAGES().reduce((a, [pg, n, it]) => a + it.filter(([id]) => c[pg][id]).length, 0);
  sel.insertAdjacentHTML('afterbegin', ev ? `<div class="cod-row wide hhp-ev ${ev}"><small>${ev === 'winter' ? 'WINTER HARVEST · DEC - FEB' : 'SUMMER FESTIVAL · JUN - AUG'}</small><b>${ev === 'winter' ? 'FROST BURNOUTS · FROSTY OG SEEDS' : 'FESTIVAL BURNOUTS · SUNSHINE HAZE SEEDS · SELLS FOR 50% MORE'}</b><span>every mission win drops event seeds</span></div>` : '');
  sel.insertAdjacentHTML('beforeend', `<div class="cod-row hhp-row"><small>THE HORDE TRACK · ${(s.tx | 0) % HHP_XPT} / ${HHP_XPT} XP</small><b>TIER ${t} / ${HHP_TIERS}${t > (s.tclaim | 0) ? ` · <span style="color:#7aff6a">${t - (s.tclaim | 0)} TO CLAIM</span>` : ''}</b><span>next: ${t < HHP_TIERS ? hhpRewTxt(HHP_REW[t]) : 'all done'}</span><div class="arw"><button class="mini" data-act="hhp-track">OPEN</button></div></div>` +
    `<div class="cod-row hhp-row"><small>COLLECTION BOOK</small><b>${got} / ${tot} FOUND</b><span>burnouts, strains, traps, guns</span><div class="arw"><button class="mini" data-act="hhp-book">OPEN</button></div></div>` +
    `<div class="cod-row wide hhp-row"><small>HOMESTEAD PRESTIGE ${'★'.repeat(s.hpres | 0)}${'☆'.repeat(5 - (s.hpres | 0))}</small><b>${(s.hpres | 0) ? `+${(s.hpres | 0) * 10}% SALES AND MATERIALS` : 'NOT YET'} · ${s.likes | 0} LIKE${(s.likes | 0) === 1 ? '' : 'S'}</b><span>at base level 5: start the base again from level 1 for +10% for good (keeps half your cash)</span><div class="arw"><button class="mini" data-act="hhp-pres"${(s.base.lv | 0) >= 5 && (s.hpres | 0) < 5 ? '' : ' disabled'}>PRESTIGE</button></div></div>`);
  const b = $('hcBox'); if (b && HC.on) { const peers = [...HC.rem.values()].filter(R => R.n);
    let x = ''; if (hcHost() && peers.length) x += `<div class="hcx"><small>FRIENDS</small>${peers.map(R => `<div class="hcx-p"><b>${R.n}</b>${HC.extra.rc ? `<i class="${HHP.rdSeen[R.peer] === HC.extra.rc ? 'ok' : ''}">${HHP.rdSeen[R.peer] === HC.extra.rc ? 'READY' : 'NOT READY'}</i>` : ''}<button class="mini" data-hcx="kick:${R.peer}">KICK</button></div>`).join('')}<div class="cc-row"><button class="btn" data-hcx="rc">READY CHECK</button></div></div>`;
    if (!hcHost() && HHP.rcOpen && HHP.rcOpen !== HC.extra.rd) x += `<div class="cc-row"><button class="btn primary" data-hcx="rd">READY</button></div>`;
    if (peers.length) { const items = [...HH_MATS, ...HH_CMATS].filter(k => (s.inv[k] | 0) > 0).map(k => [k, HH_ALLN(k), s.inv[k] | 0]).concat(HH_STRAINS.filter(x => (s.seeds[x.id] | 0) > 0).map(x => ['seed:' + x.id, x.n + ' SEEDS', s.seeds[x.id]]), HH_STRAINS.filter(x => (s.buds[x.id] | 0) > 0).map(x => ['bud:' + x.id, x.n + ' BUDS', s.buds[x.id]]));
      HHP.gTo = peers.some(R => R.peer === HHP.gTo) ? HHP.gTo : peers[0].peer; HHP.gK = items.some(i => i[0] === HHP.gK) ? HHP.gK : (items[0] || [''])[0]; HHP.gN = HHP.gN || 10; const it = items.find(i => i[0] === HHP.gK);
      x += `<div class="hcx"><small>GIVE</small><div class="cc-row"><button class="mini" data-hcx="to">TO ${(peers.find(R => R.peer === HHP.gTo) || {}).n}</button><button class="mini" data-hcx="item">${it ? `${it[1]} (${it[2]})` : 'NOTHING TO GIVE'}</button><button class="mini" data-hcx="n">×${HHP.gN}</button><button class="mini" data-hcx="give"${it ? '' : ' disabled'}>SEND</button></div>${HHP.gMsg ? `<small>${HHP.gMsg}</small>` : ''}</div>`;
      HHP.gItems = items; }
    b.insertAdjacentHTML('beforeend', x);
    for (const q of b.querySelectorAll('[data-hcx]')) q.onclick = () => { try { sfx.ui(); } catch (e) {} const a = q.dataset.hcx;
      if (a === 'rc') { HC.extra.rc = (HC.extra.rc | 0) + 1; HHP.rdSeen = {}; } else if (a === 'rd') { HC.extra.rd = HHP.rcOpen; HHP.rcOpen = 0; }
      else if (a.startsWith('kick:')) { const id = a.slice(5); HC.extra.kick = (HC.extra.kick || []).concat([id]).slice(-6); }
      else if (a === 'to') { const i = peers.findIndex(R => R.peer === HHP.gTo); HHP.gTo = peers[(i + 1) % peers.length].peer; }
      else if (a === 'item') { const L = HHP.gItems || [], i = L.findIndex(v => v[0] === HHP.gK); HHP.gK = L.length ? L[(i + 1) % L.length][0] : ''; }
      else if (a === 'n') HHP.gN = HHP.gN === 10 ? 50 : HHP.gN === 50 ? 100 : HHP.gN === 100 ? 1 : 10;
      else if (a === 'give') { const err = hhpGive(HHP.gTo, HHP.gK, HHP.gN); HHP.gMsg = err || `SENT ${HHP.gN} TO ${(peers.find(R => R.peer === HHP.gTo) || {}).n}`; }
      hhRender(`[data-hcx="${a}"]`); };
  }
  return r;
};
const _hhpAct = hhAct;
hhAct = function (act) {
  if (!/^hhp-/.test(act) || !HHL.on) return _hhpAct.apply(this, arguments); try { sfx.ui(); } catch (e) {}
  if (act === 'hhp-track') hhpTrack(); else if (act === 'hhp-book') hhpBook();
  else if (act === 'hhp-pres') { const o = onbCard(`<small style="letter-spacing:.3em;color:#ffd24a">HOMESTEAD PRESTIGE</small><h2 style="margin:0">START AGAIN FROM LEVEL 1?</h2><span>THE HOMESTEAD goes back to level 1 (raid your way up again). Pieces outside the level 1 edge come back as half their materials. You keep half your cash, all your seeds, buds, traps and guns. For good: +10% on sales and materials, and a star.</span><div class="onb-acts"><button class="btn primary" data-onb="go">PRESTIGE</button><button class="btn" data-onb="x">NOT NOW</button></div>`, { go: () => { const err = hhpPrestige(); try { showBanner(err ? 'NOT YET' : 'HOMESTEAD PRESTIGE', err || 'fresh soil · +10% for good'); } catch (e) {} hhRender(); } }, false); }
  return true;
};
// every frame: the season, the visit's like prompt
const _hhpTick = hhTick;
hhTick = function (dt) { const r = _hhpTick.apply(this, arguments), H = M && M.hh; if (!H) return r; try { hhpSeasonFx(H); if (H.client && H.base && HHP.likedGid !== HC.gid && (HHP.lkT = (HHP.lkT || 0) - dt) <= 0) { HHP.lkT = 20; showMsg(`LIKE THIS BASE? PRESS ${usingPad() ? 'D-PAD DOWN' : 'L'}`); } } catch (e) {} return r; };
const _hhpClr = hhClear; hhClear = function () { HHS.fx = null; return _hhpClr.apply(this, arguments); };
(() => { const s = document.createElement('style'); s.textContent = `.hhp-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:4px;max-height:52vh;overflow:auto}.hhp-t{padding:6px 7px;border:1px solid var(--line);background:rgba(0,0,0,.3);font-size:10px}.hhp-t small{display:block;color:var(--dim)}.hhp-t.rdy{border-color:#7aff6a;box-shadow:0 0 8px rgba(122,255,106,.35)}.hhp-t.got{opacity:.45}.hhp-t.got b:after{content:' ✓';color:#7aff6a}
.hhp-pg{margin:6px 0}.hhp-pg b{display:block;letter-spacing:.2em;font-size:11px;color:#c8a0ff;margin-bottom:4px}.hhp-pg div{display:flex;flex-wrap:wrap;gap:4px}.hhp-pg span{font-size:10px;padding:3px 7px;border:1px solid rgba(255,255,255,.1);color:var(--dim)}.hhp-pg span.on{color:#fff;border-color:var(--c,#7aff6a)}
.hhp-ev.winter{border-color:#9ad8ff!important;background:linear-gradient(90deg,rgba(154,216,255,.18),transparent)!important}.hhp-ev.summer{border-color:#ffd24a!important;background:linear-gradient(90deg,rgba(255,210,74,.18),transparent)!important}
.hcx{margin-top:8px}.hcx>small{display:block;font-size:9px;letter-spacing:.3em;color:var(--dim)}.hcx-p{display:flex;gap:8px;align-items:center;margin-top:4px}.hcx-p b{flex:1;font-size:12px}.hcx-p i{font-style:normal;font-size:10px;color:#ff8a6a}.hcx-p i.ok{color:#7aff6a}`; document.head.appendChild(s); })();
