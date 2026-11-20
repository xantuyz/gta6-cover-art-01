// Wires Vice Cover Studio: photo upload (file picker + drag-drop), layout and
// grade pickers, title/sub-caption editing, per-panel drag/zoom/rotate, and
// one-click PNG export at 1080x1080, 1080x1350 or 1920x1080. Photos are read
// locally only — nothing is uploaded anywhere. A `?shot=` query switches the
// page into a fixed screenshot scene instead (see shots.js).

import { drawCover } from './cover.js';
import { layoutById, layoutRects, panelAt } from './panels.js';
import { loadImage, loadSample, defaultTransform, fitTransform, fillTransform } from './images.js';
import { parseShotQuery, markShotReady } from './shots.js';

const canvas = document.getElementById('cover');
const statusEl = document.getElementById('status');
const dropzone = document.getElementById('dropzone');
const photoInput = document.getElementById('photo');
const layoutSelect = document.getElementById('layout');
const themeSelect = document.getElementById('theme');
const modeSelect = document.getElementById('mode');
const titleInput = document.getElementById('title');
const subInput = document.getElementById('sub');
const posSelect = document.getElementById('position');
const colorSelect = document.getElementById('color');
const zoomRange = document.getElementById('zoom');
const rotateBtn = document.getElementById('rotate');
const fitBtn = document.getElementById('fit');
const fillBtn = document.getElementById('fill');
const panelLabel = document.getElementById('panel-label');
const exportBtn = document.getElementById('export');

const EXPORT_SIZES = {
  '1080x1080': [1080, 1080],
  '1080x1350': [1080, 1350],
  '1920x1080': [1920, 1080],
};

const state = {
  layout: 'vice-grid',
  theme: 'sunset',
  mode: 'all',
  photos: [],
  panels: [],
  title: 'Sunset Heist',
  sub: 'Vice City Nights',
  captionPos: 'bottom',
  titleColor: 'white',
  exportSize: '1080x1080',
  selected: 0,
};

function setStatus(text) {
  statusEl.textContent = text;
}

/**
 * Rebuilds the panel list for the current layout. Photo panels take photos
 * from the loaded set: in "all" mode every panel shows the first photo, in
 * "per" mode each panel takes the next photo in turn. Art panels keep no
 * photo so they draw the procedural scene.
 */
function rebuildPanels() {
  const count = layoutById(state.layout).rects().length;
  const kept = state.panels;
  state.panels = [];
  for (let i = 0; i < count; i++) {
    const art = layoutById(state.layout).rects()[i].art;
    if (art) {
      state.panels.push({ photo: -1, scale: 1, dx: 0, dy: 0, rot: 0 });
      continue;
    }
    const photo = state.photos.length === 0
      ? -1
      : state.mode === 'per'
        ? i % state.photos.length
        : 0;
    const prev = kept[i];
    state.panels.push(prev && prev.photo === photo
      ? prev
      : defaultTransform(photo));
  }
  if (state.selected >= count) state.selected = 0;
}

/** Sizes the preview canvas to the chosen export size and repaints. */
function redraw() {
  const [w, h] = EXPORT_SIZES[state.exportSize];
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  drawCover(canvas, state);
  updatePanelLabel();
}

function updatePanelLabel() {
  const panel = state.panels[state.selected];
  const kind = panel && panel.photo === -1 ? 'art panel' : 'photo panel';
  panelLabel.textContent = 'Selected panel ' + (state.selected + 1) + ' of ' + state.panels.length + ' (' + kind + ')';
  zoomRange.value = panel ? String(Math.round(panel.scale * 100)) : '100';
  zoomRange.disabled = !panel || panel.photo === -1;
  rotateBtn.disabled = !panel || panel.photo === -1;
  fitBtn.disabled = !panel || panel.photo === -1;
  fillBtn.disabled = !panel || panel.photo === -1;
}

/** Adds image files to the photo set (max 3) and repaints. */
async function addPhotos(files) {
  const list = Array.from(files).filter((f) => f.type.startsWith('image/'));
  for (const file of list) {
    if (state.photos.length >= 3) break;
    try {
      const img = await loadImage(URL.createObjectURL(file));
      state.photos.push(img);
    } catch {
      setStatus('Could not read that image file.');
    }
  }
  rebuildPanels();
  redraw();
  if (state.photos.length > 0) {
    setStatus(state.photos.length + (state.photos.length === 1 ? ' photo' : ' photos') + ' loaded — drag a panel to reposition it.');
  }
}

function currentRects() {
  const [w, h] = EXPORT_SIZES[state.exportSize];
  const bandH = Math.round(h * 0.155);
  let area;
  if (state.captionPos === 'top') area = { x: 0, y: bandH, w, h: h - bandH };
  else if (state.captionPos === 'center') area = { x: 0, y: 0, w, h };
  else area = { x: 0, y: 0, w, h: h - bandH };
  return layoutRects(state.layout, area);
}

function canvasPoint(event) {
  const r = canvas.getBoundingClientRect();
  const sx = canvas.width / r.width;
  const sy = canvas.height / r.height;
  return { x: (event.clientX - r.left) * sx, y: (event.clientY - r.top) * sy };
}

// --- Upload: picker + drag-drop -------------------------------------------
photoInput.addEventListener('change', (e) => {
  addPhotos(e.target.files);
  photoInput.value = '';
});
['dragover', 'dragenter'].forEach((name) => dropzone.addEventListener(name, (e) => {
  e.preventDefault();
  dropzone.classList.add('dragging');
}));
['dragleave', 'drop'].forEach((name) => dropzone.addEventListener(name, (e) => {
  e.preventDefault();
  dropzone.classList.remove('dragging');
}));
dropzone.addEventListener('drop', (e) => addPhotos(e.dataTransfer.files));

