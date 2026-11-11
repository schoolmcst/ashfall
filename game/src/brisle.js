/* ================================================================== LAST TOKE ISLAND LIFE (1.2.93)
   DEATH BOXES: whoever dies in a round drops a STASH BOX where they fell: their gun (and its rarity), ammo, heals. USE
     opens it: a list you take from one by one (a gun swaps with yours: yours goes in the box). Offline, and on each
     player's own screen online.
   HOLD TO SWAP: with a gun already in your hands, a gun on the floor takes a short USE hold (a tap picks up the rest).
   THE MOVING CLOUD: from the 4th circle the next circle drifts while the cloud closes, so the safe spot slides.
   GROW TENTS at GREENHOUSE ROW and THE FARM: six plants under purple lights in each; hold USE on a ripe plant to harvest
     it for $200 (yours only: everyone has their own harvest).
   PLYWOOD SHEDS: freestanding board walls round the places that break under fire and explosions (the breakable
     system, so they break for everyone online).
   DAY TO NIGHT: the sun goes down as the circles close; the final circles are at night.
   WIND: a steady wind (the same for everyone in a round) pushes you while you float in; the HUD shows which way.
   THE TUNNELS: three hatch huts (by OLD TOWN, THE BUNKERS and the POWER STATION) with a ladder down a shaft to concrete
     tunnels 9 m under the island that link them.
   THE BONG EXPRESS: a little train that runs back and forth on a track across the north of the island (z 134), with a
     station at each end. Stand on the flat cars to ride; the last car carries a stash with an EPIC gun.
   SWIMMING: in the sea you float at the surface (slow, no shooting) instead of walking on the sea floor. */
