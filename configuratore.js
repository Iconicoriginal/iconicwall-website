"use strict";
/* ============================================================
   IconicWall Studio — componi in 2D, ammira in 3D
   ============================================================ */

/* ---------- 1. Regole di sistema IW ---------- */

const FLAT_HEIGHTS = [150, 300, 450, 600, 750, 1200, 1500];
const IW_TYPES = {
  flat:  { label: "Flat",  heights: FLAT_HEIGHTS,        variants: [] },
  lux:   { label: "Lux",   heights: [150, 300, 600, 900], variants: [["LED_B", "LED sotto"], ["LED_T", "LED sopra"], ["LED_TB", "LED sopra e sotto"]] },
  shelf: { label: "Shelf", heights: [300, 450, 600],      variants: [] },
  frame: { label: "Frame", heights: [300, 450, 600],      variants: [] },
  box:   { label: "Box",   heights: [300, 450, 600],      variants: [] },
  board: { label: "Testiera", heights: [600, 750, 900, 1200], variants: [] },
};
const TYPE_ORDER = ["flat", "lux", "shelf", "frame", "box", "board"];
const COL_WIDTHS = [300, 600, 900];
const WALL_HEIGHTS = [2400, 2700, 3000];
const BASELINES = [0, 300, 450, 600, 750, 900, 1050, 1200];
// Il primo pannello in basso può essere Flat oppure Testiera (pensata per
// appoggiarsi al letto quando la parete è sollevata da terra).
const groundOk = (type) => type === "flat" || type === "board";
const MAX_WALL_WIDTH = 6000;
const GAP = 8; // fuga tra i pannelli, in mm

const TYPE_ICONS = {
  flat:  '<svg viewBox="0 0 26 26"><rect x="4" y="4" width="18" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
  lux:   '<svg viewBox="0 0 26 26"><rect x="4" y="4" width="18" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="6" y="17.5" width="14" height="2.5" rx="1.2" fill="#c99b4f"/></svg>',
  shelf: '<svg viewBox="0 0 26 26"><rect x="4" y="4" width="18" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="4" y="15" width="22" height="2.4" rx="1" fill="currentColor"/></svg>',
  frame: '<svg viewBox="0 0 26 26"><rect x="4" y="4" width="18" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="8" y="8" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.4"/></svg>',
  box:   '<svg viewBox="0 0 26 26"><rect x="4" y="4" width="18" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M6 14h14v7H6z" fill="currentColor" opacity=".55"/></svg>',
  board: '<svg viewBox="0 0 26 26"><rect x="4" y="4" width="18" height="18" rx="3" fill="none" stroke="currentColor" stroke-width="1.6"/><line x1="10" y1="5" x2="10" y2="21" stroke="currentColor" stroke-width="1.2" opacity=".65"/><line x1="16" y1="5" x2="16" y2="21" stroke="currentColor" stroke-width="1.2" opacity=".65"/></svg>',
};

/* ---------- 2. Catalogo finiture curato ---------- */

const CATALOG = globalThis.IW_DINOC_CURATED || { groups: [] };
const MAT_BY_CODE = new Map();
CATALOG.groups.forEach((group) => group.materials.forEach((material) => {
  MAT_BY_CODE.set(material.code, Object.assign({ group: group.id }, material));
}));
const ALL_CODES = [...MAT_BY_CODE.keys()];
const firstOfGroup = (id) => CATALOG.groups.find((g) => g.id === id)?.materials[0]?.code || ALL_CODES[0];
const DEFAULT_BASE = MAT_BY_CODE.has("WG-1841") ? "WG-1841" : firstOfGroup("legno");
const DEFAULT_ACCENT = MAT_BY_CODE.has("ST-1920MT") ? "ST-1920MT" : firstOfGroup("pietra");

/* ---------- 3. Riferimenti DOM ---------- */

const $ = (sel) => document.querySelector(sel);
const stageEl = $("#studio-stage");
const svgEl = $("#wall-svg");
const dimsEl = $("#studio-dims");
const popoverEl = $("#panel-editor");
const toastEl = $("#studio-toast");
const coachEl = $("#studio-coach");
const announcerEl = $("#studio-announcer");
const dockEl = $("#studio-dock");
const finishGridEl = $("#finish-grid");
const finishTabsEl = $("#finish-tabs");
const finishHintEl = $("#finish-target-hint");
const envGridEl = $("#env-grid");
const envCatsEl = $("#env-cats");
const colListEl = $("#col-list");
const summaryEl = $("#summary-body");
const requestEl = $("#btn-request");

/* ---------- 4. Stato ---------- */

let state = null;          // { height, env:{type,id}, photo, photoScale, photoX, photoY, cols:[{width,panels:[{type,height,variant,finish}]}] }
let selection = null;      // { c, i } pannello selezionato
let mergeMode = false;     // selezione multipla per "unisci pannelli"
let mergeSel = [];         // [{ c, i }] pannelli candidati all'unione
let techView = false;      // vista "Tavola tecnica": elevazione quotata
let finishMode = "wall";
let activeFinishTab = null;
let activeEnvCat = "casa";
let activeDock = null;
const undoStack = [];
const STORAGE_KEY = "iwStudio.v1";

const clone = (value) => JSON.parse(JSON.stringify(value));

function pushUndo() {
  undoStack.push(clone(state));
  if (undoStack.length > 40) undoStack.shift();
}

function announce(message) {
  if (announcerEl) announcerEl.textContent = message;
}

let toastTimer = null;
function toast(message) {
  toastEl.textContent = message;
  toastEl.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastEl.hidden = true; }, 2100);
  announce(message);
}

/* ---------- 5. Composizione: helper geometrici ---------- */

const colSum = (col) => col.panels.reduce((sum, p) => sum + p.height, 0);
const wallWidth = () => state.cols.reduce((sum, c) => sum + c.width, 0);
// L'altezza scelta è il filo superiore; la quota da terra alza il filo
// inferiore. La quota è PER MODULO (col.baseline); state.baseline resta il
// valore predefinito per i moduli nuovi e per il comando "tutti i moduli".
const wallBaseline = () => state.baseline || 0;
const colBaseline = (col) => (Number.isFinite(col?.baseline) ? col.baseline : wallBaseline());
const colStackHeight = (col) => state.height - colBaseline(col);
// quota minima tra i moduli (filo inferiore più basso della parete)
const minColBaseline = () => (state.cols.length ? Math.min(...state.cols.map(colBaseline)) : 0);
const maxColBaseline = () => (state.cols.length ? Math.max(...state.cols.map(colBaseline)) : 0);
// compat: altezza utile del modulo più basso (usata dove serve un valore unico)
const colHeight = () => state.height - minColBaseline();

// Zona letto (mm dal centro parete): lì la quota non può scendere sotto la
// minima di scena, altrimenti i pannelli si sovrappongono al letto.
function bedZoneRange() {
  const scene = activeScene();
  if (scene) return { range: scene.bedZone || [-980, 980], min: scene.minBaseline || 450 };
  if (state.bed && bedAllowed()) return { range: [-980, 980], min: 450 };
  return null;
}

// Intervallo X del modulo c rispetto al centro parete
function colXRange(c) {
  const W = wallWidth();
  const x0 = colOffsetMm(c) - W / 2;
  return [x0, x0 + state.cols[c].width];
}

function minBaselineFor(c) {
  const zone = bedZoneRange();
  if (!zone) return 0;
  const [x0, x1] = colXRange(c);
  const overlaps = x1 > zone.range[0] && x0 < zone.range[1];
  return overlaps ? zone.min : 0;
}

// Scompone uno spazio (multiplo di 150) in altezze Flat valide, dalla più grande.
function fillFlats(space, finish) {
  const result = [];
  let rest = space;
  const sizes = [...FLAT_HEIGHTS].sort((a, b) => b - a);
  while (rest >= 150) {
    const pick = sizes.find((s) => s <= rest && (rest - s === 0 || rest - s >= 150));
    if (!pick) break;
    result.push({ type: "flat", height: pick, variant: "", finish });
    rest -= pick;
  }
  return result;
}

function columnBaseFinish(col) {
  const counts = new Map();
  col.panels.filter((p) => p.type === "flat").forEach((p) => counts.set(p.finish, (counts.get(p.finish) || 0) + 1));
  let best = null;
  counts.forEach((n, code) => { if (!best || n > counts.get(best)) best = code; });
  return best || currentPalette().base;
}

function currentPalette() {
  const flats = new Map(), feats = new Map();
  state.cols.forEach((col) => col.panels.forEach((p) => {
    const map = p.type === "flat" ? flats : feats;
    map.set(p.finish, (map.get(p.finish) || 0) + 1);
  }));
  const top = (map, fallback) => {
    let best = null;
    map.forEach((n, code) => { if (!best || n > map.get(best)) best = code; });
    return best || fallback;
  };
  const base = top(flats, DEFAULT_BASE);
  return { base, accent: top(feats, DEFAULT_ACCENT === base ? DEFAULT_BASE : DEFAULT_ACCENT) };
}

// Riporta una colonna esattamente alla sua altezza utile (filo superiore
// meno la quota da terra del modulo).
function reconcileColumn(col, height) {
  const H = height || colStackHeight(col);
  while (colSum(col) > H) {
    const top = col.panels[col.panels.length - 1];
    const excess = colSum(col) - H;
    if (top.type === "flat" && top.height > excess) {
      const finish = top.finish;
      col.panels.pop();
      col.panels.push(...fillFlats(top.height - excess, finish));
    } else {
      col.panels.pop();
    }
    if (!col.panels.length) break;
  }
  const missing = H - colSum(col);
  if (missing > 0) col.panels.push(...fillFlats(missing, columnBaseFinish(col)));
}

// Cambia l'altezza di un pannello mantenendo la colonna piena.
function resizePanel(col, index, newHeight) {
  const panel = col.panels[index];
  const diff = newHeight - panel.height;
  if (diff === 0) return true;
  if (diff < 0) {
    panel.height = newHeight;
    const fillers = fillFlats(-diff, columnBaseFinish(col));
    col.panels.splice(index + 1, 0, ...fillers);
    return true;
  }
  // Serve spazio: lo prendiamo dai Flat vicini (prima sopra, poi sotto).
  // Il Flat a terra non può sparire del tutto se sopra resterebbe un pannello
  // speciale: a terra va sempre un Flat.
  let needed = diff;
  const order = [];
  for (let j = index + 1; j < col.panels.length; j++) order.push(j);
  for (let j = index - 1; j >= 0; j--) order.push(j);
  const donors = order.filter((j) => col.panels[j].type === "flat");
  const giveable = (j) => col.panels[j].height - (j === 0 && panel.type !== "flat" && colBaseline(col) === 0 ? 150 : 0);
  const available = donors.reduce((sum, j) => sum + giveable(j), 0);
  if (available < needed) return false;
  const replacements = new Map();
  for (const j of donors) {
    if (needed <= 0) break;
    const donor = col.panels[j];
    const take = Math.min(giveable(j), needed);
    if (take <= 0) continue;
    needed -= take;
    replacements.set(j, donor.height - take > 0 ? fillFlats(donor.height - take, donor.finish) : []);
  }
  [...replacements.keys()].sort((a, b) => b - a).forEach((j) => {
    col.panels.splice(j, 1, ...replacements.get(j));
  });
  const newIndex = col.panels.indexOf(panel);
  panel.height = newHeight;
  if (selection) selection.i = newIndex;
  return true;
}

// Capienza massima raggiungibile da un pannello (propria altezza + Flat sacrificabili).
// Se il pannello non è Flat, il Flat a terra deve conservare almeno 150 mm.
function panelMaxHeight(col, index) {
  const target = col.panels[index];
  return col.panels.reduce((sum, p, j) => {
    if (j === index) return sum + p.height;
    if (p.type !== "flat") return sum;
    const reserve = j === 0 && target.type !== "flat" && colBaseline(col) === 0 ? 150 : 0;
    return sum + p.height - reserve;
  }, 0);
}

// Scambia di posto il pannello con quello adiacente (sopra o sotto).
// Le altezze viaggiano coi pannelli, quindi la colonna resta piena per
// costruzione; l'unico vincolo è che a terra finisca sempre un Flat.
function canMovePanel(col, index, dir) {
  const j = index + dir;
  if (j < 0 || j >= col.panels.length) return false;
  if (Math.min(index, j) === 0 && colBaseline(col) === 0) {
    const groundLander = dir > 0 ? col.panels[j] : col.panels[index];
    if (!groundOk(groundLander.type)) return false;
  }
  return true;
}

function movePanel(col, index, dir) {
  if (!canMovePanel(col, index, dir)) return false;
  const j = index + dir;
  [col.panels[index], col.panels[j]] = [col.panels[j], col.panels[index]];
  return true;
}

// Elimina un pannello: lo spazio viene assorbito dal Flat adiacente
// (prima quello sotto, poi quello sopra) o riempito con Flat nella finitura
// di base della colonna. Il modulo resta sempre completo.
function deletePanel(col, index) {
  const panel = col.panels[index];
  if (!panel) return;
  const below = col.panels[index - 1];
  const above = col.panels[index + 1];
  col.panels.splice(index, 1);
  if (below && below.type === "flat") {
    col.panels.splice(index - 1, 1, ...fillFlats(below.height + panel.height, below.finish));
  } else if (above && above.type === "flat") {
    col.panels.splice(index, 1, ...fillFlats(above.height + panel.height, above.finish));
  } else {
    col.panels.splice(index, 0, ...fillFlats(panel.height, columnBaseFinish(col)));
  }
}

/* ---------- Pannelli uniti (un pannello su più moduli) ----------
   I membri restano nei loro moduli (le regole di colonna continuano a
   valere), ma vengono resi e comandati come un unico pannello. Le famiglie
   ammesse per un pannello unito sono quelle senza modello 3D vincolato al
   modulo: Flat, Lux, Testiera. */

const MERGE_TYPES = ["flat", "lux", "board"];

// Quota ASSOLUTA da terra del filo inferiore del pannello (include la quota
// del modulo): così pannelli su moduli con quote diverse si confrontano bene.
const panelQuota = (c, i) => colBaseline(state.cols[c]) + state.cols[c].panels.slice(0, i).reduce((s, p) => s + p.height, 0);
const colOffsetMm = (c) => state.cols.slice(0, c).reduce((s, col) => s + col.width, 0);

function mergeMembers(id) {
  const out = [];
  state.cols.forEach((col, c) => col.panels.forEach((p, i) => {
    if (p.mergeId === id) out.push({ c, i, panel: p });
  }));
  return out;
}

// Descrive (e implicitamente valida) un gruppo unito: un membro per colonna,
// colonne consecutive, stessa quota e stessa altezza.
function groupInfo(id) {
  const members = mergeMembers(id);
  if (members.length < 2) return null;
  members.sort((a, b) => a.c - b.c);
  for (let k = 0; k < members.length; k++) {
    if (k && members[k].c !== members[k - 1].c + 1) return null;
    if (members.filter((m) => m.c === members[k].c).length !== 1) return null;
  }
  const bottom = panelQuota(members[0].c, members[0].i);
  const height = members[0].panel.height;
  for (const m of members) {
    if (panelQuota(m.c, m.i) !== bottom || m.panel.height !== height) return null;
  }
  return {
    id, members, bottom, height,
    x0: colOffsetMm(members[0].c),
    width: members.reduce((s, m) => s + state.cols[m.c].width, 0),
    panel: members[0].panel,
  };
}

function selectedGroup() {
  const panel = selectedPanel();
  return panel?.mergeId ? groupInfo(panel.mergeId) : null;
}

// Se una modifica strutturale rompe l'allineamento, il gruppo si dissolve
// in pannelli normali (uno per modulo).
function sanitizeMerges() {
  const ids = new Set();
  state.cols.forEach((col) => col.panels.forEach((p) => { if (p.mergeId) ids.add(p.mergeId); }));
  ids.forEach((id) => {
    if (!groupInfo(id)) mergeMembers(id).forEach((m) => { delete m.panel.mergeId; });
  });
}

// La selezione per l'unione deve formare un rettangolo esatto:
// per ogni colonna una fetta contigua, stessa quota e stessa altezza totale.
function validateMergeSelection(sel) {
  const byCol = new Map();
  sel.forEach(({ c, i }) => {
    if (!byCol.has(c)) byCol.set(c, []);
    byCol.get(c).push(i);
  });
  const cols = [...byCol.keys()].sort((a, b) => a - b);
  if (cols.length < 1) return null;
  for (let k = 1; k < cols.length; k++) if (cols[k] !== cols[k - 1] + 1) return null;
  let bottom = null, height = null;
  const slices = [];
  for (const c of cols) {
    const idx = byCol.get(c).sort((a, b) => a - b);
    for (let k = 1; k < idx.length; k++) if (idx[k] !== idx[k - 1] + 1) return null;
    const b = panelQuota(c, idx[0]);
    const h = idx.reduce((s, i) => s + state.cols[c].panels[i].height, 0);
    if (bottom === null) { bottom = b; height = h; }
    else if (b !== bottom || h !== height) return null;
    slices.push({ c, from: idx[0], to: idx[idx.length - 1] });
  }
  if (cols.length === 1 && slices[0].from === slices[0].to) return null; // niente da unire
  return { cols, slices, bottom, height };
}

function applyMerge(valid, firstSel) {
  const first = state.cols[firstSel.c].panels[firstSel.i];
  let type = MERGE_TYPES.includes(first.type) ? first.type : "flat";
  if (valid.bottom === 0 && !groundOk(type)) type = "flat";
  let maxId = 0;
  state.cols.forEach((col) => col.panels.forEach((p) => { if (p.mergeId > maxId) maxId = p.mergeId; }));
  const id = valid.cols.length > 1 ? maxId + 1 : 0;
  for (const s of valid.slices) {
    const panel = {
      type,
      height: valid.height,
      variant: type === "lux" ? (first.variant || "LED_B") : "",
      finish: first.finish,
      grain: panelGrain(first),
    };
    if (id) panel.mergeId = id;
    state.cols[s.c].panels.splice(s.from, s.to - s.from + 1, panel);
  }
  selection = { c: valid.cols[0], i: valid.slices[0].from };
}

function canMoveGroup(info, dir) {
  const heights = [];
  for (const m of info.members) {
    const col = state.cols[m.c];
    const j = m.i + dir;
    if (j < 0 || j >= col.panels.length) return false;
    const neighbor = col.panels[j];
    if (neighbor.mergeId) return false;
    if (dir > 0 && info.bottom === 0 && !groundOk(neighbor.type)) return false;
    heights.push(neighbor.height);
  }
  if (new Set(heights).size !== 1) return false;
  if (dir < 0 && info.bottom - heights[0] === 0 && !groundOk(info.panel.type)) return false;
  return true;
}

function moveGroup(info, dir) {
  if (!canMoveGroup(info, dir)) return false;
  for (const m of info.members) {
    const col = state.cols[m.c];
    [col.panels[m.i], col.panels[m.i + dir]] = [col.panels[m.i + dir], col.panels[m.i]];
  }
  return true;
}

// Garantisce che ogni colonna parta da terra con un Flat (stati caricati da
// link o storage possono arrivare da versioni senza questa regola).
function sanitizeColumns(cols) {
  cols.forEach((col) => {
    const first = col.panels[0];
    if (first && !groundOk(first.type) && colBaseline(col) === 0) {
      col.panels.splice(0, 1, ...fillFlats(first.height, first.finish));
    }
  });
}

/* ---------- 6. Generatore di composizioni ---------- */

let rngSeed = Date.now() % 2147483647;
function rng() {
  rngSeed = (rngSeed * 48271) % 2147483647;
  return (rngSeed - 1) / 2147483646;
}
const pick = (list) => list[Math.floor(rng() * list.length)];

function randomPalette() {
  const group = (id) => CATALOG.groups.find((g) => g.id === id)?.materials.map((m) => m.code) || [];
  const woods = group("legno");
  const baseChoices = rng() < .74 ? woods : [...group("tinta"), ...group("tessuti")];
  const base = pick(baseChoices.length ? baseChoices : ALL_CODES);
  const accentPool = [...group("metallo"), ...group("pietra"), ...group("tessuti"), ...group("astratti"), ...group("tinta")].filter((c) => c !== base);
  const accent = pick(accentPool.length ? accentPool : ALL_CODES);
  return { base, accent };
}

function generateColumn(width, palette, baseline) {
  const b = Number.isFinite(baseline) ? baseline : wallBaseline();
  const H = state.height - b;
  const panels = [];
  const roll = rng();
  if (roll < .16) {
    // colonna "quieta": solo flat, magari in finitura accent
    const finish = rng() < .3 ? palette.accent : palette.base;
    panels.push(...fillFlats(H, finish));
  } else {
    const featureType = pick(roll < .5 ? ["shelf", "lux"] : ["shelf", "lux", "frame", "box"]);
    const featureHeight = featureType === "lux" ? pick([300, 600]) : pick(IW_TYPES[featureType].heights);
    const belowChoices = [750, 900, 1050, 1200].filter((b) => b + featureHeight <= H - 150);
    const below = belowChoices.length ? pick(belowChoices) : 750;
    const variant = featureType === "lux" ? pick(["LED_B", "LED_T", "LED_TB"]) : "";
    const featureFinish = featureType === "lux" && rng() < .45 ? palette.base : palette.accent;
    panels.push(...fillFlats(below, palette.base));
    panels.push({ type: featureType, height: featureHeight, variant, finish: featureFinish });
    const above = H - below - featureHeight;
    // ogni tanto un secondo elemento sopra
    if (above >= 1050 && rng() < .22) {
      const second = pick(["lux", "frame"]);
      const secondHeight = 300;
      const spacer = 450;
      panels.push(...fillFlats(spacer, palette.base));
      panels.push({ type: second, height: secondHeight, variant: second === "lux" ? "LED_B" : "", finish: palette.accent });
      panels.push(...fillFlats(above - spacer - secondHeight, palette.base));
    } else {
      panels.push(...fillFlats(above, palette.base));
    }
  }
  return { width, panels };
}

function shuffleComposition() {
  const palette = randomPalette();
  state.cols = state.cols.map((col) => {
    const b = colBaseline(col);
    const fresh = generateColumn(col.width, palette, b);
    fresh.baseline = b; // la quota del modulo sopravvive al rimescolamento
    return fresh;
  });
}

