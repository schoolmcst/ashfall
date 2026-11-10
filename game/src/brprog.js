/* ================================================================== LAST TOKE PROGRESS, ITS OWN LOBBY, LOADOUT DROPS (1.2.93)
   STATS (ashfall.lt.v1): matches, wins, top 5s, kills, average place, best place, win streak (now / best), per team size.
     The LAST TOKE lobby shows them; STATS opens the full page.
   PLACEMENT XP: on the results, +60 XP for every place above 17th, +1500 for the win, +150 for each squadmate still
     standing at the end.
   DAILY CHALLENGES: three a day (the same for everyone on a date), +2500 XP each: land somewhere and get kills, kills,
     kills with an EPIC+ gun, open a vault, top 5, harvest plants, ride the train, use heals, ride a balloon, re-up a mate.
   THE CROWN: win a round and you start the next one crowned (a gold crown over your head for everyone online, and on
     your HUD); it stays while the streak lasts.
   FLOAT TRAILS: the smoke you float in on - CLASSIC (start), PURPLE HAZE (5 rounds), GOLD (a win), GREEN KUSH (10 top
     5s), RAINBOW (3 wins). Pick it in the LAST TOKE lobby.
   THE VICTORY DANCE: win offline and you dance on THE HOTBOX CLOUD before the results.
   THE KILL LEADER: whoever has the most kills (3+) is marked for everyone, on screen and on the map.
   FLOAT IN: a LANDING marker shows where you'll come down (on screen and on the map); diving is a bit faster.
   WARM-UP: pick the kind of gun you get (rifle, SMG, shotgun, sniper, LMG or random).
   THE CLOUD on STASH ISLAND: shorter waits for 16 players (~5 min instead of ~7).
   ITS OWN LOBBY: LAST TOKE is out of the multiplayer lobby and the playlist; the menu tile opens the LAST TOKE lobby
     (online or offline, solo / duos / squads, ranked, the loadout drop's class, the float trail, your stats, today's
     challenges).
   LOADOUT DROPS: $4,000 at a buy station: a crate falls next to you with the class you picked (your own guns and
     attachments, your equipment). */
