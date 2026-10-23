/* ================================================================== BAGGED UP (kill confirmed) and TURF WAR (domination)
   BAGGED UP: every soldier drops their stash bag where they die. Grab an enemy bag to score for your team (BAGGED),
   grab one of your own team's to stop the enemy scoring it (STASH SAVED). Bags go after 30 s.
   TURF WAR: three grow spots, A, B and C. Stand in one to take it over (faster with more of you, stopped while the
   other team is in it too); every spot your team holds earns a point every 2.5 s.
   Offline the game runs both; online the host does and sends the state to everyone ('k' / 'd' in netObjPack). */
const KC_LIFE = 30, KC_R = 1.35, DOM_R = 3.6, DOM_CAP = 7, DOM_TICK = 2.5;

/* ---------- shared */
function m2Setup() {
  if (M.kc) for (const t of M.kc.tags) if (t.g && t.g.parent) t.g.parent.remove(t.g);
  if (M.dom && M.dom.group && M.dom.group.parent) M.dom.group.parent.remove(M.dom.group);
  M.kc = null; M.dom = null;
  if ((M.mode === 'kc' || M.mode === 'dom') && !OBJ.group) { OBJ.group = new THREE.Group(); scene.add(OBJ.group); }
  if (M.mode === 'kc') M.kc = { tags: [], seq: 0, ev: [], evSeq: 0, seen: -1 };
  if (M.mode === 'dom') domSetup();
}
// who an actor is in the online state ('' offline)
function m2Id(who) { if (!M.online) return ''; return who === 'player' ? NET.me : who && who.net ? who.net : who && who.entry && who.entry.botLabel ? who.entry.botLabel : ''; }
function m2Actors() {
  const a = []; if (playerAlive()) a.push({ who: 'player', team: M.myTeam, x: P.x, y: P.y || 0, z: P.z, en: M.me, r: 0 });
  for (const e of enemies) if (e.entry && e.entry.alive !== false) a.push({ who: e, team: e.team, x: e.group.position.x, y: e.group.position.y, z: e.group.position.z, en: e.entry, r: e.net ? 0.3 : 0 });
  return a;
}
// bots: about half go for the objective (more for the 'obj' role), the rest keep hunting
function m2Goal(e, keep, near, set) {
  const ex = e.group.position.x, ez = e.group.position.z;
  if (M.mode === 'kc' && M.kc && M.kc.tags.length) {
    let best = null, bd = 1e9; for (const t of M.kc.tags) { const d = Math.hypot(t.x - ex, t.z - ez); if (d < bd) { bd = d; best = t; } }
    if (best && (bd < 14 || (e.role === 'obj' && bd < 40 && Math.random() < 0.7))) return set({ x: best.x, z: best.z, y: best.y }, 1.5);
  }
  if (M.mode === 'dom' && M.dom) {
    const pts = M.dom.pts, mine = pts.filter(p => p.own === e.team).length;
    // closest spot we do not own; anchors (obj role) also guard what we have when we hold two
    const want = pts.filter(p => p.own !== e.team).sort((a, b) => Math.hypot(a.x - ex, a.z - ez) - Math.hypot(b.x - ex, b.z - ez));
    const go = e.role === 'obj' || Math.random() < 0.55;
    if (want.length && go) { const p = e.domPick && want.includes(e.domPick) && M.t < e.domT ? e.domPick : (e.domPick = want[Math.random() < 0.75 ? 0 : Math.min(1, want.length - 1)], e.domT = M.t + rnd(10, 20), e.domPick); return keep && Math.hypot(e.goal.x - p.x, e.goal.z - p.z) < 3.5 ? e.goal : set(near(p, 2.5), 2.5); }
    if (mine >= 2 && e.role === 'obj') { const p = pts.filter(q => q.own === e.team)[e.entry.kills % mine]; return keep && Math.hypot(e.goal.x - p.x, e.goal.z - p.z) < 6 ? e.goal : set(near(p, 4), rnd(4, 7)); }
  }
  return null;
}
function m2Update(dt) { if (M.mode === 'kc' && M.kc) kcUpdate(dt); if (M.mode === 'dom' && M.dom) domUpdate(dt); }
function m2Pack() {
  const ts = M.teamScore || [0, 0];
  if (M.mode === 'kc' && M.kc) { const k = M.kc; return ['k', ts[0], ts[1], k.tags.length, ...k.tags.flatMap(t => [t.id, t.team, r2(t.x), r2(t.z), r2(t.y)]), ...k.ev.flatMap(v => v)]; }
  if (M.mode === 'dom' && M.dom) return ['d', ts[0], ts[1], ...M.dom.pts.flatMap(p => [p.own, p.capT, Math.round(p.prog * 100), p.status])];
}
function m2Apply(o) {
  if (o[0] === 'k' && M.kc) kcApply(o);
  if (o[0] === 'd' && M.dom) domApply(o);
}
function m2HudInfo() {
  if (M.mode === 'kc' && M.kc) { const near = M.kc.tags.filter(t => Math.hypot(t.x - P.x, t.z - P.z) < 25), e = near.filter(t => t.team !== M.myTeam).length, f = near.length - e; return `${e} ENEMY BAG${e === 1 ? '' : 'S'} NEARBY${f ? ` · ${f} OF YOUR TEAM'S TO SAVE` : ''}`; }
  if (M.mode === 'dom' && M.dom) return M.dom.pts.map(p => { const c = p.own === -1 ? '#ddd' : TEAM_COL[p.own === M.myTeam ? 0 : 1]; return `<span class="dom-l" style="--c:${c}${p.status ? ';--b:#ffd24a' : ''}">${p.n}</span>`; }).join('') + ` ${domHeld(M.myTeam)} HELD`;
  return '';
}
function m2Markers(out) {
  if (M.mode === 'kc' && M.kc) for (const t of M.kc.tags) { if (Math.hypot(t.x - P.x, t.z - P.z) > 30) continue; out.push({ x: t.x, y: t.y + 1.1, z: t.z, t: t.team === M.myTeam ? 'SAVE' : 'BAG', c: TEAM_COL[t.team === M.myTeam ? 0 : 1] }); }
  if (M.mode === 'dom' && M.dom) for (const p of M.dom.pts) out.push({ x: p.x, y: p.y + 2.6, z: p.z, t: p.n, c: p.status ? '#ffd24a' : p.own === -1 ? '#ffffff' : TEAM_COL[p.own === M.myTeam ? 0 : 1] });
}

/* ---------- BAGGED UP */
function kcIcon(mine) {
  const key = mine ? 'm' : 'e'; kcIcon.c = kcIcon.c || {}; if (kcIcon.c[key]) return kcIcon.c[key];
  const col = TEAM_COL[mine ? 0 : 1], c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
  const glow = g.createRadialGradient(128, 120, 10, 128, 120, 124); glow.addColorStop(0, col + '99'); glow.addColorStop(0.55, col + '22'); glow.addColorStop(1, col + '00'); g.fillStyle = glow; g.fillRect(0, 0, 256, 256);
  g.save(); g.translate(128, 118); g.lineJoin = 'round';
  // the zip bag: clear plastic with a coloured zip strip, buds inside
  g.fillStyle = 'rgba(235,245,240,.55)'; g.strokeStyle = '#111'; g.lineWidth = 7; g.beginPath(); g.moveTo(-50, -56); g.lineTo(50, -56); g.lineTo(54, 58); g.quadraticCurveTo(0, 70, -54, 58); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = col; g.fillRect(-50, -56, 100, 14); g.strokeRect(-50, -56, 100, 14);
  g.fillStyle = '#3f8a2a'; g.strokeStyle = '#173d10'; g.lineWidth = 4;
  for (const [x, y, r] of [[-22, 22, 20], [16, 30, 22], [-4, -6, 18], [26, -2, 14], [-30, -10, 12]]) { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.stroke(); g.fillStyle = '#c98b3a'; for (let i = 0; i < 4; i++) g.fillRect(x + rnd(-r, r) * 0.5, y + rnd(-r, r) * 0.5, 3, 3); g.fillStyle = '#3f8a2a'; }
  g.restore();
  const txt = mine ? 'SAVE IT' : 'BAG IT';
  g.font = 'bold 34px sans-serif'; g.textAlign = 'center'; g.lineWidth = 7; g.strokeStyle = '#000'; g.strokeText(txt, 128, 236); g.fillStyle = '#fff'; g.fillText(txt, 128, 236);
  const tex = new THREE.CanvasTexture(c); tex.encoding = THREE.sRGBEncoding; return (kcIcon.c[key] = tex);
}
function kcMesh(t) {
  const mine = t.team === M.myTeam, col = new THREE.Color(TEAM_COL[mine ? 0 : 1]), g = new THREE.Group();
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: kcIcon(mine), transparent: true, depthWrite: false })); sp.scale.set(0.95, 0.95, 1); sp.position.y = 0.75; g.add(sp);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.03, 8, 32), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.85 })); ring.rotation.x = Math.PI / 2; ring.position.y = 0.05; g.add(ring);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.45, 3.5, 12, 1, true), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide })); beam.position.y = 1.75; g.add(beam);
  g.position.set(t.x, t.y, t.z); (OBJ.group || scene).add(g); t.g = g; t.sp = sp; t.ring = ring; t.beam = beam; t.mine = mine;
}
// a death: the host (or the offline game) drops a bag
function kcDrop(x, y, z, team) {
  if (!M.kc || !netHostNow() || M.over) return;
  const t = { id: ++M.kc.seq, team, x, z, y: groundAt(x, z, y + 0.4), born: NOW };
  M.kc.tags.push(t); kcMesh(t);
}
function kcRemove(t) { if (t.g && t.g.parent) t.g.parent.remove(t.g); const i = M.kc.tags.indexOf(t); if (i >= 0) M.kc.tags.splice(i, 1); }
function kcVisual(dt) {
  for (const t of M.kc.tags) {
    if (!t.g) kcMesh(t);
    if (t.mine !== (t.team === M.myTeam)) { if (t.g.parent) t.g.parent.remove(t.g); kcMesh(t); }   // teams were picked after it dropped
    const age = NOW - t.born; t.sp.position.y = 0.75 + Math.sin(NOW * 3 + t.id) * 0.1; t.ring.rotation.z += dt * 2; t.beam.material.opacity = 0.08 + Math.sin(NOW * 4 + t.id) * 0.04;
    t.g.visible = age < KC_LIFE - 6 || Math.sin(age * 16) > 0;
  }
}
function kcUpdate(dt) {
  const k = M.kc;
  if (!netHostNow()) { netObjApply(); kcVisual(dt); return; }
  for (const t of k.tags.slice()) if (NOW - t.born > KC_LIFE) kcRemove(t);
  const acts = m2Actors();
  for (const t of k.tags.slice()) for (const a of acts) {
    if (Math.hypot(a.x - t.x, a.z - t.z) > KC_R + a.r || Math.abs(a.y - t.y) > 1.8) continue;
    const conf = a.team !== t.team;
    if (conf) { M.teamScore[a.team]++; a.en.score += 100; a.en.obj++; } else a.en.score += 50;
    if (a.who === 'player') kcMine(conf);
    k.ev.push([++k.evSeq, m2Id(a.who), conf ? 1 : 0]); if (k.ev.length > 6) k.ev.shift();
    kcRemove(t); checkScoreLimit(); break;
  }
  kcVisual(dt);
}
function kcMine(conf) {
  MS.bags = (MS.bags || 0) + (conf ? 1 : 0); MS.saves = (MS.saves || 0) + (conf ? 0 : 1);
  if (conf) { G.score += 100; popScore('+100', '', 'BAGGED'); } else { G.score += 50; popScore('+50', '', 'STASH SAVED'); }
  try { sfx.pickup(); tone(conf ? 990 : 660, 0.1, 0.07, 'triangle'); } catch (e) {}
}
function kcApply(o) {
  const k = M.kc; M.teamScore = [+o[1] | 0, +o[2] | 0];
  const n = o[3] | 0, ids = new Set();
  for (let i = 0; i < n; i++) {
    const b = 4 + i * 5, id = o[b] | 0; ids.add(id);
    if (!k.tags.find(t => t.id === id)) { const t = { id, team: o[b + 1] | 0, x: netNum(o[b + 2], -ARENA, ARENA), z: netNum(o[b + 3], -ARENA, ARENA), y: netNum(o[b + 4], -5, 30), born: NOW }; k.tags.push(t); kcMesh(t); }
  }
  for (const t of k.tags.slice()) if (!ids.has(t.id)) kcRemove(t);
  const ev = o.slice(4 + n * 5);
  for (let i = 0; i + 2 < ev.length; i += 3) {
    const s = ev[i] | 0; if (s <= k.seen) continue;
    if (k.seen >= 0 && ev[i + 1] === NET.me) kcMine(!!ev[i + 2]);
    k.seen = Math.max(k.seen, s);
  }
  if (k.seen < 0) k.seen = 0;
}

