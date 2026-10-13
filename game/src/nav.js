/* ================================================================== navigation: layered grid with heights
   The arena is cut into 1 m cells. Each cell can have up to NL walkable floors (the ground, a balcony above it, a roof
   above that). Bots path over (cell, floor) nodes: they can climb stairs and ramps, walk off ledges (drop up to DROP),
   and never try to walk up a sheer wall. Flow fields toward any goal are built on demand and cached. */
const NN = ARENA * 2, NL = 3, DROP = 3.4, CLIMB = 0.42, CLIMB_STAIR = 0.95, BODY = 1.65;
const NX = [1, -1, 0, 0, 1, 1, -1, -1], NZ = [0, 0, 1, -1, 1, -1, 1, -1];
const lvN = new Uint8Array(NN * NN), lvH = new Float32Array(NN * NN * NL), lvS = new Uint8Array(NN * NN * NL);   // floors per cell, their heights, stair flag
const navBlocked = new Uint8Array(NN * NN);   // 1 = no walkable floor at ground level (spawns, grass, legacy checks)
const cellOf = v => clamp(Math.floor(v + ARENA), 0, NN - 1);
function buildNav() {
  for (let cz = 0; cz < NN; cz++) for (let cx = 0; cx < NN; cx++) {
    const c = cz * NN + cx, x = -ARENA + cx + 0.5, z = -ARENA + cz + 0.5, near = boxesNear(x, z);
    const cand = [[0, 0]];
    for (const b of near) if (b.walk && x > b.minx - 0.05 && x < b.maxx + 0.05 && z > b.minz - 0.05 && z < b.maxz + 0.05) cand.push([b.top, b.stair ? 1 : 0]);
    cand.sort((a, b) => a[0] - b[0]);
    let n = 0, last = -9;
    for (const [h, st] of cand) {
      if (h - last < 0.05) { if (st && n) lvS[c * NL + n - 1] = 1; continue; }
      let ok = true;
      for (const b of near) {
        if (b.bot >= h + BODY || b.top <= h + 0.36) continue;   // not at body height above this floor
        const inside = x > b.minx - 0.05 && x < b.maxx + 0.05 && z > b.minz - 0.05 && z < b.maxz + 0.05;
        if (inside) { ok = false; break; }
        if (b.stair && b.top <= h + 1.3) continue;   // the next steps of a stair are not a wall
        if (x > b.minx - 0.6 && x < b.maxx + 0.6 && z > b.minz - 0.6 && z < b.maxz + 0.6) { ok = false; break; }   // keep off walls
      }
      if (!ok) continue;
      if (n >= NL) break;
      lvH[c * NL + n] = h; lvS[c * NL + n] = st; n++; last = h;
    }
    lvN[c] = n;
    navBlocked[c] = n && lvH[c * NL] < 0.5 ? 0 : 1;
  }
  FLOW.clear(); navTarget = -1;
}
// the floor of a cell nearest to (and preferably not above) height y; -1 if the cell has none
function levelAt(c, y) {
  const n = lvN[c]; if (!n) return -1;
  let best = -1, bd = 1e9;
  for (let l = 0; l < n; l++) { const h = lvH[c * NL + l], d = h <= y + 0.6 ? y - h : (h - y) * 3 + 2; if (d < bd) { bd = d; best = l; } }
  return best;
}
// can you walk from floor (a at height ha) into floor (b at height hb)?
function canStep(ha, sa, hb, sb) { const up = hb - ha; return up <= (sa || sb ? CLIMB_STAIR : CLIMB) && -up <= DROP; }
function diagOk(cx, cz, nx, nz, h) {
  for (const c of [cz * NN + nx, nz * NN + cx]) { let ok = false; for (let l = 0; l < lvN[c]; l++) if (Math.abs(lvH[c * NL + l] - h) < 1.0) { ok = true; break; } if (!ok) return false; }
  return true;
}