const BRP = { place: 0, done: false, landPoi: null, killsAt: 0, kl: null, klSaid: false, dance: null, drop: null, warmCat: null };
const BRP_TRAILS = [
  { id: 'classic', n: 'CLASSIC', col: 0xf0fff2, need: () => true, how: 'from the start' },
  { id: 'purple', n: 'PURPLE HAZE', col: 0xc08aff, need: s => s.m >= 5, how: 'play 5 rounds' },
  { id: 'gold', n: 'GOLD', col: 0xffd25a, need: s => s.w >= 1, how: 'win a round' },
  { id: 'kush', n: 'GREEN KUSH', col: 0x5dff7a, need: s => s.t5 >= 10, how: '10 top-5 finishes' },
  { id: 'rainbow', n: 'RAINBOW', col: -1, need: s => s.w >= 3, how: 'win 3 rounds' },
];
const BRP_DAILY = [
  { k: 'land', n: p => `LAND AT ${p} AND GET 2 KILLS`, goal: 1 }, { k: 'kills', n: () => 'GET 6 KILLS IN LAST TOKE', goal: 6 }, { k: 'epic', n: () => 'GET 2 KILLS WITH AN EPIC OR LEGENDARY GUN', goal: 2 },
  { k: 'vault', n: () => 'OPEN A VAULT', goal: 1 }, { k: 'top5', n: () => 'FINISH IN THE TOP 5', goal: 1 }, { k: 'harvest', n: () => 'HARVEST 3 PLANTS', goal: 3 }, { k: 'train', n: () => 'RIDE THE BONG EXPRESS', goal: 1 },
  { k: 'heal', n: () => 'USE 4 HEALS', goal: 4 }, { k: 'balloon', n: () => 'FLOAT ON A WEED BALLOON', goal: 1 }, { k: 'reup', n: () => 'BRING A SQUADMATE BACK AT A RE-UP BEACON', goal: 1 },
];
/* ---------- the saved stats */
function brpLoad() { let s = null; try { s = JSON.parse(localStorage.getItem('ashfall.lt.v1') || 'null'); } catch (e) {} return Object.assign({ m: 0, w: 0, t5: 0, k: 0, d: 0, ps: 0, best: 0, streak: 0, bestStreak: 0, by: {}, trail: 'classic', cls: 0, daily: null }, s || {}); }
function brpSave(s) { try { localStorage.setItem('ashfall.lt.v1', JSON.stringify(s)); } catch (e) {} }
const brpTrail = () => { const s = brpLoad(), t = BRP_TRAILS.find(x => x.id === s.trail); return t && t.need(s) ? t : BRP_TRAILS[0]; };
function brpTrailCol() { const t = brpTrail(); return t.col >= 0 ? t.col : new THREE.Color().setHSL((NOW * 0.25) % 1, 0.9, 0.7).getHex(); }
// the round is over for me: count it (once)
function brpRecord(place) {
  if (BRP.done || !place) return; BRP.done = true; BRP.place = place; const s = brpLoad(), n = M.entries.length, sq = M.squad > 1 ? (M.squad === 2 ? 'duos' : 'squads') : 'solo';
  s.m++; s.k += M.me.kills | 0; s.d += place > 1 ? 1 : 0; s.ps += place; if (!s.best || place < s.best) s.best = place;
  if (place <= 5) s.t5++; if (place === 1) { s.w++; s.streak++; s.bestStreak = Math.max(s.bestStreak, s.streak); } else s.streak = 0;
  const b = s.by[sq] || (s.by[sq] = { m: 0, w: 0 }); b.m++; if (place === 1) b.w++;
  brpSave(s); if (place <= 5) brpEvt('top5');
  for (const t of BRP_TRAILS) if (t.need(s) && !(s.unl || []).includes(t.id)) { s.unl = (s.unl || []).concat(t.id); brpSave(s); if (t.id !== 'classic') try { showBanner('FLOAT TRAIL UNLOCKED', t.n); } catch (e) {} }
}
// placement XP rows (progMatchXP)
function brpXpRows() {
  if (!M || !M.br || !BRP.place) return []; const p = BRP.place, out = [[`PLACED #${p}`, Math.max(0, 17 - p) * 60]];
  if (p === 1) out.push(['LAST ONE STANDING', 1500]);
  if (M.squad > 1) { const n = enemies.filter(e => e.team === M.myTeam && e.entry && e.entry.alive !== false).length + (playerAlive() ? 1 : 0); if (n) out.push([`SQUAD STANDING ×${n}`, n * 150]); }
  return out;
}
/* ---------- daily challenges */
function brpDailyToday() {
  const s = brpLoad(), day = new Date().toISOString().slice(0, 10);
  if (!s.daily || s.daily.day !== day) {
    let h = 0; for (const c of day) h = (h * 31 + c.charCodeAt(0)) >>> 0; const pool = BRP_DAILY.slice(), pick = []; while (pick.length < 3) { h = (Math.imul(h, 1664525) + 1013904223) >>> 0; pick.push(pool.splice(h % pool.length, 1)[0]); }
    const pois = typeof STASH_POIS !== 'undefined' ? STASH_POIS.filter(p => p.name) : [{ name: 'OLD TOWN' }], poi = pois[h % pois.length].name;
    s.daily = { day, list: pick.map(c => ({ k: c.k, n: c.n(poi), goal: c.goal, poi, have: 0, done: false })) }; brpSave(s);
  }
  return s.daily;
}
function brpEvt(k, n = 1) {
  if (!M || !M.br) return; const s = brpLoad(); if (!s.daily || s.daily.day !== new Date().toISOString().slice(0, 10)) return;
  for (const c of s.daily.list) { if (c.k !== k || c.done) continue; c.have = Math.min(c.goal, c.have + n); if (c.have >= c.goal) { c.done = true; brpSave(s); brpXP(2500, 'DAILY CHALLENGE · ' + c.n); return; } }
  brpSave(s);
}
function brpXP(n, why) { try { const before = PROG.xp; PROG.xp = Math.min(XP_AT[MAXLVL], PROG.xp + n); grantLevels(before, PROG.xp); saveProg(); showBanner(`+${n.toLocaleString()} XP`, why); sfx.streak(); } catch (e) {} }
/* ---------- the victory dance (offline wins) */
const _brpEnd = endMatch;
endMatch = function (winner) {
  if (M && M.br && !M.online && winner === M.me && !BRP.danced && typeof brfStageBuild === 'function') { BRP.danced = true; brpRecord(1); brpDanceStart(() => _brpEnd(winner)); return; }
  return _brpEnd.apply(this, arguments);
};
function brpDanceStart(done) {
  try { brfCineEnd(true); } catch (e) {}
  const st = brfStageBuild(), r = cloneSoldier('scout'); if (r.gun) r.gun.visible = false; st.g.add(r.root); r.root.position.set(0, 0, 0.9);
  BRP.dance = { t: 0, st, r, done, puffs: [] }; for (const e of enemies) if (e.group) e.group.visible = false;
  document.body.classList.add('brcine'); const c = $('brCine'); if (c) { c.style.display = 'block'; c.querySelector('.skip').textContent = `${actName('jump')} · SKIP`; }
  try { brfCaption('LAST TOKE', 'winner winner, munchie dinner'); sfx.streak(); } catch (e) {}
}
// from updatePlayer: true while dancing
function brpDance(dt) {
  const D = BRP.dance; if (!D) return false; D.t += dt; const T = D.t, r = D.r, W = D.st.g.position;
  const b = Math.sin(T * 7) * 0.5 + 0.5; r.root.position.y = Math.abs(Math.sin(T * 7)) * 0.12; r.root.rotation.y = Math.sin(T * 1.5) * 0.8;
  r.armL.rotation.set(-2.6 + Math.sin(T * 7) * 0.4, 0, 0.3); r.armR.rotation.set(-2.6 + Math.cos(T * 7) * 0.4, 0, -0.3); r.elL.rotation.x = -0.4 * b; r.elR.rotation.x = -0.4 * (1 - b);
  r.torso.rotation.set(0.05, Math.sin(T * 3.5) * 0.25, Math.sin(T * 7) * 0.08); r.head.rotation.set(-0.2, Math.sin(T * 3.5) * 0.3, 0); r.legL.rotation.x = Math.sin(T * 7) * 0.3; r.legR.rotation.x = -Math.sin(T * 7) * 0.3;
  if (Math.random() < dt * 14) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.smoke, color: new THREE.Color().setHSL(Math.random(), 0.8, 0.7), transparent: true, opacity: 0.8, depthWrite: false })); s.position.set(W.x + rnd(-3, 3), W.y + rnd(2, 4), W.z + rnd(-3, 3)); s.scale.setScalar(rnd(0.4, 0.9)); scene.add(s); D.puffs.push(s); }
  for (const s of D.puffs) { s.position.y -= dt * 0.8; s.material.opacity = Math.max(0, s.material.opacity - dt * 0.25); }
  const a = T * 0.45; camera.position.set(W.x + Math.cos(a) * 4.2, W.y + 1.9, W.z + 0.9 + Math.sin(a) * 4.2); camera.lookAt(W.x, W.y + 1.1, W.z + 0.9);
  if (Math.abs(camera.fov - 55) > 0.05) { camera.fov = 55; camera.updateProjectionMatrix(); }
  try { const g = gunObjs[G.cur]; if (g) g.visible = false; } catch (e) {}
  const skip = kb('jump') || pad.jump; if (!skip) D.armed = true;
  if (T > 7 || (D.armed && skip && T > 0.6)) { BRP.dance = null; for (const s of D.puffs) scene.remove(s); if (D.st.g.parent) D.st.g.parent.remove(D.st.g); document.body.classList.remove('brcine'); const c = $('brCine'); if (c) c.style.display = 'none'; camera.fov = baseFov; camera.updateProjectionMatrix(); try { D.done(); } catch (e) { reportError(e); } }
  return true;
}
/* ---------- warm-up: pick your gun */
const BRP_CATS = [['ar', 'RIFLE'], ['smg', 'SMG'], ['sg', 'SHOTGUN'], ['sr', 'SNIPER'], ['lmg', 'LMG'], [null, 'RANDOM']];
function brpWarmPick() {
  if ($('brPick') || !M || !M.br) return; const o = document.createElement('div'); o.id = 'brPick'; o.className = 'onb-ov br-pick';
  o.innerHTML = `<div class="onb-box"><small>WARM-UP</small><b>PICK YOUR GUN</b><div class="onb-tiles">${BRP_CATS.map((c, i) => `<button class="onb-t${BRP.warmCat === c[0] ? ' on' : ''}" data-wp="${i}"><b>${c[1]}</b></button>`).join('')}</div><button class="btn" data-close="1">KEEP IT</button></div>`;
  document.body.appendChild(o); G.menuOpen = true; try { document.exitPointerLock && document.exitPointerLock(); } catch (e) {}
  const close = () => { o.remove(); G.menuOpen = false; try { if (G.state === 'playing') lockPointer(); } catch (e) {} };
  for (const b of o.querySelectorAll('[data-wp]')) b.onclick = () => { BRP.warmCat = BRP_CATS[+b.dataset.wp][0]; close(); if (typeof brWarmNow === 'function' && brWarmNow() && playerAlive()) brWarmGun(); };
  o.querySelector('[data-close]').onclick = close; setTimeout(() => { if (o.isConnected) close(); }, 9000);
  setTimeout(() => { const f = o.querySelector('[data-wp]'); if (f) f.focus(); }, 0);
}
function brpWarmGunDef() { if (!BRP.warmCat) return null; const pool = ARMORY.filter(d => d.cat === BRP.warmCat && CATS[d.cat]); return pool.length ? pool[(Math.random() * pool.length) | 0] : null; }
/* ---------- loadout drops */
function brpDropBuy() {
  const s = brpLoad(), c = CLASSES[s.cls] || activeClass(); if (!playerAlive()) return false;
  const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw), o = openNear(P.x + fx * 5, P.z + fz * 5), y = groundAt(o.x, o.z, (o.y || P.y) + 1);
  const g = new THREE.Group(); g.position.set(o.x, y + 60, o.z); scene.add(g);
  const box = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.8, 0.8), new THREE.MeshStandardMaterial({ color: 0x1f3a24, roughness: 0.6, metalness: 0.3 })); box.position.y = 0.4; box.castShadow = true; g.add(box);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.1, 0.82), new THREE.MeshStandardMaterial({ color: 0x221a00, emissive: 0xffc83a, emissiveIntensity: 1.3 })); stripe.position.y = 0.55; g.add(stripe);
  const chute = new THREE.Mesh(new THREE.SphereGeometry(1.4, 12, 6, 0, TAU, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x5dff7a, side: THREE.DoubleSide, roughness: 0.8 })); chute.position.y = 3.2; g.add(chute);
  BRP.drop = { g, x: o.x, z: o.z, y, cls: c, landed: false, chute };
  try { showBanner('LOADOUT DROP', `${c.name || 'YOUR CLASS'} · it lands in a few seconds`); } catch (e) {} return true;
}
function brpDropTick(dt) {
  const D = BRP.drop; if (!D) return;
  if (!D.landed) { D.g.position.y = Math.max(D.y, D.g.position.y - 14 * dt); D.g.rotation.y += dt * 0.5; if (D.g.position.y <= D.y + 0.01) { D.landed = true; D.g.remove(D.chute); try { sfx.thud({ vol: 0.9 }); } catch (e) {} } return; }
  if (!playerAlive() || Math.hypot(P.x - D.x, P.z - D.z) > 1.8) return;
  try { showMsgOnce(`LOADOUT DROP · ${actName('use')} TO TAKE ${D.cls.name || 'YOUR CLASS'}`); } catch (e) {}
  const u = kb('use') || pad.use; if (u && !BRP.uH) {
    const c = D.cls; equipClass({ p: c.p, s: c.s, e: c.e, k: c.k, perks: c.perks, fu: c.fu, name: c.name }); G.grenades = EQUIP[G.equip] ? EQUIP[G.equip].count : 1;
    try { BRL.rar[c.p] = 1; for (const w of WEAPONS) { const t = brlAmmoOf(w.def); BRL.ammo[t] = Math.min(BRL_AMMO[t].max, BRL.ammo[t] + BRL_AMMO[t].can * 2); } brlAmmoSync(true); } catch (e) {}
    if (D.g.parent) D.g.parent.remove(D.g); BRP.drop = null; try { showBanner('YOUR LOADOUT', c.name || ''); sfx.pickup(); } catch (e) {}
  }
  BRP.uH = u;
}
/* ---------- every frame (from brUpdate) */
function brpTick(dt) {
  if (!M || !M.br) return; const B = M.br;
  if (B.place && !BRP.done) brpRecord(B.place);
  if (M.online && B.winTxt && !BRP.done) brpRecord(B.winTxt === NET.me || B.winTxt === 'SQ:' + M.myTeam ? 1 : (B.place || 2));
  brpDropTick(dt);
  // daily progress: kills (and with an EPIC+ gun), the landing spot
  const k = M.me.kills | 0; if (k > BRP.killsAt) { const n = k - BRP.killsAt; brpEvt('kills', n); const w = WEAPONS[G.cur]; if (w && w.def && (BRL.rar[w.def.id] | 0) >= 2) brpEvt('epic', n);
    if (BRP.landPoi) { BRP.landKills = (BRP.landKills | 0) + n; const d = brpDailyToday().list.find(c => c.k === 'land' && !c.done); if (d && BRP.landPoi === d.poi && BRP.landKills >= 2) brpEvt('land'); } }
  BRP.killsAt = k;
  // the kill leader
  if ((BRP.klT = (BRP.klT || 0) - dt) <= 0) { BRP.klT = 1; let best = null; for (const en of M.entries) if (en.alive !== false && (en.kills | 0) >= 3 && (!best || en.kills > best.kills)) best = en; if (best !== BRP.kl) { BRP.kl = best; if (best) try { showMsg(best.isPlayer ? 'YOU ARE THE KILL LEADER · everyone can see you' : `${best.name} IS THE KILL LEADER · ${best.kills} kills`); } catch (e) {} } }
}
function brpMarkers(out) {
  const L = BRP.kl; if (L && !L.isPlayer && L.bot && L.bot.group) out.push({ x: L.bot.group.position.x, y: L.bot.group.position.y + 2.4, z: L.bot.group.position.z, t: `KILL LEADER · ${L.kills}`, c: '#ff4a3a' });
  if (typeof BRF !== 'undefined' && BRF.float && BRF.land) out.push({ x: BRF.land.x, y: BRF.land.y + 0.5, z: BRF.land.z, t: 'LANDING', c: '#8fff6a' });
  if (BRP.drop && BRP.drop.landed) out.push({ x: BRP.drop.x, y: BRP.drop.y + 1.4, z: BRP.drop.z, t: 'LOADOUT', c: '#ffc83a' });
}
// the round starts
function brpSetup() { BRP.place = 0; BRP.done = false; BRP.landPoi = null; BRP.landKills = 0; BRP.killsAt = 0; BRP.kl = null; BRP.danced = false; if (BRP.drop && BRP.drop.g.parent) BRP.drop.g.parent.remove(BRP.drop.g); BRP.drop = null; try { brpDailyToday(); } catch (e) {} }
function brpCrown() { const s = brpLoad(); return s.streak > 0 ? s.streak : 0; }
// a crown over a crowned player's head (online, from presence cr)
function brpCrownOn(e, on) { if (!e || !e.group) return; if (on && !e.brpCrown) { const g = new THREE.Group(), m = new THREE.MeshStandardMaterial({ color: 0x332200, emissive: 0xffc83a, emissiveIntensity: 1.2, metalness: 0.6 }); const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.1, 10, 1, true), m); g.add(ring); for (let i = 0; i < 5; i++) { const p = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.1, 4), m); const a = i / 5 * TAU; p.position.set(Math.cos(a) * 0.16, 0.09, Math.sin(a) * 0.16); g.add(p); } g.position.y = 2.15; e.group.add(g); e.brpCrown = g; } if (e.brpCrown) e.brpCrown.visible = !!on; }
/* ================================================================== the LAST TOKE lobby */
const BRLOB = { on: false, net: 'off', sq: 1, rk: false };
try { const o = JSON.parse(localStorage.getItem('ashfall.brlob') || 'null'); if (o) Object.assign(BRLOB, { net: o.net || 'off', sq: o.sq || 1, rk: !!o.rk }); } catch (e) {}
const brlobSave = () => { try { localStorage.setItem('ashfall.brlob', JSON.stringify({ net: BRLOB.net, sq: BRLOB.sq, rk: BRLOB.rk })); } catch (e) {} };
const brlobMode = () => BRLOB.net !== 'on' ? null : BRLOB.rk && BRLOB.sq === 1 ? 'rbr' : BRLOB.sq === 4 ? 'obr4' : BRLOB.sq === 2 ? 'obr2' : 'obr';
function brlobOpen() { BRLOB.on = true; try { ZL.on = false; } catch (e) {} if (G.state !== 'menu') leaveGame(); brlobRender('.cod-go'); showScreen('lobby'); }
function brlobOff() { BRLOB.on = false; const L = $('lobby'); if (L) L.classList.remove('zl', 'brl'); }
function brlobRender(focusSel) {
  const s = brpLoad(), st = careerOf(BRLOB.net === 'on'), c = CLASSES[s.cls] || activeClass(), d = brpDailyToday(), tr = brpTrail();
  $('lobKind').textContent = 'LAST TOKE'; $('lobby').classList.add('zl', 'brl'); $('lobPlayer').innerHTML = playerCard(st); cardBanner($('lobPlayer'));
  const ph = document.querySelector('#lobby .cod-foot .padhint'); if (ph) ph.innerHTML = 'START  PLAY';
  const row = (sm, b, sp, act, wide) => `<div class="cod-row${wide ? ' wide' : ''}"><small>${sm}</small><b>${b}</b><span>${sp}</span>${act ? `<div class="arw"><button class="mini" data-act="${act}-" aria-label="Previous">&lsaquo;</button><button class="mini" data-act="${act}+" aria-label="Next">&rsaquo;</button></div>` : ''}</div>`;
  const avg = s.m ? (s.ps / s.m).toFixed(1) : '-', kd = (s.k / Math.max(1, s.m - s.w)).toFixed(2);
  $('lobSel').innerHTML = `<div class="cod-play"><button class="btn primary lob-go cod-go" data-act="bl-start"><small>${BRLOB.net === 'on' ? 'ONLINE · QUICK PLAY' : 'OFFLINE · VS 15 BOTS'}</small><b>${BRLOB.net === 'on' ? 'FIND A MATCH' : 'PLAY'}</b></button></div>` +
    row('PLAY', BRLOB.net === 'on' ? 'ONLINE' : 'OFFLINE', BRLOB.net === 'on' ? 'real players, bots fill to 16' : 'you against 15 bots', 'bl-net') +
    row('TEAM SIZE', ['', 'SOLO', 'DUOS', '', 'SQUADS'][BRLOB.sq], 'SOLO · DUOS · SQUADS', 'bl-sq') +
    (BRLOB.net === 'on' && BRLOB.sq === 1 ? row('RANKED', BRLOB.rk ? 'ON' : 'OFF', 'your placement and kills move your rank', 'bl-rk') : '') +
    row('LOADOUT DROP', c.name || 'CLASS', `${ARM[c.p] ? ARM[c.p].name : ''} + ${ARM[c.s] ? ARM[c.s].name : ''} · $4,000 at a buy station`, 'bl-cls') +
    row('FLOAT TRAIL', tr.n, BRP_TRAILS.map(t => t.need(s) ? t.n : `${t.n} (${t.how})`).join(' · '), 'bl-tr') +
    `<div class="cod-row"><small>YOUR LAST TOKE</small><b>${s.w} WINS · ${s.t5} TOP 5 · ${kd} K/D</b><span>${s.m} rounds · average place ${avg} · ${s.streak ? `👑 win streak ${s.streak}` : `best streak ${s.bestStreak}`}</span><div class="arw"><button class="mini" data-act="bl-stats" aria-label="Stats">STATS</button></div></div>` +
    `<div class="cod-row wide"><small>TODAY · +2,500 XP EACH</small><b>${d.list.filter(x => x.done).length} / 3 DONE</b><span>${d.list.map(x => `${x.done ? '✓' : '○'} ${x.n} (${x.have}/${x.goal})`).join('<br>')}</span></div>`;
  $('lobRoster').innerHTML = `<div class="ros-info"><b>LAST TOKE</b>Sixteen players on STASH ISLAND. Warm up, take the bong hit on THE HOTBOX CLOUD and float in. Loot guns off tables, racks and shelves (common, rare, epic, legendary), ammo for your gun type, heals and attachments. Find a key card for a VAULT, ride the BONG EXPRESS, take the TUNNELS, grab a WEED BALLOON. The NIGHTSHADE CLOUD closes five times - the last one standing wins.${M && M.squad ? '' : ''}</div>`;
  if (focusSel) focusFirst(focusSel);
}
function brlobStats() {
  const s = brpLoad(), row = (a, b) => `<span>${a}<b>${b}</b></span>`, by = k => s.by[k] ? `${s.by[k].w} / ${s.by[k].m}` : '0 / 0';
  onbCard(`<small>LAST TOKE</small><b>YOUR STATS</b><div class="pg-res-rows" style="display:grid;grid-template-columns:1fr 1fr;gap:6px 22px;margin:12px 0">${row('ROUNDS', s.m)}${row('WINS', s.w)}${row('TOP 5', s.t5)}${row('KILLS', s.k)}${row('K/D', (s.k / Math.max(1, s.m - s.w)).toFixed(2))}${row('AVERAGE PLACE', s.m ? (s.ps / s.m).toFixed(1) : '-')}${row('BEST PLACE', s.best ? '#' + s.best : '-')}${row('WIN STREAK', s.streak + ' (best ' + s.bestStreak + ')')}${row('SOLO WINS', by('solo'))}${row('DUOS WINS', by('duos'))}${row('SQUADS WINS', by('squads'))}</div>`, { ok: () => {} });
}
function brlobAct(act) {
  if (act === 'br-play') { sfx.ui(); brlobOpen(); return true; }
  if (/^(go-on|go-mp|deploy|play|go-zombies)$/.test(act)) { brlobOff(); return false; }
  if (!BRLOB.on || curScreen !== 'lobby') return false;
  const s = brpLoad(), re = sel => { brlobSave(); sfx.ui(); brlobRender(sel); };
  if (act === 'bl-start' || act === 'lob-start') {
    const m = brlobMode(); if (!m) { startMatch('br', BRLOB.sq > 1 ? { map: 'random', squad: BRLOB.sq } : { map: 'random' }); return true; }
    LOBBY.mode = m; try { quickPlay([m]); } catch (e) { reportError(e); } return true;
  }
  if (act === 'bl-net-' || act === 'bl-net+') { BRLOB.net = BRLOB.net === 'on' ? 'off' : 'on'; re('[data-act="bl-net+"]'); return true; }
  if (act === 'bl-sq-' || act === 'bl-sq+') { const L = [1, 2, 4], i = L.indexOf(BRLOB.sq); BRLOB.sq = L[(i + (act.endsWith('+') ? 1 : 2)) % 3]; re('[data-act="bl-sq+"]'); return true; }
  if (act === 'bl-rk-' || act === 'bl-rk+') { BRLOB.rk = !BRLOB.rk; re('[data-act="bl-rk+"]'); return true; }
  if (act === 'bl-cls-' || act === 'bl-cls+') { s.cls = ((s.cls | 0) + (act.endsWith('+') ? 1 : CLASSES.length - 1)) % CLASSES.length; brpSave(s); re('[data-act="bl-cls+"]'); return true; }
  if (act === 'bl-tr-' || act === 'bl-tr+') { const ok = BRP_TRAILS.filter(t => t.need(s)), i = Math.max(0, ok.findIndex(t => t.id === s.trail)); s.trail = ok[(i + (act.endsWith('+') ? 1 : ok.length - 1)) % ok.length].id; brpSave(s); re('[data-act="bl-tr+"]'); return true; }
  if (act === 'bl-stats') { sfx.ui(); brlobStats(); return true; }
  return false;
}
(() => { const s = document.createElement('style'); s.textContent = `#lobby.brl .cod-row .arw .mini{min-width:28px}#lobby.brl .cod-row.wide span{line-height:1.6}.br-pick .onb-t.on{border-color:#8fff6a}`; document.head.appendChild(s); })();
