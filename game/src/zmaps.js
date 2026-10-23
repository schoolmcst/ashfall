/* ================================================================== ZOMBIES MAPS: the hospital and THE WORKS
   Each zombies map brings its own doors, permanent walls, upgrader spot and arrows, perk spots, story (items, scenes,
   tapes, texts) and, on THE WORKS, launch pads. zmapUse(id) swaps them in (in place: the rest of the zombies code reads
   ZDOORS, ZPERKS, ZS_ITEMS... as before). The hospital's set is a snapshot taken when the game loads. */
const ZMAP_LIST = ['blackwell', 'works'];
const zmapIs = id => ZMAP_LIST.includes(id);
const ZM = { cur: '', pads: [], fly: null, cd: 0, powered: false, msgT: 0 };
const zmCopy = o => JSON.parse(JSON.stringify(o));
const ZMAPCFG = {};
ZMAPCFG.blackwell = {
  chapter: 'CHAPTER ONE', mapLine: 'start in the lobby · buy doors to open the hospital',
  info: 'Open doors to reach more of the hospital, and find the GUN UPGRADER (5000) in the north wing.',
  doors: zmCopy(ZDOORS), walls: zmCopy(ZWALLS), path: zmCopy(ZU_PATH), up: zmCopy(ZU_SPOT), strips: zmCopy(ZU_STRIPS),
  perks: Object.fromEntries(ZPERKS.map(p => [p.id, zmCopy(p.at)])), pads: [],
  story: { items: zmCopy(ZS_ITEMS), panel: zmCopy(ZS_FUSEBOX), cook: zmCopy(ZS_COOK), chapters: zmCopy(ZS_CHAPTERS), scenes: zmCopy(ZS_SCENES), tapes: zmCopy(ZS_TAPES), intro: zmCopy(ZS_INTRO), end: zmCopy(ZS_END), rounds: zmCopy(ZS_ROUNDS), say: zmCopy(ZS_SAY), text: zmCopy(ZS_TEXT) },
};

