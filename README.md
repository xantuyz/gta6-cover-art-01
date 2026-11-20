[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/xantuyz/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/xantuyz/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

# Vice Cover Studio

Turn your photos into a multi-panel poster cover: a big hero panel plus smaller
detail panels, a bold poster caption, and a sunset / neon grade — then export a
share-ready PNG. Built for the [make.fun bounty](https://make.fun/bounty/gta6-cover-art-01)
by **@xantuyz** (referral `b4rk0bn2`).

## What it does

- **Three layouts** — Vice Grid (hero + two panels), Sunset Strip (hero + three
  below), Neon Trio (three vertical panels).
- **Three grades** — Sunset Vice City, Neon Night, Palm Dusk: duotone washes,
  vignette and halftone dots, all drawn procedurally on canvas.
- **Original procedural art** — a striped setting sun, palm silhouettes, a city
  skyline, a perspective grid and birds, drawn in code for any panel without a
  photo. No artwork, logo or font from any game is used.
- **Any photo** — upload several photos (or drop them on the preview), one photo
  per panel or one photo across all panels. Click a panel to select it, then drag
  its photo to move it, scroll to zoom, rotate 90°, fit or fill.
- **Caption** — a big condensed poster title (Anton, SIL OFL, vendored under
  `app/fonts/`) with an outline and drop shadow, an optional sub-caption,
  position and colour choices.
- **Export** — one click renders a PNG at **1080×1080**, **1080×1350** or
  **1920×1080**.

## Offline by design

Everything runs in the browser with no library and no network request. Photos
are read locally and never leave the machine. Serve it locally with:

```sh
node serve.ts
# open http://localhost:8080
```

## Files

- `app/index.html`, `app/style.css` — editor page and dark editor styling.
- `app/src/main.js` — UI wiring: upload, drag/zoom/rotate, export.
- `app/src/cover.js` — the cover renderer: panels, procedural art, grade, lettering.
- `app/src/panels.js` — layout presets and per-panel photo placement.
- `app/src/themes.js` — the three grade presets and the sunset wash.
- `app/src/shots.js` — deterministic `?shot=` scenes for screenshots.
- `app/fonts/` — Anton (SIL OFL) + `OFL.txt`.
- `app/samples/` — two sample photos made for make.fun, free to use.
- `main.ts` — copies `app/` + `screenshots/` to the output and writes the dossier.
- `shots.json` — the four screenshot scenes.

## License

MIT — see [LICENSE](LICENSE). The Anton font is under the SIL Open Font License
(see `app/fonts/OFL.txt`).
