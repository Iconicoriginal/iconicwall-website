const stage = document.querySelector("#config-stage");
const loading = stage.querySelector(".stage-loading");
const countOutput = document.querySelector("#configuration-count");
const sizeOutput = document.querySelector("#configuration-size");
const widthOutput = document.querySelector("#wall-width-output");
const heightSelect = document.querySelector("#wall-height");
const moduleList = document.querySelector("#module-list");
const panelList = document.querySelector("#panel-list");
const panelType = document.querySelector("#panel-type");
const panelWidth = document.querySelector("#panel-width");
const panelHeight = document.querySelector("#panel-height");
const panelVariant = document.querySelector("#panel-variant");
const panelVariantField = document.querySelector("#panel-variant-field");
const panelDragCard = document.querySelector("#panel-drag-card");
const panelCardName = document.querySelector("#panel-card-name");
const materialSearch = document.querySelector("#material-search");
const materialFamily = document.querySelector("#material-family");
const materialGrid = document.querySelector("#material-grid");
const materialMore = document.querySelector("#material-more");
const materialCurrent = document.querySelector("#material-current");
const materialRotation = document.querySelector("#material-rotation");
const materialScale = document.querySelector("#material-scale");

// Unica matrice da aggiornare quando viene consegnata la tabella tecnica IW definitiva.
const IW_RULES = {
  flat:  { label: "Flat",  widths: [300, 600, 900], heights: [150, 300, 450, 600, 750, 1200, 1500], variants: [] },
  lux:   { label: "Lux",   widths: [300, 600, 900], heights: [150, 300, 600, 900], variants: [["LED_T", "LED superiore"], ["LED_B", "LED inferiore"], ["LED_TB", "LED sopra + sotto"]] },
  shelf: { label: "Shelf", widths: [300, 600, 900], heights: [300, 450, 600], variants: [["BOTTOM", "Mensola inferiore"]] },
  box:   { label: "Box",   widths: [300, 600, 900], heights: [300, 450, 600], variants: [] },
  frame: { label: "Frame", widths: [300, 600, 900], heights: [300, 450, 600], variants: [] },
};
const ORIGINAL_GEOMETRY_SIZE = {
  shelf: { depth: 152.5 },
  frame: { depth: 151.2 },
  box: { depth: 151.3 },
};
const STRUCTURE_FRONT_Z = .09;
const originalModelTemplates = {};
const dinocCatalog = globalThis.IW_DINOC_CATALOG || { families: [], materials: [] };
const dinocById = new Map(dinocCatalog.materials.map((material) => [material.id, material]));
const dinocTexturePromises = new Map();

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xebe8e1);
const camera = new THREE.PerspectiveCamera(34, 1, .1, 100);
camera.position.set(0, .2, 7.4);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
stage.prepend(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xffffff, 0x8b8377, 2.3));
const keyLight = new THREE.DirectionalLight(0xffffff, 3.4);
keyLight.position.set(-4, 6, 7);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
scene.add(keyLight);
const warmLight = new THREE.PointLight(0xffd8aa, 25, 12);
warmLight.position.set(4, 2.5, 4);
scene.add(warmLight);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(18, 14),
  new THREE.MeshStandardMaterial({ color: 0xd5d1c8, roughness: .94 })
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

const wallGroup = new THREE.Group();
const moduleGroup = new THREE.Group();
const accessoryGroup = new THREE.Group();
wallGroup.add(moduleGroup, accessoryGroup);
scene.add(wallGroup);

const finishColors = { sand: 0xbfae96, walnut: 0x4e3526, stone: 0xaaa69d, graphite: 0x302f2d };
let currentFinish = "sand";
let selectedMaterialId = "";
let selectedPanelId = null;
let selectedModuleId = null;
let nextPanelId = 0;
let materialTab = "all";
let materialLimit = 72;
let draggedMaterial = null;
let materialDragGhost = null;
const favoriteMaterials = new Set(JSON.parse(localStorage.getItem("iwDinocFavorites") || "[]"));
let recentMaterials = JSON.parse(localStorage.getItem("iwDinocRecent") || "[]");
let wallHeightMm = Number(heightSelect.value);
let wallHeight = wallHeightMm / 1000;
let wallWidth = 2.4;
let moduleId = 4;
let modules = [
  { id: 1, width: 600, panels: [] },
  { id: 2, width: 600, panels: [] },
  { id: 3, width: 900, panels: [] },
  { id: 4, width: 300, panels: [] },
];
const previewPanel = new URLSearchParams(location.search).get("previewPanel");
const previewWidth = Number(new URLSearchParams(location.search).get("previewWidth")) || 300;
const previewHeight = Number(new URLSearchParams(location.search).get("previewHeight")) || 450;
if (ORIGINAL_GEOMETRY_SIZE[previewPanel]) {
  const remainingTop = 2700 - 1200 - previewHeight - 750;
  modules = [{
    id: 1,
    width: previewWidth,
    panels: [
      { type: "flat", width: previewWidth, height: 1200, variant: "" },
      { type: previewPanel, width: previewWidth, height: previewHeight, variant: previewPanel === "shelf" ? "BOTTOM" : "" },
      { type: "flat", width: previewWidth, height: 750, variant: "" },
      { type: "flat", width: previewWidth, height: remainingTop, variant: "" },
    ],
  }];
  moduleId = 1;
}
const placed = [];
const moduleMeshes = new Map();
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -.19);
let draggedAccessory = null;
let draggedModule = null;
let draggedPanel = null;
let orbiting = false;
let pointerStart = { x: 0, y: 0 };
let yaw = 0;
let targetYaw = previewPanel ? -.68 : 0;
let zoom = previewPanel ? 3.2 : 7.4;
let targetZoom = zoom;

function meshMaterial(color = finishColors[currentFinish], roughness = .72, metalness = 0) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function materialRoughness(material) {
  if (!material) return { roughness: .72, metalness: 0 };
  if (material.family === "Metal") return { roughness: .42, metalness: .28 };
  if (material.family === "Solid Color") return { roughness: .58, metalness: 0 };
  if (material.family === "Carbon") return { roughness: .5, metalness: .08 };
  return { roughness: .76, metalness: 0 };
}

