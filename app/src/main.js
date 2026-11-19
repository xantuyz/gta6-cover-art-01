// Wires the Vice Cover Studio editor: photo upload (file picker + drag and
// drop), layout / theme / caption controls, per-panel drag-to-position and
// zoom, live canvas preview, and PNG export in three posting sizes.
// A `?shot=` query sets up a fixed scene for a screenshot instead (shots.js).
import { drawCover, exportCoverPNG } from './cover.js';
import { layoutById, layoutIds, panelRects } from './panels.js';
import { themeById, themeIds } from './themes.js';
import { loadFileImage, loadImage } from './images.js';
import { runShot } from './shots.js';

export const EXPORT_SIZES = [
  { id: '1080x1080', w: 1080, h: 1080, label: '1080 x 1080 (square)' },
  { id: '1080x1350', w: 1080, h: 1350, label: '1080 x 1350 (portrait)' },
  { id: '1920x1080', w: 1920, h: 1080, label: '1920 x 1080 (wide)' },
];

const canvas = document.getElementById('cover');
const statusEl = document.getElementById('status');
const state = {
  photos: [],
  assign: [0, 1, -1, 0],
  layout: 'vice',
  theme: 'sunset',
  title: 'Sunset Heist',
  subtitle: 'Vice City Nights',
  titlePos: 'bottom',
  titleColor: '#ffffff',
  fillMode: 'all',
  panels: [{ zoom: 1, dx: 0, dy: 0, rot: 0 }, { zoom: 1, dx: 0, dy: 0, rot: 0 },
    { zoom: 1, dx: 0, dy: 0, rot: 0 }, { zoom: 1, dx: 0, dy: 0, rot: 0 }],
};
let exportSize = EXPORT_SIZES[0];
let selectedPanel = 0;
let drag = null;

function setStatus(text) {
  statusEl.textContent = text;
}

function redraw() {
  drawCover(canvas, state);
}

function sizePreviewToExport() {
  canvas.width = exportSize.w;
  canvas.height = exportSize.h;
  redraw();
}

/** Adds picked files as photos (keeps at most 3) and redraws. */
export async function addPhotos(files) {
  const list = [...files].filter((f) => f.type.startsWith('image/')).slice(0, 3);
  for (const file of list) {
    try {
      const img = await loadFileImage(file);
      if (state.photos.length < 3) state.photos.push(img);
    } catch {
      setStatus(`Could not read ${file.name}.`);
    }
  }
  if (state.photos.length) setStatus(`${state.photos.length} photo(s) loaded — drag a panel to reposition it.`);
  redraw();
}

/** Which panel (index) contains canvas point (px, py), or -1. */
export function panelAt(px, py) {
  const layout = layoutById(state.layout);
  const margin = Math.round(Math.min(canvas.width, canvas.height) * 0.018);
  const stripH = Math.round(canvas.height * 0.16);
  const rects = panelRects(layout, canvas.width, canvas.height, stripH, margin);
  for (let i = rects.length - 1; i >= 0; i -= 1) {
    const r = rects[i];
    if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) return i;
  }
  return -1;
}

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * canvas.width,
    y: ((event.clientY - rect.top) / rect.height) * canvas.height,
  };
}

canvas.addEventListener('pointerdown', (event) => {
  const p = canvasPoint(event);
  const idx = panelAt(p.x, p.y);
  if (idx < 0) return;
  selectedPanel = idx;
  document.getElementById('panelPick').value = String(idx);
  syncPanelControls();
  drag = { idx, x: p.x, y: p.y };
  canvas.setPointerCapture(event.pointerId);
});

canvas.addEventListener('pointermove', (event) => {
  if (!drag) return;
  const p = canvasPoint(event);
  const tune = state.panels[drag.idx];
  const layout = layoutById(state.layout);
  const margin = Math.round(Math.min(canvas.width, canvas.height) * 0.018);
  const stripH = Math.round(canvas.height * 0.16);
  const r = panelRects(layout, canvas.width, canvas.height, stripH, margin)[drag.idx];
  tune.dx += (p.x - drag.x) / r.w;
  tune.dy += (p.y - drag.y) / r.h;
  tune.dx = Math.max(-0.6, Math.min(0.6, tune.dx));
  tune.dy = Math.max(-0.6, Math.min(0.6, tune.dy));
  drag.x = p.x;
  drag.y = p.y;
  redraw();
});

