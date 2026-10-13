module.exports = async p => {
  await p.evaluate(() => window.__A.startGame());
  await p.waitForTimeout(3000);
  await p.screenshot({ path: '/home/claude/work/test/boot.png' });
  return await p.evaluate(() => ({ state: window.__A.G.state, fps: 0 }));
};
