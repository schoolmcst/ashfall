/* ================================================================== procedural textures */
function makeRng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
// periodic value noise so textures tile without seams
function tileNoise(cells, rand, cy) {
  const cx = cells; cy = cy || cells;
  const g = new Float32Array(cx * cy); for (let i = 0; i < g.length; i++) g[i] = rand();
  return (x, y) => {
    const fx = x * cx, fy = y * cy, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0;
    const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
    const X0 = ((x0 % cx) + cx) % cx, Y0 = ((y0 % cy) + cy) % cy, X1 = (X0 + 1) % cx, Y1 = (Y0 + 1) % cy;
    const a = g[Y0 * cx + X0], b = g[Y0 * cx + X1], c = g[Y1 * cx + X0], d = g[Y1 * cx + X1];
    return (a + (b - a) * sx) * (1 - sy) + (c + (d - c) * sx) * sy;
  };
}
function fbm(rand, base, oct) {
  const fs = []; for (let i = 0; i < oct; i++) fs.push(tileNoise(base << i, rand));
  return (x, y) => { let a = 0, amp = 0.5, t = 0; for (const f of fs) { a += f(x, y) * amp; t += amp; amp *= 0.5; } return a / t; };
}
const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const hex3 = h => [(h >> 16) & 255, (h >> 8) & 255, h & 255];

const TEX_SIZE = (QUALITY[qKey()] || QUALITY.high).tex;   // 512 on HIGH/ULTRA (applies at launch)
// fn(u, v, x, y) -> [r, g, b, height 0..1]; returns { map, bump }
function paint(size, fn, after) {
  const cc = document.createElement('canvas'), bc = document.createElement('canvas');
  cc.width = cc.height = bc.width = bc.height = size;
  const cg = cc.getContext('2d'), bg = bc.getContext('2d');
  const ci = cg.createImageData(size, size), bi = bg.createImageData(size, size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const r = fn(x / size, y / size, x, y), i = (y * size + x) * 4, h = clamp(r[3], 0, 1) * 255;
    ci.data[i] = clamp(r[0], 0, 255); ci.data[i + 1] = clamp(r[1], 0, 255); ci.data[i + 2] = clamp(r[2], 0, 255); ci.data[i + 3] = 255;
    bi.data[i] = bi.data[i + 1] = bi.data[i + 2] = h; bi.data[i + 3] = 255;
  }
  cg.putImageData(ci, 0, 0); bg.putImageData(bi, 0, 0);
  if (after) after(cg, bg, size);
  return { cc, bc };
}
function toTex(canvas, srgb, repeat) {
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = Math.min((QUALITY[qKey()] || QUALITY.high).anis, MAXANIS);
  if (srgb) t.encoding = THREE.sRGBEncoding;
  if (repeat) t.repeat.set(repeat, repeat);
  return t;
}
// Wrap-around box blur of a height map: single-pixel noise in a bump map turns into per-pixel normal flicker
// ("static") under direct sun, so bump maps keep only the broad shapes (cracks, pits, mortar lines).
function blurHeight(canvas, passes = 2) {
  const s = canvas.width, g = canvas.getContext('2d'), img = g.getImageData(0, 0, s, s), d = img.data;
  let a = new Float32Array(s * s), b = new Float32Array(s * s);
  for (let i = 0; i < s * s; i++) a[i] = d[i * 4];
  for (let p = 0; p < passes; p++) {
    for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
      let t = 0; for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) t += a[((y + oy + s) % s) * s + ((x + ox + s) % s)];
      b[y * s + x] = t / 9;
    }
    const tmp = a; a = b; b = tmp;
  }
  for (let i = 0; i < s * s; i++) { d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = a[i]; }
  g.putImageData(img, 0, 0);
  return canvas;
}
function pbrSet(p, repeat) { return { map: toTex(p.cc, true, repeat), bump: toTex(blurHeight(p.bc), false, repeat) }; }

