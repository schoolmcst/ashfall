/* ================================================================== ZOMBIES EXTRAS: power-ups and wall stashes
   POWER-UPS (themed): a zombie sometimes drops one, floating and glowing; walk through it. It blinks out after 25 s.
     RE-UP (max ammo) · HOTBOX (one hit kills, 30 s) · DOUBLE BAG (double points, 30 s) · KUSH BOMB (every zombie dies,
     +400) · THE FIXER (fixes the barricades, +200) · 420 SALE (the mystery crate costs 42 points, 30 s)
     Co-op: the host drops them and owns the timers (pl / pv / pf in its presence); a client who walks through one
     tells the host (event 'pu<id>') and every survivor gets the effect.
   WALL STASHES: guns stashed in the walls behind a purple spray-paint stencil. Walk up, press USE: the gun, or its
     ammo (half price) if you already carry it. Places per map in ZMAPCFG[map].stash. */
const ZPU_TYPES = [
  { id: 'reup', name: 'RE-UP', sub: 'max ammo for everyone', col: '#5adf5a', secs: 0 },
  { id: 'hotbox', name: 'HOTBOX', sub: 'one hit kills · 30 seconds', col: '#e8e2d0', secs: 30 },
  { id: 'dbl', name: 'DOUBLE BAG', sub: 'double points · 30 seconds', col: '#ffd24a', secs: 30 },
  { id: 'bomb', name: 'KUSH BOMB', sub: 'every zombie down · +400', col: '#ff6a3a', secs: 0 },
  { id: 'fixer', name: 'THE FIXER', sub: 'barricades fixed · +200', col: '#5ab4ff', secs: 0 },
  { id: 'sale', name: '420 SALE', sub: 'mystery crate 42 points · 30 seconds', col: '#b06cff', secs: 30 },
];
const ZPU = { list: new Map(), mine: new Set(), seq: 0, fx: {}, ev: [], evSeq: 0, taken: new Set(), seenEv: undefined, round: -1, n: 0, tex: {} };
const zpuOn = id => (ZPU.fx[id] || 0) > NOW;
const zpuPts = () => zpuOn('dbl') ? 2 : 1;
const zboxCost = () => zpuOn('sale') ? 42 : Z_BOX;
const zpuDef = id => ZPU_TYPES.find(t => t.id === id);

