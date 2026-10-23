/* ================================================================== weapon inspect by class, and finishing moves
   INSPECT (F / D-pad down) now depends on the gun: pistols get a spin, shotguns a pump and a look down the tube,
   snipers and marksman rifles a look down the scope, SMGs a quick flip, rifles and LMGs turn over and check the mag.
   FINISHERS: melee someone from behind (or anyone you catch unaware within reach) for a takedown: your view swings in,
   the gun thrusts, they go down hard, +100. Three themed names. You can't be hurt for the second it takes. */
// [vx, vy, vz, rx, ry, rz] offsets for inspect progress ip (0..1)
function inspectPose(cat, ip, u) {
  const sm = smooth, A = sm(0, 0.22, ip) * (1 - sm(0.42, 0.55, ip)), B = sm(0.45, 0.6, ip) * (1 - sm(0.82, 1, ip)), all = sm(0, 0.12, ip) * (1 - sm(0.86, 1, ip));
  if (cat === 'pi') { const spin = sm(0.25, 0.6, ip) * TAU; return [-all * 0.05, all * 0.06, all * 0.04, all * 0.15, A * 0.6 - B * 0.4, spin]; }
  if (cat === 'sg') { const pump = Math.sin(sm(0.5, 0.8, ip) * Math.PI * 2) * all; return [-A * 0.06, A * 0.07 + all * 0.02, pump * 0.06, A * 0.35 + B * 0.1, A * 0.5, A * 0.8 - B * 0.2]; }
  if (cat === 'sr' || cat === 'mr') return [-all * 0.11, all * 0.08, all * 0.08 + B * 0.04, all * 0.12 - B * 0.2, A * 0.25, A * 0.15 + B * 0.55];
  if (cat === 'smg') { const f = Math.sin(sm(0.1, 0.9, ip) * Math.PI * 2); return [-all * 0.05, all * 0.05, all * 0.04, all * 0.1, f * 0.7, f * 0.6]; }
  // rifles, LMGs, launchers: turn it over, then drop the mag a little and look at it
  if (u && u.mag && u.magBase && cat !== 'la') { const m = sm(0.6, 0.7, ip) * (1 - sm(0.8, 0.9, ip)); u.mag.position.y = u.magBase.y - m * 0.05; }
  return [-A * 0.07 + B * 0.03, A * 0.05 + B * 0.04, (A + B) * 0.05, B * 0.3 + A * 0.08, A * 0.95 - B * 0.55, A * 0.55 - B * 0.35];
}
const FIN_NAMES = ['ROLLED UP', 'PUFF PUFF PASS OUT', 'SMOKED'];
// melee hit `e` from where you stand: a finisher when you are behind them (or they are not looking at you)
function finCheck(e) {
  if (!e || !e.group || e.dog || e.boss || G.finT > 0) return false;
  const p = e.group.position, fx = Math.sin(e.group.rotation.y), fz = Math.cos(e.group.rotation.y), dx = P.x - p.x, dz = P.z - p.z, d = Math.hypot(dx, dz) || 1;
  const behind = (fx * dx + fz * dz) / d < -0.35, unaware = e.entry && !e.net && !e.tgt;
  return behind || (unaware && Math.random() < 0.5);
}
function finStart(e) {
  G.finT = 1.3; G.finE = e; G.finName = FIN_NAMES[(Math.random() * FIN_NAMES.length) | 0]; G.finYaw = Math.atan2(-(e.group.position.x - P.x), -(e.group.position.z - P.z));
  G.spawnProt = Math.max(G.spawnProt || 0, 1.3); G.fireT = Math.max(G.fireT, 1.3);
  if (e.entry && !e.net) { e.stunT = Math.max(e.stunT || 0, 1.5); e.cd = Math.max(e.cd || 0, 1.5); }
  try { burst(0.25, 900, 0.3, 'lowpass'); } catch (err) {}
}
function finTick(dt) {
  if (!(G.finT > 0)) return;
  const e = G.finE, before = G.finT; G.finT = Math.max(0, G.finT - dt);
  // turn to face them and lean in
  let dy = G.finYaw - P.yaw; while (dy > Math.PI) dy -= TAU; while (dy < -Math.PI) dy += TAU; P.yaw += dy * Math.min(1, dt * 10); P.pitch += (-0.12 - P.pitch) * Math.min(1, dt * 8);
  P.vx = P.vz = 0; G.shake = Math.max(G.shake, 0.004);
  if (before > 0.7 && G.finT <= 0.7 && e) {   // the hit lands
    if (enemies.includes(e)) {
      const dir = new THREE.Vector3(e.group.position.x - P.x, 0.25, e.group.position.z - P.z).normalize();
      e.finisher = true; damageEnemy(e, 999, false, dir, false, 'player');
      try { sfx.thud({ vol: 1 }); sfx.kill(false); } catch (err) {}
      G.shake = Math.max(G.shake, 0.03); rumble(0.7, 0.7, 200);
      G.score += 100; if (M && M.me && inMatch()) M.me.score += 100; popScore('+100', 'big', 'FINISHER · ' + G.finName);
      MS.finishers = (MS.finishers || 0) + 1;
    }
  }
  if (G.finT <= 0) G.finE = null;
}
