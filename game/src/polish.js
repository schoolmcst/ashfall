/* ================================================================== polish: kill feed, score popups, streaks, explosive barrels,
   low-health effects, ammo prompts, dynamic crosshair, enemy footsteps */

/* ---------- kill feed + score popups + streaks */
const feedEl = $('feed'), popEl = $('pop');
function feedLine(html, cls) {
  try { rpFeed(html); } catch (e) {}
  const d = document.createElement('div'); d.innerHTML = html; if (cls) d.className = cls;
  feedEl.prepend(d); while (feedEl.children.length > 5) feedEl.lastChild.remove();
  setTimeout(() => { d.style.opacity = 0; }, 3600); setTimeout(() => d.remove(), 4200);
}
// one popup at a time under the crosshair: a new kill replaces the previous one
function popScore(text, cls, sub) {
  const d = document.createElement('div'); d.textContent = text; if (cls) d.className = cls;
  if (sub) { const s = document.createElement('small'); s.textContent = sub; d.appendChild(s); }
  while (popEl.firstChild) popEl.firstChild.remove();
  popEl.appendChild(d); setTimeout(() => d.remove(), 1200);
}
const MULTI = ['', '', 'DOUBLE KILL', 'TRIPLE KILL', 'MULTI KILL', 'RAMPAGE'];
function onKill(e, head, boom, bonusOnly) {
  if (G.bench) return;
  perkOnKill();   // no feed, popups or streak banners during the benchmark
  if (M.mode === 'zomb') { zombKill(e, head, boom, G.meleeT > 0); return; }
  const dist = Math.hypot(e.group.position.x - P.x, e.group.position.z - P.z);
  let pts = 100 + (head ? 50 : 0), extra = 0, tags = [];
  if (head) tags.push('HEADSHOT');
  if (boom) tags.push(e.killedBy === 'barrel' ? 'BARREL' : 'EXPLOSIVE');
  if (dist > 30 && !boom) { extra += 50; tags.push('LONGSHOT'); }
  G.multi = G.time - (G.lastKillT || -9) < 1.6 ? (G.multi || 1) + 1 : 1; G.lastKillT = G.time;
  let multiTxt = '';
  if (G.multi >= 2) { const b = 50 * G.multi; extra += b; multiTxt = MULTI[Math.min(G.multi, 5)]; sfx.multi(G.multi); }
  G.streak = (G.streak || 0) + 1;
  if (G.streak % 5 === 0) { const b = G.streak * 20; extra += b; showBanner(`${G.streak} KILL STREAK`, `+${b} bonus`); sfx.streak(); }
  G.score += extra; if (!(boom && e.killedBy === 'strike')) stkAdd(pts + Math.min(extra, 100));   // streak kills don't feed streaks; bonuses count up to +100
  popScore('+' + (pts + extra), multiTxt ? 'big' : head ? 'head' : '', [multiTxt, ...tags].filter(Boolean).join(' · '));
  feedLine(`<b>YOU</b> <span class="fw">${boom ? '✹' : WEAPONS[G.cur].name}</span> ${e.name ? `<span style="color:${isFriend(e) ? '#5aaeff' : '#ff5a4a'}">${e.name}</span>` : e.type.toUpperCase()}${tags.length ? ` <span class="ft">${tags.join(' · ')}</span>` : ''} <span class="fp">+${pts + extra}</span>`);
}