function defaultState() {
  const base = DEFAULT_BASE, accent = DEFAULT_ACCENT;
  return {
    height: 2700,
    baseline: 0,
    bed: false,
    env: { type: "preset", id: "living" },
    photo: null, photoScale: 100, photoX: 0, photoY: 0,
    cols: [
      { width: 600, panels: [...fillFlats(2700, base)] },
      { width: 900, panels: [
        ...fillFlats(900, base),
        { type: "shelf", height: 450, variant: "", finish: accent },
        ...fillFlats(1350, base),
      ] },
      { width: 600, panels: [
        ...fillFlats(1050, base),
        { type: "lux", height: 600, variant: "LED_TB", finish: accent },
        ...fillFlats(1050, base),
      ] },
      { width: 300, panels: [...fillFlats(2700, accent)] },
    ],
  };
}

/* ---------- 7. Ambienti illustrati ---------- */

const ENVIRONMENTS = [
  { id: "living",     label: "Living",      cat: "casa",     wall: "#cfc8bb", floor: "#b4a68f", glow: "#f3e6cd" },
  { id: "cucina",     label: "Cucina",      cat: "casa",     wall: "#d3cec6", floor: "#a9a49a", glow: "#f1ead9" },
  { id: "camera",     label: "Camera",      cat: "casa",     wall: "#c9c2b8", floor: "#a08b74", glow: "#efe0c8" },
  { id: "ingresso",   label: "Ingresso",    cat: "casa",     wall: "#d6d0c5", floor: "#b1a894", glow: "#f4ecda" },
  { id: "hotel",      label: "Hotel",       cat: "contract", wall: "#c6bdb0", floor: "#8d7f6d", glow: "#f0dfc2" },
  { id: "ufficio",    label: "Ufficio",     cat: "contract", wall: "#d0cdc7", floor: "#9fa09b", glow: "#eee9dc" },
  { id: "retail",     label: "Retail",      cat: "contract", wall: "#cec9c2", floor: "#97918a", glow: "#f2e8d4" },
  { id: "ristorante", label: "Ristorante",  cat: "contract", wall: "#c2b9ab", floor: "#84766a", glow: "#eeddc0" },
];
const ENV_CATS = [["casa", "Casa"], ["contract", "Spazi pubblici"]];

function envById(id) {
  return ENVIRONMENTS.find((e) => e.id === id) || ENVIRONMENTS[0];
}

/* ---------- Scene fotografiche calibrate ----------
   Ogni scena è una fotografia frontale con calibrazione misurata a mano:
   pxPerMm (scala della parete di fondo), floorY/cx (aggancio pavimento e
   centro in pixel immagine), minBaseline (la parete parte sopra la testiera),
   light (direzione della luce per la velatura), backdrop (tono dei margini). */

const PHOTO_SCENES = [
  {
    id: "camera-hotel-1", cat: "contract", label: "Camera hotel · Caldo",
    src: "assets/configurator/backgrounds/camera-hotel-1.webp",
    w: 2528, h: 1696, pxPerMm: .5063, cx: 1264, floorY: 1512,
    // 900, non 1050: nella ¾ la testiera proietta a 955-1056 mm (parallasse)
    // e i moduli devono infilarsi DIETRO la sua sagoma, mai galleggiarci sopra
    minBaseline: 900, defaultBaseline: 900, light: "left", backdrop: "#cbc4b6",
    // confini fisici del muro NELLA FOTO FRONTALE (≠ quad34.bounds: le due
    // inquadrature AI non coincidono): angoli stanza a px 150 / 2372
    fbounds: [-2200, 2180],
    // primo piano frontale: testiera a tutta larghezza (la parete parte
    // sopra) + cappelli delle lampade che sporgono oltre la linea
    occl: [
      [[142, 1001], [632, 998], [1264, 995], [1896, 990], [2400, 993], [2410, 1696], [140, 1696]],
      [[428, 972], [590, 968], [593, 1080], [425, 1084]],
      [[1952, 972], [2111, 968], [2114, 1076], [1948, 1081]],
    ],
    // vista ¾: quadrilatero (px) del rettangolo di parete X ±1650 mm, Y 0–2700
    quad34: {
      src: "assets/configurator/backgrounds/camera-hotel-1-34.webp",
      w: 2528, h: 1696,
      corners: [[611, 155], [2105, 273], [2105, 1375], [611, 1503]],
      // nel ¾ il muro corre fino al bordo foto a destra (niente angolo
      // visibile): misurato via omografia inversa il 23/07
      bounds: [-2480, 2300],
      shade: { dir: 1, strength: .16 },
      // primo piano ¾: testiera (finisce a px 2056) + comodino + letto + lampade
      occl: [
        [[99, 1026], [506, 1015], [1011, 1007], [1517, 1000], [1827, 969], [1981, 954], [2056, 945], [2060, 1131], [2165, 1127], [2177, 1240], [2335, 1269], [2475, 1375], [2480, 1696], [0, 1696], [95, 1280]],
        [[487, 974], [655, 967], [660, 1103], [484, 1117]],
        [[1799, 947], [1943, 939], [1947, 1051], [1803, 1060]],
        [[1866, 1052], [1878, 1052], [1884, 1150], [1872, 1150]],
      ],
    },
    room3d: {
      floorTex: "DW-2476MT", wall: 0xcfc8ba, side: 0xd8d2c6, ceiling: 0xece8e0,
      bed: { frame: 0x6e4f35, linen: 0xefe9dc, pillow: 0xf5f0e5, runner: 0xa98a63, nightstand: 0x6e4f35 },
      lamps: { on: true, color: 0xffd8a0, intensity: 2.2 },
      window: "left",
      light: { hemi: 1.9, hemiColor: 0xfff4e2, key: 2.6, keyColor: 0xffeed2, keyPos: [-5, 5, 6], warm: 6 },
    },
  },
  {
    id: "camera-hotel-2", cat: "contract", label: "Camera hotel · Chiaro",
    src: "assets/configurator/backgrounds/camera-hotel-2.webp",
    w: 2528, h: 1696, pxPerMm: .462, cx: 1264, floorY: 1373,
    minBaseline: 750, defaultBaseline: 750, light: "left", backdrop: "#e8e6e1",
    // muro frontale: dalla spalletta della finestra (px 250) oltre il bordo foto
    fbounds: [-2190, 2700],
    // primo piano che occlude la parete (px foto frontale): letto, lampade,
    // comodini con gambe — tracciati su crop 2-3x, rifiniti con edge-snap;
    // regola: sul bianco-su-bianco il bordo sta 2-3 px DENTRO la sagoma
    // (meglio mangiare un filo di cuscino che alonare i pannelli)
    occl: [
      [[566, 1591], [562, 1500], [568, 1425], [573, 1407], [607, 1354], [645, 1313], [688, 1271], [735, 1236], [779, 1204], [800, 1198], [798, 1120], [796, 1034], [816, 1020], [844, 1008], [880, 992], [912, 983], [955, 978], [1005, 977], [1050, 981], [1085, 988], [1130, 997], [1163, 1000], [1205, 990], [1270, 982], [1350, 980], [1450, 980], [1530, 984], [1600, 996], [1650, 1010], [1700, 1022], [1737, 1030], [1747, 1042], [1756, 1080], [1758, 1122], [1785, 1160], [1822, 1206], [1853, 1256], [1891, 1301], [1919, 1343], [1941, 1385], [1953, 1422], [1966, 1475], [1965, 1540], [1966, 1592]],
      [[581, 889], [617, 910], [655, 935], [676, 955], [668, 970], [624, 968], [594, 959], [585, 930], [580, 900]],
      [[595, 952], [602, 952], [592, 1106], [585, 1106]],
      [[577, 1122], [590, 1108], [628, 1102], [660, 1114], [656, 1127], [590, 1130]],
      [[474, 1132], [770, 1133], [770, 1222], [474, 1222]],
      [[452, 1140], [463, 1140], [466, 1384], [455, 1384]],
      [[476, 1218], [486, 1218], [500, 1388], [490, 1388]],
      [[450, 1377], [566, 1384], [566, 1397], [450, 1387]],
      [[1946, 879], [1950, 900], [1936, 960], [1900, 982], [1852, 978], [1838, 966], [1890, 922]],
      [[1924, 906], [1931, 906], [1950, 1114], [1943, 1114]],
      [[1882, 1128], [1900, 1112], [1962, 1108], [2000, 1120], [1996, 1130], [1890, 1132]],
      [[1770, 1130], [2085, 1130], [2085, 1225], [1770, 1225]],
      [[1969, 1222], [1979, 1222], [1984, 1392], [1973, 1392]],
      [[2052, 1222], [2062, 1222], [2066, 1358], [2056, 1358]],
      [[1971, 1383], [2060, 1348], [2064, 1358], [1978, 1394]],
    ],
    quad34: {
      src: "assets/configurator/backgrounds/camera-hotel-2-34.webp",
      w: 2528, h: 1696,
      // corner destri rivisti sul giunto soffitto reale (y≈110 a px 2029)
      corners: [[706, 168], [2029, 117], [2029, 1307], [706, 1221]],
      bounds: [-2500, 2450],
      shade: { dir: -1, strength: .1 },
      // primo piano nella vista ¾ (px foto): letto, comodini con gambe a
      // slitta, lampade — coordinate verificate su crop 2x con griglia
      occl: [
        [[356, 1540], [355, 1420], [356, 1310], [356, 1298], [363, 1282], [374, 1258], [388, 1236], [422, 1212], [450, 1200], [529, 1154], [600, 1138], [660, 1124], [707, 1115], [771, 1094], [834, 1078], [891, 1048], [942, 1015], [1030, 993], [1140, 996], [1240, 1008], [1283, 1014], [1330, 1007], [1450, 1000], [1520, 1008], [1594, 1025], [1690, 1052], [1740, 1058], [1774, 1063], [1785, 1082], [1786, 1210], [1786, 1447], [1706, 1560], [1574, 1710], [1138, 1685], [758, 1635], [506, 1584]],
        [[546, 1092], [672, 1086], [704, 1104], [704, 1131], [546, 1130]],
        [[719, 866], [733, 879], [789, 954], [788, 964], [694, 963], [712, 884]],
        [[727, 958], [735, 958], [724, 1092], [715, 1092]],
        [[700, 1086], [800, 1086], [800, 1100], [700, 1100]],
        [[1815, 1144], [1844, 1127], [2083, 1121], [2090, 1130], [2090, 1201], [1818, 1212]],
        [[1818, 1213], [1827, 1213], [1820, 1398], [1811, 1398]],
        [[1844, 1212], [1852, 1212], [1848, 1368], [1840, 1368]],
        [[1812, 1392], [1840, 1362], [1847, 1370], [1819, 1400]],
        [[2064, 1198], [2072, 1198], [2080, 1412], [2072, 1414]],
        [[2106, 1196], [2114, 1196], [2118, 1378], [2110, 1378]],
        [[2072, 1406], [2110, 1372], [2116, 1380], [2078, 1414]],
        [[1992, 875], [1999, 892], [1975, 984], [1891, 977], [1893, 961]],
        [[1962, 983], [1970, 983], [1996, 1137], [1988, 1137]],
        [[1912, 1140], [1930, 1130], [2000, 1128], [2014, 1138], [2010, 1148], [1918, 1150]],
      ],
    },
    room3d: {
      floorTex: "CN-1622", wall: 0xefedea, side: 0xf2f0ec, ceiling: 0xf6f4f1,
      bed: { frame: 0xb9b5ae, linen: 0xf2f1ee, pillow: 0xfafafa, runner: 0xd9d5cd, nightstand: 0xfbfbfb },
      lamps: { on: false, color: 0xffffff, intensity: 0 },
      window: "left",
      light: { hemi: 2.6, hemiColor: 0xffffff, key: 2.2, keyColor: 0xf2f6ff, keyPos: [-5, 6, 5], warm: 2 },
    },
  },
  {
    id: "camera-hotel-3", cat: "contract", label: "Camera hotel · Sera",
    src: "assets/configurator/backgrounds/camera-hotel-3.webp",
    w: 2528, h: 1696, pxPerMm: .49, cx: 1264, floorY: 1487,
    // 750, non 1050: la sagoma ¾ della testiera proietta a 825-1018 mm
    minBaseline: 750, defaultBaseline: 750, light: "left", backdrop: "#232019",
    // muro frontale: dal filo tende (px 205) all'angolo destro (px 2340)
    fbounds: [-2160, 2190],
    // primo piano frontale: testiera a tutta larghezza; lampade e letto
    // restano sotto la sua linea (un solo poligono)
    occl: [
      [[149, 965], [632, 966], [1264, 968], [1896, 973], [2480, 979], [2484, 1696], [145, 1696]],
    ],
    quad34: {
      src: "assets/configurator/backgrounds/camera-hotel-3-34.webp",
      w: 2528, h: 1696,
      corners: [[365, 97], [1940, 234], [1940, 1338], [365, 1482]],
      // muro visibile dal filo tenda (px 195 = -1930) fino oltre il bordo
      // foto a destra: prima si buttava via oltre un metro di parete
      bounds: [-1930, 3400],
      shade: { dir: 1, strength: .22 },
      // primo piano ¾: idem, un solo poligono a tutta larghezza
      occl: [
        [[192, 964], [758, 968], [1390, 974], [2022, 980], [2417, 983], [2422, 1696], [190, 1696]],
      ],
    },
    room3d: {
      floorTex: "FW-1127", wall: 0x4a453f, side: 0x413c36, ceiling: 0x26221d,
      bed: { frame: 0x4a3a30, linen: 0x413b34, pillow: 0x4a423a, runner: 0x8a6f4e, nightstand: 0x5a4433 },
      lamps: { on: true, color: 0xffc27a, intensity: 3.2 },
      window: null,
      light: { hemi: .5, hemiColor: 0xcdb9a0, key: .55, keyColor: 0xffdcae, keyPos: [-3, 4, 6], warm: 5 },
    },
  },
];

function sceneById(id) {
  return PHOTO_SCENES.find((s) => s.id === id) || null;
}

function activeScene() {
  return state.env.type === "scene" ? sceneById(state.env.id) : null;
}

// Il letto centrato ha senso solo dove c'è un letto: camera, hotel o la
// foto dell'utente. Negli altri ambienti non viene né mostrato né proposto.
function bedAllowed() {
  if (state.env.type === "scene") return false; // la foto ha già il suo letto
  // il letto ci sta solo se i moduli sopra di lui sono sollevati abbastanza
  if (bedZoneBaseline() < 450) return false;
  if (state.env.type === "photo" && state.photo) return true;
  return state.env.id === "camera" || state.env.id === "hotel";
}

// Quota più bassa tra i moduli che stanno sopra la zona letto.
function bedZoneBaseline() {
  const zoneCols = state.cols.filter((col, c) => {
    const [x0, x1] = colXRange(c);
    return x1 > -980 && x0 < 980;
  });
  return zoneCols.length ? Math.min(...zoneCols.map(colBaseline)) : maxColBaseline();
}

// Scena dietro la parete (muro, pavimento, luci) e davanti (silhouette d'arredo).
function envBack(env, VW, VH, FY) {
  const parts = [];
  parts.push(`<rect x="0" y="0" width="${VW}" height="${FY}" fill="${env.wall}"/>`);
  parts.push(`<rect x="0" y="0" width="${VW}" height="${FY}" fill="url(#env-wall-shade)"/>`);
  parts.push(`<rect x="0" y="${FY}" width="${VW}" height="${VH - FY}" fill="${env.floor}"/>`);
  parts.push(`<rect x="0" y="${FY}" width="${VW}" height="${VH - FY}" fill="url(#env-floor-shade)"/>`);
  parts.push(`<rect x="0" y="${FY - 26}" width="${VW}" height="26" fill="rgba(17,17,15,.16)"/>`);
  // finestra / taglio di luce laterale
  const wx = VW - 760;
  parts.push(`<g opacity=".85"><rect x="${wx}" y="${FY - 2350}" width="520" height="1900" fill="${env.glow}"/>
    <rect x="${wx}" y="${FY - 2350}" width="520" height="1900" fill="none" stroke="rgba(17,17,15,.28)" stroke-width="14"/>
    <line x1="${wx + 260}" y1="${FY - 2350}" x2="${wx + 260}" y2="${FY - 450}" stroke="rgba(17,17,15,.22)" stroke-width="10"/>
    <line x1="${wx}" y1="${FY - 1400}" x2="${wx + 520}" y2="${FY - 1400}" stroke="rgba(17,17,15,.22)" stroke-width="10"/></g>`);
  parts.push(`<rect x="${wx - 90}" y="${FY}" width="700" height="${VH - FY}" fill="${env.glow}" opacity=".2"/>`);
  if (env.id === "cucina" || env.id === "ristorante") {
    // lampade a sospensione
    for (const lx of [430, 850]) {
      parts.push(`<g><line x1="${lx}" y1="0" x2="${lx}" y2="560" stroke="rgba(17,17,15,.5)" stroke-width="8"/>
        <path d="M${lx - 130} 700 A130 130 0 0 1 ${lx + 130} 700 Z" fill="rgba(24,22,20,.78)"/>
        <ellipse cx="${lx}" cy="705" rx="86" ry="26" fill="${env.glow}" opacity=".9"/></g>`);
    }
  }
  if (env.id === "hotel") {
    parts.push(`<rect x="120" y="0" width="150" height="${FY}" fill="rgba(17,17,15,.18)"/>`);
    parts.push(`<rect x="${VW - 1020}" y="0" width="150" height="${FY}" fill="rgba(17,17,15,.12)"/>`);
    parts.push(`<ellipse cx="330" cy="${FY - 1750}" rx="60" ry="120" fill="${env.glow}" opacity=".75"/>`);
  }
  if (env.id === "ufficio") {
    parts.push(`<g stroke="rgba(17,17,15,.2)" stroke-width="10" opacity=".8">
      <line x1="60" y1="${FY - 2200}" x2="60" y2="${FY}"/><line x1="360" y1="${FY - 2200}" x2="360" y2="${FY}"/>
      <line x1="40" y1="${FY - 2200}" x2="380" y2="${FY - 2200}"/><line x1="40" y1="${FY - 1150}" x2="380" y2="${FY - 1150}"/></g>`);
  }
  if (env.id === "retail") {
    parts.push(`<g opacity=".85"><path d="M300 130 L390 130 L470 620 L220 620 Z" fill="${env.glow}" opacity=".5"/>
      <circle cx="345" cy="120" r="46" fill="rgba(24,22,20,.8)"/></g>`);
  }
  return `<g>${parts.join("")}</g>`;
}

function envFront(env, VW, VH, FY, options = {}) {
  const dark = "rgba(28,26,23,.86)";
  const mid = "rgba(28,26,23,.5)";
  const parts = [];
  const rugW = Math.min(2600, VW * .44);
  parts.push(`<ellipse cx="${VW / 2}" cy="${FY + 190}" rx="${rugW / 2}" ry="120" fill="rgba(17,17,15,.1)"/>`);
  // col letto centrato attivo, la camera non disegna il proprio letto di scena
  if (env.id === "camera" && options.hideBed) {
    parts.push(`<rect x="0" y="0" width="${VW}" height="${VH}" fill="url(#env-vignette)" pointer-events="none"/>`);
    return `<g pointer-events="none">${parts.join("")}</g>`;
  }
  switch (env.id) {
    case "living":
      parts.push(`<g fill="${dark}"><rect x="-140" y="${FY - 700}" width="1120" height="450" rx="90"/>
        <rect x="-140" y="${FY - 900}" width="330" height="420" rx="80"/>
        <rect x="30" y="${FY - 260}" width="120" height="260" rx="24"/><rect x="760" y="${FY - 260}" width="120" height="260" rx="24"/></g>
        <g><ellipse cx="${VW - 330}" cy="${FY - 1250}" rx="260" ry="330" fill="rgba(52,66,44,.85)"/>
        <rect x="${VW - 380}" y="${FY - 960}" width="100" height="960" fill="${dark}"/>
        <path d="M${VW - 470} ${FY} l190 0 l-28 190 l-134 0 Z" fill="${dark}"/></g>`);
      break;
    case "cucina":
      parts.push(`<g><rect x="-60" y="${FY - 950}" width="1500" height="950" fill="${dark}"/>
        <rect x="-60" y="${FY - 990}" width="1560" height="60" fill="rgba(60,56,50,.95)"/>
        <rect x="90" y="${FY - 830}" width="420" height="330" rx="14" fill="rgba(255,255,255,.06)"/>
        <rect x="610" y="${FY - 830}" width="420" height="330" rx="14" fill="rgba(255,255,255,.06)"/></g>`);
      break;
    case "camera":
      parts.push(`<g><rect x="-100" y="${FY - 620}" width="1750" height="620" rx="60" fill="${dark}"/>
        <rect x="60" y="${FY - 760}" width="620" height="220" rx="60" fill="rgba(240,234,222,.92)"/>
        <rect x="780" y="${FY - 745}" width="620" height="205" rx="60" fill="rgba(240,234,222,.8)"/>
        <rect x="-100" y="${FY - 300}" width="1750" height="300" fill="rgba(210,198,178,.9)" rx="40"/></g>`);
      break;
    case "ingresso":
      parts.push(`<g><rect x="${VW - 1150}" y="${FY - 900}" width="880" height="80" fill="${dark}"/>
        <rect x="${VW - 1110}" y="${FY - 820}" width="60" height="820" fill="${dark}"/>
        <rect x="${VW - 420}" y="${FY - 820}" width="60" height="820" fill="${dark}"/>
        <ellipse cx="${VW - 710}" cy="${FY - 1010}" rx="130" ry="95" fill="rgba(52,66,44,.8)"/></g>`);
      break;
    case "hotel":
      parts.push(`<g fill="${dark}"><rect x="-120" y="${FY - 640}" width="760" height="420" rx="120"/>
        <rect x="700" y="${FY - 640}" width="760" height="420" rx="120"/>
        <rect x="-120" y="${FY - 240}" width="760" height="240" rx="30"/><rect x="700" y="${FY - 240}" width="760" height="240" rx="30"/></g>
        <circle cx="620" cy="${FY - 850}" r="90" fill="rgba(201,155,79,.65)"/>`);
      break;
    case "ufficio":
      parts.push(`<g><rect x="-80" y="${FY - 760}" width="1500" height="70" fill="${dark}"/>
        <rect x="60" y="${FY - 690}" width="70" height="690" fill="${dark}"/><rect x="1240" y="${FY - 690}" width="70" height="690" fill="${dark}"/>
        <rect x="240" y="${FY - 1060}" width="560" height="310" rx="20" fill="${mid}"/></g>`);
      break;
    case "retail":
      parts.push(`<g fill="${dark}"><rect x="60" y="${FY - 520}" width="520" height="520" rx="16"/>
        <rect x="${VW - 640}" y="${FY - 760}" width="440" height="760" rx="16" opacity=".92"/></g>
        <ellipse cx="320" cy="${FY - 560}" rx="130" ry="34" fill="rgba(240,223,194,.8)"/>`);
      break;
    case "ristorante":
      parts.push(`<g><circle cx="560" cy="${FY - 20}" r="360" fill="rgba(240,234,222,.9)"/>
        <rect x="520" y="${FY - 40}" width="80" height="480" fill="${dark}"/>
        <g fill="${dark}"><rect x="120" y="${FY - 660}" width="90" height="640" rx="30"/><rect x="900" y="${FY - 660}" width="90" height="640" rx="30"/>
        <rect x="90" y="${FY - 700}" width="950" height="60" rx="28" opacity=".55"/></g></g>`);
      break;
  }
  parts.push(`<rect x="0" y="0" width="${VW}" height="${VH}" fill="url(#env-vignette)" pointer-events="none"/>`);
  return `<g pointer-events="none">${parts.join("")}</g>`;
}

