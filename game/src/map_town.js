/* ================================================================== map: CASTELLMARE (Mediterranean hill town, midday)
   The town climbs from the two lower squares (spawns, 0 m) over a terrace (1.5 m) to the central piazza (3 m).
     WEST - the lower road along the cliff: stays at 0 m, overlooked by house windows; a tunnel runs under the piazza
     MID  - stepped alleys between plaster houses, up to the piazza with its fountain; enterable houses on both sides
     EAST - terraced gardens with olive trees, the bell tower, and the loggia whose roof (6.6 m) watches the gardens
   Mirrored north/south. */
function buildTown() {
  // ---- base: ground, valley backdrop, boundary
  floorQuad(0, 0, 90, 92, 0, 'stone', 3);
  floorQuad(-120, 0, 150, 300, -18, 'olive', 20);
  for (let i = 0; i < 14; i++) { const z = -140 + i * 22, s = 18 + Math.random() * 20; batchAdd('olive', new THREE.IcosahedronGeometry(s, 1), mat4(-110 - Math.random() * 60, -18 + s * 0.2, z, 0, Math.random() * 3, 0, 1.6, 0.45, 1.2), false); }
  for (let i = 0; i < 10; i++) batchAdd(i % 2 ? 'plaster' : 'plasterOchre', scaledBox(6, 6 + Math.random() * 5, 6, 3), mat4(-96 - (i % 3) * 7, -14, -70 + i * 16), false);
  blk(-42.3, 0, 0.6, 88, 1.0, 'stone', { walk: false });                         // parapet over the valley
  boxes.push(mkBox(-42.6, 0, 0.6, 88, 5, { walk: false }));
  wall(44.4, -43.6, 44.4, 43.6, 6, 'stone', { t: 1 });
  for (let z = -42; z <= 42; z += 2.4) batchAdd('stone', scaledBox(1, 0.8, 1.2, 3), mat4(44.4, 6.4, z));   // crenellations
  // ---- the central strip (not mirrored): tunnel under the piazza, fountain, bell tower
  slab(-19.3, 0, 5.4, 3, 3.0, 'stone', 0.6);                                       // tunnel roof
  stairs(-16.6, 0, 'e', 2.6, 0, 3.0, 'stone', { rails: false });                   // stair from tunnel up to the piazza
  rail(-16.6, -1.5, -12, -1.5, 3.0); rail(-16.6, 1.5, -12, 1.5, 3.0);
  blk(-7, 0, 10, 3, 3.0, 'stone', { walk: true });                                 // piazza fill over the centre strip
  blk(6, 0, 20, 3, 3.0, 'stone', { walk: true }); floorQuad(2, 0, 28, 3, 3.0, 'tileFloor', 2.5);
  // fountain
  batchAdd('stone', new THREE.CylinderGeometry(2.2, 2.4, 0.7, 24), mat4(-3, 3.35, 0)); batchAdd('water', new THREE.CylinderGeometry(1.95, 1.95, 0.1, 24), mat4(-3, 3.62, 0), false);
  batchAdd('stone', new THREE.CylinderGeometry(0.35, 0.5, 1.8, 10), mat4(-3, 4.2, 0)); batchAdd('stone', new THREE.CylinderGeometry(0.9, 0.5, 0.25, 14), mat4(-3, 5.1, 0));
  boxes.push(mkBox(-3, 0, 3.6, 3.6, 0.7, { y: 3, walk: false })); boxes.push(mkBox(-3, 0, 0.8, 0.8, 2.3, { y: 3, walk: false })); rayAdd(new THREE.CylinderGeometry(2.2, 2.4, 0.7, 12), mat4(-3, 3.35, 0));
  // east gardens centre and the bell tower
  blk(29.6, 0, 28.8, 3, 3.0, 'stone', { walk: true }); floorQuad(29.6, 0, 28.8, 3, 3.0, 'concrete', 3);
  blk(30, 0, 5, 5, 15, 'stone', { y: 3, walk: false });
  for (const [dx, dz] of [[2.52, 0], [-2.52, 0], [0, 2.52], [0, -2.52]]) batchAdd('dark', new THREE.BoxGeometry(dx ? 0.06 : 1.4, 2.2, dx ? 1.4 : 0.06), mat4(30 + dx, 15.6, dz), false);
  batchAdd('terracotta', new THREE.ConeGeometry(3.9, 3.4, 4), mat4(30, 19.7, 0, 0, Math.PI / 4, 0));
  batchAdd('stone', scaledBox(5.6, 0.4, 5.6, 3), mat4(30, 18, 0));
  // the osteria on the lower road (enterable, doors at both ends)
  wall(-36, -6, -28, -6, 5.6, 'plasterOchre', { holes: [{ at: 4, w: 1.6, b: 0, h: 2.4 }, { at: 1.6, w: 1.2, b: 3.4, h: 1.1 }, { at: 6.4, w: 1.2, b: 3.4, h: 1.1 }] });
  wall(-36, 6, -28, 6, 5.6, 'plasterOchre', { holes: [{ at: 4, w: 1.6, b: 0, h: 2.4 }, { at: 1.6, w: 1.2, b: 3.4, h: 1.1 }, { at: 6.4, w: 1.2, b: 3.4, h: 1.1 }] });
  wall(-36, -6, -36, 6, 5.6, 'plasterOchre', { holes: [{ at: 3, w: 1.2, b: 1, h: 1.2 }, { at: 9, w: 1.2, b: 1, h: 1.2 }] });
  wall(-28, -6, -28, 6, 5.6, 'plasterOchre', { holes: [{ at: 2.5, w: 1.6, b: 0.9, h: 1.3 }, { at: 6, w: 1.4, b: 0, h: 2.3 }, { at: 9.5, w: 1.6, b: 0.9, h: 1.3 }] });
  slab(-32, 0, 8.4, 12.4, 5.9, 'terracotta', 0.3);
  blk(-33.5, 0, 1, 5, 1.0, 'wood', { walk: false }); crate(-30, -3.5, 0.9); crate(-30.4, 3.6, 0.9);
  for (const s of [1, -1]) { halfTown(s); dressTown(s); }
}
function halfTown(s) {
  const Z = z => z * s, N = s > 0 ? 'n' : 's';
  const fill = (x0, x1, z0, z1, h) => { blk((x0 + x1) / 2, Z((z0 + z1) / 2), x1 - x0, z1 - z0, h, 'stone', { walk: true }); floorQuad((x0 + x1) / 2, Z((z0 + z1) / 2), x1 - x0, z1 - z0, h, h >= 3 && x1 <= 16 ? 'tileFloor' : 'concrete', h >= 3 ? 2.5 : 3); };
  // terraces
  fill(-12, 16, 1.5, 14, 3.0); fill(-22, -12, 1.5, 14, 3.0);
  fill(16, 44, 1.5, 12, 3.0);
  fill(-22, 16, 14, 24, 1.5); fill(16, 44, 12, 22, 1.5);
  rail(-22, Z(14), -22, Z(1.5), 3.0, { h: 0.9 });          // parapet along the road edge of the piazza
  // stairs and ramps between the levels
  stairs(-4, Z(26.5), N, 3.6, 0, 1.5, 'stone');
  stairs(10, Z(26.5), N, 1.6, 0, 1.5, 'stone');
  ramp(-18, Z(30), N, 3, 6, 0, 1.5, 'stone');
  stairs(-9, Z(16.5), N, 2.4, 1.5, 3.0, 'stone');
  stairs(3, Z(16.5), N, 3, 1.5, 3.0, 'stone');
  ramp(22, Z(16), N, 2.5, 4, 1.5, 3.0, 'stone');
  stairs(34, Z(24.5), N, 2, 0, 1.5, 'stone');
  stairs(-24.52, Z(20), 'e', 1.6, 0, 1.5, 'stone');         // from the road into the corner house
  // ---- houses on the terrace (1.5 m)
  // H1: corner house over the road (enterable: road door west, alley door east, windows over the road)
  const y1 = 1.5;
  wall(-22, Z(17), -22, Z(24), 3.4, 'plasterRose', { y: y1, holes: [{ at: 3, w: 1.3, b: 0, h: 2.2 }, { at: 5.6, w: 1.1, b: 1.0, h: 1.0 }] });
  wall(-14, Z(17), -14, Z(24), 3.4, 'plasterRose', { y: y1, holes: [{ at: 4, w: 1.3, b: 0, h: 2.2 }, { at: 1.6, w: 1.1, b: 1.0, h: 1.0 }] });
  wall(-22, Z(17), -14, Z(17), 3.4, 'plasterRose', { y: y1, holes: [{ at: 2.2, w: 1.2, b: 1.0, h: 1.0 }, { at: 5.8, w: 1.2, b: 1.0, h: 1.0 }] });
  wall(-22, Z(24), -14, Z(24), 3.4, 'plasterRose', { y: y1, holes: [{ at: 4, w: 1.2, b: 1.0, h: 1.0 }] });
  slab(-18, Z(20.5), 8.4, 7.4, y1 + 3.7, 'terracotta', 0.3);
  blk(-19.5, Z(21), 1.6, 0.8, 0.8, 'wood', { y: y1, walk: false });
  blk(10, Z(19.5), 8, 7, 5, 'plasterOchre', { y: y1, walk: false });           // H2 (solid)
  blk(-3, Z(20.5), 6, 5, 4, 'plaster', { y: y1, walk: false });                // H3 (solid)
  houseTrim(10, Z(19.5), 8, 7, y1 + 5); houseTrim(-3, Z(20.5), 6, 5, y1 + 4);
  // ---- houses on the piazza (3 m)
  blk(-18.5, Z(10), 7, 8, 5, 'plaster', { y: 3, walk: false }); houseTrim(-18.5, Z(10), 7, 8, 8);   // H4 (solid)
  // H5: two storeys, enterable, stair inside, upper windows over the piazza and the gardens
  const y5 = 3, zA = Z(3), zB = Z(13);
  wall(9, zA, 9, zB, 6.4, 'plasterOchre', { y: y5, holes: [{ at: 5, w: 1.4, b: 0, h: 2.3 }, { at: 2, w: 1.2, b: 4.2, h: 1.2 }, { at: 5.5, w: 1.2, b: 4.2, h: 1.2 }, { at: 8.5, w: 1.2, b: 4.2, h: 1.2 }] });
  wall(16, zA, 16, zB, 6.4, 'plasterOchre', { y: y5, holes: [{ at: 7, w: 1.4, b: 0, h: 2.3 }, { at: 3, w: 1.2, b: 4.2, h: 1.2 }] });
  wall(9, zA, 16, zA, 6.4, 'plasterOchre', { y: y5, holes: [{ at: 3.5, w: 1.2, b: 4.2, h: 1.2 }, { at: 3.5, w: 1.2, b: 1.0, h: 1.1 }].slice(0, 1) });
  wall(9, zB, 16, zB, 6.4, 'plasterOchre', { y: y5, holes: [{ at: 2, w: 1.2, b: 1.0, h: 1.1 }, { at: 5, w: 1.2, b: 4.2, h: 1.2 }] });
  stairs(15.05, Z(5.0), s > 0 ? 's' : 'n', 1.3, 3.0, 6.2, 'wood', { run: 0.4 });
  slab(11.6, Z(8), 5.2, 10, 6.2, 'wood', 0.25); slab(15.1, Z(11.4), 1.8, 3.2, 6.2, 'wood', 0.25);
  rail(14.2, Z(3.4), 14.2, Z(9.6), 6.2, { h: 0.95 });
  slab(12.5, Z(8), 7.4, 10.4, 9.4, 'terracotta', 0.3);
  crate(10.4, Z(11.6), 0.9, 3); blk(12, Z(5.5), 1.8, 0.8, 0.8, 'wood', { y: 6.2, walk: false });
  // piazza dressing: benches, planters, a café's tables and awning
  blk(-8, Z(10.5), 2.4, 0.5, 0.5, 'wood', { y: 3, walk: false }); blk(1, Z(11), 2.4, 0.5, 0.5, 'wood', { y: 3, walk: false });
  for (const x of [-10.5, 4.5]) { batchAdd('terracotta', new THREE.CylinderGeometry(0.55, 0.4, 0.8, 12), mat4(x, 3.4, Z(6))); boxes.push(mkBox(x, Z(6), 1.1, 1.1, 0.8, { y: 3, walk: false })); batchAdd('leaf', new THREE.IcosahedronGeometry(0.7, 0), mat4(x, 4.2, Z(6))); }
  batchAdd(s > 0 ? 'awningRed' : 'awningGreen', new THREE.BoxGeometry(5, 0.08, 2.4), mat4(-18.5, 6.1, Z(5.2), s * 0.25, 0, 0), false);
  for (const x of [-20, -17]) { blk(x, Z(4.5), 0.9, 0.9, 0.75, 'dark', { y: 3, walk: false }); }
  // ---- lower square (spawn): market stalls, a well, facades on the boundary
  for (const [x, z, col] of [[-12, 30, 'awningRed'], [-7, 33, 'awningStripe'], [6, 30, 'awningGreen'], [12, 34, 'awningRed']]) {
    blk(x, Z(z), 2.6, 1.2, 0.9, 'wood', { walk: false });
    for (const dx of [-1.2, 1.2]) batchAdd('wood', new THREE.BoxGeometry(0.08, 2.4, 0.08), mat4(x + dx, 1.2, Z(z) - s * 0.5), false);
    batchAdd(col, new THREE.BoxGeometry(3, 0.06, 1.9), mat4(x, 2.4, Z(z) + s * 0.1, -s * 0.18, 0, 0), false);
    crate(x + 1.9, Z(z), 0.8);
  }
  batchAdd('stone', new THREE.CylinderGeometry(1.1, 1.2, 0.9, 16), mat4(-1, 0.45, Z(31))); boxes.push(mkBox(-1, Z(31), 2.2, 2.2, 0.9, { walk: false })); rayAdd(new THREE.BoxGeometry(2.2, 0.9, 2.2), mat4(-1, 0.45, Z(31)));
  for (const [x0, x1, h, key] of [[-42, -26, 7, 'plasterRose'], [-26, -10, 10, 'plaster'], [-10, 8, 8, 'plasterOchre'], [8, 26, 11, 'plaster'], [26, 44, 7, 'plasterRose']]) {
    blk((x0 + x1) / 2, Z(43.4), x1 - x0, 1.6, h, key, { walk: false }); houseTrim((x0 + x1) / 2, Z(43.4), x1 - x0, 1.6, h, s);
  }
  carWreck(-30, Z(31), false); carWreck(-36, Z(18), false);
  // ---- the lower road: olives, low walls, a parked cart
  for (const z of [10, 25, 36]) tree(-40, Z(z), false, 0.75);
  blk(-30, Z(26), 3, 0.6, 0.9, 'stone', { walk: false }); blk(-26.5, Z(11), 0.6, 3.4, 0.9, 'stone', { walk: false });
  crate(-37.5, Z(29), 1.0); crate(-33, Z(38), 1.1);
  // ---- east gardens: low walls, olives, pergola, loggia with its roof
  blk(26, Z(8), 6, 0.5, 0.8, 'stone', { y: 3, walk: false }); blk(20, Z(5), 0.5, 4, 0.8, 'stone', { y: 3, walk: false });
  blk(29, Z(17), 0.5, 5, 0.8, 'stone', { y: 1.5, walk: false }); blk(38, Z(15.5), 5, 0.5, 0.8, 'stone', { y: 1.5, walk: false });
  for (const [x, z, y] of [[24, 10, 3], [34, 9.5, 3], [25.5, 19.5, 1.5], [40.5, 19, 1.5], [21, 33, 0], [33, 30, 0], [40, 37, 0]]) treeAt(x, Z(z), y, 0.7);
  for (let x = 30; x <= 38; x += 4) for (const dz of [0, 4]) batchAdd('wood', new THREE.BoxGeometry(0.2, 2.6, 0.2), mat4(x, 1.5 + 1.3, Z(14.3 + dz)), false);
  for (const dz of [0, 4]) batchAdd('wood', new THREE.BoxGeometry(8.6, 0.16, 0.16), mat4(34, 4.1, Z(14.3 + dz)), false);
  for (let x = 30; x <= 38; x += 1) batchAdd('wood', new THREE.BoxGeometry(0.1, 0.12, 4.4), mat4(x, 4.25, Z(16.3)), false);
  blk(37, Z(31), 6, 4.5, 3.2, 'stone', { walk: false }); slab(37, Z(31), 6.6, 5, 3.4, 'terracotta', 0.2, { walk: false });   // garden shed
  blk(24, Z(28), 0.5, 7, 0.9, 'stone', { walk: false }); blk(29, Z(37), 8, 0.5, 0.9, 'stone', { walk: false });
  // loggia: columns, roof terrace reached by the outside stair
  for (let z = 0; z <= 6; z += 3) blk(38.4, Z(z), 0.5, 0.5, 3.2, 'stone', { y: 3, walk: false });
  slab(40.2, Z(3), 4.4, 6, 6.6, 'stone', 0.4);
  stairs(40, Z(11.9), N, 1.6, 3.0, 6.6, 'stone', { rails: false });
  rail(38, Z(6), 39.1, Z(6), 6.6, { h: 0.9 }); rail(40.9, Z(6), 42.4, Z(6), 6.6, { h: 0.9 }); rail(38, Z(0), 38, Z(6), 6.6, { h: 0.9 });
  blk(43.2, Z(3), 1.2, 6, 4, 'stone', { y: 3, walk: false });
}
// window frames, shutters and a cornice on a solid house block
function houseTrim(x, z, w, d, top, faceS) {
  batchAdd('terracotta', scaledBox(w + 0.5, 0.25, d + 0.5, 1.2), mat4(x, top + 0.12, z), false);
  const parts = [], shut = [];
  for (const side of [-1, 1]) {
    for (let k = -w / 2 + 1.6; k < w / 2 - 1; k += 2.6) for (let fy = top - 2.2; fy > top - 6 && fy > 1.5; fy -= 2.8) {
      parts.push({ g: new THREE.BoxGeometry(1.0, 1.3, 0.08), m: mat4(x + k, fy, z + side * (d / 2 + 0.02)) });
      shut.push({ g: new THREE.BoxGeometry(0.45, 1.3, 0.06), m: mat4(x + k - 0.75, fy, z + side * (d / 2 + 0.05)) });
      shut.push({ g: new THREE.BoxGeometry(0.45, 1.3, 0.06), m: mat4(x + k + 0.75, fy, z + side * (d / 2 + 0.05)) });
    }
  }
  if (parts.length) batchAdd('dark', mergeGeos(parts), null, false);
  if (shut.length) batchAdd('awningGreen', mergeGeos(shut), null, false);
  // flower boxes under some windows, drainpipes on two corners
  let k2 = 0;
  for (const side of [-1, 1]) for (let k = -w / 2 + 1.6; k < w / 2 - 1; k += 2.6) for (let fy = top - 2.2; fy > top - 6 && fy > 1.5; fy -= 2.8) if ((k2++ % 3) === 1) flowerBox(x + k, z + side * (d / 2 + 0.14), fy - 0.86, true, 0.95);
  for (const sx of [-1, 1]) drainpipe(x + sx * (w / 2 + 0.06), z + (d / 2 + 0.06), Math.max(0, top - 9), top);
}
// an olive tree standing on a terrace at height y
function treeAt(x, z, y, s = 0.75) {
  const h = 4.2 * s;
  if (!placeProp('treeA', mat4(x, y, z, 0, Math.random() * TAU, 0, s, s * 0.8, s))) batchAdd('bark', new THREE.CylinderGeometry(0.1, 0.22, h, 8), mat4(x, y + h / 2, z));
  boxes.push(mkBox(x, z, 0.5, 0.5, h, { y, walk: false })); rayAdd(new THREE.CylinderGeometry(0.18, 0.22, h, 6), mat4(x, y + h / 2, z));
}
// set dressing (one half; mirrored)
function dressTown(s) {
  const Z = z => z * s;
  // café on the piazza: parasols over the tables, chairs
  for (const x of [-20, -17]) parasol(x, Z(4.5), 3.75, s > 0 ? 'awningRed' : 'awningGreen');
  cafeTable(-14.3, Z(4.4), 3); bench(-12.6, Z(12.6), 3, true); bench(6.8, Z(12.2), 3, true);
  // laundry across the alleys, balconies, lamps by the doors
  laundry(-14, 4.4, Z(19.4), -6, 4.9, Z(19.4)); laundry(0, 4.9, Z(21.8), 6, 5.6, Z(21.8));
  laundry(-22, 7.4, Z(12.5), -24.5, 7, Z(12.5));
  balcony(-15, Z(10), 6.1, 'e', 2.4); balcony(10, Z(23), 4.4, s > 0 ? 's' : 'n', 2.6);
  wallLamp(-14, 4.0, Z(21), 'e'); wallLamp(9, 5.8, Z(8), 'w'); wallLamp(-28, 3.2, Z(4), 'e'); wallLamp(16, 5.8, Z(10), 'e');
  // the lower road: power poles and wires, a parked cart, crates, wine barrels at the osteria
  powerPole(-40.8, Z(4), 0, 8); powerPole(-40.8, Z(24), 0, 8); powerPole(-40.8, Z(42), 0, 8);
  wire(-40.1, 7.5, Z(4), -40.1, 7.5, Z(24), 0.7); wire(-40.1, 7.5, Z(24), -40.1, 7.5, Z(42), 0.7); wire(-41.5, 7.5, Z(4), -41.5, 7.5, Z(24), 0.8);
  for (const [x, z] of [[-27.3, 2.2], [-27.3, 3.2]]) { CYL('wood', 0.38, 0.38, 0.95, 12, x, 0.48, Z(z)); }
  PZ(-27.3, 0, Z(2.7), 0.8, 0.95, 1.8);
  pallet(-38.6, Z(33), 0, 2); crate(-39.2, Z(14), 0.9); trashBin(-23, Z(28.5), 0, 'paintGreen');
  // market produce on the stalls and a scooter-sized clutter of crates
  for (const [x, z] of [[-12, 30], [-7, 33], [6, 30], [12, 34]]) for (let i = 0; i < 6; i++) batchAdd(['paintRed', 'paintOrange', 'paintYellow', 'paintGreen'][(i + x) & 3], new THREE.IcosahedronGeometry(0.13, 0), mat4(x - 0.9 + (i % 3) * 0.6, 0.98, Z(z) + (i < 3 ? -0.25 : 0.25)), false);
  bench(-15.5, Z(36.5), 0, true); bench(15, Z(37.5), 0, true); trashBin(3, Z(36.8), 0, 'dark');
  lampPost(-17, Z(33.5), 0, 5, 1, 0); lampPost(18, Z(27.5), 0, 5, -1, 0); lampPost(-10.8, Z(13), 3, 4.5, 1, 0); lampPost(7, Z(1.6), 3, 4.5, 0, s);
  // gardens: vines over the pergola, pots, a stone bench, a garden table
  for (let x = 30; x <= 38; x += 1.3) batchAdd('leaf', new THREE.BoxGeometry(1.1, 0.25, 4.6), mat4(x, 4.45, Z(16.3), 0, 0, (Math.random() - 0.5) * 0.2), false);
  for (const [x, z, y] of [[21, 9.5, 3], [27.5, 10.5, 3], [34, 13.5, 1.5], [41, 13.5, 1.5]]) { CYL('terracotta', 0.4, 0.3, 0.7, 12, x, y + 0.35, Z(z)); batchAdd('leaf', new THREE.IcosahedronGeometry(0.5, 0), mat4(x, y + 0.95, Z(z)), false); PZ(x, y, Z(z), 0.8, 0.7, 0.8); }
  blk(33, Z(10.8), 2.2, 0.6, 0.5, 'stone', { y: 3, walk: false }); cafeTable(35.5, Z(19), 1.5);
  // roofs: chimneys, a water tank, an aerial
  blk(12, Z(18), 0.7, 0.7, 1.2, 'plaster', { y: 6.5, walk: false, noRay: true }); blk(-2, Z(19.5), 0.6, 0.6, 1, 'plaster', { y: 5.5, walk: false, noRay: true });
  CYL('paintWhite', 0.6, 0.6, 1.2, 12, -19.5, 9.2, Z(9)); beam('dark', 13, 9.7, Z(10), 13, 11.5, Z(10), 0.04, 0.04, false);
  // a few loose stones on the lower road and in the tunnel
  rubbleScatter(-33, Z(20), 0, 1.5, 5); rubbleScatter(-20, Z(0.6), 0, 1, 3);
}
defineMap({
  id: 'town', name: 'CASTELLMARE', place: 'Hill town on the coast, midday', desc: 'Stepped alleys climb to a piazza. Take the lower road under the windows, the tunnel beneath the square, or the gardens and the loggia roof.',
  build: buildTown,
  env: { top: 0x3a78c4, horizon: 0xd6e2e8, fog: 0.0062, sun: [-24, 70, 32], sunCol: 0xfff1da, sunI: 2.6, skySun: 0xfff0c8, hemiSky: 0xc8dcf0, hemiGround: 0x8a7458, exposure: 1.0 },
  grass: { count: 900, color: 0xc8d090, avoid: (x, z) => !(x > 16 || x < -22) },
  spawnMaxY: 3.2,
  layout: {
    spawn: [{ x: 0, z: 37, y: 0 }, { x: 0, z: -37, y: 0 }],
    hp: [{ x: -6, z: 5, y: 3 }, { x: 24, z: -6, y: 3 }, { x: -32, z: 14, y: 0 }, { x: 3, z: -20, y: 1.5 }, { x: 24, z: 6, y: 3 }, { x: -32, z: -14, y: 0 }, { x: 3, z: 20, y: 1.5 }],
    flags: [{ x: 0, z: 36, y: 0 }, { x: 0, z: -36, y: 0 }],
    sites: [{ x: 25, z: -7, y: 3, n: 'A' }, { x: -32, z: -15, y: 0, n: 'B' }],
  },
  menu: { x: 0, z: 6, r: 7.5, y: 1.9, by: 3 },
  navPts: [{ x: 40, z: 3, y: 6.6 }, { x: 12, z: -8, y: 6.2 }, { x: -18, z: 20.5, y: 1.5 }, { x: -19, z: 0, y: 0 }, { x: 12, z: 8, y: 3 }],
  views: [[0, 1.7, 36, 0, 2, 10], [-4, 3.2, 24.5, -4, 4, 0], [-8, 4.7, 8, 14, 4, -6], [-38, 1.7, 30, -30, 2, -6], [26, 4.7, 14, 34, 6, -4], [40, 8.3, -5, 0, 2, 10]],
});