var BRI = { boxes: [], box: null, tents: [], sheds: [], tun: [], tunGroup: null, train: null, nightK: -1, envT: 0, wind: [0, 0], uH: false, harvT: 0, swim: false, age: 0 };
var BRI_SEA = -1.15;
// is (x, z) over the tunnels (only there does the ground stop being the floor when you're under it)
function briUnder(x, z) { const R = BRI.tunRects; if (!R) return false; for (const r of R) if (x > r[0] && x < r[1] && z > r[2] && z < r[3]) return true; return false; }   // the swimming height: the water (-0.35) less chest depth
const BRI_TRAIN = { z: 134, x0: -92, x1: 61, v: 8, pause: 8, cars: [{ k: 'engine', len: 6 }, { k: 'flat', len: 6 }, { k: 'flat', len: 6 }] };
/* ---------- the round starts */
function briSetup() {
  briClear(); if (!M || !M.br) return; const B = M.br, seed = (B.crates && B.crates[0] ? Math.round(B.crates[0].x * 10) : 7) >>> 0;
  BRI.age = 0; BRI.nightK = -1; BRI.rode = false; const a = (seed % 360) / 180 * Math.PI; BRI.wind = [Math.cos(a) * 3, Math.sin(a) * 3];
  if (curMap !== 'stashisle') return;
  briTents(); briSheds(); briTunnels(); briTrainBuild();
}
function briClear() {
  for (const b of BRI.boxes) if (b.g.parent) b.g.parent.remove(b.g); BRI.boxes = []; briBoxClose();
  for (const t of BRI.tents) if (t.g.parent) t.g.parent.remove(t.g); BRI.tents = [];
  for (const o of BRI.sheds) { try { brkBreak(o, false, true); } catch (e) {} delete BRK.list[o.id]; } BRI.sheds = [];
  for (const t of BRI.tun) { if (t.m && t.m.parent) t.m.parent.remove(t.m); const i = wallMeshes.indexOf(t.m); if (i >= 0) wallMeshes.splice(i, 1); const j = boxes.indexOf(t.b); if (j >= 0) boxes.splice(j, 1); } BRI.tun = []; BRI.tunRects = null;
  if (BRI.tunGroup && BRI.tunGroup.parent) BRI.tunGroup.parent.remove(BRI.tunGroup); BRI.tunGroup = null;
  if (BRI.train && BRI.train.g.parent) BRI.train.g.parent.remove(BRI.train.g); BRI.train = null;
  if (BRI.nightK > 0) try { applyEnv(MAPS[curMap] && MAPS[curMap].env); } catch (e) {} BRI.nightK = -1;
  try { rebuildBoxGrid(); } catch (e) {}
}
/* ---------- death boxes */
function briBoxDrop(en, x, y, z, items) {
  if (!items.length) return; const g = new THREE.Group(); g.position.set(x, groundAt(x, z, y + 0.5) + 0.01, z); scene.add(g);
  const wood = new THREE.MeshStandardMaterial({ color: 0x2c3a24, roughness: 0.8 }), glow = new THREE.MeshStandardMaterial({ color: 0x113311, emissive: 0x5dff7a, emissiveIntensity: 1.3 });
  const b = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 0.6), wood); b.position.y = 0.25; b.castShadow = true; g.add(b);
  const lid = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.06, 0.64), wood); lid.position.y = 0.53; g.add(lid);
  const s = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 0.02), glow); s.position.set(0, 0.32, 0.31); g.add(s);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.25, 5, 8, 1, true), new THREE.MeshBasicMaterial({ color: 0x5dff7a, transparent: true, opacity: 0.1, depthWrite: false, side: THREE.DoubleSide })); beam.position.y = 2.8; g.add(beam);
  g.rotation.y = Math.random() * TAU; const box = { name: en.isPlayer ? (M.online ? (NET.nick || 'A') + "'S" : 'YOUR') : (en.name || 'A') + "'S", x, z, y: g.position.y, g, items }; BRI.boxes.push(box); return box;
}
function briBoxItems(en) {
  const out = [];
  if (en.isPlayer) {
    const w = WEAPONS[0]; if (w && w.def && w.def.id !== 'sidearm' && WEAPONS.length > 1) out.push({ k: 'gun', gun: w.def.id, tier: BRL.rar[w.def.id] | 0 });
    for (const t in BRL.ammo) if (BRL.ammo[t] > 0) out.push({ k: 'ammo', t, n: BRL.ammo[t] });
    for (const h in BRL.heals) for (let i = 0; i < BRL.heals[h]; i++) out.push({ k: 'heal', h });
  } else {
    if (en.lastGun && ARM[en.lastGun] && ARM[en.lastGun].cat !== 'pi') out.push({ k: 'gun', gun: en.lastGun, tier: clamp(en.lastTier === undefined ? 0 : en.lastTier, 0, 3) });
    const t = en.lastGun && ARM[en.lastGun] ? brlAmmoOf(ARM[en.lastGun]) : 'light'; out.push({ k: 'ammo', t, n: BRL_AMMO[t].can });
    if (Math.random() < 0.6) out.push({ k: 'heal', h: Math.random() < 0.7 ? 'nug' : 'brownie' }); if (Math.random() < 0.3) out.push({ k: 'plate' });
  }
  return out;
}
const briItemName = it => it.k === 'gun' ? `${BRL_RAR[it.tier].n} ${ARM[it.gun].name}` : it.k === 'ammo' ? `${BRL_AMMO[it.t].n} AMMO ×${it.n}` : it.k === 'heal' ? BRL_HEAL[it.h].n : it.k === 'plate' ? 'ARMOR PLATE' : '?';
function briBoxOpen(b) {
  briBoxClose(); BRI.box = b; G.menuOpen = true; try { document.exitPointerLock && document.exitPointerLock(); } catch (e) {}
  const o = document.createElement('div'); o.id = 'brBox'; o.className = 'onb-ov'; document.body.appendChild(o);
  const render = () => {
    o.innerHTML = `<div class="onb-box"><small>STASH BOX</small><b>${b.name} STASH</b><div class="onb-tiles">${b.items.map((it, i) => it.t ? '' : `<button class="onb-t" data-bx="${i}"${it.k === 'gun' ? ` style="border-color:${BRL_RAR[it.tier].css}"` : ''}><b>${briItemName(it)}</b><span>${it.k === 'gun' ? (WEAPONS.length > 1 && WEAPONS[0].def.id !== 'sidearm' ? 'TAKE · yours goes in the box' : 'TAKE') : 'TAKE'}</span></button>`).join('') || ''}${b.items.some(it => !it.t) ? '' : '<p>EMPTY</p>'}</div><button class="btn" data-close="1">CLOSE</button></div>`;
    for (const x of o.querySelectorAll('[data-bx]')) x.onclick = () => { briBoxTake(b, +x.dataset.bx); render(); };
    o.querySelector('[data-close]').onclick = briBoxClose;
    setTimeout(() => { const f = o.querySelector('[data-bx]') || o.querySelector('[data-close]'); if (f) f.focus(); }, 0);
  };
  render(); BRI.boxKey = e => { if (e.code === 'Escape' || e.code === bind('use')) { e.preventDefault(); e.stopPropagation(); briBoxClose(); } }; addEventListener('keydown', BRI.boxKey, true);
}
function briBoxClose() {
  const o = $('brBox'); if (o) o.remove(); if (BRI.boxKey) removeEventListener('keydown', BRI.boxKey, true); BRI.boxKey = null;
  if (BRI.box) { BRI.box = null; G.menuOpen = false; BRI.uH = true; try { if (G.state === 'playing') lockPointer(); } catch (e) {} }
}
function briBoxTake(b, i) {
  const it = b.items[i]; if (!it || it.t) return; let done = true;
  if (it.k === 'gun') { const old = WEAPONS.length > 1 && WEAPONS[0].def.id !== 'sidearm' ? { k: 'gun', gun: WEAPONS[0].def.id, tier: BRL.rar[WEAPONS[0].def.id] | 0 } : null; brlGive(ARM[it.gun], it.tier); if (old && !M.online) b.items.push(old); }   // (online the old gun can't go into someone else's box)
  else if (it.k === 'ammo') { const A = BRL_AMMO[it.t], room = A.max - BRL.ammo[it.t]; if (room <= 0) { showMsg('FULL'); return; } BRL.ammo[it.t] += Math.min(room, it.n); brlAmmoSync(true); }
  else if (it.k === 'heal') { if (BRL.heals[it.h] >= BRL_HEAL[it.h].max) { showMsg('FULL'); return; } BRL.heals[it.h]++; }
  else if (it.k === 'plate') { if (LT.plates >= 5) { showMsg('FULL'); return; } LT.plates++; }
  if (done) { it.t = true; try { brnTake(b, i); } catch (e) {} }
  try { sfx.pickup(); } catch (e) {}
}
/* ---------- grow tents */
function briTents() {
  const leaf = new THREE.MeshLambertMaterial({ color: 0x2a6a1a }), stem = new THREE.MeshStandardMaterial({ color: 0x4a6a2a }), pot = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.9 }), bud = new THREE.MeshLambertMaterial({ color: 0x6a9a3a });
  const cloth = new THREE.MeshStandardMaterial({ color: 0xe8e8e0, transparent: true, opacity: 0.35, side: THREE.DoubleSide, roughness: 0.9, depthWrite: false }), pole = new THREE.MeshStandardMaterial({ color: 0x9a9a9a, metalness: 0.6, roughness: 0.4 }), led = new THREE.MeshStandardMaterial({ color: 0x220a33, emissive: 0xb04aff, emissiveIntensity: 2 });
  for (const [px, pz] of [[-120, -96], [-120, 128]]) {
    const o = brfgOutdoor(px, pz), g = new THREE.Group(); g.position.set(o.x, o.y, o.z); scene.add(g);
    for (const [x, z] of [[-3, -2], [3, -2], [-3, 2], [3, 2]]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.05, 2.4, 0.05), pole); p.position.set(x, 1.2, z); g.add(p); }
    const roof = new THREE.Mesh(new THREE.BoxGeometry(6, 0.02, 4), cloth); roof.position.y = 2.4; g.add(roof);
    for (const [x, z, w, d] of [[0, -2, 6, 0.02], [0, 2, 6, 0.02], [3, 0, 0.02, 4]]) { const s = new THREE.Mesh(new THREE.BoxGeometry(w, 2.4, d), cloth); s.position.set(x, 1.2, z); g.add(s); }
    for (const z of [-0.8, 0.8]) { const l = new THREE.Mesh(new THREE.BoxGeometry(5, 0.05, 0.15), led); l.position.set(0, 2.3, z); g.add(l); }
    const plants = [];
    for (let i = 0; i < 6; i++) { const x = -2 + (i % 3) * 2, z = i < 3 ? -0.8 : 0.8, p = new THREE.Group(); p.position.set(x, 0, z); g.add(p);
      const pt = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.18, 0.3, 10), pot); pt.position.y = 0.15; p.add(pt);
      const top = new THREE.Group(); top.position.y = 0.3; p.add(top); const st = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 1.1, 6), stem); st.position.y = 0.55; top.add(st);
      for (let k = 0; k < 7; k++) { const lf = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.45, 4), leaf); const a = k / 7 * TAU; lf.position.set(Math.cos(a) * 0.15, 0.3 + k * 0.1, Math.sin(a) * 0.15); lf.rotation.set(Math.sin(a) * 1.1, 0, -Math.cos(a) * 1.1); top.add(lf); }
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), bud); b.scale.y = 1.6; b.position.y = 1.15; top.add(b);
      plants.push({ p, top, ripe: true }); }
    BRI.tents.push({ x: o.x, z: o.z, y: o.y, g, plants });
  }
}
function briTentTick(dt) {
  const u = kb('use') || pad.use; let near = null;
  for (const t of BRI.tents) { if (Math.abs(t.x - P.x) > 5 || Math.abs(t.z - P.z) > 4) continue; for (const pl of t.plants) { if (!pl.ripe) continue; const w = pl.p.getWorldPosition(new THREE.Vector3()); if (Math.hypot(w.x - P.x, w.z - P.z) < 1.1) { near = pl; break; } } }
  if (!near) { BRI.harvT = 0; return; }
  if (u) { BRI.harvT += dt; if (BRI.harvT >= 1.5) { BRI.harvT = 0; near.ripe = false; near.top.scale.set(0.35, 0.2, 0.35); LT.cash += 200; try { brpEvt('harvest'); } catch (e) {} try { showMsg('+$200 · HARVESTED'); sfx.pickup(); } catch (e) {} } }
  else BRI.harvT = 0;
  try { G.interactTxt = u ? `HARVESTING · ${Math.round(BRI.harvT / 1.5 * 100)}%` : `RIPE PLANT · HOLD ${actName('use')} TO HARVEST ($200)`; showMsgOnce(G.interactTxt); } catch (e) {}
}
/* ---------- plywood sheds (breakable) */
function briSheds() {
  const pois = typeof mapPois === 'function' ? mapPois() : []; let id = 7100;
  for (const p of pois) { if (BRI.sheds.length >= 36) break; const o = brfgOutdoor(p.x + p.w * 0.38, p.z + p.d * 0.05), y = o.y;
    for (const [dx, dz, w, d] of [[-1.3, 0, 0.16, 2.4], [1.3, 0, 0.16, 2.4], [0, 1.25, 2.4, 0.16]]) BRI.sheds.push(brkMake(id++, 'boards', o.x + dx, o.z + dz, w, d, y)); }
}
/* ---------- the tunnels */
function briTunnels() {
  const T = BRI.tun, grp = BRI.tunGroup = new THREE.Group(); scene.add(grp); const FY = -9, Hh = 3.2, W = 3.2;
  const con = MAT.concrete || new THREE.MeshStandardMaterial({ color: 0x8a8a86 }), lamp = new THREE.MeshStandardMaterial({ color: 0x223322, emissive: 0xd8ffc8, emissiveIntensity: 1.6 });
  const add = (cx, cz, w, d, h, y0, mat) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat || con); m.position.set(cx, y0 + h / 2, cz); m.castShadow = false; m.receiveShadow = true; grp.add(m); wallMeshes.push(m); const b = mkBox(cx, cz, w, d, h, { y: y0 }); boxes.push(b); T.push({ m, b }); };
  const A = brfgOutdoor(4, 58), Bp = brfgOutdoor(40, 96), Cp = brfgOutdoor(-34, 100), ends = [A, Bp, Cp];
  // a straight piece along x or z (floor, walls, ceiling, lights)
  BRI.tunRects = [];
  const seg = (x0, z0, x1, z1) => { const alongX = Math.abs(x1 - x0) > Math.abs(z1 - z0), L = (alongX ? Math.abs(x1 - x0) : Math.abs(z1 - z0)) + W, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    BRI.tunRects.push([cx - (alongX ? L : W) / 2 - 0.5, cx + (alongX ? L : W) / 2 + 0.5, cz - (alongX ? W : L) / 2 - 0.5, cz + (alongX ? W : L) / 2 + 0.5]);
    add(cx, cz, alongX ? L : W, alongX ? W : L, 0.3, FY - 0.3); add(cx, cz, alongX ? L : W, alongX ? W : L, 0.3, FY + Hh);
    for (const s of [-1, 1]) add(alongX ? cx : cx + s * (W / 2 + 0.15), alongX ? cz + s * (W / 2 + 0.15) : cz, alongX ? L : 0.3, alongX ? 0.3 : L, Hh, FY);
    for (let t = -L / 2 + 3; t < L / 2 - 2; t += 7) { const m = new THREE.Mesh(new THREE.BoxGeometry(alongX ? 1.4 : 0.2, 0.06, alongX ? 0.2 : 1.4), lamp); m.position.set(alongX ? cx + t : cx, FY + Hh - 0.04, alongX ? cz : cz + t); grp.add(m); } };
  for (const E of [Bp, Cp]) { seg(A.x, A.z, A.x, E.z); seg(A.x, E.z, E.x, E.z); }
  // the end walls (the corridors are open-ended at the corners only)
  // a shaft and a hatch hut at each end, with a ladder down
  const hut = MAT.plaster || con, hatch = new THREE.MeshBasicMaterial({ color: 0x050505 });
  for (const E of ends) {
    const top = TH(E.x, E.z); BRI.tunRects.push([E.x - 1.2, E.x + 1.2, E.z - 1.2, E.z + 1.2]);   // the shaft
    for (const [dx, dz, w, d] of [[-1, 0, 0.2, 2.2], [1, 0, 0.2, 2.2], [0, -1, 2.2, 0.2], [0, 1, 2.2, 0.2]]) add(E.x + dx * 0.95, E.z + dz * 0.95, w, d, top - FY - 0.05, FY);
    // the hut over it: walls with a door to the east, a roof
    const hx = E.x + 0.9; for (const [dx, dz, w, d] of [[0, -1.6, 3.6, 0.2], [0, 1.6, 3.6, 0.2], [-1.8, 0, 0.2, 3.4]]) add(hx + dx, E.z + dz, w, d, 2.5, top, hut);
    for (const s of [-1, 1]) add(hx + 1.8, E.z + s * 1.15, 0.2, 1.1, 2.5, top, hut); add(hx, E.z, 3.8, 3.6, 0.15, top + 2.5, hut);
    const hm = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.7), hatch); hm.rotation.x = -Math.PI / 2; hm.position.set(E.x, top + 0.04, E.z); grp.add(hm);
    // the ladder down the shaft (climb it like the building ladders)
    const lad = new THREE.MeshStandardMaterial({ color: 0x8a8e92, roughness: 0.45, metalness: 0.7 }), lg = new THREE.Group(), h = top - FY; lg.position.set(E.x - 0.75, FY, E.z); lg.rotation.y = Math.PI / 2; grp.add(lg);
    for (const s of [-0.24, 0.24]) { const r = new THREE.Mesh(new THREE.BoxGeometry(0.05, h + 0.9, 0.05), lad); r.position.set(s, (h + 0.9) / 2, 0); lg.add(r); }
    for (let yy = 0.3; yy < h + 0.6; yy += 0.32) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.48, 6), lad); r.rotation.z = Math.PI / 2; r.position.y = yy; lg.add(r); }
    BRFG.ladders.push({ x: E.x - 0.45, z: E.z, nx: 1, nz: 0, y0: FY, y1: top + 0.02, wx: E.x - 1.07, wz: E.z, tunnel: true });
  }
  BRI.tunEnds = ends; try { rebuildBoxGrid(); } catch (e) {}
}
/* ---------- the train */
function briTrainBuild() {
  const R = BRI_TRAIN, g = new THREE.Group(); scene.add(g);
  const rail = new THREE.MeshStandardMaterial({ color: 0x6a6e72, metalness: 0.7, roughness: 0.4 }), sleeper = new THREE.MeshStandardMaterial({ color: 0x4a3420, roughness: 0.9 });
  for (let x = R.x0 - 16; x < R.x1 + 8; x += 4) { const y0 = TH(x, R.z), y1 = TH(x + 4, R.z), a = Math.atan2(y1 - y0, 4); for (const s of [-0.72, 0.72]) { const r = new THREE.Mesh(new THREE.BoxGeometry(4.02, 0.08, 0.08), rail); r.position.set(x + 2, (y0 + y1) / 2 + 0.16, R.z + s); r.rotation.z = a; g.add(r); }
    for (const dx of [0.6, 2.6]) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.08, 2.1), sleeper); s.position.set(x + dx, TH(x + dx, R.z) + 0.06, R.z); g.add(s); } }
  // the stations: a platform and a sign at each end
  for (const x of [R.x0 - 19, R.x1 + 6]) { const pl = new THREE.Mesh(new THREE.BoxGeometry(8, 0.6, 2.4), MAT.concrete || sleeper); pl.position.set(x, TH(x, R.z + 2.6) + 0.3, R.z + 2.6); g.add(pl);
    const sg = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.6, 0.06), new THREE.MeshStandardMaterial({ color: 0x113311, emissive: 0x5dff7a, emissiveIntensity: 1.2 })); sg.position.set(x, TH(x, R.z + 2.6) + 2.6, R.z + 3.7); g.add(sg); }
  const body = new THREE.MeshStandardMaterial({ color: 0x1f4a2a, roughness: 0.55, metalness: 0.3 }), dark = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.6 }), gold = new THREE.MeshStandardMaterial({ color: 0x221a00, emissive: 0xffc83a, emissiveIntensity: 1.1 });
  const cars = R.cars.map((c, i) => { const cg = new THREE.Group(); g.add(cg);
    const base = new THREE.Mesh(new THREE.BoxGeometry(c.len, 0.5, 2.5), dark); base.position.y = 0.75; cg.add(base);
    for (const dx of [-c.len / 2 + 1, c.len / 2 - 1]) for (const s of [-0.75, 0.75]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.2, 14), dark); w.rotation.x = Math.PI / 2; w.position.set(dx, 0.45, s); cg.add(w); }
    if (c.k === 'engine') { const cab = new THREE.Mesh(new THREE.BoxGeometry(c.len, 2.4, 2.5), body); cab.position.y = 2.2; cab.castShadow = true; cg.add(cab); const st = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 1.2, 10), dark); st.position.set(c.len / 2 - 1, 3.9, 0); cg.add(st);
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(c.len + 0.02, 0.15, 2.52), gold); stripe.position.y = 2.6; cg.add(stripe); }
    else { const deck = new THREE.Mesh(new THREE.BoxGeometry(c.len, 0.12, 2.5), new THREE.MeshStandardMaterial({ color: 0x6a4a30, roughness: 0.85 })); deck.position.y = 1.06; cg.add(deck); }
    return { k: c.k, len: c.len, g: cg, off: -i * (c.len + 0.6), x: 0, y: 0, top: c.k === 'engine' ? 3.4 : 1.12 }; });
  BRI.train = { g, cars, x: R.x0, dir: 1, dx: 0 };
  briTrainPlace(0);
}
// where the train is at a time t (seconds into the round): back and forth with a stop at each end
function briTrainAt(t) { const R = BRI_TRAIN, L = R.x1 - R.x0, run = L / R.v, per = 2 * (run + R.pause), u = ((t % per) + per) % per;
  if (u < R.pause) return { x: R.x0, dir: 1 }; if (u < R.pause + run) return { x: R.x0 + (u - R.pause) * R.v, dir: 1 }; if (u < 2 * R.pause + run) return { x: R.x1, dir: -1 }; return { x: R.x1 - (u - 2 * R.pause - run) * R.v, dir: -1 }; }