/* ---------- THE WORKS (chapter two) */
ZMAPCFG.works = {
  chapter: 'CHAPTER TWO', mapLine: 'start in the loading dock · Harold\'s truck led here',
  info: 'The hall in the middle opens every way. Train them round the chapel cloister or the foundry furnace, turn the power on for the LAUNCH PADS, and find the GUN UPGRADER (5000) in the boiler house.',
  doors: [
    { name: 'BOTTLING HALL', cost: 1000, ax: 'x', c: 16, a: -4, b: 4, y: 0, h: 4.5, wide: true, path: true },
    { name: 'CHAPEL CLOISTER', cost: 1250, ax: 'z', c: -12, a: -3, b: 3, y: 0, h: 4.5, wide: true },
    { name: 'FOUNDRY YARD', cost: 1250, ax: 'z', c: 12, a: -3, b: 3, y: 0, h: 4.5, wide: true },
    { name: 'BOILER HOUSE', cost: 2000, ax: 'x', c: -16, a: -3, b: 3, y: 0, h: 4.5, wide: true, path: true },
    { name: 'VESTRY PASSAGE', cost: 1500, ax: 'z', c: -12, a: -31, b: -27, y: 0, h: 4 },
    { name: 'WAREHOUSE GATE', cost: 1500, ax: 'z', c: 12, a: -31, b: -27, y: 0, h: 4 },
  ],
  walls: [],
  path: [[0, 33], [0, 29], [0, 25], [0, 21], [0, 17.5], [2, 14], [3.2, 10.5], [4.4, 6.5], [4.5, 2.5], [4.5, -1.5], [4.5, -5.5], [3.2, -9.5], [1.5, -13.2], [0, -17], [0, -21], [0, -25], [0, -29], [0, -33], [0, -35.6]],
  up: { x: 0, z: -37.4, y: 0 }, strips: [[-11.7, -34, 0.04, 10], [11.7, -34, 0.04, 10]],
  perks: { revive: { x: -11.5, z: 30, y: 0, q: 1 }, double: { x: 11.5, z: 5.8, y: 0, q: 3 }, quick: { x: -19.6, z: -39.5, y: 0, q: 0 }, zoom: { x: -41.5, z: 4, y: 0, q: 1 }, tank: { x: 41.5, z: 24, y: 0, q: 3 }, munch: { x: 31, z: -39.5, y: 0, q: 0 } },
  // launch pads: each fires you to the next pad round the ring whose part of the factory is open (needs the power)
  pads: [
    { name: 'LOADING DOCK', x: -7.5, z: 28.5, y: 0, needs: null },
    { name: 'CHAPEL GARDEN', x: -22.5, z: -4, y: 0, needs: [1, 4] },
    { name: 'BOILER HOUSE', x: 9, z: -18.4, y: 0, needs: [3, 4, 5] },
    { name: 'FOUNDRY YARD', x: 35, z: 15.5, y: 0, needs: [2, 5] },
  ],
  story: {
    items: [
      { id: 'f1', kind: 'fuse', look: 'valve', name: 'VALVE WHEEL', at: { x: -8.5, z: 12.8, y: 0 } },
      { id: 'f2', kind: 'fuse', look: 'valve', name: 'VALVE WHEEL', at: { x: -32, z: 4.5, y: 0 } },
      { id: 'f3', kind: 'fuse', look: 'valve', name: 'VALVE WHEEL', at: { x: 34, z: -8, y: 0 } },
      { id: 'card', kind: 'card', look: 'key', name: "THE FOREMAN'S KEY", at: { x: -27, z: -35.2, y: 0 }, needs: 'power' },
      { id: 'st1', kind: 'stash', look: 'pallet', name: 'NIGHTSHADE PALLET', at: { x: 27, z: -36.6, y: 0 } },
      { id: 'st2', kind: 'stash', look: 'pallet', name: 'NIGHTSHADE PALLET', at: { x: -36, z: 30.3, y: 0 } },
      { id: 'st3', kind: 'stash', look: 'pallet', name: 'NIGHTSHADE PALLET', at: { x: 25, z: 27.3, y: 0 } },
      { id: 'jar', kind: 'jar', look: 'formula', name: 'THE LAZARUS FORMULA', at: { x: -10, z: -37.7, y: 0 }, needs: 'card' },
    ],
    panel: { x: -11.62, z: -9, y: 0 }, cook: { x: 0, z: 2.6, y: 0, secs: 60, need: 9 },
    chapters: [
      { id: 'power', name: 'PRESSURE', goal: 'find 3 valve wheels and fit them to the pressure panel in the bottling hall' },
      { id: 'card', name: "THE FOREMAN'S KEY", goal: "take the foreman's key from his body at the chapel altar" },
      { id: 'stash', name: 'BURN THE PALLETS', goal: 'burn the 3 NIGHTSHADE pallets (the warehouse, the graveyard crypt, the rail car)' },
      { id: 'blood', name: 'HAROLD', goal: 'kill Harold and take his ledger' },
      { id: 'jar', name: 'THE FORMULA', goal: "open the foreman's safe in the boiler house and take the Lazarus formula" },
      { id: 'cure', name: 'FLOOD THE LINES', goal: 'pump the Green Cure into the bottling lines at the mixing vat and hold them off' },
      { id: 'end', name: 'EPILOGUE', goal: 'survive' },
    ],
    scenes: [
      [['tank', 'So this is where Harold\'s truck went. The old Lazarus Works. Eighteen ninety one, it says.'], ['sparks', 'The boilers are dead. If we get the pressure up, the lights come on and those pneumatic launch pads should fire. Find me three valve wheels.'], ['smokes', 'Launch pads? In a pill factory? Who built this place, a wizard?']],
      [['sparks', 'Pressure is up! Listen to her sing! And the launch pads are live. Step on one. Trust me. Mostly.'], ['doc', 'The bottling lines need the foreman\'s key, and the safe in the boiler house too.'], ['tank', 'There is a body up at the chapel altar in a foreman\'s coat. Let us go say a prayer and take his keys.']],
      [['doc', 'Got the key. He was holding a rosary and a bottle of Nightshade. Same hand.'], ['tank', 'Twelve pallets came in on that truck. Most of them are already pills. We burn what is left.'], ['smokes', 'One in the warehouse, one by the crypt in the graveyard, one on the rail car. I can smell them from here.']],
      [['smokes', 'That is the last pallet. You know, I used to dream about this much product. Now I dream about setting it on fire.'], ['sparks', 'Guys. The chapel bell is ringing. Nobody is pulling the rope.'], ['doc', 'It is Harold. He took his own product to see what it did. He has his ledger on him. Every shipment. Kill him and take it.']],
      [['tank', 'The board will be thrilled to hear their chairman is down.'], ['doc', 'His ledger is ours. Now the formula. The real Lazarus recipe is in the foreman\'s safe in the boiler house.'], ['sparks', 'If we flood the bottling lines with the cure, every pill this place makes from now on is medicine. That is beautiful. That is so beautiful.']],
      [['doc', 'The formula. With this and the Green Cure, we can turn the whole factory around.'], ['smokes', 'Back to the big copper pot in the hall. Sixty seconds of pumping and we are heroes.'], ['tank', 'Sixty seconds, everybody on the vat. They will hear the pumps. Here they come.']],
    ],
    tapes: [
      { at: { x: 3.6, z: 32.5, y: 0 }, title: 'WORKS TAPE 1 · THE DELIVERY', lines: [['tank', 'Harold\'s driver left this in the cab. Delivery note: twelve pallets, Lazarus Works, receiving dock. Signed, H.'], ['smokes', 'He drove the pallets straight back to where they were made. That is like returning a burrito to the kitchen.']] },
      { at: { x: 10.4, z: -11.6, y: 0 }, title: 'WORKS TAPE 2 · THE LINES', lines: [['sparks', 'Night shift log. Lines one to four running Nightshade at nine thousand pills an hour. Somebody stuck a label on it. Lazarus, we end all pain.'], ['sparks', 'Line three keeps jamming. The pills come out warm. Like they are breathing.']] },
      { at: { x: -40, z: -14, y: 0 }, title: 'WORKS TAPE 3 · THE FOUNDER', lines: [['doc', 'From the archive. Josiah Lazarus founded the Works in eighteen ninety one. His tonic promised to end all pain. Half the town took it.'], ['doc', 'The town records say the dead were buried in the chapel graveyard. The town records also say some of them climbed back out.']] },
      { at: { x: -21, z: 36.5, y: 0 }, title: 'WORKS TAPE 4 · THE GRAVEYARD', lines: [['tank', 'These headstones are all from eighteen ninety three. Same month. Same week.'], ['smokes', 'So Lazarus nine is not new. It is Lazarus one with a better marketing team.']] },
      { at: { x: -41, z: -30, y: 0 }, title: 'WORKS TAPE 5 · THE FOREMAN', lines: [['sparks', 'This is foreman Abernathy. Harold says the pills are safe. Harold says the night shift just got sick.'], ['sparks', 'Half my crew is in the chapel praying. The other half is outside the chapel. Scratching at the door.']] },
      { at: { x: -23.5, z: -38.4, y: 0.3 }, title: 'WORKS TAPE 6 · THE CONFESSION', lines: [['doc', 'Harold\'s voice. Forgive me, Father. I knew what the formula did. I knew in eighteen ninety three it was a resurrection compound and I sold it anyway.'], ['doc', 'Wait. Eighteen ninety three? Harold, how old are you?']] },
      { at: { x: -3.6, z: -36, y: 0 }, title: 'WORKS TAPE 7 · THE BOILERS', lines: [['sparks', 'Boiler log. Pressure valves removed by order of management. So nobody can restart the lines and destroy the stock.'], ['sparks', 'Management is very scared of somebody restarting the lines. Management should be.']] },
      { at: { x: 14, z: -28, y: 0 }, title: 'WORKS TAPE 8 · THE WAREHOUSE', lines: [['smokes', 'Inventory. Pallets one through twelve, received. Pallets one through nine, already pressed, packed and shipped. Uh oh.'], ['tank', 'Shipped where?'], ['smokes', 'It just says see the ledger. Harold has the ledger.']] },
      { at: { x: 40.5, z: -34, y: 0 }, title: 'WORKS TAPE 9 · SMOKES ALONE', lines: [['smokes', 'Note to self. If I die in a pill factory, tell my mom I was a pharmacist. Technically correct.'], ['smokes', 'Also tell her I am sorry about the garage. And the car. And Eddie.']] },
      { at: { x: 27, z: -6.6, y: 0 }, title: 'WORKS TAPE 10 · THE FURNACE', lines: [['tank', 'Foundry log. Furnace lit day and night for a hundred and thirty years. Never once let go out.'], ['doc', 'They were not making iron. They were burning the ones that came back.']] },
      { at: { x: 40, z: 34, y: 0 }, title: 'WORKS TAPE 11 · THE RAIL CAR', lines: [['sparks', 'Rail manifest. Freight car to the airport. Nine pallets, pressed and packed. Label: medical supplies, priority air cargo.'], ['tank', 'They are putting it on planes.']] },
      { at: { x: -27, z: 2.6, y: 0 }, title: 'WORKS TAPE 12 · THE ANGEL', lines: [['doc', 'The inscription on the fountain. Josiah Lazarus, who ended all pain. Eighteen forty to', ], ['doc', 'There is no second date. They never carved one.'], ['smokes', 'Okay. That is the creepiest thing I have ever heard and I sold pills to a guy named Eddie.']] },
    ],
    intro: [
      ['tank', 'Harold\'s truck. Parked right here at the dock with the back doors open.'],
      ['doc', 'This is where Lazarus nine was really made. Not in my lab. Here. In eighteen ninety one.'],
      ['smokes', 'I have a bad feeling about a factory with its own graveyard.'],
      ['sparks', 'And its own chapel. And a furnace that never goes out. Cool. Cool cool cool. Smoke up, everybody.'],
    ],
    end: [
      ['doc', 'The lines are running green. Every pill this factory makes from now on is the cure.'],
      ['sparks', 'We did it! We turned a zombie factory into a weed factory! I am crying! These are happy tears!'],
      ['tank', 'Doc. The ledger. Read the last page.'],
      ['doc', 'Nine pallets. Shipped on the rail car to the airport. Flight nine oh nine. Air cargo. Destination: every major city on the board.'],
      ['smokes', 'So Harold was not the boss. Harold was a delivery guy.'],
      ['doc', 'The flight leaves at dawn. We have to get to that airport.'],
    ],
    rounds: {
      2: [['smokes', 'This place has a chapel and a furnace. Somebody really did not want anything to stay dead.'], ['tank', 'Or stay alive.']],
      4: [['sparks', 'Has anyone noticed the bell rings every time a round starts? I am not ringing it. Is anybody ringing it?'], ['doc', 'Nobody is ringing it, Penny.']],
      6: [['tank', 'Run them round the cloister. Big loop, nice and slow. Like walking a dog.'], ['smokes', 'A dog that wants to eat your face.']],
      8: [['doc', 'Josiah Lazarus. Harold. The same receding hairline. The same ugly tie. I do not think they are related. I think they are the same man.'], ['sparks', 'Do not say that. Doc. Do not say that in the creepy factory.']],
      10: [['smokes', 'Round ten in a pill factory. My younger self would be so proud. And so confused.'], ['tank', 'Your younger self would be arrested.']],
      15: [['sparks', 'Fifteen rounds! The furnace is basically our friend now. I named it Gary.'], ['tank', 'Do not name the furnace.'], ['sparks', 'Gary does not like your tone.']],
    },
    say: {
      doc: { fuse: 'A valve wheel. Sparks will want this.', card: 'The foreman\'s key. Rest now, Mister Abernathy.', stash: 'Into the fire. All of it.', jar: 'The original formula. Eighteen ninety one. Josiah\'s own handwriting.', blood: 'Harold\'s ledger. Every shipment he ever made.', cook: 'Pumps are on. Sixty seconds. Hold the vat!' },
      tank: { fuse: 'Got a valve. Heavy little thing.', card: 'Keys. Sorry, buddy. You will not need them.', stash: 'Burn, you purple garbage.', jar: 'Formula is ours. Let us end this.', blood: 'Harold is done. Got the ledger.', cook: 'Everybody on the vat! Nothing gets through!' },
      smokes: { fuse: 'Valve wheel. Looks like a steering wheel for a very small car.', card: 'Key. The foreman had a nicer coat than me. Had.', stash: 'Bye bye, product. I will not miss you. I will miss you a little.', jar: 'The original recipe. Like grandma\'s cookies, if grandma raised the dead.', blood: 'Got his little book. Harold, you organised monster.', cook: 'It is pumping! Smells like a dispensary in here! In a good way!' },
      sparks: { fuse: 'Valve wheel! Oh, she is beautiful! Brass fittings!', card: 'Keys! Keys keys keys!', stash: 'Fire! Big fire! Good fire!', jar: 'Old paper smell! I love old paper smell!', blood: 'Ew, it is sticky. Why is the ledger sticky.', cook: 'Pumps running! Pressure good! Everybody shoot things!' },
    },
    text: {
      title: 'THE WORKS', place: 'LAZARUS PHARMACEUTICAL WORKS · ZOMBIES · CHAPTER TWO', introSub: 'SEVEN CHAPTERS · TWELVE TAPES · LAUNCH PADS', introEm: 'harold\'s truck led here · burn what is left',
      needPower: 'HIS HAND IS STILL CLENCHED · GET THE PRESSURE UP FIRST', needCard: "LOCKED IN THE FOREMAN'S SAFE · YOU NEED HIS KEY", stashLocked: "NIGHTSHADE PALLET · YOU NEED THE FOREMAN'S KEY TO SET THE BURNERS (CHAPTER 2)",
      stashVerb: 'BURN IT', panel: 'PRESSURE PANEL', parts: 'VALVE WHEELS', panelDo: 'FIT THE VALVES AND BRING UP THE PRESSURE', powerOn: 'PRESSURE IS UP', powerSub: 'the lights are on · the launch pads are live',
      partSub: 'the pressure panel is in the bottling hall', stashSub: 'burned', jarSub: 'the formula · the last piece', bloodSub: 'every shipment he ever made',
      station: 'MIXING VAT', cooking: 'FLOODING THE LINES', cookDo: 'FLOOD THE LINES WITH THE GREEN CURE', cookStay: 'stay near the mixing vat', bar: 'FLOODING THE LINES',
      boss: 'HAROLD', bossSub: 'he took his own product · kill him and take his ledger', bossDown: 'HAROLD IS DOWN', bossDownSub: 'take his ledger', drop: "HAROLD'S LEDGER", dropLook: 'ledger',
      doneSub: 'chapter two complete · every perk · upgraded gun · 5000 points', cont: 'TO BE CONTINUED', contSub: 'flight 909 · it leaves at dawn',
      keyDone: 'ashfall.zstory.works', keyTapes: 'ashfall.ztapes.works', bossScale: 1.6, bossHp: 5000,
    },
  },
};
try { AUD_PROF.works = { len: 2.6, pow: 2.5, wet: 0.42, echo: 0.22, dark: 0.45, amb: 'hall', surf: 'concrete' }; } catch (e) {}
const zmapCfg = id => ZMAPCFG[id] || ZMAPCFG.blackwell;
const zmapStoryDone = id => zsDoneEver(zmapCfg(id).story.text.keyDone);
function zmapTapes(id) { try { return JSON.parse(localStorage.getItem(zmapCfg(id).story.text.keyTapes) || '[]').length; } catch (e) { return 0; } }
const zmSwap = (arr, src) => { arr.splice(0, arr.length, ...zmCopy(src)); };
const zmSet = (obj, src) => { for (const k of Object.keys(obj)) delete obj[k]; Object.assign(obj, zmCopy(src)); };
// put a map's zombies set in place (called before every zombies game is built)
function zmapUse(id) {
  if (!zmapIs(id)) return; ZM.cur = id;
  const c = ZMAPCFG[id], s = c.story;
  zmSwap(ZDOORS, c.doors); ZDOORS.forEach((d, i) => { d.id = i; }); zmSwap(ZWALLS, c.walls); zmSwap(ZU_PATH, c.path); Object.assign(ZU_SPOT, c.up); zmSwap(ZU_STRIPS, c.strips);
  for (const p of ZPERKS) if (c.perks[p.id]) p.at = zmCopy(c.perks[p.id]);
  zmSwap(ZS_ITEMS, s.items); Object.assign(ZS_FUSEBOX, s.panel); Object.assign(ZS_COOK, s.cook); zmSwap(ZS_CHAPTERS, s.chapters); zmSwap(ZS_SCENES, s.scenes); zmSwap(ZS_TAPES, s.tapes);
  zmSwap(ZS_INTRO, s.intro); zmSwap(ZS_END, s.end); zmSet(ZS_ROUNDS, s.rounds); zmSet(ZS_SAY, s.say); zmSet(ZS_TEXT, Object.assign(zmCopy(ZMAPCFG.blackwell.story.text), s.text));
  zsLoadTapes();
}

