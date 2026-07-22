# Scene fotorealistiche IconicWall Studio — scheda di generazione

12 ambienti × 3 varianti di stile = 36 scene frontali (+ 36 varianti a ¾ per il
render finale). Qualunque strumento si usi (Flux, Midjourney, ChatGPT/DALL·E),
ogni immagine DEVE rispettare i vincoli del prompt base: sono ciò che permette
alla parete IconicWall di agganciarsi alla foto.

## Convenzione nomi file (in questa cartella)

    {ambiente}-{1|2|3}.jpg        vista frontale (per la vista di lavoro)
    {ambiente}-{1|2|3}-34.jpg     stessa scena, vista a ¾ (per il render finale)

Ambienti: living-tv, living, camera-hotel, camera-residenziale, ingresso,
cucina, reception-hotel, zona-comune-hotel, retail-abbigliamento,
retail-ottica, retail-farmacia, retail-profumeria.

Risoluzione minima 2048 px sul lato lungo, formato 3:2 orizzontale, JPG/WebP.

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

## LE 3 VARIANTI DI STILE (suffisso al prompt base)

1. **Contemporaneo caldo** — "warm contemporary Italian interior, oak floor,
   cream and beige textiles, warm brass accents, daylight"
2. **Minimale chiaro** — "bright minimal Scandinavian-Italian interior, pale
   microcement floor, white and light grey palette, airy diffused daylight"
3. **Scuro drammatico** — "moody dark luxury interior, dark timber floor,
   charcoal and bronze palette, warm evening accent lighting"

## SPECIFICO PER AMBIENTE (da inserire tra prompt base e stile)

- **living-tv** — "residential living room, low media sideboard against the
  side wall, sofa in low foreground facing the empty back wall where a TV
  wall will be added"
- **living** — "residential living room, sofa and armchairs at the edges,
  coffee table low foreground, the empty back wall is a decorative feature
  wall"
- **camera-hotel** — "upscale hotel bedroom, king bed centered in LOW
  foreground seen from behind the footboard, bedside tables with lamps at the
  edges, empty headboard wall"
- **camera-residenziale** — "residential master bedroom, double bed low in
  the foreground, soft textiles, empty wall behind the bed"
- **ingresso** — "residential entryway, slim console at the side edge, coat
  area hidden, empty feature wall facing the entrance"
- **cucina** — "modern kitchen, island in low foreground, cabinetry on the
  side walls only, the empty back wall rises above a clear counter line"
- **reception-hotel** — "boutique hotel reception, desk in low foreground
  seen from the guest side, empty statement wall behind the reception desk"
- **zona-comune-hotel** — "hotel lounge common area, lounge chairs at the
  edges, empty feature wall as the focal point"
- **retail-abbigliamento** — "fashion clothing store interior, garment rails
  at the side edges only, empty display wall at the center back"
- **retail-ottica** — "optical eyewear store, low display counter foreground,
  empty back wall ready for eyewear display panels"
- **retail-farmacia** — "modern pharmacy interior, clean counter low
  foreground, empty back wall for shelving system, bright hygienic light"
- **retail-profumeria** — "perfume and beauty store, elegant low display
  tables, empty back wall as the brand feature wall, soft glamour lighting"

## Checklist qualità prima di consegnare una scena

- [ ] La fascia centrale della parete di fondo è vuota da pavimento a soffitto
- [ ] Linea pavimento/parete visibile e dritta (frontale) o pulita (¾)
- [ ] Luce da un solo lato, ombre morbide coerenti
- [ ] Nessun oggetto che "taglia" la zona parete (lampadari bassi, piante alte)
- [ ] ≥ 2048 px, 3:2, senza watermark
