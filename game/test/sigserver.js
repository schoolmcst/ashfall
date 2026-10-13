// minimal stand-in for the public PeerJS signalling server (same message protocol), for tests
const http = require('http'), crypto = require('crypto');
module.exports = function start(port) {
  const clients = new Map();   // id -> socket
  const srv = http.createServer((q, r) => { r.writeHead(404); r.end(); });
  srv.on('upgrade', (req, sock) => {
    const key = req.headers['sec-websocket-key'], acc = crypto.createHash('sha1').update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
    sock.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${acc}\r\n\r\n`);
    const u = new URL(req.url, 'http://x'), id = u.searchParams.get('id');
    const send = obj => { const p = Buffer.from(JSON.stringify(obj)); let h; if (p.length < 126) h = Buffer.from([0x81, p.length]); else if (p.length < 65536) { h = Buffer.alloc(4); h[0] = 0x81; h[1] = 126; h.writeUInt16BE(p.length, 2); } else { h = Buffer.alloc(10); h[0] = 0x81; h[1] = 127; h.writeBigUInt64BE(BigInt(p.length), 2); } try { sock.write(Buffer.concat([h, p])); } catch (e) {} };
    if (clients.has(id)) { send({ type: 'ID-TAKEN', payload: { msg: 'taken' } }); setTimeout(() => sock.destroy(), 50); return; }
    clients.set(id, { sock, send }); send({ type: 'OPEN' });
    let buf = Buffer.alloc(0);
    sock.on('data', d => {
      buf = Buffer.concat([buf, d]);
      while (buf.length >= 2) {
        const op = buf[0] & 15; let len = buf[1] & 127, off = 2;
        if (len === 126) { if (buf.length < 4) return; len = buf.readUInt16BE(2); off = 4; } else if (len === 127) { if (buf.length < 10) return; len = Number(buf.readBigUInt64BE(2)); off = 10; }
        const masked = buf[1] & 128; if (buf.length < off + (masked ? 4 : 0) + len) return;
        let p = buf.slice(off + (masked ? 4 : 0), off + (masked ? 4 : 0) + len);
        if (masked) { const m = buf.slice(off, off + 4); p = Buffer.from(p.map((b, i) => b ^ m[i % 4])); }
        buf = buf.slice(off + (masked ? 4 : 0) + len);
        if (op === 8) { sock.destroy(); return; }
        if (op !== 1) continue;
        let msg; try { msg = JSON.parse(p.toString()); } catch (e) { continue; }
        if (msg.type === 'HEARTBEAT') continue;
        // be as strict as the real public server: exact payload shapes, or the socket is dropped
        const SHAPES = { OFFER: ['sdp', 'type', 'connectionId', 'label', 'reliable', 'serialization'], ANSWER: ['sdp', 'type', 'connectionId'], CANDIDATE: ['candidate', 'type', 'connectionId'] };
        const want = SHAPES[msg.type], pl = msg.payload || {};
        if (want && (Object.keys(pl).some(k => !want.includes(k)) || !pl.connectionId || pl.type !== 'data' || (msg.type !== 'CANDIDATE' && (!pl.sdp || pl.sdp.type !== msg.type.toLowerCase())))) { sock.end(); continue; }
        const dst = clients.get(msg.dst);
        if (dst) dst.send({ type: msg.type, src: id, dst: msg.dst, payload: msg.payload });
        else if (msg.type === 'OFFER') send({ type: 'EXPIRE', src: msg.dst, dst: id });
      }
    });
    const bye = () => { if (clients.get(id) && clients.get(id).sock === sock) clients.delete(id); };
    sock.on('close', bye); sock.on('error', bye);
  });
  return new Promise(r => srv.listen(port, () => r(srv)));
};