/* ---------- launch pads */
function zmapPadSign(name) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 96; const g = c.getContext('2d');
  g.fillStyle = '#100c08'; g.fillRect(0, 0, 256, 96); g.strokeStyle = '#d8b060'; g.lineWidth = 5; g.strokeRect(4, 4, 248, 88);
  g.textAlign = 'center'; g.fillStyle = '#ffd890'; g.font = 'bold 28px Georgia, serif'; g.fillText('LAUNCH PAD', 128, 40); g.fillStyle = '#c8b890'; g.font = 'bold 15px sans-serif'; g.fillText(name, 128, 64); g.fillStyle = '#8a7a5a'; g.font = '12px sans-serif'; g.fillText('STEP ON · NEEDS PRESSURE', 128, 84);
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t;
}
function zmapBuildPads() {
  zmapClearPads(); ZM.powered = false; ZM.cd = 0; ZM.fly = null;
  for (const p of zmapCfg(curMap).pads) {
    const g = new THREE.Group(), iron = new THREE.MeshStandardMaterial({ color: 0x2a2826, roughness: 0.5, metalness: 0.8 }), brass = new THREE.MeshStandardMaterial({ color: 0xb08a40, roughness: 0.35, metalness: 0.9 });
    const glow = new THREE.MeshStandardMaterial({ color: 0x100000, emissive: new THREE.Color(0xff2a1a), emissiveIntensity: 1.6 });
    const add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); g.add(m); return m; };
    add(new THREE.CylinderGeometry(1.25, 1.35, 0.08, 28), iron, 0, 0.04, 0); add(new THREE.CylinderGeometry(0.95, 0.95, 0.09, 28), brass, 0, 0.05, 0);
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; add(new THREE.BoxGeometry(0.5, 0.1, 0.08), iron, Math.cos(a) * 0.55, 0.06, Math.sin(a) * 0.55).rotation.y = -a; }
    const ring = add(new THREE.TorusGeometry(1.1, 0.045, 8, 36), glow, 0, 0.1, 0); ring.rotation.x = Math.PI / 2;
    for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + Math.PI / 4; add(new THREE.CylinderGeometry(0.09, 0.09, 1.1, 10), brass, Math.cos(a) * 1.3, 0.55, Math.sin(a) * 1.3); add(new THREE.SphereGeometry(0.12, 10, 8), glow, Math.cos(a) * 1.3, 1.15, Math.sin(a) * 1.3); }
    const sign = add(new THREE.PlaneGeometry(0.9, 0.34), new THREE.MeshBasicMaterial({ map: zmapPadSign(p.name), side: THREE.DoubleSide }), Math.cos(Math.PI / 4) * 1.3, 1.5, Math.sin(Math.PI / 4) * 1.3);
    sign.rotation.y = -Math.PI / 4;
    const beam = add(new THREE.CylinderGeometry(0.9, 1.0, 6, 18, 1, true), new THREE.MeshBasicMaterial({ color: 0xff8a40, transparent: true, opacity: 0.05, depthWrite: false, side: THREE.DoubleSide }), 0, 3, 0);
    const lt = new THREE.PointLight(0xff2a1a, 0.6, 5, 2); lt.position.y = 0.6; g.add(lt);
    g.position.set(p.x, p.y, p.z); scene.add(g);
    ZM.pads.push({ p, g, glow, lt, beam, ring });
  }
}
function zmapClearPads() { for (const o of ZM.pads) scene.remove(o.g); ZM.pads = []; ZM.fly = null; }
function zmapPowerPads() { ZM.powered = true; }
const zmapPadOpen = p => !p.needs || p.needs.some(id => ZD.open.has(id));
function zmapPadMsg(t) { if (NOW - ZM.msgT > 2.5) { ZM.msgT = NOW; try { showMsg(t); } catch (e) {} } }
function zmapTick(dt) {
  if (!ZM.pads.length) return;
  ZM.cd = Math.max(0, ZM.cd - dt);
  const ready = ZM.powered && ZM.cd <= 0, col = !ZM.powered ? 0xff2a1a : ready ? 0x3aff6a : 0xffa020;
  for (const o of ZM.pads) { o.glow.emissive.setHex(col); o.lt.color.setHex(col); o.ring.rotation.z += dt * (ready ? 2.5 : 0.4); o.beam.material.color.setHex(col); o.beam.material.opacity = ready ? 0.07 + Math.sin(NOW * 4) * 0.03 : 0.03; }
  if (ZM.fly) { zmapFly(dt); return; }
  if (G.state !== 'playing' || (typeof ZC !== 'undefined' && (ZC.down || ZC.dead))) return;
  ZM.pads.forEach((o, i) => {
    const p = o.p; if (Math.hypot(P.x - p.x, P.z - p.z) > 1.05 || Math.abs((P.y || 0) - p.y) > 0.5) return;
    if (!ZM.powered) return zmapPadMsg('LAUNCH PAD · NO PRESSURE · TURN THE POWER ON FIRST');
    if (ZM.cd > 0) return zmapPadMsg(`LAUNCH PAD · RECHARGING · ${Math.ceil(ZM.cd)} s`);
    const L = ZM.pads.length; let dest = null;
    for (let k = 1; k < L && !dest; k++) { const q = ZM.pads[(i + k) % L].p; if (zmapPadOpen(q)) dest = q; }
    if (!dest) return zmapPadMsg('LAUNCH PAD · OPEN MORE OF THE WORKS FIRST');
    zmapLaunch(p, dest);
  });
}
function zmapLaunch(a, b) {
  ZM.fly = { ax: P.x, ay: P.y || 0, az: P.z, bx: b.x, by: b.y, bz: b.z, t: 0, T: 1.7, name: b.name }; ZM.cd = 25;
  showBanner('LAUNCH!', 'to the ' + b.name.toLowerCase());
  try { burst(0.9, 900, 0.35, 'lowpass'); tone(90, 0.6, 0.25, 'sawtooth', 400); burst(0.5, 4000, 0.12, 'highpass'); } catch (e) {}
  try { for (let i = 0; i < 14; i++) puff(a.x + rnd(-1, 1), 0.2, a.z + rnd(-1, 1), { color: 0xd8d0c0, size: 0.4, grow: 1.2, life: 1.4, vy: 1.5, op: 0.5 }); } catch (e) {}
  if (typeof zvSay === 'function') setTimeout(() => { try { zvSay('streak', 0.4); } catch (e) {} }, 500);
}
// the flight: up and over the roofs, then straight down onto the pad
function zmapFly(dt) {
  const f = ZM.fly; f.t += dt; const k = Math.min(1, f.t / f.T), h = Math.min(1, k / 0.78), s = h * h * (3 - 2 * h);
  P.x = f.ax + (f.bx - f.ax) * s; P.z = f.az + (f.bz - f.az) * s;
  P.y = f.ay + (f.by - f.ay) * k + 16 * (1 - Math.pow((k - 0.5) / 0.5, 2));
  P.vy = 0; P.onGround = false; P.vx = 0; P.vz = 0; G.spawnProt = Math.max(G.spawnProt || 0, 0.8);
  if (k >= 1) {
    ZM.fly = null; P.y = f.by; P.onGround = true;
    try { burst(0.3, 600, 0.3, 'lowpass'); tone(55, 0.3, 0.25, 'sine'); for (let i = 0; i < 10; i++) puff(f.bx + rnd(-1, 1), 0.2, f.bz + rnd(-1, 1), { color: 0xd8d0c0, size: 0.35, grow: 1, life: 1.2, vy: 0.8, op: 0.45 }); } catch (e) {}
  }
}
// the chapel bell tolls at the start of every round on THE WORKS
function zmapRound() {
  if (curMap !== 'works') return;
  try { for (const [d, f] of [[0, 1], [1.6, 1], [3.2, 1]]) setTimeout(() => { tone(196, 3.2, 0.13, 'sine'); tone(392, 2.2, 0.06, 'sine'); tone(588, 1.4, 0.03, 'triangle'); }, d * 1000); } catch (e) {}
}