/* ---------- 8. Rendering SVG della parete ---------- */

const VIEW_H = 3200;
const FLOOR_Y = 2900;

function svgDefs(VW) {
  const defs = [];
  defs.push(`<linearGradient id="env-wall-shade" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="rgba(17,17,15,.22)"/><stop offset=".35" stop-color="rgba(17,17,15,0)"/>
    <stop offset="1" stop-color="rgba(17,17,15,.1)"/></linearGradient>`);
  defs.push(`<linearGradient id="env-floor-shade" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="rgba(17,17,15,.28)"/><stop offset="1" stop-color="rgba(255,255,255,.08)"/></linearGradient>`);
  defs.push(`<radialGradient id="env-vignette" cx=".5" cy=".42" r=".85">
    <stop offset=".62" stop-color="rgba(17,17,15,0)"/><stop offset="1" stop-color="rgba(17,17,15,.2)"/></radialGradient>`);
  defs.push(`<linearGradient id="led-glow" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#ffe7b8"/><stop offset="1" stop-color="#f0b96a"/></linearGradient>`);
  defs.push(`<filter id="soft-led" x="-80%" y="-400%" width="260%" height="900%">
    <feGaussianBlur stdDeviation="26"/></filter>`);
  defs.push(`<filter id="wall-shadow" x="-20%" y="-10%" width="140%" height="130%">
    <feDropShadow dx="0" dy="26" stdDeviation="46" flood-color="#11110f" flood-opacity=".38"/></filter>`);
  defs.push(`<filter id="panel-shadow" x="-30%" y="-30%" width="160%" height="160%">
    <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#11110f" flood-opacity=".28"/></filter>`);
  // Luce unica e coerente sull'intera parete, dal lato della luce di scena:
  // i riflessi "per pannello" delle miniature renderebbero la parete finta.
  const lightLeft = activeScene()?.light === "left";
  defs.push(`<linearGradient id="wall-sheen" x1="${lightLeft ? 0 : 1}" y1="0" x2="${lightLeft ? 1 : 0}" y2="1">
    <stop offset="0" stop-color="rgba(255,255,255,.16)"/>
    <stop offset=".45" stop-color="rgba(255,255,255,0)"/>
    <stop offset="1" stop-color="rgba(17,17,15,.14)"/></linearGradient>`);
  // Bisello: bordo alto illuminato e bordo basso in ombra, come un pannello
  // con spessore reale.
  defs.push(`<linearGradient id="panel-bevel" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="rgba(255,255,255,.15)"/>
    <stop offset=".06" stop-color="rgba(255,255,255,0)"/>
    <stop offset=".93" stop-color="rgba(17,17,15,0)"/>
    <stop offset="1" stop-color="rgba(17,17,15,.22)"/></linearGradient>`);
  // Un pattern per ogni combinazione finitura+verso effettivamente in parete.
  const combos = new Set();
  state.cols.forEach((col) => col.panels.forEach((p) => combos.add(`${p.finish}|${panelGrain(p)}`)));
  combos.forEach((combo) => {
    const [code, grain] = combo.split("|");
    const mat = MAT_BY_CODE.get(code);
    if (mat) defs.push(finishPatternSVG(mat, grain));
  });
  return `<defs>${defs.join("")}</defs>`;
}

function cssSafe(code) {
  return String(code).replace(/[^a-z0-9]/gi, "_");
}

// Ogni famiglia ha la strategia di posa del materiale reale:
// - sheet: fogli di tranciato verticali alti quanto la parete, book-match
//   solo in orizzontale (legni) — la vena non si specchia mai in verticale;
// - bookmatch: lastre grandi specchiate nei due sensi (marmi, pietre);
// - seamless: materiale omogeneo reso senza giunture e posato in continuo
//   (tessuti, pelli, metalli, carbon, cemento, tinte): nessun motivo replicato.
function finishMapping(mat) {
  switch (mat?.family) {
    case "Wood": return { mode: "sheet", w: 1250, h: 3000 };
    case "Stone": return { mode: "bookmatch", s: 1600 };
    case "Abstract": return { mode: "bookmatch", s: 1000 };
    case "Concrete": return { mode: "seamless", s: 1200 };
    case "Metal": return { mode: "seamless", s: 1100 };
    case "Textile": return { mode: "seamless", s: 620 };
    case "Leather": return { mode: "seamless", s: 620 };
    case "Carbon": return { mode: "seamless", s: 420 };
    default: return { mode: "seamless", s: 600 };
  }
}

// Texture HD generate proceduralmente (tono-fedeli al campione 3M):
// se presenti hanno priorità sui campioni 512px; quelle "tileable" sono
// già senza giunture per costruzione.
const HD_TEXTURES = () => globalThis.IW_HD_TEXTURES || {};
const matSrc = (mat) => HD_TEXTURES()[mat.code]?.src || mat.texture;
const matHDTileable = (mat) => Boolean(HD_TEXTURES()[mat.code]?.tileable);

// Rende un campione piastrellabile senza giunture: i bordi vengono fusi con
// una copia traslata di mezzo periodo (cross-fade), così la ripetizione
// diventa invisibile sui materiali omogenei.
const seamlessCache = new Map();
const seamlessPending = new Map();

function ensureSeamless(mat) {
  if (seamlessCache.has(mat.code)) return Promise.resolve(seamlessCache.get(mat.code));
  if (seamlessPending.has(mat.code)) return seamlessPending.get(mat.code);
  const promise = new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const S = Math.min(img.naturalWidth, img.naturalHeight) || 512;
        const half = S >> 1;
        const c1 = document.createElement("canvas");
        c1.width = S; c1.height = S;
        const x1 = c1.getContext("2d");
        x1.drawImage(img, 0, 0, S, S);
        const c2 = document.createElement("canvas");
        c2.width = S; c2.height = S;
        const x2 = c2.getContext("2d");
        for (const [ox, oy] of [[-half, -half], [half, -half], [-half, half], [half, half]]) {
          x2.drawImage(img, ox, oy, S, S);
        }
        const d1 = x1.getImageData(0, 0, S, S).data;
        const d2 = x2.getImageData(0, 0, S, S).data;
        const out = x1.createImageData(S, S);
        for (let y = 0; y < S; y++) {
          const fy = Math.min(y, S - 1 - y) / half;
          for (let x = 0; x < S; x++) {
            const fx = Math.min(x, S - 1 - x) / half;
            const edge = 1 - Math.min(fx, fy);       // 1 al bordo, 0 al centro
            let m = (edge - .5) / .5;                 // fusione solo vicino ai bordi
            m = m < 0 ? 0 : m > 1 ? 1 : m * m * (3 - 2 * m);
            const o = (y * S + x) * 4;
            out.data[o] = d1[o] * (1 - m) + d2[o] * m;
            out.data[o + 1] = d1[o + 1] * (1 - m) + d2[o + 1] * m;
            out.data[o + 2] = d1[o + 2] * (1 - m) + d2[o + 2] * m;
            out.data[o + 3] = 255;
          }
        }
        x1.putImageData(out, 0, 0);
        const url = c1.toDataURL("image/jpeg", .92);
        seamlessCache.set(mat.code, url);
        resolve(url);
      } catch {
        resolve(matSrc(mat));
      }
    };
    img.onerror = () => resolve(matSrc(mat));
    img.src = matSrc(mat); // preferisci l'originale a risoluzione piena
  });
  seamlessPending.set(mat.code, promise);
  return promise;
}

const isDirectional = (mat) => Boolean(mat && (mat.directional || mat.family === "Wood"));
const panelGrain = (panel) => (panel.grain === "h" ? "h" : "v");

// Le finiture sono ancorate alle coordinate della parete (userSpaceOnUse):
// il materiale prosegue da un pannello all'altro come fosse un'unica posa.
function finishPatternSVG(mat, grain) {
  const map = finishMapping(mat);
  const id = `fin-${cssSafe(mat.code)}-${grain}`;
  const rot = grain === "h" ? ' patternTransform="rotate(90)"' : "";
  const fallback = mat.averageColor || "#c9c2b6";

  if (map.mode === "seamless") {
    let src;
    if (matHDTileable(mat)) {
      src = matSrc(mat);
    } else {
      src = seamlessCache.get(mat.code) || mat.texture;
      if (!seamlessCache.has(mat.code)) ensureSeamless(mat).then(() => renderWall());
    }
    return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${map.s}" height="${map.s}"${rot}>
      <rect width="${map.s}" height="${map.s}" fill="${fallback}"/>
      <image href="${src}" x="0" y="0" width="${map.s}" height="${map.s}" preserveAspectRatio="none"/>
    </pattern>`;
  }

  if (map.mode === "sheet") {
    const img = (transform) => `<image href="${matSrc(mat)}" x="0" y="0" width="${map.w}" height="${map.h}" preserveAspectRatio="none"${transform ? ` transform="${transform}"` : ""}/>`;
    return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${map.w * 2}" height="${map.h}"${rot}>
      <rect width="${map.w * 2}" height="${map.h}" fill="${fallback}"/>
      ${img("")}
      ${img(`translate(${map.w * 2} 0) scale(-1 1)`)}
    </pattern>`;
  }

  const S = map.s;
  const img = (transform) => `<image href="${matSrc(mat)}" x="0" y="0" width="${S}" height="${S}" preserveAspectRatio="none"${transform ? ` transform="${transform}"` : ""}/>`;
  return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${S * 2}" height="${S * 2}"${rot}>
    <rect width="${S * 2}" height="${S * 2}" fill="${fallback}"/>
    ${img("")}
    ${img(`translate(${S * 2} 0) scale(-1 1)`)}
    ${img(`translate(0 ${S * 2}) scale(1 -1)`)}
    ${img(`translate(${S * 2} ${S * 2}) scale(-1 -1)`)}
  </pattern>`;
}

function panelSkinSVG(panel, px, py, pw, ph) {
  const mat = MAT_BY_CODE.get(panel.finish);
  const base = `<rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="6" fill="${mat?.averageColor || "#c9c2b6"}" filter="url(#panel-shadow)"/>`;
  if (!mat) return base;
  return base +
    `<rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="6" fill="url(#fin-${cssSafe(mat.code)}-${panelGrain(panel)})"/>` +
    `<rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="6" fill="url(#panel-bevel)"/>`;
}

function renderPanelSVG(panel, x, y, w, h, c, i) {
  const px = x + GAP / 2, py = y + GAP / 2, pw = w - GAP, ph = h - GAP;
  const parts = [];
  const selected = selection && selection.c === c && selection.i === i;
  parts.push(panelSkinSVG(panel, px, py, pw, ph, c, i));
  parts.push(`<rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="6" fill="none" stroke="rgba(17,17,15,.28)" stroke-width="3"/>`);
  if (panel.type === "lux") {
    const glow = (gy) => {
      parts.push(`<rect x="${px + 26}" y="${gy - 30}" width="${pw - 52}" height="60" fill="url(#led-glow)" filter="url(#soft-led)" opacity=".95"/>`);
      parts.push(`<rect x="${px + 30}" y="${gy - 9}" width="${pw - 60}" height="18" rx="9" fill="#ffedc4"/>`);
    };
    if (panel.variant === "LED_T" || panel.variant === "LED_TB") glow(py + 34);
    if (panel.variant !== "LED_T") glow(py + ph - 34);
    parts.push(`<rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="6" fill="none" stroke="rgba(17,17,15,.4)" stroke-width="5"/>`);
  } else if (panel.type === "shelf") {
    const sy = py + ph - 44;
    parts.push(`<rect x="${px - 14}" y="${sy}" width="${pw + 28}" height="34" rx="8" fill="#2c2823"/>`);
    parts.push(`<rect x="${px - 14}" y="${sy + 34}" width="${pw + 28}" height="16" fill="rgba(17,17,15,.24)"/>`);
    parts.push(`<rect x="${px - 14}" y="${sy - 7}" width="${pw + 28}" height="8" fill="rgba(255,255,255,.24)" rx="4"/>`);
  } else if (panel.type === "frame") {
    parts.push(`<rect x="${px + 34}" y="${py + 34}" width="${pw - 68}" height="${ph - 68}" fill="rgba(17,17,15,.16)"/>`);
    parts.push(`<rect x="${px + 34}" y="${py + 34}" width="${pw - 68}" height="${ph - 68}" fill="none" stroke="#2c2823" stroke-width="26"/>`);
  } else if (panel.type === "box") {
    // contenitore a quota fissa (la più bassa): identico su tutti i formati Box
    const bh = Math.min(ph - 40, 234);
    parts.push(`<rect x="${px + 10}" y="${py + ph - bh}" width="${pw - 20}" height="${bh}" rx="8" fill="#2c2823"/>`);
    parts.push(`<rect x="${px + 10}" y="${py + ph - bh}" width="${pw - 20}" height="14" fill="rgba(255,255,255,.16)"/>`);
    parts.push(`<rect x="${px + 26}" y="${py + ph - bh + 22}" width="${pw - 52}" height="${bh - 44}" rx="6" fill="rgba(17,17,15,.5)"/>`);
  } else if (panel.type === "board") {
    // testiera imbottita liscia: bordi morbidi, luce in alto e ombra in basso
    parts.push(`<rect x="${px + 10}" y="${py + 10}" width="${pw - 20}" height="34" rx="16" fill="rgba(255,255,255,.14)"/>`);
    parts.push(`<rect x="${px + 10}" y="${py + ph - 46}" width="${pw - 20}" height="36" rx="16" fill="rgba(17,17,15,.14)"/>`);
    parts.push(`<rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="16" fill="none" stroke="rgba(17,17,15,.34)" stroke-width="6"/>`);
    parts.push(`<rect x="${px - 8}" y="${py + ph - 6}" width="${pw + 16}" height="20" rx="8" fill="rgba(17,17,15,.3)"/>`);
  }
  if (selected) {
    parts.push(`<rect x="${px - 5}" y="${py - 5}" width="${pw + 10}" height="${ph + 10}" rx="9" fill="none" stroke="#b8905f" stroke-width="14"/>`);
  }
  parts.push(`<rect class="iw-panel-hit" data-c="${c}" data-i="${i}" x="${x}" y="${y}" width="${w}" height="${h}" fill="transparent"/>`);
  return parts.join("");
}

// Letto matrimoniale stilizzato, disegnato nelle coordinate della parete:
// resta centrato sulla parete in ogni ambiente, foto compresa.
function bedSVG(cx, floorY, baseline) {
  const bw = 1800;
  const frameTop = floorY - Math.min(baseline - 60, 420);
  const parts = [];
  parts.push(`<ellipse cx="${cx}" cy="${floorY + 150}" rx="${bw / 2 + 160}" ry="120" fill="rgba(17,17,15,.18)"/>`);
  // comodini simmetrici con abat-jour
  for (const side of [-1, 1]) {
    const nx = cx + side * (bw / 2 + 330);
    parts.push(`<rect x="${nx - 240}" y="${floorY - 460}" width="480" height="460" rx="18" fill="#3a342c"/>`);
    parts.push(`<rect x="${nx - 240}" y="${floorY - 460}" width="480" height="26" rx="10" fill="rgba(255,255,255,.14)"/>`);
    parts.push(`<rect x="${nx - 28}" y="${floorY - 690}" width="56" height="230" fill="#26231f"/>`);
    parts.push(`<path d="M${nx - 150} ${floorY - 660} L${nx + 150} ${floorY - 660} L${nx + 110} ${floorY - 840} L${nx - 110} ${floorY - 840} Z" fill="#efe0c4"/>`);
    parts.push(`<ellipse cx="${nx}" cy="${floorY - 655}" rx="120" ry="34" fill="#ffe9bd" filter="url(#soft-led)" opacity=".8"/>`);
  }
  // cuscini appoggiati alla parete
  parts.push(`<rect x="${cx - bw / 2 + 120}" y="${frameTop - 300}" width="700" height="270" rx="90" fill="#f4efe4" transform="rotate(-4 ${cx - bw / 2 + 470} ${frameTop - 165})"/>`);
  parts.push(`<rect x="${cx + bw / 2 - 820}" y="${frameTop - 300}" width="700" height="270" rx="90" fill="#efe9db" transform="rotate(3 ${cx + bw / 2 - 470} ${frameTop - 165})"/>`);
  // materasso e piumone
  parts.push(`<rect x="${cx - bw / 2 - 30}" y="${frameTop - 60}" width="${bw + 60}" height="240" rx="70" fill="#f1ebdf"/>`);
  parts.push(`<rect x="${cx - bw / 2 - 40}" y="${frameTop + 120}" width="${bw + 80}" height="230" rx="60" fill="#e4dccb"/>`);
  // fascia decorativa a fondo letto
  parts.push(`<rect x="${cx - bw / 2 - 40}" y="${frameTop + 240}" width="${bw + 80}" height="110" rx="40" fill="#a98a63" opacity=".85"/>`);
  // giroletto
  parts.push(`<rect x="${cx - bw / 2 - 70}" y="${frameTop + 330}" width="${bw + 140}" height="150" rx="30" fill="#2c2823"/>`);
  return `<g>${parts.join("")}</g>`;
}

/* ---------- 8bis. Tavola tecnica ---------- */
// Elevazione quotata su fondo carta, nel linguaggio degli studi di progetto:
// quote a catena dei moduli, quota da terra, codici finitura 3M DI-NOC in
// abaco, cartiglio. Niente ambientazione; i pannelli restano interattivi.

const TECH_INK = "#2e2a24";
const TECH_DIM = "#8a7c66";
const TECH_FONT = `font-family="system-ui, -apple-system, 'Segoe UI', sans-serif"`;

// Quota orizzontale con tacche a 45° e testo centrato sopra la linea.
function techDimH(x1, x2, y, label) {
  const tick = (x) => `<line x1="${x - 26}" y1="${y + 26}" x2="${x + 26}" y2="${y - 26}" stroke="${TECH_DIM}" stroke-width="6"/>`;
  return `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${TECH_DIM}" stroke-width="4"/>` +
    tick(x1) + tick(x2) +
    `<text x="${(x1 + x2) / 2}" y="${y - 30}" text-anchor="middle" font-size="82" fill="${TECH_INK}">${label}</text>`;
}

// Quota verticale (testo ruotato); tratteggiata per le quote da terra.
function techDimV(x, y1, y2, label, dashed = false) {
  const tick = (y) => `<line x1="${x - 26}" y1="${y + 26}" x2="${x + 26}" y2="${y - 26}" stroke="${TECH_DIM}" stroke-width="6"/>`;
  const mid = (y1 + y2) / 2;
  return `<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" stroke="${TECH_DIM}" stroke-width="4"${dashed ? ' stroke-dasharray="34 26"' : ""}/>` +
    tick(y1) + tick(y2) +
    `<text x="${x - 34}" y="${mid}" text-anchor="middle" font-size="82" fill="${TECH_INK}" transform="rotate(-90 ${x - 34} ${mid})">${label}</text>`;
}

