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
  for (const m of ZP.machines) { const s = m.p.at, fx = Math.round(Math.sin(s.q * Math.PI / 2)), fz = Math.round(Math.cos(s.q * Math.PI / 2)), dx = P.x - s.x, dz = P.z - s.z; if (Math.hypot(dx, dz) < 2.6 && dx * fx + dz * fz > 0.2 && Math.abs((P.y || 0) - s.y) < 1.5) return m; }
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
  setTimeout(() => zvSay(p.anim), ({ bowl: 2.8, joint: 2.4, edible: 2.4 }[p.anim] || 2.5) * 1500);
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

/* ---------- the first-person animations: bowl, joint or edible
   Built in the viewmodel scene (camera at the origin looking down -z, the mouth is about (0, -0.075, -0.17)).
   Each hand follows keyframes [time, x, y, z, rx, ry, rz] eased between; props and smoke are driven by the clock. */
function zpMat(c, o) { return new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.6 }, o)); }
const ZP_SKIN = () => ZP.skin || (ZP.skin = zpMat(0xc99a72, { roughness: 0.7 }));
const ZP_SLEEVE = () => ZP.sleeve || (ZP.sleeve = zpMat(0x434a36, { roughness: 0.9 }));
// a hand: palm, four two-joint fingers curled by `curl`, a thumb, wrist and sleeve. side = 1 right, -1 left
function zpHand(side, curl = 1.0, thumbIn = 0.7) {
  const g = new THREE.Group(), sk = ZP_SKIN(), box = (w, h, d, m = sk) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  const palm = box(0.05, 0.02, 0.055); g.add(palm);
  const knuck = box(0.048, 0.018, 0.012); knuck.position.set(0, 0.002, -0.031); g.add(knuck);
  g.userData.fingers = [];
  for (let k = 0; k < 4; k++) {
    const f = new THREE.Group(); f.position.set((-0.018 + k * 0.012) * side, 0, -0.034); g.add(f);
    const len = [0.02, 0.023, 0.022, 0.017][k];
    const a = box(0.0105, 0.011, len); a.position.z = -len / 2; f.add(a);
    const j2 = new THREE.Group(); j2.position.z = -len; f.add(j2);
    const b = box(0.0095, 0.0098, len * 0.85); b.position.z = -len * 0.42; j2.add(b);
    f.rotation.x = -curl * 0.9; j2.rotation.x = -curl * 1.1; g.userData.fingers.push([f, j2]);
  }
  const th = new THREE.Group(); th.position.set(0.026 * side, -0.004, -0.008); g.add(th);
  const t1 = box(0.012, 0.012, 0.024); t1.position.z = -0.012; th.add(t1);
  const t2 = box(0.011, 0.011, 0.018); t2.position.set(0, 0, -0.031); th.add(t2);
  th.rotation.set(-0.2, -thumbIn * side, 0.3 * side); g.userData.thumb = th;
  const wrist = box(0.04, 0.022, 0.028); wrist.position.set(0, -0.002, 0.038); g.add(wrist);
  // the forearm goes down and back, out of the bottom of the view (not at the camera)
  const arm = new THREE.Group(); arm.position.set(0, -0.006, 0.045); arm.rotation.x = 0.95; g.add(arm);
  const fore = box(0.034, 0.03, 0.1); fore.position.z = 0.045; arm.add(fore);
  const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.018, 12), zpMat(0x2e3326)); cuff.rotation.x = Math.PI / 2; cuff.position.z = 0.1; arm.add(cuff);
  const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.034, 0.22, 12), ZP_SLEEVE()); sleeve.rotation.x = Math.PI / 2; sleeve.position.z = 0.2; arm.add(sleeve);
  return g;
}
const zpEase = x => x * x * (3 - 2 * x);
function zpKey(track, t, out) {
  let a = track[0], b = track[track.length - 1];
  for (let i = 0; i < track.length - 1; i++) if (t >= track[i][0] && t <= track[i + 1][0]) { a = track[i]; b = track[i + 1]; break; }
  if (t <= track[0][0]) a = b = track[0];
  const k = a === b ? 0 : zpEase(clamp((t - a[0]) / (b[0] - a[0]), 0, 1));
  out.position.set(lerp(a[1], b[1], k), lerp(a[2], b[2], k), lerp(a[3], b[3], k)); out.rotation.set(lerp(a[4], b[4], k), lerp(a[5], b[5], k), lerp(a[6], b[6], k));
}
// tracks per animation: right hand (R), left hand (L)
const ZP_TRACKS = {
  bowl: { dur: 4.0, R: [[0, 0.2, -0.36, -0.42, 0.4, 0.3, 0.3], [0.55, 0.035, -0.075, -0.23, -0.15, 0.05, 0.05], [1.9, 0.03, -0.068, -0.205, -0.1, 0.03, 0.04], [2.35, 0.09, -0.2, -0.32, 0.25, 0.2, 0.2], [2.8, 0.2, -0.4, -0.42, 0.5, 0.3, 0.3], [4, 0.2, -0.4, -0.42, 0.5, 0.3, 0.3]],
                    L: [[0, -0.22, -0.38, -0.4, 0.3, -0.3, -0.3], [0.45, -0.22, -0.38, -0.4, 0.3, -0.3, -0.3], [0.85, -0.035, -0.075, -0.25, 0.1, -0.5, -0.9], [1.75, -0.034, -0.07, -0.245, 0.1, -0.5, -0.9], [2.15, -0.22, -0.4, -0.4, 0.3, -0.3, -0.3], [4.0, -0.22, -0.4, -0.4, 0.3, -0.3, -0.3]] },
  joint: { dur: 3.8, R: [[0, 0.2, -0.34, -0.42, 0.3, 0.2, 0.2], [0.6, 0.025, -0.058, -0.215, -0.1, 0.25, -0.15], [1.7, 0.022, -0.055, -0.205, -0.08, 0.25, -0.15], [2.2, 0.11, -0.16, -0.34, 0.1, 0.2, 0], [2.7, 0.11, -0.16, -0.34, 0.1, 0.2, 0], [2.85, 0.11, -0.14, -0.34, 0.25, 0.2, 0], [3, 0.11, -0.16, -0.34, 0.1, 0.2, 0], [3.6, 0.22, -0.4, -0.42, 0.4, 0.2, 0.2]] },
  edible: { dur: 3.4, R: [[0, 0.18, -0.34, -0.42, 0.3, 0.2, 0.2], [0.55, 0.02, -0.07, -0.26, -0.3, 0.1, 0], [0.75, 0.01, -0.055, -0.195, -0.35, 0.1, 0], [0.95, 0.02, -0.07, -0.26, -0.3, 0.1, 0], [1.35, 0.01, -0.055, -0.195, -0.35, 0.1, 0], [1.55, 0.02, -0.07, -0.26, -0.3, 0.1, 0], [1.95, 0.01, -0.055, -0.19, -0.35, 0.1, 0], [2.2, 0.06, -0.15, -0.3, -0.1, 0.1, 0], [2.9, 0.2, -0.4, -0.42, 0.4, 0.2, 0.2]] },
};
function zpGlass(col) { return zpMat(col, { transparent: true, opacity: 0.72, roughness: 0.05, metalness: 0.1, emissive: new THREE.Color(col).multiplyScalar(0.12) }); }
function zpStartAnim(p) {
  zpEndAnim();
  const ZK = 1.5, tr = ZP_TRACKS[p.anim], root = new THREE.Group(), R = zpHand(1, p.anim === 'edible' ? 0.75 : 1.0, p.anim === 'joint' ? 1.1 : 0.7), A = { t: 0, k: ZK, dur: tr.dur, root, R, p, puffs: [], sparks: [], tr };   // ZK: everything plays half again as slow
  root.add(R);
  if (p.anim === 'bowl') {
    // spoon pipe: bowl, neck, stem and mouthpiece, swirled glass; lighter in the left hand
    const pipe = new THREE.Group(), gl = zpGlass(p.col), gl2 = zpGlass(0xeaf6ff);
    const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.024, 16, 12), gl); bowl.scale.set(1, 0.8, 1); bowl.position.set(0, 0.012, -0.045); pipe.add(bowl);
    const lip = new THREE.Mesh(new THREE.TorusGeometry(0.012, 0.003, 8, 16), gl2); lip.rotation.x = Math.PI / 2; lip.position.set(0, 0.03, -0.045); pipe.add(lip);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.014, 0.1, 12), gl); stem.rotation.x = Math.PI / 2; stem.position.set(0, 0.006, 0.01); pipe.add(stem);
    const mouth = new THREE.Mesh(new THREE.SphereGeometry(0.0095, 10, 8), gl2); mouth.position.set(0, 0.006, 0.06); pipe.add(mouth);
    for (let i = 0; i < 5; i++) { const sw = new THREE.Mesh(new THREE.TorusGeometry(0.011 + i * 0.0006, 0.0018, 6, 12, Math.PI), zpMat(0xffffff, { emissive: new THREE.Color(p.col), emissiveIntensity: 0.4 })); sw.position.set(0, 0.006, -0.025 + i * 0.016); sw.rotation.set(0, Math.PI / 2, i); pipe.add(sw); }
    const herb = new THREE.Mesh(new THREE.CylinderGeometry(0.0115, 0.009, 0.006, 12), zpMat(0x3e5a22, { emissive: new THREE.Color(0xff4a0a), emissiveIntensity: 0 })); herb.position.set(0, 0.027, -0.045); pipe.add(herb);
    pipe.position.set(-0.005, 0.016, -0.03); pipe.rotation.set(0, 0, 0.05); R.add(pipe); A.cherry = herb; A.bowlAt = pipe;
    const L = zpHand(-1, 1.0, 0.4); root.add(L); A.L = L;
    const lighter = new THREE.Group(), body = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.055, 0.012), zpMat(0xc02a26, { roughness: 0.3 })); lighter.add(body);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.012, 0.012), zpMat(0xb8bcc0, { metalness: 0.9, roughness: 0.25 })); cap.position.y = 0.033; lighter.add(cap);
    const flame = new THREE.Group(), fo = new THREE.Mesh(new THREE.ConeGeometry(0.006, 0.028, 10), new THREE.MeshBasicMaterial({ color: 0xff8a20, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false })); fo.position.y = 0.014; flame.add(fo);
    const fi = new THREE.Mesh(new THREE.ConeGeometry(0.0032, 0.016, 8), new THREE.MeshBasicMaterial({ color: 0x6ab4ff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false })); fi.position.y = 0.008; flame.add(fi);
    const fl = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.flash, color: 0xffa040, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.7 })); fl.scale.set(0.05, 0.05, 1); fl.position.y = 0.015; flame.add(fl);
    flame.position.y = 0.04; lighter.add(flame); lighter.position.set(0.004, 0.03, -0.03); lighter.rotation.set(0, 0, -0.15); L.add(lighter); A.flame = flame;
    const glowL = new THREE.PointLight(0xff8a30, 0, 0.6, 2); glowL.position.set(0, 0.06, -0.03); lighter.add(glowL); A.flameLight = glowL;
  } else if (p.anim === 'joint') {
    const jt = new THREE.Group();
    const paper = new THREE.Mesh(new THREE.CylinderGeometry(0.0045, 0.0062, 0.075, 12), zpMat(0xf1ece0, { roughness: 0.9 })); paper.rotation.x = Math.PI / 2; jt.add(paper);
    const filt = new THREE.Mesh(new THREE.CylinderGeometry(0.0045, 0.0045, 0.012, 12), zpMat(0xd9c49a)); filt.rotation.x = Math.PI / 2; filt.position.z = 0.043; jt.add(filt);
    const twist = new THREE.Mesh(new THREE.ConeGeometry(0.0062, 0.008, 10), zpMat(0xe8e2d4)); twist.rotation.x = -Math.PI / 2; twist.position.z = -0.041; jt.add(twist);
    const ash = new THREE.Mesh(new THREE.CylinderGeometry(0.0058, 0.006, 0.008, 12), zpMat(0x9a9690, { roughness: 1 })); ash.rotation.x = Math.PI / 2; ash.position.z = -0.045; jt.add(ash);
    const cherry = new THREE.Mesh(new THREE.SphereGeometry(0.0062, 12, 8), zpMat(0x2a0800, { emissive: new THREE.Color(0xff4a0a), emissiveIntensity: 1.5 })); cherry.scale.z = 0.5; cherry.position.z = -0.0495; jt.add(cherry);
    const cl = new THREE.PointLight(0xff5a1a, 0.15, 0.25, 2); cl.position.z = -0.055; jt.add(cl);
    jt.position.set(-0.004, 0.017, -0.06); jt.rotation.set(0.15, -0.5, 0); jt.scale.setScalar(1.4); R.add(jt); A.cherry = cherry; A.cherryLight = cl; A.tipObj = cherry; A.ash = ash;
  } else {
    // a gummy bear: body, head, ears, arms and legs; bites take the head, then the shoulders, then the rest
    const bear = new THREE.Group(), gm = zpMat(p.col, { roughness: 0.18, transparent: true, opacity: 0.88, emissive: new THREE.Color(p.col).multiplyScalar(0.18) });
    const part = (geo, x, y, z, sx = 1, sy = 1, sz = 1) => { const m = new THREE.Mesh(geo, gm); m.position.set(x, y, z); m.scale.set(sx, sy, sz); bear.add(m); return m; };
    const body = part(new THREE.SphereGeometry(0.016, 14, 10), 0, 0, 0, 1, 1.2, 0.75);
    const head = part(new THREE.SphereGeometry(0.012, 14, 10), 0, 0.025, 0, 1, 0.92, 0.8);
    const ears = [part(new THREE.SphereGeometry(0.0045, 8, 6), -0.0085, 0.035, 0), part(new THREE.SphereGeometry(0.0045, 8, 6), 0.0085, 0.035, 0)];
    const arms = [part(new THREE.SphereGeometry(0.0055, 8, 6), -0.015, 0.008, 0.002, 1, 1.5, 1), part(new THREE.SphereGeometry(0.0055, 8, 6), 0.015, 0.008, 0.002, 1, 1.5, 1)];
    const legs = [part(new THREE.SphereGeometry(0.007, 8, 6), -0.009, -0.019, 0.002, 1, 1.2, 1), part(new THREE.SphereGeometry(0.007, 8, 6), 0.009, -0.019, 0.002, 1, 1.2, 1)];
    const snout = part(new THREE.SphereGeometry(0.0045, 8, 6), 0, 0.022, 0.009);
    bear.position.set(0.0, 0.04, -0.062); bear.rotation.set(-0.25, 0, 0); bear.scale.setScalar(1.8); R.add(bear);
    A.bites = [[head, snout, ...ears], [...arms, body], [...legs]]; A.bear = bear;
    if (R.userData.thumb) R.userData.thumb.rotation.y = -1.1;
  }
  vmScene.add(root);
  const gun = gunObjs[G.cur]; if (gun) gun.visible = false;
  G.swapT = Math.max(G.swapT, tr.dur * ZK); G.reloading = false; mouseAds = false;
  A.cough = p.anim === 'bowl' && Math.random() < 0.5;
  ZP.anim = A;
  try {
    if (p.anim === 'edible') { for (const t of [700, 1300, 1900].map(v => v * ZK)) setTimeout(() => { tone(220, 0.05, 0.05, 'square'); tone(160, 0.07, 0.04, 'triangle'); }, t); }
    else {
      if (p.anim === 'bowl') { setTimeout(() => { tone(1800, 0.03, 0.04, 'square'); burst(0.08, 3000, 0.05, 'highpass'); }, 800 * ZK); }
      setTimeout(() => burst(1.0 * ZK, 600, 0.06, 'lowpass'), (p.anim === 'bowl' ? 900 : 650) * ZK);
      setTimeout(() => burst(1.6 * ZK, 380, 0.09, 'lowpass'), (p.anim === 'bowl' ? 2250 : 1800) * ZK);
      if (A.cough) for (const t of [3000, 3250, 3480].map(v => v * ZK)) setTimeout(() => burst(0.14, 900, 0.12, 'bandpass'), t);
    }
  } catch (e) {}
}
function zpEndAnim() {
  const a = ZP.anim; if (!a) return; ZP.anim = null;
  vmScene.remove(a.root); for (const s of a.puffs.concat(a.sparks)) vmScene.remove(s.m);
  const gun = gunObjs[G.cur]; if (gun) gun.visible = true;
  vmCamera.rotation.set(0, 0, 0);
}
// smoke puffs: soft sprites that grow, drift, turn slowly and fade; heavy ones roll forward from the mouth
function zpPuff(a, x, y, z, vx, vy, vz, size, op, life) {
  const tint = new THREE.Color(0xdfe2d6).lerp(new THREE.Color(a.p.col), 0.12);
  const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.smoke, color: tint, transparent: true, opacity: 0, depthWrite: false, rotation: Math.random() * TAU }));
  m.position.set(x, y, z); m.scale.set(size, size, 1); vmScene.add(m);
  a.puffs.push({ m, v: [vx, vy, vz], s0: size, op, life: 0, max: life, spin: (Math.random() - 0.5) * 1.2 });
}
function zpTick(dt) {
  if (ZP.freeze) return;   // test pictures step the clock by hand
  if (ZP.wobT > 0) ZP.wobT -= dt;
  const a = ZP.anim; if (!a) return;
  a.t += dt; const t = a.t / a.k, an = a.p.anim;
  zpKey(a.tr.R, t, a.R); if (a.L) zpKey(a.tr.L, t, a.L);
  // breathing sway on top of the keyframes
  a.root.position.set(Math.sin(t * 1.7) * 0.003, Math.sin(t * 2.3) * 0.003, 0);
  if (an === 'bowl') {
    const lit = t > 0.85 && t < 1.8;
    a.flame.visible = lit; a.flameLight.intensity = lit ? 0.9 + Math.random() * 0.4 : 0;
    if (lit) { const lean = clamp((t - 0.95) * 3, 0, 1); a.flame.rotation.set(0, 0, 0.9 * lean + (Math.random() - 0.5) * 0.15); a.flame.scale.set(1, 0.85 + Math.random() * 0.3 + lean * 0.3, 1); }
    const draw = t > 1.0 && t < 1.95 ? Math.min(1, (t - 1.0) * 2) : Math.max(0, 1 - (t - 1.95) * 1.5);
    a.cherry.material.emissiveIntensity = draw * (2 + Math.sin(t * 25) * 0.6);
    if (t > 1.0 && t < 2.3 && Math.random() < dt * 14) { const w = new THREE.Vector3(); a.cherry.getWorldPosition(w); zpPuff(a, w.x, w.y + 0.005, w.z, (Math.random() - 0.5) * 0.01, 0.035, 0, 0.012, 0.35, 1.0); }
  } else if (an === 'joint') {
    const pull = t > 0.65 && t < 1.7 ? Math.min(1, (t - 0.65) * 2.5) : 0;
    a.cherry.material.emissiveIntensity = 1.2 + pull * (2.5 + Math.sin(t * 30) * 0.8); a.cherryLight.intensity = 0.15 + pull * 0.9;
    const w = new THREE.Vector3(); a.cherry.getWorldPosition(w);
    if (t < a.dur && Math.random() < dt * (pull ? 4 : 9)) zpPuff(a, w.x, w.y + 0.004, w.z, (Math.random() - 0.5) * 0.008, 0.03 + Math.random() * 0.015, 0.002, 0.008, 0.3, 1.6);   // the thin trail off the tip
    if (pull && Math.random() < dt * 18) { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.flash, color: 0xffa040, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false })); m.position.copy(w); m.scale.set(0.006, 0.006, 1); vmScene.add(m); a.sparks.push({ m, v: [(Math.random() - 0.5) * 0.06, 0.03 + Math.random() * 0.05, (Math.random() - 0.5) * 0.04], life: 0, max: 0.35 }); }
    if (t > 2.84 && !a.flicked) { a.flicked = true; a.ash.visible = false; for (let i = 0; i < 6; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.003, 0.003), zpMat(0x8a8680)); m.position.copy(w); vmScene.add(m); a.sparks.push({ m, v: [(Math.random() - 0.5) * 0.04, -0.02, (Math.random() - 0.5) * 0.03], life: 0, max: 0.8, grav: true }); } }
  } else if (a.bites) {
    for (let i = 0; i < a.bites.length; i++) if (t > [0.76, 1.36, 1.96][i] && !a.bites[i].done) {
      a.bites[i].done = true; for (const m of a.bites[i]) m.visible = false;
      const w = new THREE.Vector3(); a.bear.getWorldPosition(w);
      for (let k = 0; k < 7; k++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.0022, 6, 4), a.bear.children[0].material); m.position.copy(w); vmScene.add(m); a.sparks.push({ m, v: [(Math.random() - 0.5) * 0.06, 0.01 + Math.random() * 0.02, (Math.random() - 0.5) * 0.04], life: 0, max: 0.7, grav: true }); }
    }
    if (t > 0.8 && t < 2.6) a.root.position.y += Math.abs(Math.sin(t * 11)) * -0.004;   // chewing
  }
  // the exhale: a dense rolling cloud from the mouth
  const ex0 = an === 'bowl' ? 2.25 : an === 'joint' ? 1.8 : 99;
  if (t > ex0 && t < ex0 + 1.1 && Math.random() < dt * 30) {
    const k = (t - ex0) / 1.1;
    zpPuff(a, (Math.random() - 0.5) * 0.02, -0.05 + Math.random() * 0.01, -0.17, (Math.random() - 0.5) * 0.08, 0.02 + Math.random() * 0.04 + k * 0.03, -0.18 - Math.random() * 0.14, 0.035, 0.6 * (1 - k * 0.5), 1.9);
  }
  if (a.cough && t > 3.0 && t < 3.7 && Math.random() < dt * 25) zpPuff(a, (Math.random() - 0.5) * 0.03, -0.05, -0.16, (Math.random() - 0.5) * 0.15, 0.05, -0.3, 0.03, 0.5, 1.2);
  for (let i = a.puffs.length - 1; i >= 0; i--) {
    const s = a.puffs[i]; s.life += dt; const f = s.life / s.max;
    s.v[2] *= 1 - dt * 0.8; s.v[0] *= 1 - dt * 0.5; s.v[1] += dt * 0.01;
    s.m.position.x += s.v[0] * dt; s.m.position.y += s.v[1] * dt; s.m.position.z += s.v[2] * dt;
    const sc = s.s0 * (1 + f * 5); s.m.scale.set(sc, sc, 1); s.m.material.rotation += s.spin * dt;
    s.m.material.opacity = s.op * Math.min(1, s.life * 6) * (1 - f) * (1 - f * 0.3);
    if (f >= 1) { vmScene.remove(s.m); a.puffs.splice(i, 1); }
  }
  for (let i = a.sparks.length - 1; i >= 0; i--) { const s = a.sparks[i]; s.life += dt; if (s.grav) s.v[1] -= dt * 0.25; s.m.position.x += s.v[0] * dt; s.m.position.y += s.v[1] * dt; s.m.position.z += s.v[2] * dt; if (s.m.material.opacity !== undefined && !s.grav) s.m.material.opacity = 1 - s.life / s.max; if (s.life > s.max) { vmScene.remove(s.m); a.sparks.splice(i, 1); } }
  // the haze kicks in near the end: a slow wobble of the view
  const hz = an === 'edible' ? 2.2 : ex0 + 0.3;
  if (t > hz && !a.hazed) { a.hazed = true; zpHaze(a.p); ZP.wobT = 3.5; }
  const done = t >= a.dur;
  if (done) { a.R.visible = false; if (a.L) a.L.visible = false; const gun = gunObjs[G.cur]; if (gun && !gun.visible) gun.visible = true; }
  if (done && ((!a.puffs.length && !a.sparks.length) || t > a.dur + 3)) zpEndAnim();   // (the joint's trail used to keep smoking forever, so no other perk could be bought after a joint perk)
}
// the wobble outlasts the animation a little (applied to the world camera's roll, fades out)
function zpWobble() {
  if (!(ZP.wobT > 0)) return;
  const k = Math.min(1, ZP.wobT / 1.5) * 0.012;
  camera.rotation.z += Math.sin(NOW * 1.6) * k; camera.position.y += Math.sin(NOW * 1.1) * k * 0.6;
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