function getDinocTexture(material) {
  if (!dinocTexturePromises.has(material.id)) {
    dinocTexturePromises.set(material.id, new Promise((resolve, reject) => {
      new THREE.TextureLoader().load(material.textureData || material.texture, (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        resolve(texture);
      }, undefined, reject);
    }));
  }
  return dinocTexturePromises.get(material.id);
}

function applyPanelFinish(targetMaterial, panel) {
  const dinoc = dinocById.get(panel.material?.id);
  if (!dinoc) return targetMaterial;
  const finish = materialRoughness(dinoc);
  targetMaterial.color.set(dinoc.averageColor || "#ffffff");
  targetMaterial.roughness = finish.roughness;
  targetMaterial.metalness = finish.metalness;
  getDinocTexture(dinoc).then((source) => {
    const texture = source.clone();
    const scaleMm = Number(panel.material?.scale) || dinoc.defaultScaleMm || 600;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(Math.max(.25, panel.width / scaleMm), Math.max(.25, panel.height / scaleMm));
    texture.center.set(.5, .5);
    texture.rotation = Number(panel.material?.rotation) === 90 ? Math.PI / 2 : 0;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    texture.needsUpdate = true;
    targetMaterial.color.setHex(0xffffff);
    targetMaterial.map = texture;
    targetMaterial.needsUpdate = true;
  }).catch((error) => console.warn(`Texture DI-NOC non caricata: ${dinoc.code}`, error));
  return targetMaterial;
}

function markPanelVisual(group, panel) {
  group.traverse((item) => {
    if (item.isMesh) {
      item.userData.iwPanelSurface = true;
      item.userData.panelId = panel.id;
    }
  });
}

function panelSurfaceMaterial(panel) {
  return applyPanelFinish(meshMaterial(finishColors[currentFinish], .72), panel);
}

function disposeGroup(group) {
  while (group.children.length) {
    const child = group.children.pop();
    child.traverse((item) => {
      item.geometry?.dispose();
      if (Array.isArray(item.material)) item.material.forEach((entry) => entry.dispose());
      else item.material?.dispose();
    });
  }
}

function roundedBox(width, height, depth, radius, material) {
  const shape = new THREE.Shape();
  const x = -width / 2;
  const y = -height / 2;
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
  geometry.center();
  return new THREE.Mesh(geometry, material);
}

function createLabel(text, background = "rgba(20,20,18,.82)", foreground = "#ffffff") {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 96;
  const context = canvas.getContext("2d");
  context.fillStyle = background;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = foreground;
  context.font = "500 31px Arial";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text, canvas.width / 2, canvas.height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false }));
  sprite.scale.set(.48, .09, 1);
  sprite.renderOrder = 20;
  return sprite;
}

function base64ToArrayBuffer(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes.buffer;
}

function loadOriginalModels() {
  const loader = new GLTFLoader();
  return Promise.all(Object.entries(IW_MODEL_DATA || {}).map(([name, encoded]) =>
    new Promise((resolve, reject) => {
      loader.parse(base64ToArrayBuffer(encoded), "", (gltf) => {
        originalModelTemplates[name] = gltf.scene;
        resolve();
      }, reject);
    })
  ));
}

function createOriginalPanelVisual(panel) {
  const source = originalModelTemplates[`${panel.type}_${panel.width}_${panel.height}`];
  const size = ORIGINAL_GEOMETRY_SIZE[panel.type];
  if (!source || !size) return null;

  const wrapper = new THREE.Group();
  const model = source.clone(true);
  // SketchUp/DAE: X=larghezza, Y=profondità, Z=altezza.
  // Three.js: X=larghezza, Y=altezza, Z=fronte.
  // La rotazione porta Z su Y; l'inversione di Y fa sporgere il componente
  // verso l'ambiente anziché dentro la sottostruttura.
  model.rotation.x = -Math.PI / 2;
  model.scale.y = -1;
  model.position.set(-panel.width / 2000, -panel.height / 2000, STRUCTURE_FRONT_Z);
  const familyColor = panel.type === "shelf" ? 0x9a7f61 : 0x393632;
  model.traverse((item) => {
    if (item.isMesh) {
      item.castShadow = true;
      item.receiveShadow = true;
      item.material = item.material.clone();
      item.material.color.setHex(familyColor);
      item.material.roughness = .5;
      item.material.metalness = .18;
      applyPanelFinish(item.material, panel);
    }
  });
  wrapper.add(model);
  return wrapper;
}

