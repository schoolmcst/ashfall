/* ================================================================== NIGHT REMASTERS (1.2.68): the four original maps, after dark
   ASH RUINS, KESSEL DOCKS, CASTELLMARE and VERNON SQUARE come back into the rotation as night maps: the same streets and
   rooms, a moon low over them (it casts the shadows), burning barrels at the fights that matter (the hardpoints, the
   flags and the bomb sites) and a glow of the map's own colour over the rooftops. The day versions stay retired.
   Lights are kept to the handful a multiplayer map can afford (six fires, each one a light). */
const NIGHT_MAPS = [
  { id: 'ruins_night', from: 'ruins', name: 'ASH RUINS · NIGHT', place: 'Bombed-out village crossroads, midnight', glow: 0xff7a3a,
    env: { top: 0x070b18, horizon: 0x26203a, fog: 0.014, sun: [40, 55, -30], sunCol: 0x9ab0e8, sunI: 0.85, skySun: 0x6a7aa8, hemiSky: 0x5a6a9a, hemiGround: 0x2a2018, exposure: 1.5, grade: { bloom: 0.55 } } },
  { id: 'docks_night', from: 'docks', name: 'KESSEL DOCKS · LIGHTS OUT', place: 'Container port, a blackout night', glow: 0xffb050,
    env: { top: 0x060a14, horizon: 0x1a2a3a, fog: 0.012, sun: [-50, 40, 20], sunCol: 0xa0c0f0, sunI: 0.8, skySun: 0x5a7a9a, hemiSky: 0x5a6a8a, hemiGround: 0x1a1a1a, exposure: 1.5 } },
  { id: 'town_night', from: 'town', name: 'CASTELLMARE · MIDNIGHT', place: 'Hill town on the coast, festival night', glow: 0x7aff7a,
    env: { top: 0x080a1e, horizon: 0x2a2a48, fog: 0.009, sun: [-24, 60, 32], sunCol: 0xb0c0ff, sunI: 0.9, skySun: 0x8a8ab8, hemiSky: 0x6a70a0, hemiGround: 0x2a2420, exposure: 1.45 } },
  { id: 'metro_night', from: 'metro', name: 'VERNON SQUARE · AFTER HOURS', place: 'City square over a metro station, 3 am', glow: 0xc070ff,
    env: { top: 0x0a0814, horizon: 0x2a1a3a, fog: 0.014, sun: [34, 38, -52], sunCol: 0x9aa8d8, sunI: 0.7, skySun: 0x5a4a7a, hemiSky: 0x5a5a80, hemiGround: 0x1e1a22, exposure: 1.55 } },
];
// a burning barrel: a rusty drum, a flame and smoke (fx.js runs every fire), and its light
function nightFire(x, z) {
  CYL('rustIron', 0.3, 0.3, 0.9, 14, x, 0.45, z); CYL('dark', 0.31, 0.31, 0.04, 14, x, 0.92, z, 0, 0, 0, false); PZ(x, 0, z, 0.62, 0.95, 0.62);
  const light = new THREE.PointLight(C(0xff8a3a), 1.3, 12, 2); light.position.set(x, 1.5, z); scene.add(light);
  fires.push({ x, z, light, t: Math.random() * 10, sprites: [] });
}
// a free spot near (x, z): no solid box within 0.9 m of a barrel there, on the ground (the nav grid is not built yet)
function nightSpot(x, z) {
  for (const [dx, dz] of [[2.2, 1.6], [-2.2, 1.6], [2.2, -1.6], [-2.2, -1.6], [3.2, 0], [-3.2, 0], [0, 3.2], [0, -3.2], [4, 3], [-4, -3]]) {
    const px = x + dx, pz = z + dz; let ok = true;
    for (const b of boxes) { if (b.top < 0.25 || b.bot > 2) continue; if (px > b.minx - 0.9 && px < b.maxx + 0.9 && pz > b.minz - 0.9 && pz < b.maxz + 0.9) { ok = false; break; } }
    if (ok) return { x: px, z: pz };
  }
  return null;
}
// after the day map is built: fires at the objectives (spread out), a coloured glow over the town, moonlit haze
function nightDress(nm) {
  try { worksMaterials(); } catch (e) {}
  const L = MAPS[nm.from].layout, pts = [].concat(L.hp || [], L.flags || [], (L.sites || []).filter(s => s && s.x !== undefined)), used = [];
  for (const q of pts) {
    if (used.length >= 6) break;
    const o = nightSpot(q.x, q.z); if (!o || used.some(u => Math.hypot(u.x - o.x, u.z - o.z) < 10)) continue;
    used.push(o); nightFire(o.x, o.z);
  }
  // a faint glow dome of the map's colour on the horizon (no light, just colour in the sky and the bloom)
  const glow = new THREE.Mesh(new THREE.SphereGeometry(240, 24, 8, 0, Math.PI * 2, Math.PI * 0.42, Math.PI * 0.12), new THREE.MeshBasicMaterial({ color: nm.glow, transparent: true, opacity: 0.08, side: THREE.BackSide, depthWrite: false, fog: false }));
  glow.renderOrder = -999; scene.add(glow);
  return used.length;
}
for (const nm of NIGHT_MAPS) {
  const o = MAPS[nm.from]; if (!o) continue;
  const m = Object.assign({}, o, { id: nm.id, hidden: false, name: nm.name, place: nm.place, night: nm.from, desc: o.desc + ' Now at night.', env: Object.assign({}, nm.env), grass: o.grass ? Object.assign({}, o.grass) : o.grass, build: () => { o.build(); nightDress(nm); } });
  defineMap(m);
  try { if (typeof MAPSHOTS !== 'undefined' && !MAPSHOTS[nm.id] && MAPSHOTS[nm.from]) MAPSHOTS[nm.id] = MAPSHOTS[nm.from]; } catch (e) {}
  try { if (AUD_PROF[nm.from]) AUD_PROF[nm.id] = AUD_PROF[nm.from]; } catch (e) {}
}