/* ---------- light pool: the zombies maps have 40-80 lamps, candles, fires and glows. Every point light in the scene
   costs every lit pixel every frame, and adding or removing one recompiles every shader (a hitch). So in zombies only
   ZL_POOL real lights exist, never added or removed; each fraction of a second they take the place of the lamps that
   matter most near you (bright and close). The map's own lights stay as "virtual" lights: they keep flickering and the
   pool copies them. Lights made later (items, the boss) are adopted by a rescan. */
const ZL_POOL = 12;
const ZLP = { on: false, pool: [], virt: [], t: 0, scanT: 0 };
const zlpSkip = l => l === muzzleLight || l === enemyFlashLight || ZLP.pool.includes(l);
function zlpAdopt() {
  const found = [];
  scene.traverse(o => { if (o.isPointLight && !zlpSkip(o) && o.parent) found.push(o); });
  for (const l of found) { const par = l.parent; par.remove(l); ZLP.virt.push({ l, par, w: new THREE.Vector3() }); }
}
function zlpStart() {
  zlpStop();
  ZLP.pool = []; for (let i = 0; i < ZL_POOL; i++) { const l = new THREE.PointLight(0xffffff, 0, 10, 2); scene.add(l); ZLP.pool.push(l); }
  ZLP.on = true; ZLP.map = curMap; ZLP.virt = []; zlpAdopt(); ZLP.t = 0; ZLP.scanT = 1; zlpAssign();
}
// give the lights back (the map may be reused by another mode) and remove the pool
function zlpStop() {
  if (!ZLP.on) return; ZLP.on = false; try { renderer.shadowMap.autoUpdate = true; } catch (e) {}
  if (ZLP.map === curMap) for (const v of ZLP.virt) if (v.par && !v.l.parent && (v.par !== scene || worldObjs.includes(v.l))) v.par.add(v.l);
  ZLP.virt = []; for (const l of ZLP.pool) scene.remove(l); ZLP.pool = [];
}
const zlpLive = o => { while (o) { if (o === scene) return true; o = o.parent; } return false; };
function zlpAssign() {
  const cx = camera.position.x, cy = camera.position.y, cz = camera.position.z, cand = [];
  for (let i = ZLP.virt.length - 1; i >= 0; i--) {
    const v = ZLP.virt[i]; if (!zlpLive(v.par)) { ZLP.virt.splice(i, 1); continue; }   // its object left the scene (an item picked up, a dead boss)
    v.par.updateWorldMatrix(true, false); v.w.copy(v.l.position).applyMatrix4(v.par.matrixWorld);
    const d2 = (v.w.x - cx) ** 2 + (v.w.y - cy) ** 2 * 1.5 + (v.w.z - cz) ** 2, R = (v.l.distance || 12) + 6;
    if (d2 > R * R * 4) continue;
    const D = v.l.distance || 12; v.score = Math.max(0.05, v.l.intensity) * D * D / (D * D + d2); cand.push(v);
  }
  cand.sort((a, b) => b.score - a.score);
  ZLP.pool.forEach((l, i) => { const v = cand[i]; l.userData.v = v || null; if (!v) { l.intensity = 0; return; } l.position.copy(v.w); l.color.copy(v.l.color); l.distance = v.l.distance; l.decay = v.l.decay; l.intensity = v.l.intensity; });
}
function zlpTick(dt) {
  if (!ZLP.on) return;
  try { const sm = renderer.shadowMap; sm.autoUpdate = false; ZLP.f = (ZLP.f || 0) + 1; if (ZLP.f % 2 === 0) sm.needsUpdate = true; } catch (e) {}   // shadows redrawn every other frame
  if ((ZLP.scanT -= dt) <= 0) { ZLP.scanT = 1; zlpAdopt(); }
  if ((ZLP.t -= dt) <= 0) { ZLP.t = 0.12; zlpAssign(); return; }
  for (const l of ZLP.pool) { const v = l.userData.v; if (v) { l.intensity = v.l.intensity; if (v.par !== scene) { v.par.updateWorldMatrix(true, false); l.position.copy(v.l.position).applyMatrix4(v.par.matrixWorld); } } }   // flicker, moving lights
}