function createPanelVisual(panel, moduleWidth) {
  const group = new THREE.Group();
  const bronze = meshMaterial(0x8a7258, .42, .22);
  const dark = meshMaterial(0x262522, .56);
  const featureHeight = panel.height / 1000;
  const original = createOriginalPanelVisual(panel);

  if (original) {
    group.add(original);
    const label = createLabel(`${IW_RULES[panel.type].label.toUpperCase()} ${panel.width}×${panel.height}`);
    label.position.set(0, featureHeight / 2 + .055, .39);
    label.scale.set(.34, .065, 1);
    label.userData.panelHandle = true;
    group.add(label);
    markPanelVisual(group, panel);
    return group;
  }

  const panelThickness = panel.type === "lux" ? .012 : .0025;
  const surface = new THREE.Mesh(
    new THREE.BoxGeometry(Math.max(.01, moduleWidth - .008), featureHeight - .006, panelThickness),
    panelSurfaceMaterial(panel)
  );
  // Piano posteriore comune a Flat e schiene degli elementi speciali.
  surface.position.z = STRUCTURE_FRONT_Z + panelThickness / 2;
  surface.castShadow = true;
  surface.receiveShadow = true;
  group.add(surface);
  const outline = new THREE.LineSegments(
    new THREE.EdgesGeometry(surface.geometry),
    new THREE.LineBasicMaterial({ color: 0x332f2a, transparent: true, opacity: .52 })
  );
  outline.position.copy(surface.position);
  group.add(outline);

  if (panel.type === "lux") {
    surface.position.z = STRUCTURE_FRONT_Z + .006;
    const addLed = (y) => {
      const glow = roundedBox(moduleWidth * .9, .018, .018, .006, new THREE.MeshBasicMaterial({ color: 0xffd892 }));
      glow.position.set(0, y, .205);
      group.add(glow);
    };
    if (panel.variant === "LED_T" || panel.variant === "LED_TB") addLed(featureHeight / 2 - .018);
    if (panel.variant === "LED_B" || panel.variant === "LED_TB") addLed(-featureHeight / 2 + .018);
  } else if (panel.type === "shelf") {
    const addShelf = (y) => {
      const shelf = roundedBox(moduleWidth, .018, .15, .006, bronze);
      shelf.rotation.x = Math.PI / 2;
      shelf.position.set(0, y, .25);
      group.add(shelf);
    };
    if (panel.variant === "TOP" || panel.variant === "DOUBLE") addShelf(featureHeight / 2 - .018);
    if (panel.variant === "BOTTOM" || panel.variant === "DOUBLE") addShelf(-featureHeight / 2 + .018);
  } else if (panel.type === "frame") {
    const sideWidth = Math.min(.055, moduleWidth * .12);
    const top = roundedBox(moduleWidth, .035, .15, .008, dark);
    const bottom = top.clone();
    const left = roundedBox(sideWidth, featureHeight, .15, .008, dark);
    const right = left.clone();
    top.position.set(0, featureHeight / 2 - .018, .23);
    bottom.position.set(0, -featureHeight / 2 + .018, .23);
    left.position.set(-moduleWidth / 2 + sideWidth / 2, 0, .23);
    right.position.set(moduleWidth / 2 - sideWidth / 2, 0, .23);
    group.add(top, bottom, left, right);
  } else if (panel.type === "box") {
    const front = roundedBox(moduleWidth, featureHeight * .55, .018, .006, dark);
    const bottom = roundedBox(moduleWidth, .018, .15, .006, dark);
    front.position.set(0, -featureHeight * .225, .28);
    bottom.rotation.x = Math.PI / 2;
    bottom.position.set(0, -featureHeight / 2 + .018, .25);
    group.add(front, bottom);
  }
  const label = createLabel(`${IW_RULES[panel.type].label.toUpperCase()} ${panel.width}×${panel.height}`);
  label.position.set(0, Math.max(-featureHeight / 2 + .075, featureHeight / 2 - .075), .39);
  label.userData.panelHandle = true;
  group.add(label);
  markPanelVisual(group, panel);
  return group;
}

function buildWall() {
  disposeGroup(moduleGroup);
  moduleMeshes.clear();
  modules.forEach((module) => module.panels.forEach((panel) => {
    if (!panel.id) panel.id = ++nextPanelId;
    else nextPanelId = Math.max(nextPanelId, panel.id);
  }));
  if (selectedPanelId && !modules.some((module) => module.panels.some((panel) => panel.id === selectedPanelId))) selectedPanelId = null;
  if (selectedModuleId && !modules.some((module) => module.id === selectedModuleId)) selectedModuleId = null;
  wallHeightMm = Number(heightSelect.value);
  wallHeight = wallHeightMm / 1000;
  wallWidth = Math.max(.3, modules.reduce((sum, module) => sum + module.width, 0) / 1000);
  let cursor = -wallWidth / 2;

  modules.forEach((module) => {
    const width = module.width / 1000;
    const root = new THREE.Group();
    root.position.x = cursor + width / 2;
    root.userData.moduleId = module.id;

    const structure = new THREE.Mesh(
      new THREE.BoxGeometry(Math.max(.01, width - .008), wallHeight, .18),
      meshMaterial(0x77736c, .68, .16)
    );
    structure.castShadow = true;
    structure.receiveShadow = true;
    structure.userData.moduleRoot = root;
    root.add(structure);
    const moduleOutline = new THREE.LineSegments(
      new THREE.EdgesGeometry(structure.geometry),
      new THREE.LineBasicMaterial({ color: 0x242321, transparent: true, opacity: .72 })
    );
    moduleOutline.userData.moduleRoot = root;
    root.add(moduleOutline);
    const moduleLabel = createLabel(`MODULO ${modules.indexOf(module) + 1} · ${module.width} mm`);
    moduleLabel.position.set(0, wallHeight / 2 + .08, .22);
    moduleLabel.scale.set(Math.min(.72, width * .92), .1, 1);
    moduleLabel.userData.moduleHandle = true;
    moduleLabel.userData.moduleRoot = root;
    root.add(moduleLabel);

    let panelBottom = -wallHeight / 2;
    module.panels.forEach((panel, panelIndex) => {
      const visual = createPanelVisual(panel, width);
      visual.position.y = panelBottom + panel.height / 2000;
      visual.userData.panelIndex = panelIndex;
      visual.traverse((item) => {
        if (item.isMesh || item.isLineSegments || item.isSprite) {
          item.userData.moduleRoot = root;
          item.userData.panelIndex = panelIndex;
          if (item.userData.panelHandle) item.userData.panelRoot = visual;
        }
      });
      root.add(visual);
      panelBottom += panel.height / 1000;
    });

    moduleGroup.add(root);
    moduleMeshes.set(module.id, root);
    cursor += width;
  });

  floor.position.y = -wallHeight / 2 - .05;
  placed.forEach(clampAccessory);
  renderModuleEditor();
  renderPanelAssignments();
  updatePanelBuilder();
  updateSummary();
}

