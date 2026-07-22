// Estrae 48 finiture curate dal catalogo DI-NOC completo, divise in 6 gruppi.
const fs = require("fs");
const path = require("path");

const SITE = "C:/Users/utente/.claude/SitoWeb IconicWall";
require(path.join(SITE, "assets/dinoc/catalog.js"));
const catalog = globalThis.IW_DINOC_CATALOG;

function hexToHsl(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
  if (!m) return { h: 0, s: 0, l: 0.5 };
  const n = parseInt(m[1], 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0, s = 0;
  if (d > 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = (h * 60 + 360) % 360;
  }
  return { h, s, l };
}

// Selezione "spread": ordina per luminosità (poi tinta) e prende n elementi
// equidistanti, evitando serie duplicate quando possibile.
function pickSpread(items, n) {
  const sorted = [...items].sort((a, b) => {
    const A = hexToHsl(a.averageColor), B = hexToHsl(b.averageColor);
    return A.l - B.l || A.h - B.h;
  });
  if (sorted.length <= n) return sorted;
  const picked = [];
  const usedSeries = new Map();
  for (let i = 0; i < n; i++) {
    const idx = Math.round((i * (sorted.length - 1)) / (n - 1));
    // cerca vicino a idx un elemento di una serie non ancora troppo usata
    let best = null;
    for (let off = 0; off <= 10 && !best; off++) {
      for (const j of [idx + off, idx - off]) {
        if (j < 0 || j >= sorted.length) continue;
        const cand = sorted[j];
        if (picked.includes(cand)) continue;
        if ((usedSeries.get(cand.series) || 0) >= Math.ceil(n / 3)) continue;
        best = cand; break;
      }
    }
    if (!best) best = sorted.find((x) => !picked.includes(x));
    picked.push(best);
    usedSeries.set(best.series, (usedSeries.get(best.series) || 0) + 1);
  }
  return picked;
}

const byFamily = {};
for (const m of catalog.materials) (byFamily[m.family] ||= []).push(m);

const GROUPS = [
  { id: "legno", label: "Legno", families: { Wood: 10 } },
  { id: "metallo", label: "Metallo", families: { Metal: 8 } },
  { id: "pietra", label: "Pietra & Cemento", families: { Stone: 5, Concrete: 2 } },
  { id: "tessuti", label: "Tessuti & Pelle", families: { Textile: 5, Leather: 4 } },
  { id: "tinta", label: "Tinta unita", families: { "Solid Color": 6 } },
  { id: "astratti", label: "Astratti & Carbon", families: { Abstract: 6, Carbon: 2 } },
];

const groupsOut = [];
let total = 0;
for (const g of GROUPS) {
  const mats = [];
  for (const [family, count] of Object.entries(g.families)) {
    mats.push(...pickSpread(byFamily[family] || [], count));
  }
  mats.sort((a, b) => hexToHsl(a.averageColor).l - hexToHsl(b.averageColor).l);
  total += mats.length;
  groupsOut.push({ id: g.id, label: g.label, materials: mats });
  console.log(`${g.label}: ${mats.map((m) => m.code).join(", ")}`);
}
console.log("TOTALE:", total);

const out = {
  version: catalog.version,
  source: catalog.source + " — selezione curata IconicWall",
  count: total,
  groups: groupsOut,
};
fs.writeFileSync(
  path.join(SITE, "assets/dinoc/catalog-curated.js"),
  "globalThis.IW_DINOC_CURATED=" + JSON.stringify(out) + ";\n"
);
const size = fs.statSync(path.join(SITE, "assets/dinoc/catalog-curated.js")).size;
console.log("catalog-curated.js scritto:", (size / 1024).toFixed(0), "KB");
