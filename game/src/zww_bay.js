/* ================================================================== BAYVIEW's WONDER WEAPON (1.2.87): THE GREEN LIGHTNING
   Built from the Greenline lab's cure sprayer: fires a bolt of green lightning at the first zombie in front of you,
   which then jumps to the next nearest zombie, and the next - up to 7 (12 upgraded), each within 7 m of the last.
   Every zombie it touches takes a big hit and is stunned. Rare from the mystery crate on BAYVIEW, and the reward for
   finishing the story there. (Same rules as the other maps' wonder weapons: zextras.js ZWW.) */
ZWW.bayview = { id: 'lightning', base: 'hellfire', name: 'THE GREEN LIGHTNING', desc: 'a bolt of cure that jumps from zombie to zombie · up to seven at a time', mag: 6, reserve: 36, interval: 0.75, col: 0x5dff7a };
const ZWWL = [];   // bolts on screen (they fade in 0.25 s)
function zwwBolt(a, b) {
  const pts = [a.clone()], n = 6; for (let i = 1; i < n; i++) { const t = i / n; pts.push(new THREE.Vector3(a.x + (b.x - a.x) * t + rnd(-0.35, 0.35), a.y + (b.y - a.y) * t + rnd(-0.35, 0.35), a.z + (b.z - a.z) * t + rnd(-0.35, 0.35))); } pts.push(b.clone());
  const m = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x8aff9a, transparent: true, opacity: 1, depthWrite: false, blending: THREE.AdditiveBlending }));
  scene.add(m); ZWWL.push({ m, t: 0.25 });
}
function zwwLightning(w) {
  const cp = Math.cos(P.pitch || 0), dir = new THREE.Vector3(-Math.sin(P.yaw) * cp, Math.sin(P.pitch || 0), -Math.cos(P.yaw) * cp);
  const org = new THREE.Vector3(P.x, (P.y || 0) + (P.eye || 1.6), P.z).addScaledVector(dir, 0.6);
  // the first one: the nearest zombie in a narrow cone you can see
  let first = null, best = 1e9;
  for (const e of enemies) { if (!e.zombie) continue; const g = e.group.position, dx = g.x - org.x, dy = g.y + 1.1 - org.y, dz = g.z - org.z, d = Math.hypot(dx, dy, dz);
    if (d > 30 || (dx * dir.x + dy * dir.y + dz * dir.z) / (d || 1) < Math.cos(0.22)) continue; if (!gridClear(P.x, P.z, g.x, g.z, P.y || 0, g.y)) continue; if (d < best) { best = d; first = e; } }
  try { burst(0.25, 2600, 0.35, 'highpass'); tone(660, 0.15, 0.12, 'sawtooth', 1320); } catch (e) {}
  if (!first) { const end = org.clone().addScaledVector(dir, 14); zwwBolt(org, end); return 0; }
  const max = w.upgraded ? 12 : 7, hit = new Set(); let cur = first, from = org, n = 0;
  while (cur && n < max) {
    hit.add(cur); n++; const g = cur.group.position, to = new THREE.Vector3(g.x, g.y + 1.1, g.z); zwwBolt(from, to);
    try { puff(to.x, to.y, to.z, { color: 0x7aff8a, size: 0.4, grow: 1.2, life: 0.5, vy: 0.4, op: 0.6 }); } catch (e) {}
    damageEnemy(cur, cur.boss ? cur.maxHp * 0.03 / Math.max(1, zombGunMul(true)) : zwwDmg(w, 2.4), false, null, true, 'player');
    if (enemies.includes(cur)) { cur.stunT = Math.max(cur.stunT || 0, 1.2); cur.atkT = 0; }
    from = to; let nx = null, nd = 7;
    for (const e of enemies) { if (!e.zombie || hit.has(e)) continue; const q = e.group.position, d = Math.hypot(q.x - g.x, q.z - g.z); if (d < nd && Math.abs(q.y - g.y) < 3) { nd = d; nx = e; } }
    cur = nx;
  }
  return n;
}
(() => { const old = zwwFire; zwwFire = function (w) { if (w && w.ww === 'lightning') return zwwLightning(w); return old.apply(this, arguments); }; })();
(() => { const old = zwwTick; zwwTick = function (dt) { old(dt); for (let i = ZWWL.length - 1; i >= 0; i--) { const b = ZWWL[i]; b.t -= dt; b.m.material.opacity = Math.max(0, b.t / 0.25); if (b.t <= 0) { scene.remove(b.m); b.m.geometry.dispose(); ZWWL.splice(i, 1); } } }; })();
(() => { const old = zwwClear; zwwClear = function () { old(); for (const b of ZWWL) scene.remove(b.m); ZWWL.length = 0; }; })();