// Costruisce il foglio della tavola tecnica (markup SVG + viewBox): usato
// dalla vista ▤ sullo stage e dalla scheda progetto stampabile.
function buildTechSheet() {
  const W = wallWidth();
  const H = state.height;
  const VW = Math.max(4800, W + 1700);
  const wallX = (VW - W) / 2;
  const top = FLOOR_Y - H;

  // indici finitura in ordine di apparizione: F1, F2, … (col verso di posa
  // della prima occorrenza, così l'abaco riusa un pattern già in <defs>)
  const finIndex = new Map();
  const finOf = (panel) => {
    const code = panel.finish;
    if (!finIndex.has(code)) finIndex.set(code, { n: finIndex.size + 1, grain: panelGrain(panel) });
    return finIndex.get(code).n;
  };

  // pannelli visibili: singoli + un gruppo per ogni unione
  const mergeIds = new Set();
  state.cols.forEach((col) => col.panels.forEach((p) => { if (p.mergeId) mergeIds.add(p.mergeId); }));
  let nPanels = mergeIds.size;
  state.cols.forEach((col) => col.panels.forEach((p) => { if (!p.mergeId) nPanels += 1; }));
  const nFinishes = new Set([...state.cols.flatMap((col) => col.panels.map((p) => p.finish))]).size;

  // foglio: margini per le quote, banda in basso per abaco e cartiglio
  const legendH = Math.max(nFinishes * 118 + 230, 560);
  let sx0 = wallX - 780, sx1 = wallX + W + 600;
  const MIN_SHEET_W = 4600;
  if (sx1 - sx0 < MIN_SHEET_W) {
    const extra = (MIN_SHEET_W - (sx1 - sx0)) / 2;
    sx0 -= extra; sx1 += extra;
  }
  const sy0 = top - 430;
  const legendY = FLOOR_Y + 660;
  const sy1 = legendY + legendH + 110;

  const body = [];
  body.push(svgDefs(VW));
  body.push(`<rect x="${sx0}" y="${sy0}" width="${sx1 - sx0}" height="${sy1 - sy0}" fill="#fbf9f5"/>`);
  body.push(`<rect x="${sx0 + 50}" y="${sy0 + 50}" width="${sx1 - sx0 - 100}" height="${sy1 - sy0 - 100}" fill="none" stroke="#d8cfc0" stroke-width="4"/>`);

  // linea di terra con tratteggio da disegno tecnico
  const fx0 = sx0 + 110, fx1 = sx1 - 110;
  body.push(`<line x1="${fx0}" y1="${FLOOR_Y}" x2="${fx1}" y2="${FLOOR_Y}" stroke="${TECH_INK}" stroke-width="7"/>`);
  {
    const hatch = [];
    for (let hx = fx0 + 60; hx < fx1; hx += 150) {
      hatch.push(`<line x1="${hx}" y1="${FLOOR_Y + 10}" x2="${hx - 64}" y2="${FLOOR_Y + 74}"/>`);
    }
    body.push(`<g stroke="${TECH_DIM}" stroke-width="4" opacity=".5">${hatch.join("")}</g>`);
  }

  // cornici di fondo per gruppi di moduli a pari quota (come in ambientata,
  // ma piatte: niente ombra portata sul foglio)
  {
    let runStart = 0;
    for (let c = 1; c <= state.cols.length; c++) {
      if (c === state.cols.length || colBaseline(state.cols[c]) !== colBaseline(state.cols[runStart])) {
        const b = colBaseline(state.cols[runStart]);
        const rx0 = wallX + colOffsetMm(runStart);
        const rw = state.cols.slice(runStart, c).reduce((s, col) => s + col.width, 0);
        body.push(`<rect x="${rx0 - 14}" y="${top - 14}" width="${rw + 28}" height="${H - b + (b > 0 ? 28 : 14)}" rx="10" fill="#26231e"/>`);
        runStart = c;
      }
    }
  }

  // pannelli (stessa pelle e stessi hit-rect della vista ambientata)
  const chips = [];
  const chip = (panel, x, y, w, h) => {
    const n = finOf(panel);
    const cy = panel.type === "lux" && panel.variant !== "LED_B" ? y + 96 : y + 22;
    chips.push(`<rect x="${x + 22}" y="${cy}" width="266" height="90" rx="45" fill="rgba(251,249,245,.92)" stroke="rgba(46,42,36,.4)" stroke-width="3"/>`);
    chips.push(`<text x="${x + 155}" y="${cy + 62}" text-anchor="middle" font-size="54" font-weight="600" fill="${TECH_INK}">F${n} · ${h}</text>`);
  };
  let cursor = wallX;
  state.cols.forEach((col, c) => {
    let y = FLOOR_Y - colBaseline(col);
    col.panels.forEach((panel, i) => {
      y -= panel.height;
      if (!panel.mergeId) {
        body.push(renderPanelSVG(panel, cursor, y, col.width, panel.height, c, i));
        chip(panel, cursor, y, col.width, panel.height);
      }
    });
    cursor += col.width;
  });
  mergeIds.forEach((id) => {
    const info = groupInfo(id);
    if (!info) return;
    const first = info.members[0];
    const gx = wallX + info.x0, gy = FLOOR_Y - info.bottom - info.height;
    body.push(renderPanelSVG(info.panel, gx, gy, info.width, info.height, first.c, first.i));
    chip(info.panel, gx, gy, info.width, info.height);
  });
  if (mergeMode) {
    mergeSel.forEach(({ c, i }) => {
      const panel = state.cols[c]?.panels[i];
      if (!panel) return;
      const mx = wallX + colOffsetMm(c);
      const my = FLOOR_Y - panelQuota(c, i) - panel.height;
      body.push(`<rect x="${mx + 8}" y="${my + 8}" width="${state.cols[c].width - 16}" height="${panel.height - 16}" rx="8" fill="rgba(184,144,95,.14)" stroke="#b8905f" stroke-width="12" stroke-dasharray="40 26" pointer-events="none"/>`);
    });
  }

  // quote: catena moduli, larghezza totale, altezza, quote da terra
  const dims = [];
  const yChain = FLOOR_Y + 330;
  let bx = wallX;
  const ext = (x) => `<line x1="${x}" y1="${FLOOR_Y + 100}" x2="${x}" y2="${yChain + 56}" stroke="${TECH_DIM}" stroke-width="3" opacity=".6"/>`;
  state.cols.forEach((col) => {
    dims.push(ext(bx));
    dims.push(techDimH(bx, bx + col.width, yChain, col.width));
    bx += col.width;
  });
  dims.push(ext(wallX + W));
  const yTot = FLOOR_Y + 540;
  dims.push(techDimH(wallX, wallX + W, yTot, `${W} mm`));
  const xTot = wallX - 360;
  dims.push(`<line x1="${wallX - 24}" y1="${top}" x2="${xTot - 56}" y2="${top}" stroke="${TECH_DIM}" stroke-width="3" opacity=".6"/>`);
  dims.push(techDimV(xTot, top, FLOOR_Y, `${H} mm`));
  {
    let runStart = 0;
    for (let c = 1; c <= state.cols.length; c++) {
      if (c === state.cols.length || colBaseline(state.cols[c]) !== colBaseline(state.cols[runStart])) {
        const b = colBaseline(state.cols[runStart]);
        if (b > 0) {
          const rx0 = wallX + colOffsetMm(runStart);
          const rw = state.cols.slice(runStart, c).reduce((s, col) => s + col.width, 0);
          dims.push(techDimV(rx0 + rw / 2, FLOOR_Y - b, FLOOR_Y, b, true));
        }
        runStart = c;
      }
    }
  }

  // abaco finiture (tag + campione reale + codice) e cartiglio
  const leg = [];
  leg.push(`<text x="${sx0 + 140}" y="${legendY + 100}" font-size="62" letter-spacing="10" font-weight="700" fill="${TECH_INK}">ABACO FINITURE — 3M DI-NOC</text>`);
  let ly = legendY + 230;
  finIndex.forEach(({ n, grain }, code) => {
    const mat = MAT_BY_CODE.get(code);
    leg.push(`<circle cx="${sx0 + 190}" cy="${ly - 20}" r="46" fill="#fff" stroke="${TECH_INK}" stroke-width="4"/>`);
    leg.push(`<text x="${sx0 + 190}" y="${ly}" text-anchor="middle" font-size="50" font-weight="700" fill="${TECH_INK}">F${n}</text>`);
    leg.push(`<rect x="${sx0 + 272}" y="${ly - 64}" width="88" height="88" rx="10" fill="url(#fin-${cssSafe(code)}-${grain})" stroke="rgba(46,42,36,.35)" stroke-width="3"/>`);
    leg.push(`<text x="${sx0 + 404}" y="${ly}" font-size="56" fill="${TECH_INK}">${code}${mat?.group ? " · " + mat.group : ""}</text>`);
    ly += 118;
  });
  const cw = 1780, ch0 = 420;
  const cx0 = sx1 - 130 - cw, cy0 = legendY + 40;
  leg.push(`<rect x="${cx0}" y="${cy0}" width="${cw}" height="${ch0}" fill="#fff" stroke="${TECH_INK}" stroke-width="5"/>`);
  leg.push(`<text x="${cx0 + 60}" y="${cy0 + 108}" font-size="70" letter-spacing="14" font-weight="700" fill="${TECH_INK}">ICONICWALL</text>`);
  leg.push(`<line x1="${cx0}" y1="${cy0 + 150}" x2="${cx0 + cw}" y2="${cy0 + 150}" stroke="${TECH_INK}" stroke-width="4"/>`);
  leg.push(`<text x="${cx0 + 60}" y="${cy0 + 232}" font-size="50" fill="${TECH_INK}">Elevazione frontale · quote in mm</text>`);
  leg.push(`<text x="${cx0 + 60}" y="${cy0 + 306}" font-size="50" fill="${TECH_INK}">Parete ${W} × ${H} mm — ${state.cols.length} moduli · ${nPanels} pannelli</text>`);
  leg.push(`<text x="${cx0 + 60}" y="${cy0 + 378}" font-size="44" fill="${TECH_DIM}">${new Date().toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" })} · IconicWall Studio</text>`);

  body.push(`<g ${TECH_FONT}>${chips.join("")}${dims.join("")}${leg.join("")}</g>`);

  return { body: body.join(""), vb: [sx0, sy0, sx1 - sx0, sy1 - sy0] };
}

function renderWallTech() {
  const sheet = buildTechSheet();
  svgEl.setAttribute("viewBox", sheet.vb.join(" "));
  svgEl.setAttribute("preserveAspectRatio", "xMidYMid meet");
  svgEl.innerHTML = sheet.body;
  updateDimsText(wallWidth());
}

function renderWall() {
  if (techView) return renderWallTech();
  const W = wallWidth();
  const H = colHeight();
  const baseline = wallBaseline();
  const VW = Math.max(4800, W + 1700);
  const wallX = (VW - W) / 2;
  const wallBottom = FLOOR_Y - baseline;
  const wallY = wallBottom - H;
  const env = envById(state.env.id);

  const body = [];
  body.push(svgDefs(VW));

  const scene = activeScene();
  if (scene) {
    // fotografia calibrata: la scala della foto viene agganciata ai mm reali
    const s = scene.pxPerMm;
    body.push(`<rect x="0" y="0" width="${VW}" height="${VIEW_H}" fill="${scene.backdrop}"/>`);
    body.push(`<image href="${scene.src}" x="${VW / 2 - scene.cx / s}" y="${FLOOR_Y - scene.floorY / s}" width="${scene.w / s}" height="${scene.h / s}" preserveAspectRatio="none"/>`);
  } else if (state.env.type === "photo" && state.photo) {
    body.push(`<image href="${state.photo}" x="0" y="0" width="${VW}" height="${VIEW_H}" preserveAspectRatio="xMidYMid slice"/>`);
  } else {
    body.push(envBack(env, VW, VIEW_H, FLOOR_Y));
  }

  // gruppo parete (trasformabile sulla foto)
  const cx = VW / 2;
  const s = state.env.type === "photo" ? state.photoScale / 100 : 1;
  const tx = state.env.type === "photo" ? (state.photoX / 100) * (VW / 3) : 0;
  const ty = state.env.type === "photo" ? (state.photoY / 100) * 700 : 0;
  const transform = `translate(${cx + tx} ${FLOOR_Y + ty}) scale(${s}) translate(${-cx} ${-FLOOR_Y})`;

  const wall = [];
  // Cornici di fondo: una per ogni gruppo di moduli adiacenti a pari quota,
  // così i moduli laterali possono scendere a terra e quelli centrali restare
  // sospesi sopra il letto, ognuno con la propria cornice e ombra.
  {
    let runStart = 0;
    for (let c = 1; c <= state.cols.length; c++) {
      if (c === state.cols.length || colBaseline(state.cols[c]) !== colBaseline(state.cols[runStart])) {
        const b = colBaseline(state.cols[runStart]);
        const rx0 = wallX + colOffsetMm(runStart);
        const rw = state.cols.slice(runStart, c).reduce((s, col) => s + col.width, 0);
        const ry = FLOOR_Y - state.height;
        const rh = state.height - b;
        wall.push(`<rect x="${rx0 - 14}" y="${ry - 14}" width="${rw + 28}" height="${rh + (b > 0 ? 28 : 14)}" rx="10" fill="#1d1b18" filter="url(#wall-shadow)"/>`);
        runStart = c;
      }
    }
  }
  let cursor = wallX;
  state.cols.forEach((col, c) => {
    let y = FLOOR_Y - colBaseline(col);
    col.panels.forEach((panel, i) => {
      y -= panel.height;
      if (!panel.mergeId) wall.push(renderPanelSVG(panel, cursor, y, col.width, panel.height, c, i));
    });
    cursor += col.width;
  });
  // pannelli uniti: un'unica pelle sull'intero rettangolo, sopra i moduli
  const mergeIds = new Set();
  state.cols.forEach((col) => col.panels.forEach((p) => { if (p.mergeId) mergeIds.add(p.mergeId); }));
  mergeIds.forEach((id) => {
    const info = groupInfo(id);
    if (!info) return;
    const first = info.members[0];
    wall.push(renderPanelSVG(info.panel, wallX + info.x0, FLOOR_Y - info.bottom - info.height, info.width, info.height, first.c, first.i));
  });
  // velatura di luce per modulo (rispetta le quote diverse)
  {
    let sx0 = wallX;
    state.cols.forEach((col) => {
      const b = colBaseline(col);
      wall.push(`<rect x="${sx0}" y="${FLOOR_Y - state.height}" width="${col.width}" height="${state.height - b}" fill="url(#wall-sheen)" pointer-events="none"/>`);
      sx0 += col.width;
    });
  }
  // modalità unione: evidenzia i pannelli scelti con tratteggio oro
  if (mergeMode) {
    mergeSel.forEach(({ c, i }) => {
      const panel = state.cols[c]?.panels[i];
      if (!panel) return;
      const mx = wallX + colOffsetMm(c);
      const my = FLOOR_Y - panelQuota(c, i) - panel.height;
      wall.push(`<rect x="${mx + 8}" y="${my + 8}" width="${state.cols[c].width - 16}" height="${panel.height - 16}" rx="8" fill="rgba(184,144,95,.14)" stroke="#b8905f" stroke-width="12" stroke-dasharray="40 26" pointer-events="none"/>`);
    });
  }
  const showBed = state.bed && bedAllowed();
  if (showBed && !scene) {
    wall.push(bedSVG(cx, FLOOR_Y, bedZoneBaseline()));
  } else if (!scene) {
    wall.push(`<ellipse cx="${cx}" cy="${FLOOR_Y + 40}" rx="${W / 2 + 120}" ry="70" fill="rgba(17,17,15,.22)"/>`);
  }
  // Nelle scene fotografiche la parete vive solo entro i confini fisici del
  // muro (niente pannelli su finestre o pareti laterali)…
  if (scene) {
    const b = scene.fbounds || scene.quad34?.bounds || [-3000, 3000];
    body.push(`<clipPath id="scene-wall-clip"><rect x="${VW / 2 + b[0]}" y="${FLOOR_Y - 2700}" width="${b[1] - b[0]}" height="2700"/></clipPath>`);
  }
  body.push(`<g${scene ? ' clip-path="url(#scene-wall-clip)"' : ""} transform="${transform}">${wall.join("")}</g>`);
  // …e il primo piano della scena (letto) torna davanti alla parete,
  // come nella realtà: è la stessa foto ritagliata sulla sagoma calibrata.
  if (scene?.occl?.length) {
    const s = scene.pxPerMm;
    const pt = ([px, py]) => `${(VW / 2 + (px - scene.cx) / s).toFixed(1)} ${(FLOOR_Y + (py - scene.floorY) / s).toFixed(1)}`;
    const d = scene.occl.map((poly) => `M${poly.map(pt).join("L")}Z`).join("");
    const ix = VW / 2 - scene.cx / s, iy = FLOOR_Y - scene.floorY / s;
    // maschera con bordo sfumato (~1.5 px foto): il ritaglio netto tradisce
    // il fotomontaggio, la piuma lo assorbe
    body.push(`<filter id="occl-soft" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="${(1.6 / s).toFixed(1)}"/></filter>`);
    body.push(`<mask id="scene-occl" maskUnits="userSpaceOnUse" x="${ix}" y="${iy}" width="${scene.w / s}" height="${scene.h / s}"><path d="${d}" fill="#fff" filter="url(#occl-soft)"/></mask>`);
    body.push(`<image href="${scene.src}" x="${ix}" y="${iy}" width="${scene.w / s}" height="${scene.h / s}" preserveAspectRatio="none" mask="url(#scene-occl)" pointer-events="none"/>`);
  }

  if (state.env.type !== "photo" && !scene) {
    body.push(envFront(env, VW, VIEW_H, FLOOR_Y, { hideBed: showBed }));
  }

  svgEl.setAttribute("viewBox", `0 0 ${VW} ${VIEW_H}`);
  svgEl.setAttribute("preserveAspectRatio", "xMidYMid slice");
  svgEl.innerHTML = body.join("");

  updateDimsText(W);
}

function updateDimsText(W) {
  const bMin = minColBaseline(), bMax = maxColBaseline();
  dimsEl.textContent = bMax === 0
    ? `${W} × ${state.height} mm`
    : bMin === bMax
      ? `${W} × ${state.height - bMin} mm · da ${bMin} a ${state.height} mm`
      : `${W} × ${state.height} mm · quote ${bMin}–${bMax} mm`;
}

/* ---------- 9. Aggiornamento globale ---------- */

function refresh(options = {}) {
  // la zona letto è inviolabile: se un modulo ci finisce sopra troppo basso
  // (per uno spostamento o un allargamento), viene rialzato alla quota minima
  state.cols.forEach((col, c) => {
    const minB = minBaselineFor(c);
    if (colBaseline(col) < minB) {
      col.baseline = minB;
      reconcileColumn(col);
    }
  });
  sanitizeMerges();
  renderWall();
  renderColList();
  renderWallHeights();
  renderSummary();
  updateRequestLink();
  if (!options.keepPopover) closePopover();
  renderFinishGrid();
  saveState();
}

function mutate(fn, message) {
  pushUndo();
  fn();
  refresh();
  if (message) toast(message);
}

// Variante per le azioni dal popover: selezione e popover restano attivi.
function mutateKeep(fn, message) {
  pushUndo();
  fn();
  refresh({ keepPopover: true });
  if (message) toast(message);
}

/* ---------- 10. Scheda di modifica pannello (nel dock: mai sopra la parete) ---------- */

function openPopover(c, i) {
  // se il pannello fa parte di un gruppo unito, seleziona il gruppo
  const tapped = state.cols[c]?.panels[i];
  if (tapped?.mergeId) {
    const info = groupInfo(tapped.mergeId);
    if (info) { c = info.members[0].c; i = info.members[0].i; }
  }
  selection = { c, i };
  // la selezione NON cambia scheda: evidenzia parete e modulo,
  // la modifica avviene nella scheda "Pannello" quando l'utente ci va
  renderWall();
  renderColList();
  renderPopover();
  updateFinishHint();
  updatePanelTabBadge();
}

function closePopover() {
  mergeMode = false;
  mergeSel = [];
  if (selection) {
    selection = null;
    renderWall();
    renderColList();
    updateFinishHint();
  }
  renderPopover();
  updatePanelTabBadge();
}

// puntino oro sulla scheda Pannello quando c'è una selezione attiva
function updatePanelTabBadge() {
  const tab = dockEl.querySelector('.dock-tabs button[data-dock="pannello"]');
  if (tab) tab.classList.toggle("has-selection", Boolean(selectedPanel()));
}

function selectedPanel() {
  if (!selection) return null;
  return state.cols[selection.c]?.panels[selection.i] || null;
}

function renderPopover() {
  const panel = selectedPanel();
  const editorRows = ["#popover-families", "#popover-heights", "#popover-grain", "#popover-move", "#popover-variants"];
  const emptyEl = $("#panel-empty");
  if (!panel) {
    // stato vuoto della scheda Pannello
    if (emptyEl) emptyEl.hidden = false;
    editorRows.forEach((sel) => { const el = $(sel); if (el) el.hidden = true; });
    document.querySelector("#panel-editor .popover-foot").hidden = true;
    document.querySelector("#panel-editor .popover-merge-row").hidden = true;
    document.querySelector("#panel-editor .panel-edit-hint").hidden = true;
    $("#popover-close").hidden = true;
    $("#popover-title").textContent = "Pannello";
    return;
  }
  if (emptyEl) emptyEl.hidden = true;
  document.querySelector("#panel-editor .popover-foot").hidden = false;
  document.querySelector("#panel-editor .popover-merge-row").hidden = false;
  document.querySelector("#panel-editor .panel-edit-hint").hidden = false;
  $("#popover-close").hidden = false;
  $("#popover-families").hidden = false;
  $("#popover-move").hidden = false;
  const col = state.cols[selection.c];
  const mat = MAT_BY_CODE.get(panel.finish);
  const group = selectedGroup();
  $("#popover-title").textContent = group
    ? `Pannello unito ${group.width} × ${group.height} · ${mat ? mat.code : "—"}`
    : `${IW_TYPES[panel.type].label} ${col.width} × ${panel.height} · ${mat ? mat.code : "—"}`;

  const isGround = group ? group.bottom === 0 : (selection.i === 0 && colBaseline(col) === 0);
  const families = $("#popover-families");
  families.innerHTML = TYPE_ORDER.map((type) => {
    const blocked = (isGround && !groundOk(type)) || (group && !MERGE_TYPES.includes(type));
    const reason = group && !MERGE_TYPES.includes(type)
      ? "Non disponibile su pannelli uniti"
      : "In basso possono stare solo Flat o Testiera";
    return `<button type="button" data-type="${type}" aria-selected="${type === panel.type}" ${blocked ? "disabled" : ""} title="${blocked ? reason : IW_TYPES[type].label}">${TYPE_ICONS[type]}${IW_TYPES[type].label}</button>`;
  }).join("") + (isGround && !group ? '<i class="popover-ground-note">Il pannello più in basso può essere Flat o Testiera; gli altri elementi partono dal secondo.</i>' : "");

  const heights = $("#popover-heights");
  if (group) {
    heights.hidden = true;
    heights.innerHTML = "";
  } else {
    heights.hidden = false;
    const maxH = panelMaxHeight(col, selection.i);
    heights.innerHTML = `<span class="popover-row-label">Altezza</span>` + IW_TYPES[panel.type].heights.map((h) =>
      `<button type="button" data-h="${h}" aria-pressed="${h === panel.height}" ${h > maxH ? "disabled" : ""}>${h}</button>`
    ).join("");
  }

  $("#popover-move").querySelectorAll("button[data-move]").forEach((btn) => {
    const dir = Number(btn.dataset.move);
    btn.disabled = group ? !canMoveGroup(group, dir) : !canMovePanel(col, selection.i, dir);
  });

  // pulsanti di unione/divisione
  const mergeBtn = $("#popover-merge");
  const cancelBtn = $("#popover-merge-cancel");
  const splitBtn = $("#popover-split");
  if (mergeMode) {
    mergeBtn.hidden = false;
    mergeBtn.textContent = `✓ Unisci ${mergeSel.length} pannelli`;
    mergeBtn.disabled = !validateMergeSelection(mergeSel);
    cancelBtn.hidden = false;
    splitBtn.hidden = true;
  } else if (group) {
    mergeBtn.hidden = true;
    cancelBtn.hidden = true;
    splitBtn.hidden = false;
  } else {
    mergeBtn.hidden = false;
    mergeBtn.textContent = "⧉ Unisci con altri pannelli";
    mergeBtn.disabled = false;
    cancelBtn.hidden = true;
    splitBtn.hidden = true;
  }

  const grainRow = $("#popover-grain");
  if (isDirectional(mat)) {
    grainRow.hidden = false;
    grainRow.querySelectorAll("button[data-grain]").forEach((btn) => {
      btn.setAttribute("aria-pressed", String(btn.dataset.grain === panelGrain(panel)));
    });
  } else {
    grainRow.hidden = true;
  }

  const variants = $("#popover-variants");
  const list = IW_TYPES[panel.type].variants;
  if (list.length) {
    variants.hidden = false;
    variants.innerHTML = `<span class="popover-row-label">Luce</span>` + list.map(([value, label]) =>
      `<button type="button" data-v="${value}" aria-pressed="${value === panel.variant}">${label}</button>`
    ).join("");
  } else {
    variants.hidden = true;
    variants.innerHTML = "";
  }
}

