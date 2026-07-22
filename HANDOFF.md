# HANDOFF — Configuratore IconicWall Studio

Nota per la prossima chat: leggere questo file prima di toccare il codice.
Aggiornato al 19/07/2026.

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
- Render: **gruppo "◈ Vedi in 3D | ✦ Renderizza" nella barra sopra lo stage**
  (ultimo lavoro fatto: spostato lì dal Riepilogo, pillola bordo bronzo).
  "Renderizza" = fotoinserimento prospettico nel quadrilatero calibrato della
  scena ¾ con ritaglio ai confini fisici del muro. 3D con quote per modulo.
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

## 5. Cosa resta da fare (in ordine)

1. **Produrre gli altri 11 ambienti** (33 frontali + 33 ¾ su Higgsfield,
   calibrarli come camera-hotel: quad, bounds, minBaseline, room3d).
2. **3D ambientato**: config `room3d` per scena è già nei dati; verificare
   che la stanza 3D (pavimento texture, pareti tinte, letto, luci) renda
   bene con le quote per modulo — non ricontrollata visivamente dopo il
   refactor quote.
3. **Render AI del composito** (endpoint `api/` + chiave Replicate/FAL da
   chiedere a Yuri) con pulsante "Migliora con AI" nell'anteprima render.
4. Sorprendimi con layout a quote miste (ponte + spalle) tra i preset.
5. **Commit**: 3 file modificati + ~14 nuovi MAI committati (vedi §6).
6. Test dal vivo di Yuri su mobile reale (pinch 3D, upload foto vera).

## 6. Avvio in locale

- Server statico: `node <scratchpad>/static-server.js` → porta **8123**
  (il file vive nello scratchpad di sessione; se sparito, è un semplice
  http server Node sulla cartella del sito con endpoint dev `PUT /__save/`).
  In alternativa: preview_start "sito-iconicwall" (launch.json già configurato)
  o un qualunque static server sulla cartella del progetto.
- URL: `http://localhost:8123/configuratore.html` (Ctrl+F5 dopo ogni modifica).
- Git: branch `master`, **17 voci non committate** (configuratore.*, scene,
  texture HD, script). Nessun remote push automatico: committare solo su
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
