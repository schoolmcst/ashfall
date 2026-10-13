/* ================================================================== app multiplayer: player-hosted matches over WebRTC
   Used by the desktop app (no claude.ai). Players find each other through the free public PeerJS signalling server
   (only used to exchange connection details), then talk directly. One player hosts: everyone sends their state to the
   host, the host sends everyone's state back out ~20 times a second. The API mirrors the claude.ai `room` capability
   (peers / presence / join / leave), so net.js runs unchanged on top of it.
   Quick Play: fixed public match slots per mode; join the first open one, or host it. Private: a slot named by a code.
   If the host leaves, the next player in join order takes over the slot and everyone reconnects to them. */
const P2P = (() => {
  const SIG = 'wss://0.peerjs.com:443/peerjs?key=peerjs', MAXP = 16, SLOTS = 6;
  const STUN = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302', 'stun:global.stun.twilio.com:3478'] }];
  // relay for networks that block direct connections: the free Open Relay project's shared-secret TURN service
  const TURN_HOST = 'staticauth.openrelay.metered.ca', TURN_SECRET = 'openrelayprojectsecret';
  let turnCache = null;
  async function iceServers() {
    if (turnCache && turnCache.exp - Date.now() / 1000 > 3600) return turnCache.list;
    try {
      const exp = Math.floor(Date.now() / 1000) + 86400, username = exp + ':ashfall';
      const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(TURN_SECRET), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
      const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(username)));
      const credential = btoa(String.fromCharCode(...sig));
      const list = STUN.concat([{ urls: [`turn:${TURN_HOST}:80`, `turn:${TURN_HOST}:80?transport=tcp`, `turn:${TURN_HOST}:443`, `turns:${TURN_HOST}:443?transport=tcp`], username, credential }]);
      turnCache = { exp, list }; return list;
    } catch (e) { return STUN; }
  }
  const rid = (n = 10) => Array.from(crypto.getRandomValues(new Uint8Array(n)), b => 'abcdefghijkmnpqrstuvwxyz23456789'[b % 32]).join('');
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const VER = () => String((window.ASHFALL_APP && window.ASHFALL_APP.version) || 'dev').replace(/[^a-z0-9]/gi, '');

  // signalling socket registered under `id`; resolves when the server accepts the id
  function signal(id) {
    return new Promise((res, rej) => {
      let ws, done = false, hb = null; const hs = new Set();
      try { ws = new WebSocket(`${SIG}&id=${encodeURIComponent(id)}&token=${rid(8)}&version=1.5.4`); } catch (e) { return rej(new Error('fail')); }
      const to = setTimeout(() => { if (!done) { done = true; try { ws.close(); } catch (e) {} rej(new Error('timeout')); } }, 8000);
      const api = {
        id, send(dst, type, payload) { if (ws.readyState === 1) ws.send(JSON.stringify({ type, dst, payload })); },
        on(fn) { hs.add(fn); return () => hs.delete(fn); },
        close() { clearInterval(hb); try { ws.close(); } catch (e) {} }, get open() { return ws.readyState === 1; },
      };
      ws.onmessage = ev => {
        let m; try { m = JSON.parse(ev.data); } catch (e) { return; }
        if (!done) {
          if (m.type === 'OPEN') { done = true; clearTimeout(to); hb = setInterval(() => { if (ws.readyState === 1) ws.send('{"type":"HEARTBEAT"}'); }, 5000); res(api); return; }
          if (m.type === 'ID-TAKEN' || m.type === 'ERROR' || m.type === 'INVALID-KEY') { done = true; clearTimeout(to); try { ws.close(); } catch (e) {} rej(new Error(m.type === 'ID-TAKEN' ? 'taken' : 'fail')); return; }
        }
        for (const f of hs) try { f(m); } catch (e) {}
      };
      ws.onerror = () => { if (!done) { done = true; clearTimeout(to); rej(new Error('fail')); } };
      ws.onclose = () => { clearInterval(hb); for (const f of hs) try { f({ type: 'CLOSED' }); } catch (e) {} };
    });
  }

  // one WebRTC link: an unreliable channel for state, a reliable one for control messages
  function link(sig, dst, cid, offerer, onMsg, onState, ice, relayOnly) {
    const pc = new RTCPeerConnection({ iceServers: ice || STUN, iceTransportPolicy: relayOnly ? 'relay' : 'all' }), L = { pc, cid, dst, u: null, r: null, open: false, closed: false, last: performance.now() };
    const wire = ch => { ch.onmessage = ev => { L.last = performance.now(); let m; try { m = JSON.parse(ev.data); } catch (e) { return; } onMsg(L, m); }; ch.onopen = check; ch.onclose = () => L.close(); };
    const check = () => { if (!L.open && L.u && L.r && L.u.readyState === 'open' && L.r.readyState === 'open') { L.open = true; onState(L, 'open'); } };
    L.close = () => { if (L.closed) return; L.closed = true; L.open = false; try { pc.close(); } catch (e) {} onState(L, 'closed'); };
    L.send = (m, reliable) => { const ch = reliable ? L.r : L.u; if (ch && ch.readyState === 'open') try { ch.send(typeof m === 'string' ? m : JSON.stringify(m)); } catch (e) {} };
    pc.onicecandidate = ev => { if (ev.candidate) sig.send(dst, 'CANDIDATE', { candidate: ev.candidate.toJSON ? ev.candidate.toJSON() : ev.candidate, type: 'data', connectionId: cid }); };
    pc.onconnectionstatechange = () => { if (pc.connectionState === 'failed' || pc.connectionState === 'closed') L.close(); };
    pc.ondatachannel = ev => { if (ev.channel.label === 'u') L.u = ev.channel; else L.r = ev.channel; wire(ev.channel); };
    if (offerer) {
      L.u = pc.createDataChannel('u', { ordered: false, maxRetransmits: 0 }); L.r = pc.createDataChannel('r'); wire(L.u); wire(L.r);
      pc.createOffer().then(o => pc.setLocalDescription(o)).then(() => sig.send(dst, 'OFFER', { sdp: pc.localDescription.toJSON ? pc.localDescription.toJSON() : pc.localDescription, type: 'data', connectionId: cid, label: cid, reliable: false, serialization: 'binary' })).catch(() => L.close());
    }
    L.signal = async m => {
      try {
        if (m.type === 'OFFER') { await pc.setRemoteDescription(m.payload.sdp); const a = await pc.createAnswer(); await pc.setLocalDescription(a); sig.send(dst, 'ANSWER', { sdp: pc.localDescription.toJSON ? pc.localDescription.toJSON() : pc.localDescription, type: 'data', connectionId: cid }); }
        else if (m.type === 'ANSWER') await pc.setRemoteDescription(m.payload.sdp);
        else if (m.type === 'CANDIDATE' && m.payload.candidate) await pc.addIceCandidate(m.payload.candidate);
      } catch (e) {}
    };
    return L;
  }

  // ------------------------------------------------------------------ a match room
  function makeRoom(kind, mode, code) {
    const me = rid(10);   // my stable label (peers() key)
    const R = { me, mode, kind, code, host: false, slot: '', mine: {}, snap: new Map(), order: [], ls: new Set(), closed: false, sig: null, hostLink: null, links: new Map(), extras: () => [], status: 'connecting', players: 1 };
    const slotName = n => kind === 'quick' ? `ashfall-${VER()}-${mode}-q${n}` : kind === 'slot' ? code : `ashfall-${VER()}-${mode}-c-${code}`;

    R.peers = () => {
      const out = [{ peer: me, presence: R.mine, isMe: true, sameTab: true, kind: 'viewer', guest: false, by: null }];
      for (const [peer, presence] of R.snap) if (peer !== me) out.push({ peer, presence, isMe: false, sameTab: false, kind: 'viewer', guest: false, by: null });
      return out;
    };
    R.presence = patch => { for (const k in patch) { if (patch[k] === null) delete R.mine[k]; else R.mine[k] = patch[k]; } return Promise.resolve(); };
    R.onPeers = fn => { R.ls.add(fn); return () => R.ls.delete(fn); };
    R.connected = () => R.host || !!(R.hostLink && R.hostLink.open);

    // ---- as host: accept offers on the slot id, collect states, send everyone the room ~20 Hz
    function hostMsg(L, m) {
      if (m.t === 'p' && m.l && typeof m.p === 'object') { L.label = String(m.l).slice(0, 16); L.pres = m.p; if (!R.order.includes(L.label)) R.order.push(L.label); }
    }
    function hostState(L, st) {
      if (st === 'open') { const full = R.links.size > MAXP - 1; L.send({ t: 'w', full, n: R.links.size + 1 }, true); if (full) setTimeout(() => L.close(), 300); }
      if (st === 'closed') { R.links.delete(L.cid); if (L.label) R.order = R.order.filter(x => x !== L.label); }
    }
    async function becomeHost(slot) {
      const sig = await signal(slot);
      if (R.closed) { sig.close(); return; }
      R.sig = sig; R.slot = slot; R.host = true; R.status = 'hosting'; R.order = [me, ...R.order.filter(x => x !== me)];
      sig.on(m => {
        if (m.type === 'CLOSED') { if (!R.closed && R.host) reclaim(); return; }
        if (!m.src || !m.payload || !m.payload.connectionId) return;
        let L = R.links.get(m.payload.connectionId);
        if (!L && m.type === 'OFFER') { L = link(sig, m.src, m.payload.connectionId, false, hostMsg, hostState, R.ice); R.links.set(L.cid, L); }
        if (L) L.signal(m);
      });
      R.timer = setInterval(hostTick, 50);
    }
    async function reclaim() {   // lost the signalling socket: get the slot back so new players can still join
      for (let i = 0; i < 20 && !R.closed; i++) { await sleep(1500); try { const s = await signal(R.slot); R.sig = s; s.on(m => { if (m.type === 'CLOSED') { if (!R.closed) reclaim(); return; } if (!m.src || !m.payload || !m.payload.connectionId) return; let L = R.links.get(m.payload.connectionId); if (!L && m.type === 'OFFER') { L = link(s, m.src, m.payload.connectionId, false, hostMsg, hostState, R.ice); R.links.set(L.cid, L); } if (L) L.signal(m); }); return; } catch (e) {} }
    }
    function hostTick() {
      const now = performance.now(), all = [[me, R.mine]];
      for (const [, L] of R.links) { if (now - L.last > 6000) { L.close(); continue; } if (L.label && L.pres) all.push([L.label, L.pres]); }
      R.snap = new Map(all.filter(([p]) => p !== me)); R.players = 1 + [...R.links.values()].filter(L => L.open).length;
      for (const x of R.extras()) all.push(x);   // the host's bots go out to everyone, but the host itself runs them locally
      const msg = JSON.stringify({ t: 's', h: me, o: R.order, a: all });
      for (const [, L] of R.links) if (L.open) L.send(msg);
      for (const f of R.ls) try { f({}); } catch (e) {}
    }

    // ---- as a client: connect to the slot's host, send my state, take the room from the host
    function clientMsg(L, m) {
      if (m.t === 'w') { L.welcome = m; return; }
      if (m.t === 's' && Array.isArray(m.a)) {
        R.lastSnap = performance.now(); R.order = Array.isArray(m.o) ? m.o.slice(0, 32) : R.order; R.hostLabel = m.h;
        const mp = new Map(); for (const e of m.a) if (Array.isArray(e) && typeof e[0] === 'string' && e[1] && typeof e[1] === 'object') mp.set(e[0].slice(0, 24), e[1]);
        R.snap = mp; R.players = mp.size + (mp.has(me) ? 0 : 1);
        for (const f of R.ls) try { f({}); } catch (e) {}
      }
    }
    // resolves the open link, or false; R.hostSeen says whether someone is hosting that slot at all
    async function connectTo(slot, waitMs = 5000, relayOnly = false) {
      if (!R.sig || !R.sig.open) { if (R.sig) R.sig.close(); R.sig = await signal('a' + rid(14)); }
      const sig = R.sig, cid = 'dc_' + rid(10); R.hostSeen = false;
      return new Promise(res => {
        let fin = false, to = null; const end = ok => { if (fin) return; fin = true; clearTimeout(to); off(); res(ok); };
        const L = link(sig, slot, cid, true, clientMsg, (l, st) => {
          if (st === 'open') { const w0 = performance.now(); const wt = setInterval(() => { if (L.welcome) { clearInterval(wt); if (L.welcome.full) { R.full = true; L.close(); end(false); } else end(L); } else if (performance.now() - w0 > 3000) { clearInterval(wt); L.close(); end(false); } }, 50); }
          if (st === 'closed') { end(false); if (R.hostLink === L) hostLost(); }
        }, R.ice, relayOnly);
        const off = sig.on(m => {
          if (m.payload && m.payload.connectionId === cid) {
            if (m.type === 'ANSWER' && !R.hostSeen) { R.hostSeen = true; clearTimeout(to); to = setTimeout(() => { L.close(); end(false); }, 15000); R.status = 'connecting to the host'; }
            L.signal(m);
          }
          if ((m.type === 'EXPIRE' || m.type === 'LEAVE') && m.src === slot) { L.close(); end(false); }
        });
        to = setTimeout(() => { L.close(); end(false); }, waitMs);   // no answer at all: nobody is hosting this slot
      });
    }
    function startClient(L, slot) {
      R.hostLink = L; R.slot = slot; R.host = false; R.status = 'joined'; R.lastSnap = performance.now();
      R.timer = setInterval(() => {
        if (R.closed) return;
        if (R.hostLink && R.hostLink.open) R.hostLink.send({ t: 'p', l: me, p: R.mine });
        if (performance.now() - R.lastSnap > 4000 && !R.migrating) { try { R.hostLink && R.hostLink.close(); } catch (e) {} hostLost(); }
      }, 50);
    }
    async function hostLost() {
      if (R.closed || R.migrating || R.host) return;
      R.migrating = true; clearInterval(R.timer); R.status = 'host left: reconnecting';
      const old = R.hostLabel, line = R.order.filter(x => x !== old), next = line[0];
      try {
        if (next === me) { await sleep(800); await claimWithRetry(R.slot); }
        else {
          await sleep(1500);
          let L = false;
          for (let i = 0; i < 6 && !L && !R.closed; i++) { L = await connectTo(R.slot, 4000); if (!L && R.hostSeen) L = await connectTo(R.slot, 8000, true); if (!L) await sleep(700); }
          if (L) startClient(L, R.slot); else await claimWithRetry(R.slot);   // nobody took over: I will
        }
      } catch (e) { R.status = 'disconnected'; }
      R.migrating = false;
    }
    async function claimWithRetry(slot) {
      for (let i = 0; i < 8; i++) { try { await becomeHost(slot); return; } catch (e) { if (e.message !== 'taken') throw e; const L = await connectTo(slot, 4000) || (R.hostSeen ? await connectTo(slot, 8000, true) : false); if (L) { startClient(L, slot); return; } await sleep(1000); } }
      throw new Error('slot busy');
    }

    // ---- find or make the match
    R.start = async () => {
      R.ice = await iceServers();
      const tries = kind === 'quick' ? SLOTS : 1;
      for (let n = 1; n <= tries && !R.closed; n++) {
        const slot = slotName(n); R.full = false; R.status = 'looking for a match';
        let L = await connectTo(slot);
        if (!L && R.hostSeen && !R.full) { R.status = 'trying the relay'; L = await connectTo(slot, 8000, true); }   // blocked direct path: go through the relay
        if (L) { startClient(L, slot); return R; }
        if (R.full) continue;                                   // that match is full: try the next one
        if (R.hostSeen) throw new Error('could not reach the host of that match - check your firewall and try again');
        try { await becomeHost(slot); return R; }
        catch (e) {
          if (e.message !== 'taken') throw e;
          const L2 = await connectTo(slot, 6000) || (R.hostSeen ? await connectTo(slot, 8000, true) : false);   // someone claimed it a moment before us
          if (L2) { startClient(L2, slot); return R; }
          if (R.hostSeen) throw new Error('could not reach the host of that match - check your firewall and try again');
        }
      }
      throw new Error(kind === 'quick' ? 'all matches full' : 'match full');
    };
    R.leave = async () => {
      R.closed = true; clearInterval(R.timer);
      for (const [, L] of R.links) L.close(); R.links.clear();
      if (R.hostLink) R.hostLink.close(); if (R.sig) R.sig.close();
    };
    return R;
  }

  return {
    available: () => typeof RTCPeerConnection === 'function' && typeof WebSocket === 'function',
    // kind: 'quick' | 'code' | 'slot' (an exact slot, e.g. found on the local network)
    current: null,
    // can this computer reach the match service? resolves the round-trip in ms, or throws
    async ping() { const t = performance.now(), s = await signal('p' + rid(14)); const ms = Math.round(performance.now() - t); s.close(); return ms; },
    async open(kind, mode, code) { const r = makeRoom(kind, mode, code); this.current = r; try { await r.start(); } catch (e) { r.leave(); throw e; } return r; },
  };
})();