function briTrainPlace(t) {
  const T = BRI.train; if (!T) return; const s = briTrainAt(t), R = BRI_TRAIN; T.dx = s.x - T.x; T.x = s.x;
  for (const c of T.cars) { const cx = s.x + c.off * (s.dir > 0 ? 1 : 1) - (s.dir > 0 ? 0 : 0); c.x = cx; c.y = TH(cx, R.z) + 0.05; const sl = Math.atan2(TH(cx + 2, R.z) - TH(cx - 2, R.z), 4); c.g.position.set(cx, c.y, R.z); c.g.rotation.z = sl; }
  if (T.set) { const c = T.cars[T.cars.length - 1]; T.set.x = c.x; T.set.z = R.z; T.set.y = c.y + c.top; }
}
// standing on the train (groundAt), and not walking through it (resolve)
function briGround(x, z, feetY) { const T = BRI.train; if (!T || Math.abs(z - BRI_TRAIN.z) > 1.3) return -1e9; let g = -1e9; for (const c of T.cars) if (Math.abs(x - c.x) < c.len / 2 && feetY >= c.y + c.top - 0.6) g = Math.max(g, c.y + c.top); return g; }
function briResolve(pos, r, feetY) { const T = BRI.train; if (!T || Math.abs(pos.z - BRI_TRAIN.z) > 1.25 + r) return; for (const c of T.cars) { if (Math.abs(pos.x - c.x) > c.len / 2 + r || feetY >= c.y + c.top - 0.4) continue; const dz = pos.z - BRI_TRAIN.z; pos.z = BRI_TRAIN.z + Math.sign(dz || 1) * (1.25 + r); } }
// the stash on the last car (from brlBuild, so it shares the seed and the online ids)
function briTrainLoot() {
  const T = BRI.train; if (!T || typeof brlItem !== 'function') return; const c = T.cars[T.cars.length - 1], r = brlRng((BRL.seed ^ 0x7a17) >>> 0);
  const g = new THREE.Group(); g.position.y = c.top; c.g.add(g); const set = { id: 'tr_', g, n: 0, x: c.x, z: BRI_TRAIN.z, y: c.y + c.top, kind: 'train' }; BRL.sets.push(set); T.set = set;
  brlMesh(g, 'box', brlMats().dark, 0, 0.2, 0, 1.4, 0.4, 0.8); const gun = brlRollGun(r, 2); brlItem(set, 'gun', { gun: gun.id, tier: 2 }, -0.05, 0.42, 0, 'lie');
  const t = brlAmmoOf(gun); brlItem(set, 'ammo', { t, n: BRL_AMMO[t].can }, 1.0, 0, 0.6); brlItem(set, 'heal', { h: 'brownie' }, -1.0, 0, 0.6);
}
/* ---------- day to night */
function briNight(B) {
  const k = clamp((Math.max(0, B.phase) + (B.closing ? 0.5 : 0)) / 4.5, 0, 1); if (Math.abs(k - BRI.nightK) < 0.04) return; BRI.nightK = k;
  const base = Object.assign({}, ENV_DEFAULT, MAPS[curMap] && MAPS[curMap].env), night = { top: 0x0b1428, horizon: 0x2a2f48, sunCol: 0xff9a5a, hemiSky: 0x34405e, hemiGround: 0x1a1a22 };
  const mix = (a, b, t) => new THREE.Color(a).lerp(new THREE.Color(b), t), dusk = Math.min(1, k * 1.6), dark = Math.max(0, (k - 0.45) / 0.55);
  try { skyMat.uniforms.top.value = mix(base.top, night.top, dark); hemi.color = mix(base.hemiSky, night.hemiSky, dark); hemi.groundColor = mix(base.hemiGround, night.hemiGround, dark);
    sun.color = mix(base.sunCol, night.sunCol, dusk); sun.intensity = base.sunI * (1 - 0.8 * dark); SUN_POS.set(base.sun[0], base.sun[1] * (1 - 0.75 * dusk) + 4, base.sun[2]); skyMat.uniforms.sunDir.value.copy(SUN_POS).normalize();
    scene.fog.color.copy(mix(base.horizon, night.horizon, dark)); ENV_EXPOSURE = base.exposure * (1 - 0.18 * dark); renderer.toneMappingExposure = ENV_EXPOSURE * S.brightness / 100; } catch (e) {}
}
/* ---------- every frame (from brUpdate) */
function briTick(dt) {
  if (!M || !M.br) return; const B = M.br, host = netHostNow(); BRI.age += dt;
  // deaths -> stash boxes (not in the warm-up)
  if (B.phase >= -1) for (const en of M.entries) {
    const e = en.bot; if (e && en.alive !== false && e.group) { en.lastGun = e.gunId; en.lastTier = e.brTier; en.lastPos = { x: e.group.position.x, y: e.group.position.y, z: e.group.position.z }; }
    if (en.alive === false && !en.briBox) { en.briBox = true; const p = en.isPlayer ? { x: P.x, y: P.y, z: P.z } : en.lastPos; if (p && !(typeof DUEL !== 'undefined' && DUEL.on) && (!M.online || en.isPlayer || (netHostNow() && !en.net))) { const bx = briBoxDrop(en, p.x, p.y, p.z, briBoxItems(en)); if (bx && M.online) brnBoxMade(bx); } }   // online: my own box, and the host's bots' (brnet.js)
    else if (en.alive !== false) en.briBox = false;
  }
  // a stash box next to me: USE opens it
  const u = kb('use') || pad.use;
  if (!BRI.box && playerAlive()) for (const b of BRI.boxes) if (b.items.some(it => !it.t) && Math.hypot(b.x - P.x, b.z - P.z) < 1.7 && Math.abs(b.y - P.y) < 1.6) { try { showMsgOnce(`${b.name} STASH BOX · ${actName('use')} TO OPEN`); } catch (e) {} if (u && !BRI.uH) briBoxOpen(b); break; }
  if (BRI.box && (!playerAlive() || Math.hypot(BRI.box.x - P.x, BRI.box.z - P.z) > 2.6)) briBoxClose();
  BRI.uH = u;
  for (const b of BRI.boxes) if (!b.items.some(it => !it.t) && b.g.visible) b.g.children[3] && (b.g.children[3].visible = false);
  // the moving cloud: from the 4th circle the next one drifts while it closes
  if (host && B.closing && B.phase >= 3 && B.to && B.from) { if (!B.drift) { const a = Math.random() * TAU; B.drift = [Math.cos(a), Math.sin(a)]; } const sp = 2.2 * dt; B.to.x += B.drift[0] * sp; B.to.z += B.drift[1] * sp; if (Math.hypot(B.to.x - B.from.x, B.to.z - B.from.z) + B.to.r > B.from.r * 0.98) { B.drift = [-B.drift[0], -B.drift[1]]; B.to.x += B.drift[0] * sp * 2; B.to.z += B.drift[1] * sp * 2; } }
  if (!B.closing) B.drift = null;
  briTentTick(dt);
  // the train
  if (BRI.train) { const t = host ? BRI.age : (B.trainAge !== undefined ? B.trainAge : BRI.age); briTrainPlace(t); const T = BRI.train;
    if (playerAlive() && Math.abs(P.z - BRI_TRAIN.z) < 1.3) for (const c of T.cars) if (Math.abs(P.x - c.x) < c.len / 2 && Math.abs(P.y - (c.y + c.top)) < 0.15) { P.x += T.dx; if (!BRI.rode) { BRI.rode = true; try { brpEvt('train'); } catch (e) {} } break; } }
  // night falls
  if ((BRI.envT -= dt) <= 0) { BRI.envT = 1; briNight(B); }
  // swimming
  const sw = typeof TERR !== 'undefined' && TERR.on && P.y < BRI_SEA + 0.05 && TH(P.x, P.z) < BRI_SEA - 0.05 && playerAlive();
  if (sw && !BRI.swim) try { showMsg('SWIMMING · no shooting'); } catch (e) {}
  BRI.swim = sw; if (sw) G.swapT = Math.max(G.swapT, 0.2);
  // in the tunnels
  const under = typeof TERR !== 'undefined' && TERR.on && P.y < -5 && briUnder(P.x, P.z); if (under && !BRI.under) try { showBanner('THE TUNNELS', 'under STASH ISLAND · ladders up at the hatch huts'); } catch (e) {} BRI.under = under;
}
const briSwim = () => (BRI.swim ? 0.45 : 1);
const briWind = () => (M && M.br ? BRI.wind : [0, 0]);
function briWindTxt() { const w = BRI.wind, a = Math.atan2(w[0], -w[1]), arrows = ['↑', '↗', '→', '↘', '↓', '↙', '←', '↖']; return arrows[((Math.round(a / (Math.PI / 4)) % 8) + 8) % 8]; }
function briMarkers(out) { for (const b of BRI.boxes) if (b.items.some(it => !it.t) && Math.hypot(b.x - P.x, b.z - P.z) < 30) out.push({ x: b.x, y: b.y + 1.2, z: b.z, t: 'BOX', c: '#5dff7a' }); if (BRI.train && Math.hypot(BRI.train.x - P.x, BRI_TRAIN.z - P.z) < 120) out.push({ x: BRI.train.x, y: BRI.train.cars[0].y + 4.5, z: BRI_TRAIN.z, t: 'TRAIN', c: '#ffc83a' }); for (const E of BRI.tunEnds || []) if (Math.hypot(E.x - P.x, E.z - P.z) < 50) out.push({ x: E.x, y: TH(E.x, E.z) + 3.2, z: E.z, t: 'TUNNEL', c: '#d8ffc8' }); }
