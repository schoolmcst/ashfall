/* ================================================================== EVENTS CALENDAR, LIVING MAPS, STASH HOUSE RADIO (1.2.88)
   EVENTS CALENDAR - the year's events in one place (click the event strip on the menu, or EVENTS on the TROPHIES
     screen): FROSTY NUGS (winter, Dec 10-25), the SEASON FINALE, the 4/20 FESTIVAL, HAUNTED HARVEST and the first
     weekend DOUBLE XP. Each says LIVE, or how many days until it starts.
   LIVING MAPS     - every match picks its weather from the map and the hour (so everyone in an online match sees the
     same): clear, light rain, mist or blowing leaves; during FROSTY NUGS it snows on every map and during the 4/20
     FESTIVAL green smoke and leaves drift over every map. Birds circle the outdoor maps. Off in performance mode.
   STASH HOUSE RADIO - four stations for the menus (the Crew Stash House has the dial, also in SETTINGS > AUDIO):
     DARKZONE FM (the old menu song), LO-FI LEAF (slow and dusty), TRAP HOUSE (808s and hi-hat rolls) and
     ROOTS DUB (offbeat skank and a deep bass). All made live with WebAudio, no recordings. */
EVENTS.splice(0, 0, { id: 'winter', name: 'FROSTY NUGS', sub: 'Double XP · snow on every map · play 3 matches for the FROSTY NUGS calling card', xp: 2, from: [12, 10], to: [12, 25], card: 'ev_winter', col: '#9ae8ff' });
(() => { const it = { id: 'ev_winter', name: 'FROSTY NUGS', kind: 'banner', r: 2, ev: 1, g: { t: 'stars', c: ['#06101a', '#9ae8ff', '#1a3a4a'], em: ['leaf', '#e8f8ff', '#06101a'] } }; COSM.push(it); COS[it.id] = it; })();
// ---------- the calendar
function evCalendar() {
  const d = evNow(), y = d.getFullYear(), day = 864e5, out = [];
  for (const e of EVENTS) {
    let a = new Date(y, e.from[0] - 1, e.from[1]), b = new Date(y, e.to[0] - 1, e.to[1], 23, 59, 59);
    if (b < d) { a = new Date(y + 1, e.from[0] - 1, e.from[1]); b = new Date(y + 1, e.to[0] - 1, e.to[1], 23, 59, 59); }
    out.push({ e, a, b, live: d >= a && d <= b, days: Math.max(0, Math.ceil((a - d) / day)) });
  }
  // the next first-weekend DOUBLE XP
  for (let m = 0; m < 3; m++) { const f = new Date(y, d.getMonth() + m, 1); while (f.getDay() !== 5) f.setDate(f.getDate() + 1); const end = new Date(f); end.setDate(f.getDate() + 2); end.setHours(23, 59, 59);
    if (end >= d) { out.push({ e: { id: 'dxp', name: 'DOUBLE XP WEEKEND', sub: 'Double XP all weekend · every first weekend of the month', col: '#4aa3ff' }, a: f, b: end, live: d >= f, days: Math.max(0, Math.ceil((f - d) / day)) }); break; } }
  return out.sort((p, q) => (q.live - p.live) || (p.a - q.a));
}
function evCalHtml() {
  const mon = dt => dt.toLocaleString('en', { month: 'short' }).toUpperCase() + ' ' + dt.getDate();
  return `<div class="evc">${evCalendar().map(c => `<div class="evc-r${c.live ? ' live' : ''}" style="--ec:${c.e.col}"><i></i><div><b>${c.e.name}</b><span>${c.e.sub}</span></div><small>${mon(c.a)} – ${mon(c.b)}</small><em>${c.live ? 'LIVE NOW' : c.days === 0 ? 'TOMORROW' : `IN ${c.days} DAY${c.days === 1 ? '' : 'S'}`}</em></div>`).join('')}</div>`;
}
function openEvCal() {
  let o = $('evCal'); if (o) o.remove(); o = document.createElement('div'); o.id = 'evCal';
  o.innerHTML = `<div class="evc-p"><h3>EVENTS CALENDAR</h3>${evCalHtml()}<button class="btn primary" data-evc="x">CLOSE</button></div>`;
  document.body.appendChild(o); o.onclick = e => { if (e.target === o || e.target.dataset.evc) { o.remove(); try { sfx.ui(); } catch (er) {} } };
}
// the strip on the menu opens it, and with no event on it says what's next
(() => { const old = evStrip; evStrip = function () { old(); let el = $('evStrip'); const menu = $('menu');
  if (!el && menu && !evActive()) { const nx = evCalendar().find(c => !c.live); if (nx) { el = document.createElement('div'); el.id = 'evStrip'; el.className = 'next'; menu.insertBefore(el, menu.querySelector('.cod-main')); el.style.setProperty('--ec', nx.e.col); el.innerHTML = `<b>NEXT EVENT · ${nx.e.name}</b><span>${nx.e.sub}</span><em>IN ${nx.days}D · CALENDAR</em>`; } }
  else if (el && !evActive() && !el.classList.contains('next')) el.remove();
  if (el && !el.onclick) { el.style.cursor = 'pointer'; el.style.pointerEvents = 'auto'; el.onclick = () => { try { sfx.ui(); } catch (e) {} openEvCal(); }; } }; })();