// --- Pickers ----------------------------------------------------------------
layoutSelect.addEventListener('change', () => {
  state.layout = layoutSelect.value;
  rebuildPanels();
  redraw();
});
themeSelect.addEventListener('change', () => {
  state.theme = themeSelect.value;
  redraw();
});
modeSelect.addEventListener('change', () => {
  state.mode = modeSelect.value;
  rebuildPanels();
  redraw();
});
titleInput.addEventListener('input', () => { state.title = titleInput.value; redraw(); });
subInput.addEventListener('input', () => { state.sub = subInput.value; redraw(); });
posSelect.addEventListener('change', () => { state.captionPos = posSelect.value; redraw(); });
colorSelect.addEventListener('change', () => { state.titleColor = colorSelect.value; redraw(); });
document.querySelectorAll('input[name="exportSize"]').forEach((radio) => {
  radio.addEventListener('change', () => {
    state.exportSize = radio.value;
    redraw();
  });
});

// --- Selected panel: zoom / rotate / fit / fill -----------------------------
zoomRange.addEventListener('input', () => {
  const panel = state.panels[state.selected];
  if (!panel || panel.photo === -1) return;
  panel.scale = Number(zoomRange.value) / 100;
  redraw();
});
rotateBtn.addEventListener('click', () => {
  const panel = state.panels[state.selected];
  if (!panel || panel.photo === -1) return;
  panel.rot = (panel.rot + 1) % 4;
  redraw();
});
fitBtn.addEventListener('click', () => {
  const panel = state.panels[state.selected];
  if (!panel || panel.photo === -1) return;
  state.panels[state.selected] = fitTransform(panel);
  redraw();
});
fillBtn.addEventListener('click', () => {
  const panel = state.panels[state.selected];
  if (!panel || panel.photo === -1) return;
  const img = state.photos[panel.photo];
  state.panels[state.selected] = fillTransform(panel, img, currentRects()[state.selected]);
  redraw();
});

// --- Canvas pointer: click to select, drag to pan, wheel to zoom ------------
let dragging = null;
canvas.addEventListener('pointerdown', (e) => {
  const p = canvasPoint(e);
  const idx = panelAt(currentRects(), p.x, p.y);
  if (idx === -1) return;
  state.selected = idx;
  const panel = state.panels[idx];
  dragging = { x: p.x, y: p.y, dx: panel.dx, dy: panel.dy };
  canvas.setPointerCapture(e.pointerId);
  updatePanelLabel();
});
canvas.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const p = canvasPoint(e);
  const panel = state.panels[state.selected];
  const rect = currentRects()[state.selected];
  if (!panel || panel.photo === -1 || !rect) return;
  panel.dx = dragging.dx + (p.x - dragging.x) / rect.w;
  panel.dy = dragging.dy + (p.y - dragging.y) / rect.h;
  redraw();
});
canvas.addEventListener('pointerup', () => { dragging = null; });
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const panel = state.panels[state.selected];
  if (!panel || panel.photo === -1) return;
  panel.scale = Math.min(3, Math.max(0.5, panel.scale * (e.deltaY < 0 ? 1.08 : 0.92)));
  redraw();
}, { passive: false });

// --- Export -----------------------------------------------------------------
exportBtn.addEventListener('click', () => {
  const [w, h] = EXPORT_SIZES[state.exportSize];
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  drawCover(off, state);
  off.toBlob((blob) => {
    if (!blob) {
      setStatus('Export failed — please try again.');
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'vice-cover-' + w + 'x' + h + '.png';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    setStatus('Saved vice-cover-' + w + 'x' + h + '.png');
  }, 'image/png');
});

// --- Startup ------------------------------------------------------------------
async function startEditor() {
  rebuildPanels();
  redraw();
  try {
    const [boulevard, pier] = await Promise.all([loadSample('boulevard'), loadSample('pier')]);
    state.photos = [boulevard, pier];
    rebuildPanels();
    redraw();
    setStatus('Sample photos loaded — add your own photos to replace them.');
  } catch {
    setStatus('Sample photos could not be loaded — add your own photos.');
  }
  await document.fonts.load('100px Anton').catch(() => {});
  redraw();
}

/** Screenshot scene: fixed layout/grade/photos/caption, no editor chrome. */
async function startShot() {
  const scene = parseShotQuery(new URLSearchParams(location.search));
  state.layout = scene.layout;
  state.theme = scene.theme;
  state.title = scene.caption;
  state.sub = scene.sub;
  state.captionPos = scene.position;
  state.titleColor = scene.color;
  layoutSelect.value = scene.layout;
  themeSelect.value = scene.theme;
  modeSelect.value = 'all';
  titleInput.value = scene.caption;
  subInput.value = scene.sub;
  posSelect.value = scene.position;
  colorSelect.value = scene.color;
  try {
    const first = await loadSample(scene.photo);
    const second = scene.photo2 === scene.photo ? first : await loadSample(scene.photo2);
    state.photos = [first, second];
  } catch {
    state.photos = [];
  }
  rebuildPanels();
  if (scene.shot === 'cover') {
    document.body.classList.add('shot-cover');
    canvas.width = scene.width;
    canvas.height = scene.height;
    drawCover(canvas, state);
  } else {
    // Editor scene: the normal editor, pre-filled with the scene values.
    redraw();
    setStatus('Sample photos loaded — add your own photos to replace them.');
  }
  await markShotReady();
}

const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  startShot();
} else {
  startEditor();
}
