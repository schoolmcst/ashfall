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
