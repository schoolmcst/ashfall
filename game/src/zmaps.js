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
// wall stashes (guns behind a spray-paint stencil): q = the way the wall faces (0 +z, 1 +x, 2 -z, 3 -x)
ZMAPCFG.blackwell.stash = [
  { gun: 'viper', cost: 1000, x: 7.86, z: 26.9, y: 0, q: 3 },        // the south lobby
  { gun: 'striker', cost: 1300, x: -22, z: 10.13, y: 0, q: 0 },      // the main corridor
  { gun: 'breacher', cost: 1500, x: 22, z: -10.13, y: 0, q: 2 },     // the north wing
  { gun: 'marc', cost: 2000, x: 22, z: 10.13, y: 4.2, q: 0 },        // upstairs
];
ZMAPCFG.works.stash = [
  { gun: 'viper', cost: 1000, x: -11.73, z: 22, y: 0, q: 1 },        // the loading dock
  { gun: 'striker', cost: 1300, x: 11.73, z: -6, y: 0, q: 3 },       // the bottling hall
  { gun: 'breacher', cost: 1500, x: -41.73, z: -8, y: 0, q: 1 },     // the cloister
  { gun: 'marc', cost: 2000, x: 41.73, z: 6, y: 0, q: 3 },           // the foundry yard
  { gun: 'hailstorm', cost: 2500, x: -11.73, z: -19, y: 0, q: 1 },   // the boiler house
];
// boarded windows in the outer walls (q = the way into the building)
ZMAPCFG.blackwell.windows = [{ x: 40, z: 19, y: 0, q: 3 }, { x: 40, z: -19, y: 0, q: 3 }, { x: -40, z: 19, y: 0, q: 1 }, { x: -40, z: -19, y: 0, q: 1 }];
ZMAPCFG.works.windows = [{ x: -42, z: 10, y: 0, q: 1 }, { x: -42, z: 28, y: 0, q: 1 }, { x: 42, z: -8, y: 0, q: 3 }, { x: 42, z: 30, y: 0, q: 3 }, { x: 24, z: -40, y: 0, q: 0 }, { x: -6, z: -40, y: 0, q: 0 }];
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
  if (ZS.off) ZM.powered = true;   // no story: the launch pads work from the start
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
  if (typeof zvSay === 'function') setTimeout(() => { try { zvSay('streak', 0.2); } catch (e) {} }, 500);
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
  ZLP.pool = []; for (let i = 0; i < zlPoolSize(); i++) { const l = new THREE.PointLight(0xffffff, 0, 10, 2); scene.add(l); ZLP.pool.push(l); }
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

