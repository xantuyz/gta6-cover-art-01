// Vice Cover Studio — build entry point (Node 22, standard library only).
// The app is the static `app/` folder beside this file: plain HTML, CSS and
// vanilla ES modules that run offline in a desktop browser, with no library
// and no network request. This program copies `app/` and `screenshots/` into
// the output directory and writes `output/dossier.json` — the summary the
// judge reads — using the vendored make.fun library (vendor/makefun-app.ts,
// untouched). Run it locally with:
//
//   MAKEFUN_OUTPUT_DIR=out node main.ts
//
// and serve the app for a quick look with `node serve.ts`.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The scorer's caps (reference/gate.json): text_max_bytes shapes the dossier
// bytes; the rest refuse an entry the scorer would refuse — more than 4
// screenshots or one over 256 KiB; more than 993 files or 48 MiB in app/; a
// path under app/ longer than 1000 bytes.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);

console.log('BUILD_OK');