canvas.addEventListener('pointerup', () => { drag = null; });

function syncPanelControls() {
  const tune = state.panels[selectedPanel];
  document.getElementById('zoom').value = String(tune.zoom);
  document.getElementById('zoomVal').textContent = `${Math.round(tune.zoom * 100)}%`;
}

function bindControls() {
  const $ = (id) => document.getElementById(id);
  $('photo').addEventListener('change', (e) => addPhotos(e.target.files));
  const drop = $('dropzone');
  ['dragover', 'dragenter'].forEach((ev) => drop.addEventListener(ev, (e) => {
    e.preventDefault();
    drop.classList.add('dragging');
  }));
  ['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, (e) => {
    e.preventDefault();
    drop.classList.remove('dragging');
  }));
  drop.addEventListener('drop', (e) => addPhotos(e.dataTransfer.files));

  $('layout').addEventListener('change', (e) => { state.layout = e.target.value; redraw(); });
  $('theme').addEventListener('change', (e) => { state.theme = e.target.value; redraw(); });
  $('fillMode').addEventListener('change', (e) => { state.fillMode = e.target.value; redraw(); });
  $('title').addEventListener('input', (e) => { state.title = e.target.value; redraw(); });
  $('subtitle').addEventListener('input', (e) => { state.subtitle = e.target.value; redraw(); });
  $('titlePos').addEventListener('change', (e) => { state.titlePos = e.target.value; redraw(); });
  $('titleColor').addEventListener('change', (e) => { state.titleColor = e.target.value; redraw(); });
  $('panelPick').addEventListener('change', (e) => {
    selectedPanel = Number(e.target.value);
    syncPanelControls();
  });
  $('zoom').addEventListener('input', (e) => {
    state.panels[selectedPanel].zoom = Number(e.target.value);
    syncPanelControls();
    redraw();
  });
  $('rotate').addEventListener('click', () => {
    const tune = state.panels[selectedPanel];
    tune.rot = (tune.rot + 90) % 360;
    redraw();
  });
  $('resetPanel').addEventListener('click', () => {
    state.panels[selectedPanel] = { zoom: 1, dx: 0, dy: 0, rot: 0 };
    syncPanelControls();
    redraw();
  });
  document.querySelectorAll('input[name="size"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      exportSize = EXPORT_SIZES.find((s) => s.id === radio.value) || EXPORT_SIZES[0];
      sizePreviewToExport();
    });
  });
  $('export').addEventListener('click', async () => {
    setStatus('Rendering PNG…');
    const blob = await exportCoverPNG(state, exportSize.w, exportSize.h);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-cover-${exportSize.w}x${exportSize.h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    setStatus(`Saved vice-cover-${exportSize.w}x${exportSize.h}.png`);
  });
}

function fillSelects() {
  const layoutSel = document.getElementById('layout');
  layoutIds().forEach((id) => {
    const opt = document.createElement('option');
    opt.value = id;
    opt.textContent = layoutById(id).label;
    layoutSel.append(opt);
  });
  const themeSel = document.getElementById('theme');
  themeIds().forEach((id) => {
    const opt = document.createElement('option');
    opt.value = id;
    opt.textContent = themeById(id).label;
    themeSel.append(opt);
  });
}

async function loadSamples() {
  try {
    const pier = await loadImage('samples/pier.jpg');
    const boulevard = await loadImage('samples/boulevard.jpg');
    state.photos = [pier, boulevard];
  } catch {
    state.photos = [];
  }
  redraw();
}

fillSelects();
bindControls();
syncPanelControls();

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) {
  runShot(shot, params, async (scene) => {
    state.photos = scene.photos;
    state.title = scene.title;
    state.subtitle = scene.subtitle;
    state.layout = scene.layout;
    state.theme = scene.theme;
    state.fillMode = scene.fillMode;
    document.getElementById('title').value = scene.title;
    document.getElementById('subtitle').value = scene.subtitle;
    // In cover mode the canvas fills the viewport at the shot's aspect.
    if (shot === 'cover') {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    redraw();
    // Re-measure and redraw once the display font arrives: the first paint
    // may have used the fallback font, whose widths differ from Anton's.
    document.fonts.ready.then(() => redraw());
  });
} else {
  await loadSamples();
  document.fonts.ready.then(() => redraw());
}