/* ---------- the floating icons */
function zpuIcon(t) {
  if (ZPU.tex[t.id]) return ZPU.tex[t.id];
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'), col = t.col;
  const glow = g.createRadialGradient(128, 128, 10, 128, 128, 126); glow.addColorStop(0, col + 'aa'); glow.addColorStop(0.5, col + '33'); glow.addColorStop(1, col + '00');
  g.fillStyle = glow; g.fillRect(0, 0, 256, 256);
  g.save(); g.translate(128, 112); g.lineWidth = 7; g.strokeStyle = '#111'; g.fillStyle = col; g.lineJoin = 'round';
  const leaf = (x, y, s) => { g.save(); g.translate(x, y); g.scale(s, s); for (let i = -3; i <= 3; i++) { g.save(); g.rotate(i * 0.42); g.beginPath(); g.ellipse(0, -26, 6, 26, 0, 0, TAU); g.fill(); g.stroke(); g.restore(); } g.restore(); };
  if (t.id === 'reup') { g.beginPath(); g.rect(-46, -20, 92, 52); g.fill(); g.stroke(); for (let i = -2; i <= 2; i++) { g.beginPath(); g.rect(i * 16 - 5, -48, 10, 30); g.fill(); g.stroke(); g.beginPath(); g.arc(i * 16, -48, 5, Math.PI, 0); g.fill(); g.stroke(); } g.fillStyle = '#111'; g.font = 'bold 22px sans-serif'; g.textAlign = 'center'; g.fillText('AMMO', 0, 14); }
  else if (t.id === 'hotbox') { g.beginPath(); g.arc(0, -10, 40, 0, TAU); g.fill(); g.stroke(); g.beginPath(); g.rect(-24, 22, 48, 22); g.fill(); g.stroke(); g.fillStyle = '#111'; for (const x of [-16, 16]) { g.beginPath(); g.arc(x, -12, 11, 0, TAU); g.fill(); } g.beginPath(); g.moveTo(0, 2); g.lineTo(-6, 12); g.lineTo(6, 12); g.fill(); g.strokeStyle = '#ccc'; g.lineWidth = 6; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(30 + i * 10, -40); g.bezierCurveTo(50 + i * 10, -60, 20 + i * 10, -70, 44 + i * 10, -92); g.stroke(); } }
  else if (t.id === 'dbl') { g.beginPath(); g.moveTo(-36, -30); g.lineTo(36, -30); g.lineTo(42, 44); g.lineTo(-42, 44); g.closePath(); g.fill(); g.stroke(); g.beginPath(); g.rect(-40, -46, 80, 14); g.fill(); g.stroke(); g.fillStyle = '#111'; g.font = 'bold 50px sans-serif'; g.textAlign = 'center'; g.fillText('×2', 0, 28); }
  else if (t.id === 'bomb') { g.beginPath(); g.arc(0, 10, 44, 0, TAU); g.fill(); g.stroke(); g.beginPath(); g.rect(-12, -46, 24, 16); g.fill(); g.stroke(); g.strokeStyle = '#111'; g.beginPath(); g.moveTo(0, -46); g.quadraticCurveTo(14, -70, 34, -66); g.stroke(); g.fillStyle = '#ffe080'; g.beginPath(); g.arc(36, -66, 8, 0, TAU); g.fill(); g.fillStyle = '#2a6a2a'; leaf(0, 26, 0.7); }
  else if (t.id === 'fixer') { g.rotate(-0.6); g.beginPath(); g.rect(-8, -20, 16, 80); g.fill(); g.stroke(); g.beginPath(); g.rect(-38, -44, 76, 26); g.fill(); g.stroke(); }
  else if (t.id === 'sale') { g.beginPath(); g.moveTo(-50, -30); g.lineTo(26, -30); g.lineTo(54, 4); g.lineTo(26, 38); g.lineTo(-50, 38); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#111'; g.beginPath(); g.arc(30, 4, 7, 0, TAU); g.fill(); g.font = 'bold 40px sans-serif'; g.textAlign = 'center'; g.fillText('420', -14, 18); }
  g.restore();
  g.font = 'bold 30px sans-serif'; g.textAlign = 'center'; g.lineWidth = 6; g.strokeStyle = '#000'; g.strokeText(t.name, 128, 232); g.fillStyle = '#fff'; g.fillText(t.name, 128, 232);
  const tex = new THREE.CanvasTexture(c); tex.encoding = THREE.sRGBEncoding; return (ZPU.tex[t.id] = tex);
}
function zpuMake(id, type, x, z, y) {
  const t = zpuDef(type); if (!t || ZPU.list.has(id) || ZPU.taken.has(id)) return;
  const g = new THREE.Group(), sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: zpuIcon(t), transparent: true, depthWrite: false }));
  sp.scale.set(1.1, 1.1, 1); sp.position.y = 1.05; g.add(sp);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.03, 8, 32), new THREE.MeshBasicMaterial({ color: new THREE.Color(t.col), transparent: true, opacity: 0.8 })); ring.rotation.x = Math.PI / 2; ring.position.y = 0.05; g.add(ring);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.55, 5, 14, 1, true), new THREE.MeshBasicMaterial({ color: new THREE.Color(t.col), transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide })); beam.position.y = 2.5; g.add(beam);
  g.position.set(x, y, z); scene.add(g);
  ZPU.list.set(id, { id, type, x, z, y, t: NOW, g, sp, ring, beam });
}
function zpuRemove(id) { const o = ZPU.list.get(id); if (o) { scene.remove(o.g); ZPU.list.delete(id); } }
function zpuClear() { for (const id of [...ZPU.list.keys()]) zpuRemove(id); ZPU.fx = {}; ZPU.mine.clear(); ZPU.ev = []; ZPU.taken.clear(); ZPU.seenEv = undefined; ZPU.n = 0; zpuHud(true); }