// ---------- LIVING MAPS
const AMB = { forM: null, kind: '', pts: null, birds: [], vel: null };
const ambHash = s => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h); };
function ambPick() {
  if (!M || !curMap) return ''; const m = MAPS[curMap] || {};
  if (M.mode === 'range' || M.mode === 'camp' || m.indoor || (M.br && typeof LT !== 'undefined' && LT.storm)) return '';
  const ev = evActive(); if (ev && ev.id === 'winter') return 'snow'; if (ev && ev.id === '420') return 'haze';
  if (/snow|whiteout/.test(curMap) || (curMap === 'stashisle' && typeof isleWinter === 'function' && isleWinter())) return 'snow';
  const h = ambHash(curMap + ':' + new Date().toISOString().slice(0, 13)) % 100;
  return h < 18 ? 'rain' : h < 32 ? 'mist' : h < 46 ? 'leaves' : '';
}
function ambClear() { if (AMB.pts) { scene.remove(AMB.pts); AMB.pts.geometry.dispose(); AMB.pts = null; } for (const b of AMB.birds) scene.remove(b.m); AMB.birds = []; if (AMB.fog0 != null && scene.fog) scene.fog.density = AMB.fog0; AMB.fog0 = null; AMB.kind = ''; }
function ambStart() {
  ambClear(); AMB.forM = M; if (S.perfMode) return; let k = ''; try { k = ambPick(); } catch (e) {} AMB.kind = k; if (!k) return;
  const n = k === 'rain' ? 1400 : k === 'snow' ? 1600 : k === 'haze' ? 500 : k === 'leaves' ? 260 : 0;
  if (k === 'mist' && scene.fog) { AMB.fog0 = scene.fog.density; scene.fog.density = Math.max(scene.fog.density * 2.2, 0.02); }
  if (n) { const pos = new Float32Array(n * 3); for (let i = 0; i < n; i++) { pos[i * 3] = rnd(-30, 30); pos[i * 3 + 1] = rnd(0, 22); pos[i * 3 + 2] = rnd(-30, 30); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const col = { rain: 0x9ab0c8, snow: 0xffffff, haze: 0x7fff8a, leaves: 0x8aa040 }[k], size = { rain: 0.05, snow: 0.09, haze: 0.5, leaves: 0.14 }[k];
    AMB.pts = new THREE.Points(g, new THREE.PointsMaterial({ color: col, size, transparent: true, opacity: k === 'haze' ? 0.25 : 0.75, depthWrite: false, map: k === 'haze' ? TEX.smoke : null })); AMB.pts.frustumCulled = false; scene.add(AMB.pts); AMB.seed = Math.random() * 100; }
  if (k !== 'snow' && k !== 'rain' && !(MAPS[curMap] || {}).night) for (let i = 0; i < 5; i++) { const m = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.5, 3), new THREE.MeshBasicMaterial({ color: 0x1a1a1a })); m.rotation.x = Math.PI / 2; scene.add(m); AMB.birds.push({ m, a: Math.random() * TAU, r: rnd(14, 26), h: rnd(18, 26), s: rnd(0.15, 0.25) * (i % 2 ? 1 : -1) }); }
}
function ambTick(dt) {
  if (!M || !inMatch()) { if (AMB.kind || AMB.birds.length) ambClear(); AMB.forM = null; return; }
  if (AMB.forM !== M || AMB.map !== curMap) { AMB.map = curMap; ambStart(); }
  const k = AMB.kind;
  if (AMB.pts) { const p = AMB.pts.geometry.attributes.position.array, cx = camera.position.x, cy = camera.position.y, cz = camera.position.z, n = p.length / 3, t = NOW;
    const fall = { rain: 22, snow: 1.6, haze: 0.25, leaves: 1.2 }[k] || 1;
    for (let i = 0; i < n; i++) { const j = i * 3; p[j + 1] -= fall * dt * (k === 'haze' ? -1 : 1);
      if (k === 'snow' || k === 'leaves') { p[j] += Math.sin(t * 0.8 + i) * dt * 0.6 + (k === 'leaves' ? dt * 1.4 : 0); p[j + 2] += Math.cos(t * 0.7 + i * 1.3) * dt * 0.5; }
      if (k === 'haze') p[j] += Math.sin(t * 0.3 + i) * dt * 0.3;
      let dx = p[j] - cx, dz = p[j + 2] - cz; if (dx > 30) p[j] -= 60; else if (dx < -30) p[j] += 60; if (dz > 30) p[j + 2] -= 60; else if (dz < -30) p[j + 2] += 60;
      if (p[j + 1] < cy - 6) p[j + 1] += 26; else if (p[j + 1] > cy + 20) p[j + 1] -= 26; }
    AMB.pts.geometry.attributes.position.needsUpdate = true; }
  for (const b of AMB.birds) { b.a += b.s * dt; const x = Math.cos(b.a) * b.r, z = Math.sin(b.a) * b.r; b.m.position.set(x, b.h + Math.sin(NOW * 2 + b.r) * 0.4, z); b.m.lookAt(Math.cos(b.a + b.s) * b.r, b.h, Math.sin(b.a + b.s) * b.r); b.m.rotateX(Math.PI / 2); }
}
// ---------- STASH HOUSE RADIO
const RADIO = [{ id: 'fm', n: 'DARKZONE FM', d: 'the dark synth menu song', bpm: 100 }, { id: 'lofi', n: 'LO-FI LEAF', d: 'slow, dusty keys and a lazy beat', bpm: 78 }, { id: 'trap', n: 'TRAP HOUSE', d: '808s and hi-hat rolls', bpm: 140 }, { id: 'dub', n: 'ROOTS DUB', d: 'offbeat skank and a deep bass', bpm: 76 }];
const radioSt = () => RADIO.find(r => r.id === (S.radio || 'fm')) || RADIO[0];
const radioStepLen = () => 60 / radioSt().bpm / 4;
function radioSet(id) { if (!RADIO.find(r => r.id === id)) return; S.radio = id; try { saveSettings(); } catch (e) {} MUS.step = 0; MUS.bar = 0; try { showMsg('RADIO · ' + radioSt().n); } catch (e) {} }
const RAD_CH = { lofi: [[62, 65, 69, 72], [55, 59, 62, 65], [60, 64, 67, 71], [57, 60, 64, 67]], trap: [[57, 60, 64], [53, 57, 60], [52, 55, 59], [52, 56, 59]], dub: [[55, 59, 62], [53, 57, 60], [55, 59, 62], [50, 54, 57]] };
function radioStep(t) {
  const id = radioSt().id, s = MUS.step % 16, bar = MUS.bar, ch = RAD_CH[id][bar % 4], L = radioStepLen();
  if (id === 'lofi') {
    if (s === 0) for (const n of ch) musOsc('triangle', mhz(n), t + Math.random() * 0.03, L * 14, 0.03, 1400, { a: 0.05, r: 0.9 });
    if (s === 0 || s === 10) musKick(t + (s === 10 ? L * 0.3 : 0), 0.35);
    if (s === 4 || s === 12) musNoise(t + L * 0.15, 0.2, 0.08, 'bandpass', 1500, 0.7);
    if (s % 2 === 0) musNoise(t + (s % 4 === 2 ? L * 0.33 : 0), 0.04, 0.018, 'highpass', 6500);
    if (s === 0 || s === 6) musOsc('sine', mhz(ch[0] - 24), t, L * 5, 0.09, 600, { r: L * 3 });
    if (s % 4 === 0) musNoise(t, L * 4, 0.006, 'highpass', 3000);   // the vinyl dust
  } else if (id === 'trap') {
    if (s === 0 && bar % 2 === 0) for (const n of ch) musOsc('sawtooth', mhz(n), t, L * 32, 0.014, 900, { det: 7, a: 0.4, r: 1 });
    if (s === 0 || s === 11 || (s === 6 && bar % 2)) musOsc('sine', mhz(ch[0] - 24), t, L * 6, 0.16, 300, { r: L * 5, sweep: true });   // the 808
    if (s === 8) musNoise(t, 0.22, 0.14, 'bandpass', 1900, 0.8);
    const roll = bar % 4 === 3 && s >= 12; if (s % 2 === 0 || roll) musNoise(t, 0.03, 0.03, 'highpass', 8000); if (roll) musNoise(t + L / 2, 0.02, 0.025, 'highpass', 8500);
    if (s % 4 === 2 && bar % 8 >= 4) musOsc('square', mhz(ch[(s / 4 | 0) % ch.length] + 12), t, L * 1.5, 0.014, 2400, { r: L });
  } else if (id === 'dub') {
    if (s === 4 || s === 12) for (const n of ch) musOsc('square', mhz(n), t, L * 0.9, 0.016, 2200, { r: L * 0.5 });   // the skank
    if (s === 4 || s === 12) musOsc('square', mhz(ch[1]), t + L * 3, L * 0.6, 0.007, 1800);   // its echo
    if (s === 8) musKick(t, 0.5); if (s === 8) musNoise(t, 0.18, 0.09, 'bandpass', 1400, 0.6);   // the one drop
    if (s % 4 === 2) musNoise(t, 0.04, 0.02, 'highpass', 7000);
    const bl = [0, 3, 6, 10]; if (bl.includes(s)) musOsc('sine', mhz(ch[0] - 24 + (s === 10 ? 7 : 0)), t, L * 2.5, 0.14, 380, { r: L });
  }
  MUS.step++; if (MUS.step % 16 === 0) MUS.bar++;
}
// the menu song takes its station; the music loop steps at the station's tempo
(() => { const old = musStep; musStep = function (t) { if (radioSt().id === 'fm') return old(t); radioStep(t); }; })();
function radioHtml() { return `<div class="rad"><b>STASH HOUSE RADIO</b><div class="rad-row">${RADIO.map(r => `<button class="p2-s${radioSt().id === r.id ? ' on' : ''}" data-rad="${r.id}"><i>📻</i><b>${r.n}</b><span>${r.d}</span></button>`).join('')}</div></div>`; }
function radioWire(root, after) { for (const b of (root || document).querySelectorAll('[data-rad]')) b.onclick = () => { radioSet(b.dataset.rad); try { sfx.ui(); } catch (e) {} if (after) after(); }; }
(() => {
  const s = document.createElement('style'); s.textContent = `#evStrip{cursor:pointer}#evStrip.next{opacity:.8}#evCal{position:fixed;inset:0;z-index:90;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;pointer-events:auto}
.evc-p{width:min(720px,92vw);padding:16px 20px;background:rgba(10,13,12,.96);border:1px solid var(--line)}.evc-p h3{margin:0 0 10px;letter-spacing:.3em;font-size:14px;color:var(--accent)}.evc-p .btn{margin-top:10px}
.evc-r{display:grid;grid-template-columns:6px 1fr auto auto;gap:12px;align-items:center;padding:8px 10px;margin-bottom:6px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.03)}.evc-r i{align-self:stretch;background:var(--ec)}.evc-r b{display:block;font-size:13px;letter-spacing:.16em}.evc-r span{font-size:10px;color:var(--dim)}.evc-r small{font-size:10px;letter-spacing:.14em;color:var(--dim)}.evc-r em{font-style:normal;font-size:11px;font-weight:700;letter-spacing:.14em;color:var(--ec)}.evc-r.live{border-color:var(--ec);box-shadow:0 0 12px color-mix(in srgb,var(--ec) 30%,transparent)}
.rad{margin-top:10px;text-align:left}.rad>b{display:block;font-size:12px;letter-spacing:.2em;color:var(--accent);margin-bottom:6px}.rad-row{display:flex;flex-wrap:wrap;gap:6px}`;
  document.head.appendChild(s);
})();
