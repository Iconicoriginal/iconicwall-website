# HANDOFF — Configuratore IconicWall Studio

Nota per la prossima chat: leggere questo file prima di toccare il codice.
Aggiornato al 23/07/2026.

## 1. Obiettivo del progetto

"IconicWall Studio" (`configuratore.html`) è il configuratore web del sistema
di pareti modulari IconicWall (pannelli magnetici con finiture 3M DI-NOC).
Deve far comporre una parete a chiunque in modo giocoso — ambiente, moduli,
pannelli, finiture — e chiudere con render realistici da condividere, così
che anche un semplice curioso "voglia farlo provare a un conoscente".

## 2. Stato attuale

Funziona ed è verificato in browser (desktop + mobile):

- Composizione 2D live: moduli 300/600/900, pannelli Flat/Lux/Shelf/Frame/Box/
  Testiera, altezze, verso vena, scambio verticale, **quota da terra per
  singolo modulo** (novità: moduli laterali a terra + centrali sospesi sopra
  il letto), pannelli uniti su più moduli (rettangolo, divisibili), Sorprendimi.
- Ambienti: 8 scene illustrate SVG + **3 scene fotografiche calibrate**
  (camera-hotel 1/2/3, generate con Higgsfield/Nano Banana Pro) + foto utente
  con raddrizzamento prospettico (omografia) e ritocco oggetti (PatchMatch).
- Finiture: 48 curate DI-NOC in 6 gruppi; in parete texture HD dai sorgenti
  3M 788px con de-lighting; posa reale (fogli legno, book-match marmi,
  seamless tessuti/metalli); continuità ancorata alla parete.
- Render: **gruppo "◈ Vedi in 3D | ✦ Renderizza | ▤ Tavola" sopra lo stage**.
  "Renderizza" = fotoinserimento prospettico nel quadrilatero calibrato della
  scena ¾ con ritaglio ai confini fisici del muro.
- **3D = studio neutro deliberato** (23/07): niente arredo né stanze
  ricostruite (letto/comodini/lampade rimossi, `buildRoom3D` eliminata);
  esposizione 0.85 + luci ribassate, finiture ricche e leggibili. Il 3D è il
  viewer tecnico del prodotto; l'ambientazione la fanno le scene foto.
- **Tavola tecnica** (▤, toggle `techView`): elevazione quotata su fondo
  carta — catena quote moduli, larghezza/altezza totali, quote da terra
  tratteggiate, chip F1/F2 per pannello, abaco finiture con campioni reali,
  cartiglio. Pannelli ancora interattivi. `renderWallTech()` in sezione 8bis.
- **Occlusione scena (23/07, camera-hotel-2 COMPLETA)**: poligoni `occl`
  (frontale, px foto) e `quad34.occl` (¾) = letto + comodini (gambe a
  slitta incluse) + lampade AJ + basi; nel live la parete è clippata ai
  `bounds` fisici e la foto ritagliata sulle sagome torna davanti; in
  `renderPerspective` il primo piano viene ridisegnato sopra. Metodo di
  tracciatura: crop ingranditi con griglia px via canvas → /__save +
  edge-snap automatico (vertici agganciati al gradiente più forte ±6px;
  funziona solo dove c'è contrasto — sul bianco-su-bianco tracciare a mano
  2-3 px DENTRO la sagoma). Bordi maschera SFUMATI ~1.5px (SVG feGaussianBlur
  nel mask; canvas blur+source-in): la piuma assorbe le micro-imprecisioni.
  FATTO per tutte e 3 le scene (23/07): camera-hotel-2 = letto+comodini+
  lampade AJ (15 poligoni per vista); camera-hotel-1 e 3 = testiera a tutta
  larghezza (la parete scende DIETRO la testiera: 1-4 poligoni per vista;
  nella 1 i cappelli delle lampade sporgono sopra la linea e hanno poligoni
  propri). Upgrade finale possibile: maschere PNG alpha per scena (da
  produrre insieme agli 11 ambienti nuovi).
- **Parallasse testiera (23/07 sera)**: la testiera sporge dal muro → nella
  ¾ la sua sagoma proietta sul piano parete PIÙ BASSA del suo vero filo
  (Sera: 825-1018 mm vs 1050 reali; Caldo: 955-1056). I moduli a quota =
  filo testiera mostravano una striscia di muro nudo nel render. Fix:
  minBaseline/defaultBaseline ribassati (Caldo 900, Sera 750) così i
  moduli scendono DIETRO la sagoma e l'occlusione fa il resto. Regola per
  le scene future: minBaseline ≤ minimo della sagoma ¾ proiettata.
- **Ricalibrazione ¾ (23/07 sera)**: i `quad34.bounds` erano tarati male
  (Caldo si fermava alla testiera, Sera buttava via >1 m di muro) — ora
  misurati via omografia inversa su crop con griglia: Caldo [-2480,2300],
  Sera [-1930,3400]; corner destri Chiaro corretti sul giunto soffitto
  ([2029,117]/[2029,1307]). `fbounds` = confini frontali separati (le due
  foto AI non coincidono). Vincolo d'inquadratura aggiunto a PROMPT-SCENE.md.
