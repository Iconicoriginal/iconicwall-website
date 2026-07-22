/* Genera texture HD procedurali tono-fedeli per le 48 finiture curate.
   I colori vengono estratti dal campione 3M originale; il pattern viene
   ricostruito secondo la fisica del materiale (venature, patina, fibra…).
   Output: assets/dinoc/textures-hd/{code}.webp + manifest.js               */

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const SITE = "C:/Users/utente/.claude/SitoWeb IconicWall";
const OUT = path.join(SITE, "assets/dinoc/textures-hd");
require(path.join(SITE, "assets/dinoc/catalog-curated.js"));
const CATALOG = globalThis.IW_DINOC_CURATED;

/* ---------- rumore deterministico (periodico su richiesta) ---------- */

function hash2(xi, yi, seed) {
  let h = Math.imul(xi | 0, 374761393) ^ Math.imul(yi | 0, 668265263) ^ Math.imul(seed | 0, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const fade = (t) => t * t * (3 - 2 * t);

// rumore value 2D; se period > 0 la griglia è toroidale (tileable)
function noise2(x, y, seed, period = 0) {
  let x0 = Math.floor(x), y0 = Math.floor(y);
  const tx = fade(x - x0), ty = fade(y - y0);
  let x1 = x0 + 1, y1 = y0 + 1;
  if (period > 0) {
    const m = (v) => ((v % period) + period) % period;
    x0 = m(x0); x1 = m(x1); y0 = m(y0); y1 = m(y1);
  }
  const a = hash2(x0, y0, seed), b = hash2(x1, y0, seed);
  const c = hash2(x0, y1, seed), d = hash2(x1, y1, seed);
  return (a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + d * tx) * ty;
}

// fbm su [0,1)²; cells = celle della prima ottava; tile=true → senza giunture
function fbm(u, v, seed, { cells = 4, octaves = 5, gain = .5, lacunarity = 2, tile = false } = {}) {
  let amp = 1, freq = cells, sum = 0, norm = 0;
  for (let o = 0; o < octaves; o++) {
    sum += amp * noise2(u * freq, v * freq, seed + o * 101, tile ? freq : 0);
    norm += amp;
    amp *= gain;
    freq *= lacunarity;
  }
  return sum / norm;
}

const ridge = (n) => 1 - Math.abs(2 * n - 1);
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;
const mixRGB = (c1, c2, t) => [mix(c1[0], c2[0], t), mix(c1[1], c2[1], t), mix(c1[2], c2[2], t)];
const lighten = (c, f) => [clamp01(c[0] / 255 * f) * 255, clamp01(c[1] / 255 * f) * 255, clamp01(c[2] / 255 * f) * 255];

/* ---------- estrazione colori dal campione originale ---------- */

async function samplePalette(file) {
  const raw = await sharp(file).resize(48, 48, { fit: "fill" }).removeAlpha().raw().toBuffer();
  const px = [];
  for (let i = 0; i < raw.length; i += 3) px.push([raw[i], raw[i + 1], raw[i + 2]]);
  const luma = (c) => c[0] * .299 + c[1] * .587 + c[2] * .114;
  px.sort((a, b) => luma(a) - luma(b));
  const avg = (list) => list.reduce((s, c) => [s[0] + c[0], s[1] + c[1], s[2] + c[2]], [0, 0, 0]).map((v) => v / list.length);
  const n = px.length;
  const dark = avg(px.slice(0, Math.max(1, n * .08 | 0)));
  const light = avg(px.slice(-(Math.max(1, n * .08 | 0))));
  const mean = avg(px);
  // accento: pixel più lontani cromaticamente dalla media (patine, ossidi)
  const dist = (c) => Math.hypot(c[0] - mean[0], c[1] - mean[1], c[2] - mean[2]);
  const byDist = [...px].sort((a, b) => dist(b) - dist(a));
  const accent = avg(byDist.slice(0, Math.max(1, n * .06 | 0)));
  return { mean, dark, light, accent };
}

/* ---------- generatori per famiglia ---------- */

function renderBuffer(W, H, fn) {
  const buf = Buffer.alloc(W * H * 3);
  for (let y = 0; y < H; y++) {
    const v = y / H;
    for (let x = 0; x < W; x++) {
      const u = x / W;
      const [r, g, b] = fn(u, v);
      const o = (y * W + x) * 3;
      buf[o] = clamp01(r / 255) * 255;
      buf[o + 1] = clamp01(g / 255) * 255;
      buf[o + 2] = clamp01(b / 255) * 255;
    }
  }
  return buf;
}

// MARMO: venature frattali con domain warping, scala da lastra
function genMarble(p, seed) {
  const darkBase = (p.mean[0] * .299 + p.mean[1] * .587 + p.mean[2] * .114) < 128;
  const veinColor = darkBase ? lighten(p.light, 1.25) : p.dark;
  const cloudColor = darkBase ? lighten(p.mean, 1.35) : lighten(p.mean, .8);
  return (u, v) => {
    const wx = fbm(u, v, seed + 11, { cells: 3, octaves: 4 }) * 1.4;
    const wy = fbm(u, v, seed + 23, { cells: 3, octaves: 4 }) * 1.4;
    const main = ridge(fbm(u + wx * .45, v + wy * .45, seed, { cells: 2.3, octaves: 5, gain: .55 }));
    const second = ridge(fbm(u + wy * .3, v + wx * .3, seed + 57, { cells: 4.2, octaves: 5 }));
    const cloud = fbm(u + wx * .2, v + wy * .2, seed + 91, { cells: 5, octaves: 4 });
    let c = mixRGB(p.mean, cloudColor, cloud * .55);
    c = mixRGB(c, veinColor, Math.pow(smooth(.8, .985, main), 1.6) * .95);
    c = mixRGB(c, veinColor, Math.pow(smooth(.86, .99, second), 2) * .45);
    const grain = (noise2(u * 900, v * 900, seed + 7) - .5) * 8;
    return [c[0] + grain, c[1] + grain, c[2] + grain];
  };
}

// METALLO OSSIDATO: spazzolatura direzionale + patina a chiazze + puntinature
function genMetal(p, seed) {
  return (u, v) => {
    const brush = (fbm(u, v, seed, { cells: 2, octaves: 6, gain: .62 }) - .5) * .5
      + (noise2(u * 14, v * 700, seed + 3) - .5) * .22;
    let c = mixRGB(p.dark, p.light, clamp01(.52 + brush));
    const blotch = fbm(u, v, seed + 41, { cells: 3.4, octaves: 5, tile: true });
    c = mixRGB(c, p.accent, Math.pow(smooth(.52, .8, blotch), 1.4) * .6);
    const stain = fbm(u, v, seed + 77, { cells: 7, octaves: 4, tile: true });
    c = mixRGB(c, p.dark, Math.pow(smooth(.62, .88, stain), 1.8) * .4);
    const speck = noise2(u * 480, v * 480, seed + 5, 480);
    if (speck > .965) c = mixRGB(c, p.dark, .5);
    const sheen = Math.sin((u * .6 + v * .15) * Math.PI * 2) * .04;
    return [c[0] * (1 + sheen), c[1] * (1 + sheen), c[2] * (1 + sheen)];
  };
}

// LEGNO: fibra verticale continua, anelli e striature fini (foglio intero)
function genWood(p, seed) {
  return (u, v) => {
    const warp = fbm(u, v, seed + 19, { cells: 3, octaves: 4 }) * .35;
    const rings = Math.sin((u * 5.5 + warp * 2.2 + fbm(u, v, seed + 31, { cells: 2, octaves: 3 })) * Math.PI * 2);
    const ringT = .5 + .5 * rings;
    const streaks = fbm(u * 8, v * .55, seed, { cells: 6, octaves: 5, gain: .58 });
    const fine = noise2(u * 620, v * 26, seed + 9) * .5 + noise2(u * 1400, v * 60, seed + 13) * .5;
    let t = clamp01(ringT * .42 + streaks * .48 + fine * .1);
    let c = mixRGB(p.dark, p.light, t);
    const pore = noise2(u * 1000, v * 140, seed + 21);
    if (pore > .93) c = mixRGB(c, p.dark, .35);
    return c;
  };
}

// TESSUTO: trama ordito/trama periodica con irregolarità del filo
function genTextile(p, seed) {
  const N = 260; // fili per lato
  return (u, v) => {
    const wob = (noise2(u * 40, v * 40, seed + 3, 40) - .5) * .0025;
    const su = u + wob, sv = v - wob;
    const warp = Math.sin(su * N * Math.PI * 2);
    const weft = Math.sin(sv * N * Math.PI * 2);
    const over = Math.sin(su * N * Math.PI) * Math.sin(sv * N * Math.PI) > 0 ? 1 : -1;
    const weave = (warp * .5 + weft * .5) * .5 + over * .16;
    const threadShade = (noise2(Math.floor(su * N), Math.floor(sv * N), seed + 7, N) - .5) * .3;
    const cloudiness = (fbm(su, sv, seed + 11, { cells: 5, octaves: 4, tile: true }) - .5) * .35;
    const t = clamp01(.52 + weave * .28 + threadShade + cloudiness);
    return mixRGB(p.dark, p.light, t);
  };
}

// PELLE: grana cellulare con solchi scuri e microrilievo
function genLeather(p, seed) {
  return (u, v) => {
    const wx = fbm(u, v, seed + 5, { cells: 8, octaves: 3, tile: true }) * .18;
    const crease = ridge(fbm(u + wx, v - wx, seed, { cells: 26, octaves: 4, gain: .55, tile: true }));
    const cell = fbm(u, v, seed + 17, { cells: 60, octaves: 3, tile: true });
    const mottle = fbm(u, v, seed + 29, { cells: 4, octaves: 4, tile: true });
    let t = clamp01(.55 + (cell - .5) * .35 + (mottle - .5) * .3);
    let c = mixRGB(p.dark, p.light, t);
    c = mixRGB(c, p.dark, Math.pow(smooth(.82, .97, crease), 1.4) * .55);
    c = mixRGB(c, p.light, Math.pow(smooth(.7, .82, crease), 2) * .12);
    return c;
  };
}

// CARBON: saia 2×2 con riflesso alternato dei tow
function genCarbon(p, seed) {
  const T = 42; // tow per lato
  return (u, v) => {
    const tu = u * T, tv = v * T;
    const diag = Math.floor(tu + tv) % 2 === 0;
    const phase = diag ? tu : tv;
    const fiber = Math.abs(Math.sin(phase * Math.PI));
    const sheenDir = diag ? Math.sin(tv * Math.PI * 2) : Math.sin(tu * Math.PI * 2);
    const irregular = (noise2(Math.floor(tu), Math.floor(tv), seed, T) - .5) * .18;
    const t = clamp01(.32 + fiber * .42 + sheenDir * .12 + irregular);
    return mixRGB(p.dark, lighten(p.light, 1.15), t);
  };
}

// CEMENTO: nuvolatura minerale con pori e aloni di cassero
function genConcrete(p, seed) {
  return (u, v) => {
    const mottle = fbm(u, v, seed, { cells: 3.5, octaves: 6, gain: .55, tile: true });
    const fine = fbm(u, v, seed + 13, { cells: 40, octaves: 3, tile: true });
    let c = mixRGB(p.dark, p.light, clamp01(.35 + mottle * .5 + (fine - .5) * .18));
    const pore = noise2(u * 520, v * 520, seed + 5, 520);
    if (pore > .972) c = mixRGB(c, p.dark, .55);
    const band = Math.sin(v * Math.PI * 2 * 2 + mottle * 2) * .03;
    return [c[0] * (1 + band), c[1] * (1 + band), c[2] * (1 + band)];
  };
}

// TINTA UNITA: superficie verniciata con micro-grana e lievissima pennellata
function genSolid(p, seed) {
  return (u, v) => {
    const micro = (noise2(u * 800, v * 800, seed, 800) - .5) * 5;
    const sweep = (fbm(u, v, seed + 9, { cells: 3, octaves: 3, tile: true }) - .5) * 9;
    return [p.mean[0] + micro + sweep, p.mean[1] + micro + sweep, p.mean[2] + micro + sweep];
  };
}

const GENERATORS = {
  Stone: { fn: genMarble, w: 1536, h: 1536 },
  Metal: { fn: genMetal, w: 1024, h: 1024 },
  Wood: { fn: genWood, w: 1024, h: 2048 },
  Textile: { fn: genTextile, w: 1024, h: 1024 },
  Leather: { fn: genLeather, w: 1024, h: 1024 },
  Carbon: { fn: genCarbon, w: 1024, h: 1024 },
  Concrete: { fn: genConcrete, w: 1024, h: 1024 },
  "Solid Color": { fn: genSolid, w: 768, h: 768 },
  // Abstract: pattern autoriali 3M non replicabili proceduralmente → si tiene l'originale
};

/* ---------- pipeline ---------- */

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const manifest = {};
  let done = 0;
  for (const group of CATALOG.groups) {
    for (const mat of group.materials) {
      const gen = GENERATORS[mat.family];
      if (!gen) continue;
      const srcFile = path.join(SITE, mat.texture);
      const palette = await samplePalette(srcFile);
      let seed = 0;
      for (const ch of mat.code) seed = (seed * 31 + ch.charCodeAt(0)) | 0;
      const buf = renderBuffer(gen.w, gen.h, gen.fn(palette, Math.abs(seed)));
      const name = mat.code.toLowerCase().replace(/[^a-z0-9]+/g, "-") + ".webp";
      await sharp(buf, { raw: { width: gen.w, height: gen.h, channels: 3 } })
        .webp({ quality: 80 })
        .toFile(path.join(OUT, name));
      manifest[mat.code] = { src: `assets/dinoc/textures-hd/${name}`, w: gen.w, h: gen.h, tileable: !["Stone", "Wood"].includes(mat.family) };
      done++;
      process.stdout.write(`${mat.code} (${mat.family}) ✓\n`);
    }
  }
  fs.writeFileSync(path.join(OUT, "manifest.js"), "globalThis.IW_HD_TEXTURES=" + JSON.stringify(manifest) + ";\n");
  const total = fs.readdirSync(OUT).reduce((s, f) => s + fs.statSync(path.join(OUT, f)).size, 0);
  console.log(`\n${done} texture HD generate · ${(total / 1024 / 1024).toFixed(1)} MB totali`);
})();
