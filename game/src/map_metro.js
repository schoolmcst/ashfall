/* ================================================================== map: VERNON SQUARE (city street over a metro station, overcast dusk)
   The street is at 4.4 m; under the square is the station (platforms 1 m, track bed 0 m).
     WEST - the avenue: a wide street with a burnt-out bus, wrecks and a corner café on the far side
     MID  - the square and the station below it: four stairways down, an open atrium over the tracks (fight up and
            down through it), a parked train you can walk through
     EAST - the multi-storey car park: street level, level 2 (7.6 m) and the open roof (10.8 m), linked by car ramps
   Mirrored north/south. */
const MSY = 4.4, L2V = 7.6;   // street level, car park level 2
function buildMetro() {
  // ---- boundary and skyline
  for (const s of [1, -1]) {
    for (const [x0, x1, h, key] of [[-44, -26, 18, 'brick'], [-26, -10, 24, 'concrete'], [-10, 10, 14, 'brick'], [10, 28, 21, 'concrete'], [28, 44, 16, 'brick']]) { blk((x0 + x1) / 2, s * 44, x1 - x0, 2, h, key, { walk: false }); facadeWindows((x0 + x1) / 2, s * 43, x1 - x0, MSY, h, s); }
  }
  for (const [z0, z1, h, key] of [[-42, -20, 20, 'concrete'], [-20, 0, 26, 'brick'], [0, 20, 17, 'concrete'], [20, 42, 22, 'brick']]) { blk(-44.2, (z0 + z1) / 2, 2, z1 - z0, h, key, { walk: false }); facadeWindowsX(-43.2, (z0 + z1) / 2, z1 - z0, MSY, h); }
  blk(44.4, 0, 1, 88, MSY + 3, 'concrete', { walk: false });
  skyline(36, 70, 140, 25, 70);
  // ---- the station under the square (built once for both halves where it crosses the middle)
  floorQuad(0, 0, 6, 40, 0, 'concrete', 2);
  for (const x of [-2.2, -0.8, 1.4, 2.6]) batchAdd('steel', new THREE.BoxGeometry(0.12, 0.14, 40), mat4(x, 0.07, 0), false);   // rails
  for (let z = -19.5; z <= 19.5; z += 0.8) batchAdd('wood', new THREE.BoxGeometry(5.6, 0.08, 0.24), mat4(0, 0.04, z), false);   // sleepers
  // the train on the east track: two cars you can walk through, a gap between them
  for (const s of [1, -1]) trainCar(1.6, s * 6.7, 12.4);
  // ---- the car park (east lane)
  garage();
  for (const s of [1, -1]) { halfMetro(s); dressMetro(s); }
  // a few lamps under the square
  for (const [x, z] of [[-8, -9], [8, 9], [0, 0]]) lampLight(x, 3.6, z, 0xcfe2ff, 0.9, 16);
}
function halfMetro(s) {
  const Z = z => z * s, N = s > 0 ? 'n' : 's', S = s > 0 ? 's' : 'n';
  const fill = (x0, x1, z0, z1, h, key = 'concrete') => blk((x0 + x1) / 2, Z((z0 + z1) / 2), x1 - x0, z1 - z0, h, key, { walk: true });
  // solid ground under the street everywhere the station is not
  fill(-44, -14, 0, 44, MSY); fill(14, 44, 0, 44, MSY); fill(-14, 14, 20, 44, MSY);
  // the street slab over the station, with the atrium (x -3..3, z 0..8) and a stairwell each side (x +-8.9..11.1, z 11..16.5)
  const slb = (x0, x1, z0, z1) => slab((x0 + x1) / 2, Z((z0 + z1) / 2), x1 - x0, z1 - z0, MSY, 'concrete', 0.4);
  slb(-14, -11.1, 0, 20); slb(-11.1, -8.9, 0, 11); slb(-11.1, -8.9, 16.5, 20); slb(-8.9, -3, 0, 20); slb(-3, 3, 8, 20);
  slb(3, 8.9, 0, 20); slb(8.9, 11.1, 0, 11); slb(8.9, 11.1, 16.5, 20); slb(11.1, 14, 0, 20);
  for (const x of [-14, 14]) blk(x, Z(10), 0.4, 20, 1, 'tile', { y: MSY - 1, noCol: true, noRay: true, shadow: false });
  // atrium and stairwell railings at street level
  rail(-3, Z(8), 3, Z(8), MSY); rail(-3, Z(0), -3, Z(8), MSY); rail(3, Z(0), 3, Z(8), MSY);
  for (const x of [-10, 10]) { rail(x - 1.1, Z(11), x + 1.1, Z(11), MSY); rail(x - 1.1, Z(11), x - 1.1, Z(16.5), MSY); rail(x + 1.1, Z(11), x + 1.1, Z(16.5), MSY); }
  // platforms (1 m) either side of the tracks, columns, benches
  fill(-14, -3, 0, 20, 1.0, 'tileFloor'); fill(3, 14, 0, 20, 1.0, 'tileFloor');
  floorQuad(-3.3, Z(10), 0.5, 20, 1.0, 'paintYellow', 1); floorQuad(3.3, Z(10), 0.5, 20, 1.0, 'paintYellow', 1);
  for (const x of [-6.5, 6.5]) for (const z of [4.5, 10.5, 17.5]) blk(x, Z(z), 0.7, 0.7, MSY - 1.4, 'tile', { y: 1, walk: false });
  for (const x of [-12.8, 12.8]) bench(x, Z(6), 1, false);
  for (const x of [-9, 9]) { blk(x, Z(3), 1.2, 0.6, 1.0, 'steel', { y: 1, walk: false }); }
  // ceiling light strips
  for (const x of [-8.5, 8.5]) for (const z of [2, 8, 18]) batchAdd('signalCold', new THREE.BoxGeometry(0.3, 0.06, 3), mat4(x, MSY - 0.42, Z(z)), false);
  // stairs from the platforms up to the street (open stairwells)
  for (const x of [-10, 10]) stairs(x, Z(11), S, 2.2, 1.0, MSY, 'tile', { run: 0.42 });
  // stairs from the track bed back up onto the platforms (platform ends)
  stairs(-1.3, Z(19), 'w', 1.4, 0, 1.0, 'concrete', { rails: false });
  // the tunnel mouth at the end of the tracks
  blk(0, Z(20.5), 6, 1, MSY, 'concrete', { walk: false }); batchAdd('dark', new THREE.BoxGeometry(5, 3.4, 0.05), mat4(0, 1.7, Z(19.97)), false);
  // ---- the square above (mid, street level)
  for (const x of [-10, 10]) {   // glass canopy over each stairwell
    for (const dx of [-1.3, 1.3]) for (const dz of [10.8, 16.7]) blk(x + dx, Z(dz), 0.12, 0.12, 2.8, 'steel', { y: MSY, walk: false, noRay: true });
    batchAdd('glass', new THREE.BoxGeometry(3, 0.06, 6.4), mat4(x, MSY + 2.85, Z(13.75)), false);
    batchAdd('signal', new THREE.BoxGeometry(1.6, 0.4, 0.08), mat4(x, MSY + 2.4, Z(s > 0 ? 17.0 : 17.0)), false);
  }
  for (const [x, z] of [[-6, 4], [6, 4], [-6, 18.5], [6, 18.5]]) { blk(x, Z(z), 2.2, 1.0, 0.9, 'concrete', { y: MSY, walk: false }); batchAdd('leaf', new THREE.IcosahedronGeometry(0.7, 0), mat4(x, MSY + 1.3, Z(z))); }
  blk(0, Z(12.5), 1.6, 1.6, 1.3, 'stone', { y: MSY, walk: false }); blk(0, Z(12.5), 1.9, 1.9, 0.25, 'stone', { y: MSY, walk: false, noRay: true });   // statue plinths
  CYL('steel', 0.22, 0.3, 1.3, 10, 0, MSY + 2.0, Z(12.5)); batchAdd('steel', new THREE.SphereGeometry(0.17, 10, 8), mat4(0, MSY + 2.85, Z(12.5)));
  beam('steel', 0.2, MSY + 2.5, Z(12.5), 0.55, MSY + 3.1, Z(12.5) - s * 0.2, 0.1, 0.1); beam('steel', -0.2, MSY + 2.5, Z(12.5), -0.3, MSY + 1.9, Z(12.5), 0.1, 0.1);
  blk(-12.5, Z(2.5), 1.4, 2.6, 2.4, 'paintGreen', { y: MSY, walk: false });   // newspaper kiosk
  // ---- the avenue (west lane)
  floorQuad(-28, Z(22), 14, 44, MSY, 'asphalt', 4);
  floorQuad(-38.5, Z(22), 7, 44, MSY + 0.15, 'tileFloor', 2); blk(-38.5, Z(22), 7, 44, 0.15, 'concrete', { y: MSY, walk: true, noRay: true });
  floorQuad(-17.5, Z(22), 7, 44, MSY + 0.15, 'tileFloor', 2); blk(-17.5, Z(22), 7, 44, 0.15, 'concrete', { y: MSY, walk: true, noRay: true });
  // the bus (burnt out, walk round it or through the gap behind it)
  blk(-27, Z(8.5), 2.6, 11, 2.9, 'paintOrange', { y: MSY + 0.25, walk: false });
  batchAdd('dark', new THREE.BoxGeometry(2.66, 0.9, 10), mat4(-27, MSY + 2.1, Z(8.5)), false);
  for (const dz of [-3.5, 3.5]) for (const dx of [-1.3, 1.3]) batchAdd('tire', new THREE.CylinderGeometry(0.5, 0.5, 0.3, 14), mat4(-27 + dx, MSY + 0.5, Z(8.5 + dz), 0, 0, Math.PI / 2));
  carWreck(-31.5, Z(18), false, null, MSY); carWreck(-23, Z(27), false, null, MSY); carWreck(-33, Z(31), true, null, MSY);
  jersey(-29, Z(2.5), true, MSY); jersey(-24.5, Z(14.5), true, MSY); jersey(-35.5, Z(12), false, MSY + 0.15);
  sandbags(-20, Z(9), 4, false, 3, MSY + 0.15);
  for (const z of [6, 20, 34]) lampPost(-37.2, Z(z), MSY + 0.15, 6.5, 1, 0);
  // corner café on the far side of the avenue (enterable)
  const cy = MSY + 0.15;
  wall(-42, Z(16), -42, Z(25), 3.4, 'plasterOchre', { y: cy });
  wall(-42, Z(16), -35, Z(16), 3.4, 'plasterOchre', { y: cy, holes: [{ at: 3.5, w: 3, b: 0.9, h: 1.6 }] });
  wall(-42, Z(25), -35, Z(25), 3.4, 'plasterOchre', { y: cy, holes: [{ at: 3.5, w: 1.4, b: 1, h: 1.2 }] });
  wall(-35, Z(16), -35, Z(25), 3.4, 'plasterOchre', { y: cy, holes: [{ at: 2.5, w: 1.5, b: 0, h: 2.3 }, { at: 6.5, w: 2.6, b: 0.9, h: 1.6 }] });
  slab(-38.5, Z(20.5), 7.4, 9.4, cy + 3.7, 'concrete', 0.3);
  batchAdd(s > 0 ? 'awningRed' : 'awningGreen', new THREE.BoxGeometry(1.6, 0.06, 9), mat4(-34.2, cy + 3.0, Z(20.5), 0, 0, -0.3), false);
  blk(-40.5, Z(20.5), 1.0, 5, 1.05, 'wood', { y: cy, walk: false }); for (const z of [18, 23]) blk(-37.5, Z(z), 0.9, 0.9, 0.75, 'dark', { y: cy, walk: false });
  // ---- the cross street at each end (spawn)
  floorQuad(0, Z(31), 88, 10, MSY, 'asphalt', 4);
  blk(-6, Z(25.2), 6, 0.1, 2.4, 'glass', { y: MSY, walk: false }); slab(-6, Z(24.5), 6.6, 2.4, MSY + 2.7, 'steel', 0.12, { walk: false });   // tram shelter
  for (const dx of [-3, 3]) blk(-6 + dx, Z(25.2), 0.12, 0.12, 2.6, 'steel', { y: MSY, walk: false, noRay: true });
  blk(-6, Z(24.8), 4, 0.5, 0.45, 'wood', { y: MSY, walk: false }); batchAdd('signal', new THREE.BoxGeometry(1.2, 1.8, 0.08), mat4(-2.6, MSY + 1.3, Z(25.2)), false);
  carWreck(8, Z(30), true, null, MSY); carWreck(-14, Z(32.5), true, null, MSY); carWreck(20, Z(33), true, null, MSY);
  jersey(3, Z(25), true, MSY); jersey(-19, Z(26), true, MSY);
  crate(12, Z(37), 1.1, MSY); crate(13.2, Z(37.4), 0.9, MSY); barrelAt(-24, Z(37), 'blue', MSY); barrelAt(25, Z(38), 'blue', MSY);
}
// one metro car: floor at platform height, door gaps both sides, a roof
function trainCar(x, z, L) {
  const W = 2.8, x0 = x - W / 2, x1 = x + W / 2, z0 = z - L / 2, z1 = z + L / 2, y = 1.0;
  blk(x, z, W, L, 1.0, 'dark', { walk: true });
  const holes = [{ at: 2.2, w: 1.3, b: 0, h: 2.1 }, { at: L / 2, w: 1.3, b: 0, h: 2.1 }, { at: L - 2.2, w: 1.3, b: 0, h: 2.1 }, { at: 4.2, w: 1.4, b: 0.9, h: 0.9 }, { at: L - 4.2, w: 1.4, b: 0.9, h: 0.9 }];
  wall(x0, z0, x0, z1, 2.4, 'train', { y, t: 0.12, holes }); wall(x1, z0, x1, z1, 2.4, 'train', { y, t: 0.12, holes });
  wall(x0, z0, x1, z0, 2.4, 'train', { y, t: 0.12, holes: [{ at: W / 2, w: 0.9, b: 0, h: 2 }] }); wall(x0, z1, x1, z1, 2.4, 'train', { y, t: 0.12, holes: [{ at: W / 2, w: 0.9, b: 0, h: 2 }] });
  slab(x, z, W + 0.1, L, y + 2.6, 'train', 0.2, { walk: false });
  batchAdd('paintRed', new THREE.BoxGeometry(W + 0.04, 0.18, L), mat4(x, y + 0.6, z), false);
  for (let k = -L / 2 + 1.5; k < L / 2 - 1; k += 3) blk(x - 0.9, z + k, 0.5, 1.6, 0.45, 'paintBlue', { y, walk: false, noRay: true });
}
// the car park: three open floors linked by ramps
function garage() {
  const X0 = 20, X1 = 40, L2 = 7.6, RF = 10.8;
  for (const s of [1, -1]) {
    const Z = z => z * s, N = s > 0 ? 'n' : 's', S = s > 0 ? 's' : 'n';
    // level 2 slab with an opening over each ramp (x 35..39, z 4..14) and over the roof ramp (x 21..25, z 6.5..16.5)
    const l2 = (x0, x1, z0, z1) => slab((x0 + x1) / 2, Z((z0 + z1) / 2), x1 - x0, z1 - z0, L2, 'concrete', 0.3);
    l2(X0, 21, 0, 18); l2(25, 35, 0, 18); l2(21, 25, 0, 6.5); l2(21, 25, 16.5, 18); l2(35, 39, 0, 4); l2(35, 39, 14, 18); l2(39, X1, 0, 18);
    // roof (z -12..12) with the opening where the roof ramp comes up (x 21..25, z 6.5..12)
    const rf = (x0, x1, z0, z1) => slab((x0 + x1) / 2, Z((z0 + z1) / 2), x1 - x0, z1 - z0, RF, 'concrete', 0.3);
    rf(X0, 21, 0, 12); rf(25, X1, 0, 12); rf(21, 25, 0, 6.5);
    // ramps
    ramp(37, Z(4), S, 3.8, 10, MSY, L2, 'concrete');
    ramp(23, Z(16.5), N, 3.8, 10, L2, RF, 'concrete', { base: L2 - 0.4 });
    // parapets: street level edge facing the square has gaps; level 2 and roof edges
    for (const [z0, z1] of [[2, 7], [11, 18]]) blk(X0, Z((z0 + z1) / 2), 0.3, z1 - z0, 1.0, 'concrete', { y: MSY, walk: false });
    blk(X0, Z(9), 0.3, 4, 1.0, 'concrete', { y: L2, walk: false }); blk(X0, Z(15.5), 0.3, 5, 1.0, 'concrete', { y: L2, walk: false }); blk(X0, Z(2.5), 0.3, 5, 1.0, 'concrete', { y: L2, walk: false });
    blk(30, Z(18), 20, 0.3, 1.0, 'concrete', { y: L2, walk: false });
    blk(X0, Z(6), 0.3, 12, 1.0, 'concrete', { y: RF, walk: false }); blk(32.75, Z(12), 14.5, 0.3, 1.0, 'concrete', { y: RF, walk: false });
    blk(X1, Z(6), 0.3, 12, 1.0, 'concrete', { y: RF, walk: false });
    rail(35, Z(4), 39, Z(4), L2); rail(35, Z(4), 35, Z(14), L2); rail(39, Z(4), 39, Z(14), L2);
    // columns on the street level and level 2
    for (const x of [26, 32]) for (const z of [3, 9, 15]) { blk(x, Z(z), 0.6, 0.6, L2 - 0.3 - MSY, 'concrete', { y: MSY, walk: false }); if (z < 12) blk(x, Z(z), 0.6, 0.6, RF - 0.3 - L2, 'concrete', { y: L2, walk: false }); }
    // parked cars as cover on every level
    carWreck(29, Z(12.5), false, null, MSY); carWreck(34.5, Z(16), true, null, MSY); carWreck(23.5, Z(2.5), false, null, MSY);
    carWreck(29, Z(4), false, null, L2); carWreck(29.5, Z(14.5), true, null, L2); carWreck(37, Z(16.3), true, null, L2);
    carWreck(28, Z(8.5), true, null, RF); carWreck(35.5, Z(3), false, null, RF);
    floorQuad(30, Z(9), 20, 18, MSY, 'asphalt', 4);
    for (let x = 22; x < 40; x += 3) floorQuad(x, Z(9), 0.12, 4, MSY + 0.01, 'paintWhite', 1);
  }
  blk(41, 0, 0.3, 24, 1.0, 'concrete', { y: MSY, walk: false, noRay: true });
}
// rows of windows on a tall facade facing +-z
function facadeWindows(x, z, w, y0, h, s) {
  const parts = [];
  for (let fy = y0 + 2; fy < h - 1; fy += 3.2) for (let k = -w / 2 + 1.5; k < w / 2 - 1; k += 2.8) parts.push({ g: new THREE.BoxGeometry(1.4, 1.8, 0.1), m: mat4(x + k, fy, z - s * 0.02) });
  if (parts.length) batchAdd(Math.random() < 0.5 ? 'glass' : 'dark', mergeGeos(parts), null, false);
}
function facadeWindowsX(x, z, d, y0, h) {
  const parts = [];
  for (let fy = y0 + 2; fy < h - 1; fy += 3.2) for (let k = -d / 2 + 1.5; k < d / 2 - 1; k += 2.8) parts.push({ g: new THREE.BoxGeometry(0.1, 1.8, 1.4), m: mat4(x + 0.02, fy, z + k) });
  if (parts.length) batchAdd('glass', mergeGeos(parts), null, false);
}
// set dressing (one half; mirrored)
function dressMetro(s) {
  const Z = z => z * s, y = MSY, sw = MSY + 0.15;
  // the station: vending machines, bins, timetable screens, hanging signs, wall tiles, name boards
  for (const [x, f] of [[-13.3, 'e'], [13.3, 'w']]) { vending(x, Z(14.6), 1, f); trashBin(x + (x < 0 ? 0.4 : -0.4), Z(9.6), 1, 'steel'); billboard(x < 0 ? -13.92 : 13.92, Z(12.2), 2.0, 1.3, 0.75, f, 'screen'); billboard(x < 0 ? -13.92 : 13.92, Z(3.2), 2.6, 3.4, 0.6, f, 'paintBlue'); }
  for (const x of [-13.97, 13.97]) blk(x, Z(10), 0.1, 20, 2.5, 'tile', { y: 1, noCol: true, noRay: true, shadow: false });
  for (const x of [-8.5, 8.5]) { B('dark', 2.4, 0.5, 0.08, x, 3.45, Z(7.5), 0, 0, 0, false); B('signal', 2.2, 0.34, 0.1, x, 3.45, Z(7.5), 0, 0, 0, false); for (const o of [-1, 1]) B('dark', 0.03, 0.4, 0.03, x + o, 3.85, Z(7.5), 0, 0, 0, false); }
  paperScatter(-1.5, Z(12), 0, 1.5, 6); puddle(-1.6, Z(5), 0, 0.9); rubbleScatter(-2, Z(17), 0, 0.8, 3);
  // the square: bollards on the avenue edge, benches, bins
  for (const z of [5, 8, 11, 14, 17]) { CYL('dark', 0.11, 0.13, 0.9, 10, -14.35, y + 0.45, Z(z)); PZ(-14.35, y, Z(z), 0.26, 0.9, 0.26, { noRay: true }); }
  bench(-6.5, Z(12), y, false); bench(6.5, Z(12), y, false); trashBin(-3.9, Z(10), y, 'dark'); trashBin(3.9, Z(19), y, 'dark');
  puddle(1.5, Z(15.5), y, 1.3);
  // the avenue: crossing, lamps, hydrants, bins, dumpster, traffic lights, cones by the bus, manholes, puddles
  stripes(-28, Z(23.8), y, false, 14);
  lampPost(-20.6, Z(13), sw, 6.5, -1, 0); lampPost(-20.6, Z(33), sw, 6.5, -1, 0);
  hydrant(-21.3, Z(18), sw); hydrant(-36.2, Z(28.5), sw);
  trashBin(-36.5, Z(8.5), sw, 'paintGreen'); trashBin(-20.8, Z(29.5), sw, 'paintGreen');
  dumpster(-41.6, Z(29.5), sw, false, 'paintGreen'); blk(-20.7, Z(21), 0.5, 0.5, 1.05, 'paintBlue', { y: sw, walk: false });
  trafficLight(-21.4, Z(25.4), sw, s > 0 ? 's' : 'n'); trafficLight(-34.6, Z(25.4), sw, s > 0 ? 's' : 'n');
  for (const [x, z] of [[-29.4, 3.6], [-29.8, 5.2], [-24.6, 14.2], [-25.2, 15.4]]) cone(x, Z(z), y);
  for (const [x, z] of [[-28, 16], [-25, 33], [10, 31]]) manhole(x, Z(z), y);
  for (const [x, z, r] of [[-30.5, 12, 1.8], [-24, 30.5, 1.4], [14, 29.5, 1.6], [-8, 34, 1.2]]) puddle(x, Z(z), y, r);
  billboard(-43.1, Z(10), y + 6, 8, 3, 'e', 'screen');
  scaffold(-24, Z(43), -12, Z(43), y, 10, s > 0 ? 'n' : 's');
  for (const x of [-25, -20, -15]) acUnit(x, Z(42.4), y + 14, 1.2);
  billboard(-2.6, Z(24), y, 0.5, 0.7, s > 0 ? 'n' : 's', 'paintBlue', 2.2);   // tram stop sign
  // the car park: hazard bands on the columns, ceiling lights, wheel stops, extinguishers, parking lines upstairs
  for (const x of [26, 32]) for (const z of [3, 9, 15]) { B('hazard', 0.64, 0.6, 0.64, x, y + 0.3, Z(z), 0, 0, 0, false); if (z < 12) B('hazard', 0.64, 0.6, 0.64, x, L2V + 0.3, Z(z), 0, 0, 0, false); }
  for (const x of [23, 29, 35]) for (const z of [5.5, 11.5]) { B('signalCold', 1.6, 0.05, 0.25, x, L2V - 0.33, Z(z), 0, 0, 0, false); if (z < 12 && x > 25) B('signalCold', 1.6, 0.05, 0.25, x, 10.8 - 0.33, Z(z), 0, 0, 0, false); }
  for (let x = 22.5; x < 40; x += 3) { B('concrete', 1.4, 0.12, 0.2, x, y + 0.06, Z(17.3), 0, 0, 0, false); }
  for (const x of [26, 32]) CYL('paintRed', 0.09, 0.09, 0.45, 8, x + 0.36, y + 1.2, Z(9));
  for (let x = 22; x < 40; x += 3) { floorQuad(x, Z(9), 0.12, 4, L2V + 0.01, 'paintWhite', 1); if (x > 25) floorQuad(x, Z(4), 0.12, 4, 10.81, 'paintWhite', 1); }
  billboard(20.2, Z(9), y + 2.2, 1.6, 0.5, 'w', 'paintYellow');
  lampLight(30, L2V - 0.6, Z(9), 0xdfeaff, 0.7, 16);
}
defineMap({
  id: 'metro', play: [-43.0, 43.6, -42.8, 42.8], name: 'VERNON SQUARE', place: 'City square over a metro station, dusk', desc: 'Fight on the street, under it, or above it: the avenue, the station and its open atrium, and a three-storey car park.',
  build: buildMetro,
  env: { top: 0x4c5868, horizon: 0x98a2ac, fog: 0.0115, sun: [34, 38, -52], sunCol: 0xdfe6f2, sunI: 1.5, skySun: 0xe0e4ea, hemiSky: 0xb4c0d0, hemiGround: 0x3c3c40, exposure: 1.18 },
  grass: { count: 0 },
  spawnMaxY: MSY + 0.3,
  layout: {
    spawn: [{ x: 0, z: 37, y: MSY }, { x: 0, z: -37, y: MSY }],
    hp: [{ x: -8.5, z: 1, y: 1 }, { x: 30, z: 8, y: 7.6 }, { x: -29, z: -12, y: MSY }, { x: 6, z: -13, y: MSY }, { x: 30, z: -8, y: 7.6 }, { x: -29, z: 12, y: MSY }, { x: 6, z: 13, y: MSY }],
    flags: [{ x: 0, z: 36, y: MSY }, { x: 0, z: -36, y: MSY }],
    sites: [{ x: 8.5, z: -12, y: 1, n: 'A' }, { x: 30, z: -12, y: MSY, n: 'B' }],
  },
  menu: { x: 0, z: 30, r: 8, y: 1.9, by: MSY },
  navPts: [{ x: 30, z: 6, y: 10.8 }, { x: 1.6, z: 3, y: 1 }, { x: -1.5, z: -10, y: 0 }, { x: -38.5, z: 20.5, y: MSY + 0.15 }, { x: 30, z: -10, y: 7.6 }],
  views: [[0, MSY + 1.7, 33, 0, MSY, 5], [-9, 2.7, 3, 6, 1.5, -10], [-1.5, 1.7, 14, 2, 1.5, -10], [-36, MSY + 1.9, 30, -26, MSY + 1, -4], [22, L2V + 1.7, 15, 34, L2V, -6], [38, 10.8 + 1.7, -11, 0, MSY, 6]],
});
