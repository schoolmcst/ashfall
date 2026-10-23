/* ================================================================== HOTBOX GRENADE and SKUNK BOMB
   HOTBOX: a smoke grenade. A thick cloud (5 m across, 14 s) that bots cannot see through and you cannot either.
   SKUNK BOMB: a flashbang with a green flash: anyone looking at it is blinded (like a stun), and a stink cloud stays
   for 6 s where enemies inside keep coughing (they cannot aim). Online, the clouds are sent with your state ('sk')
   so everyone sees them; the flash reaches real players as a stun. */
const SMK = { clouds: [], out: [], seq: 0, R: { hotbox: 3.2, skunk: 2.6 }, life: { hotbox: 14, skunk: 6 } };
function smkTex() {
  if (smkTex.t) return smkTex.t;
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  for (let i = 0; i < 12; i++) { const x = 64 + rnd(-22, 22), y = 64 + rnd(-22, 22), r = rnd(28, 46), gr = g.createRadialGradient(x, y, 2, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,.75)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); }
  return (smkTex.t = new THREE.CanvasTexture(c));
}
// a cloud at p (kind hotbox / skunk); mine = I threw it (tell the others)
function smkCloud(p, kind, mine) {
  const R = SMK.R[kind], n = kind === 'hotbox' ? 14 : 9, sprites = [];
  for (let i = 0; i < n; i++) {
    const a = Math.random() * TAU, r = Math.sqrt(Math.random()) * R * 0.85, col = kind === 'hotbox' ? (i % 3 ? 0xc8ccc4 : 0xb4c4a8) : (i % 2 ? 0x8ad04a : 0x5a8a2a);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: smkTex(), color: col, transparent: true, depthWrite: false, opacity: 0 }));
    const sz = kind === 'hotbox' ? rnd(3.2, 4.4) : rnd(2, 2.8); s.scale.set(sz, sz, 1);
    s.position.set(p.x + Math.cos(a) * r, (p.y || 0) + rnd(0.5, kind === 'hotbox' ? 2.6 : 1.6), p.z + Math.sin(a) * r); scene.add(s);
    sprites.push({ s, vx: rnd(-0.15, 0.15), vz: rnd(-0.15, 0.15), sz });
  }
  SMK.clouds.push({ x: p.x, y: p.y || 0, z: p.z, kind, R, t: 0, life: SMK.life[kind], sprites, mine: !!mine });
  if (mine) { SMK.out.push([++SMK.seq, r2(p.x), r2(p.y || 0), r2(p.z), kind === 'hotbox' ? 0 : 1]); while (SMK.out.length > 3) SMK.out.shift(); }
  try { burst(1.4, 700, 0.35, 'lowpass', at(p.x, p.z, 20)); tone(220, 0.6, 0.05, 'sine', 120, at(p.x, p.z, 20)); } catch (e) {}
}
function smkDetonate(g) {
  const p = g.m.position.clone();
  if (g.kind === 'hotbox') { smkCloud(p, 'hotbox', true); return; }
  // skunk: the stun's flash in green, then the stink
  stunBlast(p); const fl = $('flashW'); if (fl) { fl.style.background = '#c8ffb0'; clearTimeout(smkDetonate.t); smkDetonate.t = setTimeout(() => { fl.style.background = ''; }, 4000); }
  smkCloud(p, 'skunk', true);
}
function smkTick(dt) {
  for (let i = SMK.clouds.length - 1; i >= 0; i--) {
    const c = SMK.clouds[i]; c.t += dt;
    const k = Math.min(1, c.t / 0.8) * (c.t > c.life - 2.5 ? Math.max(0, (c.life - c.t) / 2.5) : 1);
    for (const q of c.sprites) { q.s.position.x += q.vx * dt; q.s.position.z += q.vz * dt; q.s.material.opacity = k * (c.kind === 'hotbox' ? 0.92 : 0.6); const g = 1 + Math.min(1, c.t / 3) * 0.35; q.s.scale.set(q.sz * g, q.sz * g, 1); }
    if (c.kind === 'skunk' && c.t < c.life - 1) for (const e of enemies) if (!isFriend(e) && Math.hypot(e.group.position.x - c.x, e.group.position.z - c.z) < c.R && !e.net) e.stunT = Math.max(e.stunT || 0, 0.6);
    if (c.t >= c.life) { for (const q of c.sprites) scene.remove(q.s); SMK.clouds.splice(i, 1); }
  }
}
// does the line a -> b run through a smoke cloud (bots: no line of sight)
function smokeBlocks(a, b) {
  for (const c of SMK.clouds) {
    if (c.kind !== 'hotbox' || c.t < 0.5 || c.t > c.life - 1.5) continue;
    const dx = b.x - a.x, dz = b.z - a.z, L2 = dx * dx + dz * dz || 1e-6, u = clamp(((c.x - a.x) * dx + (c.z - a.z) * dz) / L2, 0, 1);
    const px = a.x + dx * u, pz = a.z + dz * u, py = a.y + (b.y - a.y) * u;
    if (Math.hypot(px - c.x, pz - c.z) < c.R * 0.9 && py > c.y - 0.3 && py < c.y + 3.2) return true;
  }
  return false;
}
function smkClear() { for (const c of SMK.clouds) for (const q of c.sprites) scene.remove(q.s); SMK.clouds.length = 0; SMK.out.length = 0; }
// online: clouds from someone else's presence
function smkFromNet(R, list) {
  if (!Array.isArray(list)) return;
  for (const s of list) { if (!Array.isArray(s) || (+s[0] | 0) <= (R.skSeen | 0)) continue; R.skSeen = +s[0] | 0; if (R.skFirst) smkCloud({ x: netNum(s[1], -ARENA, ARENA), y: netNum(s[2], -5, 30), z: netNum(s[3], -ARENA, ARENA) }, s[4] ? 'skunk' : 'hotbox', false); }
  R.skFirst = true;   // the clouds already in their state when we first saw them are old: skip those
}