- **Uscite esplicite (23/07)**: chip "✕ Torna alla composizione" sullo
  stage in modalità tavola (`#tech-exit`), "← Torna al configuratore"
  nel piede dell'overlay render (`#render-back`), ESC chiude render →
  3D → tavola in quest'ordine.
- Chiusura: PNG condivisibile, PDF stampa, link con stato in `#d=`, CTA
  `contatti.html?tipo=config3d` (prefill già gestito da script.js).
- UI dock a 5 schede: Ambiente / Parete / Pannello / Finiture / Riepilogo.
  La selezione pannello NON cambia scheda; puntino oro sul tab Pannello.

## 3. Ultime decisioni prese (non rimetterle in discussione)

- **Niente texture procedurali/inventate**: bocciate esplicitamente da Yuri.
  Solo materiale fotografico 3M reale (788px + de-lighting). Per qualità
  superiore servono scansioni dei campioni fisici o media library 3M.
- **Ritocco foto = opt-in** ("Ritocca: togli oggetti"): l'inpainting client
  ha un tetto; per qualità Photoshop → endpoint AI server-side (futuro).
- **Regola montaggio**: SOLO "a terra il primo pannello è Flat o Testiera",
  e vale solo per moduli a quota 0. Nessun'altra regola (confermato da Yuri).
- **Quota per modulo** con zona letto protetta (minBaseline di scena sui
  moduli che si sovrappongono al letto, ±980 mm dal centro).
- **Scene AI**: generate col suo account Higgsfield via browser (Nano Banana
  Pro, 2K, 3:2, prompt in `assets/configurator/backgrounds/PROMPT-SCENE.md`);
  la coppia frontale+¾ usa la frontale come Reference. Pilota camera-hotel
  approvato; restanti 11 ambienti da produrre con lo stesso processo.
- **Selezione pannello non cambia scheda** (esplicito di Yuri); la modifica
  vive nella scheda Pannello dedicata.
- **Riposizionamento pro (23/07, approvato da Yuri)**: target = architetti e
  studi, quindi NIENTE inseguimento del fotorealismo nel 3D (letto low-poly
  bocciato). Strategia: precisione dichiarata — 2D/Tavola tecnica per la
  fiducia, scene fotografiche per l'emozione, 3D solo prodotto in studio
  neutro (riferimento: configuratore USM Haller). Prossimo tassello: PDF
  "da studio di progettazione" + CTA campioni DI-NOC.
- **Render AI online del composito**: fattibile solo con endpoint serverless
  in `api/` + API key (Replicate/FAL, img2img bassa intensità). In attesa
  della chiave da Yuri.

## 4. File toccati di recente

- `configuratore.js` — tutto il motore (v68). Sezioni numerate nei commenti.
- `configuratore.css` (v34) / `configuratore.html` — UI; versioni query da
  bumpare A OGNI modifica (`?v=`).
- `assets/dinoc/catalog-curated.js` — 48 finiture curate (rigenerabile con
  `scripts/curate-dinoc-catalog.js`).
- `assets/dinoc/textures-hd/` + `manifest.js` — texture 788px de-lighted,
  rigenerabili con `scripts/build-hd-from-sources.js` (richiede `sharp`;
  sorgenti in `iCloudDrive/Iconic/3M DiNoc/Pattern 3M DiNoc 2024-Rinominati`).
- `assets/configurator/backgrounds/` — scene fotografiche (frontali + `-34`)
  e `PROMPT-SCENE.md` (prompt per i 12 ambienti).
- `scripts/generate-hd-textures.js` — generatore procedurale DEPRECATO
  (tenuto come riferimento, non usarlo: decisione §3).

## 4bis. Sito multilingua (23/07 sera)

- Aggiunto OLANDESE (nl): cartella `nl/` con 18 pagine tradotte (registro
  formale "u", target studi/architetti), dizionario `i18n.nl` + bandiera +
  regex percorsi in script.js (v57→v58 bumpato in TUTTE le pagine),
  hreflang="nl" inserito nelle 90 pagine esistenti, sitemap.xml con 18
  blocchi url nl + 108 alternates. Verificato su localhost: nav/footer nl,
  switcher a 6 lingue, hreflang ovunque, zero errori console.
- COMMITTATO e DEPLOYATO il 23/07 sera (`0100a75` nl + `3ba2785` piano
  ambienti, push su `live/master` → Vercel): /nl/ live e verificato,
  incluso tutto il lavoro configuratore (v76) che era su master.

## ⭐ PUNTO DI RIPRESA (24/07/2026)

PROSSIMA AZIONE: generare le immagini del LOTTO 1 (reception-hotel,
zona-comune-hotel, ristorante — prompt pronti in
assets/configurator/backgrounds/LOTTO-1-PROMPTS.md). Yuri ha chiesto che
sia Claude a occuparsene guidando il SUO Chrome su Higgsfield (account
suo, Nano Banana Pro, 2K, 3:2; la ¾ usa la frontale come Reference) —
servono i tool "Claude in Chrome" e il Chrome di Yuri loggato. Poi, per
ogni scena: calibrazione frontale (pxPerMm/cx/floorY/fbounds) → quad34
con __calib → occl con crop-griglia+edge-snap → minBaseline da sagoma ¾
→ verifica render → commit del lotto. Stato business: call con Pieter
GIÀ avvenuta e agenda GIÀ inviata (non riproporre); sito /nl/ live.