popoverEl.addEventListener("click", (event) => {
  const btn = event.target.closest("button");
  if (!btn) return;
  if (btn.id === "popover-close") { closePopover(); return; }
  if (btn.id === "popover-merge") {
    if (!mergeMode) {
      mergeMode = true;
      mergeSel = [{ ...selection }];
      renderPopover();
      renderWall();
      toast("Tocca gli altri pannelli da unire, poi conferma");
    } else {
      const valid = validateMergeSelection(mergeSel);
      if (!valid) { toast("I pannelli scelti devono formare un rettangolo"); return; }
      const firstSel = mergeSel[0];
      mergeMode = false;
      mergeSel = [];
      mutateKeep(() => { applyMerge(valid, firstSel); });
      reopenPopover();
      toast("Pannello unito! Da qui puoi anche ridividerlo");
    }
    return;
  }
  if (btn.id === "popover-merge-cancel") {
    mergeMode = false;
    mergeSel = [];
    renderPopover();
    renderWall();
    return;
  }
  if (btn.id === "popover-split") {
    const group = selectedGroup();
    if (group) {
      mutateKeep(() => {
        group.members.forEach((m) => { delete m.panel.mergeId; });
      }, "Pannello diviso nei moduli");
      reopenPopover();
    }
    return;
  }
  if (btn.id === "popover-delete") {
    const group = selectedGroup();
    if (group) {
      mutate(() => {
        group.members.forEach((m) => { delete m.panel.mergeId; });
        group.members.forEach((m) => {
          const col = state.cols[m.c];
          deletePanel(col, col.panels.indexOf(m.panel));
        });
      }, "Pannello unito rimosso: lo spazio è tornato liscio");
      return;
    }
    const col = state.cols[selection.c];
    mutate(() => { deletePanel(col, selection.i); }, "Pannello rimosso: lo spazio è tornato liscio");
    return;
  }
  if (btn.id === "popover-finish") {
    finishMode = "panel";
    renderFinishModes();
    renderFinishGrid();
    openDock("finiture");
    toast("Ora tocca una finitura: la applico al pannello scelto");
    return;
  }
  const panel = selectedPanel();
  if (!panel) return;
  const col = state.cols[selection.c];
  const group = selectedGroup();
  if (group && btn.dataset.type && btn.dataset.type !== panel.type) {
    const type = btn.dataset.type;
    if (!MERGE_TYPES.includes(type) || (group.bottom === 0 && !groundOk(type))) return;
    mutateKeep(() => {
      group.members.forEach((m) => {
        m.panel.type = type;
        m.panel.variant = type === "lux" ? "LED_B" : "";
      });
    });
    reopenPopover();
    return;
  }
  if (group && btn.dataset.v) {
    mutateKeep(() => { group.members.forEach((m) => { m.panel.variant = btn.dataset.v; }); });
    reopenPopover();
    return;
  }
  if (group && btn.dataset.grain) {
    mutateKeep(() => { group.members.forEach((m) => { m.panel.grain = btn.dataset.grain; }); });
    reopenPopover();
    return;
  }
  if (group && btn.dataset.move) {
    mutateKeep(() => {
      if (moveGroup(group, Number(btn.dataset.move))) {
        selection.i = state.cols[selection.c].panels.indexOf(group.panel);
      }
    });
    reopenPopover();
    return;
  }
  if (btn.dataset.type && btn.dataset.type !== panel.type) {
    const type = btn.dataset.type;
    if (selection.i === 0 && colBaseline(col) === 0 && !groundOk(type)) {
      toast("In basso possono stare solo Flat o Testiera");
      return;
    }
    const allowed = IW_TYPES[type].heights;
    const maxH = panelMaxHeight(col, selection.i);
    if (!allowed.some((h) => h <= maxH)) {
      toast("Non c'è abbastanza spazio in colonna per questo pannello");
      return;
    }
    mutateKeep(() => {
      let target = allowed.includes(panel.height) ? panel.height
        : [...allowed].reverse().find((h) => h <= panel.height) || allowed[0];
      if (target > maxH) target = [...allowed].reverse().find((h) => h <= maxH);
      panel.type = type;
      panel.variant = type === "lux" ? "LED_B" : "";
      resizePanel(col, selection.i, target);
      reconcileColumn(col);
    });
    reopenPopover();
  } else if (btn.dataset.h) {
    mutateKeep(() => {
      if (!resizePanel(col, selection.i, Number(btn.dataset.h))) toast("Non c'è abbastanza spazio nella colonna");
      reconcileColumn(col);
    });
    reopenPopover();
  } else if (btn.dataset.v) {
    mutateKeep(() => { panel.variant = btn.dataset.v; });
    reopenPopover();
  } else if (btn.dataset.move) {
    mutateKeep(() => {
      if (movePanel(col, selection.i, Number(btn.dataset.move))) {
        selection.i = col.panels.indexOf(panel);
      }
    });
    reopenPopover();
  } else if (btn.dataset.grain) {
    mutateKeep(() => { panel.grain = btn.dataset.grain; });
    reopenPopover();
  }
});

function reopenPopover() {
  if (!selection) return;
  const panel = selectedPanel();
  if (!panel) { closePopover(); return; }
  if (activeDock !== "pannello") openDock("pannello");
  renderPopover();
  renderWall();
}

/* ---------- 11. Interazione sullo stage ---------- */

svgEl.addEventListener("click", (event) => {
  const hit = event.target.closest(".iw-panel-hit");
  dismissCoach();
  if (mergeMode) {
    if (!hit) return;
    const c = Number(hit.dataset.c), i = Number(hit.dataset.i);
    if (c === mergeSel[0].c && i === mergeSel[0].i) return; // il primo resta
    if (state.cols[c]?.panels[i]?.mergeId) { toast("Quel pannello fa già parte di un'unione"); return; }
    const at = mergeSel.findIndex((s) => s.c === c && s.i === i);
    if (at >= 0) mergeSel.splice(at, 1);
    else mergeSel.push({ c, i });
    renderPopover();
    renderWall();
    return;
  }
  if (!hit) { closePopover(); return; }
  openPopover(Number(hit.dataset.c), Number(hit.dataset.i));
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (!$("#render-overlay").hidden) {
      renderOverlay.hidden = true;
      document.body.style.overflow = "";
    }
    else if (!$("#photo-editor").hidden) closePhotoEditor();
    else if (!$("#studio-3d").hidden) close3D();
    else if (mergeMode) {
      mergeMode = false;
      mergeSel = [];
      renderPopover();
      renderWall();
    } else closePopover();
  }
});

/* ---------- 12. Dock ---------- */

let lastDock = "ambiente"; // ultima sezione "vera", per uscire dalla scheda pannello

function openDock(name) {
  activeDock = name;
  if (name !== "pannello") lastDock = name;
  dockEl.querySelectorAll(".dock-tabs button").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.dock === name);
  });
  dockEl.querySelectorAll(".dock-panel").forEach((panel) => {
    panel.hidden = panel.dataset.dockPanel !== name;
  });
}

dockEl.querySelector(".dock-tabs").addEventListener("click", (event) => {
  const btn = event.target.closest("button[data-dock]");
  if (btn) openDock(btn.dataset.dock);
});

/* ---------- 13. Ambiente UI ---------- */

function renderEnvCats() {
  envCatsEl.innerHTML = ENV_CATS.map(([id, label]) =>
    `<button type="button" data-cat="${id}" class="${id === activeEnvCat ? "active" : ""}" role="tab">${label}</button>`
  ).join("");
}

function envCardSVG(env) {
  const VW = 4800;
  const sampleWall = `<g>
    <rect x="1600" y="500" width="1600" height="2400" fill="#1d1b18"/>
    <rect x="1640" y="540" width="740" height="2320" fill="${env.floor}" opacity=".85"/>
    <rect x="2420" y="540" width="740" height="1150" fill="#8d867c"/>
    <rect x="2420" y="1730" width="740" height="1130" fill="${env.glow}"/>
  </g>`;
  return `<svg viewBox="0 0 ${VW} ${VIEW_H}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    ${svgMiniDefs()}${envBack(env, VW, VIEW_H, FLOOR_Y)}${sampleWall}${envFront(env, VW, VIEW_H, FLOOR_Y)}</svg>`;
}

// I gradienti condivisi (env-*) vivono nell'SVG principale: le card li riusano via url(#id).
function svgMiniDefs() {
  return "";
}

function renderEnvGrid() {
  const sceneCards = PHOTO_SCENES.filter((s) => s.cat === activeEnvCat).map((scene) =>
    `<button type="button" class="env-card env-card-photo ${state.env.type === "scene" && state.env.id === scene.id ? "active" : ""}" data-scene="${scene.id}">
      <img src="${scene.src}" alt="" loading="lazy"><b>${scene.label}</b></button>`
  ).join("");
  const drawnCards = ENVIRONMENTS.filter((e) => e.cat === activeEnvCat).map((env) =>
    `<button type="button" class="env-card ${state.env.type === "preset" && state.env.id === env.id ? "active" : ""}" data-env="${env.id}">
      ${envCardSVG(env)}<b>${env.label}</b></button>`
  ).join("");
  envGridEl.innerHTML = sceneCards + drawnCards;
}

envCatsEl.addEventListener("click", (event) => {
  const btn = event.target.closest("button[data-cat]");
  if (!btn) return;
  activeEnvCat = btn.dataset.cat;
  renderEnvCats();
  renderEnvGrid();
});

envGridEl.addEventListener("click", (event) => {
  const sceneBtn = event.target.closest("button[data-scene]");
  if (sceneBtn) {
    const scene = sceneById(sceneBtn.dataset.scene);
    mutate(() => {
      state.env = { type: "scene", id: scene.id };
      state.bed = false;
      // quota per modulo: sopra il letto si parte dalla testiera,
      // i moduli laterali scendono fino a terra
      state.cols.forEach((col, c) => {
        col.baseline = Math.max(minBaselineFor(c), 0);
        reconcileColumn(col);
      });
    }, `${scene.label}: sopra il letto la parete parte dalla testiera`);
    renderEnvGrid();
    updateEnvControls();
    return;
  }
  const btn = event.target.closest("button[data-env]");
  if (!btn) return;
  mutate(() => {
    state.env = { type: "preset", id: btn.dataset.env };
  }, `Ambiente: ${envById(btn.dataset.env).label}`);
  renderEnvGrid();
  updateEnvControls();
});

$("#env-photo-input").addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  // La foto si applica subito; il ritocco resta un'opzione dedicata per chi
  // vuole togliere piccoli oggetti (il pulsante "Ritocca la foto").
  reader.onload = () => applyEditedPhoto(reader.result, "Foto caricata: regola la parete con i cursori");
  reader.readAsDataURL(file);
  event.target.value = "";
});

function applyEditedPhoto(dataUrl, message) {
  mutate(() => {
    state.photo = dataUrl;
    state.env = { type: "photo", id: state.env.id };
    if (state.photoScale === undefined) { state.photoScale = 100; state.photoX = 0; state.photoY = 0; }
  }, message);
  updateEnvControls();
  renderEnvGrid();
}

$("#env-photo-retouch").addEventListener("click", () => {
  if (state.photo) openPhotoEditor(state.photo);
});

$("#env-photo-remove").addEventListener("click", () => {
  mutate(() => {
    state.photo = null;
    state.env = { type: "preset", id: state.env.id };
  }, "Foto rimossa");
  updateEnvControls();
  renderEnvGrid();
});

function updateEnvControls() {
  const isPhoto = state.env.type === "photo" && state.photo;
  $("#env-photo-remove").hidden = !isPhoto;
  $("#env-photo-retouch").hidden = !isPhoto;
  $("#env-photo-straighten").hidden = !isPhoto;
  $("#env-adjust").hidden = !isPhoto;
  $("#env-scale").value = state.photoScale;
  $("#env-off-x").value = state.photoX;
  $("#env-off-y").value = state.photoY;
}

for (const [id, key] of [["#env-scale", "photoScale"], ["#env-off-x", "photoX"], ["#env-off-y", "photoY"]]) {
  $(id).addEventListener("input", (event) => {
    state[key] = Number(event.target.value);
    renderWall();
  });
  $(id).addEventListener("change", () => saveState());
}

$("#env-adjust-reset").addEventListener("click", () => {
  state.photoScale = 100; state.photoX = 0; state.photoY = 0;
  updateEnvControls();
  renderWall();
});

/* ---------- 14. Parete UI ---------- */

function moveColumn(c, dir) {
  const j = c + dir;
  if (j < 0 || j >= state.cols.length) return false;
  [state.cols[c], state.cols[j]] = [state.cols[j], state.cols[c]];
  return true;
}

function renderColList() {
  if (!state.cols.length) {
    colListEl.innerHTML = '<p class="col-empty">Aggiungi almeno una colonna.</p>';
    return;
  }
  colListEl.innerHTML = state.cols.map((col, c) => {
    const isSelected = selection && selection.c === c;
    const b = colBaseline(col);
    const minB = minBaselineFor(c);
    const canDown = b - 150 >= minB;
    const canUp = b + 150 <= Math.min(1200, state.height - 600);
    return `<div class="col-chip ${isSelected ? "col-chip-selected" : ""}" ${isSelected ? 'title="Qui c’è il pannello selezionato"' : ""}>
      <b>C${c + 1} · ${col.width} mm${isSelected ? " ·" : ""}</b>${isSelected ? '<i class="col-chip-dot" aria-label="pannello selezionato"></i>' : ""}
      <span class="col-quota" title="Quota da terra del modulo${minB > 0 ? ` (minimo ${minB} mm: c’è il letto)` : ""}">
        <button type="button" data-col-quota="${c}:-150" aria-label="Abbassa la quota del modulo ${c + 1}" ${canDown ? "" : "disabled"}>−</button>
        <em>${b > 0 ? b + " mm" : "terra"}</em>
        <button type="button" data-col-quota="${c}:150" aria-label="Alza la quota del modulo ${c + 1}" ${canUp ? "" : "disabled"}>+</button>
      </span>
      <button type="button" data-col-move="${c}:-1" title="Sposta a sinistra" aria-label="Sposta la colonna ${c + 1} a sinistra" ${c === 0 ? "disabled" : ""}>◀</button>
      <button type="button" data-col-move="${c}:1" title="Sposta a destra" aria-label="Sposta la colonna ${c + 1} a destra" ${c === state.cols.length - 1 ? "disabled" : ""}>▶</button>
      <button type="button" class="col-remove" data-col-remove="${c}" title="Rimuovi la colonna" aria-label="Rimuovi la colonna ${c + 1}">×</button>
    </div>`;
  }).join("");
}

colListEl.addEventListener("click", (event) => {
  const quotaBtn = event.target.closest("button[data-col-quota]");
  if (quotaBtn) {
    const [c, delta] = quotaBtn.dataset.colQuota.split(":").map(Number);
    const col = state.cols[c];
    const next = colBaseline(col) + delta;
    const minB = minBaselineFor(c);
    if (next < minB) {
      toast(minB > 0 ? `Sopra il letto questo modulo parte da ${minB} mm` : "Il modulo è già a terra");
      return;
    }
    if (next > Math.min(1200, state.height - 600)) { toast("Quota massima raggiunta"); return; }
    mutateKeep(() => {
      col.baseline = next;
      reconcileColumn(col);
    }, `Modulo C${c + 1}: quota ${next > 0 ? next + " mm" : "a terra"}`);
    renderPopover();
    updatePanelTabBadge();
    return;
  }
  const moveBtn = event.target.closest("button[data-col-move]");
  if (moveBtn) {
    const [c, dir] = moveBtn.dataset.colMove.split(":").map(Number);
    // la selezione segue il modulo spostato: resta evidenziato in lista,
    // il pannello resta selezionato in 2D e si può continuare a spostare
    mutateKeep(() => {
      if (moveColumn(c, dir)) {
        if (selection?.c === c) selection.c = c + dir;
        else if (selection?.c === c + dir) selection.c = c;
      }
    }, `Colonna spostata a ${dir > 0 ? "destra" : "sinistra"}`);
    renderPopover();
    updatePanelTabBadge();
    return;
  }
  const removeBtn = event.target.closest("button[data-col-remove]");
  if (!removeBtn) return;
  if (state.cols.length <= 1) { toast("Serve almeno una colonna"); return; }
  const removed = Number(removeBtn.dataset.colRemove);
  const selectionWasHere = selection?.c === removed;
  mutateKeep(() => {
    state.cols.splice(removed, 1);
    if (selection && selection.c > removed) selection.c -= 1;
  }, "Colonna rimossa");
  if (selectionWasHere) closePopover();
  else { renderPopover(); updatePanelTabBadge(); }
});

document.querySelectorAll("[data-add-col]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const width = Number(btn.dataset.addCol);
    if (wallWidth() + width > MAX_WALL_WIDTH) { toast(`Larghezza massima ${MAX_WALL_WIDTH / 1000} m`); return; }
    mutate(() => {
      const col = generateColumn(width, currentPalette(), wallBaseline());
      col.baseline = wallBaseline();
      state.cols.push(col);
    }, `Colonna da ${width} mm aggiunta`);
  });
});

function renderWallHeights() {
  document.querySelectorAll("#wall-heights button").forEach((btn) => {
    btn.setAttribute("aria-checked", String(Number(btn.dataset.height) === state.height));
    btn.setAttribute("role", "radio");
  });
  document.querySelectorAll("#wall-baselines button").forEach((btn) => {
    const value = Number(btn.dataset.baseline);
    const allEqual = state.cols.length > 0 && state.cols.every((col) => colBaseline(col) === value);
    btn.setAttribute("aria-checked", String(allEqual));
    btn.setAttribute("role", "radio");
  });
  const bedRow = $("#bed-toggle-row");
  bedRow.hidden = !bedAllowed();
  $("#bed-toggle").checked = Boolean(state.bed);
}

$("#wall-baselines").addEventListener("click", (event) => {
  const btn = event.target.closest("button[data-baseline]");
  if (!btn) return;
  const value = Number(btn.dataset.baseline);
  // applica a TUTTI i moduli, rispettando la zona letto di ciascuno
  mutate(() => {
    state.baseline = value;
    if (value < 450) state.bed = false;
    state.cols.forEach((col, c) => {
      col.baseline = Math.max(value, minBaselineFor(c));
      reconcileColumn(col);
    });
  }, value > 0 ? `Tutti i moduli da ${value} mm da terra` : "Tutti i moduli a terra");
});

$("#bed-toggle").addEventListener("change", (event) => {
  mutate(() => { state.bed = event.target.checked; },
    event.target.checked ? "Letto centrato sotto la parete" : "Letto nascosto");
});

$("#wall-heights").addEventListener("click", (event) => {
  const btn = event.target.closest("button[data-height]");
  if (!btn) return;
  mutate(() => {
    state.height = Number(btn.dataset.height);
    state.cols.forEach(reconcileColumn);
  }, `Altezza parete: ${btn.dataset.height} mm`);
});

/* ---------- 15. Finiture UI ---------- */

function renderFinishTabs() {
  if (!activeFinishTab) activeFinishTab = CATALOG.groups[0]?.id;
  finishTabsEl.innerHTML = CATALOG.groups.map((group) =>
    `<button type="button" data-tab="${group.id}" class="${group.id === activeFinishTab ? "active" : ""}" role="tab">${group.label}</button>`
  ).join("");
}

function renderFinishGrid() {
  const group = CATALOG.groups.find((g) => g.id === activeFinishTab) || CATALOG.groups[0];
  if (!group) { finishGridEl.innerHTML = ""; return; }
  const used = new Set();
  state.cols.forEach((col) => col.panels.forEach((p) => used.add(p.finish)));
  const sel = selectedPanel();
  finishGridEl.innerHTML = group.materials.map((mat) => {
    const isActive = sel ? sel.finish === mat.code : used.has(mat.code);
    return `<button type="button" class="finish-swatch ${isActive ? "active" : ""}" data-code="${mat.code}" title="${mat.code} · ${group.label}">
      <img src="${mat.textureData}" alt="" loading="lazy"><small>${mat.code}</small></button>`;
  }).join("");
}

finishTabsEl.addEventListener("click", (event) => {
  const btn = event.target.closest("button[data-tab]");
  if (!btn) return;
  activeFinishTab = btn.dataset.tab;
  renderFinishTabs();
  renderFinishGrid();
});

function renderFinishModes() {
  document.querySelectorAll("#finish-mode button").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.finishMode === finishMode);
  });
  updateFinishHint();
}

$("#finish-mode").addEventListener("click", (event) => {
  const btn = event.target.closest("button[data-finish-mode]");
  if (!btn) return;
  finishMode = btn.dataset.finishMode;
  renderFinishModes();
});

function updateFinishHint() {
  const sel = selectedPanel();
  if (finishMode === "panel") {
    finishHintEl.textContent = sel
      ? `Applico al pannello selezionato (${IW_TYPES[sel.type].label} ${sel.height} mm).`
      : "Tocca prima un pannello sulla parete, poi scegli la finitura.";
  } else {
    finishHintEl.textContent = "Tocca una finitura per vestire tutta la parete in un colpo solo.";
  }
}

finishGridEl.addEventListener("click", (event) => {
  const btn = event.target.closest("button[data-code]");
  if (!btn) return;
  const code = btn.dataset.code;
  const mat = MAT_BY_CODE.get(code);
  if (!mat) return;
  if (finishMode === "panel") {
    const sel = selectedPanel();
    if (!sel) { toast("Prima tocca un pannello sulla parete"); return; }
    const kept = selection;
    const group = selectedGroup();
    mutate(() => {
      if (group) group.members.forEach((m) => { m.panel.finish = code; });
      else sel.finish = code;
    }, `${code} applicata al pannello`);
    selection = kept;
    renderWall();
  } else {
    mutate(() => {
      state.cols.forEach((col) => col.panels.forEach((p) => { p.finish = code; }));
    }, `${code} su tutta la parete`);
  }
  renderFinishGrid();
});

/* ---------- 16. Riepilogo, export, condivisione ---------- */

function configLines() {
  const lines = [];
  const seenMerges = new Set();
  state.cols.forEach((col, c) => {
    col.panels.forEach((panel) => {
      if (panel.mergeId) {
        if (seenMerges.has(panel.mergeId)) return;
        seenMerges.add(panel.mergeId);
        const info = groupInfo(panel.mergeId);
        if (info) {
          const c1 = info.members[0].c + 1, c2 = info.members[info.members.length - 1].c + 1;
          lines.push({
            col: `C${c1}–C${c2}`,
            name: `${IW_TYPES[panel.type].label} unito${panel.variant ? ` (${IW_TYPES.lux.variants.find(([v]) => v === panel.variant)?.[1] || panel.variant})` : ""}`,
            size: `${info.width} × ${info.height} mm`,
            finish: panel.finish,
          });
          return;
        }
      }
      lines.push({
        col: `C${c + 1}`,
        name: `${IW_TYPES[panel.type].label}${panel.variant ? ` (${IW_TYPES.lux.variants.find(([v]) => v === panel.variant)?.[1] || panel.variant})` : ""}`,
        size: `${col.width} × ${panel.height} mm`,
        finish: panel.finish,
      });
    });
  });
  return lines;
}

