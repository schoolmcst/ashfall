/* ================================================================== ZOMBIES: six perk machines around the hospital
   Walk up, pay, and your survivor smokes from a bowl, hits a joint or eats an edible (a first-person animation with
   smoke and a short haze), then has the perk until they go down. Machines live with the doors (built in zdInit,
   removed in zdClear). Perks are your own: in co-op nobody else gets yours. */
const ZPERKS = [
  { id: 'revive', name: 'SECOND WIND', desc: 'solo: get back up once when you go down · co-op: revive teammates twice as fast', cost: 1500, col: 0x3a8ee6, anim: 'joint', at: { x: -7.4, z: 30.5, y: 0, q: 1 } },
  { id: 'double', name: 'DOUBLE DAB', desc: 'shoot a third faster', cost: 2000, col: 0xe8822a, anim: 'bowl', at: { x: 25, z: 13.45, y: 0, q: 2 } },
  { id: 'quick', name: 'QUICK RIP', desc: 'reload twice as fast', cost: 3000, col: 0x2fcf6a, anim: 'bowl', at: { x: -9.4, z: 3.5, y: 0, q: 1 } },
  { id: 'zoom', name: 'ZOOMIES', desc: 'move 15% faster', cost: 2000, col: 0xf2c230, anim: 'edible', at: { x: -25, z: -13.45, y: 0, q: 0 } },
  { id: 'tank', name: 'KUSH TANK', desc: '250 max health', cost: 2500, col: 0xd23a32, anim: 'edible', at: { x: 0, z: 33.35, y: 4.2, q: 2 } },
  { id: 'munch', name: 'MUNCHIES', desc: '50% more points', cost: 2500, col: 0xa35ae0, anim: 'joint', at: { x: 0, z: -33.35, y: 4.2, q: 0 } },
];
const ZP = { have: new Set(), machines: [], anim: null, vm: null };
const zpHas = id => typeof M !== 'undefined' && M && M.mode === 'zomb' && ZP.have.has(id);
const zpDef = id => ZPERKS.find(p => p.id === id);