function renderModuleEditor() {
  if (!modules.length) {
    moduleList.innerHTML = '<div class="module-empty">Aggiungi un modulo strutturale 300, 600 o 900 mm.</div>';
    return;
  }
  moduleList.innerHTML = modules.map((module, index) => `
    <article class="wall-module ${selectedModuleId === module.id ? "selected" : ""}" data-module-id="${module.id}">
      <span class="wall-module-index">${String(index + 1).padStart(2, "0")}</span>
      <div class="wall-module-fields">
        <label><span>Modulo strutturale · ${module.panels.reduce((sum, panel) => sum + panel.height, 0)} / ${wallHeightMm} mm</span><select data-module-width>
          ${[300, 600, 900].map((width) => `<option value="${width}" ${module.width === width ? "selected" : ""}>${width} mm</option>`).join("")}
        </select></label>
        <div class="module-move">
          <button data-move="-1" ${index === 0 ? "disabled" : ""} title="Sposta a sinistra">←</button>
          <button data-move="1" ${index === modules.length - 1 ? "disabled" : ""} title="Sposta a destra">→</button>
        </div>
        <div class="module-panel-stack">
          ${module.panels.length
            ? module.panels.map((panel) => `<span data-family="${panel.type}" style="--panel-height:${Math.max(18, panel.height / wallHeightMm * 82)}px">${IW_RULES[panel.type].label}<small>${panel.height}</small></span>`).join("")
            : "<em>Vuoto</em>"}
        </div>
      </div>
      <button class="wall-module-remove" data-remove-module title="Rimuovi modulo">×</button>
    </article>`).join("");
}

function renderPanelAssignments() {
  const assigned = modules.flatMap((module, moduleIndex) => module.panels.map((panel, panelIndex) => ({ module, moduleIndex, panel, panelIndex })));
  panelList.innerHTML = assigned.length ? assigned.map(({ module, moduleIndex, panel, panelIndex }) =>
    `<div class="assigned-panel ${selectedPanelId === panel.id ? "selected" : ""}" data-select-panel="${panel.id}" data-select-module="${module.id}"><span>C${moduleIndex + 1} · ${IW_RULES[panel.type].label} ${panel.width} × ${panel.height}${panel.variant ? ` · ${panel.variant}` : ""}<small>${dinocById.get(panel.material?.id)?.code || "Finitura non assegnata"}</small></span><button data-remove-panel="${module.id}:${panelIndex}" title="Rimuovi pannello">×</button></div>`
  ).join("") : '<div class="module-empty">Nessun pannello applicato.</div>';
}

function updatePanelBuilder() {
  const rule = IW_RULES[panelType.value];
  const previousWidth = Number(panelWidth.value);
  const previousVariant = panelVariant.value;
  panelWidth.innerHTML = rule.widths.map((width) => `<option value="${width}">${width} mm</option>`).join("");
  if (rule.widths.includes(previousWidth)) panelWidth.value = String(previousWidth);
  const heights = rule.heights.filter((height) => height <= wallHeightMm);
  const previousHeight = Number(panelHeight.value);
  panelHeight.innerHTML = heights.map((height) => `<option value="${height}">${height} mm</option>`).join("");
  if (heights.includes(previousHeight)) panelHeight.value = String(previousHeight);
  panelVariant.innerHTML = rule.variants.map(([value, label]) => `<option value="${value}">${label}</option>`).join("");
  if (rule.variants.some(([value]) => value === previousVariant)) panelVariant.value = previousVariant;
  panelVariantField.hidden = rule.variants.length === 0;
  panelCardName.textContent = `${rule.label} ${panelWidth.value} × ${panelHeight.value}`;
  panelDragCard.style.setProperty("--feature-opacity", panelType.value === "flat" ? "0" : "1");
}

function moveModule(id, direction) {
  const index = modules.findIndex((module) => module.id === id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= modules.length) return;
  const [movingModule] = modules.splice(index, 1);
  modules.splice(target, 0, movingModule);
  buildWall();
}

function reorderPanel(module, fromIndex, targetY) {
  const original = [...module.panels];
  const [movingPanel] = module.panels.splice(fromIndex, 1);
  let cursor = -wallHeight / 2;
  let insertAt = module.panels.length;
  for (let index = 0; index < module.panels.length; index += 1) {
    const center = cursor + module.panels[index].height / 2000;
    if (targetY < center) {
      insertAt = index;
      break;
    }
    cursor += module.panels[index].height / 1000;
  }
  module.panels.splice(insertAt, 0, movingPanel);
  const error = compositionError(module, module.panels);
  if (error) {
    module.panels = original;
    showDropError(error);
  }
  buildWall();
}

function moduleAtPoint(point) {
  let cursor = -wallWidth / 2;
  return modules.find((module) => {
    const next = cursor + module.width / 1000;
    const inside = point.x >= cursor && point.x <= next;
    cursor = next;
    return inside;
  });
}

function panelJoints(module, panels = module.panels) {
  let total = 0;
  return panels.map((panel) => total += panel.height).filter((height) => height < wallHeightMm);
}

function compositionError(module, candidatePanels) {
  const total = candidatePanels.reduce((sum, panel) => sum + panel.height, 0);
  if (total > wallHeightMm) return `Altezza colonna superata di ${total - wallHeightMm} mm`;
  if (candidatePanels[0] && candidatePanels[0].type !== "flat") return "La fascia inferiore deve essere Flat";
  const index = modules.indexOf(module);
  const joints = panelJoints(module, candidatePanels);
  for (const adjacentIndex of [index - 1, index + 1]) {
    const adjacent = modules[adjacentIndex];
    if (adjacent && joints.some((joint) => panelJoints(adjacent).includes(joint))) {
      return "Fuga orizzontale coincidente con la colonna adiacente";
    }
  }
  return "";
}

function showDropError(message) {
  stage.querySelector(".drop-message").textContent = message;
  stage.classList.add("drag-over");
  setTimeout(() => {
    stage.classList.remove("drag-over");
    stage.querySelector(".drop-message").textContent = "Rilascia sulla parete";
  }, 1500);
}

function assignPanel(module, panel, pointY) {
  if (module.width !== panel.width) {
    showDropError(`Serve un modulo da ${panel.width} mm`);
    return;
  }
  let insertAt = module.panels.length;
  let cursor = -wallHeight / 2;
  for (let index = 0; index < module.panels.length; index += 1) {
    const center = cursor + module.panels[index].height / 2000;
    if (pointY < center) { insertAt = index; break; }
    cursor += module.panels[index].height / 1000;
  }
  const candidate = [...module.panels];
  candidate.splice(insertAt, 0, { ...panel });
  const error = compositionError(module, candidate);
  if (error) return showDropError(error);
  module.panels = candidate;
  buildWall();
}