function renderSummary() {
  const W = wallWidth();
  const baseline = wallBaseline();
  const finishes = new Set();
  let count = 0;
  state.cols.forEach((col) => col.panels.forEach((p) => { count++; finishes.add(p.finish); }));
  const lines = configLines();
  const bMin = minColBaseline(), bMax = maxColBaseline();
  const quotaRow = bMax > 0
    ? `<div class="summary-row"><span>Quota da terra${state.bed ? " · letto centrato" : ""}</span><small>${
        bMin === bMax
          ? `tutti i moduli a ${bMin} mm`
          : state.cols.map((col, c) => `C${c + 1}: ${colBaseline(col) || "terra"}`).join(" · ")
      }</small></div>`
    : "";
  summaryEl.innerHTML = `
    <div class="summary-stats">
      <div><span>Parete</span><b>${(W / 1000).toFixed(1)} × ${(state.height / 1000).toFixed(1)} m</b></div>
      <div><span>Pannelli</span><b>${count}</b></div>
      <div><span>Finiture</span><b>${finishes.size}</b></div>
    </div>
    <div class="summary-list">
      ${quotaRow}
      ${lines.map((line) => `<div class="summary-row"><span>${line.col} · ${line.name} ${line.size}</span><small>${line.finish}</small></div>`).join("")}
    </div>`;
}

function configDescription() {
  const prefix = state.bed && bedAllowed() ? "letto matrimoniale centrato; " : "";
  return prefix + state.cols.map((col, c) => {
    const b = colBaseline(col);
    const panels = col.panels.map((p) =>
      `${IW_TYPES[p.type].label} ${col.width}x${p.height}${p.variant ? ` ${p.variant}` : ""} DI-NOC ${p.finish}`
    ).join(" + ");
    return `colonna ${c + 1} (${col.width} mm${b > 0 ? `, quota ${b} mm` : ""}): ${panels}`;
  }).join("; ");
}

function updateRequestLink() {
  const finishes = [...new Set(state.cols.flatMap((col) => col.panels.map((p) => p.finish)))];
  const params = new URLSearchParams({
    tipo: "config3d",
    dimensioni: `${wallWidth() / 10}x${state.height / 10}`,
    finitura: finishes.join(", "),
    elementi: configDescription(),
  });
  requestEl.href = `contatti.html?${params}`;
}

/* --- serializzazione stato → URL --- */

function encodeState() {
  const compact = {
    h: state.height,
    b: wallBaseline(),
    l: state.bed ? 1 : 0,
    e: state.env.type === "photo" ? ["preset", "living"] : [state.env.type, state.env.id],
    c: state.cols.map((col) => [col.width, col.panels.map((p) => [TYPE_ORDER.indexOf(p.type), p.height, p.variant, p.finish, panelGrain(p), p.mergeId || 0]), colBaseline(col)]),
  };
  const json = JSON.stringify(compact);
  return btoa(unescape(encodeURIComponent(json))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeState(encoded) {
  try {
    const json = decodeURIComponent(escape(atob(encoded.replace(/-/g, "+").replace(/_/g, "/"))));
    const compact = JSON.parse(json);
    if (!Array.isArray(compact.c) || !compact.c.length) return null;
    const parsed = {
      height: WALL_HEIGHTS.includes(compact.h) ? compact.h : 2700,
      baseline: BASELINES.includes(compact.b) ? compact.b : 0,
      bed: compact.l === 1 && compact.b >= 450,
      env: compact.e?.[0] === "scene" && sceneById(compact.e[1])
        ? { type: "scene", id: compact.e[1] }
        : { type: "preset", id: envById(compact.e?.[1]).id },
      photo: null, photoScale: 100, photoX: 0, photoY: 0,
      cols: compact.c.map(([width, panels, colB]) => ({
        width: COL_WIDTHS.includes(width) ? width : 600,
        // quota per modulo; i link vecchi (senza terzo campo) usano la globale
        baseline: BASELINES.includes(colB) ? colB : (BASELINES.includes(compact.b) ? compact.b : 0),
        panels: panels.map(([t, h, v, f, g, m]) => {
          const panel = {
            type: TYPE_ORDER[t] || "flat",
            height: Number(h) || 300,
            variant: typeof v === "string" ? v : "",
            finish: MAT_BY_CODE.has(f) ? f : DEFAULT_BASE,
            grain: g === "h" ? "h" : "v",
          };
          if (Number(m) > 0) panel.mergeId = Number(m);
          return panel;
        }),
      })),
    };
    sanitizeColumns(parsed.cols);
    parsed.cols.forEach((col) => reconcileColumn(col, parsed.height - col.baseline));
    return parsed;
  } catch {
    return null;
  }
}

function saveState() {
  try {
    const snapshot = clone(state);
    snapshot.photo = null;
    if (snapshot.env.type === "photo") snapshot.env = { type: "preset", id: snapshot.env.id };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    history.replaceState(null, "", `#d=${encodeState()}`);
  } catch { /* storage pieno o negato: pazienza */ }
}

/* --- export PNG --- */

function buildStandaloneSVG() {
  const VW = Number(svgEl.getAttribute("viewBox").split(" ")[2]);
  const watermark = `<g font-family="Arial, sans-serif">
    <text x="${VW - 90}" y="${VIEW_H - 90}" text-anchor="end" font-size="86" fill="rgba(255,255,255,.92)" font-weight="600">IconicWall</text>
    <text x="${VW - 90}" y="${VIEW_H - 160}" text-anchor="end" font-size="52" fill="rgba(255,255,255,.75)">creata su iconicwall.it</text>
  </g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${VW} ${VIEW_H}" width="1600" height="${Math.round(1600 * VIEW_H / VW)}">${svgEl.innerHTML}${watermark}</svg>`;
}

// L'SVG rasterizzato dentro <img> non può caricare file esterni:
// le texture usate vanno incorporate come data URL.
const textureDataUrlCache = new Map();

async function textureAsDataURL(mat) {
  if (textureDataUrlCache.has(mat.code)) return textureDataUrlCache.get(mat.code);
  try {
    const blob = await (await fetch(matSrc(mat))).blob();
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    textureDataUrlCache.set(mat.code, dataUrl);
    return dataUrl;
  } catch {
    return mat.textureData; // ripiego: miniatura del catalogo
  }
}

async function inlineTextures(svgString) {
  const used = new Set();
  state.cols.forEach((col) => col.panels.forEach((p) => used.add(p.finish)));
  for (const code of used) {
    const mat = MAT_BY_CODE.get(code);
    if (!mat) continue;
    const src = matSrc(mat);
    if (!svgString.includes(`href="${src}"`)) continue; // già data URL (seamless)
    svgString = svgString.split(`href="${src}"`).join(`href="${await textureAsDataURL(mat)}"`);
  }
  // anche la scena fotografica di sfondo va incorporata nell'export
  const scene = activeScene();
  if (scene && svgString.includes(`href="${scene.src}"`)) {
    try {
      const blob = await (await fetch(scene.src)).blob();
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      svgString = svgString.split(`href="${scene.src}"`).join(`href="${dataUrl}"`);
    } catch { /* la scena resterà vuota nell'export, meglio di un errore */ }
  }
  return svgString;
}

function exportPNG(done) {
  const hadSelection = selection;
  if (hadSelection) { selection = null; renderWall(); }
  const svgString = buildStandaloneSVG();
  if (hadSelection) { selection = hadSelection; renderWall(); }
  inlineTextures(svgString).then((inlined) => rasterizeSVG(inlined, done));
}

function rasterizeSVG(svgString, done) {
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = img.width || 1600;
    canvas.height = img.height || 1067;
    const context = canvas.getContext("2d");
    context.drawImage(img, 0, 0);
    try {
      done(canvas.toDataURL("image/png"));
    } catch (error) {
      console.warn("Export PNG non riuscito", error);
      toast("Non riesco a esportare l'immagine con questa foto");
    }
  };
  img.onerror = () => toast("Non riesco a generare l'immagine");
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgString);
}

$("#btn-download-png").addEventListener("click", () => {
  exportPNG((dataUrl) => {
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "iconicwall-la-mia-parete.png";
    link.click();
    toast("Immagine scaricata: mostrala a chi vuoi");
  });
});

/* --- scheda PDF (stampa) --- */

$("#btn-download-pdf").addEventListener("click", () => {
  exportPNG((dataUrl) => {
    const lines = configLines();
    const date = new Date().toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
    // scheda da studio di progettazione: tavola tecnica quotata in prima
    // pagina, distinta e note; anteprima ambientata in seconda pagina
    const sheet = buildTechSheet();
    let areaMm2 = 0;
    const seenMerges = new Set();
    state.cols.forEach((col) => col.panels.forEach((p) => {
      if (p.mergeId) {
        if (seenMerges.has(p.mergeId)) return;
        seenMerges.add(p.mergeId);
        const info = groupInfo(p.mergeId);
        if (info) areaMm2 += info.width * info.height;
        return;
      }
      areaMm2 += col.width * p.height;
    }));
    const bMin = minColBaseline(), bMax = maxColBaseline();
    const finishes = [...new Set(lines.map((l) => l.finish))];
    saveState();
    $("#print-sheet").innerHTML = `
      <div class="print-head"><b>ICONICWALL</b><span>Scheda progetto · ${date}</span></div>
      <svg class="print-tech" viewBox="${sheet.vb.join(" ")}" preserveAspectRatio="xMidYMid meet">${sheet.body}</svg>
      <h2>Parete ${wallWidth()} × ${state.height} mm — ${state.cols.length} moduli · ${lines.length} pannelli</h2>
      <p class="print-meta">Superficie pannelli ≈ ${(areaMm2 / 1e6).toFixed(2)} m² · Quote da terra ${bMin === bMax ? `${bMin} mm` : `${bMin}–${bMax} mm`} · Fuga fra i pannelli ${GAP} mm · Finiture: ${finishes.join(", ")}</p>
      <table>
        <thead><tr><th>Modulo</th><th>Pannello</th><th>Misure</th><th>Finitura 3M™ DI-NOC™</th></tr></thead>
        <tbody>${lines.map((line) => `<tr><td>${line.col}</td><td>${line.name}</td><td>${line.size}</td><td>${line.finish}</td></tr>`).join("")}</tbody>
      </table>
      <div class="print-notes"><b>Note di posa.</b> Sistema modulare a parete con pannelli magnetici
      intercambiabili su struttura in moduli da 300/600/900 mm. A terra il primo pannello è sempre
      Flat o Testiera; le quote da terra per modulo sono indicate in tavola. Misure, pesi e finiture
      vengono verificati in fase di proposta.</div>
      <div class="print-cta"><b>Campioni reali 3M™ DI-NOC™.</b> Richiedi i campioni fisici delle finiture
      di questa parete (${finishes.join(", ")}) su www.iconicwall.it/contatti.html — il catalogo completo
      conta oltre 700 finiture. Configurazione modificabile online: ${location.href}</div>
      <img class="print-visual print-ambient" src="${dataUrl}" alt="Anteprima ambientata della parete">
      <div class="print-foot">Scheda indicativa creata con IconicWall Studio — www.iconicwall.it.</div>`;
    requestAnimationFrame(() => window.print());
  });
});

/* --- condivisione --- */

$("#btn-share").addEventListener("click", async () => {
  saveState();
  const url = location.href;
  if (navigator.share) {
    try {
      await navigator.share({ title: "La mia parete IconicWall", text: "Guarda la parete che ho composto con IconicWall Studio", url });
      return;
    } catch { /* annullato: proviamo la copia */ }
  }
  try {
    await navigator.clipboard.writeText(url);
    toast("Link copiato: incollalo dove vuoi");
  } catch {
    prompt("Copia questo link:", url);
  }
});

/* ---------- 16b. Ritocco foto: rimozione oggetti ---------- */

const peEl = $("#photo-editor");
const peStage = $("#pe-stage");
const peCanvas = $("#pe-canvas");
const peCtx = peCanvas.getContext("2d");
const PE_MAX = 1400; // risoluzione massima di lavoro
let pe = null; // { work, mask, undoStack, painting, lastX, lastY, mode, corners, draggingCorner }

function peDefaultCorners(w, h) {
  return [
    { x: w * .14, y: h * .14 }, { x: w * .86, y: h * .14 },
    { x: w * .86, y: h * .86 }, { x: w * .14, y: h * .86 },
  ];
}

function setPeMode(mode) {
  if (!pe) return;
  pe.mode = mode;
  $("#pe-mode-brush").classList.toggle("active", mode === "brush");
  $("#pe-mode-corners").classList.toggle("active", mode === "corners");
  document.querySelectorAll(".pe-brush-only").forEach((el) => { el.hidden = mode !== "brush"; });
  document.querySelectorAll(".pe-corner-only").forEach((el) => { el.hidden = mode !== "corners"; });
  $("#pe-hint").innerHTML = mode === "brush"
    ? "Colora con il dito o il mouse i piccoli oggetti da far sparire, poi premi <b>Rimuovi</b>. Funziona al meglio su pareti e superfici uniformi."
    : "Trascina i 4 angoli sugli spigoli di qualcosa che nella realtà è rettangolare (la parete, una porta, una finestra), poi premi <b>Raddrizza</b>: la foto viene messa in squadra.";
  peRedraw();
}

function openPhotoEditor(dataUrl, mode = "brush") {
  const img = new Image();
  img.onload = () => {
    const scale = Math.min(1, PE_MAX / Math.max(img.width, img.height));
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);
    const work = document.createElement("canvas");
    work.width = w; work.height = h;
    work.getContext("2d").drawImage(img, 0, 0, w, h);
    const mask = document.createElement("canvas");
    mask.width = w; mask.height = h;
    pe = {
      work, mask, undoStack: [], painting: false, lastX: 0, lastY: 0,
      mode, corners: peDefaultCorners(w, h), draggingCorner: -1,
    };
    peCanvas.width = w;
    peCanvas.height = h;
    peEl.hidden = false;
    document.body.style.overflow = "hidden";
    setPeMode(mode);
  };
  img.onerror = () => toast("Non riesco a leggere questa immagine");
  img.src = dataUrl;
}

function closePhotoEditor() {
  peEl.hidden = true;
  document.body.style.overflow = "";
  pe = null;
}

function peRedraw() {
  if (!pe) return;
  peCtx.drawImage(pe.work, 0, 0);
  peCtx.save();
  peCtx.globalAlpha = .5;
  peCtx.drawImage(pe.mask, 0, 0);
  peCtx.restore();
  if (pe.mode === "corners") peDrawCorners();
}

// Sovrapposizione del quadrilatero di raddrizzamento: ombra fuori,
// linee e maniglie in evidenza.
function peDrawCorners() {
  const c = pe.corners;
  const rect = peCanvas.getBoundingClientRect();
  const k = rect.width ? peCanvas.width / rect.width : 1; // px lavoro per px schermo
  peCtx.save();
  peCtx.beginPath();
  peCtx.rect(0, 0, peCanvas.width, peCanvas.height);
  peCtx.moveTo(c[0].x, c[0].y);
  for (let i = 3; i >= 0; i--) peCtx.lineTo(c[i].x, c[i].y);
  peCtx.closePath();
  peCtx.fillStyle = "rgba(17,17,15,.4)";
  peCtx.fill("evenodd");
  peCtx.beginPath();
  peCtx.moveTo(c[0].x, c[0].y);
  for (let i = 1; i < 4; i++) peCtx.lineTo(c[i].x, c[i].y);
  peCtx.closePath();
  peCtx.strokeStyle = "#e8c496";
  peCtx.lineWidth = 3 * k;
  peCtx.stroke();
  for (const p of c) {
    peCtx.beginPath();
    peCtx.arc(p.x, p.y, 13 * k, 0, Math.PI * 2);
    peCtx.fillStyle = "#ffffff";
    peCtx.fill();
    peCtx.lineWidth = 4 * k;
    peCtx.strokeStyle = "#b8905f";
    peCtx.stroke();
  }
  peCtx.restore();
}

function pePoint(event) {
  const rect = peCanvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * (peCanvas.width / rect.width),
    y: (event.clientY - rect.top) * (peCanvas.height / rect.height),
    brush: Number($("#pe-brush").value) * (peCanvas.width / rect.width),
  };
}

function peStroke(x0, y0, x1, y1, radius) {
  const ctx = pe.mask.getContext("2d");
  ctx.strokeStyle = "rgba(213,74,54,.95)";
  ctx.fillStyle = "rgba(213,74,54,.95)";
  ctx.lineWidth = radius * 2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x1, y1, radius, 0, Math.PI * 2);
  ctx.fill();
}

peCanvas.addEventListener("pointerdown", (event) => {
  if (!pe) return;
  event.preventDefault();
  peCanvas.setPointerCapture(event.pointerId);
  const p = pePoint(event);
  if (pe.mode === "corners") {
    const grab = 42 * (peCanvas.width / peCanvas.getBoundingClientRect().width);
    let best = -1, bestD = grab;
    pe.corners.forEach((corner, i) => {
      const d = Math.hypot(corner.x - p.x, corner.y - p.y);
      if (d < bestD) { bestD = d; best = i; }
    });
    pe.draggingCorner = best;
    return;
  }
  pe.painting = true;
  pe.lastX = p.x; pe.lastY = p.y;
  peStroke(p.x, p.y, p.x, p.y, p.brush / 2);
  peRedraw();
});

peCanvas.addEventListener("pointermove", (event) => {
  if (!pe) return;
  const p = pePoint(event);
  if (pe.mode === "corners") {
    if (pe.draggingCorner < 0) return;
    pe.corners[pe.draggingCorner] = {
      x: Math.max(0, Math.min(peCanvas.width, p.x)),
      y: Math.max(0, Math.min(peCanvas.height, p.y)),
    };
    peRedraw();
    return;
  }
  if (!pe.painting) return;
  peStroke(pe.lastX, pe.lastY, p.x, p.y, p.brush / 2);
  pe.lastX = p.x; pe.lastY = p.y;
  peRedraw();
});

peCanvas.addEventListener("pointerup", () => {
  if (!pe) return;
  pe.painting = false;
  pe.draggingCorner = -1;
});

function peSnapshot() {
  pe.undoStack.push({
    img: pe.work.toDataURL("image/jpeg", .92),
    mask: pe.mask.toDataURL("image/png"),
  });
  if (pe.undoStack.length > 6) pe.undoStack.shift();
}

$("#pe-undo").addEventListener("click", () => {
  if (!pe || !pe.undoStack.length) {
    // nessun "Rimuovi" da annullare: pulisci almeno la selezione
    if (pe) { pe.mask.getContext("2d").clearRect(0, 0, pe.mask.width, pe.mask.height); peRedraw(); }
    return;
  }
  const snap = pe.undoStack.pop();
  const imgEl = new Image();
  imgEl.onload = () => {
    pe.work.getContext("2d").drawImage(imgEl, 0, 0);
    const maskEl = new Image();
    maskEl.onload = () => {
      const mctx = pe.mask.getContext("2d");
      mctx.clearRect(0, 0, pe.mask.width, pe.mask.height);
      mctx.drawImage(maskEl, 0, 0);
      peRedraw();
    };
    maskEl.src = snap.mask;
  };
  imgEl.src = snap.img;
});

$("#pe-clear").addEventListener("click", () => {
  if (!pe) return;
  pe.mask.getContext("2d").clearRect(0, 0, pe.mask.width, pe.mask.height);
  peRedraw();
});

// Riempimento "a cipolla" dal bordo verso l'interno + lisciatura:
// dissolve l'oggetto nei colori circostanti (muri e pavimenti vengono benissimo).
function inpaintData(data, mask, w, h) {
  const known = new Uint8Array(w * h);
  const holes = [];
  for (let i = 0; i < w * h; i++) {
    known[i] = mask[i] ? 0 : 1;
    if (mask[i]) holes.push(i);
  }
  if (!holes.length) return;
  let frontier = [];
  for (const i of holes) {
    const x = i % w, y = (i / w) | 0;
    if ((x > 0 && known[i - 1]) || (x < w - 1 && known[i + 1]) || (y > 0 && known[i - w]) || (y < h - 1 && known[i + w])) {
      frontier.push(i);
    }
  }
  while (frontier.length) {
    const next = [];
    const filledNow = [];
    for (const i of frontier) {
      if (known[i]) continue;
      const x = i % w, y = (i / w) | 0;
      let r = 0, g = 0, b = 0, n = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const j = ny * w + nx;
          if (known[j] === 1) {
            const o = j * 4;
            r += data[o]; g += data[o + 1]; b += data[o + 2]; n++;
          }
        }
      }
      if (!n) { next.push(i); continue; }
      const o = i * 4;
      data[o] = r / n; data[o + 1] = g / n; data[o + 2] = b / n; data[o + 3] = 255;
      known[i] = 2;
      filledNow.push(i);
      if (x > 0 && !known[i - 1]) next.push(i - 1);
      if (x < w - 1 && !known[i + 1]) next.push(i + 1);
      if (y > 0 && !known[i - w]) next.push(i - w);
      if (y < h - 1 && !known[i + w]) next.push(i + w);
    }
    for (const i of filledNow) known[i] = 1;
    if (!filledNow.length) break;
    frontier = next;
  }
  // lisciatura Gauss-Seidel solo sui pixel riempiti
  for (let iteration = 0; iteration < 42; iteration++) {
    for (const i of holes) {
      const x = i % w, y = (i / w) | 0;
      let r = 0, g = 0, b = 0, n = 0;
      const add = (j) => { const o = j * 4; r += data[o]; g += data[o + 1]; b += data[o + 2]; n++; };
      if (x > 0) add(i - 1);
      if (x < w - 1) add(i + 1);
      if (y > 0) add(i - w);
      if (y < h - 1) add(i + w);
      if (!n) continue;
      const o = i * 4;
      data[o] = r / n; data[o + 1] = g / n; data[o + 2] = b / n;
    }
  }
}

/* --- Ricostruzione PatchMatch multi-scala ---
   La diffusione da sola sfuma (bene solo su muri uniformi). Qui il buco viene
   ricostruito copiando e fondendo patch reali di texture circostante, come il
   "riempimento in base al contenuto": parquet, intonaci e tessuti restano
   credibili. Si lavora su una piramide di scale, dal grezzo al fine. */