/* ---------- the machines */
function zpSign(p) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128; const g = c.getContext('2d');
  const col = '#' + p.col.toString(16).padStart(6, '0');
  g.fillStyle = '#0c0c10'; g.fillRect(0, 0, 256, 128); g.strokeStyle = col; g.lineWidth = 6; g.strokeRect(5, 5, 246, 118);
  g.fillStyle = col; g.font = 'bold 34px Georgia, serif'; g.textAlign = 'center'; g.fillText(p.name, 128, 52);
  g.fillStyle = '#e8e2d0'; g.font = 'bold 20px sans-serif'; g.fillText(p.cost + ' POINTS', 128, 84);
  g.fillStyle = col; g.font = '15px sans-serif'; g.fillText(p.anim === 'bowl' ? 'ONE HIT FROM THE BOWL' : p.anim === 'joint' ? 'PUFF PUFF PASS' : 'EAT ONE · KICKS IN FAST', 128, 108);
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t;
}
function zpMachine(p) {
  const s = p.at, g = new THREE.Group(), a = s.q * Math.PI / 2;
  const body = new THREE.MeshStandardMaterial({ color: 0x18181d, roughness: 0.4, metalness: 0.6 });
  const glow = new THREE.MeshStandardMaterial({ color: 0x050505, emissive: new THREE.Color(p.col), emissiveIntensity: 0.75 }), screen = new THREE.MeshStandardMaterial({ color: 0x050505, emissive: new THREE.Color(p.col).multiplyScalar(0.45), emissiveIntensity: 1 });
  const add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; g.add(m); return m; };
  add(new THREE.BoxGeometry(1.1, 2.0, 0.8), body, 0, 1.0, 0);
  add(new THREE.BoxGeometry(0.9, 1.0, 0.03), screen, 0, 1.15, 0.41); for (let i = 0; i < 4; i++) add(new THREE.BoxGeometry(0.7, 0.05, 0.02), glow, 0, 0.8 + i * 0.22, 0.43);
  add(new THREE.BoxGeometry(1.0, 0.5, 0.04), new THREE.MeshBasicMaterial({ map: zpSign(p) }), 0, 2.28, 0.25);
  add(new THREE.BoxGeometry(0.5, 0.12, 0.2), glow, 0, 0.45, 0.42);                       // the tray
  for (const x of [-0.53, 0.53]) add(new THREE.BoxGeometry(0.04, 2.0, 0.04), glow, x, 1.0, 0.4);
  // what it serves, on the tray: a little bowl, a joint or a gummy
  if (p.anim === 'bowl') { add(new THREE.CylinderGeometry(0.05, 0.04, 0.05, 10), glow, -0.05, 0.53, 0.42); add(new THREE.CylinderGeometry(0.015, 0.015, 0.16, 6), glow, 0.06, 0.53, 0.42).rotation.z = Math.PI / 2; }
  else if (p.anim === 'joint') add(new THREE.CylinderGeometry(0.012, 0.01, 0.16, 6), new THREE.MeshStandardMaterial({ color: 0xf2efe6 }), 0, 0.53, 0.42).rotation.z = Math.PI / 2;
  else add(new THREE.SphereGeometry(0.04, 8, 6), glow, 0, 0.54, 0.42);
  const lt = new THREE.PointLight(p.col, 1.1, 6, 2); lt.position.set(0, 1.4, 1.0); g.add(lt);
  g.rotation.y = a; g.position.set(s.x, s.y, s.z); scene.add(g);
  const w = s.q % 2 ? 0.8 : 1.1, d = s.q % 2 ? 1.1 : 0.8;
  const box = mkBox(s.x, s.z, w, d, 2.1, { y: s.y, walk: false }); boxes.push(box);
  const proxy = new THREE.Mesh(new THREE.BoxGeometry(w, 2.1, d), proxyMat); proxy.position.set(s.x, s.y + 1.05, s.z); proxy.visible = false; proxy.userData.ray = true; scene.add(proxy); proxy.updateMatrixWorld(); wallMeshes.push(proxy);
  return { p, g, box, proxy, glow };
}
function zpBuild() { ZP.machines = ZPERKS.map(zpMachine); }
function zpClear() { for (const m of ZP.machines) zdRemove(m); ZP.machines = []; zpReset(); }
function zpReset() { ZP.have.clear(); zpEndAnim(); if (typeof M !== 'undefined' && M && M.mode === 'zomb') { G.maxHp = 100; if (G.health > 100) G.health = 100; } zpHud(true); }
function zpNear() {
  for (const m of ZP.machines) { const s = m.p.at, fx = Math.round(Math.sin(s.q * Math.PI / 2)), fz = Math.round(Math.cos(s.q * Math.PI / 2)); if (Math.hypot(P.x - (s.x + fx * 0.9), P.z - (s.z + fz * 0.9)) < 1.3 && Math.abs((P.y || 0) - s.y) < 1.5) return m; }
  return null;
}
function zpPrompt(m, use) {
  const p = m.p;
  if (ZP.have.has(p.id)) return `${p.name} · YOU HAVE IT`;
  if (use && G.points >= p.cost && !ZP.anim) zpBuy(p);
  return `${p.name} · ${p.desc.toUpperCase()} · ${p.cost} POINTS · PRESS ${actName('use')}${G.points < p.cost ? ' · NOT ENOUGH POINTS' : ''}`;
}
function zpBuy(p) {
  G.points -= p.cost; ZP.have.add(p.id); zpApply();
  zpStartAnim(p);
  showBanner(p.name, p.desc); zpHud(true);
}
// stats that come from perks (called after any re-equip too)
function zpApply() {
  if (zpHas('tank')) { const was = G.maxHp; G.maxHp = 250; if (was < 250) G.health = Math.min(250, G.health + (250 - was)); }
}
function zpLose() { if (!ZP.have.size) return; ZP.have.clear(); G.maxHp = 100; if (G.health > 100) G.health = 100; zpHud(true); showMsg('YOU LOST YOUR PERKS'); }
// solo with SECOND WIND: get back up instead of dying (uses the perk up)
function zpSelfRevive() {
  if (!zpHas('revive') || (typeof zcInGame === 'function' && zcInGame())) return false;
  ZP.have.clear(); G.maxHp = 100; G.health = 100; G.spawnProt = 3; zpHud(true);
  showBanner('SECOND WIND', 'you got back up · buy your perks again');
  try { for (const e of enemies) { const d = Math.hypot(e.group.position.x - P.x, e.group.position.z - P.z); if (d < 6 && e.zombie) { e.stunT = 2; e.atkT = 0; } } } catch (e) {}
  return true;
}

