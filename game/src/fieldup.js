/* ================================================================== FIELD UPGRADES (1.2.84)
   One ability per class that charges over time (faster with kills). Pick it in CREATE A CLASS (the FIELD button by the
   class tabs); use it with T (D-PAD RIGHT on a controller) when the meter is full.
     COVER        - a steel shield in front of you (stops bullets, bots can't see through it), 25 s or until shot apart.
     AMMO CRATE   - refills your ammo and grenades, and your teammates' who come by, for 20 s.
     DEAD SILENCE - 12 s of silent footsteps: bots don't hear you walk or shoot.
     RUSH         - 6 s of 40% more speed.
   Online, your COVER shows up for everyone (fc in presence) and stops their bullets too. Not in zombies or the campaign. */
const FU_TYPES = {
  cover: { n: 'COVER', cd: 55, d: 'a steel shield in front of you for 25 s' },
  ammo: { n: 'AMMO CRATE', cd: 60, d: 'refills ammo and grenades for you and your team' },
  silence: { n: 'DEAD SILENCE', cd: 40, d: '12 s of silent footsteps and shots (bots don\'t hear you)' },
  rush: { n: 'RUSH', cd: 35, d: '6 s of 40% more speed' },
};
const FU_ORDER = ['cover', 'ammo', 'silence', 'rush'];
const FU = { charge: 0, held: false, silenceT: 0, rushT: 0, ammo: null, cover: null, seq: 0, remote: new Map(), kills: 0 };
const fuType = () => { const c = typeof activeClass === 'function' ? activeClass() : null; return c && FU_TYPES[c.fu] ? c.fu : 'cover'; };
const fuOn = () => !!(M && inMatch() && M.mode !== 'zomb' && M.mode !== 'camp' && M.mode !== 'range' && !M.oic);
function fuReset() { FU.charge = 0.3; FU.silenceT = FU.rushT = 0; fuCoverGone(); if (FU.ammo && FU.ammo.g.parent) FU.ammo.g.parent.remove(FU.ammo.g); FU.ammo = null; FU.kills = G.kills; for (const [, o] of FU.remote) { brkBreak(o, false, true); delete BRK.list[o.id]; } FU.remote.clear(); }
function fuUse() {
  if (!fuOn() || !playerAlive() || FU.charge < 1 || G.downed) return;
  const t = fuType(), fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw); FU.charge = 0;
  if (t === 'cover') {
    fuCoverGone(); const x = P.x + fx * 1.6, z = P.z + fz * 1.6, along = Math.abs(fx) < Math.abs(fz);
    FU.cover = brkMake(4000 + (++FU.seq), 'shield', x, z, along ? 1.7 : 0.18, along ? 0.18 : 1.7); FU.cover.until = NOW + 25; FU.cover.fy = P.y;
    if (P.y > 0.05) { FU.cover.g.position.y = P.y; FU.cover.hit.position.y += P.y; FU.cover.hit.updateMatrixWorld(true); FU.cover.box.bot += P.y; FU.cover.box.top += P.y; }
  } else if (t === 'ammo') {
    const g = new THREE.Group(), m = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.45, 0.5), MAT.pickup || MAT.wood); m.position.y = 0.22; g.add(m);
    const l = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.06, 0.52), new THREE.MeshBasicMaterial({ color: 0x8aff6a })); l.position.y = 0.46; g.add(l);
    g.position.set(P.x + fx * 1.1, P.y, P.z + fz * 1.1); scene.add(g); FU.ammo = { g, until: NOW + 20, x: g.position.x, z: g.position.z, used: new Set() }; fuRefill();
  } else if (t === 'silence') FU.silenceT = 12;
  else if (t === 'rush') FU.rushT = 6;
  try { showBanner(FU_TYPES[t].n, FU_TYPES[t].d); sfx.streak(); } catch (e) {}
}
function fuRefill() { for (const w of WEAPONS) if (w.def) { w.ammo = w.mag || w.ammo; w.reserve = (w.mag || 30) * 4; } G.grenades = Math.max(G.grenades | 0, 2); try { sfx.pickup(); } catch (e) {} }
function fuCoverGone() { if (FU.cover) { brkBreak(FU.cover, false, !FU.cover.broken); delete BRK.list[FU.cover.id]; FU.cover = null; } }
// every frame of a match
function fuTick(dt) {
  if (!fuOn()) return;
  const t = fuType(), cd = FU_TYPES[t].cd;
  if (playerAlive()) { FU.charge = Math.min(1, FU.charge + dt / cd); if (G.kills > FU.kills) { FU.charge = Math.min(1, FU.charge + 0.1 * (G.kills - FU.kills)); } }
  FU.kills = G.kills;
  const k = kb('field') || (pad.on && pad.field); if (k && !FU.held) fuUse(); FU.held = k;
  if (FU.silenceT > 0) FU.silenceT -= dt; if (FU.rushT > 0) FU.rushT -= dt;
  if (FU.cover && (FU.cover.broken || NOW > FU.cover.until)) fuCoverGone();
  if (FU.ammo) { const A = FU.ammo; if (NOW > A.until) { if (A.g.parent) A.g.parent.remove(A.g); FU.ammo = null; } else { A.g.rotation.y += dt; for (const e of enemies) if (isFriend(e) && !A.used.has(e) && Math.hypot(e.group.position.x - A.x, e.group.position.z - A.z) < 2) { A.used.add(e); e.mag = e.magSize; e.nades = 2; } if (playerAlive() && Math.hypot(P.x - A.x, P.z - A.z) < 1.6 && !A.used.has('me')) { A.used.add('me'); fuRefill(); } } }
  const el = $('fuHud'); if (el) { const pc = Math.floor(FU.charge * 100), ready = FU.charge >= 1; const txt = `${actName('field')} · ${FU_TYPES[t].n}${ready ? ' · READY' : ` ${pc}%`}`; if (el._t !== txt) { el._t = txt; el.textContent = txt; el.classList.toggle('ready', ready); } el.style.display = playerAlive() ? '' : 'none'; }
}
const fuSilent = () => FU.silenceT > 0;
const fuSpeed = () => FU.rushT > 0 ? 1.4 : 1;
// online: my cover for everyone else
function fuPack() { const c = FU.cover; return c && !c.broken ? [FU.seq, Math.round(c.x * 10) / 10, Math.round(c.z * 10) / 10, c.w > c.d ? 1 : 0, Math.round((c.fy || 0) * 10) / 10] : undefined; }
function fuRemote(R, a) {
  const key = R.peer || (R.entry && R.entry.name), cur = FU.remote.get(key);
  if (!Array.isArray(a)) { if (cur) { brkBreak(cur, false, true); delete BRK.list[cur.id]; FU.remote.delete(key); } return; }
  if (cur && cur.seq === (a[0] | 0)) return;
  if (cur) { brkBreak(cur, false, true); delete BRK.list[cur.id]; }
  const x = netNum(a[1], -ARENA, ARENA), z = netNum(a[2], -ARENA, ARENA), along = !!a[3], o = brkMake(6000 + ((++FU.seq) % 900), 'shield', x, z, along ? 1.7 : 0.18, along ? 0.18 : 1.7); o.seq = a[0] | 0; FU.remote.set(key, o);
}
// the FIELD button by the class tabs: cycles this class's field upgrade
function fuCycle() { const c = activeClass(), i = FU_ORDER.indexOf(c.fu || 'cover'); c.fu = FU_ORDER[(i + 1) % FU_ORDER.length]; saveClasses(); try { sfx.ui(); renderLoadout(); } catch (e) {} }
document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-fub]'); if (b) fuCycle(); });
(() => {
  BRK_KINDS.shield = { w: 1.7, d: 0.18, h: 1.15, hp: 450, mat: 'steel' };
  const d = document.createElement('div'); d.id = 'fuHud'; ($('hud') || document.body).appendChild(d);
  const s = document.createElement('style'); s.textContent = '#fuHud{position:absolute;left:28px;bottom:104px;font-size:11px;letter-spacing:.16em;color:rgba(255,255,255,.65);text-shadow:0 0 4px #000;pointer-events:none}#fuHud.ready{color:#8aff6a}'; document.head.appendChild(s);
})();
