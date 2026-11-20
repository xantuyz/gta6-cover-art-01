// Wires Vice Cover Studio: multi-photo upload (file input + drag-drop),
// layout and grade pickers, per-panel drag / zoom / rotate, caption inputs
// with auto-fit, and real PNG export at 1080x1080, 1080x1350 or 1920x1080.
// A `?shot=` query sets up a fixed scene for screenshots (./shots.js).
// Photos are read locally only — nothing is ever uploaded anywhere.

import { drawCover, exportCoverPNG } from './cover.js';
import { getLayout, makePanelStates } from './panels.js';
import { THEME_IDS } from './themes.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const captionInput = document.getElementById('caption');
const subInput = document.getElementById('subcaption');
const status = document.getElementById('status');
const zoomInput = document.getElementById('zoom');
const panelSelect = document.getElementById('panel');
const dropZone = document.getElementById('dropzone');

const state = {
  panels: makePanelStates(getLayout('grid'), []),
  layoutId: 'grid',
  themeId: 'sunset',
  caption: 'Sunset Heist',
  subcaption: 'Vice City Nights',
  captionPosition: 'bottom',
  captionColor: '#ffffff',
  selectedPanel: 0,
};

let photos = [];

function currentState() {
  return { ...state, panels: state.panels };
}

function redraw() {
  drawCover(canvas, currentState());
  syncPanelControls();
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** Assigns the loaded photos to the current layout's panels. */
function applyPhotos(list) {
  photos = list;
  state.panels = makePanelStates(getLayout(state.layoutId), photos);
  redraw();
}

async function addFiles(files) {
  const images = [];
  for (const file of files) {
    if (!file.type.startsWith('image/')) continue;
    images.push(await loadImage(URL.createObjectURL(file)));
  }
  if (images.length) applyPhotos([...photos, ...images]);
}

function setLayout(id) {
  state.layoutId = id;
  state.panels = makePanelStates(getLayout(id), photos);
  document.querySelectorAll('[data-layout]').forEach((b) => b.classList.toggle('active', b.dataset.layout === id));
  redraw();
}

function setTheme(id) {
  state.themeId = id;
  document.querySelectorAll('[data-theme]').forEach((b) => b.classList.toggle('active', b.dataset.theme === id));
  redraw();
}

function setExportSize(w, h) {
  canvas.width = w;
  canvas.height = h;
  redraw();
}

function syncPanelControls() {
  const panel = state.panels[state.selectedPanel];
  if (!panel) return;
  if (zoomInput) zoomInput.value = String(Math.round(panel.scale * 100));
  if (panelSelect) {
    panelSelect.innerHTML = state.panels.map((p, i) => `<option value="${i}"${i === state.selectedPanel ? ' selected' : ''}>Panel ${i + 1}${p.img ? ' — photo' : ' — art'}</option>`).join('');
  }
}

// --- Controls -------------------------------------------------------------
document.getElementById('photos').addEventListener('change', async (e) => {
  await addFiles([...e.target.files]);
  e.target.value = '';
});
captionInput.addEventListener('input', () => { state.caption = captionInput.value; redraw(); });
subInput.addEventListener('input', () => { state.subcaption = subInput.value; redraw(); });
document.getElementById('captionPos').addEventListener('change', (e) => { state.captionPosition = e.target.value; redraw(); });
document.getElementById('captionColor').addEventListener('change', (e) => { state.captionColor = e.target.value; redraw(); });
document.querySelectorAll('[data-layout]').forEach((b) => b.addEventListener('click', () => setLayout(b.dataset.layout)));
document.querySelectorAll('[data-theme]').forEach((b) => b.addEventListener('click', () => setTheme(b.dataset.theme)));
document.querySelectorAll('[data-size]').forEach((b) => b.addEventListener('click', () => {
  const [w, h] = b.dataset.size.split('x').map(Number);
  setExportSize(w, h);
  document.querySelectorAll('[data-size]').forEach((x) => x.classList.toggle('active', x === b));
}));
if (panelSelect) panelSelect.addEventListener('change', (e) => { state.selectedPanel = Number(e.target.value); redraw(); });
if (zoomInput) zoomInput.addEventListener('input', () => {
  const panel = state.panels[state.selectedPanel];
  if (panel) { panel.scale = Number(zoomInput.value) / 100; redraw(); }
});
document.getElementById('rotate').addEventListener('click', () => {
  const panel = state.panels[state.selectedPanel];
  if (panel) { panel.rotation = (panel.rotation + 90) % 360; redraw(); }
});
document.getElementById('fit').addEventListener('click', () => {
  const panel = state.panels[state.selectedPanel];
  if (panel) { panel.scale = 1; panel.offsetX = 0; panel.offsetY = 0; panel.rotation = 0; redraw(); }
});
document.getElementById('sample').addEventListener('click', async () => {
  applyPhotos([await loadImage('samples/boulevard.jpg'), await loadImage('samples/pier.jpg')]);
});
document.getElementById('export').addEventListener('click', async () => {
  const size = document.querySelector('[data-size].active')?.dataset.size ?? '1080x1080';
  const [w, h] = size.split('x').map(Number);
  const blob = await exportCoverPNG(currentState(), w, h);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `vice-cover-${w}x${h}.png`;
  a.click();
  status.textContent = `Saved vice-cover-${w}x${h}.png`;
});

// Drag a photo inside its panel to reposition it; click a panel to select it.
let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  const r = canvas.getBoundingClientRect();
  const x = ((e.clientX - r.left) / r.width) * canvas.width;
  const y = ((e.clientY - r.top) / r.height) * canvas.height;
  const layout = getLayout(state.layoutId);
  const i = layout.panels.findIndex((p) => x >= p.x * canvas.width && x < (p.x + p.w) * canvas.width && y >= p.y * canvas.height && y < (p.y + p.h) * canvas.height);
  if (i < 0) return;
  state.selectedPanel = i;
  drag = { panel: state.panels[i], x, y, ox: state.panels[i].offsetX, oy: state.panels[i].offsetY };
  canvas.setPointerCapture(e.pointerId);
  redraw();
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const r = canvas.getBoundingClientRect();
  const x = ((e.clientX - r.left) / r.width) * canvas.width;
  const y = ((e.clientY - r.top) / r.height) * canvas.height;
  drag.panel.offsetX = drag.ox + (x - drag.x);
  drag.panel.offsetY = drag.oy + (y - drag.y);
  redraw();
});
canvas.addEventListener('pointerup', () => { drag = null; });