/* ---------- flow fields */
const FLOW = new Map(), flowQ = new Int32Array(NN * NN * NL);
function nodeOf(x, z, y) {
  let cx = cellOf(x), cz = cellOf(z), c = cz * NN + cx, l = levelAt(c, y || 0);
  if (l >= 0) return c * NL + l;
  for (let r = 1; r < 6; r++) for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
    const x2 = cx + dx, z2 = cz + dz; if (x2 < 0 || z2 < 0 || x2 >= NN || z2 >= NN) continue;
    const c2 = z2 * NN + x2, l2 = levelAt(c2, y || 0); if (l2 >= 0) return c2 * NL + l2;
  }
  return -1;
}
function flowField(x, z, y) {
  const node = nodeOf(x, z, y); if (node < 0) return null;
  let f = FLOW.get(node); if (f) { f.used = NOW; return f.d; }
  const d = new Int32Array(NN * NN * NL).fill(-1), q = flowQ;
  let head = 0, tail = 0; q[tail++] = node; d[node] = 0;
  while (head < tail) {
    const nd0 = q[head++], c = (nd0 / NL) | 0, l = nd0 % NL, cx = c % NN, cz = (c / NN) | 0, h = lvH[nd0], st = lvS[nd0];
    for (let k = 0; k < 8; k++) {
      const nx = cx + NX[k], nz = cz + NZ[k]; if (nx < 0 || nz < 0 || nx >= NN || nz >= NN) continue;
      const n = nz * NN + nx;
      for (let m = 0; m < lvN[n]; m++) {
        const nn = n * NL + m; if (d[nn] >= 0) continue;
        if (!canStep(lvH[nn], lvS[nn], h, st)) continue;   // a bot standing on nn must be able to move onto our node
        if (k >= 4 && !diagOk(cx, cz, nx, nz, Math.max(h, lvH[nn]))) continue;
        d[nn] = d[nd0] + 1; q[tail++] = nn;
      }
    }
  }
  if (FLOW.size > 40) { let ok = null, ou = 1e9; FLOW.forEach((v, k) => { if (v.used < ou) { ou = v.used; ok = k; } }); FLOW.delete(ok); }
  FLOW.set(node, { d, used: NOW });
  return d;
}
// direction to walk from (x, y, z) to follow a flow field; null when there is no route
function flowDir(d, x, z, y) {
  if (!d) return null;
  const node = nodeOf(x, z, y); if (node < 0) return null;
  const c = (node / NL) | 0, cx = c % NN, cz = (c / NN) | 0, h = lvH[node], st = lvS[node];
  let best = d[node] >= 0 ? d[node] : 1e9, bk = -1;
  for (let k = 0; k < 8; k++) {
    const nx = cx + NX[k], nz = cz + NZ[k]; if (nx < 0 || nz < 0 || nx >= NN || nz >= NN) continue;
    const n = nz * NN + nx;
    for (let m = 0; m < lvN[n]; m++) {
      const nn = n * NL + m; if (d[nn] < 0 || d[nn] >= best) continue;
      if (!canStep(h, st, lvH[nn], lvS[nn])) continue;
      if (k >= 4 && !diagOk(cx, cz, nx, nz, Math.max(h, lvH[nn]))) continue;
      best = d[nn]; bk = k;
    }
  }
  if (bk < 0) return null;
  const tx = -ARENA + (cx + NX[bk] + 0.5) - x, tz = -ARENA + (cz + NZ[bk] + 0.5) - z, l = Math.hypot(tx, tz) || 1;
  return [tx / l, tz / l];
}
// is there a straight walkable line from a to b (following floors, stepping up stairs, dropping off ledges)?
function gridClear(x0, z0, x1, z1, y0 = 0, y1 = 0) {
  const dx = x1 - x0, dz = z1 - z0, n = Math.ceil(Math.hypot(dx, dz) / 0.5);
  let c = cellOf(z0) * NN + cellOf(x0), l = levelAt(c, y0); if (l < 0) return false;
  let h = lvH[c * NL + l], st = lvS[c * NL + l];
  for (let i = 1; i <= n; i++) {
    const t = i / n, c2 = cellOf(z0 + dz * t) * NN + cellOf(x0 + dx * t); if (c2 === c) continue;
    let bl = -1, bd = 1e9;
    for (let m = 0; m < lvN[c2]; m++) { const hm = lvH[c2 * NL + m]; if (!canStep(h, st, hm, lvS[c2 * NL + m])) continue; const dd = Math.abs(hm - h); if (dd < bd) { bd = dd; bl = m; } }
    if (bl < 0) return false;
    c = c2; h = lvH[c * NL + bl]; st = lvS[c * NL + bl];
  }
  return Math.abs(h - y1) < 1.0;
}
function goalCell(x, z) {
  let cx = cellOf(x), cz = cellOf(z);
  if (!navBlocked[cz * NN + cx]) return cz * NN + cx;
  for (let r = 1; r < 8; r++) for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) { const x2 = cx + dx, z2 = cz + dz; if (x2 >= 0 && z2 >= 0 && x2 < NN && z2 < NN && !navBlocked[z2 * NN + x2]) return z2 * NN + x2; }
  return cz * NN + cx;
}
// nearest open spot on the ground
function openNear(x, z) { const c = goalCell(x, z); return { x: -ARENA + (c % NN) + 0.5, z: -ARENA + ((c / NN) | 0) + 0.5 }; }

/* ---------- wave mode: one field toward the player */
let navTarget = -1, navField = null;
function updateNav(px, pz, py = 0) {
  const node = nodeOf(px, pz, py); if (node < 0 || node === navTarget) return;
  navTarget = node; navField = flowField(px, pz, py);
}
function navDir(x, z, y = 0) { return flowDir(navField, x, z, y); }
// can a bot at ground cell c reach the player? (used to pick spawn spots)
function navReach(c) { return !!navField && navField[c * NL] >= 0; }

/* ---------- moving a bot: walk, climb, fall */
function botGround(g, dt) {
  const gy = groundAt(g.position.x, g.position.z, g.position.y);
  if (g.position.y > gy + 0.02) { g.userData.vy = (g.userData.vy || 0) + 20 * dt; g.position.y = Math.max(gy, g.position.y - g.userData.vy * dt); }
  else { g.position.y = gy; g.userData.vy = 0; }
}
