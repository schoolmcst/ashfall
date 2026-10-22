// buy a door and a perk with a real E key press (not by calling the functions): node run.js s_zkeys.js
module.exports = async p => {
  const r = {};
  await p.evaluate(() => { const A = window.__A; A.ZL.net = 'solo'; A.openZLobby(); A.zombAct('z-start'); const s = document.getElementById('hcSplash'); if (s) s.remove(); A.G.health = 1e9; A.G.maxHp = 1e9; A.G.noRender = true; });
  await p.waitForTimeout(1500);
  const tryBuy = async (setup, check) => {
    await p.evaluate(setup); await p.waitForTimeout(800);
    const prompt = await p.evaluate(() => document.getElementById('zPrompt').textContent);
    await p.keyboard.down('KeyE'); await p.waitForTimeout(700); await p.keyboard.up('KeyE'); await p.waitForTimeout(700);
    return { prompt, result: await p.evaluate(check) };
  };
  r.door = await tryBuy(() => { const A = window.__A; A.G.points = 3000; A.G.state = 'playing'; Object.assign(A.P, { x: 0, z: 15.3, y: 0, yaw: 0 }); },
    () => { const A = window.__A; const o = A.ZD.list.find(o => o.d.name === 'MAIN CORRIDOR'); return { open: o.open, pts: A.G.points }; });
  r.perk = await tryBuy(() => { const A = window.__A; A.G.points = 3000; A.G.state = 'playing'; const m = A.ZP.machines[0], s = m.p.at; Object.assign(A.P, { x: s.x + 1.3, z: s.z + 0.3, y: 0, yaw: Math.PI / 2 }); },
    () => { const A = window.__A; return { have: [...A.ZP.have], pts: A.G.points, anim: !!A.ZP.anim }; });
  // sprint while the perk animation plays
  r.sprint = await p.evaluate(async () => { const A = window.__A; A.G.state = 'playing'; Object.assign(A.P, { x: 36, z: 12, y: 0, yaw: Math.PI / 2 }); return { anim: !!A.ZP.anim, z0: A.P.x, t0: A.G.time }; });
  await p.keyboard.down('ShiftLeft'); await p.keyboard.down('KeyW'); await p.waitForTimeout(1500);
  const after = await p.evaluate(() => ({ z: window.__A.P.x, t: window.__A.G.time, anim: !!window.__A.ZP.anim }));
  await p.keyboard.up('KeyW'); await p.keyboard.up('ShiftLeft');
  r.sprint.speed = +((r.sprint.z0 - after.z) / Math.max(0.01, after.t - r.sprint.t0)).toFixed(2); r.sprint.animAfter = after.anim;
  // voice lines: every character has every moment, and saying one puts up a subtitle
  r.voice = await p.evaluate(() => { const A = window.__A, need = ['spawn', 'round', 'roundEnd', 'door', 'box', 'upgrade', 'down', 'revived', 'reviving', 'streak', 'ammo', 'broke', 'bowl', 'joint', 'edible'];
    const missing = []; for (const c of A.ZCHARS) for (const m of need) if (!(A.ZLINES[c.id][m] || []).length) missing.push(c.id + ':' + m);
    A.zvSay('door'); return { chars: A.ZCHARS.map(c => c.full), lines: A.ZCHARS.map(c => Object.values(A.ZLINES[c.id]).reduce((n, l) => n + l.length, 0)), missing, sub: (document.getElementById('zSub') || {}).textContent }; });
  return r;
};
