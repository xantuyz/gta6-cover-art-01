// Vice Cover Studio — entrypoint for gta6-cover-art-01 (Node 22, standard library only).
// The app is plain static files under app/ (offline, no library, no network). This program
// copies app/ and screenshots/ into the output directory and writes output/dossier.json,
// the summary the judge reads, using the vendored make.fun library. It also validates the
// entry against the scorer's caps before writing the dossier, so a bad build fails here
// instead of at the server.
//
// Run locally:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Try the app:  node serve.ts  (then open http://localhost:8080)

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const appDir = join(here, 'app');
const shotsDir = join(here, 'screenshots');

/** Lists every file below a directory, relative paths, sorted. */
export function listFiles(dir, prefix = '') {
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) found.push(...listFiles(join(dir, entry.name), rel));
    else if (entry.isFile()) found.push(rel);
  }
  return found;
}

/** Total bytes of the files listed under a directory. */
export function totalBytes(dir, files) {
  return files.reduce((sum, rel) => sum + statSync(join(dir, rel)).size, 0);
}

if (!existsSync(appDir)) throw new Error(`missing app/ beside main.ts (${appDir})`);
if (!existsSync(join(appDir, 'index.html'))) throw new Error('missing app/index.html');

mkdirSync(out, { recursive: true });
cpSync(appDir, join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(shotsDir)) cpSync(shotsDir, join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): text_max_bytes shapes the dossier bytes;
// the other caps refuse an entry the scorer would refuse (more than 4 screenshots or one
// over 256 KiB; more than 993 files in app/ or 48 MiB of app files in all; a path under
// app/ over 1000 bytes; app/ counts beside /output's own 1000-entry cap).
const appFiles = listFiles(join(out, 'app'));
const appBytes = totalBytes(join(out, 'app'), appFiles);
if (appFiles.length > 993) throw new Error(`app/ has ${appFiles.length} files, cap is 993`);
if (appBytes > 50331648) throw new Error(`app/ is ${appBytes} bytes, cap is 48 MiB`);
const shotFiles = existsSync(join(out, 'screenshots')) ? listFiles(join(out, 'screenshots')) : [];
if (shotFiles.length < 3 || shotFiles.length > 4) {
  throw new Error(`screenshots/ has ${shotFiles.length} files, need 3 or 4`);
}
for (const shot of shotFiles) {
  const size = statSync(join(out, 'screenshots', shot)).size;
  if (size > 262144) throw new Error(`screenshot ${shot} is ${size} bytes, cap is 256 KiB`);
}

const dossier = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(out, 'dossier.json'), dossier);

// buildDossier returns bytes (a Uint8Array), not a string: decode before parsing.
// The dossier the judge reads must be valid JSON and under the 1.5 MiB cap; the
// cover font must be vendored, otherwise the caption falls back to a system font.
const dossierStat = statSync(join(out, 'dossier.json'));
if (dossierStat.size > 1572864) throw new Error(`dossier.json is ${dossierStat.size} bytes, cap is 1.5 MiB`);
JSON.parse(new TextDecoder().decode(dossier));
if (!existsSync(join(out, 'app', 'fonts', 'Anton.woff2'))) {
  throw new Error('missing app/fonts/Anton.woff2 — the caption font must be vendored');
}
const shotSummary = shotFiles
  .map((shot) => `${shot} ${statSync(join(out, 'screenshots', shot)).size}B`)
  .join(', ');

console.log(`Vice Cover Studio: app/ ${appFiles.length} files, ${appBytes} bytes; ` +
  `screenshots/ ${shotFiles.length} files [${shotSummary}]; dossier.json ${dossier.length} bytes -> ${out}`);
