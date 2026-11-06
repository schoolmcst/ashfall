/* ================================================================== TACTICAL GEAR (1.2.84)
   Three more picks for the equipment slot in CREATE A CLASS:
     DECOY          - lands and fakes gunfire for 8 s: enemy bots hear it and go to look.
     MOTION SENSOR  - lands and pings every 2 s for 15 s: enemies within 12 m show on your minimap and screen.
     TROPHY SYSTEM  - lands and stands for 20 s: shoots down up to 3 enemy grenades that come within 6 m.
   Your own grenades never set them off. */
const TAC = { decoys: [], sensors: [], trophies: [] };
const TAC_KINDS = { decoy: 1, sensor: 1, trophy: 1 };
(() => {
  Object.assign(EQUIP, {
    decoy: { name: 'DECOY', desc: 'Fakes gunfire for 8 s where it lands. Enemy bots hear it and go to look.', count: 2, max: 3, fuse: 1.2, color: 0x5a5a3a, glow: 0xffb03a },
    sensor: { name: 'MOTION SENSOR', desc: 'Pings for 15 s: enemies within 12 m of it show on your minimap and screen.', count: 2, max: 3, fuse: 0.9, sticky: true, color: 0x3a4a5a, glow: 0x3ab8ff },
    trophy: { name: 'TROPHY SYSTEM', desc: 'Stands for 20 s and shoots down up to 3 enemy grenades within 6 m.', count: 1, max: 2, fuse: 0.8, color: 0x4a4a4a, glow: 0xff4a3a },
  });
})();
function tacMesh(col, glow, h) {
  const g = new THREE.Group(), b = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, h, 10), new THREE.MeshStandardMaterial({ color: col, roughness: 0.5, metalness: 0.5 })); b.position.y = h / 2; g.add(b);
  const l = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), new THREE.MeshBasicMaterial({ color: glow })); l.position.y = h + 0.03; g.add(l); g.userData.light = l; return g;
}
// detonate() hands these over instead of exploding
function tacDetonate(g) {
  const p = g.m.position.clone(), y = groundAt(p.x, p.z, p.y + 0.3), mine = !g.by || g.by === 'player';
  if (g.kind === 'decoy') { const m = tacMesh(0x5a5a3a, 0xffb03a, 0.18); m.position.set(p.x, y, p.z); scene.add(m); TAC.decoys.push({ m, x: p.x, z: p.z, t: 8, next: 0, team: mine ? M.myTeam : g.by.team }); }
  if (g.kind === 'sensor') { const m = tacMesh(0x3a4a5a, 0x3ab8ff, 0.22); m.position.set(p.x, p.y > y + 0.3 ? p.y : y, p.z); scene.add(m); TAC.sensors.push({ m, x: p.x, z: p.z, t: 15, ping: 0, mine }); }
  if (g.kind === 'trophy') { const m = tacMesh(0x4a4a4a, 0xff4a3a, 0.45); m.position.set(p.x, y, p.z); scene.add(m); TAC.trophies.push({ m, x: p.x, y: y + 0.5, z: p.z, t: 20, charges: 3, mine }); }
}
function tacTick(dt) {
  if (!TAC.decoys.length && !TAC.sensors.length && !TAC.trophies.length) return;
  for (let i = TAC.decoys.length - 1; i >= 0; i--) {
    const d = TAC.decoys[i]; d.t -= dt; d.next -= dt;
    if (d.next <= 0) { d.next = 0.09 + Math.random() * (Math.random() < 0.2 ? 0.8 : 0.18); try { sfx.enemy(at(d.x, d.z, 22)); d.m.userData.light.visible = !d.m.userData.light.visible; } catch (e) {} try { if (typeof botsHear === 'function') botsHear(d.x, d.z, d.team, 45, null); } catch (e) {} }
    if (d.t <= 0) { scene.remove(d.m); TAC.decoys.splice(i, 1); }
  }
  for (let i = TAC.sensors.length - 1; i >= 0; i--) {
    const s = TAC.sensors[i]; s.t -= dt; s.ping -= dt;
    if (s.ping <= 0) { s.ping = 2; try { sfx.ui(); } catch (e) {} s.m.userData.light.scale.setScalar(2.5); } else s.m.userData.light.scale.setScalar(Math.max(1, s.m.userData.light.scale.x - dt * 4));
    if (s.t <= 0) { scene.remove(s.m); TAC.sensors.splice(i, 1); }
  }
  for (let i = TAC.trophies.length - 1; i >= 0; i--) {
    const t = TAC.trophies[i]; t.t -= dt; t.m.rotation.y += dt * 2;
    for (let j = grenadesInFlight.length - 1; j >= 0 && t.charges > 0; j--) {
      const g = grenadesInFlight[j]; const enemyNade = g.by && g.by !== 'player' && !isFriend(g.by); if (!enemyNade) continue;
      const q = g.m.position; if (Math.hypot(q.x - t.x, q.y - t.y, q.z - t.z) > 6) continue;
      t.charges--; try { if (t.mine) achAdd('trophies'); addTracer(new THREE.Vector3(t.x, t.y + 0.1, t.z), q.clone(), 0.08, 0.02); puff(q.x, q.y, q.z, { color: 0x666666, size: 0.4, grow: 0.8, life: 0.5, vy: 0.3, op: 0.6 }); sfx.impact(at(q.x, q.z, 14), true); } catch (e) {}
      scene.remove(g.m); grenadesInFlight.splice(j, 1);
    }
    if (t.t <= 0 || t.charges <= 0) { scene.remove(t.m); TAC.trophies.splice(i, 1); }
  }
}
// an enemy near one of my motion sensors shows like a UAV would show it
const tacSensed = e => TAC.sensors.length > 0 && !isFriend(e) && TAC.sensors.some(s => s.mine && Math.hypot(e.group.position.x - s.x, e.group.position.z - s.z) < 12);
function tacClear() { for (const k of ['decoys', 'sensors', 'trophies']) { for (const o of TAC[k]) scene.remove(o.m); TAC[k] = []; } }
