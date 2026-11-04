/* ================================================================== ZOMBIES map: THE HOTBOX (endless, no story)
   An abandoned grow warehouse, 44 x 44 m, for quick endless runs and the leaderboard. Two parts:
     THE GROW FLOOR (the middle, 32 x 32): eight grow tables round the GUN UPGRADER on its lamp platform, crates and
                    perks against the inner walls. Four wide gaps, one in each wall, lead out to
     THE DRYING RING: a 6 m corridor all the way round between the inner and outer walls (racks of drying plants,
                    loading-bay shutters). The dead only come in from the ring, so it is also the training loop.
   No doors, no story: just rounds, harder and harder, until you go down. */
const HBX = { lamps: [], t: 0 };
function hotboxMaterials() {
  if (MAT.hbxWall) return;
  const std = (set, o) => new THREE.MeshStandardMaterial(Object.assign({ map: set.map, bumpMap: set.bump, bumpScale: 0.015, roughness: 0.85, metalness: 0.1 }, o));
  MAT.hbxWall = std(TEX.paintm || TEX.concrete, { color: C(0x5a5e62), roughness: 0.8 });
  MAT.hbxFloor = std(TEX.concrete, { color: C(0x6a6660), roughness: 0.9 });
  MAT.hbxTable = std(TEX.steelp || TEX.metal, { color: C(0x8a9096), roughness: 0.5, metalness: 0.6 });
  MAT.hbxShutter = std(TEX.steelp || TEX.metal, { color: C(0x6a5a3a), roughness: 0.6, metalness: 0.5 });
  MAT.hbxLamp = new THREE.MeshStandardMaterial({ color: C(0x2a1040), emissive: C(0xc070ff), emissiveIntensity: 0.9 });
  MAT.hbxSign = neonMat('THE HOTBOX', '#c070ff', 'endless · no way out', '#0a0612', 1024, 256);
  MAT.hbxRing = neonMat('DRYING RING', '#7aff7a', 'mind the racks', '#081008', 512, 160);
  TILES.hbxWall = 3; TILES.hbxFloor = 5;
}
function buildHotbox() {
  buildMap2Materials(); isleMaterials(); hotboxMaterials(); HBX.lamps = [];
  floorQuad(0, 0, 46, 46, 0, 'hbxFloor', 8);
  // the outer walls and the roof (solid all round)
  for (const [x, z, w, d] of [[0, -22.25, 45, 0.5], [0, 22.25, 45, 0.5], [-22.25, 0, 0.5, 45], [22.25, 0, 0.5, 45]]) blk(x, z, w, d, 7, 'hbxWall');
  blk(0, 0, 45, 45, 0.4, 'hbxWall', { y: 7, noCol: true });
  // the inner walls of the grow floor, a 6 m gap in the middle of each
  for (const s of [-1, 1]) { wkX(s * 16, -16, 16, 4.5, 'hbxWall', [[0, 6, 0, 4.5]]); wkZ(s * 16, -16, 16, 4.5, 'hbxWall', [[0, 6, 0, 4.5]]); }
  batchAdd('hbxSign', new THREE.PlaneGeometry(6, 1.5), mat4(0, 5.4, 15.74, 0, Math.PI, 0), false);
  batchAdd('hbxRing', new THREE.PlaneGeometry(2.4, 0.75), mat4(0, 3.4, 16.27, 0, 0, 0), false);
  /* ---- THE GROW FLOOR */
  // the lamp platform in the middle (the upgrader stands on the floor between its four lamp posts)
  for (const [x, z] of [[-2.6, -2.6], [2.6, -2.6], [-2.6, 2.6], [2.6, 2.6]]) { blk(x, z, 0.5, 0.5, 4.2, 'dark'); B('hbxLamp', 1.6, 0.08, 0.5, x, 4.1, z, 0, Math.PI / 4, 0, false); HBX.lamps.push(lampLight(x, 3.8, z, 0xc070ff, 0.8, 9)); }
  // eight grow tables: four long ones on the axes, four short in the corners
  const table = (x, z, w, d) => { blk(x, z, w, d, 0.9, 'hbxTable', { walk: false }); B('soil', w - 0.2, 0.06, d - 0.2, x, 0.93, z, 0, 0, 0, false);
    const n = Math.max(2, Math.round(Math.max(w, d) / 1.1)); for (let i = 0; i < n; i++) { const f = (i + 0.5) / n - 0.5; islePlant(x + (w > d ? f * w : 0), z + (w > d ? 0 : f * d), 0.95, 1.1, i % 3 ? 'leafGreen' : 'purpleLeaf'); }
    B('hbxLamp', w * 0.9, 0.06, d * 0.9, x, 3.2, z, 0, 0, 0, false); CYL('steel', 0.02, 0.02, 2.2, 4, x, 4.3, z, 0, 0, 0, false); HBX.lamps.push(lampLight(x, 2.8, z, 0xb070ff, 0.6, 7)); };
  table(-9, 0, 1.4, 5); table(9, 0, 1.4, 5); table(0, -9, 5, 1.4); table(0, 9, 5, 1.4);
  for (const [x, z] of [[-9, -9], [9, -9], [-9, 9], [9, 9]]) table(x, z, 2.4, 2.4);
  // crates and barrels against the inner walls (cover, not walls)
  for (const [x, z, k] of [[-13.5, -5, 0], [-13.2, -6.2, 1], [13.5, 5, 0], [13.2, 6.3, 1], [5, -13.5, 0], [-5, 13.5, 1]]) isleCrate(x, z, 0, k);
  for (const [x, z] of [[-14, 12], [14, -12]]) { CYL('paintGreen', 0.3, 0.3, 0.9, 12, x, 0.45, z); PZ(x, 0, z, 0.62, 0.9, 0.62); }
  shipCeil(-8, 4, 6.9, 0xfff0d0, 0.8, 12); shipCeil(8, -4, 6.9, 0xfff0d0, 0.8, 12);
  /* ---- THE DRYING RING: racks against the outer wall, loading-bay shutters, a few work lights */
  for (const s of [-1, 1]) for (const k of [-12, -4, 4, 12]) {
    for (const [x, z, w, d] of [[s * 21.4, k, 0.9, 4], [k, s * 21.4, 4, 0.9]]) { blk(x, z, w, d, 2.6, 'wood', { walk: false });
      for (let i = 0; i < 4; i++) B('budDry', w > d ? w - 0.2 : 0.7, 0.25, w > d ? 0.7 : d - 0.2, x, 0.5 + i * 0.6, z, 0, 0, 0, false); }
  }
  for (const s of [-1, 1]) { B('hbxShutter', 5, 4, 0.1, s * 8, 2, s * 22.0, 0, 0, 0, false); B('hbxShutter', 0.1, 4, 5, s * 22.0, 2, -s * 8, 0, 0, 0, false); }
  for (const [x, z] of [[-19, -19], [19, -19], [-19, 19], [19, 19], [0, -19], [0, 19], [-19, 0], [19, 0]]) shipLamp(x, z, 3.2, 0xfff0d0, 0.9, 12);
}
defineMap({
  id: 'hotbox', size: 'small', hidden: true, zombiesOnly: true, planCut: 3.0, name: 'THE HOTBOX', place: 'Abandoned grow warehouse, night', desc: 'An endless zombies arena: a grow floor in the middle, a drying ring all the way round.',
  play: [-22, 22, -22, 22], build: buildHotbox,
  env: { top: 0x0a0814, horizon: 0x1a1428, fog: 0.02, sun: [20, 40, 10], sunCol: 0x9a8ab8, sunI: 0.35, skySun: 0x4a3a6a, hemiSky: 0x6a5a8a, hemiGround: 0x2a2420, exposure: 1.55 },
  grass: { count: 0 }, spawnMaxY: 0.5,
  layout: { spawn: [{ x: 0, z: 5.5 }, { x: 0, z: -5.5 }], hp: [{ x: 0, z: 5 }, { x: -5, z: -5 }, { x: 5, z: 5 }], flags: [{ x: 0, z: 5.5 }, { x: 0, z: -5.5 }], sites: [{ x: -9, z: -5 }, { x: 9, z: 5 }] },
  menu: { x: 0, z: 0, r: 11, y: 2.4 },
  navPts: [{ x: 0, z: 5.5 }, { x: -12, z: 0 }, { x: 12, z: 0 }, { x: 0, z: -12 }, { x: 0, z: 19 }, { x: -19, z: -19 }, { x: 19, z: 19 }, { x: 19, z: -10 }],
  views: [[0, 1.7, 13, 0, 1.5, 0], [-13, 1.7, -13, 0, 1.5, 0], [0, 1.7, 19, -18, 1.5, 19], [-19, 1.7, 19, -19, 1.5, -10], [12, 1.7, 0, 0, 2, 0]],
});
function hotboxTick(dt) { if (curMap !== 'hotbox') return; HBX.t += dt; HBX.lamps.forEach((l, i) => { l.intensity = 0.6 + 0.12 * Math.sin(HBX.t * 2 + i); }); }
