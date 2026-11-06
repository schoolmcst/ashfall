/* ================================================================== BREAKABLE COVER (1.2.84)
   Every multiplayer map (and STASH ISLAND) gets wooden cover that breaks: crate stacks, fence panels and pallet stacks,
   put down at fixed spots (the same on every machine: seeded by the map). Bullets chip them (a crate takes about two
   magazines, a fence one), explosions blow them apart. When one breaks it bursts into splinters and is gone - the
   collider too, so you can walk and shoot through where it was. Everything comes back at the start of each match.
   Online, everyone sends the ones they broke (bk in presence) and every machine breaks those too. */
const BRK = { list: [], mine: [] };
const BRK_KINDS = {
  crate: { w: 1.15, d: 1.15, h: 1.05, hp: 260, mat: 'wood' },
  fence: { w: 2.4, d: 0.14, h: 1.15, hp: 120, mat: 'wood' },
  pallets: { w: 1.25, d: 1.05, h: 0.7, hp: 180, mat: 'wood' },
};
function brkSeed(id) { let h = 2166136261; for (const c of String(id)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
// a free spot: nothing solid within r of it (the map's own boxes), on the ground
function brkFree(x, z, r) { for (const b of boxes) { if (b.top < 0.2 || b.bot > 1.8) continue; if (x > b.minx - r && x < b.maxx + r && z > b.minz - r && z < b.maxz + r) return false; } return true; }
// called by loadMap after the map is built (before the nav grid, so bots walk round them)
function brkBuild(map) {
  BRK.list = []; BRK.mine = [];
  if (!map || map.zombiesOnly || !map.layout) return;
  const rand = (() => { let s = brkSeed(map.id); return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; })();
  const pr = map.play || [-43.5, 43.5, -43.5, 43.5], n = map.id === 'stashisle' ? 26 : 12, keep = [];
  const L = map.layout; for (const k of ['spawn', 'hp', 'flags', 'sites']) for (const q of (L[k] || [])) if (q && q.x !== undefined) keep.push(q);
  for (let i = 0, tries = 0; i < n && tries < 500; tries++) {
    const x = pr[0] + 3 + rand() * (pr[1] - pr[0] - 6), z = pr[2] + 3 + rand() * (pr[3] - pr[2] - 6), kind = ['crate', 'crate', 'fence', 'pallets'][(rand() * 4) | 0], rot = rand() < 0.5;
    const K = BRK_KINDS[kind], w = rot ? K.d : K.w, d = rot ? K.w : K.d;
    if (!brkFree(x, z, Math.max(w, d) / 2 + 1.1)) continue;
    if (keep.some(q => Math.hypot(q.x - x, q.z - z) < 5)) continue;
    if (BRK.list.some(o => Math.hypot(o.x - x, o.z - z) < 7)) continue;
    if (typeof duelIn === 'function' && duelIn(x, z, 2)) continue;
    brkMake(i++, kind, x, z, w, d);
  }
}
function brkMake(id, kind, x, z, w, d) {
  const K = BRK_KINDS[kind], g = new THREE.Group();
  const mat = MAT[K.mat] || MAT.wood, dark = MAT.dark || mat;
  const add = (bw, bh, bd, px, py, pz, m) => { const me = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), m || mat); me.position.set(px, py, pz); me.castShadow = true; me.receiveShadow = true; me.userData.brk = id; g.add(me); return me; };
  if (kind === 'crate') { add(w, K.h * 0.55, d, 0, K.h * 0.275, 0); add(w * 0.8, K.h * 0.45, d * 0.8, 0.05, K.h * 0.775, -0.04); add(w + 0.02, 0.06, 0.08, 0, K.h * 0.3, d / 2, dark); }
  else if (kind === 'fence') { const along = w > d; for (let i = 0; i < 6; i++) { const o = -1.05 + i * 0.42; add(along ? 0.36 : d, K.h, along ? d : 0.36, along ? o : 0, K.h / 2, along ? 0 : o); } add(along ? w : 0.05, 0.08, along ? 0.05 : d, 0, K.h * 0.75, 0, dark); }
  else if (kind === 'shield') { add(w, K.h, d, 0, K.h / 2, 0); add(w > d ? w + 0.02 : d + 0.04, 0.12, w > d ? d + 0.04 : w + 0.02, 0, K.h * 0.82, 0, MAT.paintYellow || dark); }
  else { for (let i = 0; i < 4; i++) add(w, 0.12, d, 0, 0.08 + i * 0.17, 0); }
  g.position.set(x, 0, z); scene.add(g);   // (loadMap puts it in worldObjs with the rest of the map)
  const box = mkBox(x, z, w, d, K.h, { walk: false }); box.brk = id; boxes.push(box); boxGridDirty = true;
  // the bullet target: one invisible box, so a shot hits it like a wall
  const hit = new THREE.Mesh(new THREE.BoxGeometry(w, K.h, d), mat); hit.visible = false; hit.position.set(x, K.h / 2, z); hit.userData = { brk: id }; scene.add(hit); hit.updateMatrixWorld(true); wallMeshes.push(hit);   // raycasts ignore visible: an invisible box with the wood material (for the right chips)
  const o = { id, kind, x, z, w, d, h: K.h, hp: K.hp, max: K.hp, g, box, hit, broken: false };
  BRK.list[id] = o; return o;
}
function brkHit(id, dmg) { const o = BRK.list[id]; if (!o || o.broken) return; o.hp -= dmg; o.g.position.x = o.x + (Math.random() - 0.5) * 0.04; if (o.hp <= 0) brkBreak(o, true); }
// explosions near cover
function brkBlast(p, R) { for (const o of BRK.list) { if (!o || o.broken) continue; const d = Math.hypot(o.x - p.x, o.z - p.z); if (d < R) brkHit(o.id, 600 * (1 - d / R) + 60); } }
function brkBreak(o, mine, quiet) {
  if (o.broken) return; o.broken = true;
  if (o.g.parent) o.g.parent.remove(o.g); if (o.hit.parent) o.hit.parent.remove(o.hit);
  const wi = wallMeshes.indexOf(o.hit); if (wi >= 0) wallMeshes.splice(wi, 1);
  const bi = boxes.indexOf(o.box); if (bi >= 0) boxes.splice(bi, 1); boxGridDirty = true;
  if (!quiet) try { for (let i = 0; i < 3; i++) chunks('wood', new THREE.Vector3(o.x + (Math.random() - 0.5) * o.w, 0.4 + Math.random() * o.h, o.z + (Math.random() - 0.5) * o.d), 7, 4, 0.7); puff(o.x, o.h * 0.5, o.z, { color: 0x8a6a48, size: 0.9, grow: 1.4, life: 0.9, vy: 0.4, op: 0.45 }); sfx.impact(at(o.x, o.z, 18), true); sfx.thud(Object.assign({ vol: 0.7 }, at(o.x, o.z, 20))); } catch (e) {}
  if (mine && BRK.mine.indexOf(o.id) < 0) BRK.mine.push(o.id);
}
// a new match on the same map: everything back
function brkReset() {
  for (const o of BRK.list) {
    if (!o || !o.broken || o.kind === 'shield') continue; o.broken = false; o.hp = o.max; o.g.position.x = o.x;
    scene.add(o.g); scene.add(o.hit); wallMeshes.push(o.hit); boxes.push(o.box); boxGridDirty = true;
  }
  BRK.mine = [];
}
// online
const brkPack = () => BRK.mine.length ? BRK.mine.slice(-40) : undefined;
function brkApply(list) { if (!Array.isArray(list)) return; for (const id of list) { const o = BRK.list[id | 0]; if (o && !o.broken) brkBreak(o, false); } }
