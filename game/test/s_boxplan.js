// dump collision boxes and the bot nav reachability for a map: MAP=<id> node run.js s_boxplan.js  (writes <id>_boxes.json)
const fs = require('fs'), path = require('path');
module.exports = async p => {
  const id = process.env.MAP || 'blackwell', out = process.env.SHOTS || '/tmp';
  const r = await p.evaluate(id => {
    const A = window.__A; A.loadMap(id);
    const boxes = A.boxes.map(b => [+b.minx.toFixed(2), +b.maxx.toFixed(2), +b.minz.toFixed(2), +b.maxz.toFixed(2), +b.bot.toFixed(2), +b.top.toFixed(2), b.walk ? 1 : 0, b.stair ? 1 : 0]);
    return { boxes, play: A.MAPS[id].play, layout: A.LAYOUT };
  }, id);
  fs.writeFileSync(path.join(out, `${id}_boxes.json`), JSON.stringify(r));
  return { n: r.boxes.length };
};