/* ---------- #zbench: a zombies benchmark (used to measure a machine, e.g. a friend's Mac)
   #zbench[&map=works|blackwell][&r=http://127.0.0.1:8765]: starts a solo zombies game, opens every door, turns the
   power on, keeps 20 zombies coming, fires constantly and pans the camera. It measures OLD lighting (every lamp a real
   light) then NEW lighting (the light pool), 20 seconds each, and shows the numbers (and POSTs them to r if given). */
const ZB = { on: false };
function zbOpts() { const h = (location.hash || '').replace(/^#zbench&?/, ''), o = {}; for (const kv of h.split('&')) { const [k, v] = kv.split('='); if (k) o[k] = decodeURIComponent(v || ''); } return o; }
function zbStats(d) {
  const s = d.slice().sort((a, b) => a - b), n = s.length || 1, sum = s.reduce((a, b) => a + b, 0) || 1, worst = s.slice(Math.floor(n * 0.99));
  return { avgFps: +(n / sum * 1000).toFixed(1), low1Fps: +(worst.length / (worst.reduce((a, b) => a + b, 0) || 1) * 1000).toFixed(1), p95ms: +(s[Math.floor(n * 0.95)] || 0).toFixed(1), maxMs: +(s[n - 1] || 0).toFixed(1), frames: n, lights: (() => { let k = 0; scene.traverse(o => { if (o.isPointLight) k++; }); return k; })() };
}
function startZBench() {
  const o = zbOpts(), map = zmapIs(o.map) ? o.map : 'works'; ZB.on = true; ZB.o = o; ZB.res = { map, ua: navigator.userAgent, dpr: window.devicePixelRatio, gpu: (typeof gpuName === 'function' ? gpuName() : ''), settings: { quality: S.quality, shadows: S.shadows, renderScale: S.renderScale, dynRes: S.dynRes } };
  S.dynRes = false; try { applyPR(); } catch (e) {}
  ZL.net = 'solo'; ZL.map = map; ZV.enabled = false; startMatch('zomb', { map });
  setTimeout(zbSetup, 4000);
}
function zbSetup() {
  for (const d of ZDOORS) zdOpen(d.id, false);
  for (const id of ['f1', 'f2', 'f3']) zsFlag(id); zsPower();
  ZS.playing = true; Z.breakT = 1e9; Z.active = true; Z.toSpawn = 0;
  const sp = curMap === 'works' ? { x: 0, z: 8 } : { x: 0, z: 18 }; Object.assign(P, { x: sp.x, z: sp.z, y: 0 });
  const cv = renderer.domElement; ZB.res.resolution = `${cv.width}x${cv.height}`;
  zbPhase('old');
}
function zbFill() {
  const pts = zdSpawnPts().filter(p => { const d = Math.hypot(p.x - P.x, p.z - P.z); return d > 7 && d < 22 && p.y < 1; });
  while (enemies.filter(e => e.zombie).length < 20 && pts.length) { const p = pts[(Math.random() * pts.length) | 0]; const e = makeZombie(p.x, p.z, p.y); e.kind = 'walk'; e.speed = 1.2; }
}
function zbPhase(name) {
  if (name === 'old') zlpStop(); else zlpStart();
  showBanner('ZOMBIES BENCHMARK', name === 'old' ? 'old lighting · 20 seconds · hands off' : 'new lighting · 20 seconds · hands off');
  const d = []; let last = performance.now(), t0 = last;
  const step = now => {
    if (!ZB.on) return;
    const dt = now - last; last = now;
    G.health = G.maxHp = 1e9; P.yaw += dt / 1000 * 0.35; P.pitch = -0.08; mouseDown = true;
    const w = WEAPONS[G.cur]; if (w) { w.ammo = w.magSize; G.reloading = false; }
    if (now - t0 > 3000 && document.visibilityState !== 'hidden' && dt < 500) d.push(dt);
    if (((now - t0) | 0) % 500 < 20) zbFill();
    if (now - t0 < 23000) requestAnimationFrame(step);
    else { ZB.res[name] = zbStats(d); if (name === 'old') zbPhase('new'); else zbDone(); }
  };
  requestAnimationFrame(step);
}
function zbDone() {
  ZB.on = false; mouseDown = false; const r = ZB.res; window.__zbench = r;
  try { console.log('ASHFALL ZBENCH', JSON.stringify(r)); } catch (e) {}
  if (ZB.o.r) try { fetch(ZB.o.r, { method: 'POST', mode: 'no-cors', body: JSON.stringify(r) }); } catch (e) {}
  let el = $('zbOut'); if (!el) { el = document.createElement('pre'); el.id = 'zbOut'; el.style.cssText = 'position:fixed;inset:10% 20%;z-index:99;background:rgba(0,0,0,.88);color:#cfe;font:16px/1.5 monospace;padding:24px;white-space:pre-wrap;overflow:auto'; document.body.appendChild(el); }
  el.textContent = `ZOMBIES BENCHMARK · ${r.map.toUpperCase()}\n\nOLD LIGHTING: ${r.old.avgFps} fps avg · 1% low ${r.old.low1Fps} · worst ${r.old.maxMs} ms · ${r.old.lights} lights\nNEW LIGHTING: ${r.new.avgFps} fps avg · 1% low ${r.new.low1Fps} · worst ${r.new.maxMs} ms · ${r.new.lights} lights\n\n${r.gpu}\n${r.resolution} @ ${r.dpr}x`;
}