function createAccessory(type) {
  const group = new THREE.Group();
  group.userData.type = type;
  const bronze = meshMaterial(0x8a7258, .42, .22);
  const dark = meshMaterial(0x262522, .56);
  if (type === "shelf") {
    const shelf = roundedBox(.9, .055, .25, .018, bronze);
    shelf.rotation.x = Math.PI / 2;
    shelf.position.z = .22;
    group.add(shelf);
    group.userData.bounds = { w: .9, h: .18 };
  } else if (type === "box") {
    group.add(roundedBox(.6, .4, .16, .025, dark));
    group.userData.bounds = { w: .6, h: .4 };
  } else if (type === "light") {
    group.add(roundedBox(.065, 1.8, .08, .025, dark));
    group.userData.bounds = { w: .09, h: 1.8 };
  } else if (type === "mirror") {
    group.add(roundedBox(.65, .95, .025, .315, bronze));
    group.userData.bounds = { w: .65, h: .95 };
  } else {
    const hook = new THREE.Mesh(new THREE.TorusGeometry(.075, .018, 10, 24, Math.PI * 1.35), bronze);
    group.add(hook);
    group.userData.bounds = { w: .2, h: .22 };
  }
  group.position.z = .35;
  group.traverse((object) => {
    if (object.isMesh) {
      object.castShadow = true;
      object.userData.accessoryRoot = group;
    }
  });
  return group;
}

function snap(value, grid = .1) { return Math.round(value / grid) * grid; }
function clampAccessory(object) {
  const bounds = object.userData.bounds;
  object.position.x = THREE.MathUtils.clamp(snap(object.position.x), -wallWidth / 2 + bounds.w / 2, wallWidth / 2 - bounds.w / 2);
  object.position.y = THREE.MathUtils.clamp(snap(object.position.y), -wallHeight / 2 + bounds.h / 2, wallHeight / 2 - bounds.h / 2);
}
function pointerToWall(clientX, clientY) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const point = new THREE.Vector3();
  return raycaster.ray.intersectPlane(dragPlane, point) ? wallGroup.worldToLocal(point) : null;
}

function moduleHitAtPointer(clientX, clientY) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  return raycaster.intersectObjects(moduleGroup.children, true)[0]?.object || null;
}
function addAccessory(type, position = new THREE.Vector3()) {
  const object = createAccessory(type);
  object.position.x = position.x;
  object.position.y = position.y;
  clampAccessory(object);
  accessoryGroup.add(object);
  placed.push(object);
  updateSummary();
}
function removeAccessory(object) {
  const index = placed.indexOf(object);
  if (index < 0) return;
  placed.splice(index, 1);
  accessoryGroup.remove(object);
  updateSummary();
}
function updateSummary() {
  const panelCount = modules.reduce((sum, module) => sum + module.panels.length, 0);
  countOutput.textContent = `${modules.length} moduli · ${panelCount} pannelli`;
  sizeOutput.textContent = `${Math.round(wallWidth * 1000)} × ${wallHeightMm} mm`;
  widthOutput.textContent = `${Math.round(wallWidth * 1000)} mm`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  })[character]);
}

function selectMaterial(id) {
  const material = dinocById.get(id);
  if (!material) return;
  selectedMaterialId = id;
  materialScale.value = String(material.defaultScaleMm || 600);
  materialCurrent.querySelector(".material-current-swatch").style.backgroundImage = `url("${material.texture}")`;
  materialCurrent.querySelector("b").textContent = material.code;
  materialCurrent.querySelector("small").textContent = `${material.family} · serie ${material.series}${material.variant ? ` · ${material.variant}` : ""}`;
  panelDragCard.querySelector(".panel-preview").style.backgroundImage = `url("${material.texture}")`;
  panelDragCard.querySelector(".panel-preview").style.backgroundSize = "cover";
  renderMaterialCatalog();
}

function filteredMaterials() {
  const query = materialSearch.value.trim().toUpperCase();
  const family = materialFamily.value;
  let materials = dinocCatalog.materials.filter((material) => {
    if (family && material.family !== family) return false;
    if (query && !`${material.code} ${material.series} ${material.family} ${material.sourceFile}`.toUpperCase().includes(query)) return false;
    if (materialTab === "favorites" && !favoriteMaterials.has(material.id)) return false;
    if (materialTab === "recent" && !recentMaterials.includes(material.id)) return false;
    return true;
  });
  if (materialTab === "recent") {
    const order = new Map(recentMaterials.map((id, index) => [id, index]));
    materials = materials.sort((a, b) => order.get(a.id) - order.get(b.id));
  }
  return materials;
}

function renderMaterialCatalog() {
  const materials = filteredMaterials();
  materialGrid.innerHTML = materials.length ? materials.slice(0, materialLimit).map((material) => `
    <button class="material-card ${selectedMaterialId === material.id ? "selected" : ""} ${favoriteMaterials.has(material.id) ? "favorite" : ""}" data-material-id="${material.id}" title="${escapeHtml(material.code)}" draggable="true">
      <img src="${material.texture}" alt="${escapeHtml(material.code)}" loading="lazy">
      <span><b>${escapeHtml(material.code)}</b><small>${escapeHtml(material.family)} · ${escapeHtml(material.series)}</small></span>
      <i data-favorite-material="${material.id}" title="Preferito">★</i>
    </button>`).join("") : '<div class="material-empty">Nessun materiale trovato.</div>';
  materialMore.hidden = materials.length <= materialLimit;
  materialMore.textContent = `Mostra altri (${Math.max(0, materials.length - materialLimit)})`;
}

function saveMaterialPreferences() {
  localStorage.setItem("iwDinocFavorites", JSON.stringify([...favoriteMaterials]));
  localStorage.setItem("iwDinocRecent", JSON.stringify(recentMaterials));
}

function rememberMaterial(id) {
  recentMaterials = [id, ...recentMaterials.filter((entry) => entry !== id)].slice(0, 24);
  saveMaterialPreferences();
}

function materialSnapshot() {
  if (!selectedMaterialId) return null;
  return {
    id: selectedMaterialId,
    rotation: Number(materialRotation.value),
    scale: Number(materialScale.value),
  };
}

function panelById(id) {
  for (const module of modules) {
    const panel = module.panels.find((entry) => entry.id === id);
    if (panel) return { module, panel };
  }
  return null;
}

