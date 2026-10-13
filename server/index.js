// ASHFALL match server: introduces players to each other (same message protocol as the public PeerJS server, which
// the game used before), and reports how many people are online. Players still play directly with each other; this
// server only passes along the few small messages needed to connect, so a free hosting plan is plenty.
// No dependencies: plain Node (http + a minimal WebSocket implementation). Start: node server/index.js
const http = require('http'), crypto = require('crypto');
const PORT = process.env.PORT || 10000;
const clients = new Map();          // id -> { send, sock, last }
const matches = new Map();          // slot id -> { players, mode, at } as reported by hosts
const started = Date.now();

const srv = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (u.pathname === '/stats') {
    const now = Date.now();
    for (const [k, m] of matches) if (now - m.at > 15000) matches.delete(k);
    const online = [...clients.keys()].filter(id => !id.startsWith('p')).length;   // 'p…' ids are status checks
    const players = [...matches.values()].reduce((n, m) => n + m.players, 0);
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ ok: true, online, matches: matches.size, inMatches: players, upMinutes: Math.round((now - started) / 60000) }));
  }
  res.setHeader('Content-Type', 'text/plain');
  res.end('ASHFALL match server is running.\n');
});

srv.on('upgrade', (req, sock) => {
  const key = req.headers['sec-websocket-key'];
  if (!key) return sock.destroy();
  const acc = crypto.createHash('sha1').update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
  sock.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${acc}\r\n\r\n`);
  sock.setNoDelay(true);
  const u = new URL(req.url, 'http://x'), id = String(u.searchParams.get('id') || '').slice(0, 80);
  const send = obj => {
    const p = Buffer.from(JSON.stringify(obj)); let h;
    if (p.length < 126) h = Buffer.from([0x81, p.length]);
    else if (p.length < 65536) { h = Buffer.alloc(4); h[0] = 0x81; h[1] = 126; h.writeUInt16BE(p.length, 2); }
    else { h = Buffer.alloc(10); h[0] = 0x81; h[1] = 127; h.writeBigUInt64BE(BigInt(p.length), 2); }
    try { sock.write(Buffer.concat([h, p])); } catch (e) {}
  };
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(id)) { send({ type: 'ERROR', payload: { msg: 'bad id' } }); return setTimeout(() => sock.destroy(), 50); }
  if (clients.has(id)) { send({ type: 'ID-TAKEN', payload: { msg: 'taken' } }); return setTimeout(() => sock.destroy(), 50); }
  const me = { send, sock, last: Date.now() }; clients.set(id, me); send({ type: 'OPEN' });
  let buf = Buffer.alloc(0);
  sock.on('data', d => {
    me.last = Date.now(); buf = Buffer.concat([buf, d]);
    if (buf.length > 1 << 20) return sock.destroy();
    while (buf.length >= 2) {
      const op = buf[0] & 15; let len = buf[1] & 127, off = 2;
      if (len === 126) { if (buf.length < 4) return; len = buf.readUInt16BE(2); off = 4; }
      else if (len === 127) { if (buf.length < 10) return; len = Number(buf.readBigUInt64BE(2)); off = 10; }
      const masked = buf[1] & 128, start = off + (masked ? 4 : 0); if (buf.length < start + len) return;
      let p = buf.slice(start, start + len);
      if (masked) { const m = buf.slice(off, off + 4); p = Buffer.from(p.map((b, i) => b ^ m[i % 4])); }
      buf = buf.slice(start + len);
      if (op === 8) return sock.destroy();
      if (op === 9) { try { sock.write(Buffer.concat([Buffer.from([0x8a, p.length]), p])); } catch (e) {} continue; }   // ping -> pong
      if (op !== 1) continue;
      let msg; try { msg = JSON.parse(p.toString()); } catch (e) { continue; }
      if (msg.type === 'HEARTBEAT') continue;
      if (msg.type === 'MATCH' && msg.payload) {   // hosts report their match so the lobby can show who is playing
        matches.set(id, { players: Math.max(0, Math.min(16, msg.payload.players | 0)), mode: String(msg.payload.mode || '').slice(0, 8), at: Date.now() });
        continue;
      }
      const dst = clients.get(String(msg.dst || ''));
      if (dst) dst.send({ type: msg.type, src: id, dst: msg.dst, payload: msg.payload });
      else if (msg.type === 'OFFER') send({ type: 'EXPIRE', src: msg.dst, dst: id });
    }
  });
  const bye = () => { if (clients.get(id) === me) { clients.delete(id); matches.delete(id); } };
  sock.on('close', bye); sock.on('error', bye);
});

// drop sockets that went silent (clients send a heartbeat every 5 s)
setInterval(() => { const now = Date.now(); for (const [id, c] of clients) if (now - c.last > 60000) { try { c.sock.destroy(); } catch (e) {} clients.delete(id); } }, 15000);
srv.listen(PORT, () => console.log('ASHFALL match server on port ' + PORT));
