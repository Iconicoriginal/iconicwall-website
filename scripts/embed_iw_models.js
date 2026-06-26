const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const modelDirectory = path.join(root, "assets", "models", "generated");
const models = {};
for (const family of ["shelf", "frame", "box"]) {
  for (const width of [300, 600, 900]) {
    for (const height of [300, 450, 600]) {
      models[`${family}_${width}_${height}`] = `IW_${family.toUpperCase()}_W${width}_H${height}.glb`;
    }
  }
}

const encoded = Object.fromEntries(
  Object.entries(models).map(([name, filename]) => [
    name,
    fs.readFileSync(path.join(modelDirectory, filename)).toString("base64"),
  ]),
);

fs.writeFileSync(
  path.join(root, "assets", "models", "iw-models.js"),
  `globalThis.IW_MODEL_DATA=${JSON.stringify(encoded)};\n`,
);