function applySelectedMaterial(target) {
  const finish = materialSnapshot();
  if (!finish) return showDropError("Seleziona prima un materiale DI-NOC");
  applyMaterialToTarget(finish, target);
}

function applyMaterialToTarget(finish, target, targetModuleId = selectedModuleId, targetPanelId = selectedPanelId) {
  let changed = 0;
  if (target === "panel") {
    const selected = panelById(targetPanelId);
    if (!selected) return showDropError("Seleziona un pannello dalla lista o dalla sua etichetta");
    selected.panel.material = { ...finish };
    selectedModuleId = selected.module.id;
    selectedPanelId = selected.panel.id;
    changed = 1;
  } else if (target === "module") {
    const module = modules.find((entry) => entry.id === targetModuleId) || panelById(targetPanelId)?.module;
    if (!module) return showDropError("Seleziona un modulo");
    selectedModuleId = module.id;
    selectedPanelId = null;
    module.panels.forEach((panel) => { panel.material = { ...finish }; changed += 1; });
  } else {
    modules.forEach((module) => module.panels.forEach((panel) => {
      panel.material = { ...finish };
      changed += 1;
    }));
  }
  if (!changed) return showDropError("Non ci sono pannelli a cui applicare il materiale");
  rememberMaterial(finish.id);
  selectedMaterialId = finish.id;
  buildWall();
  requestAnimationFrame(() => refreshVisiblePanelMaterials());
  showDropError(target === "panel" ? "Finitura applicata al pannello" : target === "module" ? "Finitura applicata al modulo" : "Finitura applicata alla parete");
}

function refreshVisiblePanelMaterials() {
  moduleGroup.traverse((item) => {
    if (!item.isMesh || !item.userData.iwPanelSurface) return;
    const selected = panelById(item.userData.panelId);
    if (!selected?.panel.material?.id) return;
    const material = Array.isArray(item.material) ? item.material[0] : item.material;
    if (!material) return;
    applyPanelFinish(material, selected.panel);
  });
}

function initializeMaterialCatalog() {
  materialFamily.innerHTML += dinocCatalog.families.map((family) =>
    `<option value="${escapeHtml(family)}">${escapeHtml(family)}</option>`
  ).join("");
  renderMaterialCatalog();
}

function resize() {
  const rect = stage.getBoundingClientRect();
  renderer.setSize(rect.width, rect.height, false);
  camera.aspect = rect.width / rect.height;
  camera.updateProjectionMatrix();
}
function animate() {
  requestAnimationFrame(animate);
  yaw += (targetYaw - yaw) * .08;
  zoom += (targetZoom - zoom) * .08;
  wallGroup.rotation.y = yaw;
  camera.position.z = zoom;
  camera.lookAt(0, -.05, 0);
  renderer.render(scene, camera);
}