/* ---------- TERMINAL 9 (chapter three: FLIGHT 909) */
ZMAPCFG.terminal9 = {
  chapter: 'CHAPTER THREE', mapLine: 'start in the cargo office · flight 909 leaves at dawn',
  info: 'The baggage hall in the middle opens every way. Loop the carousel, the duty free or the plane, turn the power on for the BAGGAGE CHUTES, and find the GUN UPGRADER (5000) inside Flight 909\'s cargo hold.',
  doors: [
    { name: 'BAGGAGE HALL', cost: 1000, ax: 'x', c: 26, a: -4, b: 4, y: 0, h: 4, wide: true, path: true },
    { name: 'DEPARTURES', cost: 1250, ax: 'z', c: -12, a: 2, b: 8, y: 0, h: 4, wide: true },
    { name: 'CUSTOMS', cost: 1250, ax: 'z', c: 12, a: 2, b: 8, y: 0, h: 4, wide: true },
    { name: 'GATE 9', cost: 2000, ax: 'x', c: -16, a: -3, b: 3, y: 0, h: 4, wide: true, path: true },
    { name: 'JETWAY', cost: 1500, ax: 'x', c: -16, a: -29, b: -25, y: 0, h: 4 },
    { name: 'CARGO DOOR', cost: 1500, ax: 'x', c: -16, a: 25, b: 29, y: 0, h: 4 },
  ],
  walls: [],
  path: [[0, 34], [0, 30], [0, 26.5], [3, 22], [7.5, 16], [7.5, 10], [7.5, 4], [7.5, -2], [4, -9], [0, -13.5], [0, -18], [7, -21], [14, -22], [20, -24], [24.5, -27], [22, -28, 0.7], [19, -28, 1.3], [15, -28, 1.6], [11, -28, 1.6], [7, -28, 1.6], [3, -28, 1.6], [-1, -28, 1.6], [-5, -28, 1.6], [-9, -28, 1.6], [-11.6, -28, 1.6]],
  up: { x: -13.6, z: -28, y: 1.6 }, strips: [[-9, -26.45, 7, 0.04], [-9, -29.55, 7, 0.04]],
  perks: { revive: { x: -11.5, z: 33, y: 0, q: 1 }, double: { x: 11.5, z: 18, y: 0, q: 3 }, quick: { x: -41.5, z: 18, y: 0, q: 1 }, zoom: { x: 41.5, z: -8, y: 0, q: 3 }, tank: { x: 35, z: -29.5, y: 0, q: 0 }, munch: { x: 41.5, z: 20, y: 0, q: 3 } },
  pads: [
    { name: 'CARGO OFFICE', x: -8, z: 31, y: 0, needs: null },
    { name: 'DEPARTURES', x: -36, z: -2, y: 0, needs: [1] },
    { name: 'THE APRON', x: -24, z: -28, y: 0, needs: [3, 4, 5] },
    { name: 'CUSTOMS', x: 34, z: -2, y: 0, needs: [2] },
  ],
  stash: [
    { gun: 'viper', cost: 1000, x: 11.73, z: 32, y: 0, q: 3 },
    { gun: 'striker', cost: 1300, x: -11.73, z: -8, y: 0, q: 1 },
    { gun: 'breacher', cost: 1500, x: -41.73, z: 3, y: 0, q: 1 },
    { gun: 'marc', cost: 2000, x: 41.73, z: 3, y: 0, q: 3 },
    { gun: 'hailstorm', cost: 2500, x: 29.73, z: -34, y: 0, q: 3 },
  ],
  windows: [{ x: -42, z: 10, y: 0, q: 1 }, { x: -42, z: -4, y: 0, q: 1 }, { x: 42, z: 10, y: 0, q: 3 }, { x: 42, z: -4, y: 0, q: 3 }],
  story: {
    items: [
      { id: 'f1', kind: 'fuse', name: 'TOWER FUSE', at: { x: -8, z: 20, y: 0 } },
      { id: 'f2', kind: 'fuse', name: 'TOWER FUSE', at: { x: -20, z: 0, y: 0 } },
      { id: 'f3', kind: 'fuse', name: 'TOWER FUSE', at: { x: 26, z: -4, y: 0 } },
      { id: 'card', kind: 'card', name: "THE PILOT'S BADGE", at: { x: -24, z: -12, y: 0 }, needs: 'power' },
      { id: 'st1', kind: 'stash', look: 'pallet', name: 'NIGHTSHADE CRATE', at: { x: 36, z: 18, y: 0 } },
      { id: 'st2', kind: 'stash', look: 'pallet', name: 'NIGHTSHADE CRATE', at: { x: -7.6, z: 5, y: 0 } },
      { id: 'st3', kind: 'stash', look: 'pallet', name: 'NIGHTSHADE CRATE', at: { x: 22, z: -23.5, y: 0 } },
      { id: 'jar', kind: 'jar', name: 'THE CURE CANISTERS', at: { x: 20, z: -13, y: 0 }, needs: 'card' },
    ],
    panel: { x: -11.62, z: 18, y: 0 }, cook: { x: 20, z: -20.5, y: 0, secs: 60, need: 9 },
    chapters: [
      { id: 'power', name: 'BLACKOUT', goal: 'find 3 tower fuses and get the power back on at the panel in the baggage hall' },
      { id: 'card', name: "THE PILOT'S BADGE", goal: "take the badge off the pilot's body by the jetway" },
      { id: 'stash', name: 'BURN THE CARGO', goal: 'burn the 3 NIGHTSHADE crates (customs, the baggage carousel, the cargo ramp)' },
      { id: 'blood', name: 'THE BUYER', goal: 'kill the Buyer and take his flight plan' },
      { id: 'jar', name: 'THE CURE', goal: 'take the Green Cure canisters from customs storage' },
      { id: 'cure', name: 'FUEL UP', goal: "pump the cure into Flight 909's spray tanks at the fuel cart and hold them off" },
      { id: 'end', name: 'EPILOGUE', goal: 'survive' },
    ],
    scenes: [
      [['tank', 'Terminal nine. Cargo. And there she is out on the apron. Flight nine oh nine, fat and white and full of Nightshade.'], ['sparks', 'Whole terminal is dark. Tower fuses are gone. Three of them. Find them, I get the lights, the baggage chutes and the gate back.'], ['smokes', 'Baggage chutes? You want us to ride the luggage slides? I love this plan.']],
      [['sparks', 'Power is up! Chutes are live! Departures board says flight nine oh nine is boarding. Boarding who?'], ['doc', 'The plane is locked to crew. We need a pilot\'s badge.'], ['tank', 'The pilot never made it on board. He is by the jetway. What is left of him.']],
      [['doc', 'Got his badge. Captain Rourke. He had a pill bottle in his breast pocket. Nightshade. Of course.'], ['smokes', 'Three crates never got loaded. Customs grabbed one, one is going round on the carousel, one is sitting at the cargo ramp.'], ['tank', 'Then we burn all three before anybody loads them.']],
      [['smokes', 'That is the last crate. You know, I am getting really good at setting fire to my own inventory.'], ['sparks', 'Something just came out of first class. Big. In a very expensive suit.'], ['doc', 'The Buyer. The one Harold was shipping to. He has the flight plan. Every city on the route. Kill him.']],
      [['tank', 'The Buyer is down. Expensive suit, cheap death.'], ['doc', 'The flight plan says every major city. So we use the plane. Load it with the cure instead.'], ['sparks', 'Crop duster style! The plane sprays the cure over every city on the list! I am a genius! Doc is a genius! Everybody is a genius!']],
      [['smokes', 'Canisters. Green as my soul. Let us fill that plane.'], ['doc', 'The fuel cart by the cargo ramp. Pump it into the spray tanks. Sixty seconds.'], ['tank', 'Everybody on the cart. They will hear the pumps from the runway.']],
    ],
    tapes: [
      { at: { x: -2.6, z: 37.5, y: 0 }, title: 'TERMINAL TAPE 1 · THE NIGHT CLERK', lines: [['tank', 'Cargo office night log. Nine pallets in from the Lazarus Works. Paperwork says medical supplies. The pallets are humming.'], ['smokes', 'Pills do not hum. I would know.']] },
      { at: { x: -8, z: 24, y: 0 }, title: 'TERMINAL TAPE 2 · THE BOARD', lines: [['sparks', 'Every flight on the board got cancelled except nine oh nine. Destination: everywhere. That is not a place.'], ['doc', 'It is now.']] },
      { at: { x: -27, z: 9.4, y: 0 }, title: 'TERMINAL TAPE 3 · DUTY FREE', lines: [['smokes', 'Duty free has perfume, chocolate and a three litre bottle of vodka. The apocalypse has perks.'], ['tank', 'Do not drink the vodka.'], ['smokes', 'Too late. It is medicinal.']] },
      { at: { x: -40.5, z: 22, y: 0 }, title: 'TERMINAL TAPE 4 · THE PASSENGERS', lines: [['doc', 'Gate lounge. A hundred people waiting for a flight that was never for them. They were the test. Harold wanted to see how fast it spreads in a crowd.'], ['doc', 'Fast. Very fast.']] },
      { at: { x: 21, z: 2.5, y: 0 }, title: 'TERMINAL TAPE 5 · CUSTOMS', lines: [['tank', 'Customs officer report. Flagged a crate of purple pills. The paperwork had a signature from the Lazarus board.'], ['tank', 'My supervisor said let it through. My supervisor has not been seen since.']] },
      { at: { x: 39, z: 16, y: 0 }, title: 'TERMINAL TAPE 6 · CONFISCATED', lines: [['smokes', 'The confiscation room. Twenty years of seized weed. Ounces, pounds, bricks. This is my Louvre.'], ['sparks', 'Focus, Leroy.'], ['smokes', 'I am focused. I have never been more focused.']] },
      { at: { x: 24, z: -13, y: 0 }, title: 'TERMINAL TAPE 7 · THE DOGS', lines: [['sparks', 'Sniffer dog handler log. The dogs found the crate. The dogs ate the crate. The dogs are not dogs any more.'], ['tank', 'That explains the strays.']] },
      { at: { x: -34, z: -23, y: 0 }, title: 'TERMINAL TAPE 8 · THE APRON', lines: [['doc', 'Ground crew radio. Loading nine oh nine. Buyer on board. He says he took one pill to check the quality.'], ['doc', 'He says he feels incredible. He says he cannot feel anything at all.']] },
      { at: { x: 8, z: -27.2, y: 1.6 }, title: 'TERMINAL TAPE 9 · THE HOLD', lines: [['sparks', 'The plane has spray tanks. Crop duster tanks. On a cargo jet. Why does a cargo jet have spray tanks?'], ['doc', 'Because they were never going to sell it. They were going to spray it.']] },
      { at: { x: -8, z: -24, y: 0 }, title: 'TERMINAL TAPE 10 · THE COCKPIT', lines: [['tank', 'Captain Rourke, cockpit voice recorder. Route is set. Every major city. Dispersal at three thousand feet.'], ['tank', 'Then he says, I am not doing this. Then the recording stops.']] },
      { at: { x: 31.5, z: -29, y: 0 }, title: 'TERMINAL TAPE 11 · THE TOWER', lines: [['smokes', 'Control tower. Last message: nine oh nine, you are not cleared for takeoff. Nine oh nine, respond.'], ['smokes', 'Nobody responded. Well. Something did. It was mostly screaming.']] },
      { at: { x: 10, z: -38.5, y: 0 }, title: 'TERMINAL TAPE 12 · THE RUNWAY', lines: [['doc', 'If we fly it, someone has to land it. Does anyone here have a pilot\'s license?'], ['sparks', 'I watched a video once!'], ['smokes', 'I played a lot of flight simulator. High. Every time.']] },
    ],
    intro: [
      ['doc', 'Flight nine oh nine. Lazarus Air Cargo. Nine pallets of Nightshade bound for every city on the map.'],
      ['tank', 'It leaves at dawn. We stop it here or we stop it nowhere.'],
      ['smokes', 'Airports always make me nervous. Usually because of what is in my pockets.'],
      ['sparks', 'And this time what is in the plane is the problem. Smoke up. Let us ground this thing.'],
    ],
    end: [
      ['sparks', 'Tanks full! Engines hot! Everybody in! Who is flying?'],
      ['smokes', 'I am flying. I am also very, very high. Those two facts are related.'],
      ['doc', 'Three thousand feet. Open the spray tanks. Green Cure over every city on the flight plan.'],
      ['tank', 'Look at that. Green rain. Over the whole city. They are stopping. They are just... sitting down.'],
      ['sparks', 'We cured the world with weed! From a plane! Mom is never going to believe this!'],
      ['smokes', 'Uh, guys. Quick question. How do you land one of these?'],
    ],
    rounds: {
      2: [['tank', 'Baggage claim. Nobody ever picks up their bags. Now I know why.'], ['smokes', 'Some of these bags are very interesting. Very, very interesting.']],
      4: [['sparks', 'Attention passengers. Flight nine oh nine is now boarding. Please have your shotgun ready.'], ['doc', 'Penny, put the intercom down.']],
      6: [['doc', 'The carousel is a perfect loop. Round and round. Like airport security on a bad day.'], ['tank', 'Airport security never had this many biters. Barely.']],
      8: [['smokes', 'If I get through this, I am never flying again. I am driving. Everywhere. Slowly. Stoned.'], ['tank', 'You are never allowed to drive.']],
      10: [['sparks', 'Round ten at the airport! Can we get upgraded to first class?'], ['doc', 'First class is where the Buyer was. Trust me, you do not want first class.']],
      15: [['tank', 'Fifteen rounds and the plane is still on the ground.'], ['smokes', 'Like me. I am also still on the ground. Spiritually, I am at thirty thousand feet.']],
    },
    say: {
      doc: { fuse: 'A tower fuse. Two more and we have lights.', card: 'Captain Rourke. You tried to stop it. Thank you.', stash: 'Burn it. Not one pill gets on that plane.', jar: 'The cure. Enough for a city. Maybe enough for all of them.', blood: 'The flight plan. Every city on the route. We will need it.', cook: 'Pumps on. Sixty seconds. Nobody touches that cart!' },
      tank: { fuse: 'Fuse. Got it. Lights, here we come.', card: 'Pilot\'s badge. We have a plane now.', stash: 'Burn, baby, burn.', jar: 'Canisters secured. Let us go spray some cities.', blood: 'Buyer is done. Got his flight plan.', cook: 'Everybody on the cart! Hold the line!' },
      smokes: { fuse: 'Fuse. Shiny. Like a tiny glowing joint again.', card: 'A pilot\'s badge. I have always wanted to be a pilot. Mostly for the snacks.', stash: 'Goodbye, my sweet purple babies.', jar: 'Look at that green. That is the colour of hope, man.', blood: 'Got his little flight plan. Very organised, for a monster.', cook: 'It is pumping! It is pumping! Shoot things!' },
      sparks: { fuse: 'Fuse! Fuses love me! I keep telling you!', card: 'Badge! We can get on the plane! Is there a toilet on the plane? Asking for me.', stash: 'Fire! Big fire! Airport fire!', jar: 'Cure canisters! Green and glowing! This is the best day!', blood: 'The flight plan! Ooh, it has little drawings!', cook: 'Pumps go! Pressure good! Everybody shoot!' },
    },
    text: {
      title: 'FLIGHT 909', place: 'TERMINAL 9 · ZOMBIES · CHAPTER THREE', introSub: 'SEVEN CHAPTERS · TWELVE TAPES · BAGGAGE CHUTES', introEm: 'it leaves at dawn · ground it, or fly it',
      needPower: 'HE IS BEHIND THE JETWAY GATE · GET THE POWER BACK ON FIRST', needCard: 'LOCKED IN CUSTOMS STORAGE · YOU NEED THE PILOT\'S BADGE', stashLocked: "NIGHTSHADE CRATE · YOU NEED THE PILOT'S BADGE TO OPEN THE CAGE (CHAPTER 2)",
      stashVerb: 'BURN IT', panel: 'POWER PANEL', parts: 'TOWER FUSES', panelDo: 'PUT IN THE FUSES AND GET THE TERMINAL POWER BACK', powerOn: 'POWER IS BACK', powerSub: 'the gates are open · the baggage chutes are live',
      partSub: 'the power panel is in the baggage hall', stashSub: 'burned', jarSub: 'enough cure for every city', bloodSub: 'every city on the route',
      station: 'FUEL CART', cooking: 'FUELLING FLIGHT 909', cookDo: 'PUMP THE CURE INTO THE SPRAY TANKS', cookStay: 'stay near the fuel cart', bar: 'FUELLING FLIGHT 909',
      boss: 'THE BUYER', bossSub: 'he tested the product himself · kill him and take the flight plan', bossDown: 'THE BUYER IS DOWN', bossDownSub: 'take his flight plan', drop: 'THE FLIGHT PLAN', dropLook: 'ledger',
      doneSub: 'chapter three complete · every perk · upgraded gun · 5000 points', cont: 'CHAPTER FOUR', contSub: 'nobody could land it · next stop: MAUI WOWIE',
      keyDone: 'ashfall.zstory.terminal9', keyTapes: 'ashfall.ztapes.terminal9', bossScale: 1.7, bossHp: 7000,
    },
  },
};
ZMAP_LIST.push('terminal9');
try { AUD_PROF.terminal9 = { len: 2.2, pow: 2.6, wet: 0.4, echo: 0.2, dark: 0.35, amb: 'hall', surf: 'tile' }; } catch (e) {}
ZMAPCFG.mauiwowie = {
  chapter: 'CHAPTER FOUR', mapLine: 'start at the crash site · the island is not empty',
  info: 'The plantation house in the middle opens every way. Loop the fountain, the field rows or the curing shed, fix the radio for the COCONUT CANNONS, and find the GUN UPGRADER (5000) inside the lighthouse.',
  doors: [
    { name: 'GARDEN GATE', cost: 1000, ax: 'x', c: 24, a: -3, b: 3, y: 0, h: 4, wide: true, path: true },
    { name: 'THE FIELDS', cost: 1250, ax: 'z', c: -14, a: 12, b: 18, y: 0, h: 4, wide: true },
    { name: 'THE SHEDS', cost: 1250, ax: 'z', c: 14, a: 12, b: 18, y: 0, h: 4, wide: true },
    { name: 'CLIFF PATH', cost: 2000, ax: 'x', c: -10, a: -3, b: 3, y: 0, h: 4, wide: true, path: true },
    { name: 'FIELD TRAIL', cost: 1500, ax: 'x', c: -10, a: -30, b: -26, y: 0, h: 4 },
    { name: 'DOCK TRAIL', cost: 1500, ax: 'x', c: -10, a: 26, b: 30, y: 0, h: 4 },
  ],
  walls: [],
  path: [[0, 31], [0, 27], [0, 23.5], [3.4, 20], [3.4, 13], [1.5, 10], [0, 8], [0, 5], [-2, 2], [0, -1], [0, -4], [0, -7], [0, -10], [0, -14], [0, -19], [0, -24], [0, -27], [0, -29.5], [-0.9, -31]],
  up: { x: -2.6, z: -31, y: 0 }, strips: [[-3.72, -31, 0.04, 7.4], [3.72, -31, 0.04, 7.4]],
  perks: { revive: { x: -13.5, z: 33, y: 0, q: 1 }, double: { x: 13.5, z: 21, y: 0, q: 3 }, quick: { x: -41.5, z: 8, y: 0, q: 1 }, zoom: { x: 41.5, z: 8, y: 0, q: 3 }, tank: { x: -41.5, z: -24, y: 0, q: 1 }, munch: { x: 41.5, z: -24, y: 0, q: 3 } },
  pads: [
    { name: 'CRASH SITE', x: 8, z: 29, y: 0, needs: null },
    { name: 'THE FIELDS', x: -34, z: 22.5, y: 0, needs: [1] },
    { name: 'THE LIGHTHOUSE', x: -10, z: -20, y: 0, needs: [3, 4, 5] },
    { name: 'THE DOCK', x: 37, z: 18, y: 0, needs: [2] },
  ],
  stash: [
    { gun: 'viper', cost: 1000, x: 13.73, z: 29, y: 0, q: 3 },
    { gun: 'striker', cost: 1300, x: -13.73, z: 0, y: 0, q: 1 },
    { gun: 'breacher', cost: 1500, x: -41.73, z: 20, y: 0, q: 1 },
    { gun: 'marc', cost: 2000, x: 41.73, z: 20, y: 0, q: 3 },
    { gun: 'hailstorm', cost: 2500, x: 41.73, z: -34, y: 0, q: 3 },
  ],
  windows: [{ x: -42, z: 16, y: 0, q: 1 }, { x: -42, z: -4, y: 0, q: 1 }, { x: 42, z: 16, y: 0, q: 3 }, { x: 42, z: -4, y: 0, q: 3 }],
  story: {
    items: [
      { id: 'f1', kind: 'fuse', look: 'valve', name: 'RADIO VALVE', at: { x: -7.5, z: 29.5, y: 0 } },
      { id: 'f2', kind: 'fuse', look: 'valve', name: 'RADIO VALVE', at: { x: -27.5, z: 3.25, y: 0 } },
      { id: 'f3', kind: 'fuse', look: 'valve', name: 'RADIO VALVE', at: { x: 24, z: 8, y: 0 } },
      { id: 'card', kind: 'card', look: 'key', name: "THE KEEPER'S KEY", at: { x: 37.5, z: 15.5, y: 0 }, needs: 'power' },
      { id: 'st1', kind: 'stash', look: 'patch', name: 'NIGHTSHADE PATCH', at: { x: -34.5, z: 9.75, y: 0 } },
      { id: 'st2', kind: 'stash', look: 'patch', name: 'NIGHTSHADE PATCH', at: { x: 26, z: -4.5, y: 0 } },
      { id: 'st3', kind: 'stash', look: 'patch', name: 'NIGHTSHADE PATCH', at: { x: 22, z: -30, y: 0 } },
      { id: 'jar', kind: 'jar', name: 'THE CURE SEEDS', at: { x: -32, z: -34.2, y: 0 }, needs: 'card' },
    ],
    panel: { x: -6.62, z: 1.5, y: 0 }, cook: { x: 11, z: -20.5, y: 0, secs: 60, need: 9 },
    chapters: [
      { id: 'power', name: 'MAYDAY', goal: 'find 3 radio valves and fix the radio in the plantation house' },
      { id: 'card', name: "THE KEEPER'S KEY", goal: "take the key off the lighthouse keeper on the dock" },
      { id: 'stash', name: 'SCORCHED EARTH', goal: 'burn the 3 NIGHTSHADE patches (the fields, the curing shed, the hill)' },
      { id: 'blood', name: 'THE GROWER', goal: 'kill the Grower and take his seed book' },
      { id: 'jar', name: 'THE SEED VAULT', goal: 'open the seed vault in the lab and take the cure seeds' },
      { id: 'cure', name: 'PLANT THE CURE', goal: "plant the cure in the keeper's garden by the lighthouse and hold them off" },
      { id: 'end', name: 'EPILOGUE', goal: 'survive' },
    ],
    scenes: [
      [['sparks', 'Okay. Okay. Everybody alive? Count off. I count four. Four is good. Four is everybody.'], ['tank', 'Plane is done. Radio is done. Three valves blew out in the crash. They are scattered all over this island.'], ['smokes', 'An island. A grow island. Look at those fields, man. We crashed into heaven.']],
      [['sparks', 'Radio is talking! Mainland hears us! They say a boat in three days.'], ['doc', 'We will not last three days. The lighthouse is up on the hill. The keeper had a key for everything up there.'], ['tank', 'The keeper is on the dock. Face down. Holding something.']],
      [['doc', 'The keeper had a journal. He says the plantation grew Nightshade from seed. Here. This is where it started.'], ['smokes', 'Three patches still glowing. One in the fields, one in the curing shed, one up the hill.'], ['tank', 'Then we burn the root. All three.']],
      [['smokes', 'That was the last patch. I just burned a whole field of weed on purpose. I need a minute.'], ['sparks', 'Something is coming out of the field. It is wearing a straw hat. It is very tall.'], ['doc', 'The Grower. He made the first seed. He has the seed book. Kill him.']],
      [['tank', 'The Grower is down. He grew his last crop.'], ['doc', 'The seed book. He kept a clean strain in the lab vault. A cure strain. He was afraid of his own plant.'], ['sparks', 'The vault! The key opens the vault! I knew that key was important! It was so shiny!']],
      [['smokes', 'Cure seeds. Tiny. Green. Beautiful. Let us plant some hope, man.'], ['doc', 'The keeper\'s garden by the lighthouse. Good soil. Sixty seconds to get them in the ground.'], ['tank', 'Everybody on the garden. They will smell the fresh dirt from the beach.']],
    ],
    tapes: [
      { at: { x: 3, z: 28.5, y: 0 }, title: 'ISLAND TAPE 1 · THE BLACK BOX', lines: [['tank', 'Flight nine oh nine, black box. Engines failing. Spray tanks empty. Going down over water.'], ['smokes', 'Then a lot of screaming. Mostly me. I recognise my scream.']] },
      { at: { x: -3, z: 6, y: 0 }, title: 'ISLAND TAPE 2 · THE HOUSE', lines: [['doc', 'Plantation house. Family photos on every wall. Everybody smiling. Everybody holding a purple plant.'], ['sparks', 'That is not a nice family photo any more.']] },
      { at: { x: 2.5, z: 19, y: 0 }, title: 'ISLAND TAPE 3 · THE FOUNTAIN', lines: [['smokes', 'Somebody threw coins in the fountain. I threw in a joint. For luck.'], ['tank', 'We crashed a plane. I think we are past luck.']] },
      { at: { x: -40.8, z: 12, y: 0 }, title: 'ISLAND TAPE 4 · THE PICKERS', lines: [['doc', 'Picker log. Workers came from the mainland every summer. Last summer nobody went home.'], ['doc', 'The fields do not need pickers any more. They pick you.']] },
      { at: { x: -21, z: -8.8, y: 0 }, title: 'ISLAND TAPE 5 · THE SCARECROW', lines: [['sparks', 'The scarecrow moved. I am sure the scarecrow moved.'], ['smokes', 'Penny. Scarecrows do not move.'], ['sparks', 'Then why is it facing us now?']] },
      { at: { x: 21, z: 19.8, y: 0 }, title: 'ISLAND TAPE 6 · DRYING', lines: [['smokes', 'A whole shed of buds, drying in the sea breeze. Perfectly cured. I could cry.'], ['tank', 'Half of it is purple, Leroy.'], ['smokes', 'I said I could cry. I did not say happy tears.']] },
      { at: { x: 28.5, z: 2.5, y: 0 }, title: 'ISLAND TAPE 7 · THE CURING SHED', lines: [['tank', 'Shed log. Keep the door shut. Keep the humidity at sixty. Do not breathe near the purple ones.'], ['tank', 'Somebody breathed near the purple ones.']] },
      { at: { x: 40.5, z: -9, y: 0 }, title: 'ISLAND TAPE 8 · THE DOCK', lines: [['doc', 'Shipping log. Every week, one boat out. Seeds to the Lazarus Works. Harold bought the whole crop.'], ['doc', 'Harold did not invent the Nightshade. He just bought it.']] },
      { at: { x: 2.5, z: -29, y: 0 }, title: 'ISLAND TAPE 9 · THE KEEPER', lines: [['sparks', 'Lighthouse keeper diary. He saw the boats leave every week. He never asked what was in them.'], ['tank', 'Then he did ask. That is why he is on the dock.']] },
      { at: { x: 15, z: -18, y: 0 }, title: 'ISLAND TAPE 10 · THE GARDEN', lines: [['smokes', 'The keeper grew tomatoes, basil and one very healthy normal weed plant.'], ['smokes', 'A good man. A gardener. A brother.']] },
      { at: { x: -28.5, z: -27, y: 0 }, title: 'ISLAND TAPE 11 · THE LAB', lines: [['doc', 'The Grower\'s notes. Strain one, purple. Strain two, green. Strain two undoes strain one.'], ['doc', 'He made the cure the same week as the disease. Then he locked it away. Purple sold better.']] },
      { at: { x: 34.5, z: -37, y: 0 }, title: 'ISLAND TAPE 12 · THE MAST', lines: [['tank', 'Radio mast. If the mainland hears us, they come. If the zombies hear us, they come faster.'], ['sparks', 'So we are inviting everybody! Party at the lighthouse!']] },
    ],
    intro: [
      ['sparks', 'We are alive. The plane is not. The plane is very, very not alive.'],
      ['doc', 'An island. A grow plantation. The Nightshade did not start at the Works. It started here.'],
      ['tank', 'So we finish it here. Burn the source, find the cure, get off this rock.'],
      ['smokes', 'Sunset, palm trees, endless fields of weed. If it was not for the zombies, I would never leave.'],
    ],
    end: [
      ['doc', 'They are in the ground. Green shoots already. The cure strain spreads through the soil, faster than the purple ever did.'],
      ['sparks', 'Look! The fields! The purple is going green! Row by row!'],
      ['tank', 'And the island is quiet. First time since we landed. Since we crashed.'],
      ['smokes', 'There is a boat on the horizon. And honestly? I am a little sad.'],
      ['sparks', 'We cured the island with weed! We cured the source! We are legends!'],
      ['smokes', 'Can we at least take a few plants home? For science. Green science.'],
    ],
    rounds: {
      2: [['tank', 'A plantation house. Columns. Veranda. Somebody got rich off this island.'], ['smokes', 'Somebody got very rich and very high. Respect, honestly.']],
      4: [['sparks', 'Sunset on the beach! It is so pretty! Shame about everything else!'], ['doc', 'Enjoy it. It will be dark soon, and they like the dark.']],
      6: [['doc', 'The field rows are a perfect maze. Keep moving, keep them in the lanes.'], ['smokes', 'I have been lost in a weed field before. Different reasons.']],
      8: [['smokes', 'If I get off this island I am becoming a farmer. A normal farmer. Mostly normal.'], ['tank', 'You would smoke the whole crop.']],
      10: [['sparks', 'Round ten on a tropical island! Is this a vacation now?'], ['doc', 'Worst vacation in history. Five stars for the view.']],
      15: [['tank', 'Fifteen rounds. Still no boat.'], ['smokes', 'That is fine. I live here now. I am the island. The island is me.']],
    },
    say: {
      doc: { fuse: 'A radio valve. Two more and we can call for help.', card: 'The keeper\'s key. Rest now, old man.', stash: 'Burn it to the root. No seeds left.', jar: 'The cure seeds. Clean, green and ready.', blood: 'The seed book. Every strain he ever made.', cook: 'Seeds in. Sixty seconds. Nobody steps on my garden!' },
      tank: { fuse: 'Valve. Got it. One step closer to a radio.', card: 'Keeper\'s key. Let us open some doors.', stash: 'Burn the patch.', jar: 'Seeds secured. Let us plant them.', blood: 'Grower is done. Got his book.', cook: 'Everybody on the garden! Hold the line!' },
      smokes: { fuse: 'A valve. It glows. Everything on this island glows.', card: 'A key. To the lighthouse. Very romantic.', stash: 'Goodbye, purple field. You were beautiful and evil.', jar: 'Look at them. Tiny green miracles, man.', blood: 'His little seed book. Very neat handwriting, for a monster.', cook: 'They are growing! They are growing! Shoot things!' },
      sparks: { fuse: 'Valve! Radios love me! Everything loves me!', card: 'A key! Keys are the best! I love keys!', stash: 'Fire! Field fire! Island fire!', jar: 'Seeds! Green and glowing! This is the best day!', blood: 'The seed book! Ooh, it has pressed flowers in it!', cook: 'Grow, little seeds! Grow! Everybody shoot!' },
    },
    text: {
      title: 'LAST HARVEST', place: 'MAUI WOWIE · ZOMBIES · CHAPTER FOUR', introSub: 'SEVEN CHAPTERS · TWELVE TAPES · COCONUT CANNONS', introEm: 'the nightshade started here · finish it here',
      needPower: 'HE IS ON THE DOCK BEHIND THE SHEDS · FIX THE RADIO FIRST', needCard: "LOCKED IN THE SEED VAULT · YOU NEED THE KEEPER'S KEY", stashLocked: "NIGHTSHADE PATCH · YOU NEED THE KEEPER'S KEY FOR THE FIRE STARTER (CHAPTER 2)",
      stashVerb: 'BURN IT', panel: 'THE RADIO', parts: 'RADIO VALVES', panelDo: 'PUT IN THE VALVES AND CALL FOR HELP', powerOn: 'THE RADIO IS WORKING', powerSub: 'the lighthouse is lit · the coconut cannons are live',
      partSub: 'the radio is in the plantation house', stashSub: 'burned', jarSub: 'enough cure for the whole island', bloodSub: 'every strain he ever made',
      station: 'GARDEN BED', cooking: 'PLANTING THE CURE', cookDo: 'PLANT THE CURE SEEDS', cookStay: "stay in the keeper's garden", bar: 'PLANTING THE CURE',
      boss: 'THE GROWER', bossSub: 'he grew the first nightshade seed · kill him and take the seed book', bossDown: 'THE GROWER IS DOWN', bossDownSub: 'take his seed book', drop: 'THE SEED BOOK', dropLook: 'ledger',
      doneSub: 'chapter four complete · every perk · upgraded gun · 5000 points', cont: 'CHAPTER FIVE', contSub: 'there is a boat on the horizon · the MARY JANE',
      keyDone: 'ashfall.zstory.mauiwowie', keyTapes: 'ashfall.ztapes.mauiwowie', bossScale: 1.9, bossHp: 9000,
    },
  },
};
ZMAP_LIST.push('mauiwowie');
try { AUD_PROF.mauiwowie = { len: 1.2, pow: 2.0, wet: 0.2, echo: 0.1, dark: 0.2, amb: 'wind', surf: 'grass' }; } catch (e) {}