/* ---------- TURF WAR */
// A near your base, C near theirs, B the middle; from the map's hardpoints when it has three, else along the line between the flags
function domSpots() {
  const L = LAYOUT, f0 = L.flags[0], f1 = L.flags[1];
  const pick = (x, z, y) => { const o = y !== undefined ? { x, z, y } : Object.assign({ y: 0 }, openNear(x, z)); return o; };
  if (!f0 || !f1) return [pick(-20, 0), pick(0, 0), pick(20, 0)];
  // candidates: the map's hardpoints plus points along the line between the bases; pick the triple that is most spread
  // out, with A on our side, C on theirs and B as near the middle as possible
  const c = (L.hp || []).map(p => ({ x: p.x, z: p.z, y: p.y || 0 })).concat([0.22, 0.5, 0.78].map(k => pick(f0.x + (f1.x - f0.x) * k, f0.z + (f1.z - f0.z) * k)));
  const d = (p, q) => Math.hypot(p.x - q.x, p.z - q.z);
  let best = null, bs = -1e9;
  for (const A of c) for (const B of c) for (const C of c) {
    if (A === B || B === C || A === C || d(A, f0) >= d(A, f1) || d(C, f1) >= d(C, f0)) continue;
    const sc = Math.min(Math.min(d(A, B), d(B, C), d(A, C)), 26) - 0.6 * Math.abs(d(B, f0) - d(B, f1)) - 0.15 * (d(A, f0) + d(C, f1)) - (c.indexOf(A) >= (L.hp || []).length ? 3 : 0) - (c.indexOf(C) >= (L.hp || []).length ? 3 : 0);
    if (sc > bs) { bs = sc; best = [A, B, C]; }
  }
  if (best) return best;
  return [pick(-20, 0), pick(0, 0), pick(20, 0)];
}
function domSetup() {
  const spots = domSpots(), group = new THREE.Group(); (OBJ.group || scene).add(group);
  M.dom = { group, acc: 0, pts: spots.map((s, i) => ({ n: 'ABC'[i], x: s.x, y: s.y || 0, z: s.z, own: -1, capT: -1, prog: 0, status: 0, cnt: [0, 0] })) };
  for (const p of M.dom.pts) domMesh(p);
}
function domLetter(n) {
  domLetter.c = domLetter.c || {}; if (domLetter.c[n]) return domLetter.c[n];
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  g.font = 'bold 96px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 10; g.strokeStyle = '#000'; g.strokeText(n, 64, 68); g.fillStyle = '#fff'; g.fillText(n, 64, 68);
  const t = new THREE.CanvasTexture(c); return (domLetter.c[n] = t);
}
// a grow spot: a big potted plant under a purple grow lamp, a ring on the floor that fills as it is taken
function domMesh(p) {
  const g = new THREE.Group(); g.position.set(p.x, p.y, p.z);
  const std = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: new THREE.Color(c), roughness: 0.8 }, o || {}));
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.32, 0.6, 14), std(0x2a2a2a)); pot.position.y = 0.3; g.add(pot);
  const soil = new THREE.Mesh(new THREE.CylinderGeometry(0.39, 0.39, 0.04, 14), std(0x3a2a1a)); soil.position.y = 0.58; g.add(soil);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 1.3, 6), std(0x4c7a2a)); stem.position.y = 1.2; g.add(stem);
  const leafM = std(0x3f8f2c, { side: THREE.DoubleSide, emissive: new THREE.Color(0x0c2a08) });
  const leafG = new THREE.PlaneGeometry(0.09, 0.42); leafG.translate(0, 0.21, 0);
  for (let tier = 0; tier < 5; tier++) for (let i = 0; i < 3; i++) {   // fan leaves: seven fingers per leaf, five tiers up the stem
    const fan = new THREE.Group(); fan.position.y = 0.75 + tier * 0.24; fan.rotation.y = tier * 1.1 + (i % 2) * Math.PI;
    for (let f = -3; f <= 3; f++) { const l = new THREE.Mesh(leafG, leafM); l.rotation.z = f * 0.38; l.scale.setScalar((1 - Math.abs(f) * 0.17) * (1.25 - tier * 0.15)); fan.add(l); }
    fan.rotation.x = -0.9; const arm = new THREE.Group(); arm.rotation.y = i * (TAU / 3); arm.add(fan); fan.position.z = 0.05; g.add(arm);
  }
  const bud = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.35, 8), std(0x6a9a3a, { emissive: new THREE.Color(0x1a2a0a) })); bud.position.y = 1.95; g.add(bud);
  // the lamp: two poles and a glowing purple panel
  const metal = std(0x777777, { metalness: 0.7, roughness: 0.35 });
  for (const s of [-1, 1]) { const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.7, 6), metal); pole.position.set(s * 0.75, 1.35, 0); g.add(pole); }
  const bar = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.05, 0.05), metal); bar.position.y = 2.7; g.add(bar);
  const lamp = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.08, 0.6), new THREE.MeshBasicMaterial({ color: 0xc070ff })); lamp.position.y = 2.6; g.add(lamp);
  const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 1.5, 2.4, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0xb060ff, transparent: true, opacity: 0.08, depthWrite: false, side: THREE.DoubleSide })); cone.position.y = 1.35; g.add(cone);
  const ring = new THREE.Mesh(new THREE.RingGeometry(DOM_R - 0.18, DOM_R, 56), objMat('#ffffff', 0.5)); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.04; g.add(ring);
  const fill = new THREE.Mesh(new THREE.RingGeometry(DOM_R - 0.6, DOM_R - 0.22, 56, 1, 0, 0.001), objMat('#ffffff', 0.45)); fill.rotation.x = -Math.PI / 2; fill.position.y = 0.05; g.add(fill);
  const let_ = new THREE.Sprite(new THREE.SpriteMaterial({ map: domLetter(p.n), transparent: true, depthWrite: false })); let_.scale.set(0.8, 0.8, 1); let_.position.y = 3.3; g.add(let_);
  M.dom.group.add(g); Object.assign(p, { g, ring, fill, lamp, cone, fillK: -1 });
}
const domHeld = team => M.dom ? M.dom.pts.filter(p => p.own === team).length : 0;
function domVisual(dt) {
  for (const p of M.dom.pts) {
    if (!p.g) continue;
    const col = p.status ? '#ffd24a' : p.own === -1 ? '#ffffff' : TEAM_COL[p.own === M.myTeam ? 0 : 1];
    p.ring.material.color.set(col); p.ring.material.opacity = 0.4 + Math.sin(NOW * 4) * 0.12;
    const k = Math.round(p.prog * 50) / 50, fc = p.capT === -1 ? '#ffffff' : TEAM_COL[p.capT === M.myTeam ? 0 : 1];
    if (k !== p.fillK) { p.fillK = k; p.fill.geometry.dispose(); p.fill.geometry = new THREE.RingGeometry(DOM_R - 0.6, DOM_R - 0.22, 56, 1, Math.PI / 2, Math.max(0.001, k * TAU)); }
    p.fill.material.color.set(p.own !== -1 && p.prog >= 1 ? col : fc);
    p.lamp.material.color.set(p.own === -1 ? '#c070ff' : TEAM_COL[p.own === M.myTeam ? 0 : 1]); p.cone.material.color.copy(p.lamp.material.color);
  }
}
function domUpdate(dt) {
  const D = M.dom;
  if (!netHostNow()) { netObjApply(); domVisual(dt); domMyCapture(); return; }
  const acts = m2Actors();
  for (const p of D.pts) {
    const cnt = [0, 0], who = [[], []];
    for (const a of acts) if (a.team >= 0 && a.team < 2 && Math.hypot(a.x - p.x, a.z - p.z) < DOM_R && Math.abs(a.y - p.y) < 2.5) { cnt[a.team]++; who[a.team].push(a); }
    p.cnt = cnt; p.status = cnt[0] && cnt[1] ? 1 : 0;
    const t = cnt[0] && !cnt[1] ? 0 : cnt[1] && !cnt[0] ? 1 : -1;
    if (t < 0) { if (!p.status) { if (p.own === -1) { p.prog = Math.max(0, p.prog - dt / 20); if (!p.prog) p.capT = -1; } else if (p.prog < 1 && p.capT === p.own) p.prog = Math.min(1, p.prog + dt / 20); } continue; }
    const rate = Math.min(2, 1 + 0.5 * (cnt[t] - 1)) / DOM_CAP;
    if (p.own === t) { p.capT = t; p.prog = Math.min(1, p.prog + rate * dt); continue; }
    if (p.capT !== t && p.prog > 0) {   // taking down the other team's (or their half-done) claim first
      p.prog -= rate * dt;
      if (p.prog <= 0) { p.prog = 0; if (p.own !== -1) { const was = p.own; p.own = -1; showMsg(was === M.myTeam ? `WE LOST ${p.n}` : `${p.n} NEUTRALISED`); } p.capT = t; }
      continue;
    }
    p.capT = t; p.prog += rate * dt;
    if (p.prog >= 1) {
      p.prog = 1; p.own = t;
      for (const a of who[t]) { a.en.score += 150; a.en.obj++; if (a.who === 'player') domMine(p); }
      showBanner(t === M.myTeam ? `${p.n} IS OURS` : `ENEMY TOOK ${p.n}`, `${domHeld(M.myTeam)} of 3 grow spots held`); try { t === M.myTeam ? sfx.streak() : sfx.ui(); } catch (e) {}
      for (const e of enemies) if (e.domPick === p) e.domT = 0;
    }
  }
  D.acc += dt;
  if (D.acc >= DOM_TICK) { D.acc -= DOM_TICK; for (let t = 0; t < 2; t++) M.teamScore[t] += domHeld(t); checkScoreLimit(); }
  domVisual(dt);
}
function domMine(p) { MS.caps = (MS.caps || 0) + 1; G.score += 150; popScore('+150', 'big', `${p.n} SECURED`); }
// online, not the host: a spot your team just took while you stood in it
function domMyCapture() {
  for (const p of M.dom.pts) {
    if (p._own !== p.own) { const was = p._own; p._own = p.own; if (was === undefined) continue;
      if (p.own === M.myTeam && playerAlive() && Math.hypot(P.x - p.x, P.z - p.z) < DOM_R) domMine(p);
      if (p.own !== -1) showBanner(p.own === M.myTeam ? `${p.n} IS OURS` : `ENEMY TOOK ${p.n}`, `${domHeld(M.myTeam)} of 3 grow spots held`);
      else showMsg(was === M.myTeam ? `WE LOST ${p.n}` : `${p.n} NEUTRALISED`); }
  }
}
function domApply(o) {
  M.teamScore = [+o[1] | 0, +o[2] | 0];
  M.dom.pts.forEach((p, i) => { const b = 3 + i * 4; p.own = o[b] === 0 || o[b] === 1 ? o[b] : -1; p.capT = o[b + 1] === 0 || o[b + 1] === 1 ? o[b + 1] : -1; p.prog = clamp((+o[b + 2] || 0) / 100, 0, 1); p.status = o[b + 3] ? 1 : 0; });
}
(() => { const s = document.createElement('style'); s.textContent = '.dom-l{display:inline-block;min-width:1.5em;text-align:center;margin-right:4px;padding:0 4px;border:2px solid var(--b,var(--c));background:color-mix(in srgb,var(--c) 35%,transparent);color:#fff;font-weight:700;border-radius:3px}'; document.head.appendChild(s); })();
