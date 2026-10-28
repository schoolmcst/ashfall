module.exports = async p => {
  await p.evaluate(() => { const A = window.__A; A.ZL.net = 'solo'; A.ZL.map = 'maryjane'; A.openZLobby(); const s = document.getElementById('hcSplash'); if (s) s.remove(); A.zombAct('z-start'); A.G.health = A.G.maxHp = 1e9; });
  const r = [];
  await p.waitForTimeout(7000); await p.evaluate(() => { const A = window.__A; A.Z.toSpawn = 0; for (const e of A.enemies.slice()) if (e.zombie) { e.hp = 1; A.damageEnemy(e, 100, false, 'player'); } A.G.state = 'playing'; });
  for (let i = 0; i < 3; i++) { await p.waitForTimeout(1500); r.push(await p.evaluate(() => { const A = window.__A; return { fx: JSON.stringify(A.ZPU.fx), pu: (document.getElementById('zPu') || {}).textContent, mode: A.M.mode }; })); }
  return r;
};
