// sound pass: acoustics per map, wall muffling, 3D panners, new sounds play without errors, at() is cheap
module.exports = async p => p.evaluate(async () => {
  const A = window.__A, out = {};
  A.ZL.net = 'solo'; A.openZLobby(); A.zombAct('z-start'); A.G.noRender = true; A.G.health = 1e9;
  const ctx = A.actx; out.ctx = ctx ? ctx.state : 'none'; out.chain = !!(A.AUD.revIn && A.AUD.mfilt && A.AUD.conv && A.AUD.conv.buffer);
  out.hosp = { wet: +A.AUD.revIn.gain.value.toFixed(2), amb: A.AUD.prof && A.AUD.prof.amb, irSec: A.AUD.conv.buffer ? +A.AUD.conv.buffer.duration.toFixed(1) : 0 };
  // listener in the lobby: a sound in the lobby is clear, one behind the barricade / walls is muffled, one upstairs too
  Object.assign(A.P, { x: 4, z: 28, y: 0 }); const L = A.listener; L.x = 4; L.z = 28; L.fy = 0; L.y = 1.7; L.yaw = 0;
  const at = A.atFn; out.clear = at(-3, 30, 18).occ; out.behindWall = at(-25, 12, 18).occ; out.upstairs = at(4, 28, 18, 4.2).occ; out.far = +at(-25, -25, 18).vol.toFixed(3);
  let t = performance.now(); for (let i = 0; i < 2000; i++) at(Math.random() * 80 - 40, Math.random() * 60 - 30, 18); out.atMs = +((performance.now() - t) / 2000).toFixed(3);
  // play everything once
  const sfx = window.__A.sfx; let errs = [];
  for (const [name, fn] of Object.entries({ groan: () => sfx.zgroan(at(5, 20, 16), false), screech: () => sfx.zscreech(at(5, 20, 14)), gurgle: () => sfx.zgurgle(at(5, 20, 14)), impact: () => sfx.impact(at(2, 18, 9), true), flesh: () => sfx.flesh(), explodeNear: () => sfx.explode(at(1, 22, 30)), step: () => sfx.step(1), estep: () => sfx.estep(at(4, 22, 12)), enemy: () => sfx.enemy(at(-25, 12, 70)) })) { try { fn(); } catch (e) { errs.push(name + ': ' + e.message); } }
  out.errors = errs; out.deaf = +A.AUD.deafT.toFixed(2);
  // another map: outdoor acoustics
  A.toMenu(); A.startMatch('surv', { map: 'ridgeline' }); await new Promise(r => setTimeout(r, 500));
  out.ridge = { wet: +A.AUD.revIn.gain.value.toFixed(2), amb: A.AUD.prof && A.AUD.prof.amb };
  return out;
});