document.querySelectorAll("[data-add-module]").forEach((button) => button.addEventListener("click", () => {
  modules.push({ id: ++moduleId, width: Number(button.dataset.addModule), panels: [] });
  buildWall();
}));
moduleList.addEventListener("change", (event) => {
  if (!event.target.matches("[data-module-width]")) return;
  const id = Number(event.target.closest("[data-module-id]").dataset.moduleId);
  const module = modules.find((entry) => entry.id === id);
  module.width = Number(event.target.value);
  module.panels = module.panels.filter((panel) => panel.width === module.width);
  buildWall();
});
moduleList.addEventListener("click", (event) => {
  const card = event.target.closest("[data-module-id]");
  if (!card) return;
  const id = Number(card.dataset.moduleId);
  if (event.target.closest("[data-remove-module]")) {
    modules = modules.filter((module) => module.id !== id);
    buildWall();
  } else if (event.target.closest("[data-move]")) {
    moveModule(id, Number(event.target.closest("[data-move]").dataset.move));
  } else if (!event.target.matches("select")) {
    selectedModuleId = id;
    selectedPanelId = null;
    renderModuleEditor();
    renderPanelAssignments();
  }
});
panelList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-remove-panel]");
  if (button) {
    const [moduleIdValue, panelIndexValue] = button.dataset.removePanel.split(":").map(Number);
    const module = modules.find((entry) => entry.id === moduleIdValue);
    if (module) module.panels.splice(panelIndexValue, 1);
    buildWall();
    return;
  }
  const row = event.target.closest("[data-select-panel]");
  if (!row) return;
  selectedPanelId = Number(row.dataset.selectPanel);
  selectedModuleId = Number(row.dataset.selectModule);
  renderModuleEditor();
  renderPanelAssignments();
});
[panelType, panelWidth, panelHeight, panelVariant].forEach((select) => select.addEventListener("change", updatePanelBuilder));
panelDragCard.addEventListener("dragstart", (event) => {
  event.dataTransfer.setData("application/x-iw-panel", JSON.stringify({
    type: panelType.value,
    width: Number(panelWidth.value),
    height: Number(panelHeight.value),
    variant: panelVariantField.hidden ? "" : panelVariant.value,
    material: materialSnapshot(),
  }));
  event.dataTransfer.effectAllowed = "copy";
});
materialGrid.addEventListener("click", (event) => {
  const favorite = event.target.closest("[data-favorite-material]");
  if (favorite) {
    const id = favorite.dataset.favoriteMaterial;
    if (favoriteMaterials.has(id)) favoriteMaterials.delete(id);
    else favoriteMaterials.add(id);
    saveMaterialPreferences();
    renderMaterialCatalog();
    return;
  }
  const card = event.target.closest("[data-material-id]");
  if (card) selectMaterial(card.dataset.materialId);
});
materialGrid.addEventListener("dragstart", (event) => {
  const card = event.target.closest("[data-material-id]");
  if (!card) return;
  selectMaterial(card.dataset.materialId);
  event.dataTransfer.setData("application/x-iw-material", JSON.stringify(materialSnapshot()));
  event.dataTransfer.effectAllowed = "copy";
});
materialGrid.addEventListener("pointerdown", (event) => {
  if (event.target.closest("[data-favorite-material]")) return;
  const card = event.target.closest("[data-material-id]");
  if (!card) return;
  const material = dinocById.get(card.dataset.materialId);
  if (!material) return;
  event.preventDefault();
  selectMaterial(material.id);
  draggedMaterial = materialSnapshot();
  materialDragGhost = document.createElement("div");
  materialDragGhost.className = "material-drag-ghost";
  materialDragGhost.innerHTML = `<img src="${material.texture}" alt="">`;
  document.body.append(materialDragGhost);
  materialDragGhost.style.left = `${event.clientX}px`;
  materialDragGhost.style.top = `${event.clientY}px`;
  stage.classList.add("drag-over");
});
addEventListener("pointermove", (event) => {
  if (!draggedMaterial || !materialDragGhost) return;
  materialDragGhost.style.left = `${event.clientX}px`;
  materialDragGhost.style.top = `${event.clientY}px`;
  const overStage = document.elementFromPoint(event.clientX, event.clientY)?.closest("#config-stage");
  if (!overStage) {
    stage.classList.remove("drag-over");
    return;
  }
  stage.classList.add("drag-over");
  const hit = moduleHitAtPointer(event.clientX, event.clientY);
  stage.querySelector(".drop-message").textContent = !hit
    ? "Applica a tutta la parete"
    : Number.isInteger(hit.userData.panelIndex)
      ? "Applica a questo pannello"
      : "Applica a questo modulo";
});
addEventListener("pointerup", (event) => {
  if (!draggedMaterial) return;
  const finish = draggedMaterial;
  draggedMaterial = null;
  materialDragGhost?.remove();
  materialDragGhost = null;
  const overStage = document.elementFromPoint(event.clientX, event.clientY)?.closest("#config-stage");
  stage.classList.remove("drag-over");
  stage.querySelector(".drop-message").textContent = "Rilascia sulla parete";
  if (!overStage) return;
  const hit = moduleHitAtPointer(event.clientX, event.clientY);
  if (!hit) return applyMaterialToTarget(finish, "wall");
  const moduleIdValue = hit.userData.moduleRoot?.userData.moduleId;
  const module = modules.find((entry) => entry.id === moduleIdValue);
  if (!module) return applyMaterialToTarget(finish, "wall");
  if (Number.isInteger(hit.userData.panelIndex)) {
    return applyMaterialToTarget(finish, "panel", module.id, module.panels[hit.userData.panelIndex]?.id);
  }
  applyMaterialToTarget(finish, "module", module.id);
});
materialSearch.addEventListener("input", () => { materialLimit = 72; renderMaterialCatalog(); });
materialFamily.addEventListener("change", () => { materialLimit = 72; renderMaterialCatalog(); });
document.querySelectorAll("[data-material-tab]").forEach((button) => button.addEventListener("click", () => {
  materialTab = button.dataset.materialTab;
  materialLimit = 72;
  document.querySelectorAll("[data-material-tab]").forEach((item) => item.classList.toggle("active", item === button));
  renderMaterialCatalog();
}));
materialMore.addEventListener("click", () => { materialLimit += 72; renderMaterialCatalog(); });
document.querySelector("#apply-material-panel").addEventListener("click", () => applySelectedMaterial("panel"));
document.querySelector("#apply-material-module").addEventListener("click", () => applySelectedMaterial("module"));
document.querySelector("#apply-material-wall").addEventListener("click", () => applySelectedMaterial("wall"));

document.querySelectorAll(".component-card").forEach((card) => {
  card.addEventListener("dragstart", (event) => {
    event.dataTransfer.setData("text/iconic-component", card.dataset.component);
    event.dataTransfer.effectAllowed = "copy";
  });
  card.addEventListener("click", () => addAccessory(card.dataset.component));
});
stage.addEventListener("dragover", (event) => {
  event.preventDefault();
  stage.classList.add("drag-over");
  if (Array.from(event.dataTransfer.types).includes("application/x-iw-material")) {
    const hit = moduleHitAtPointer(event.clientX, event.clientY);
    const message = stage.querySelector(".drop-message");
    if (!hit) message.textContent = "Applica a tutta la parete";
    else if (Number.isInteger(hit.userData.panelIndex)) message.textContent = "Applica a questo pannello";
    else message.textContent = "Applica a questo modulo";
  }
});
stage.addEventListener("dragleave", () => {
  stage.classList.remove("drag-over");
  stage.querySelector(".drop-message").textContent = "Rilascia sulla parete";
});
stage.addEventListener("drop", (event) => {
  event.preventDefault();
  stage.classList.remove("drag-over");
  const materialData = event.dataTransfer.getData("application/x-iw-material");
  if (materialData) {
    const finish = JSON.parse(materialData);
    const hit = moduleHitAtPointer(event.clientX, event.clientY);
    if (!hit) {
      applyMaterialToTarget(finish, "wall");
      return;
    }
    const root = hit.userData.moduleRoot;
    const module = root && modules.find((entry) => entry.id === root.userData.moduleId);
    if (!module) {
      applyMaterialToTarget(finish, "wall");
      return;
    }
    if (Number.isInteger(hit.userData.panelIndex)) {
      const panel = module.panels[hit.userData.panelIndex];
      applyMaterialToTarget(finish, "panel", module.id, panel?.id);
    } else {
      applyMaterialToTarget(finish, "module", module.id);
    }
    return;
  }
  const point = pointerToWall(event.clientX, event.clientY);
  if (!point) return;
  const panelData = event.dataTransfer.getData("application/x-iw-panel");
  if (panelData) {
    const module = moduleAtPoint(point);
    if (module) assignPanel(module, JSON.parse(panelData), point.y);
    return;
  }
  const accessoryType = event.dataTransfer.getData("text/iconic-component");
  if (accessoryType) addAccessory(accessoryType, point);
});

