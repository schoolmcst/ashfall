/* ================================================================== PLAY OF THE GAME
   While you play, the last 14 seconds are kept 15 times a second: where you were and where you looked, every soldier
   around you, your shots and kills. Each kill scores the 6 seconds before it (kills x 10, headshots and long shots
   extra); the best moment of the match is kept (with 1.5 s after the last kill). When the match ends it plays from your
   eyes before the scoreboard: ghost soldiers walk the recorded paths, your shots flash, the ones you got fall.
   Press any key / click to skip. Matches only (not zombies), and only if you got at least two kills in the moment. */
const POTG = { buf: [], acc: 0, kills: [], best: null, pend: null, keys: new WeakMap(), nkey: 0, play: null };
const POTG_HZ = 15, POTG_KEEP = 14;
function potgReset() { POTG.buf = []; POTG.kills = []; POTG.best = null; POTG.pend = null; POTG.acc = 0; POTG.keys = new WeakMap(); POTG.nkey = 0; POTG.shots = 0; }
function potgKey(o) { let k = POTG.keys.get(o); if (k === undefined) { k = ++POTG.nkey; POTG.keys.set(o, k); } return k; }
function potgShot() { POTG.shots = (POTG.shots || 0) + 1; }
function potgTick(dt) {
  if (POTG.play) return;
  if (!inMatch() || M.mode === 'range' || G.bench || G.noRender && !G.potgTest || G.state !== 'playing') return;
  POTG.acc += dt; if (POTG.acc < 1 / POTG_HZ) return; POTG.acc = 0;
  const t = M.t, ents = [];
  for (const e of enemies) if (e.group && e.rig && !e.zombie && e.group.visible !== false) ents.push([potgKey(e.entry || e), e.group.position.x, e.group.position.y, e.group.position.z, e.group.rotation.y, e.type || 'rifleman', e.team === M.myTeam && M.def.teams ? 1 : 0, e.inf ? 1 : 0, e.crouchK || 0]);
  POTG.buf.push({ t, p: [P.x, P.y, P.z, P.yaw, P.pitch, P.eye], cur: G.cur, ads: G.ads, sh: POTG.shots || 0, e: ents });
  POTG.shots = 0;
  while (POTG.buf.length && POTG.buf[0].t < t - POTG_KEEP) POTG.buf.shift();
  if (POTG.pend && t >= POTG.pend.until) { POTG.best = { score: POTG.pend.score, kills: POTG.pend.kills, heads: POTG.pend.heads, frames: POTG.buf.filter(f => f.t >= POTG.pend.from), dead: POTG.pend.dead.slice() }; POTG.pend = null; }
}
// a kill of yours (victim object, head, distance)
function potgKill(e, head, dist) {
  if (POTG.play || !inMatch() || M.mode === 'range') return;
  const t = M.t; POTG.kills.push({ t, head, dist, key: e ? potgKey(e.entry || e) : 0 });
  POTG.kills = POTG.kills.filter(k => k.t > t - 6);
  const ks = POTG.kills, score = ks.length * 10 + ks.filter(k => k.head).length * 3 + ks.filter(k => k.dist > 30).length * 3;
  const cur = POTG.pend || POTG.best;
  if (ks.length >= 2 && (!cur || score > cur.score)) {
    POTG.pend = { score, kills: ks.length, heads: ks.filter(k => k.head).length, from: Math.max(ks[0].t - 3.5, t - 9), until: t + 1.5, dead: ks.map(k => [k.key, k.t]) };
  } else if (POTG.pend && score >= POTG.pend.score) { POTG.pend.until = t + 1.5; POTG.pend.dead = ks.map(k => [k.key, k.t]); POTG.pend.score = score; POTG.pend.kills = ks.length; }
}
const potgName = n => ['', 'KILL', 'DOUBLE KILL', 'TRIPLE KILL', 'QUAD FEED', 'FIVE-PIECE', 'SIX PACK'][Math.min(n, 6)] || n + ' KILLS';
function potgWanted() { if (POTG.pend) { const p = POTG.pend; POTG.best = { score: p.score, kills: p.kills, heads: p.heads, frames: POTG.buf.filter(f => f.t >= p.from), dead: p.dead.slice() }; POTG.pend = null; } return !!(POTG.best && POTG.best.frames.length > 10 && S.potg !== false); }
// play it, then done()
function potgPlay(done) {
  const B = POTG.best; if (!B) { done(); return; }
  const ghosts = new Map(), hidden = [];
  for (const e of enemies) if (e.group && e.group.visible) { e.group.visible = false; hidden.push(e.group); }
  for (const d of (typeof dying !== 'undefined' ? dying : [])) if (d.e && d.e.group && d.e.group.visible) { d.e.group.visible = false; hidden.push(d.e.group); }
  const ov = document.createElement('div'); ov.id = 'potgOv';
  ov.innerHTML = `<div class="po-tag"><b>PLAY OF THE GAME</b><span>${(M.me && M.me.name === 'YOU' ? (NET.nick || 'YOU') : 'YOU').toUpperCase()} · ${potgName(B.kills)}${B.heads ? ` · ${B.heads} HEADSHOT${B.heads > 1 ? 'S' : ''}` : ''}</span></div><div class="po-skip">CLICK OR PRESS ANY KEY TO SKIP</div>`;
  document.body.appendChild(ov);
  const t0 = B.frames[0].t, t1 = B.frames[B.frames.length - 1].t, dead = new Map(B.dead);
  POTG.play = { t: 0, len: t1 - t0, t0, frames: B.frames, ghosts, hidden, ov, done, dead, fi: 0, prevFov: camera.fov };
  const skip = () => potgStop(); POTG.play.skip = skip;
  setTimeout(() => { addEventListener('keydown', skip, { once: true }); addEventListener('mousedown', skip, { once: true }); }, 400);
  try { sfx.streak(); } catch (e) {}
}
function potgGhost(id, type) {
  const g = POTG.play.ghosts; if (g.has(id)) return g.get(id);
  const rig = cloneSoldier(type || 'rifleman'); rig.root.rotation.order = 'YXZ'; scene.add(rig.root);
  const o = { rig, aim: 0.9, phase: Math.random() * 6, phase0: 0, holding: true, crouchK: 0, last: null, fallT: -1 }; g.set(id, o); return o;
}
function potgFrame(dt) {
  const Pl = POTG.play; if (!Pl) return false;
  Pl.t += dt; const T = Pl.t0 + Pl.t, F = Pl.frames;
  while (Pl.fi < F.length - 2 && F[Pl.fi + 1].t <= T) { Pl.fi++; const f = F[Pl.fi]; if (f.sh) potgFlash(f); }
  const a = F[Pl.fi], b = F[Math.min(Pl.fi + 1, F.length - 1)], k = b.t > a.t ? clamp((T - a.t) / (b.t - a.t), 0, 1) : 0;
  const lerpA = (x, y) => { let d = y - x; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return x + d * k; };
  camera.position.set(lerp(a.p[0], b.p[0], k), lerp(a.p[1], b.p[1], k) + lerp(a.p[5], b.p[5], k), lerp(a.p[2], b.p[2], k));
  camera.rotation.set(lerp(a.p[4], b.p[4], k), lerpA(a.p[3], b.p[3]), 0);
  const fov = lerp(baseFov, (WEAPONS[a.cur] ? adsFovFor(WEAPONS[a.cur], baseFov) : baseFov), lerp(a.ads, b.ads, k)); if (Math.abs(camera.fov - fov) > 0.05) { camera.fov = fov; camera.updateProjectionMatrix(); }
  const seen = new Set();
  for (const ea of a.e) {
    const id = ea[0], eb = b.e.find(q => q[0] === id) || ea, o = potgGhost(id, ea[5]); seen.add(id);
    const x = lerp(ea[1], eb[1], k), y = lerp(ea[2], eb[2], k), z = lerp(ea[3], eb[3], k);
    const sp = o.last ? Math.hypot(x - o.last[0], z - o.last[1]) / Math.max(dt, 1e-3) : 0; o.last = [x, z];
    const dk = Pl.dead.get(id);
    if (dk !== undefined && T >= dk) { if (o.fallT < 0) o.fallT = 0; o.fallT += dt; const f = Math.min(1, o.fallT / 0.5); o.rig.root.rotation.x = -f * 1.45; o.rig.root.position.set(x, y + 0.1 - f * 0.1, z); o.rig.root.rotation.y = lerpA(ea[4], eb[4]); continue; }
    o.rig.root.visible = true; o.rig.root.position.set(x, y, z); o.rig.root.rotation.set(0, lerpA(ea[4], eb[4]), 0); o.crouchK = ea[8];
    try { animEnemy(o, dt, Math.min(6, sp)); } catch (err) {}
  }
  for (const [id, o] of Pl.ghosts) if (!seen.has(id) && !(Pl.dead.get(id) !== undefined && T >= Pl.dead.get(id))) o.rig.root.visible = false;
  if (Pl.t >= Pl.len + 0.6) potgStop();
  return true;
}
function potgFlash(f) {
  try {
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion), from = camera.position.clone().addScaledVector(dir, 0.6);
    from.y -= 0.12; addTracer(from, from.clone().addScaledVector(dir, 60), 0.05, 0.018);
    const u = gunObjs[G.cur] && gunObjs[G.cur].userData; if (u && u.flash) { u.flash.visible = true; G.flashT = 0.05; }
    sfx.shot ? sfx.shot() : 0;
  } catch (e) {}
}
function potgStop() {
  const Pl = POTG.play; if (!Pl) return; POTG.play = null;
  removeEventListener('keydown', Pl.skip); removeEventListener('mousedown', Pl.skip);
  for (const [, o] of Pl.ghosts) scene.remove(o.rig.root);
  for (const g of Pl.hidden) g.visible = true;
  Pl.ov.remove(); camera.fov = Pl.prevFov || baseFov; camera.updateProjectionMatrix();
  POTG.best = null;
  try { Pl.done(); } catch (e) { reportError(e); }
}
(() => { const s = document.createElement('style'); s.textContent = `#potgOv{position:fixed;inset:0;z-index:30;pointer-events:none}
#potgOv::before,#potgOv::after{content:"";position:absolute;left:0;right:0;height:8vh;background:#000}#potgOv::before{top:0}#potgOv::after{bottom:0}
#potgOv .po-tag{position:absolute;left:4vw;bottom:12vh;padding:10px 18px;background:linear-gradient(90deg,rgba(0,0,0,.75),rgba(0,0,0,0));border-left:4px solid #7fd16b}
#potgOv .po-tag b{display:block;font-size:13px;letter-spacing:.4em;color:#9ef07a}#potgOv .po-tag span{display:block;font-size:30px;font-weight:800;letter-spacing:.1em;color:#fff;text-shadow:0 2px 6px #000}
#potgOv .po-skip{position:absolute;right:3vw;bottom:9vh;font-size:11px;letter-spacing:.2em;color:rgba(255,255,255,.6)}`; document.head.appendChild(s); })();