function downsampleLevel(level) {
  const w2 = Math.max(1, level.w >> 1), h2 = Math.max(1, level.h >> 1);
  const data = new Uint8ClampedArray(w2 * h2 * 4);
  const mask = new Uint8Array(w2 * h2);
  for (let y = 0; y < h2; y++) {
    for (let x = 0; x < w2; x++) {
      let r = 0, g = 0, b = 0, known = 0, masked = 0;
      for (let dy = 0; dy < 2; dy++) {
        for (let dx = 0; dx < 2; dx++) {
          const sx = Math.min(level.w - 1, x * 2 + dx), sy = Math.min(level.h - 1, y * 2 + dy);
          const si = sy * level.w + sx;
          if (level.mask[si]) { masked++; continue; }
          const o = si * 4;
          r += level.data[o]; g += level.data[o + 1]; b += level.data[o + 2]; known++;
        }
      }
      const i = y * w2 + x, o = i * 4;
      if (known) { data[o] = r / known; data[o + 1] = g / known; data[o + 2] = b / known; data[o + 3] = 255; }
      mask[i] = masked >= 2 || known === 0 ? 1 : 0;
    }
  }
  return { data, mask, w: w2, h: h2 };
}

function upsampleInto(fine, coarse) {
  for (let y = 0; y < fine.h; y++) {
    for (let x = 0; x < fine.w; x++) {
      const i = y * fine.w + x;
      if (!fine.mask[i]) continue;
      const fx = Math.min(coarse.w - 1.001, x / 2), fy = Math.min(coarse.h - 1.001, y / 2);
      const x0 = fx | 0, y0 = fy | 0, ax = fx - x0, ay = fy - y0;
      const o = i * 4;
      for (let ch = 0; ch < 3; ch++) {
        const c00 = coarse.data[(y0 * coarse.w + x0) * 4 + ch];
        const c10 = coarse.data[(y0 * coarse.w + x0 + 1) * 4 + ch];
        const c01 = coarse.data[((y0 + 1) * coarse.w + x0) * 4 + ch];
        const c11 = coarse.data[((y0 + 1) * coarse.w + x0 + 1) * 4 + ch];
        fine.data[o + ch] = (c00 * (1 - ax) + c10 * ax) * (1 - ay) + (c01 * (1 - ax) + c11 * ax) * ay;
      }
      fine.data[o + 3] = 255;
    }
  }
}

function patchRefine(data, mask, w, h, iterations) {
  const R = 2, P = 2 * R + 1;
  const holes = [];
  for (let i = 0; i < w * h; i++) if (mask[i]) holes.push(i);
  if (!holes.length || holes.length > w * h * .45) return;

  // summed-area della maschera: una sorgente è valida se la sua patch è tutta nota
  const sat = new Int32Array((w + 1) * (h + 1));
  for (let y = 0; y < h; y++) {
    let row = 0;
    for (let x = 0; x < w; x++) {
      row += mask[y * w + x];
      sat[(y + 1) * (w + 1) + x + 1] = sat[y * (w + 1) + x + 1] + row;
    }
  }
  const holeIn = (x0, y0, x1, y1) =>
    sat[(y1 + 1) * (w + 1) + x1 + 1] - sat[y0 * (w + 1) + x1 + 1] - sat[(y1 + 1) * (w + 1) + x0] + sat[y0 * (w + 1) + x0];
  const validSource = (x, y) => x >= R && y >= R && x < w - R && y < h - R && holeIn(x - R, y - R, x + R, y + R) === 0;

  // sorgenti: anello attorno al buco (coerenza locale), tutta l'immagine come riserva
  let minX = w, minY = h, maxX = 0, maxY = 0;
  for (const i of holes) {
    const x = i % w, y = (i / w) | 0;
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
  }
  const pad = Math.max(30, Math.round(Math.max(maxX - minX, maxY - minY) * .9));
  const sx0 = Math.max(R, minX - pad), sy0 = Math.max(R, minY - pad);
  const sx1 = Math.min(w - 1 - R, maxX + pad), sy1 = Math.min(h - 1 - R, maxY + pad);
  const sources = [];
  const area = Math.max(1, (sx1 - sx0 + 1) * (sy1 - sy0 + 1));
  const step = Math.max(1, Math.round(Math.sqrt(area / 60000)));
  for (let y = sy0; y <= sy1; y += step) {
    for (let x = sx0; x <= sx1; x += step) if (validSource(x, y)) sources.push(y * w + x);
  }
  if (sources.length < 40) {
    for (let y = R; y < h - R; y += 2) {
      for (let x = R; x < w - R; x += 2) if (validSource(x, y)) sources.push(y * w + x);
    }
  }
  if (!sources.length) return;

  const nnf = new Int32Array(w * h).fill(-1);
  const best = new Float64Array(w * h);

  const patchDist = (pi, qi, cutoff) => {
    const px = pi % w, py = (pi / w) | 0, qx = qi % w, qy = (qi / w) | 0;
    let sum = 0;
    for (let dy = -R; dy <= R; dy++) {
      const pyy = py + dy;
      if (pyy < 0 || pyy >= h) continue;
      const qrow = (qy + dy) * w + qx;
      for (let dx = -R; dx <= R; dx++) {
        const pxx = px + dx;
        if (pxx < 0 || pxx >= w) continue;
        const po = (pyy * w + pxx) * 4, qo = (qrow + dx) * 4;
        const dr = data[po] - data[qo], dg = data[po + 1] - data[qo + 1], db = data[po + 2] - data[qo + 2];
        sum += dr * dr + dg * dg + db * db;
        if (sum > cutoff) return sum;
      }
    }
    return sum;
  };

  const tryCandidate = (pi, qi) => {
    if (qi < 0 || qi >= w * h) return;
    const qx = qi % w, qy = (qi / w) | 0;
    if (!validSource(qx, qy)) return;
    const d = patchDist(pi, qi, best[pi]);
    if (d < best[pi]) { best[pi] = d; nnf[pi] = qi; }
  };

  for (const i of holes) {
    best[i] = Infinity;
    tryCandidate(i, sources[(Math.random() * sources.length) | 0]);
    if (nnf[i] === -1) { nnf[i] = sources[0]; best[i] = patchDist(i, sources[0], Infinity); }
  }

  const accR = new Float32Array(w * h), accG = new Float32Array(w * h);
  const accB = new Float32Array(w * h), accW = new Float32Array(w * h);
  const maxRadius = Math.max(w, h);

  for (let it = 0; it < iterations; it++) {
    const forward = it % 2 === 0;
    for (let k = 0; k < holes.length; k++) {
      const i = holes[forward ? k : holes.length - 1 - k];
      const neighbors = forward ? [i - 1, i - w] : [i + 1, i + w];
      for (const n of neighbors) {
        if (n >= 0 && n < w * h && nnf[n] !== -1) tryCandidate(i, nnf[n] + (i - n));
      }
      let radius = maxRadius;
      while (radius >= 1) {
        const q = nnf[i], qx = q % w, qy = (q / w) | 0;
        const cx = qx + (((Math.random() * 2 - 1) * radius) | 0);
        const cy = qy + (((Math.random() * 2 - 1) * radius) | 0);
        if (cx >= R && cy >= R && cx < w - R && cy < h - R) tryCandidate(i, cy * w + cx);
        radius >>= 1;
      }
    }
    // ricostruzione per voto: ogni patch vota i colori sui pixel del buco che copre
    accR.fill(0); accG.fill(0); accB.fill(0); accW.fill(0);
    for (const i of holes) {
      const q = nnf[i];
      if (q === -1) continue;
      const px = i % w, py = (i / w) | 0, qx = q % w, qy = (q / w) | 0;
      const weight = 1 / (1 + best[i] / (P * P * 300));
      for (let dy = -R; dy <= R; dy++) {
        const ty = py + dy;
        if (ty < 0 || ty >= h) continue;
        const qrow = (qy + dy) * w + qx;
        for (let dx = -R; dx <= R; dx++) {
          const tx = px + dx;
          if (tx < 0 || tx >= w) continue;
          const ti = ty * w + tx;
          if (!mask[ti]) continue;
          const qo = (qrow + dx) * 4;
          accR[ti] += data[qo] * weight;
          accG[ti] += data[qo + 1] * weight;
          accB[ti] += data[qo + 2] * weight;
          accW[ti] += weight;
        }
      }
    }
    for (const i of holes) {
      if (!accW[i]) continue;
      const o = i * 4;
      data[o] = accR[i] / accW[i];
      data[o + 1] = accG[i] / accW[i];
      data[o + 2] = accB[i] / accW[i];
      data[o + 3] = 255;
    }
  }
}

async function inpaintSmart(data, mask, w, h) {
  const levels = [{ data, mask, w, h }];
  while (levels.length < 8) {
    const top = levels[levels.length - 1];
    if (Math.max(top.w, top.h) <= 96) break;
    levels.push(downsampleLevel(top));
  }
  const coarse = levels[levels.length - 1];
  inpaintData(coarse.data, coarse.mask, coarse.w, coarse.h);
  patchRefine(coarse.data, coarse.mask, coarse.w, coarse.h, 4);
  for (let li = levels.length - 2; li >= 0; li--) {
    await new Promise((resolve) => setTimeout(resolve)); // respiro per l'interfaccia
    upsampleInto(levels[li], levels[li + 1]);
    patchRefine(levels[li].data, levels[li].mask, levels[li].w, levels[li].h, li === 0 ? 2 : 3);
  }
}

$("#pe-apply").addEventListener("click", async () => {
  if (!pe || pe.busy) return;
  const w = pe.work.width, h = pe.work.height;
  const maskData = pe.mask.getContext("2d").getImageData(0, 0, w, h).data;
  const mask = new Uint8Array(w * h);
  let count = 0;
  for (let i = 0; i < w * h; i++) if (maskData[i * 4 + 3] > 40) { mask[i] = 1; count++; }
  if (!count) { toast("Prima colora gli oggetti da togliere"); return; }
  peSnapshot();
  pe.busy = true;
  peStage.classList.add("pe-busy");
  await new Promise((resolve) => setTimeout(resolve, 30));
  try {
    const ctx = pe.work.getContext("2d");
    const img = ctx.getImageData(0, 0, w, h);
    await inpaintSmart(img.data, mask, w, h);
    ctx.putImageData(img, 0, 0);
    pe.mask.getContext("2d").clearRect(0, 0, w, h);
  } finally {
    if (pe) {
      pe.busy = false;
      peStage.classList.remove("pe-busy");
      peRedraw();
    }
  }
  toast("Fatto! Se serve, ripassa sui punti rimasti");
});

/* --- Raddrizzamento prospettico (omografia a 4 punti) --- */

// Matrice 3×3 che porta il quadrato unitario sul quadrilatero p0..p3
// (ordine: alto-sx, alto-dx, basso-dx, basso-sx).
function unitToQuad(q) {
  const [p0, p1, p2, p3] = q;
  const dx1 = p1.x - p2.x, dy1 = p1.y - p2.y;
  const dx2 = p3.x - p2.x, dy2 = p3.y - p2.y;
  const dx3 = p0.x - p1.x + p2.x - p3.x;
  const dy3 = p0.y - p1.y + p2.y - p3.y;
  const den = dx1 * dy2 - dx2 * dy1;
  if (Math.abs(den) < 1e-9) return null;
  const g = (dx3 * dy2 - dx2 * dy3) / den;
  const h = (dx1 * dy3 - dx3 * dy1) / den;
  return [
    p1.x - p0.x + g * p1.x, p3.x - p0.x + h * p3.x, p0.x,
    p1.y - p0.y + g * p1.y, p3.y - p0.y + h * p3.y, p0.y,
    g, h, 1,
  ];
}

function invert3(m) {
  const [a, b, c, d, e, f, g, h, i] = m;
  const A = e * i - f * h, B = c * h - b * i, C = b * f - c * e;
  const det = a * A + d * B + g * C;
  if (Math.abs(det) < 1e-9) return null;
  return [
    A / det, B / det, C / det,
    (f * g - d * i) / det, (a * i - c * g) / det, (c * d - a * f) / det,
    (d * h - e * g) / det, (b * g - a * h) / det, (a * e - b * d) / det,
  ];
}

function multiply3(m, n) {
  const out = new Array(9);
  for (let r = 0; r < 3; r++) {
    for (let col = 0; col < 3; col++) {
      out[r * 3 + col] = m[r * 3] * n[col] + m[r * 3 + 1] * n[3 + col] + m[r * 3 + 2] * n[6 + col];
    }
  }
  return out;
}

// Deforma la foto in modo che il quadrilatero scelto diventi il rettangolo
// del suo riquadro: mappatura inversa con interpolazione bilineare.
function warpPerspective(work, quad) {
  const w = work.width, h = work.height;
  const xs = quad.map((p) => p.x), ys = quad.map((p) => p.y);
  const rect = [
    { x: Math.min(...xs), y: Math.min(...ys) },
    { x: Math.max(...xs), y: Math.min(...ys) },
    { x: Math.max(...xs), y: Math.max(...ys) },
    { x: Math.min(...xs), y: Math.max(...ys) },
  ];
  if (rect[1].x - rect[0].x < 40 || rect[3].y - rect[0].y < 40) return false;
  const toQuad = unitToQuad(quad);
  const toRect = unitToQuad(rect);
  if (!toQuad || !toRect) return false;
  const rectInv = invert3(toRect);
  if (!rectInv) return false;
  const H = multiply3(toQuad, rectInv); // destinazione → sorgente
  const ctx = work.getContext("2d");
  const src = ctx.getImageData(0, 0, w, h).data;
  const out = ctx.createImageData(w, h);
  const dst = out.data;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const sw = H[6] * x + H[7] * y + H[8];
      let sx = (H[0] * x + H[1] * y + H[2]) / sw;
      let sy = (H[3] * x + H[4] * y + H[5]) / sw;
      sx = Math.max(0, Math.min(w - 1.001, sx));
      sy = Math.max(0, Math.min(h - 1.001, sy));
      const x0 = sx | 0, y0 = sy | 0;
      const ax = sx - x0, ay = sy - y0;
      const o00 = (y0 * w + x0) * 4, o10 = o00 + 4, o01 = o00 + w * 4, o11 = o01 + 4;
      const di = (y * w + x) * 4;
      for (let ch = 0; ch < 3; ch++) {
        dst[di + ch] =
          (src[o00 + ch] * (1 - ax) + src[o10 + ch] * ax) * (1 - ay) +
          (src[o01 + ch] * (1 - ax) + src[o11 + ch] * ax) * ay;
      }
      dst[di + 3] = 255;
    }
  }
  ctx.putImageData(out, 0, 0);
  return true;
}

$("#pe-straighten").addEventListener("click", () => {
  if (!pe || pe.busy) return;
  peSnapshot();
  peStage.classList.add("pe-busy");
  setTimeout(() => {
    const ok = warpPerspective(pe.work, pe.corners);
    peStage.classList.remove("pe-busy");
    if (!ok) { toast("Angoli troppo vicini o incrociati: allargali un po'"); pe.undoStack.pop(); return; }
    pe.corners = peDefaultCorners(pe.work.width, pe.work.height);
    peRedraw();
    toast("Foto in squadra! Ripeti se serve un ritocco fine");
  }, 30);
});

$("#pe-corners-reset").addEventListener("click", () => {
  if (!pe) return;
  pe.corners = peDefaultCorners(pe.work.width, pe.work.height);
  peRedraw();
});

$("#pe-mode-brush").addEventListener("click", () => setPeMode("brush"));
$("#pe-mode-corners").addEventListener("click", () => setPeMode("corners"));

$("#env-photo-straighten").addEventListener("click", () => {
  if (state.photo) openPhotoEditor(state.photo, "corners");
});

$("#pe-done").addEventListener("click", () => {
  if (!pe) return;
  const dataUrl = pe.work.toDataURL("image/jpeg", .9);
  closePhotoEditor();
  applyEditedPhoto(dataUrl, "Foto pronta: regola la parete con i cursori");
});

$("#pe-close").addEventListener("click", closePhotoEditor);
peEl.addEventListener("click", (event) => {
  if (event.target === peEl) closePhotoEditor();
});

/* ---------- 16c. Render prospettico sulla scena ¾ ---------- */

const RENDER_MARGIN = 60; // mm attorno alla parete per cornice e ombra

// SVG della sola parete (niente ambiente), in coordinate mm locali.
// Copre dal modulo più basso al filo superiore; le quote diverse lasciano
// trasparenza sotto i moduli sospesi (il compositing la salta via alpha).
function buildWallOnlySVG(ppm) {
  const W = wallWidth();
  const bMin = minColBaseline();
  const H = state.height - bMin; // altezza del riquadro locale
  const M = RENDER_MARGIN;
  const vw = W + M * 2, vh = H + M * 2;
  // absY (mm da terra) → y locale
  const localY = (absY) => M + (state.height - absY);
  const parts = [];
  parts.push(svgDefs(vw));
  // cornici per gruppi di moduli a pari quota
  {
    let runStart = 0;
    for (let c = 1; c <= state.cols.length; c++) {
      if (c === state.cols.length || colBaseline(state.cols[c]) !== colBaseline(state.cols[runStart])) {
        const b = colBaseline(state.cols[runStart]);
        const rx0 = M + colOffsetMm(runStart);
        const rw = state.cols.slice(runStart, c).reduce((s, col) => s + col.width, 0);
        parts.push(`<rect x="${rx0 - 14}" y="${M - 14}" width="${rw + 28}" height="${state.height - b + 28}" rx="10" fill="#1d1b18" filter="url(#wall-shadow)"/>`);
        runStart = c;
      }
    }
  }
  let cursor = M;
  state.cols.forEach((col, c) => {
    let y = localY(colBaseline(col));
    col.panels.forEach((panel, i) => {
      y -= panel.height;
      if (!panel.mergeId) parts.push(renderPanelSVG(panel, cursor, y, col.width, panel.height, c, i));
    });
    cursor += col.width;
  });
  const ids = new Set();
  state.cols.forEach((col) => col.panels.forEach((p) => { if (p.mergeId) ids.add(p.mergeId); }));
  ids.forEach((id) => {
    const info = groupInfo(id);
    if (!info) return;
    parts.push(renderPanelSVG(info.panel, M + info.x0, localY(info.bottom) - info.height, info.width, info.height, info.members[0].c, info.members[0].i));
  });
  // velatura per modulo
  {
    let sx0 = M;
    state.cols.forEach((col) => {
      parts.push(`<rect x="${sx0}" y="${M}" width="${col.width}" height="${colStackHeight(col)}" fill="url(#wall-sheen)" pointer-events="none"/>`);
      sx0 += col.width;
    });
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vw} ${vh}" width="${Math.round(vw * ppm)}" height="${Math.round(vh * ppm)}">${parts.join("")}</svg>`;
}

