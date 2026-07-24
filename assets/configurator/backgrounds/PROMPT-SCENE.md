# Scene fotorealistiche IconicWall Studio — piano di produzione e prompt

Decisioni del 23/07/2026 (Yuri): **1 variante per ambiente** (ampliabile poi),
**ufficio e ristorante dentro** (fuori retail-farmacia e retail-profumeria),
**ordine contract → casa → retail**. Pilota camera-hotel già fatto (3 varianti).

## Piano di produzione (11 scene = 11 coppie frontale+¾)

| Lotto | Ambiente | Stile assegnato | Stato |
|---|---|---|---|
| — | camera-hotel (×3: caldo/chiaro/sera) | — | ✅ in produzione |
| 1 | reception-hotel | contemporaneo caldo | da generare |
| 1 | zona-comune-hotel | contemporaneo caldo | da generare |
| 1 | ristorante | scuro drammatico | da generare |
| 2 | ufficio | minimale chiaro | da generare |
| 2 | living-tv | contemporaneo caldo | da generare |
| 2 | camera-residenziale | minimale chiaro | da generare |
| 3 | living | scuro drammatico | da generare |
| 3 | cucina | minimale chiaro | da generare |
| 3 | ingresso | contemporaneo caldo | da generare |
| 4 | retail-abbigliamento | minimale chiaro | da generare |
| 4 | retail-ottica | minimale chiaro | da generare |

Flusso per lotto: generazione coppie (account Higgsfield di Yuri, Nano Banana
Pro, 2K, 3:2; la ¾ usa la frontale come Reference) → calibrazione e maschere
(Claude, ~30-40 min a scena) → verifica di Yuri → commit.

## Convenzione nomi file (in questa cartella)

    {ambiente}-1.webp        vista frontale (per la vista di lavoro)
    {ambiente}-1-34.webp     stessa scena, vista a ¾ (per il render finale)

Risoluzione minima 2048 px sul lato lungo, formato 3:2 orizzontale.

## PROMPT BASE (inglese, da anteporre a ogni scena — vista frontale)

> Professional interior photography, straight-on frontal view of an empty
> feature wall, camera perfectly perpendicular to the back wall, camera height
> 140 cm, 35mm lens, no perspective distortion. The back wall is completely
> EMPTY and unobstructed from floor to ceiling across the central 70% of the
> frame (a wall covering will be digitally added there). Furniture and decor
> only at the left and right edges and low foreground, never against the
> center of the back wall. Ceiling visible at top, floor visible at bottom,
> single coherent soft light from the left side with gentle shadows,
> photorealistic, high-end architectural magazine quality, 3:2 aspect ratio.

Per la variante a ¾ sostituire l'inizio con:

> Professional interior photography, three-quarter view of the same room,
> camera rotated 35 degrees to the right of the wall normal, camera height
> 140 cm, 35mm lens, the empty back wall fully visible in perspective…
> (stessi vincoli: parete centrale vuota, luce da sinistra, 3:2)

## VINCOLI CRITICI (lezioni delle scene pilota, 23/07)

1. **Stessa porzione di muro tra frontale e ¾**: nel ¾ la parete deve restare
   visibile per tutta la larghezza del frontale (muro da angolo ad angolo in
   entrambe, o ≥ 6 m visibili; camera ¾ più arretrata se serve). Niente
   tende/armadi che coprono le estremità del muro nel ¾.
2. **Parallasse degli arredi addossati al muro**: tutto ciò che sporge dal
   muro (testiere, banconi) proietta nel ¾ una sagoma PIÙ BASSA del suo filo
   reale. Preferire arredi bassi o poco profondi contro il muro; in
   calibrazione, minBaseline ≤ minimo della sagoma ¾ proiettata.
3. **Primo piano semplice da mascherare**: sagome solide e compatte (letti,
   banconi, divani). EVITARE gambe filiformi, steli sottili, oggetti
   bianco-su-bianco contro la zona parete: le maschere di occlusione perdono
   precisione.
4. **Aggancio prompt**: frasi tipo "a modular wall covering will be digitally
   added on the empty wall" aiutano il modello a lasciare il muro libero.

## SPECIFICO PER AMBIENTE (da inserire tra prompt base e stile)

- **reception-hotel** — "boutique hotel reception, low solid reception desk in
  low foreground seen from the guest side, empty statement wall behind the
  desk, no tall plants or pendant lights in front of the wall"
- **zona-comune-hotel** — "hotel lounge common area, low lounge chairs at the
  edges, low coffee table foreground, empty feature wall as the focal point"
- **ristorante** — "upscale restaurant dining room, low banquette seating and
  set tables in low foreground, empty feature wall behind the banquette,
  warm evening hospitality lighting"
- **ufficio** — "modern executive meeting room, low credenza at the side edge,
  table in low foreground, empty feature wall facing the entrance"
- **living-tv** — "residential living room, low media sideboard against the
  side wall, sofa in low foreground facing the empty back wall where a TV
  wall will be added"
- **camera-residenziale** — "residential master bedroom, double bed low in
  the foreground with a LOW shallow headboard, soft textiles, empty wall
  behind the bed"
- **living** — "residential living room, sofa and armchairs at the edges,
  coffee table low foreground, the empty back wall is a decorative feature
  wall"
- **cucina** — "modern kitchen, island in low foreground, cabinetry on the
  side walls only, the empty back wall rises above a clear counter line"
- **ingresso** — "residential entryway, slim console at the side edge, coat
  area hidden, empty feature wall facing the entrance"
- **retail-abbigliamento** — "fashion clothing store interior, garment rails
  at the side edges only, empty display wall at the center back"
- **retail-ottica** — "optical eyewear store, low display counter foreground,
  empty back wall ready for eyewear display panels"

## GLI STILI (suffisso al prompt base, uno per ambiente — vedi tabella)

1. **Contemporaneo caldo** — "warm contemporary Italian interior, oak floor,
   cream and beige textiles, warm brass accents, daylight"
2. **Minimale chiaro** — "bright minimal Scandinavian-Italian interior, pale
   microcement floor, white and light grey palette, airy diffused daylight"
3. **Scuro drammatico** — "moody dark luxury interior, dark timber floor,
   charcoal and bronze palette, warm evening accent lighting"

## Checklist qualità prima di consegnare una scena

- [ ] La fascia centrale della parete di fondo è vuota da pavimento a soffitto
- [ ] Frontale e ¾ mostrano la stessa larghezza di muro (vincolo 1)
- [ ] Arredi contro il muro bassi/poco profondi (vincolo 2)
- [ ] Primo piano a sagome solide, niente gambe filiformi (vincolo 3)
- [ ] Linea pavimento/parete visibile e dritta (frontale) o pulita (¾)
- [ ] Luce da un solo lato, ombre morbide coerenti
- [ ] Nessun oggetto che "taglia" la zona parete (lampadari bassi, piante alte)
- [ ] ≥ 2048 px, 3:2, senza watermark
