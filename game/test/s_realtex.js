// scanned textures: served from test/fx by run.js; check they are swapped in on the menu and the menu still renders
module.exports = async p => {
  await p.waitForFunction(() => window.__A.REALTEX.applied, null, { timeout: 30000 }).catch(() => {});
  const r = await p.evaluate(() => { const { REALTEX, MAT, TEX } = window.__A; return { applied: REALTEX.applied, count: REALTEX.count, failed: REALTEX.failed,
    brickNormal: !!MAT.brick.normalMap, groundRough: !!MAT.ground.roughnessMap, rockNormal: !!MAT.rock.normalMap, img: TEX.brick.map.image.tagName }; });
  await p.waitForTimeout(1500);
  await p.evaluate(() => { const A = window.__A; A.toMenu && 0; });
  await p.screenshot({ path: '/tmp/claude-0/-home-claude-repo/76b91ff3-b9dc-56c9-b928-d09104c2074f/scratchpad/realtex_menu.png' });
  return r;
};