/* ---------- drops (solo, or the co-op host) */
function zpuMaybeDrop(x, z, y) {
  if (ZPU.round !== Z.round) { ZPU.round = Z.round; ZPU.n = 0; }
  if (ZPU.n >= 4 || Math.random() > 0.035) return;
  const pool = ZPU_TYPES.filter(t => !(t.id === 'reup' && ZPU.n === 0 && Z.round < 2));
  const t = pool[(Math.random() * pool.length) | 0]; ZPU.n++;
  zpuMake(++ZPU.seq, t.id, x, z, y);
  try { tone(880, 0.12, 0.08, 'triangle'); tone(1320, 0.18, 0.06, 'triangle'); } catch (e) {}
}
// walking through one
function zpuTick(dt) {
  if (!ZPU.list.size && !Object.keys(ZPU.fx).length) return;
  for (const o of [...ZPU.list.values()]) {
    const age = NOW - o.t; o.sp.position.y = 1.05 + Math.sin(NOW * 3 + o.id) * 0.12; o.ring.rotation.z += dt * 2; o.beam.material.opacity = 0.08 + Math.sin(NOW * 4) * 0.04;
    o.g.visible = age < 17 || Math.sin(age * (age > 22 ? 30 : 14)) > 0;   // blinks before it goes
    if (age > 25) { zpuRemove(o.id); continue; }
    if (G.state === 'playing' && !(typeof ZC !== 'undefined' && (ZC.down || ZC.dead)) && Math.hypot(P.x - o.x, P.z - o.z) < 1.2 && Math.abs((P.y || 0) - o.y) < 1.6) zpuTake(o.id);
  }
  zpuHud();
}
function zpuTake(id) {
  const o = ZPU.list.get(id); if (!o) return; ZPU.taken.add(id); zpuRemove(id);
  if (zcInGame() && !zcHost()) { ZPU.mine.add(id); zcEvent('pu' + id + ':' + o.type, P); zpuApply(o.type, ''); return; }   // the host confirms the timers
  zpuActivate(o.type, '', id);
}
// the host (or solo) turns it on for everyone
function zpuActivate(type, who, id) {
  const t = zpuDef(type); if (!t) return;
  if (t.secs) ZPU.fx[type] = NOW + t.secs;
  ZPU.evSeq++; ZPU.ev.push([ZPU.evSeq, type, who || '', id || 0]); while (ZPU.ev.length > 6) ZPU.ev.shift();
  if (type === 'bomb') for (const e of enemies.slice()) if (e.zombie && !e.proxy && !e.boss) damageEnemy(e, 1e7, false, null, true, 'world');
  zpuApply(type, who);
}
// what each survivor feels (everyone runs this when it happens)
function zpuApply(type, who) {
  const t = zpuDef(type); if (!t) return;
  if (type === 'reup') { WEAPONS.forEach(w => { w.ammo = w.magSize; w.reserve = w.reserveMax || w.def.reserve; }); G.grenades = Math.max(G.grenades, 2); }
  if (type === 'bomb') { G.points += 400; try { sfx.explode(at(P.x, P.z, 60)); } catch (e) {} zpuFlash('#ffb070'); }
  if (type === 'fixer') { G.points += 200; try { if (typeof zwFixAll === 'function') zwFixAll(); } catch (e) {} }
  if (t.secs && !zpuOn(type)) ZPU.fx[type] = NOW + t.secs;
  showBanner(t.name, (who ? who + ' · ' : '') + t.sub);
  try { tone(392, 0.25, 0.12, 'sawtooth'); setTimeout(() => tone(523, 0.25, 0.12, 'sawtooth'), 140); setTimeout(() => tone(784, 0.5, 0.12, 'sawtooth'), 280); } catch (e) {}
  if (type !== 'bomb') zpuFlash(t.col);
  zpuHud(true);
}
function zpuFlash(col) { const f = document.createElement('div'); f.style.cssText = `position:fixed;inset:0;z-index:25;pointer-events:none;background:${col};opacity:.35;transition:opacity .9s`; document.body.appendChild(f); requestAnimationFrame(() => { f.style.opacity = 0; }); setTimeout(() => f.remove(), 1000); }
// the timers bottom-centre
function zpuHud(force) {
  let h = $('zPu');
  if (!h) { h = document.createElement('div'); h.id = 'zPu'; ($('hud') || document.body).appendChild(h); const st = document.createElement('style'); st.textContent = '#zPu{position:absolute;left:50%;bottom:96px;transform:translateX(-50%);display:flex;gap:10px;pointer-events:none}#zPu div{padding:6px 12px;background:rgba(0,0,0,.6);border-bottom:3px solid;font:800 13px var(--font,system-ui);letter-spacing:.14em;color:#fff;text-shadow:0 1px 3px #000}#zPu b{margin-left:8px;font-size:15px}'; document.head.appendChild(st); }
  const on = ZPU_TYPES.filter(t => t.secs && zpuOn(t.id));
  const html = typeof M !== 'undefined' && M && M.mode === 'zomb' ? on.map(t => { const s = Math.ceil(ZPU.fx[t.id] - NOW); return `<div style="border-color:${t.col};${s <= 5 && Math.sin(NOW * 12) > 0 ? 'opacity:.4' : ''}">${t.name}<b>${s}</b></div>`; }).join('') : '';
  if (force || h._h !== html) { h._h = html; h.innerHTML = html; }
}
/* ---------- co-op */
function zpuPresence(o) {   // the host's part of its presence
  o.pl = [...ZPU.list.values()].map(p => [p.id, ZPU_TYPES.findIndex(t => t.id === p.type), r2(p.x), r2(p.z), r2(p.y), +(NOW - p.t).toFixed(1)]);
  o.pv = ZPU.ev.slice(); o.pf = {}; for (const t of ZPU_TYPES) if (t.secs && zpuOn(t.id)) o.pf[t.id] = +(ZPU.fx[t.id] - NOW).toFixed(1);
}
function zpuFromHost(H) {
  if (Array.isArray(H.pl)) {
    const ids = new Set();
    for (const p of H.pl) { if (!Array.isArray(p)) continue; const id = +p[0], t = ZPU_TYPES[+p[1] | 0]; if (!id || !t) continue; ids.add(id); if (!ZPU.list.has(id) && !ZPU.taken.has(id)) { zpuMake(id, t.id, netNum(p[2], -ARENA, ARENA), netNum(p[3], -ARENA, ARENA), netNum(p[4], -5, 20)); const o = ZPU.list.get(id); if (o) o.t = NOW - netNum(p[5], 0, 30); } }
    for (const id of [...ZPU.list.keys()]) if (!ids.has(id)) zpuRemove(id);
  }
  if (Array.isArray(H.pv)) {
    if (ZPU.seenEv === undefined) ZPU.seenEv = H.pv.reduce((m, v) => Math.max(m, +v[0] || 0), 0);
    for (const v of H.pv) { if (!Array.isArray(v) || (+v[0] || 0) <= ZPU.seenEv) continue; ZPU.seenEv = +v[0]; if (zpuDef(v[1]) && !ZPU.mine.has(+v[3])) zpuApply(String(v[1]), String(v[2] || '').slice(0, 16)); }
  }
  if (H.pf && typeof H.pf === 'object') for (const t of ZPU_TYPES) if (t.secs) { const s = +H.pf[t.id]; ZPU.fx[t.id] = s > 0 ? NOW + Math.min(30, s) : Math.min(ZPU.fx[t.id] || 0, NOW); }
}
// a teammate walked through one (host side)
function zpuFromEvent(type, who) {
  const m = /^pu(\d+):(\w+)$/.exec(type); if (!m || !zcHost()) return;
  const id = +m[1], o = ZPU.list.get(id); if (!o) return; ZPU.taken.add(id); zpuRemove(id); zpuActivate(o.type, who, id);
}

