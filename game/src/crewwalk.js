/* ================================================================== WALK-IN CREW STASH HOUSE (1.2.86)
   CREW > THE STASH HOUSE > WALK IN: the hideout as a room you can walk around in, built from what the crew has
   unlocked (CH_UPS): the bulb, the couch and rug, the crew tag in neon, the pool table, the grow tent, the arcade
   cabinet, the DJ booth and the penthouse window. The trophy shelf holds a trophy for each zombies story the crew has
   finished, and the CREW WARS board shows this week's standings.
   Press USE at: the RADIO (changes station; the radio plays in here), the ARCADE (an AIM TRAINER drill), the CREW
   WARS board, and the DOOR (back to the menu). It runs as a firing-range match (cfg.house), so nothing counts. */
const CHW = { spots: [], prompt: '' };
function chwLevel() { try { const T = chTotals(); return T ? T : { lvl: 0, story: 0, cp: 0, members: 1 }; } catch (e) { return { lvl: 0, story: 0, cp: 0, members: 1 }; } }
function chwBoardMat() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 384; const g = c.getContext('2d');
  g.fillStyle = '#0b0f0c'; g.fillRect(0, 0, 512, 384); g.strokeStyle = '#5dff7a'; g.lineWidth = 6; g.strokeRect(6, 6, 500, 372);
  g.fillStyle = '#5dff7a'; g.font = 'bold 34px sans-serif'; g.fillText('CREW WARS', 24, 52); g.font = '18px sans-serif'; g.fillStyle = '#8a9a8a'; g.fillText('this week · crew kills', 24, 80);
  let rows = []; try { rows = cwStandings().slice(0, 7); } catch (e) {}
  rows.forEach((r, i) => { g.fillStyle = r.mine ? '#5dff7a' : '#e8e8e8'; g.font = 'bold 24px sans-serif'; g.fillText(`${i + 1}. [${r.tag}] ${String(r.n || '').slice(0, 14)}`, 24, 124 + i * 36); g.textAlign = 'right'; g.fillText(String(r.k), 488, 124 + i * 36); g.textAlign = 'left'; });
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return new THREE.MeshBasicMaterial({ map: t, toneMapped: false });
}
function chwSkyline() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 200; const g = c.getContext('2d');
  const sky = g.createLinearGradient(0, 0, 0, 200); sky.addColorStop(0, '#05060f'); sky.addColorStop(1, '#2a1a3a'); g.fillStyle = sky; g.fillRect(0, 0, 1024, 200);
  let s = 7; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let x = 0; x < 1024;) { const w = 30 + r() * 60, h = 50 + r() * 130; g.fillStyle = '#0b0c14'; g.fillRect(x, 200 - h, w, h);
    for (let wy = 200 - h + 8; wy < 194; wy += 11) for (let wx = x + 5; wx < x + w - 6; wx += 9) if (r() < 0.35) { g.fillStyle = r() < 0.8 ? '#ffd27a' : '#7fd16b'; g.fillRect(wx, wy, 4, 5); }
    x += w + 2; }
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return new THREE.MeshBasicMaterial({ map: t, toneMapped: false });
}
function buildCrewHouse() {
  buildMap2Materials(); isleMaterials();
  const T = chwLevel(), L = T.lvl, tag = (PROG.crew && PROG.crew.tag) || 'CREW', W = 16, D = 11, H = 3.4;
  CHW.spots = [];
  floorQuad(0, 0, 40, 40, -0.01, 'concrete', 8);
  floorQuad(0, 0, W, D, 0.01, L >= 7 ? 'carpet' : 'wood', 4);
  // the walls (the north one gets a big window at the penthouse), the door in the south wall
  wkX(D / 2, -W / 2, W / 2, H, 'brick', [[0, 1.4, 0, 2.3]]);
  wkX(-D / 2, -W / 2, W / 2, H, 'brick', L >= 7 ? [[0, 9, 0.6, 2.4]] : []);
  wkZ(-W / 2, -D / 2, D / 2, H, 'brick'); wkZ(W / 2, -D / 2, D / 2, H, 'brick');
  blk(0, 0, W + 0.5, D + 0.5, 0.25, 'dark', { y: H, noCol: true });
  lampLight(0, H - 0.4, 0, 0xffc27a, L >= 1 ? 0.9 : 0.6, 14); CYL('glass', 0.08, 0.08, 0.16, 8, 0, H - 0.35, 0, 0, 0, 0, false);
  CHW.spots.push({ k: 'door', x: 0, z: D / 2 - 0.6, t: 'THE DOOR · BACK TO THE MENU' });
  // the radio on a crate by the door (always there)
  blk(-6.6, 4.4, 0.8, 0.6, 0.6, 'wood', { walk: false }); B('dark', 0.5, 0.3, 0.25, -6.6, 0.75, 4.4, 0, 0, 0, false);
  CHW.spots.push({ k: 'radio', x: -6.6, z: 4.4, t: 'THE RADIO · CHANGE STATION' });
  // the CREW WARS board on the east wall
  MAT.chwBoard = chwBoardMat(); batchAdd('chwBoard', new THREE.PlaneGeometry(2.4, 1.8), mat4(W / 2 - 0.27, 1.8, 2, 0, -Math.PI / 2, 0), false);
  CHW.spots.push({ k: 'board', x: W / 2 - 1, z: 2, t: 'CREW WARS · THIS WEEK' });
  // the trophy shelf (west wall): one trophy per zombies story finished
  blk(-W / 2 + 0.35, -2, 0.4, 3, 0.08, 'wood', { y: 1.6, noCol: true });
  if (!MAT.chwGold) MAT.chwGold = new THREE.MeshStandardMaterial({ color: C(0x7fd16b), metalness: 0.8, roughness: 0.25, emissive: C(0x1a3a10) });
  for (let i = 0; i < Math.min(7, T.story | 0); i++) { const z = -3.2 + i * 0.48; CYL('chwGold', 0.09, 0.06, 0.18, 10, -W / 2 + 0.35, 1.77, z, 0, 0, 0, false); CYL('chwGold', 0.12, 0.05, 0.14, 10, -W / 2 + 0.35, 1.93, z, 0, 0, 0, false); }
  if (L >= 1) { blk(-2, -3.6, 3, 1, 0.45, 'cloth2', { walk: false }); blk(-2, -4.1, 3, 0.3, 0.9, 'cloth2', { walk: false }); for (const s of [-1, 1]) blk(-2 + s * 1.4, -3.6, 0.25, 1, 0.65, 'cloth2', { walk: false }); floorQuad(-2, -2, 4, 2.6, 0.02, 'carpet', 1); blk(-2, -1.9, 1.4, 0.7, 0.42, 'wood', { walk: false }); }
  if (L >= 2) { if (!MAT.chwNeon || MAT.chwNeon.userData.tag !== tag) { MAT.chwNeon = neonMat(tag, '#ff5ad0', 'STASH HOUSE', '#0a060a', 512, 192); MAT.chwNeon.userData.tag = tag; } batchAdd('chwNeon', new THREE.PlaneGeometry(2.6, 0.98), mat4(-6.2, 2.3, -D / 2 + 0.27, 0, 0, 0), false); lampLight(-6, 2.2, -4.4, 0xff5ad0, 0.5, 6); }
  if (L >= 3) { blk(3.5, 0, 2.6, 1.4, 0.8, 'wood', { walk: false }); B('leafGreen', 2.4, 0.04, 1.2, 3.5, 0.82, 0, 0, 0, 0, false); lampLight(3.5, 2.4, 0, 0xfff0c0, 0.5, 5); }
  if (L >= 4) { blk(6.3, -3.6, 2, 2, 2.1, 'dark', { walk: false }); for (let i = 0; i < 3; i++) islePlant(5.7 + i * 0.6, -2.5, 0, 1.0, 'purpleLeaf'); lampLight(6.3, 2, -2.4, 0xd27aff, 0.7, 5); }
  if (L >= 5) { blk(-6.8, -1, 0.9, 0.8, 1.8, 'dark', { walk: false }); if (!MAT.chwScreen) MAT.chwScreen = new THREE.MeshBasicMaterial({ color: C(0x5ac8ff), toneMapped: false }); batchAdd('chwScreen', new THREE.PlaneGeometry(0.6, 0.45), mat4(-6.34, 1.4, -1, 0, Math.PI / 2, 0), false);
    CHW.spots.push({ k: 'arcade', x: -6.2, z: -1, t: 'THE ARCADE · PLAY GRIDSHOT' }); }
  if (L >= 6) { blk(5.5, 3.6, 2.4, 0.9, 1.0, 'dark', { walk: false }); for (const s of [-1, 1]) blk(5.5 + s * 1.6, 3.9, 0.6, 0.6, 1.4, 'dark', { walk: false }); lampLight(5.5, 2.6, 2.6, 0x5ac8ff, 0.6, 6); lampLight(3, 2.6, 3, 0xff5ad0, 0.5, 6);
    CHW.spots.push({ k: 'radio', x: 5.5, z: 2.8, t: 'THE DJ BOOTH · CHANGE STATION' }); }
  if (L >= 7) { if (!MAT.chwCity) MAT.chwCity = chwSkyline(); batchAdd('chwCity', new THREE.PlaneGeometry(14, 2.6), mat4(0, 1.6, -D / 2 - 3, 0, 0, 0), false); }
}
defineMap({
  id: 'crewhouse', hidden: true, name: 'THE STASH HOUSE', place: "Your crew's hideout", desc: "Your crew's hideout.", play: [-8, 8, -5.5, 5.5], arena: 12, build: buildCrewHouse,
  env: { top: 0x0a0c14, horizon: 0x1a1a24, fog: 0.01, sun: [10, 30, 10], sunCol: 0x8890a0, sunI: 0.35, skySun: 0x404858, hemiSky: 0x5a5a6a, hemiGround: 0x2a2420, exposure: 1.4 },
  grass: { count: 0 }, spawnMaxY: 0.5,
  layout: { spawn: [{ x: 0, z: 3.6 }, { x: 0, z: 3.6 }], hp: [{ x: 0, z: 0 }], flags: [{ x: 0, z: 3 }, { x: 0, z: -3 }], sites: [{ x: -3, z: 0, n: 'A' }, { x: 3, z: 0, n: 'B' }] },
  menu: { x: 0, z: 0, r: 4, y: 1.8 }, views: [[0, 1.7, 4, 0, 1.4, -3]],
});
function chwOpen() {
  if (!PROG.crew) return false; try { sfx.ui(); } catch (e) {}
  if (curMap === 'crewhouse') curMap = null;   // rebuilt every visit: the crew's level may have changed
  startMatch('range', { map: 'crewhouse', house: true }); return true;
}
// (from rangeStart) set the room up instead of the targets
function chwStart() {
  buildSpawns(); G.breakT = 1e9; G.waveActive = false; G.maxHp = G.health = 100;
  const me = { name: 'YOU', team: 0, isPlayer: true, kills: 0, deaths: 0, score: 0, obj: 0, level: 0, alive: true }; M.entries.push(me); M.me = me;
  placePlayer({ x: 0, z: 3.6 }); P.yaw = 0; RG.on = false; RG.spots = []; RG.dummies = [];
  G.state = 'playing'; showScreen(null); lockPointer(); updateModeHud(true);
  const T = chwLevel(); showBanner('THE STASH HOUSE', `${CH_UPS[T.lvl][1]} · ${T.cp.toLocaleString()} crew points`);
}
function chwTick(dt) {
  if (!M || !M.cfg || !M.cfg.house || G.state !== 'playing') return;
  let near = null; for (const s of CHW.spots) if (Math.hypot(P.x - s.x, P.z - s.z) < 1.6) { near = s; break; }
  const u = kb('use') || pad.use;
  if (near) { G.interactTxt = `${near.t} · ${actName('use')}`; try { showMsg(G.interactTxt); } catch (e) {} }
  if (near && u && !CHW.uH) {
    if (near.k === 'door') { try { sfx.ui(); leaveGame(); showScreen('menu'); } catch (e) {} }
    else if (near.k === 'radio') { const i = RADIO.findIndex(r => r.id === radioSt().id); radioSet(RADIO[(i + 1) % RADIO.length].id); }
    else if (near.k === 'arcade') { try { aimStart('grid'); } catch (e) {} }
    else if (near.k === 'board') { try { const R = cwStandings(), me = R.findIndex(r => r.mine); showBanner('CREW WARS', me >= 0 ? `your crew is #${me + 1} this week` : 'make or join a crew to climb'); } catch (e) {} }
  }
  CHW.uH = u;
}
// the hooks: rangeStart / rangeTick / the range HUD hand over to the house; the radio plays in here
(() => {
  const s0 = rangeStart; rangeStart = function (cfg) { if (cfg && cfg.house) return chwStart(); return s0.apply(this, arguments); };
  const t0 = rangeTick; rangeTick = function (dt) { if (M && M.cfg && M.cfg.house) return chwTick(dt); return t0.apply(this, arguments); };
  const h0 = rangeHud; rangeHud = function () { if (M && M.cfg && M.cfg.house) { const h = $('rangeHud'); if (h) h.classList.add('hide'); return; } return h0.apply(this, arguments); };
  const w0 = musWanted; musWanted = function () { if (M && M.cfg && M.cfg.house && inMatch() && G.state === 'playing') return 0.7; return w0.apply(this, arguments); };
})();
