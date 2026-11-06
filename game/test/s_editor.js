// the MAP EDITOR: draw, share code round trip, play it with bots
module.exports = async p => {
  const r = {}, SH = process.env.SHOTS || '/tmp';
  await p.evaluate(() => { for (const o of document.querySelectorAll('.onb-ov,#hcSplash')) o.remove(); const A = window.__A; A.edOpen(); const E = A.ED_GET(); E.map = { name: 'TEST YARD', size: 48, look: 'dusk', A: { x: 0, z: 20 }, B: { x: 0, z: -20 }, P: { x: 0, z: 0 }, items: [] };
    const I = E.map.items; for (const s of [-1, 1]) { I.push({ t: 'wall', x0: -10, z0: s * 8, x1: -2, z1: s * 8 }); I.push({ t: 'wall', x0: 2, z0: s * 8, x1: 10, z1: s * 8 }); I.push({ t: 'tall', x: s * 14, z: 0 }); I.push({ t: 'low', x: s * 5, z: s * 12, r: false }); I.push({ t: 'crate', x: s * 18, z: s * 14 }); }
    I.push({ t: 'ramp', x: 0, z: -2 }); I.push({ t: 'wall', x0: -16, z0: -4, x1: -16, z1: 4 }); A.edRender ? 0 : 0; document.getElementById('edOv').remove(); A.edOpen(); });
  await p.waitForTimeout(500); await p.screenshot({ path: SH + '/editor.png' });
  r.code = await p.evaluate(() => { const A = window.__A, m = A.ED_GET().map, c = A.edCode(m), back = A.edUncode(c); return { len: c.length, items: back.items.length, same: back.items.length === m.items.length && back.look === m.look && back.name === m.name, bad: A.edUncode('DZM1-garbage') }; });
  await p.evaluate(() => { const A = window.__A; A.G.noRender = false; A.ED_GET().mode = 'tdm'; A.edPlay(); }); await p.waitForTimeout(6000);
  await p.evaluate(() => { const A = window.__A; A.G.holdT = 0.01; A.G.loadT = 0; }); await p.waitForTimeout(4000);
  r.play = await p.evaluate(() => { const A = window.__A; const pos = A.enemies.map(e => [e.group.position.x, e.group.position.z]); return { map: A.curMap, name: A.MAPS.edit_map.name, mode: A.M.mode, bots: A.enemies.length, boxes: A.boxes.length, inside: pos.every(([x, z]) => Math.abs(x) < 25 && Math.abs(z) < 25) }; });
  await p.waitForTimeout(4000);
  r.moved = await p.evaluate(() => window.__A.enemies.filter(e => Math.hypot(e.group.position.x, e.group.position.z - (e.team === window.__A.M.myTeam ? 20 : -20)) > 3).length);
  await p.evaluate(() => { const A = window.__A; A.G.state = 'paused'; A.camera.position.set(0, 14, 24); A.camera.lookAt(0, 0, 0); document.getElementById('hud').classList.add('hide'); for (const s of document.querySelectorAll('.screen')) s.classList.add('hide'); });
  await p.waitForTimeout(1500); await p.screenshot({ path: SH + '/editor_play.png' });
  return r;
};
