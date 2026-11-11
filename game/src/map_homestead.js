/* ================================================================== THE HOMESTEAD (1.2.99): the HOTBOX HORDE home base
   An open grass field about 96 m square: no fences, no walls, nothing in the way. A dirt yard in the middle where the
   base goes (THE MOTHER PLANT, THE BUYER's van, the WORKBENCH, THE PLANS board and everything you build), a few trees and
   boulders far out at the edges. Hidden from every other mode; HOTBOX HORDE loads it for the base and for raids. */
function buildHomestead() {
  buildMap2Materials(); isleMaterials();
  floorQuad(0, 0, 170, 170, 0, 'ground', 10);
  floorQuad(0, 0, 26, 26, 0.006, 'soil', 6);
  const r = stashRand(4207);
  for (let i = 0; i < 30; i++) { const a = i / 30 * TAU + r() * 0.15, d = 38 + r() * 9; treeAt(Math.cos(a) * d, Math.sin(a) * d, 0, 0.75 + r() * 0.45); }
  for (let i = 0; i < 9; i++) { const a = r() * TAU, d = 28 + r() * 16, s = 0.7 + r() * 0.9; blk(Math.cos(a) * d, Math.sin(a) * d, 1.4 * s, 1.1 * s, 0.8 * s, 'rock', { walk: true }); }
}
defineMap({
  id: 'homestead', hidden: true, name: 'THE HOMESTEAD', place: 'Your grow, out in the open', desc: 'An open field with nothing in the way: your HOTBOX HORDE base.',
  play: [-48, 48, -48, 48], arena: 52, build: buildHomestead,
  env: { top: 0x4a86d0, horizon: 0xcfe0e8, fog: 0.005, sun: [40, 70, 25], sunCol: 0xfff2dc, sunI: 1.3, skySun: 0xffefc8, hemiSky: 0xbcd4ec, hemiGround: 0x5a6a40, exposure: 1.1 },
  grass: { count: 2600, avoid: (x, z) => Math.abs(x) < 14 && Math.abs(z) < 14 }, spawnMaxY: 0.5,
  layout: {
    spawn: [{ x: 0, z: 10 }, { x: 0, z: -10 }],
    hp: [{ x: 0, z: 0 }, { x: 20, z: 0 }, { x: -20, z: 0 }],
    flags: [{ x: 0, z: 20 }, { x: 0, z: -20 }],
    sites: [{ x: -12, z: 0, n: 'A' }, { x: 12, z: 0, n: 'B' }],
  },
  menu: { x: 0, z: 14, r: 14, y: 2.4 },
  navPts: [{ x: 0, z: 0 }, { x: 30, z: 0 }, { x: -30, z: 10 }, { x: 0, z: -35 }],
  views: [[0, 1.7, 20, 0, 1.4, 0]],
});