/* ---------- explosive barrels (the red ones): a hit sets them alight, then they blow and chain */
const barrels = [];
function addExplosiveBarrel(x, z) {
  const g = propGroup('barrel', { paint: MAT.barrel.red, steel: MAT.metal, metal: MAT.metal, default: MAT.metal });
  if (!g) return false;
  g.position.set(x, 0, z); g.rotation.y = Math.random() * TAU; g.traverse(o => { o.receiveShadow = true; }); scene.add(g);
  const proxy = proxyCollider(x, z, 0.62, 0.62, 0.9), box = boxes[boxes.length - 1];
  const b = { x, z, g, proxy, box, hp: 45, fuse: -1, alive: true, puffT: 0 };
  proxy.userData.barrel = b; barrels.push(b); return true;
}
function damageBarrel(b, dmg, quick) {
  if (!b.alive) return;
  b.hp -= dmg;
  if (b.hp <= 0 && b.fuse < 0) b.fuse = quick ? 0.12 + Math.random() * 0.15 : 1.1;
  else if (quick && b.fuse > 0.3) b.fuse = 0.2;
}
function detonateBarrel(b) {
  b.alive = false; b.fuse = -1; scene.remove(b.g);
  const wi = wallMeshes.indexOf(b.proxy); if (wi >= 0) wallMeshes.splice(wi, 1);
  const bi = boxes.indexOf(b.box); if (bi >= 0) boxes.splice(bi, 1); boxGridDirty = true;
  _v.set(b.x, 0.03, b.z); _n.set(0, 1, 0); addDecal(_v, _n, 'scorch', 3.2);
  explode({ x: b.x, y: 0.6, z: b.z }, 'barrel', 9);
  chunks('metal', _v.set(b.x, 0.6, b.z), 10, 7, 1.2);
}
function updateBarrels(dt) {
  for (const b of barrels) {
    if (!b.alive || b.fuse < 0) continue;
    b.fuse -= dt; b.puffT -= dt;
    if (b.puffT <= 0) { b.puffT = 0.06; puff(b.x + rnd(-0.15, 0.15), 0.95, b.z + rnd(-0.15, 0.15), { fire: true, size: 0.35, grow: 0.6, life: 0.35, vy: 1.6, op: 0.85 }); puff(b.x, 1.1, b.z, { color: 0x3a3a3a, size: 0.3, grow: 1.2, life: 1.2, vy: 1.2, op: 0.35, minor: 1 }); }
    if (b.fuse <= 0) detonateBarrel(b);
  }
}
function restoreBarrels() {
  for (const b of barrels) {
    b.hp = 45; b.fuse = -1;
    if (!b.alive) { b.alive = true; scene.add(b.g); wallMeshes.push(b.proxy); boxes.push(b.box); boxGridDirty = true; }
  }
}

/* ---------- low health: heartbeat + desaturated, high-contrast picture */
let lastFilter = '';
function updateLowHealth(dt) {
  const low = G.state === 'playing' && G.health < 35;
  const k = low ? clamp(G.health / 35, 0, 1) : 1;
  if (low) { G.hbT = (G.hbT || 0) - dt; if (G.hbT <= 0) { sfx.heart(1 - k * 0.6); G.hbT = lerp(0.55, 1.05, k); } }
  const f = low ? `saturate(${(0.3 + 0.7 * k).toFixed(2)}) contrast(${(1.12 - 0.12 * k).toFixed(2)})` : '';
  if (f !== lastFilter) { renderer.domElement.style.filter = f; lastFilter = f; }
}

/* ---------- ammo prompt + dynamic crosshair */
let lastPrompt = '';
function updateCombatHud(dt) {
  const w = WEAPONS[G.cur];
  let t = '', c = '';
  if (G.state === 'playing') {
    if (w.ammo === 0 && w.reserve === 0) { t = totalAmmo() === 0 ? 'NO AMMO' : 'NO AMMO · SWITCH WEAPON'; c = 'red'; }
    else if (!G.reloading && w.ammo <= Math.ceil(w.magSize * 0.25) && w.reserve > 0) { t = pad.on ? 'RELOAD  (X)' : 'RELOAD  [R]'; c = 'amber'; }
    else if (w.ammo + w.reserve <= w.magSize) { t = 'LOW AMMO'; c = 'amber'; }
  }
  const key = t + c;
  if (key !== lastPrompt) { const p = $('prompt'); p.textContent = t; p.className = c; lastPrompt = key; }
  // crosshair opens with movement, airtime and recent recoil; hides while aiming down sights
  const hs = Math.hypot(P.vx || 0, P.vz || 0);
  const target = 5 + hs * 2.2 + (P.onGround ? 0 : 10) + (G.shotT !== undefined && G.shotT < 0.18 ? (w.pellets > 1 ? 14 : 6) : 0) + (P.eye < 1.4 ? -2 : 0) + (w.pellets > 1 ? 8 : 0);
  G.chGap = lerp(G.chGap || target, target, clamp(dt * 14, 0, 1));
  const cr = $('cross'); cr.style.setProperty('--g', G.chGap.toFixed(1) + 'px'); cr.style.opacity = G.adsOn ? 0 : '';
}

/* ---------- footsteps of nearby enemies (positional) */
function updateEnemyFootsteps() {
  for (const e of enemies) {
    const x = e.group.position.x, z = e.group.position.z;
    if (e.fsX === undefined) { e.fsX = x; e.fsZ = z; e.fsD = Math.random(); continue; }
    e.fsD += Math.hypot(x - e.fsX, z - e.fsZ); e.fsX = x; e.fsZ = z;
    if (e.fsD > 0.8) { e.fsD = 0; if (e.silent) continue; const d = Math.hypot(x - P.x, z - P.z), aw = perk('aware'); if (d < (aw ? 38 : 22)) sfx.estep(at(x, z, aw ? 11 : 6)); }
  }
}