/* ---------- THE MARY JANE (chapter five: DEAD CALM) */
ZMAPCFG.maryjane = {
  chapter: 'CHAPTER FIVE', mapLine: 'start on the stern deck · the boat on the horizon',
  info: 'The crew block in the middle opens every way. Loop the mess, the grow containers or the engine room, get the power back for the CARGO SLINGS, and find the GUN UPGRADER (5000) in the forecastle at the bow.',
  doors: [
    { name: 'CREW BLOCK', cost: 1000, ax: 'x', c: 26, a: -3, b: 3, y: 0, h: 4, wide: true, path: true },
    { name: 'PORT DECK', cost: 1250, ax: 'z', c: -10, a: 16, b: 22, y: 0, h: 4, wide: true },
    { name: 'STARBOARD DECK', cost: 1250, ax: 'z', c: 10, a: 16, b: 22, y: 0, h: 4, wide: true },
    { name: 'CARGO DECK', cost: 2000, ax: 'x', c: 12, a: -3, b: 3, y: 0, h: 4, wide: true, path: true },
    { name: 'PORT GANGWAY', cost: 1500, ax: 'x', c: 12, a: -22, b: -18, y: 0, h: 4 },
    { name: 'STARBOARD GANGWAY', cost: 1500, ax: 'x', c: 12, a: 18, b: 22, y: 0, h: 4 },
  ],
  walls: [],
  path: [[0, 34], [0, 30], [0, 27], [0, 24], [0, 19], [0, 15], [0, 12], [0, 9], [0, 4], [0, -1], [0, -6], [0, -11], [0, -16], [0, -21], [0, -26], [0, -31], [0, -35], [-1, -37.4]],
  up: { x: -2.6, z: -39, y: 0 }, strips: [[-5.72, -38.5, 0.04, 6.4], [5.72, -38.5, 0.04, 6.4]],
  perks: { revive: { x: -24.5, z: 28.5, y: 0, q: 1 }, double: { x: 9.5, z: 23.5, y: 0, q: 3 }, quick: { x: -24.5, z: 16, y: 0, q: 1 }, zoom: { x: 24.5, z: 16, y: 0, q: 3 }, tank: { x: -24.5, z: -20, y: 0, q: 1 }, munch: { x: 24.5, z: -20, y: 0, q: 3 } },
  pads: [
    { name: 'THE STERN', x: 12, z: 34.5, y: 0, needs: null },
    { name: 'PORT DECK', x: -16.5, z: 18.5, y: 0, needs: [1] },
    { name: 'THE BOW', x: -10, z: -33, y: 0, needs: [3, 4, 5] },
    { name: 'STARBOARD DECK', x: 17.5, z: 18.5, y: 0, needs: [2] },
  ],
  stash: [
    { gun: 'viper', cost: 1000, x: -16, z: 26.27, y: 0, q: 0 },
    { gun: 'striker', cost: 1300, x: -9.73, z: 14, y: 0, q: 1 },
    { gun: 'breacher', cost: 1500, x: -24.73, z: 13.6, y: 0, q: 1 },
    { gun: 'marc', cost: 2000, x: 24.73, z: 22, y: 0, q: 3 },
    { gun: 'hailstorm', cost: 2500, x: 24.73, z: -10, y: 0, q: 3 },
  ],
  windows: [{ x: -25, z: 19, y: 0, q: 1 }, { x: -25, z: -8, y: 0, q: 1 }, { x: 25, z: 19, y: 0, q: 3 }, { x: 25, z: -8, y: 0, q: 3 }],
  story: {
    items: [
      { id: 'f1', kind: 'fuse', name: 'SHIP FUSE', at: { x: -8, z: 30, y: 0 } },
      { id: 'f2', kind: 'fuse', name: 'SHIP FUSE', at: { x: -18.5, z: 25.2, y: 0 } },
      { id: 'f3', kind: 'fuse', name: 'SHIP FUSE', at: { x: 21, z: 19.5, y: 0 } },
      { id: 'card', kind: 'card', look: 'key', name: "THE CHIEF'S KEY", at: { x: 16, z: -22, y: 0 }, needs: 'power' },
      { id: 'st1', kind: 'stash', look: 'pallet', name: 'NIGHTSHADE SEEDS', at: { x: -17, z: -12, y: 0 } },
      { id: 'st2', kind: 'stash', look: 'pallet', name: 'NIGHTSHADE SEEDS', at: { x: 20, z: 24.6, y: 0 } },
      { id: 'st3', kind: 'stash', look: 'pallet', name: 'NIGHTSHADE SEEDS', at: { x: -11, z: -33, y: 0 } },
      { id: 'jar', kind: 'jar', name: 'THE CURE STRAIN', at: { x: 7, z: 23.6, y: 0 }, needs: 'card' },
    ],
    panel: { x: -9.62, z: 24.2, y: 0 }, cook: { x: 10, z: -33, y: 0, secs: 60, need: 9 },
    chapters: [
      { id: 'power', name: 'DEAD IN THE WATER', goal: 'find 3 ship fuses and get the power back at the panel in the crew block' },
      { id: 'card', name: "THE CHIEF'S KEY", goal: 'take the key off the chief engineer in the engine room' },
      { id: 'stash', name: 'OVERBOARD', goal: 'burn the 3 NIGHTSHADE seed shipments (the grow containers, the starboard deck, the bow)' },
      { id: 'blood', name: 'THE CAPTAIN', goal: 'kill the Captain and take his logbook' },
      { id: 'jar', name: "THE CAPTAIN'S SAFE", goal: "open the safe under the captain's desk and take the cure strain" },
      { id: 'cure', name: 'SEED THE BALLAST', goal: 'pour the cure into the ballast valve at the bow and hold them off' },
      { id: 'end', name: 'EPILOGUE', goal: 'survive' },
    ],
    scenes: [
      [['tank', 'Ship is dark. Engines are cold. We are drifting.'], ['sparks', 'Fuse panel in the crew block is empty! Somebody pulled all three fuses! Who does that? On a ship?'], ['doc', 'Somebody who wanted it to stop. Find them. Stern, port side, starboard side.']],
      [['sparks', 'Power! Lights! The slings are swinging! I love this ship now!'], ['doc', 'The captain kept the seeds behind a lock. The chief engineer had the only other key.'], ['tank', 'Chief is in the engine room. He has not moved in a while.']],
      [['doc', 'The manifest. Three shipments of Nightshade seed. Port of nowhere, port of everywhere. Every city on the list.'], ['smokes', 'One in the grow containers, one on the starboard deck, one up at the bow.'], ['tank', 'Then nothing on this ship reaches land. Burn it all.']],
      [['smokes', 'That was the last of it. A whole ship of seeds, gone. I feel like a firefighter. A very sad firefighter.'], ['sparks', 'Footsteps on the bridge. Heavy ones. Somebody is wearing a captain hat. A big captain hat.'], ['doc', 'The Captain. He sold every crop the Grower made. He has the logbook. Take it.']],
      [['tank', 'The Captain is down. He went down with his ship. Sort of.'], ['doc', 'His log. He kept a sample of the cure strain in his safe. Insurance, he calls it.'], ['sparks', 'The chief\'s key! It opens the safe too! Keys are so useful on boats!']],
      [['smokes', 'The cure strain. A whole jar of green. The island grew it. Now the sea gets it.'], ['doc', 'The ballast valve at the bow. Pour it in, and the ballast water carries it into every port this ship ever touches.'], ['tank', 'Sixty seconds at the valve. Everybody to the bow.']],
    ],
    tapes: [
      { at: { x: 3, z: 36.5, y: 0 }, title: 'SHIP TAPE 1 · BOARDING', lines: [['tank', 'Climbed up the anchor chain of a ship that was full of zombies. On purpose. Write that on my grave.'], ['smokes', 'I climbed up the ladder, Marcus. There was a ladder.']] },
      { at: { x: -2.5, z: 23, y: 0 }, title: 'SHIP TAPE 2 · THE MESS', lines: [['doc', 'Crew mess. Breakfast still on the tables. Nineteen plates. Nineteen crew.'], ['sparks', 'I counted the zombies on deck. I stopped at nineteen.']] },
      { at: { x: -6, z: 39.5, y: 0 }, title: 'SHIP TAPE 3 · THE LIFEBOATS', lines: [['tank', 'Every lifeboat is still on its davits. Nobody tried to leave.'], ['doc', 'Or nobody was able to.']] },
      { at: { x: -12.5, z: 21, y: 0 }, title: 'SHIP TAPE 4 · THE COOK', lines: [['smokes', 'Ship cook\'s notebook. He baked brownies for the crew every Friday. With butter from the cargo.'], ['smokes', 'Purple butter. Oh no. Oh, buddy. Oh no.']] },
      { at: { x: 14.5, z: 21, y: 0 }, title: 'SHIP TAPE 5 · SMOKE BREAK', lines: [['sparks', 'The smoking spot! Ashtray full of joint ends! A party ship!'], ['doc', 'Some of them are purple, Penny.'], ['sparks', 'A sad party ship.']] },
      { at: { x: -17, z: -0.5, y: 0 }, title: 'SHIP TAPE 6 · HOLD 3', lines: [['doc', 'The containers are not cargo. They are grow rooms. The ship grew Nightshade on the way to every port.'], ['tank', 'A farm. A floating farm.']] },
      { at: { x: -21, z: -5, y: 0 }, title: 'SHIP TAPE 7 · THE GROWER\'S LETTER', lines: [['doc', 'A letter from the island. Keep the purple strain warm. Never open the green one. Never.'], ['smokes', 'So we are going to open the green one.']] },
      { at: { x: 9.5, z: -12, y: 0 }, title: 'SHIP TAPE 8 · THE CHIEF', lines: [['tank', 'Engineer\'s log. Captain wants full speed for the mainland. Chief pulled the fuses and hid them.'], ['tank', 'He stopped the ship to stop the cargo. Good man.']] },
      { at: { x: 22.5, z: -24, y: 0 }, title: 'SHIP TAPE 9 · THE ENGINES', lines: [['sparks', 'Two big diesels! Twelve cylinders each! I could fix these with my eyes closed!'], ['smokes', 'Please keep your eyes open, Penny.']] },
      { at: { x: 2.5, z: -9, y: 0 }, title: 'SHIP TAPE 10 · THE CRANE', lines: [['tank', 'Crane log. Containers loaded at the island dock every month. Harold\'s name on every slip.'], ['doc', 'Harold bought the crop. The Captain moved it. The Grower made it. All three of them are gone now.']] },
      { at: { x: 2, z: -40.5, y: 0 }, title: 'SHIP TAPE 11 · THE FORECASTLE', lines: [['sparks', 'Paint locker, rope locker, and a strange purple machine! It hums! It wants a gun!'], ['smokes', 'Everywhere we go, Penny. Everywhere we go there is that machine.']] },
      { at: { x: 12, z: -40, y: 0 }, title: 'SHIP TAPE 12 · THE BOW', lines: [['doc', 'Up here you can see the coast. The lights of the mainland. Thousands of people who never heard of the Nightshade.'], ['tank', 'Let us keep it that way.']] },
    ],
    intro: [
      ['tank', 'The boat on the horizon was no rescue. It is the Mary Jane. The ship that carried the seeds.'],
      ['doc', 'If the Mary Jane reaches the mainland, every port gets the Nightshade. We stop it here.'],
      ['sparks', 'A ship! A whole ship! Engines, cranes, pipes! I am in love!'],
      ['smokes', 'Four stoners on a boat full of weed and zombies. This is either a dream or a nightmare, man.'],
    ],
    end: [
      ['doc', 'It is in the ballast. Every time this ship takes on water or lets it out, the cure goes with it.'],
      ['sparks', 'The containers! The purple plants are turning green! All of them! Hold three is green!'],
      ['tank', 'Engines are off. We drop anchor here and let the coastguard come to us.'],
      ['smokes', 'We did it, man. The island. The ship. The seeds. All of it.'],
      ['doc', 'The logbook says the Mary Jane had a sister ship. Same route. Same cargo.'],
      ['smokes', 'Of course it did. Of course it did, man.'],
    ],
    rounds: {
      2: [['tank', 'Nineteen crew, one cook, one captain. That is a lot of zombies for one boat.'], ['sparks', 'And four of us! We are outnumbered but very charming!']],
      4: [['doc', 'Hear that? The hull groans every time the ship rolls.'], ['smokes', 'That is not the hull, Ana. That is a zombie in a container.']],
      6: [['sparks', 'Containers stacked like building blocks! Zombies stacked like building blocks!'], ['tank', 'Keep moving. Do not get pinned between the stacks.']],
      8: [['smokes', 'I always wanted to go on a cruise. This is not a cruise.'], ['doc', 'Free food, though. The galley is full.']],
      10: [['tank', 'Round ten at sea. Nobody gets seasick on my watch.'], ['smokes', 'I am a little seasick, Marcus. Just a little.']],
      15: [['sparks', 'Fifteen rounds! We should rename the ship! The Mary Jane is now the Penny Jane!'], ['doc', 'Nobody is renaming the ship, Penny.']],
    },
    say: {
      doc: { fuse: 'A ship fuse. The chief hid them well.', card: 'The chief\'s key. You stopped the ship. Thank you.', stash: 'Burn every seed. Nothing reaches land.', jar: 'The cure strain. The Grower\'s green. Finally.', blood: 'The Captain\'s log. Every port, every crop.', cook: 'Cure is in the valve. Sixty seconds. Hold the bow!' },
      tank: { fuse: 'Fuse. One step closer to the lights.', card: 'Chief\'s key. Let us open the captain\'s secrets.', stash: 'Burn it.', jar: 'Cure in hand. To the bow.', blood: 'Captain is done. Got his log.', cook: 'Everybody to the bow! Hold the valve!' },
      smokes: { fuse: 'A fuse. Very small. Very important. Like me.', card: 'A key with a little anchor on it. Cute.', stash: 'Goodbye, seeds. You will never see a city.', jar: 'Green, man. Pure green. I could cry.', blood: 'His log. He wrote in it every day. In a fancy pen.', cook: 'Into the sea! Get well soon, ocean!' },
      sparks: { fuse: 'Fuse! A marine fuse! Waterproof! So pretty!', card: 'A key! A boat key! The best kind of key!', stash: 'Fire on a ship! I know! I know! Very carefully!', jar: 'The cure! It glows! It glows green!', blood: 'The Captain\'s log! It smells like the sea!', cook: 'Ballast valve open! Pour it in! Shoot everything!' },
    },
    text: {
      title: 'DEAD CALM', place: 'THE MARY JANE · ZOMBIES · CHAPTER FIVE', introSub: 'SEVEN CHAPTERS · TWELVE TAPES · CARGO SLINGS', introEm: 'the boat on the horizon · nothing reaches land',
      needPower: 'HE IS IN THE ENGINE ROOM · GET THE POWER BACK FIRST', needCard: "LOCKED IN THE CAPTAIN'S SAFE · YOU NEED THE CHIEF'S KEY", stashLocked: "NIGHTSHADE SEEDS · YOU NEED THE CHIEF'S KEY FOR THE FUEL (CHAPTER 2)",
      stashVerb: 'BURN IT', panel: 'THE FUSE PANEL', parts: 'SHIP FUSES', panelDo: 'PUT IN THE FUSES AND RESTART THE POWER', powerOn: 'THE POWER IS BACK', powerSub: 'the deck lights are on · the cargo slings are live',
      partSub: 'the fuse panel is in the crew block', stashSub: 'burned', jarSub: 'enough cure for every port', bloodSub: 'every port the ship ever touched',
      station: 'BALLAST VALVE', cooking: 'SEEDING THE BALLAST', cookDo: 'POUR THE CURE INTO THE BALLAST', cookStay: 'stay at the ballast valve', bar: 'SEEDING THE BALLAST',
      boss: 'THE CAPTAIN', bossSub: 'he shipped the nightshade to the world · kill him and take his logbook', bossDown: 'THE CAPTAIN IS DOWN', bossDownSub: 'take his logbook', drop: "THE CAPTAIN'S LOG", dropLook: 'ledger',
      doneSub: 'chapter five complete · every perk · upgraded gun · 5000 points', cont: 'TO BE CONTINUED', contSub: 'the mary jane had a sister ship',
      keyDone: 'ashfall.zstory.maryjane', keyTapes: 'ashfall.ztapes.maryjane', bossScale: 2.0, bossHp: 11000,
    },
  },
};
ZMAP_LIST.push('maryjane');
try { AUD_PROF.maryjane = { len: 1.6, pow: 2.2, wet: 0.3, echo: 0.15, dark: 0.3, amb: 'wind', surf: 'metal' }; } catch (e) {}

