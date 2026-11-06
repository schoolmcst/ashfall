/* ================================================================== ZOMBIES map: BAYVIEW (chapter seven, the finale)
   The High Tide's guest list sent the survivors to Bayview harbour, where three hundred passengers got off - and where
   GREENLINE HOLDINGS, the company that owns both ships, has its tower. The town is gone. Built on the same plan as the
   two ships (so the same doors, perks and windows line up), dressed as a harbour block at dawn:
     START   - THE HARBOUR (south): the quay, the survivors' boat, the fish market stalls, crab pots.
     MIDDLE  - the GREENLINE LOBBY (the hub): reception, the big leaf logo, the lifts, sofas.
     SIDES   - the BAYVIEW DINER (west) and the GREENLINE PHARMACY (east), where the Nightshade was sold over the counter.
     NORTH   - THE LAB (west house: the vats, the CROP DUSTER tank - the cure goes in there), the PLAZA in the middle (the
               fountain, trees, benches), the BOARDROOM (east house: the long table, the portraits, the Chairman).
     TOP     - THE HELIPAD (north end): the helicopter, the gun upgrader in the server room.
   LAUNCH PADS (window cleaners' platforms) throw you around once the tower's power is back. The story ends here. */
const BAY = { flick: [], t: 0, on: false, fountain: null };
function bayMaterials() {
  if (MAT.bayBrick) return;
  const std = (set, o) => new THREE.MeshStandardMaterial(Object.assign({ map: set.map, bumpMap: set.bump, bumpScale: 0.015, roughness: 0.85, metalness: 0.1 }, o));
  MAT.bayBrick = std(TEX.brick || TEX.concrete, { color: C(0x8a5a4a) });
  MAT.bayTower = std(TEX.paintm || TEX.concrete, { color: C(0x2a3a3a), roughness: 0.4, metalness: 0.5 });
  MAT.bayGreen = std(TEX.paintm || TEX.metal, { color: C(0x2f8a4a), roughness: 0.5 });
  MAT.bayMarble = std(TEX.concrete, { color: C(0xd8d4cc), roughness: 0.35, metalness: 0.05 });
  MAT.bayDock = std(TEX.planks || TEX.wood, { color: C(0x7a6a52), roughness: 0.9 });
  MAT.bayDiner = std(TEX.paintm || TEX.metal, { color: C(0xc83a3a), roughness: 0.5 });
  MAT.bayLab = std(TEX.paintm || TEX.metal, { color: C(0xe8ecee), roughness: 0.45 });
  MAT.bayWater = new THREE.MeshStandardMaterial({ color: C(0x1a4a5a), roughness: 0.15, metalness: 0.3, transparent: true, opacity: 0.85 });
  MAT.bayGlow = new THREE.MeshBasicMaterial({ color: C(0x5dff7a), toneMapped: false });
  MAT.baySign = neonMat('GREENLINE', '#5dff7a', 'HOLDINGS · BAYVIEW', '#06100a', 1024, 256);
  MAT.bayDinerS = neonMat('BAYVIEW DINER', '#ff5a5a', 'OPEN 24 HRS', '#140606');
  MAT.bayPharm = neonMat('PHARMACY', '#5dff7a', 'GREENLINE · WELLNESS', '#06100a');
  MAT.bayLabS = neonMat('THE LAB', '#5ac8ff', 'AUTHORISED STAFF', '#060a10', 512, 160);
  MAT.bayBoard = neonMat('BOARDROOM', '#ffd23a', '', '#100c04', 512, 160);
  MAT.bayHeli = neonMat('H', '#ffffff', '', '#1a3a1a', 256, 256);
  TILES.bayBrick = 3; TILES.bayMarble = 3;
}
function buildBay() {
  buildMap2Materials(); worksMaterials(); airpMaterials(); isleMaterials(); shipMaterials(); tideMaterials(); bayMaterials();
  BAY.flick = []; BAY.on = false; BAY.t = 0;
  floorQuad(0, 0, 52, 86, 0, 'asphalt', 6);
  floorQuad(0, 0, 400, 400, -2.5, 'bayWater', 20);
  // ---- the block: solid all round, brick walls with zombie windows at the same spots as the ships
  for (const [x, z, w, d] of [[0, -43.4, 56, 2.5], [0, 43.2, 56, 2.5], [-27, 0, 3, 90], [27, 0, 3, 90]]) blk(x, z, w, d, 9, 'dark', { noDraw: true });
  const winH = [[19, 1.6, 1.0, 1.4], [-8, 1.6, 1.0, 1.4]];
  wkZ(-25, -30, 41, 3.2, 'bayBrick', winH); wkZ(25, -30, 41, 3.2, 'bayBrick', winH);
  wkX(41, -25, 25, 1.2, 'bayDock'); blk(0, 41.9, 52, 0.6, 5, 'dark', { noDraw: true });
  wkZ(-16, -42, -30, 3.2, 'bayBrick'); wkZ(16, -42, -30, 3.2, 'bayBrick'); wkX(-30, -25, -16, 3.2, 'bayBrick'); wkX(-30, 16, 25, 3.2, 'bayBrick'); wkX(-42, -16, 16, 3.2, 'bayBrick');
  // the town behind the walls (scenery): dark houses and the tower
  for (const s of [-1, 1]) for (let i = 0; i < 6; i++) B(i % 2 ? 'bayBrick' : 'facade', 6, 6 + (i * 7) % 5, 8, s * 31, 3, -30 + i * 12, 0, 0, 0, false);

  /* ================= THE HARBOUR (start, z 26..41): the quay, the boat, the fish market */
  floorQuad(0, 34, 50, 14, 0.011, 'bayDock', 6);
  for (const [x, z] of [[-14, 31], [-8, 31], [12, 31]]) { blk(x, z, 3, 1.2, 0.9, 'wood', { walk: false }); B('awningGreen', 3.4, 0.08, 2.0, x, 2.4, z, 0.15, 0, 0, false); for (const dx of [-1.5, 1.5]) CYL('steel', 0.04, 0.04, 2.4, 6, x + dx, 1.2, z + 0.8, 0, 0, 0, false); }
  for (const [x, z] of [[-20, 37], [-18.6, 37.6], [18, 38], [19.4, 37.2]]) { blk(x, z, 0.9, 0.9, 0.7, 'dark', { walk: false }); }
  crate(4, 36.5, 1.2); crate(5.2, 36.5, 1.0); crate(-3, 39, 1.1); pallet(16, 33, 0, 2, true);
  { const p = P2(-6, 47, -2, 0); p.b('isleWhite', 3.0, 1.4, 7.0, 0, 0.7, 0, false); p.b('isleTeal', 3.1, 0.25, 7.1, 0, 1.4, 0, false); }
  for (const [x, z] of [[-21, 39], [21, 39]]) shipBollard(x, z);
  shipLamp(-14, 27.4, 3.2, 0xffe0c0); shipLamp(14, 27.4, 3.2, 0xffe0c0); shipLamp(6, 38, 3.4, 0xfff0d0, 1.0, 14, false);

  /* ================= THE GREENLINE LOBBY (the hub, x -10..10, z 12..26) */
  const BH = 4.2;
  wkX(26, -25, 25, 3.4, 'bayBrick', [[0, 6, 0, 4]]);
  wkZ(-10, 12, 26, BH, 'bayTower', [[19, 6, 0, 4]]); wkZ(10, 12, 26, BH, 'bayTower', [[19, 6, 0, 4]]);
  wkX(12, -25, 25, BH, 'bayBrick', [[-20, 4, 0, 4], [0, 6, 0, 4], [20, 4, 0, 4]]);
  wkRoof(-10.3, 10.3, 11.7, 26.3, BH + 0.35, 'bayTower');
  floorQuad(0, 19, 19.4, 13.4, 0.012, 'bayMarble', 3);
  for (let k = 0; k < 9; k++) { const y = BH + 0.35 + k * 3.2; B('bayTower', 18, 3.2, 12, 0, y + 1.6, 19, 0, 0, 0, false); for (let i = 0; i < 7; i++) for (const sd of [-1, 1]) B((i + k) % 3 ? 'shipGlass' : 'tideCabin', 1.8, 2.2, 0.05, -7.5 + i * 2.5, y + 1.6, 19 + sd * 6.03, 0, 0, 0, false); }
  batchAdd('baySign', new THREE.PlaneGeometry(8, 2), mat4(0, BH + 2.5, 26.4, 0, 0, 0), false);
  blk(-5, 24.6, 4.4, 0.9, 1.05, 'bayMarble', { walk: false }); B('bayGreen', 4.6, 0.06, 1.1, -5, 1.08, 24.6, 0, 0, 0, false);   // reception
  { const lf = new THREE.Mesh(new THREE.CircleGeometry(1.6, 7), MAT.bayGlow); lf.position.set(0, 2.3, 12.27); lf.rotation.y = Math.PI; scene.add(lf); }
  for (const x of [-4, 4]) B('steel', 1.8, 3, 0.1, x, 1.5, 12.3, 0, 0, 0, false);   // the lifts
  for (const [x, z, q] of [[5, 16.5, 0], [5, 21, 2]]) { const p = P2(x, z, 0, q); p.b('tideVelvet', 3.0, 0.45, 0.9, 0, 0.23, 0); p.b('tideVelvet', 3.0, 0.5, 0.2, 0, 0.7, -0.35, false); p.col(3.0, 0.7, 0.9); }
  for (const [x, z] of [[-9.2, 13], [9.2, 13], [-9.2, 25]]) { CYL('paintWhite', 0.35, 0.28, 0.6, 10, x, 0.3, z); PZ(x, 0, z, 0.7, 0.6, 0.7); islePlant(x, z, 0.6, 1.2); }
  shipCeil(-4, 15, BH, 0xe8f0ff, 0.9, 11); shipCeil(4, 23, BH, 0xe8f0ff, 0.9, 11); { const l = lampLight(0, BH - 1.4, 19, 0xd8ffe0, 1.0, 12); BAY.flick.push({ l, i: 1.0, t: 1 }); }

  /* ================= THE BAYVIEW DINER (west, x -25..-10, z 12..26) */
  floorQuad(-17.5, 19, 14.6, 13.4, 0.011, 'tileFloor', 3);
  blk(-21.5, 19.5, 1.2, 7, 1.0, 'bayDiner', { walk: false }); B('paintWhite', 1.3, 0.06, 7.1, -21.5, 1.03, 19.5, 0, 0, 0, false);   // the counter
  for (let i = 0; i < 5; i++) CYL('bayDiner', 0.22, 0.22, 0.65, 10, -19.8, 0.33, 16.8 + i * 1.3, 0, 0, 0, false);
  for (const [x, z] of [[-14, 14.5], [-14, 23.5], [-17.5, 14.5]]) { blk(x, z, 1.6, 1.1, 0.75, 'paintWhite', { walk: false }); }
  batchAdd('bayDinerS', new THREE.PlaneGeometry(2.4, 0.6), mat4(-10.27, 3.2, 15, 0, -Math.PI / 2, 0), false);
  { const l = lampLight(-17, 3.2, 19, 0xff8a7a, 0.8, 12); BAY.flick.push({ l, i: 0.8, t: 0.4 }); }

  /* ================= THE GREENLINE PHARMACY (east, x 10..25, z 12..26) */
  floorQuad(17.5, 19, 14.6, 13.4, 0.011, 'bayMarble', 3);
  for (const z of [14.8, 22.6]) { blk(17.5, z, 7, 0.6, 1.8, 'bayLab', { walk: false }); for (let i = 0; i < 6; i++) B(['paintGreen', 'paintWhite', 'bayGreen'][i % 3], 0.5, 0.3, 0.3, 14.8 + i * 1.1, 1.95, z, 0, 0, 0, false); }
  blk(22.5, 13.5, 3.4, 0.9, 1.05, 'bayLab', { walk: false });
  batchAdd('bayPharm', new THREE.PlaneGeometry(2.4, 0.6), mat4(10.27, 3.2, 15, 0, Math.PI / 2, 0), false);
  { const l = lampLight(17.5, 3.2, 19, 0x9affb0, 0.8, 12); BAY.flick.push({ l, i: 0.8, t: 0.7 }); }

  /* ================= the street north of the block (z -2..12): abandoned cars, a bus stop */
  carWreck(-17, 6, true); carWreck(18, 4, false);
  blk(-4, 6, 0.5, 3.2, 2.3, 'glass', { walk: false }); bench(-3, 6, 0, false);
  shipLamp(-12, 10, 3.4, 0xffe0c0); shipLamp(12, 10, 3.4, 0xffe0c0); shipLamp(-17, 0, 3.4, 0xd8e0ff, 1.0, 13, false); shipLamp(17, 0, 3.4, 0xd8e0ff, 1.0, 13, false);

  /* ================= THE LAB (west house, x -25..-8, z -26..-2): the vats, the crop duster tank */
  const EH = 4.0;
  wkZ(-8, -26, -2, EH, 'bayLab', [[-20, 2.4, 0, 2.6], [-8, 2.4, 0, 2.6]]);
  wkX(-2, -25, -8, EH, 'bayLab', [[-16, 2.4, 0, 2.6]]); wkX(-26, -25, -8, EH, 'bayLab', [[-16, 2.4, 0, 2.6]]);
  wkRoof(-25.3, -7.7, -26.3, -1.7, EH + 0.35, 'bayLab'); blk(-24.6, -14, 0.3, 24, EH - 3.2 + 0.35, 'bayLab', { y: 3.2 });
  floorQuad(-16.5, -14, 16.5, 23.5, 0.011, 'whiteTile', 4);
  batchAdd('bayLabS', new THREE.PlaneGeometry(2.0, 0.62), mat4(-7.73, 3.1, -14, 0, Math.PI / 2, 0), false);
  for (const [x, z] of [[-20, -20], [-20, -8], [-13, -20]]) { CYL('steel', 1.1, 1.1, 2.6, 16, x, 1.3, z); PZ(x, 0, z, 2.2, 2.6, 2.2); CYL('tidePurple', 1.0, 1.0, 0.06, 16, x, 2.62, z, 0, 0, 0, false); }
  blk(-22, -13.5, 2, 4, 1.4, 'bayGreen', { walk: false }); CYL('steel', 0.7, 0.7, 3, 12, -22, 2.1, -13.5, Math.PI / 2, 0, 0, false);   // the crop duster tank
  blk(-11.5, -3.2, 4, 0.9, 1.05, 'bayLab', { walk: false });
  for (const [c, x, z] of [[0x5ac8ff, -19, -17], [0x9affb0, -14, -11], [0xc070ff, -14, -17]]) { const l = lampLight(x, 3.4, z, c, 0.8, 9); BAY.flick.push({ l, i: 0.8, t: rnd(0, 2) }); }

  /* ================= THE PLAZA (middle, x -8..8, z -26..12): the fountain, trees, benches */
  CYL('bayMarble', 2.6, 2.8, 0.7, 20, 0, 0.35, -8); PZ(0, 0, -8, 5.2, 0.7, 5.2); CYL('bayWater', 2.4, 2.4, 0.02, 20, 0, 0.66, -8, 0, 0, 0, false); CYL('bayMarble', 0.3, 0.4, 2.2, 10, 0, 1.4, -8);
  BAY.fountain = new THREE.Mesh(new THREE.CircleGeometry(1.2, 7), MAT.bayGlow); BAY.fountain.position.set(0, 2.6, -8); BAY.fountain.visible = false; scene.add(BAY.fountain);
  for (const z of [5, -18]) for (const s of [-1, 1]) { blk(s * 3.8, z, 3.2, 5, 0.8, 'bayMarble', { walk: false }); B('soil', 3.0, 0.05, 4.8, s * 3.8, 0.81, z, 0, 0, 0, false); islePlant(s * 3.8, z - 1.2, 0.8, 1.8); islePlant(s * 3.8, z + 1.2, 0.8, 1.4); }
  for (const z of [-2, -14]) for (const s of [-1, 1]) bench(s * 6.5, z, 0, false);
  shipLamp(-6, -26, 3.4, 0xfff0d0, 1.0, 13, false); shipLamp(6, -26, 3.4, 0xfff0d0, 1.0, 13);

  /* ================= THE BOARDROOM (east house, x 8..25, z -26..-2): the long table, the portraits */
  wkZ(8, -26, -2, EH, 'bayTower', [[-20, 2.4, 0, 2.6], [-8, 2.4, 0, 2.6]]);
  wkX(-2, 8, 25, EH, 'bayTower', [[16, 2.4, 0, 2.6]]); wkX(-26, 8, 25, EH, 'bayTower', [[16, 2.4, 0, 2.6]]);
  wkRoof(7.7, 25.3, -26.3, -1.7, EH + 0.35, 'bayTower'); blk(24.6, -14, 0.3, 24, EH - 3.2 + 0.35, 'bayTower', { y: 3.2 });
  floorQuad(16.5, -14, 16.5, 23.5, 0.011, 'tideCarpet', 4);
  batchAdd('bayBoard', new THREE.PlaneGeometry(2.0, 0.62), mat4(7.73, 3.1, -14, 0, -Math.PI / 2, 0), false);
  blk(16.5, -14, 3, 12, 0.78, 'tideTeak', { walk: false });                                 // the long table
  for (let i = 0; i < 6; i++) for (const s of [-1, 1]) blk(16.5 + s * 2.1, -19 + i * 2, 0.6, 0.6, 1.0, 'tideVelvet', { walk: false });
  for (let i = 0; i < 4; i++) B('bayGreen', 1.4, 1.8, 0.05, 11 + i * 3.6, 2.2, -25.7, 0, 0, 0, false);     // the portraits
  for (const [c, x] of [[0xffd890, 12], [0xffe0a0, 16.5], [0xffd890, 21]]) { const l = lampLight(x, 3.4, -14, c, 0.7, 9); BAY.flick.push({ l, i: 0.7, t: rnd(0, 3) }); }

  /* ================= THE HELIPAD (north end): the helicopter, the server room (gun upgrader) */
  wkZ(-6, -42, -35, 3.4, 'bayTower'); wkZ(6, -42, -35, 3.4, 'bayTower'); wkX(-35, -6, 6, 3.4, 'bayTower', [[0, 2.4, 0, 2.6]]);
  wkRoof(-6.3, 6.3, -42.3, -34.7, 3.75, 'bayTower'); floorQuad(0, -38.5, 11.4, 6.6, 0.012, 'dark', 3);
  for (let i = 0; i < 4; i++) blk(-4.5 + i * 3, -41.5, 1.2, 0.8, 2.2, 'dark', { walk: false });   // server racks
  shipCeil(0, -38.5, 3.4, 0x5dff7a, 0.8, 9);
  batchAdd('bayHeli', new THREE.PlaneGeometry(4, 4), mat4(12, 0.03, -36, -Math.PI / 2, 0, 0), false);
  { const p = P2(12, -36, 0, 0); p.b('bayGreen', 2.2, 1.8, 4.2, 0, 1.3, 0); p.b('shipGlass', 2.0, 1.0, 1.0, 0, 1.6, -2.3, false); p.b('steel', 0.4, 0.4, 4.5, 0, 1.6, 4.0, false); p.b('steel', 9, 0.06, 0.3, 0, 2.4, 0, false); p.col(2.2, 2.2, 4.2); }
  for (const [x, z] of [[-13, -40.5], [13, -40.5]]) shipBollard(x, z);
  shipLamp(-13, -27, 3.2); shipLamp(9.5, -28, 3.4, 0xfff0d0, 1.0, 13, false); shipLamp(-9, -40.5, 3.0);
}
defineMap({
  id: 'bayview', size: 'large', hidden: true, zombiesOnly: true, planCut: 3.0, name: 'BAYVIEW', place: 'Harbour town, the Greenline tower, dawn', desc: 'The last stop: the harbour, the Greenline lobby, the diner and the pharmacy, the lab, the plaza and the boardroom, and the helipad on top.',
  play: [-25, 25, -42, 41], build: buildBay,
  env: { top: 0x3a4a6a, horizon: 0xe8a070, fog: 0.012, sun: [-30, 18, 40], sunCol: 0xffc090, sunI: 1.0, skySun: 0xffb070, hemiSky: 0xa0a8c0, hemiGround: 0x3a3430, exposure: 1.25 },
  grass: { count: 0 }, spawnMaxY: 0.5,
  layout: { spawn: [{ x: 2, z: 34 }, { x: 0, z: -20 }], hp: [{ x: 0, z: 19 }, { x: 0, z: 0 }, { x: 4, z: 31 }], flags: [{ x: 2, z: 34 }, { x: 0, z: -20 }], sites: [{ x: -17, z: -10 }, { x: 16, z: -14 }] },
  menu: { x: 2, z: 30, r: 9, y: 2.4 },
  navPts: [{ x: 2, z: 34 }, { x: 0, z: 19 }, { x: -18, z: 18 }, { x: 18, z: 18 }, { x: -16, z: -14 }, { x: -17, z: 5 }, { x: 0, z: -10 }, { x: 16, z: -14 }, { x: 22.5, z: -14 }, { x: 0, z: -33 }, { x: 0, z: -39 }, { x: 10, z: -32 }],
  views: [[2, 1.7, 39, -8, 1, 30], [-6, 1.7, 23, 4, 1.2, 15], [-12, 1.7, 13, -21, 1.2, 22], [12, 1.7, 13, 20, 1.2, 22], [-9.5, 1.7, -8, -18, 1.5, -15], [0, 1.7, 8, 2, 2, -12], [16, 1.7, -3.5, 16, 1.5, -22], [0, 1.7, -24, 0, 6, -38]],
});
function bayTick(dt) {
  if (curMap !== 'bayview') return; BAY.t += dt;
  for (const f of BAY.flick) { if (BAY.on) { f.l.intensity = f.i; continue; } f.t -= dt; if (f.t <= 0) { f.t = rnd(0.05, 1.6); f.l.intensity = Math.random() < 0.3 ? 0.05 : f.i * rnd(0.4, 1); } }
  if (BAY.fountain && BAY.fountain.visible) BAY.fountain.rotation.z += dt * 0.8;
}
function bayPower() { BAY.on = true; if (BAY.fountain) BAY.fountain.visible = true; }