/* ---------- wall stashes */
const ZWB = { list: [], tex: {} };
function zwbStencil(st, done) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 256; const g = c.getContext('2d'), d = ARM[st.gun];
  const paint = img => {
    g.clearRect(0, 0, 512, 256);
    // spray haze + drips
    g.fillStyle = 'rgba(150,60,255,0.10)'; g.beginPath(); g.ellipse(256, 118, 240, 100, 0, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(176,108,255,0.9)'; g.lineWidth = 5; g.setLineDash([16, 10]); g.strokeRect(20, 18, 472, 196); g.setLineDash([]);
    if (img) {   // the gun as a solid purple stencil
      const t = document.createElement('canvas'); t.width = 440; t.height = 150; const tg = t.getContext('2d'); const k = Math.min(440 / img.width, 150 / img.height);
      tg.drawImage(img, (440 - img.width * k) / 2, (150 - img.height * k) / 2, img.width * k, img.height * k);
      tg.globalCompositeOperation = 'source-in'; tg.fillStyle = '#b06cff'; tg.fillRect(0, 0, 440, 150);
      g.shadowColor = '#9a3cff'; g.shadowBlur = 18; g.drawImage(t, 36, 26); g.shadowBlur = 0;
    }
    const r = makeRng(st.gun.length * 97); g.fillStyle = 'rgba(176,108,255,0.8)'; for (let i = 0; i < 9; i++) { const x = 60 + r() * 390, y = 150 + r() * 30, L = 10 + r() * 40; g.fillRect(x, y, 3, L); g.beginPath(); g.arc(x + 1.5, y + L, 3, 0, TAU); g.fill(); }
    g.textAlign = 'center'; g.font = 'bold 34px Impact, sans-serif'; g.lineWidth = 6; g.strokeStyle = '#1a0a26'; g.strokeText(`${d ? d.name : st.gun} · ${st.cost}`, 256, 206); g.fillStyle = '#e6d0ff'; g.fillText(`${d ? d.name : st.gun} · ${st.cost}`, 256, 206);
    g.font = 'bold 16px sans-serif'; g.fillStyle = '#c8a8ff'; g.fillText('WALL STASH', 256, 46);
    done(c);
  };
  paint(null);
  try { let p = gunPic(st.gun); if (p && !p.url && THUMB.q.length && THUMB.q[0].key === p.key) { thumbOne(); p = gunPic(st.gun); }   // gun pictures are normally drawn only in the Locker: draw this one now
    if (p && p.url) { const img = new Image(); img.onload = () => paint(img); img.src = p.url; } } catch (e) {}
}
function zwbBuild() {
  zwbClear(); if (!zmapIs(curMap)) return;
  for (const st of zmapCfg(curMap).stash || []) {
    const a = st.q * Math.PI / 2, fx = Math.round(Math.sin(a)), fz = Math.round(Math.cos(a));
    const tex = new THREE.CanvasTexture(document.createElement('canvas')); tex.encoding = THREE.sRGBEncoding;
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.95), mat); m.position.set(st.x + fx * 0.02, (st.y || 0) + 1.45, st.z + fz * 0.02); m.rotation.y = a; scene.add(m);
    zwbStencil(st, c => { mat.map = new THREE.CanvasTexture(c); mat.map.encoding = THREE.sRGBEncoding; mat.needsUpdate = true; });
    ZWB.list.push({ st, m, fx, fz });
  }
}
function zwbClear() { for (const o of ZWB.list) scene.remove(o.m); ZWB.list = []; }
function zwbNear() {
  for (const o of ZWB.list) { const s = o.st, dx = P.x - s.x, dz = P.z - s.z; if (Math.hypot(dx, dz) < 2.0 && dx * o.fx + dz * o.fz > 0.2 && Math.abs((P.y || 0) - (s.y || 0)) < 1.5) return o; }
  return null;
}
function zwbPrompt(o, use) {
  const s = o.st, d = ARM[s.gun], have = Z.guns.includes(s.gun), cost = have ? Math.round(s.cost / 2) : s.cost;
  if (use && G.points >= cost) zwbBuy(o, have, cost);
  return `WALL STASH · ${have ? 'AMMO FOR THE ' + d.name : d.name} · ${cost} POINTS · PRESS ${actName('use')}${G.points < cost ? ' · NOT ENOUGH POINTS' : ''}`;
}
function zwbBuy(o, have, cost) {
  const s = o.st; G.points -= cost;
  if (have) { const i = Z.guns.indexOf(s.gun), w = WEAPONS[i]; if (w) { w.ammo = w.magSize; w.reserve = w.reserveMax || w.def.reserve; } showMsg('AMMO REFILLED'); }
  else { if (Z.guns.length < 2) Z.guns.unshift(s.gun); else Z.guns[G.cur] = s.gun; zombEquip(Z.guns.indexOf(s.gun)); showBanner(ARM[s.gun].name, 'pulled out of the wall stash'); setTimeout(() => zvSay('box', 0.4), 700); }
  try { sfx.pickup(); } catch (e) {}
}