renderer.domElement.addEventListener("pointerdown", (event) => {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const accessoryHit = raycaster.intersectObjects(placed, true)[0];
  if (accessoryHit) {
    draggedAccessory = accessoryHit.object.userData.accessoryRoot;
  } else {
    const moduleHit = raycaster.intersectObjects(moduleGroup.children, true)[0];
    const hitObject = moduleHit?.object;
    if (hitObject?.userData.panelHandle && hitObject.userData.panelRoot) {
      const moduleIdValue = hitObject.userData.moduleRoot.userData.moduleId;
      const module = modules.find((entry) => entry.id === moduleIdValue);
      selectedModuleId = moduleIdValue;
      selectedPanelId = module?.panels[hitObject.userData.panelIndex]?.id || null;
      renderModuleEditor();
      renderPanelAssignments();
      draggedPanel = {
        moduleId: moduleIdValue,
        panelIndex: hitObject.userData.panelIndex,
        visual: hitObject.userData.panelRoot,
        targetY: hitObject.userData.panelRoot.position.y,
      };
    } else if (hitObject?.userData.moduleHandle && hitObject.userData.moduleRoot) {
      selectedModuleId = hitObject.userData.moduleRoot.userData.moduleId;
      selectedPanelId = null;
      renderModuleEditor();
      renderPanelAssignments();
      draggedModule = hitObject.userData.moduleRoot;
    } else {
      orbiting = true;
    }
  }
  pointerStart = { x: event.clientX, y: event.clientY };
  renderer.domElement.setPointerCapture(event.pointerId);
});
renderer.domElement.addEventListener("pointermove", (event) => {
  const point = pointerToWall(event.clientX, event.clientY);
  if (draggedAccessory && point) {
    draggedAccessory.position.x = point.x;
    draggedAccessory.position.y = point.y;
    clampAccessory(draggedAccessory);
  } else if (draggedPanel && point) {
    draggedPanel.targetY = THREE.MathUtils.clamp(point.y, -wallHeight / 2, wallHeight / 2);
    draggedPanel.visual.position.y = draggedPanel.targetY;
    draggedPanel.visual.position.z = .12;
  } else if (draggedModule && point) {
    draggedModule.position.x = THREE.MathUtils.clamp(point.x, -wallWidth / 2, wallWidth / 2);
  } else if (orbiting) {
    targetYaw = THREE.MathUtils.clamp(targetYaw + (event.clientX - pointerStart.x) * .006, -.68, .68);
    pointerStart = { x: event.clientX, y: event.clientY };
  }
});
renderer.domElement.addEventListener("pointerup", (event) => {
  if (draggedPanel) {
    const module = modules.find((entry) => entry.id === draggedPanel.moduleId);
    if (module) reorderPanel(module, draggedPanel.panelIndex, draggedPanel.targetY);
  } else if (draggedModule) {
    const id = draggedModule.userData.moduleId;
    const sourceIndex = modules.findIndex((module) => module.id === id);
    let insertAt = modules.length - 1;
    const x = draggedModule.position.x;
    let cursor = -wallWidth / 2;
    for (let index = 0; index < modules.length; index += 1) {
      const center = cursor + modules[index].width / 2000;
      if (x < center) {
        insertAt = index;
        break;
      }
      cursor += modules[index].width / 1000;
    }
    if (sourceIndex !== insertAt) {
      const [movingModule] = modules.splice(sourceIndex, 1);
      modules.splice(insertAt, 0, movingModule);
    }
    buildWall();
  }
  draggedAccessory = null;
  draggedPanel = null;
  draggedModule = null;
  orbiting = false;
  renderer.domElement.releasePointerCapture(event.pointerId);
});
renderer.domElement.addEventListener("dblclick", (event) => {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const accessoryHit = raycaster.intersectObjects(placed, true)[0];
  if (accessoryHit) return removeAccessory(accessoryHit.object.userData.accessoryRoot);
  const moduleHit = raycaster.intersectObjects(moduleGroup.children, true)[0];
  const hit = moduleHit?.object;
  const root = hit?.userData.moduleRoot;
  const module = root && modules.find((entry) => entry.id === root.userData.moduleId);
  if (module && Number.isInteger(hit.userData.panelIndex)) {
    module.panels.splice(hit.userData.panelIndex, 1);
    buildWall();
  }
});
renderer.domElement.addEventListener("wheel", (event) => {
  event.preventDefault();
  targetZoom = THREE.MathUtils.clamp(targetZoom + event.deltaY * .004, 5.2, 10);
}, { passive: false });

document.querySelectorAll(".finish").forEach((button) => button.addEventListener("click", () => {
  currentFinish = button.dataset.finish;
  document.querySelectorAll(".finish").forEach((item) => item.classList.toggle("active", item === button));
  buildWall();
}));
heightSelect.addEventListener("change", buildWall);
document.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => {
  targetYaw = button.dataset.view === "perspective" ? -.42 : 0;
  document.querySelectorAll("[data-view]").forEach((item) => item.classList.toggle("active", item === button));
}));
document.querySelector("#undo-button").addEventListener("click", () => placed.length && removeAccessory(placed.at(-1)));
document.querySelector("#clear-button").addEventListener("click", () => {
  modules = [];
  [...placed].forEach(removeAccessory);
  buildWall();
});
document.querySelector("#request-button").addEventListener("click", () => {
  const description = modules.map((module) => {
    const panels = module.panels.length
      ? module.panels.map((panel) => `${IW_RULES[panel.type].label} ${panel.width}x${panel.height}${panel.variant ? ` ${panel.variant}` : ""}${panel.material?.id ? ` DI-NOC ${dinocById.get(panel.material.id)?.code || panel.material.id}` : ""}`).join(" + ")
      : "senza pannelli";
    return `modulo ${module.width}: ${panels}`;
  }).join(", ");
  const params = new URLSearchParams({
    tipo: "Configurazione 3D",
    dimensioni: `${Math.round(wallWidth * 1000)}x${wallHeightMm}`,
    elementi: `${description}; accessori: ${placed.map((item) => item.userData.type).join(", ")}`,
    finitura: "DI-NOC specificata per ciascun pannello",
  });
  location.href = `contatti.html?${params}`;
});

addEventListener("resize", resize);
initializeMaterialCatalog();
resize();
animate();
loadOriginalModels()
  .then(buildWall)
  .catch((error) => {
    console.error("Impossibile caricare le geometrie originali IW", error);
    buildWall();
  })
  .finally(() => requestAnimationFrame(() => loading.classList.add("hidden")));
