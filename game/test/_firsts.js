// FIRST-TIME HITCHES: after a map loads, do each common thing once and list the shaders that had to be compiled for it
module.exports = async p => {
  await p.evaluate(() => { for (const o of document.querySelectorAll('.onb-ov,#hcSplash,.app-notes')) o.remove(); });
  return p.evaluate(async () => { const A = window.__A, Q = window.STQ || 'ultra', wait = ms => new Promise(r => setTimeout(r, ms)); A.applyPreset(Q); A.S.quality = Q; A.renderer.setSize(480, 270, false);
    A.startGame(); A.G.breakT = 1e9; A.G.health = 1e9; const info = A.renderer.info, out = [];
    const sim = n => { A.G.noRender = true; for (let i = 0; i < n; i++) { A.G.state = A.G.state === 'paused' ? 'playing' : A.G.state; A.tickL(1 / 60); } A.G.noRender = false; };
    const frames = n => { for (let i = 0; i < n; i++) { A.G.state = A.G.state === 'paused' ? 'playing' : A.G.state; A.tickL(1 / 60); A.renderFrame(); } };
    frames(10); let seen = new Set(info.programs || []);
    const step = async (name, fn) => { const t0 = performance.now(); try { await fn(); } catch (e) { out.push(name + ' ERR ' + e.message); return; } frames(3); const nw = (info.programs || []).filter(q => !seen.has(q)); const msg = nw.length ? 1 : 0; for (const q of info.programs || []) seen.add(q); if (nw.length) out.push(`${name}: ${nw.length} new shader(s): ${nw.map(q => { const k = String(q.cacheKey).split(','); let best = '', bd = 1e9; for (const o of seen) { if (o === q || o.name !== q.name) continue; const k2 = String(o.cacheKey).split(','); const d = []; for (let i = 0; i < Math.max(k.length, k2.length); i++) if (k[i] !== k2[i]) d.push(i + ':' + k2[i] + '>' + k[i]); if (d.length < bd) { bd = d.length; best = d.slice(0, 8).join(' '); } } return q.name + ' {' + best + '}'; }).join(', ')}`); };
    const near = () => { const e = A.enemies.find(e => e.entry && e.alive !== false); if (e) { e.group.position.set(A.P.x + 3 * Math.sin(A.P.yaw + Math.PI), A.P.y || 0, A.P.z + 3 * Math.cos(A.P.yaw + Math.PI)); e.group.visible = true; } return e; };
    await step('enemy up close', () => { near(); });
    await step('shoot', () => { A.G.fireT = 0; A.shoot(false); });
    await step('kill an enemy', () => { const e = near(); if (e) A.damageEnemy(e, 9999, 'head'); });
    await step('reload', () => { A.startReload(); });
    await step('melee', () => { A.melee(); });
    for (const k of Object.keys(A.EQUIP).slice(0, 14)) await step('throw ' + k, () => { A.equipClass({ p: 'marc', s: 'sidearm', e: k, k: 'none' }); A.G.nades = 3; A.throwGrenade(); sim(150); frames(2); });
    await step('get hit', () => { A.hurtPlayer(10, { x: A.P.x + 5, z: A.P.z }); });
    await step('aim down sights', () => { A.G.ads = 1; frames(4); A.G.ads = 0; });
    await step('swap weapon', () => { A.switchWeapon(1); frames(4); A.switchWeapon(0); });
    await step('streak', () => { try { A.stkAdd(2000); A.stkUse(); } catch (e) {} sim(60); frames(2); });
    await step('die + respawn', () => { A.G.health = 1; A.hurtPlayer(50, null); sim(60); frames(2); A.respawnPlayer(); A.G.health = 1e9; });
    return { quality: Q, programs: (info.programs || []).length, firsts: out };
  });
};