const TEX = {};
function buildTextures() {
  const N = TEX_SIZE;
  // ground: dirt, patchy grass, pebbles
  { const r = makeRng(11), n1 = fbm(r, 4, 5), n2 = fbm(r, 8, 4), n3 = fbm(r, 32, 2);
    const dirt = hex3(0x6b5d44), dirt2 = hex3(0x4e4430), grass = hex3(0x55612f), grass2 = hex3(0x6f7a3c);
    TEX.ground = pbrSet(paint(N, (u, v) => {
      const a = n1(u, v), b = n2(u, v), c = n3(u, v);
      let col = mix3(dirt2, dirt, b);
      const g = clamp((a - 0.46) * 5, 0, 1); col = mix3(col, mix3(grass, grass2, c), g * 0.85);
      const peb = n3(u * 1.0, v * 1.0) > 0.78 ? 18 : 0;
      const k = 0.85 + c * 0.3;
      return [col[0] * k + peb, col[1] * k + peb, col[2] * k + peb, 0.4 + b * 0.35 + c * 0.25 + (peb ? 0.15 : 0)];
    }), 1); }
  // asphalt
  { const r = makeRng(23), n1 = fbm(r, 4, 4), n3 = fbm(r, 64, 2);
    TEX.asphalt = pbrSet(paint(N, (u, v) => {
      const a = n1(u, v), c = n3(u, v), g = 52 + a * 22 + c * 26, sp = c > 0.82 ? 50 : 0;
      return [g + sp, g + sp, g + 2 + sp, 0.35 + c * 0.6];
    }, (cg, bg, s) => {
      cg.strokeStyle = 'rgba(15,15,15,.7)'; cg.lineWidth = 1.2; bg.strokeStyle = '#000'; bg.lineWidth = 2;
      const rr = makeRng(5);
      for (let k = 0; k < 5; k++) { let x = rr() * s, y = rr() * s; cg.beginPath(); bg.beginPath(); cg.moveTo(x, y); bg.moveTo(x, y);
        for (let j = 0; j < 14; j++) { x += (rr() - 0.5) * 26; y += (rr() - 0.2) * 22; cg.lineTo(x, y); bg.lineTo(x, y); } cg.stroke(); bg.stroke(); }
    }), 1); }
  // weathered concrete with stains and cracks
  { const r = makeRng(31), n1 = fbm(r, 4, 5), n2 = fbm(r, 16, 3), n3 = fbm(r, 64, 2);
    TEX.concrete = pbrSet(paint(N, (u, v) => {
      const a = n1(u, v), b = n2(u, v), c = n3(u, v);
      let g = 118 + a * 55 + b * 22 + (c - 0.5) * 30;
      const stain = clamp((n2((u + 0.3) % 1, v) - 0.55) * 3, 0, 1); g *= 1 - stain * 0.35;
      const pore = c > 0.86 ? 0.55 : 1;
      return [g * pore * 1.02, g * pore, g * pore * 0.95, 0.5 + a * 0.2 + c * 0.3];
    }, (cg, bg, s) => {
      const rr = makeRng(77); cg.strokeStyle = 'rgba(30,30,30,.55)'; cg.lineWidth = 1; bg.strokeStyle = '#000'; bg.lineWidth = 1.5;
      for (let k = 0; k < 4; k++) { let x = rr() * s, y = rr() * s; cg.beginPath(); bg.beginPath(); cg.moveTo(x, y); bg.moveTo(x, y);
        for (let j = 0; j < 10; j++) { x += (rr() - 0.5) * 30; y += (rr() - 0.5) * 30; cg.lineTo(x, y); bg.lineTo(x, y); } cg.stroke(); bg.stroke(); }
    }), 1); }
  // brick: 16 courses, 5 bricks wide, mortar, per-brick colour, soot
  { const r = makeRng(41), n1 = fbm(r, 8, 4), n3 = fbm(r, 64, 2), rows = 16, per = 5, rh = N / rows, bw = N / per;
    const cols = [hex3(0x8c4a37), hex3(0x7d3f2f), hex3(0x9a5a41), hex3(0x6f3a2d), hex3(0xa0614a)], mort = hex3(0xb2ab9a);
    const jit = []; for (let i = 0; i < rows * (per + 1); i++) jit.push(r());
    TEX.brick = pbrSet(paint(N, (u, v, x, y) => {
      const row = Math.floor(y / rh), off = (row % 2) * bw * 0.5, xx = (x + off) % N, bx = Math.floor(xx / bw);
      const fy = y - row * rh, fx = xx - bx * bw, m = 1.6;
      const inMortar = fy < m || fx < m;
      const j = jit[(row * (per + 1) + bx) % jit.length], base = cols[Math.floor(j * cols.length) % cols.length];
      const c = n3(u, v), a = n1(u, v);
      if (inMortar) { const g = 0.8 + c * 0.3; return [mort[0] * g, mort[1] * g, mort[2] * g, 0.1]; }
      const k = (0.78 + j * 0.3 + a * 0.3) * (0.92 + c * 0.16);
      const edge = Math.min(fy - m, fx - m, 3) / 3;
      return [base[0] * k, base[1] * k, base[2] * k, 0.55 + edge * 0.2 + c * 0.25];
    }), 1); }
  // crate wood planks
  { const r = makeRng(53), n1 = fbm(r, 4, 3), gr = tileNoise(4, r, 96), planks = 4, ph = N / planks;
    const light = hex3(0x9a7648), dark = hex3(0x6a4a2a);
    TEX.wood = pbrSet(paint(N, (u, v, x, y) => {
      const p = Math.floor(y / ph), fy = y - p * ph, grain = gr(u, (v + p * 0.13) % 1), t = n1(u, v) * 0.5 + grain * 0.6;
      const gap = fy < 2 || fy > ph - 2;
      if (gap) return [26, 18, 10, 0.05];
      const col = mix3(dark, light, clamp(t + (p % 2) * 0.1, 0, 1)), k = 0.85 + grain * 0.3;
      return [col[0] * k, col[1] * k, col[2] * k, 0.5 + grain * 0.5];
    }, (cg, bg, s) => {
      cg.fillStyle = '#2b2118'; for (let p = 0; p < 4; p++) for (const nx of [10, s - 10]) { cg.beginPath(); cg.arc(nx, p * (s / 4) + s / 8, 2.2, 0, TAU); cg.fill(); }
    }), 1); }
  // rusty painted steel
  { const r = makeRng(61), n1 = fbm(r, 4, 5), n2 = fbm(r, 16, 3), n3 = fbm(r, 64, 2);
    const paintC = hex3(0x4b5a4c), rustA = hex3(0x7a3e1f), rustB = hex3(0xa5602d), steel = hex3(0x6c7070);
    TEX.metal = pbrSet(paint(N, (u, v) => {
      const a = n1(u, v), b = n2(u, v), c = n3(u, v), rust = clamp((a - 0.5) * 4 + (b - 0.5) * 1.5, 0, 1);
      let col = mix3(paintC, steel, clamp((c - 0.7) * 4, 0, 1));
      col = mix3(col, mix3(rustA, rustB, b), rust * 0.9);
      const k = 0.8 + c * 0.35;
      return [col[0] * k, col[1] * k, col[2] * k, 0.4 + rust * 0.4 + c * 0.3];
    }, (cg, bg, s) => {
      const rr = makeRng(9); cg.strokeStyle = 'rgba(200,200,190,.18)'; cg.lineWidth = 1;
      for (let k = 0; k < 30; k++) { const x = rr() * s, y = rr() * s, l = 8 + rr() * 30, a = (rr() - 0.5) * 0.5; cg.beginPath(); cg.moveTo(x, y); cg.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); cg.stroke(); }
    }), 1); }
  // sandbag burlap
  { const r = makeRng(71), n3 = fbm(r, 64, 2), n1 = fbm(r, 8, 3);
    TEX.sand = pbrSet(paint(N, (u, v, x, y) => {
      const w = ((x + y) % 4 < 2 ? 1 : 0.88) * (((x - y + 256) % 4) < 2 ? 1 : 0.9), a = n1(u, v), c = n3(u, v);
      const col = mix3(hex3(0x8a7a55), hex3(0xa89a72), a), k = w * (0.85 + c * 0.3);
      return [col[0] * k, col[1] * k, col[2] * k, 0.4 + w * 0.4 + c * 0.2];
    }), 1); }
  // road lane marking (alpha)
  { const c = document.createElement('canvas'); c.width = 32; c.height = 128; const g = c.getContext('2d'); g.clearRect(0, 0, 32, 128);
    g.fillStyle = 'rgba(230,200,70,.9)'; g.fillRect(12, 8, 8, 56);
    const t = toTex(c, true, 1); TEX.lane = { map: t }; }
  // grass blade (alpha)
  { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); g.clearRect(0, 0, 64, 64);
    const rr = makeRng(3);
    for (let i = 0; i < 14; i++) { const x = 6 + rr() * 52, h = 24 + rr() * 36, lean = (rr() - 0.5) * 16, gr = 90 + rr() * 70;
      const grd = g.createLinearGradient(0, 64, 0, 64 - h); grd.addColorStop(0, 'rgb(40,' + (gr - 40) + ',20)'); grd.addColorStop(1, 'rgb(' + (110 + rr() * 40) + ',' + (gr + 40) + ',50)');
      g.fillStyle = grd; g.beginPath(); g.moveTo(x - 2, 64); g.quadraticCurveTo(x + lean * 0.3, 64 - h * 0.6, x + lean, 64 - h); g.quadraticCurveTo(x + lean * 0.3 + 2, 64 - h * 0.5, x + 2, 64); g.fill(); }
    TEX.grass = { map: toTex(c, true, 1) }; }
  // particle / decal sprites
  const spr = (size, draw, srgb) => { const c = document.createElement('canvas'); c.width = c.height = size; draw(c.getContext('2d'), size); const t = new THREE.CanvasTexture(c); if (srgb) t.encoding = THREE.sRGBEncoding; return t; };
  TEX.smoke = spr(64, (g, s) => { const r = makeRng(4); for (let i = 0; i < 9; i++) { const x = s / 2 + (r() - 0.5) * s * 0.3, y = s / 2 + (r() - 0.5) * s * 0.3, rad = s * (0.18 + r() * 0.17);
    const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, s, s); } }, true);
  TEX.flash = spr(64, (g, s) => { const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); gr.addColorStop(0, 'rgba(255,255,230,1)'); gr.addColorStop(0.25, 'rgba(255,200,110,.85)'); gr.addColorStop(1, 'rgba(255,120,30,0)'); g.fillStyle = gr; g.fillRect(0, 0, s, s);
    g.strokeStyle = 'rgba(255,230,160,.8)'; g.lineWidth = 2; for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + 0.3; g.beginPath(); g.moveTo(s / 2, s / 2); g.lineTo(s / 2 + Math.cos(a) * s * 0.48, s / 2 + Math.sin(a) * s * 0.48); g.stroke(); } }, true);
  TEX.fire = spr(64, (g, s) => { const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); gr.addColorStop(0, 'rgba(255,245,200,1)'); gr.addColorStop(0.35, 'rgba(255,160,50,.9)'); gr.addColorStop(0.7, 'rgba(200,50,10,.4)'); gr.addColorStop(1, 'rgba(100,20,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, s, s); }, true);
  TEX.hole = spr(64, (g, s) => { let gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); gr.addColorStop(0, 'rgba(10,8,6,.95)'); gr.addColorStop(0.28, 'rgba(10,8,6,.9)'); gr.addColorStop(0.45, 'rgba(40,34,28,.35)'); gr.addColorStop(1, 'rgba(40,34,28,0)'); g.fillStyle = gr; g.fillRect(0, 0, s, s); }, true);
  TEX.scorch = spr(128, (g, s) => { const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); gr.addColorStop(0, 'rgba(8,6,5,.9)'); gr.addColorStop(0.5, 'rgba(14,10,8,.6)'); gr.addColorStop(1, 'rgba(14,10,8,0)'); g.fillStyle = gr; g.fillRect(0, 0, s, s); }, true);
  TEX.blood = spr(64, (g, s) => { const r = makeRng(8); g.fillStyle = 'rgba(90,6,6,.85)'; for (let i = 0; i < 16; i++) { const a = r() * TAU, d = r() * s * 0.32; g.beginPath(); g.arc(s / 2 + Math.cos(a) * d, s / 2 + Math.sin(a) * d, 3 + r() * 9, 0, TAU); g.fill(); } }, true);
}