/* ---------- ammo crates drift toward you when close */
function magnetPickups(dt) {
  for (const k of pickups) {
    const dx = P.x - k.x, dz = P.z - k.z, d = Math.hypot(dx, dz);
    if (d < 3.5 && d > 0.2) { const s = Math.min(d, dt * (4 - d)); k.x += dx / d * s; k.z += dz / d * s; k.m.position.x = k.x; k.m.position.z = k.z; }
  }
}

function updatePolish(dt) {
  WIND_U.value += dt;
  updateAttachments();
  updateLowHealth(dt); updateCombatHud(dt); updateShadowLod(dt); updateSunFollow();
  if (G.state === 'playing') { updateBarrels(dt); updateEnemyFootsteps(); magnetPickups(dt); }
  else if (G.state === 'deathcam') updateBarrels(dt * 0.32);
}


/* ---------- 1.2.17 clean HUD: one simple palette, solid colours (no see-through text), a dark outline on every letter so it
   reads on bright sky and dark walls alike. White = info, yellow = something to act on, red = enemy/danger, blue = your team. */
(() => {
  const s = document.createElement('style'); s.id = 'hudClean';
  s.textContent = `#hud{--hw:#ffffff;--hs:#d8d8d8;--hy:#ffd23a;--hr:#ff3b30;--hb:#4aa8ff;color:var(--hw)}
#hud,#hud *{text-shadow:0 0 2px #000,0 1px 2px #000,0 0 6px rgba(0,0,0,.6)}
#hud #health .lbl,#hud #wname{font-size:13px;letter-spacing:1.5px;opacity:1;color:var(--hs);font-weight:700}
#hud #hpnum{font-size:36px;color:var(--hw)}
#hud #health .bar{height:9px;background:rgba(0,0,0,.55);border:1px solid rgba(255,255,255,.55)}
#hud #mag{color:var(--hw)}#hud #mag small{opacity:1;color:var(--hs)}
#hud #gren{opacity:1;color:var(--hw);letter-spacing:1.5px;font-weight:700}
#hud #slots{opacity:1;color:var(--hs);letter-spacing:1.5px;font-size:13px;font-weight:600}#hud #slots b{color:var(--hy)}
#hud #stats{letter-spacing:1.5px;color:var(--hw)}#hud #stats span{color:var(--hy)}
#hud #banner{color:var(--hw);letter-spacing:4px}#hud #banner small{opacity:1;color:var(--hy);font-size:18px;letter-spacing:2px;font-weight:700}
#hud #msg{color:var(--hw);letter-spacing:1.5px;font-weight:700;font-size:16px}
#hud #prompt{color:var(--hw);letter-spacing:2px;font-size:14px}#hud #prompt.amber{color:var(--hy)}#hud #prompt.red{color:var(--hr)}
#hud #pop div{color:var(--hw);letter-spacing:1.5px;font-size:15px}#hud #pop div.head{color:var(--hy)}#hud #pop div.big{color:var(--hy);font-size:18px}#hud #pop small{opacity:1;color:var(--hs);letter-spacing:1.5px;font-size:11px}
#hud #feed{font-size:13px;letter-spacing:.5px;font-weight:600;color:var(--hw)}#hud #feed div{background:rgba(0,0,0,.35);padding:0 8px;margin-top:2px;display:inline-block;clear:both;float:right}
#hud #feed b{color:var(--hb)}#hud #feed .fw{opacity:1;color:var(--hs);font-size:12px}#hud #feed .ft{color:var(--hy);font-size:12px}#hud #feed .fp{color:var(--hy)}
#hud #mhud .ts.a{border-color:var(--hb);color:var(--hw)}#hud #mhud .ts.b{border-color:var(--hr);color:var(--hw)}
#hud #mhud .tm small,#hud #mhud .minfo{opacity:1;color:var(--hs);letter-spacing:1.5px;font-weight:700}
#hud #center b{color:var(--hw);letter-spacing:4px}#hud #center small{opacity:1;color:var(--hs);letter-spacing:1.5px;font-weight:700}
#hud #ihold{color:var(--hw);letter-spacing:1.5px;font-weight:700}#hud #ihold i{background:var(--hy)}
#hud #marks .mk small{letter-spacing:1px}
#hud #stkHud .stk{border-color:rgba(255,255,255,.5);background:rgba(0,0,0,.55)}#hud #stkHud .stk span{font-size:11px;font-weight:700;color:var(--hw)}
#hud #stkHud .stk.ready{border-color:var(--hy)}#hud #stkHud .stk.cd span{color:var(--hr)}
#hud #stkHud .stk-uav{color:var(--hy);letter-spacing:1.5px;font-weight:700}#hud #stkHud .stk-pts{color:var(--hs);letter-spacing:1.5px;font-weight:700}
#hud .stk-ic{color:var(--hw)}`;
  document.head.appendChild(s);
})();