function loadImageAsync(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Omografia dal piano parete (mm, origine al centro-letto, y verso il basso
// dal soffitto) ai pixel della scena ¾, tramite il rettangolo di riferimento.
function wallPlaneHomography(quad) {
  const REF_X = 1650, REF_H = 2700;
  const mmQuad = [
    { x: -REF_X, y: 0 }, { x: REF_X, y: 0 },
    { x: REF_X, y: REF_H }, { x: -REF_X, y: REF_H },
  ];
  const pxQuad = quad.corners.map(([x, y]) => ({ x, y }));
  const mmH = unitToQuad(mmQuad);
  const pxH = unitToQuad(pxQuad);
  if (!mmH || !pxH) return null;
  const mmInv = invert3(mmH);
  if (!mmInv) return null;
  return { forward: multiply3(pxH, mmInv), inverse: invert3(multiply3(pxH, mmInv)) };
}

const applyH = (H, x, y) => {
  const w = H[6] * x + H[7] * y + H[8];
  return [(H[0] * x + H[1] * y + H[2]) / w, (H[3] * x + H[4] * y + H[5]) / w];
};

// Compone la parete configurata nella scena ¾: campionamento inverso
// con bilineare + velatura di luce coerente con la scena.
async function renderPerspective() {
  const scene = activeScene();
  if (!scene?.quad34) return null;
  const ppm = .62;
  const wallSvg = await inlineTextures(buildWallOnlySVG(ppm));
  const wallImg = await loadImageAsync("data:image/svg+xml;charset=utf-8," + encodeURIComponent(wallSvg));
  const wallCanvas = document.createElement("canvas");
  wallCanvas.width = wallImg.width;
  wallCanvas.height = wallImg.height;
  wallCanvas.getContext("2d").drawImage(wallImg, 0, 0);
  const wallData = wallCanvas.getContext("2d").getImageData(0, 0, wallCanvas.width, wallCanvas.height);

  const bg = await loadImageAsync(scene.quad34.src);
  const canvas = document.createElement("canvas");
  canvas.width = bg.naturalWidth;
  canvas.height = bg.naturalHeight;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bg, 0, 0);

  const homography = wallPlaneHomography(scene.quad34);
  if (!homography) return null;

  const W = wallWidth(), M = RENDER_MARGIN;
  // limiti della parete (con margine ombra) sul piano, y dal soffitto in giù:
  // dal filo superiore comune al modulo più basso (le quote diverse sono
  // gestite dalla trasparenza del riquadro piatto)
  const top = 2700 - state.height;
  const xMin = -W / 2 - M, xMax = W / 2 + M;
  const yMin = top - M, yMax = 2700 - minColBaseline() + M;

  // bounding box in pixel scena dei 4 angoli proiettati
  const cornersPx = [
    applyH(homography.forward, xMin, yMin), applyH(homography.forward, xMax, yMin),
    applyH(homography.forward, xMax, yMax), applyH(homography.forward, xMin, yMax),
  ];
  const bx0 = Math.max(0, Math.floor(Math.min(...cornersPx.map((p) => p[0]))));
  const bx1 = Math.min(canvas.width - 1, Math.ceil(Math.max(...cornersPx.map((p) => p[0]))));
  const by0 = Math.max(0, Math.floor(Math.min(...cornersPx.map((p) => p[1]))));
  const by1 = Math.min(canvas.height - 1, Math.ceil(Math.max(...cornersPx.map((p) => p[1]))));

  const out = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const shade = scene.quad34.shade || { dir: 1, strength: 0 };
  const src = wallData.data, sw = wallCanvas.width, sh = wallCanvas.height;

  // confini fisici del muro nella scena: la parete non può coprire
  // soffitto, pavimento o le pareti laterali della stanza
  const roomBounds = scene.quad34.bounds || [-1650, 1650];

  for (let y = by0; y <= by1; y++) {
    for (let x = bx0; x <= bx1; x++) {
      const [mmX, mmY] = applyH(homography.inverse, x + .5, y + .5);
      if (mmX < xMin || mmX > xMax || mmY < yMin || mmY > yMax) continue;
      if (mmX < roomBounds[0] || mmX > roomBounds[1] || mmY < 15 || mmY > 2700) continue;
      let sx = (mmX - xMin) * ppm;
      let sy = (mmY - yMin) * ppm;
      sx = Math.max(0, Math.min(sw - 1.001, sx));
      sy = Math.max(0, Math.min(sh - 1.001, sy));
      const x0 = sx | 0, y0 = sy | 0, ax = sx - x0, ay = sy - y0;
      const o00 = (y0 * sw + x0) * 4, o10 = o00 + 4, o01 = o00 + sw * 4, o11 = o01 + 4;
      const alpha = ((src[o00 + 3] * (1 - ax) + src[o10 + 3] * ax) * (1 - ay) +
        (src[o01 + 3] * (1 - ax) + src[o11 + 3] * ax) * ay) / 255;
      if (alpha < .01) continue;
      // luce di scena: attenuazione verso il lato che si allontana
      const t = (mmX + W / 2 + M) / (W + 2 * M);
      const lightFactor = 1 - shade.strength * (shade.dir > 0 ? t : 1 - t);
      const di = (y * canvas.width + x) * 4;
      for (let ch = 0; ch < 3; ch++) {
        const value = ((src[o00 + ch] * (1 - ax) + src[o10 + ch] * ax) * (1 - ay) +
          (src[o01 + ch] * (1 - ax) + src[o11 + ch] * ax) * ay) * lightFactor;
        out.data[di + ch] = out.data[di + ch] * (1 - alpha) + value * alpha;
      }
    }
  }
  ctx.putImageData(out, 0, 0);
  // primo piano della scena (letto, arredi): torna davanti alla parete
  // ridisegnando la foto originale dentro le sagome calibrate, con bordo
  // sfumato (~1.5 px) perché il ritaglio netto tradirebbe il fotomontaggio
  const occl = scene.quad34.occl;
  if (occl?.length) {
    const path = new Path2D();
    occl.forEach((poly) => {
      poly.forEach(([px, py], index) => (index ? path.lineTo(px, py) : path.moveTo(px, py)));
      path.closePath();
    });
    const fg = document.createElement("canvas");
    fg.width = canvas.width;
    fg.height = canvas.height;
    const fx = fg.getContext("2d");
    fx.filter = "blur(1.5px)";
    fx.fillStyle = "#fff";
    fx.fill(path);
    fx.filter = "none";
    fx.globalCompositeOperation = "source-in";
    fx.drawImage(bg, 0, 0);
    ctx.drawImage(fg, 0, 0);
  }
  return canvas;
}

// Taratura (solo sviluppo, da console): griglia del piano parete proiettata
// sulla scena ¾ — verde: soffitto, pavimento e centrale; rosso: passo 300 mm.
window.__calib = async function (sceneId, corners) {
  const scene = PHOTO_SCENES.find((s) => s.id === sceneId);
  if (!scene?.quad34) return "scena senza quad34";
  if (corners) scene.quad34.corners = corners;
  const bg = await loadImageAsync(scene.quad34.src);
  let host = document.querySelector("#__calib");
  if (!host) {
    host = document.createElement("canvas");
    host.id = "__calib";
    host.style.cssText = "position:fixed;top:0;left:0;z-index:999;width:100vw;height:auto;background:#000;cursor:pointer";
    document.body.appendChild(host);
    host.addEventListener("click", () => host.remove());
  }
  host.width = bg.naturalWidth;
  host.height = bg.naturalHeight;
  const ctx = host.getContext("2d");
  ctx.drawImage(bg, 0, 0);
  const H = wallPlaneHomography(scene.quad34).forward;
  const b = scene.quad34.bounds || [-1650, 1650];
  ctx.lineWidth = 4;
  const line = (x1, y1, x2, y2, color) => {
    ctx.strokeStyle = color;
    ctx.beginPath();
    for (let t = 0; t <= 24; t++) {
      const p = applyH(H, x1 + (x2 - x1) * t / 24, y1 + (y2 - y1) * t / 24);
      if (t) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]);
    }
    ctx.stroke();
  };
  for (let x = Math.ceil(b[0] / 300) * 300; x <= b[1]; x += 300) {
    line(x, 0, x, 2700, x === 0 ? "rgba(80,255,120,.9)" : "rgba(255,80,60,.7)");
  }
  for (let y = 0; y <= 2700; y += 675) {
    line(b[0], y, b[1], y, y === 0 || y === 2700 ? "rgba(80,255,120,.9)" : "rgba(255,80,60,.7)");
  }
  return "griglia su " + sceneId;
};

const renderOverlay = $("#render-overlay");

$("#btn-render34").addEventListener("click", async () => {
  const scene = activeScene();
  if (!scene?.quad34) {
    toast("Scegli prima una scena fotografica (es. Camera hotel)");
    return;
  }
  const btn = $("#btn-render34");
  btn.disabled = true;
  btn.textContent = "✦ Sto renderizzando…";
  try {
    const canvas = await renderPerspective();
    if (!canvas) { toast("Render non riuscito"); return; }
    const dataUrl = canvas.toDataURL("image/jpeg", .92);
    $("#render-result").src = dataUrl;
    $("#render-download").href = dataUrl;
    renderOverlay.hidden = false;
    document.body.style.overflow = "hidden";
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span aria-hidden="true">✦</span> Renderizza';
  }
});

function closeRenderOverlay() {
  renderOverlay.hidden = true;
  document.body.style.overflow = "";
}

$("#render-close").addEventListener("click", closeRenderOverlay);
$("#render-back").addEventListener("click", closeRenderOverlay);
renderOverlay.addEventListener("click", (event) => {
  if (event.target === renderOverlay) closeRenderOverlay();
});

// ESC riporta sempre alla composizione: render → 3D → tavola, in ordine
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (!renderOverlay.hidden) { closeRenderOverlay(); return; }
  if (!overlay3D.hidden) { close3D(); return; }
  if (techView) $("#btn-tech").click();
});

/* ---------- 17. Azioni toolbar ---------- */

$("#btn-shuffle").addEventListener("click", () => {
  dismissCoach();
  mutate(() => shuffleComposition(), "Nuova combinazione! Non ti piace? Premi ancora ✦");
});

$("#btn-undo").addEventListener("click", () => {
  if (!undoStack.length) { toast("Niente da annullare"); return; }
  state = undoStack.pop();
  selection = null;
  refresh();
  toast("Modifica annullata");
});

/* ---------- 18. Coach ---------- */

function dismissCoach() {
  if (!coachEl.hidden) {
    coachEl.hidden = true;
    try { localStorage.setItem("iwStudioCoach", "done"); } catch { }
  }
}

$("#coach-dismiss").addEventListener("click", dismissCoach);

/* ---------- 19. Vista 3D ---------- */

const overlay3D = $("#studio-3d");
const stage3D = $("#studio-3d-stage");
const loading3D = $("#studio-3d-loading");
let three = null; // { renderer, scene, camera, wallGroup, floor, raf, yaw, targetYaw, pitch, targetPitch, zoom, targetZoom, templates }
const texturePromises3D = new Map();

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Script non caricato: ${src}`));
    document.head.appendChild(script);
  });
}

async function ensureThree() {
  if (!globalThis.THREE) await loadScript("assets/three-gltf-bundle.js");
  if (!globalThis.IW_MODEL_DATA) await loadScript("assets/models/iw-models.js");
  if (!three) init3D();
  if (!three.templatesReady) await loadTemplates3D();
}

function base64ToArrayBuffer(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes.buffer;
}

async function loadTemplates3D() {
  const loader = new GLTFLoader();
  three.templates = {};
  await Promise.all(Object.entries(IW_MODEL_DATA || {}).map(([name, encoded]) =>
    new Promise((resolve) => {
      loader.parse(base64ToArrayBuffer(encoded), "", (gltf) => {
        three.templates[name] = gltf.scene;
        resolve();
      }, () => resolve());
    })
  ));
  three.templatesReady = true;
}

function init3D() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xe9e5dd);
  scene.fog = new THREE.Fog(0xe9e5dd, 12, 26);
  const camera = new THREE.PerspectiveCamera(34, 1, .1, 100);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  // Esposizione da "studio prodotto": a 1.05 le finiture slavavano verso il
  // bianco; a ~0.85 con luci più basse il legno e il marmo restano leggibili.
  renderer.toneMappingExposure = .85;
  stage3D.appendChild(renderer.domElement);

  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x8b8377, 1.35);
  scene.add(hemiLight);
  const keyLight = new THREE.DirectionalLight(0xffffff, 2.1);
  keyLight.position.set(-4, 6, 7);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(2048, 2048);
  scene.add(keyLight);
  const warmLight = new THREE.PointLight(0xffd8aa, 9, 12);
  warmLight.position.set(4, 2.5, 4);
  scene.add(warmLight);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 22),
    new THREE.MeshStandardMaterial({ color: 0xcfc9be, roughness: .94 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const backWall = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 14),
    new THREE.MeshStandardMaterial({ color: 0xd8d2c6, roughness: .96 })
  );
  backWall.position.z = -.25;
  backWall.receiveShadow = true;
  scene.add(backWall);

  const wallGroup = new THREE.Group();
  scene.add(wallGroup);

  three = {
    scene, camera, renderer, wallGroup, floor, backWall,
    hemiLight, keyLight, warmLight,
    yaw: 0, targetYaw: -.4, pitch: .12, targetPitch: .12,
    zoom: 9, targetZoom: 7, raf: 0, templates: {}, templatesReady: false,
  };

  // orbita manuale
  let dragging = false, lastX = 0, lastY = 0, pinch = 0;
  const dom = renderer.domElement;
  dom.addEventListener("pointerdown", (event) => {
    dragging = true; lastX = event.clientX; lastY = event.clientY;
    dom.setPointerCapture(event.pointerId);
  });
  dom.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    three.targetYaw = Math.max(-1.1, Math.min(1.1, three.targetYaw + (event.clientX - lastX) * .006));
    three.targetPitch = Math.max(-.05, Math.min(.5, three.targetPitch + (event.clientY - lastY) * .003));
    lastX = event.clientX; lastY = event.clientY;
  });
  dom.addEventListener("pointerup", () => { dragging = false; });
  dom.addEventListener("wheel", (event) => {
    event.preventDefault();
    three.targetZoom = Math.max(2.6, Math.min(13, three.targetZoom + event.deltaY * .004));
  }, { passive: false });
  dom.addEventListener("touchstart", (event) => {
    if (event.touches.length === 2) pinch = touchDistance(event);
  }, { passive: true });
  dom.addEventListener("touchmove", (event) => {
    if (event.touches.length === 2 && pinch) {
      const distance = touchDistance(event);
      three.targetZoom = Math.max(2.6, Math.min(13, three.targetZoom * (pinch / distance)));
      pinch = distance;
    }
  }, { passive: true });
}

function touchDistance(event) {
  const [a, b] = event.touches;
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

function dinocTexture3D(mat) {
  if (!texturePromises3D.has(mat.code)) {
    // priorità alla texture HD; per i materiali omogenei senza HD si usa
    // la versione resa senza giunture
    const srcPromise = finishMapping(mat).mode === "seamless" && !matHDTileable(mat)
      ? ensureSeamless(mat)
      : Promise.resolve(matSrc(mat));
    texturePromises3D.set(mat.code, srcPromise.then((src) => new Promise((resolve, reject) => {
      new THREE.TextureLoader().load(src, (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        resolve(texture);
      }, undefined, reject);
    })));
  }
  return texturePromises3D.get(mat.code);
}

function finishSettings(mat) {
  if (!mat) return { roughness: .72, metalness: 0 };
  if (mat.family === "Metal") return { roughness: .42, metalness: .28 };
  if (mat.family === "Solid Color") return { roughness: .58, metalness: 0 };
  if (mat.family === "Carbon") return { roughness: .5, metalness: .08 };
  return { roughness: .76, metalness: 0 };
}

function applyDinoc3D(material, panel, widthMm, offXmm = 0, offYmm = 0) {
  const mat = MAT_BY_CODE.get(panel.finish);
  if (!mat) return material;
  const settings = finishSettings(mat);
  material.color.set(mat.averageColor || "#ffffff");
  material.roughness = settings.roughness;
  material.metalness = settings.metalness;
  dinocTexture3D(mat).then((source) => {
    const texture = source.clone();
    // Stessa strategia di posa del 2D: fogli per i legni, book-match per le
    // pietre, continuo senza giunture per i materiali omogenei; offset
    // ancorato alla posizione del pannello, così la posa prosegue anche in 3D.
    const map = finishMapping(mat);
    const sx = map.mode === "sheet" ? map.w : map.s;
    const sy = map.mode === "sheet" ? map.h : map.s;
    texture.wrapS = map.mode === "seamless" ? THREE.RepeatWrapping : THREE.MirroredRepeatWrapping;
    texture.wrapT = map.mode === "bookmatch" ? THREE.MirroredRepeatWrapping : THREE.RepeatWrapping;
    const repX = Math.max(.02, widthMm / sx);
    const repY = Math.max(.02, panel.height / sy);
    if (panelGrain(panel) === "h") {
      texture.center.set(.5, .5);
      texture.rotation = Math.PI / 2;
      texture.repeat.set(repY, repX);
    } else {
      texture.repeat.set(repX, repY);
    }
    texture.offset.set(offXmm / sx, offYmm / sy);
    texture.anisotropy = three.renderer.capabilities.getMaxAnisotropy();
    texture.needsUpdate = true;
    material.color.setHex(0xffffff);
    material.map = texture;
    material.needsUpdate = true;
  }).catch(() => { });
  return material;
}

const STRUCTURE_FRONT_Z = .09;

function panelVisual3D(panel, widthMm, offXmm, offYmm) {
  const group = new THREE.Group();
  const width = widthMm / 1000;
  const height = panel.height / 1000;

  const template = three.templates[`${panel.type}_${widthMm}_${panel.height}`];
  if (template) {
    const model = template.clone(true);
    model.rotation.x = -Math.PI / 2;
    model.scale.y = -1;
    model.position.set(-width / 2, -height / 2, STRUCTURE_FRONT_Z);
    model.traverse((item) => {
      if (item.isMesh) {
        item.castShadow = true;
        item.receiveShadow = true;
        item.material = item.material.clone();
        item.material.color.setHex(panel.type === "shelf" ? 0x9a7f61 : 0x393632);
        item.material.roughness = .5;
        item.material.metalness = .18;
        applyDinoc3D(item.material, panel, widthMm, offXmm, offYmm);
      }
    });
    group.add(model);
    return group;
  }

  const thickness = panel.type === "lux" ? .012 : panel.type === "board" ? .05 : .004;
  const surfaceMaterial = applyDinoc3D(new THREE.MeshStandardMaterial({ roughness: panel.type === "board" ? .85 : .72 }), panel, widthMm, offXmm, offYmm);
  const surface = new THREE.Mesh(
    new THREE.BoxGeometry(Math.max(.01, width - .008), Math.max(.01, height - .006), thickness),
    surfaceMaterial
  );
  surface.position.z = STRUCTURE_FRONT_Z + thickness / 2;
  surface.castShadow = true;
  surface.receiveShadow = true;
  group.add(surface);

  if (panel.type === "lux") {
    const addLed = (y) => {
      const glow = new THREE.Mesh(
        new THREE.BoxGeometry(width * .88, .016, .016),
        new THREE.MeshBasicMaterial({ color: 0xffd892 })
      );
      glow.position.set(0, y, STRUCTURE_FRONT_Z + .03);
      group.add(glow);
      const halo = new THREE.PointLight(0xffd8a0, 4, .9);
      halo.position.set(0, y, STRUCTURE_FRONT_Z + .12);
      group.add(halo);
    };
    if (panel.variant === "LED_T" || panel.variant === "LED_TB") addLed(height / 2 - .02);
    if (panel.variant !== "LED_T") addLed(-height / 2 + .02);
  }
  return group;
}

function build3DWall() {
  const group = three.wallGroup;
  while (group.children.length) {
    const child = group.children.pop();
    child.traverse((item) => {
      item.geometry?.dispose();
      if (Array.isArray(item.material)) item.material.forEach((m) => m.dispose());
      else item.material?.dispose();
    });
  }
  const W = wallWidth() / 1000;
  // Quote per modulo: il sistema di riferimento verticale è centrato
  // sull'altezza totale della parete; il pavimento sta a -height/2.
  const floorY = -state.height / 2000;
  let cursor = -W / 2;
  let colXmm = 0;
  state.cols.forEach((col) => {
    const width = col.width / 1000;
    const b = colBaseline(col) / 1000;
    const Hc = colStackHeight(col) / 1000;
    const root = new THREE.Group();
    root.position.x = cursor + width / 2;
    const structure = new THREE.Mesh(
      new THREE.BoxGeometry(Math.max(.01, width - .006), Hc, .18),
      new THREE.MeshStandardMaterial({ color: 0x35322d, roughness: .7, metalness: .12 })
    );
    structure.position.y = floorY + b + Hc / 2;
    structure.castShadow = true;
    structure.receiveShadow = true;
    root.add(structure);
    let bottom = floorY + b;
    let bottomMm = colBaseline(col);
    col.panels.forEach((panel) => {
      if (!panel.mergeId) {
        const visual = panelVisual3D(panel, col.width, colXmm, bottomMm);
        visual.position.y = bottom + panel.height / 2000;
        root.add(visual);
      }
      bottom += panel.height / 1000;
      bottomMm += panel.height;
    });
    group.add(root);
    cursor += width;
    colXmm += col.width;
  });
  // pannelli uniti: un unico volume largo quanto il rettangolo del gruppo
  const mergedIds = new Set();
  state.cols.forEach((col) => col.panels.forEach((p) => { if (p.mergeId) mergedIds.add(p.mergeId); }));
  mergedIds.forEach((id) => {
    const info = groupInfo(id);
    if (!info) return;
    const visual = panelVisual3D(info.panel, info.width, info.x0, info.bottom);
    visual.position.x = -W / 2 + (info.x0 + info.width / 2) / 1000;
    visual.position.y = floorY + (info.bottom + info.height / 2) / 1000;
    group.add(visual);
  });
  three.floor.position.y = floorY - .001;
  three.backWall.position.y = 0;
  // Studio neutro deliberato, senza arredo né stanze ricostruite: il 3D è il
  // viewer tecnico del prodotto (volumi, spessori, quote), l'ambientazione la
  // fanno le scene fotografiche del 2D e il fotoinserimento "Renderizza".
  three.targetZoom = Math.max(4.6, W * 1.35 + 2.4);
  three.zoom = three.targetZoom + 2;
  three.targetYaw = -.4;
  three.yaw = .3;
  three.targetPitch = .12;
}

function animate3D() {
  three.yaw += (three.targetYaw - three.yaw) * .08;
  three.pitch += (three.targetPitch - three.pitch) * .08;
  three.zoom += (three.targetZoom - three.zoom) * .07;
  const { camera } = three;
  camera.position.set(
    Math.sin(three.yaw) * three.zoom,
    Math.sin(three.pitch) * three.zoom * .5 + .1,
    Math.cos(three.yaw) * three.zoom
  );
  camera.lookAt(0, 0, 0);
  three.renderer.render(three.scene, three.camera);
  three.raf = requestAnimationFrame(animate3D);
}

function resize3D() {
  if (!three) return;
  const { clientWidth, clientHeight } = stage3D;
  if (!clientWidth || !clientHeight) return;
  three.camera.aspect = clientWidth / clientHeight;
  three.camera.updateProjectionMatrix();
  three.renderer.setSize(clientWidth, clientHeight);
}

async function open3D() {
  dismissCoach();
  overlay3D.hidden = false;
  document.body.style.overflow = "hidden";
  loading3D.style.display = "flex";
  try {
    await ensureThree();
    build3DWall();
    resize3D();
    cancelAnimationFrame(three.raf);
    animate3D();
    loading3D.style.display = "none";
  } catch (error) {
    console.warn("Vista 3D non disponibile", error);
    close3D();
    toast("La vista 3D non è disponibile su questo dispositivo");
  }
}

function close3D() {
  overlay3D.hidden = true;
  document.body.style.overflow = "";
  if (three) cancelAnimationFrame(three.raf);
}

$("#btn-3d").addEventListener("click", open3D);
$("#btn-tech").addEventListener("click", () => {
  techView = !techView;
  const btn = $("#btn-tech");
  btn.classList.toggle("is-active", techView);
  btn.setAttribute("aria-pressed", techView ? "true" : "false");
  $("#tech-exit").hidden = !techView;
  renderWall();
});
// uscita esplicita dalla tavola, sempre visibile sullo stage
$("#tech-exit").addEventListener("click", () => $("#btn-tech").click());
$("#studio-3d-close").addEventListener("click", close3D);
overlay3D.addEventListener("click", (event) => {
  if (event.target === overlay3D) close3D();
});
window.addEventListener("resize", () => { if (!overlay3D.hidden) resize3D(); });

/* ---------- 20. Avvio ---------- */

function loadInitialState() {
  const fromHash = location.hash.match(/#d=([\w-]+)/);
  if (fromHash) {
    const parsed = decodeState(fromHash[1]);
    if (parsed) return parsed;
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && Array.isArray(parsed.cols) && parsed.cols.length) {
        parsed.photo = null;
        if (parsed.env?.type === "photo") parsed.env = { type: "preset", id: parsed.env.id || "living" };
        if (parsed.env?.type === "scene" && !sceneById(parsed.env.id)) parsed.env = { type: "preset", id: "living" };
        parsed.baseline = BASELINES.includes(parsed.baseline) ? parsed.baseline : 0;
        parsed.bed = Boolean(parsed.bed) && parsed.baseline >= 450;
        // migrazione: stati salvati prima della quota per modulo
        parsed.cols.forEach((col) => {
          if (!BASELINES.includes(col.baseline)) col.baseline = parsed.baseline;
        });
        sanitizeColumns(parsed.cols);
        parsed.cols.forEach((col) => reconcileColumn(col, parsed.height - col.baseline));
        return parsed;
      }
    }
  } catch { }
  return defaultState();
}

function init() {
  state = loadInitialState();
  // reconcileColumn usa state.height: rifiniamo dopo l'assegnazione
  state.cols.forEach((col) => reconcileColumn(col));
  renderEnvCats();
  renderEnvGrid();
  renderFinishTabs();
  renderFinishModes();
  updateEnvControls();
  openDock("ambiente");
  refresh();
  try {
    if (localStorage.getItem("iwStudioCoach") !== "done") coachEl.hidden = false;
  } catch {
    coachEl.hidden = false;
  }
}

init();
