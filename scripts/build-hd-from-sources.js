/* Ricostruisce assets/dinoc/textures-hd dai FILE FOTOGRAFICI 3M originali
   (788×788) a risoluzione nativa: nessuna invenzione, solo il materiale vero.
   Richiede: npm i sharp. Sorgente: cartella "Pattern 3M DiNoc 2024-Rinominati". */

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const SITE = path.resolve(__dirname, "..");
const SOURCE = "C:/Users/utente/iCloudDrive/Iconic/3M DiNoc/Pattern 3M DiNoc 2024-Rinominati";
const OUT = path.join(SITE, "assets/dinoc/textures-hd");

require(path.join(SITE, "assets/dinoc/catalog-curated.js"));
const CATALOG = globalThis.IW_DINOC_CURATED;

/* Rimozione dell'illuminazione fotografica ("de-lighting"): il campione 3M
   è fotografato con luce non uniforme; quel gradiente, ripetuto, crea bande.
   Dividiamo per la versione sfocata così resta solo il materiale.
   - forte e a media frequenza sui materiali omogenei;
   - delicatissima (solo gradiente d'insieme) dove le variazioni grandi sono
     venature vere: pietre, legni, astratti. */
const FLATTEN = {
  Metal: { strength: 1, cells: 12 },
  Textile: { strength: 1, cells: 12 },
  Leather: { strength: .9, cells: 10 },
  "Solid Color": { strength: 1, cells: 10 },
  Concrete: { strength: .8, cells: 8 },
  Carbon: { strength: .9, cells: 12 },
  Stone: { strength: .55, cells: 3 },
  Wood: { strength: .6, cells: 3 },
  Abstract: { strength: .5, cells: 3 },
};

async function flattenLighting(file, family) {
  const cfg = FLATTEN[family] || { strength: .6, cells: 4 };
  const base = sharp(file).rotate().removeAlpha();
  const { data, info } = await base.raw().toBuffer({ resolveWithObject: true });
  const low = await sharp(data, { raw: info })
    .resize(cfg.cells, cfg.cells, { fit: "fill" })
    .resize(info.width, info.height, { fit: "fill", kernel: "cubic" })
    .raw().toBuffer();
  const luma = (buf, o) => buf[o] * .299 + buf[o + 1] * .587 + buf[o + 2] * .114;
  let meanL = 0;
  for (let o = 0; o < low.length; o += 3) meanL += luma(low, o);
  meanL /= low.length / 3;
  const out = Buffer.alloc(data.length);
  for (let o = 0; o < data.length; o += 3) {
    const l = Math.max(24, luma(low, o));
    let scale = 1 + (meanL / l - 1) * cfg.strength;
    scale = Math.max(.6, Math.min(1.7, scale));
    out[o] = Math.min(255, data[o] * scale);
    out[o + 1] = Math.min(255, data[o + 1] * scale);
    out[o + 2] = Math.min(255, data[o + 2] * scale);
  }
  return { buffer: out, info };
}

(async () => {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  const sources = fs.readdirSync(SOURCE);
  const manifest = {};
  let done = 0, missing = 0;
  for (const group of CATALOG.groups) {
    for (const mat of group.materials) {
      // il catalogo ricorda il nome del file sorgente; la cartella può variare
      const file = sources.find((f) => f === mat.sourceFile)
        || sources.find((f) => f.toUpperCase().startsWith(mat.code.toUpperCase()));
      if (!file) { console.log("MANCA:", mat.code); missing++; continue; }
      const { buffer, info } = await flattenLighting(path.join(SOURCE, file), mat.family);
      const name = mat.code.toLowerCase().replace(/[^a-z0-9]+/g, "-") + ".webp";
      await sharp(buffer, { raw: { width: info.width, height: info.height, channels: 3 } })
        .webp({ quality: 88 }).toFile(path.join(OUT, name));
      manifest[mat.code] = {
        src: `assets/dinoc/textures-hd/${name}`,
        w: info.width, h: info.height,
        tileable: false, // fotografie: le giunture le gestisce il runtime
      };
      done++;
    }
  }
  fs.writeFileSync(path.join(OUT, "manifest.js"), "globalThis.IW_HD_TEXTURES=" + JSON.stringify(manifest) + ";\n");
  const total = fs.readdirSync(OUT).reduce((s, f) => s + fs.statSync(path.join(OUT, f)).size, 0);
  console.log(`${done} texture HD reali (${missing} mancanti) · ${(total / 1024 / 1024).toFixed(1)} MB`);
})();