## 5. Cosa resta da fare (in ordine)

1. ~~PDF "da studio di progettazione"~~ FATTO (23/07): "Scarica scheda
   PDF" nel Riepilogo ora produce la scheda progetto — tavola tecnica
   quotata in prima pagina (`buildTechSheet()`, condiviso con la vista ▤),
   distinta, superficie, note di posa, CTA campioni con codici finiture,
   anteprima ambientata in seconda pagina (break-before: page).
2. **Produrre gli 11 ambienti** — DECISIONI 23/07 (Yuri): 1 variante per
   ambiente, ufficio+ristorante dentro, farmacia+profumeria fuori, ordine
   contract→casa→retail. Piano lotti e stili in PROMPT-SCENE.md; prompt
   pronti del lotto 1 (reception-hotel, zona-comune-hotel, ristorante) in
   LOTTO-1-PROMPTS.md. Generazione su account Higgsfield di Yuri; poi
   calibrazione+maschere con pipeline collaudata (crop griglia → __calib →
   occl con edge-snap → minBaseline da sagoma ¾ → verifica → commit a
   lotto). NB: `room3d` non serve più (3D sempre studio neutro).
3. **Render AI del composito** (endpoint `api/` + chiave Replicate/FAL da
   chiedere a Yuri) — solo come "suggestione fotografica", non feature core.
4. Sorprendimi con layout a quote miste (ponte + spalle) tra i preset.
5. **Commit**: `94b0b55` (22/07, riscrittura Studio) + `8021350` (23/07,
   riposizionamento professionale: 3D neutro, Tavola, occlusioni, PDF,
   ricalibrazioni — js v76, css v36). Working tree pulito al 23/07 sera
   salvo PROMPT-SCENE.md e LOTTO-1-PROMPTS.md (piano ambienti, da
   committare col lotto 1). Committare solo su richiesta.
6. Test dal vivo di Yuri su mobile reale (pinch 3D, upload foto vera,
   leggibilità Tavola su schermo piccolo).

## 6. Avvio in locale

- Server statico: `node <scratchpad>/static-server.js` → porta **8123**
  (il file vive nello scratchpad di sessione; se sparito, è un semplice
  http server Node sulla cartella del sito con endpoint dev `PUT /__save/`).
  In alternativa: preview_start "sito-iconicwall" (launch.json già configurato)
  o un qualunque static server sulla cartella del progetto.
- URL: `http://localhost:8123/configuratore.html` (Ctrl+F5 dopo ogni modifica).
- Git: branch `master`; commit `94b0b55` (22/07) contiene configuratore,
  scene, texture HD e script. Non committate: modifiche 23/07 (3D neutro,
  Tavola tecnica). Nessun remote push automatico: committare solo su
  richiesta di Yuri.

## 7. Trappole / cose da sapere

- **Bump `?v=` obbligatorio** su configuratore.js/css in configuratore.html
  a ogni modifica, o il browser serve la cache.
- **Download Chrome di Yuri si bloccano** in `.crdownload` senza finalizzare:
  i file sono in realtà completi — copiali e leggili direttamente.
- **Screenshot del Browser pane spesso in timeout**: workaround collaudato =
  la pagina POSTa canvas su `PUT /__save/<nome>` del server dev e si legge il
  file dallo scratchpad con Read. Le schede `file://` aperte dagli hook
  bloccano le catture: chiuderle subito.
- **styles.css globale** rende `position:absolute` gli svg nei bottoni:
  servono override nei CSS di pagina (già fatto per `.popover-families`).
- `#panel-editor` usa ancora id `popover-*`: sono nel dock, non è più un
  popover flottante. Non "ripulire" i nomi senza aggiornare tutto il JS.
- **mutate() vs mutateKeep()**: mutate azzera la selezione (refresh →
  closePopover); per azioni che devono conservare la selezione usare
  mutateKeep + eventuale reopenPopover/renderPopover.
- Le quote/`panelQuota` sono **assolute da terra** (includono col.baseline):
  i confronti dei gruppi uniti e le regole "a terra" (===0) dipendono da ciò.
- Calibrazione scene: strumento `__calib(sceneId)` in console + salvataggio
  via `/__save`; l'orizzonte camera è a 1400 mm. Corners/bounds nei dati
  `PHOTO_SCENES` in configuratore.js.
- Il vecchio `scripts/build_dinoc_catalog.py` punta a un percorso iCloud
  obsoleto (Marketing/Materiale): quello vero è `Iconic/3M DiNoc/...`.
- Sessioni interrotte a metà edit hanno già lasciato doppioni (es. doppia
  `let mergeMode`): dopo ogni ripresa, `node --check configuratore.js`.