/* camouflage cloth for uniforms: blotchy 3-tone pattern */
function camoTexture(c1, c2, c3, seed) {
  const r = makeRng(seed), n1 = fbm(r, 4, 3), n2 = fbm(r, 8, 3), n3 = fbm(r, 64, 2), a = hex3(c1), b = hex3(c2), c = hex3(c3);
  const p = paint(128, (u, v) => {
    const x = n1(u, v), y = n2(u, v), w = n3(u, v);
    let col = x > 0.52 ? a : b; if (y > 0.62) col = c;
    const k = 0.85 + w * 0.3;
    return [col[0] * k, col[1] * k, col[2] * k, 0.5 + w * 0.5];
  });
  return pbrSet(p, 1);
}

function camoCanvas(c1, c2, c3, seed) {
  const r = makeRng(seed), n1 = fbm(r, 4, 3), n2 = fbm(r, 8, 3), n3 = fbm(r, 64, 2), a = hex3(c1), b = hex3(c2), c = hex3(c3);
  return paint(128, (u, v) => {
    const x = n1(u, v), y = n2(u, v), w = n3(u, v);
    let col = x > 0.52 ? a : b; if (y > 0.62) col = c;
    const k = 0.85 + w * 0.3;
    return [col[0] * k, col[1] * k, col[2] * k, 0.5];
  }).cc;
}