// Drag-drop photos onto the whole editor.
['dragover', 'dragenter'].forEach((ev) => dropZone.addEventListener(ev, (e) => { e.preventDefault(); dropZone.classList.add('drag'); }));
['dragleave', 'drop'].forEach((ev) => dropZone.addEventListener(ev, (e) => { e.preventDefault(); dropZone.classList.remove('drag'); }));
dropZone.addEventListener('drop', async (e) => { await addFiles([...e.dataTransfer.files]); });

// --- Startup: sample photos by default, then an optional ?shot= scene. ---
const params = new URLSearchParams(location.search);
const shot = params.get('shot');
const startW = Number(params.get('w') || 0);
const startH = Number(params.get('h') || 0);
if (startW > 0 && startH > 0) { canvas.width = startW; canvas.height = startH; }

async function loadDefaults() {
  try {
    applyPhotos([await loadImage('samples/boulevard.jpg'), await loadImage('samples/pier.jpg')]);
  } catch {
    redraw();
  }
}

if (shot) {
  runShot(shot, params, async (names, text, sub, layout, theme) => {
    const loaded = [];
    for (const name of names) loaded.push(await loadImage(`samples/${name}.jpg`));
    setLayout(layout);
    setTheme(theme);
    state.caption = text;
    state.subcaption = sub;
    captionInput.value = text;
    subInput.value = sub;
    applyPhotos(loaded);
  });
} else {
  loadDefaults().then(() => { try { document.fonts.ready.then(redraw); } catch { /* noop */ } });
}
