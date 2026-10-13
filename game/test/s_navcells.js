module.exports = async p => p.evaluate(id => {
  const A = window.__A; A.loadMap(id);
  const [x0, x1, z0, z1, gx, gz, gy] = JSON.parse(window.NCS || '[30,37,20,27,34,18,1.5]');
  const f = A.flowField(gx, gz, gy), rows = [];
  for (let z = z0; z <= z1; z++) { let r = 'z' + z + ': '; for (let x = x0; x <= x1; x++) { const c = Math.floor((z + 44) * 2) * A.NN + Math.floor((x + 44) * 2); const ls = []; for (let l = 0; l < A.lvN[c]; l++) ls.push(A.lvH[c * A.NL + l].toFixed(2) + (A.lvS[c * A.NL + l] ? 's' + A.lvS[c * A.NL + l] : '') + ':' + (f ? f[c * A.NL + l] : '?')); r += (ls.join('|') || '----').padEnd(16); } rows.push(r); }
  return rows;
}, process.env.MAP || 'town');
