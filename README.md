# Vice Cover Studio

[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![make.fun rank](https://make.fun/badge/gta6-cover-art-01/xantuyz/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![make.fun reward](https://make.fun/badge/gta6-cover-art-01/xantuyz/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

Turn your photos into a bold multi-panel poster cover — Vice City style.
Pick a layout, pick a sunset grade, drop in your photos, write a caption,
export a share-ready PNG. 100% offline: your photos never leave this browser.

## How it works

1. Open `app/index.html` (or run `node serve.ts` and visit http://localhost:8080).
2. Add photos (upload your own, or use the two bundled samples).
3. Choose a layout — **Vice Grid**, **Sunset Strip**, or **Neon Trio** — and a grade —
   **Sunset Vice City**, **Neon Night**, or **Palm Dusk**.
4. Drag a panel to pan its photo, scroll to zoom, rotate it, and type a caption
   with an optional sub-caption.
5. Export as PNG: **1080x1080**, **1080x1350**, or **1920x1080**.

## Details

- Vanilla JavaScript + Canvas 2D. No library, no network, no tracking.
- Every panel's art is drawn procedurally on canvas (striped sun, palm
  silhouettes, skyline, halftone dots) when a panel has no photo.
- Caption lettering uses Anton (SIL OFL, vendored under `app/fonts/`).
- Deterministic screenshot mode: `?shot=cover|editor` with `shots.json`.

## Build

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

This copies `app/` and `screenshots/` into `out/` and writes `out/dossier.json`.

Built for the [make.fun bounty gta6-cover-art-01](https://make.fun/bounty/gta6-cover-art-01)
by [xantuyz](https://github.com/xantuyz). Referral: `b4rk0bn2`.