/* ---------- the first-person animation: bowl, joint or edible */
function zpMat(c, o) { return new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.6 }, o)); }
function zpStartAnim(p) {
  zpEndAnim();
  const g = new THREE.Group(), skin = zpMat(0xc89a74), sleeve = zpMat(0x3c4232);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.045, 0.14), sleeve); arm.position.set(0.03, -0.04, 0.09); g.add(arm);
  const hand = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.045, 0.06), skin); hand.position.set(0.0, 0, 0); g.add(hand);
  const item = new THREE.Group(); g.add(item); let tip = null, flame = null, bites = [];
  if (p.anim === 'bowl') {
    const glass = zpMat(p.col, { transparent: true, opacity: 0.75, roughness: 0.1, metalness: 0.2 });
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.022, 0.035, 12), glass); bowl.position.set(0.0, 0.05, -0.07); item.add(bowl);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.014, 0.17, 8), glass); stem.rotation.x = Math.PI / 2; stem.position.set(0, 0.03, -0.0); item.add(stem);
    const herb = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.008, 10), zpMat(0x4a6a2a)); herb.position.set(0, 0.07, -0.07); item.add(herb); tip = herb;
    const lighter = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.06, 0.015), zpMat(0xc0302a)); lighter.position.set(-0.07, 0.06, -0.09); item.add(lighter);
    flame = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.flash, color: 0xffa040, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false })); flame.scale.set(0.04, 0.06, 1); flame.position.set(-0.045, 0.1, -0.08); item.add(flame);
  } else if (p.anim === 'joint') {
    const j = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.009, 0.11, 8), zpMat(0xf3efe4)); j.rotation.x = Math.PI / 2; j.position.set(0, 0.035, -0.07); item.add(j);
    tip = new THREE.Mesh(new THREE.SphereGeometry(0.008, 8, 6), zpMat(0x331100, { emissive: new THREE.Color(0xff5a10), emissiveIntensity: 2 })); tip.position.set(0, 0.035, -0.128); item.add(tip);
  } else {
    const gm = zpMat(p.col, { roughness: 0.25, transparent: true, opacity: 0.92 });
    for (const [x, y, r] of [[0, 0.035, 0.022], [0, 0.068, 0.017], [-0.013, 0.083, 0.007], [0.013, 0.083, 0.007], [-0.018, 0.04, 0.009], [0.018, 0.04, 0.009]]) { const s = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), gm); s.position.set(x, y, -0.06); item.add(s); bites.push(s); }
  }
  vmScene.add(g);
  const gun = gunObjs[G.cur]; if (gun) gun.visible = false;
  G.swapT = Math.max(G.swapT, 3.0); G.reloading = false; mouseAds = false;
  ZP.anim = { t: 0, dur: 3.0, g, item, tip, flame, bites, p, puffs: [], gunIdx: G.cur };
  try { if (p.anim === 'edible') { tone(180, 0.08, 0.06, 'square'); setTimeout(() => tone(150, 0.08, 0.06, 'square'), 650); } else { setTimeout(() => burst(1.1, 700, 0.07, 'lowpass'), 450); setTimeout(() => burst(1.4, 420, 0.09, 'lowpass'), 1700); } } catch (e) {}
}
function zpEndAnim() {
  const a = ZP.anim; if (!a) return; ZP.anim = null;
  vmScene.remove(a.g); for (const s of a.puffs) vmScene.remove(s.m);
  const gun = gunObjs[G.cur]; if (gun) gun.visible = true;
}
function zpTick(dt) {
  const a = ZP.anim;
  if (a) {
    a.t += dt; const t = a.t, ease = x => x * x * (3 - 2 * x);
    const up = t < 0.55 ? ease(t / 0.55) : t < 1.7 ? 1 : t < 2.3 ? 1 - ease((t - 1.7) / 0.6) : 0;
    a.g.position.set(0.17 - up * 0.17, -0.42 + up * 0.35, -0.56 + up * 0.22);
    a.g.rotation.set(up * 0.35, -0.3 + up * 0.3, 0.2 - up * 0.2);
    if (a.flame) { const on = t > 0.5 && t < 1.5; a.flame.visible = on; a.flame.scale.set(0.035 + Math.random() * 0.015, 0.05 + Math.random() * 0.02, 1); }
    if (a.tip && a.tip.material.emissive) a.tip.material.emissiveIntensity = t > 0.6 && t < 1.6 ? 2.5 + Math.sin(t * 20) : 1.2;
    if (a.p.anim === 'edible') { const n = Math.floor(clamp((t - 0.6) / 0.35, 0, a.bites.length)); a.bites.forEach((b, i) => { b.visible = i >= n; }); }
    // exhale: puffs drift out from the mouth, grow and fade
    if (a.p.anim !== 'edible' && t > 1.6 && t < 2.6 && Math.random() < dt * 22) {
      const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.smoke, color: 0xd8dccf, transparent: true, opacity: 0.55, depthWrite: false }));
      m.position.set((Math.random() - 0.5) * 0.04, -0.06, -0.22); m.scale.set(0.08, 0.08, 1); vmScene.add(m);
      a.puffs.push({ m, v: [(Math.random() - 0.5) * 0.12, 0.05 + Math.random() * 0.06, -0.25 - Math.random() * 0.2], life: 0 });
    }
    for (let i = a.puffs.length - 1; i >= 0; i--) { const s = a.puffs[i]; s.life += dt; s.m.position.x += s.v[0] * dt; s.m.position.y += s.v[1] * dt; s.m.position.z += s.v[2] * dt; const k = 0.08 + s.life * 0.45; s.m.scale.set(k, k, 1); s.m.material.opacity = Math.max(0, 0.55 - s.life * 0.45); if (s.life > 1.3) { vmScene.remove(s.m); a.puffs.splice(i, 1); } }
    if (t > 1.9 && !a.hazed) { a.hazed = true; zpHaze(a.p); }
    if (t >= a.dur && !a.puffs.length) zpEndAnim();
    else if (t >= a.dur) { const gun = gunObjs[G.cur]; if (gun && !gun.visible) gun.visible = true; a.g.visible = false; }
  }
}
// a short coloured haze over the screen when it kicks in
function zpHaze(p) {
  let h = $('zHaze'); if (!h) { h = document.createElement('div'); h.id = 'zHaze'; document.body.appendChild(h); }
  const c = new THREE.Color(p.col), rgb = `${(c.r * 255) | 0},${(c.g * 255) | 0},${(c.b * 255) | 0}`;
  h.style.cssText = `position:fixed;inset:0;pointer-events:none;z-index:4;background:radial-gradient(ellipse at center,rgba(${rgb},0) 35%,rgba(${rgb},.28) 100%);opacity:0;transition:opacity .8s`;
  requestAnimationFrame(() => { h.style.opacity = 1; setTimeout(() => { h.style.transition = 'opacity 3.5s'; h.style.opacity = 0; }, 1600); });
}

/* ---------- perk icons above your points */
function zpHud(force) {
  let h = $('zPerks');
  if (!h) { h = document.createElement('div'); h.id = 'zPerks'; ($('hud') || document.body).appendChild(h); const st = document.createElement('style'); st.textContent = `#zPerks{position:absolute;left:28px;bottom:226px;display:flex;gap:6px;pointer-events:none}#zPerks i{width:26px;height:26px;border-radius:5px;display:flex;align-items:center;justify-content:center;font:900 11px var(--font,system-ui);color:#111;box-shadow:0 0 10px currentColor;font-style:normal}`; document.head.appendChild(st); }
  const on = typeof M !== 'undefined' && M && M.mode === 'zomb';
  const html = on ? [...ZP.have].map(id => { const p = zpDef(id), c = '#' + p.col.toString(16).padStart(6, '0'); return `<i style="background:${c};color:${c}" title="${p.name}"><b style="color:#111">${p.name.split(' ').map(w => w[0]).join('')}</b></i>`; }).join('') : '';
  if (force || h._h !== html) { h._h = html; h.innerHTML = html; }
}