/* ---------- WONDER WEAPONS: one per map, rare from the mystery crate, and the reward for finishing that map's story
   THE BONG CANNON (hospital): lobs a glowing ball of green smoke that bursts - zombies near it drop, the ones around
   it are stunned. THE PRESSURE GUN (THE WORKS): a blast of steam in a cone that throws back and wrecks everything in
   front of you. Built on the M32 / RPG-7 bodies (neither is in the crate), re-skinned and re-wired. */
const ZWW = {
  blackwell: { id: 'bong', base: 'thumper', name: 'THE BONG CANNON', desc: 'lobs a ball of green smoke · zombies near it drop, the rest are stunned', mag: 4, reserve: 24, interval: 0.9, col: 0x3aff5a },
  works: { id: 'pressure', base: 'hellfire', name: 'THE PRESSURE GUN', desc: 'a blast of steam that throws back everything in front of you', mag: 8, reserve: 48, interval: 0.55, col: 0xffa040 },
};
const ZWWP = [];   // bong balls in flight
const zwwFor = map => ZWW[map] || null;
function zwwGive(map) {
  const ww = zwwFor(map || curMap); if (!ww || !Z.guns || Z.guns.includes(ww.base)) return false;
  Z.wwOn = Z.wwOn || new Set(); Z.wwOn.add(ww.base);
  if (Z.guns.length < 2) Z.guns.unshift(ww.base); else Z.guns[G.cur] = ww.base;
  zombEquip(Z.guns.indexOf(ww.base));
  showBanner(ww.name, ww.desc); try { sfx.streak(); tone(196, 0.8, 0.12, 'sawtooth'); tone(294, 1.0, 0.1, 'triangle'); } catch (e) {}
  return true;
}
// after every re-equip: the base gun becomes the wonder weapon (name, magazine, glow)
function zwwApply() {
  if (!Z.wwOn || !Z.wwOn.size) return;
  WEAPONS.forEach((w, i) => {
    const ww = Object.values(ZWW).find(q => q.base === w.def.id); if (!ww || !Z.wwOn.has(w.def.id)) return;
    w.ww = ww.id; w.name = ww.name + (w.upgraded ? ' ✦' : ''); w.magSize = ww.mag * (w.upgraded ? 2 : 1); w.reserveMax = ww.reserve * (w.upgraded ? 2 : 1); w.ammo = w.magSize; w.reserve = w.reserveMax; w.interval = ww.interval;
    const g = gunObjs[i]; if (!g) return; ZD.tinted = ZD.tinted || [];
    const tint = mt => { const c = mt.clone(); if (c.emissive) { c.emissive = new THREE.Color(ww.col); c.emissiveIntensity = 0.5; } if (c.color) c.color.lerp(new THREE.Color(ww.col), 0.3); return c; };
    g.traverse(m => { if (!m.isMesh || ZD.tinted.some(t => t[0] === m)) return; ZD.tinted.push([m, m.material]); m.material = Array.isArray(m.material) ? m.material.map(tint) : tint(m.material); });
  });
}
const zwwDmg = (w, k) => zombHp(Math.max(1, Z.round)) * k * (w.upgraded ? 2 : 1) / Math.max(1, zombGunMul(true));
function zwwFire(w) {
  camera.updateMatrixWorld();
  const dir = new THREE.Vector3(); camera.getWorldDirection(dir);
  const org = camera.position.clone().addScaledVector(dir, 0.6);
  if (w.ww === 'bong') {
    const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.smoke, color: 0x6aff7a, transparent: true, depthWrite: false })); m.scale.set(0.5, 0.5, 1); m.position.copy(org); scene.add(m);
    const core = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.flash, color: 0x9aff9a, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); core.scale.set(0.35, 0.35, 1); m.add(core);
    ZWWP.push({ m, v: dir.multiplyScalar(24).add(new THREE.Vector3(0, 0.9, 0)), t: 0, w });   // a flat lob: indoor ceilings are low
    try { burst(0.5, 600, 0.3, 'lowpass'); tone(80, 0.4, 0.2, 'sine', 50); } catch (e) {}
  } else {   // the steam cone
    const range = 11, cosMax = Math.cos(0.5);
    for (const e of enemies.slice()) {
      if (!e.zombie) continue; const g = e.group.position, dx = g.x - org.x, dz = g.z - org.z, dy = (g.y + 1) - org.y, d = Math.hypot(dx, dy, dz);
      if (d > range || (dx * dir.x + dy * dir.y + dz * dir.z) / (d || 1) < cosMax || !gridClear(P.x, P.z, g.x, g.z, P.y || 0, g.y)) continue;
      const push = new THREE.Vector3(dx, 0, dz).normalize(), k = 1 - d / range * 0.5;
      damageEnemy(e, e.boss ? e.maxHp * 0.03 / Math.max(1, zombGunMul(true)) : zwwDmg(w, 1.6 * k), false, push, true, 'player');
      if (enemies.includes(e)) { g.x += push.x * 2.2; g.z += push.z * 2.2; e.stunT = 0.9; e.atkT = 0; }
    }
    try { for (let i = 0; i < 18; i++) { const s = 1 + i * 0.55, side = new THREE.Vector3(-dir.z, 0, dir.x); puff(org.x + dir.x * s + side.x * rnd(-0.3, 0.3) * s * 0.3, org.y + dir.y * s + rnd(-0.2, 0.3), org.z + dir.z * s + side.z * rnd(-0.3, 0.3) * s * 0.3, { color: 0xe8e8e8, size: 0.3 + s * 0.12, grow: 1.6, life: 0.9, vx: dir.x * 4, vy: 0.6, vz: dir.z * 4, op: 0.55 }); }
      burst(0.6, 3500, 0.3, 'highpass'); burst(0.4, 300, 0.25, 'lowpass'); } catch (e) {}
  }
}
const _wwRay = new THREE.Raycaster();
function zwwTick(dt) {
  for (let i = ZWWP.length - 1; i >= 0; i--) {
    const b = ZWWP[i], p0 = b.m.position.clone(); b.t += dt; b.v.y -= 6 * dt; b.m.position.addScaledVector(b.v, dt);
    const seg = b.m.position.clone().sub(p0), L = seg.length(); let hit = b.t > 4 || b.m.position.y < groundAt(b.m.position.x, b.m.position.z, b.m.position.y + 0.5) + 0.1;
    if (!hit && L > 0) { _wwRay.set(p0, seg.normalize()); _wwRay.far = L; if (_wwRay.intersectObjects(wallMeshes, false).length) hit = true; }
    if (!hit) for (const e of enemies) if (e.zombie) { const g = e.group.position, dy = b.m.position.y - (g.y + 1); if (Math.hypot(b.m.position.x - g.x, dy * 0.7, b.m.position.z - g.z) < 1.1) { hit = true; break; } }   // against the body, not the feet
    if (Math.random() < dt * 30) try { puff(b.m.position.x, b.m.position.y, b.m.position.z, { color: 0x7aff8a, size: 0.25, grow: 0.8, life: 0.6, vy: 0.2, op: 0.4 }); } catch (e) {}
    if (hit) { scene.remove(b.m); ZWWP.splice(i, 1); zwwBurst(b.m.position, b.w); }
  }
}
function zwwBurst(p, w) {
  for (const e of enemies.slice()) {
    if (!e.zombie) continue; const d = e.group.position.distanceTo(p);
    if (d < 4.5) damageEnemy(e, e.boss ? e.maxHp * 0.05 / Math.max(1, zombGunMul(true)) : zwwDmg(w, 2.5), false, e.group.position.clone().sub(p).setY(0).normalize(), true, 'player');
    else if (d < 8 && enemies.includes(e)) { e.stunT = 2.5; e.slowT = 3.5; e.atkT = 0; }
  }
  try { for (let i = 0; i < 26; i++) puff(p.x + rnd(-2.5, 2.5), p.y + rnd(0, 2), p.z + rnd(-2.5, 2.5), { color: i % 3 ? 0x5adf6a : 0xb0ffb0, size: 1, grow: 2.4, life: 2.2, vy: 0.5, op: 0.55 }); sfx.explode(at(p.x, p.z, 30, p.y)); tone(60, 0.8, 0.25, 'sine', 30); } catch (e) {}
  try { if (typeof zcEvent === 'function') zcEvent('b', p); } catch (e) {}
}
function zwwClear() { for (const b of ZWWP) scene.remove(b.m); ZWWP.length = 0; }

/* ---------- ZOMBIES STATS (per map, on this computer) and what friends see */
const ZST = {}; try { Object.assign(ZST, JSON.parse(localStorage.getItem('ashfall.zstats') || '{}')); } catch (e) {}
const zstOf = map => ZST[map] || (ZST[map] = { best: 0, pts: 0, kills: 0, games: 0, rounds: 0, story: 0 });
const zstSave = () => { try { localStorage.setItem('ashfall.zstats', JSON.stringify(ZST)); } catch (e) {} };
function zstGameOver() {
  if (!zmapIs(curMap) || Z.statDone) return; Z.statDone = true;
  const s = zstOf(curMap); s.games++; s.rounds += Z.round || 0; s.kills += G.kills || 0;
  if ((Z.round || 0) > s.best || (Z.round === s.best && G.score > s.pts)) { s.best = Z.round || 0; s.pts = G.score || 0; }
  zstSave();
}
function zstStory() { if (!zmapIs(curMap)) return; zstOf(curMap).story++; zstSave(); }
const zstCard = () => [zstOf('blackwell').best, zstOf('works').best, ZMAP_LIST.reduce((a, m) => a + zstOf(m).kills, 0), ZMAP_LIST.reduce((a, m) => a + zstOf(m).story, 0)];
