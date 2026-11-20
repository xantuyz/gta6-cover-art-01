// Wires the page: photos, layouts, grades, caption, per-panel crop, and PNG export.
// A `?shot=` query sets up a fixed scene for a screenshot instead (./shots.js).
// Photos are read locally only — nothing is uploaded anywhere.
import { drawCover } from './cover.js';
import { runShot } from './shots.js';
import { LAYOUTS, defaultPanels, loadImage, panelAt, panelRects } from './panels.js';
import { GRADE_ORDER } from './themes.js';

export const SIZES = {
  square: [1080, 1080],
  portrait: [1080, 1350],
  wide: [1920, 1080],
};

const canvas = document.getElementById('cover');
const statusEl = document.getElementById('status');
const captionInput = document.getElementById('caption');
const subInput = document.getElementById('subCaption');
const panelSelect = document.getElementById('panelSelect');
const zoomRange = document.getElementById('zoom');

const state = {
  layout: 'vice-grid',
  grade: 'sunset',
  size: 'square',
  caption: 'VICE CITY NIGHTS',
  subCaption: 'A STORY IN EVERY PANEL',
  captionColor: 'white',
  captionPos: 'bottom',
  photos: [],
  panels: defaultPanels('vice-grid', 2),
};
let selectedPanel = 0;

function setStatus(text) {
  statusEl.textContent = text;
}

function refreshPanelSelect() {
  const count = (LAYOUTS[state.layout] ?? LAYOUTS['vice-grid']).slots.length;
  panelSelect.innerHTML = '';
  for (let i = 0; i < count; i += 1) {
    const option = document.createElement('option');
    option.value = String(i);
    option.textContent = `Panel ${i + 1}${state.panels[i] ? ` — photo ${(state.panels[i].photo ?? 0) + 1}` : ''}`;
    panelSelect.appendChild(option);
  }
  if (selectedPanel >= count) selectedPanel = 0;
  panelSelect.value = String(selectedPanel);
  const t = state.panels[selectedPanel];
  if (t) zoomRange.value = String(t.scale ?? 1);
}

function redraw() {
  const [w, h] = SIZES[state.size] ?? SIZES.square;
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  drawCover(canvas, state);
  refreshPanelSelect();
}

function markActive(group, value) {
  document.querySelectorAll(`[data-${group}]`).forEach((button) => {
    button.classList.toggle('active', button.dataset[group] === value);
  });
}

function applyLayout(layout) {
  state.layout = LAYOUTS[layout] ? layout : 'vice-grid';
  state.panels = defaultPanels(state.layout, Math.max(state.photos.length, 1));
  selectedPanel = 0;
  markActive('layout', state.layout);
  redraw();
}

function applyGrade(grade) {
  state.grade = GRADE_ORDER.includes(grade) ? grade : 'sunset';
  markActive('grade', state.grade);
  redraw();
}

function applySize(size) {
  state.size = SIZES[size] ? size : 'square';
  redraw();
}

/** Loads one or more files as photos and assigns the first new one to the selected panel. */
export async function addPhotos(files) {
  let added = 0;
  for (const file of files) {
    if (!file.type.startsWith('image/')) continue;
    try {
      const img = await loadImage(URL.createObjectURL(file));
      state.photos.push(img);
      added += 1;
    } catch {
      // A file that is not a readable image is skipped, the rest still load.
    }
  }
  if (added > 0) {
    const t = state.panels[selectedPanel];
    if (t) t.photo = state.photos.length - 1;
    setStatus(`${added} photo${added > 1 ? 's' : ''} added — photo ${state.photos.length} is on panel ${selectedPanel + 1}.`);
    redraw();
  }
  return added;
}

document.getElementById('photos').addEventListener('change', (e) => {
  addPhotos([...e.target.files]);
});
captionInput.addEventListener('input', () => {
  state.caption = captionInput.value;
  redraw();
});
subInput.addEventListener('input', () => {
  state.subCaption = subInput.value;
  redraw();
});
document.getElementById('captionColor').addEventListener('change', (e) => {
  state.captionColor = e.target.value;
  redraw();
});
document.getElementById('captionPos').addEventListener('change', (e) => {
  state.captionPos = e.target.value;
  redraw();
});
document.querySelectorAll('[data-layout]').forEach((button) => {
  button.addEventListener('click', () => applyLayout(button.dataset.layout));
});
document.querySelectorAll('[data-grade]').forEach((button) => {
  button.addEventListener('click', () => applyGrade(button.dataset.grade));
});
document.querySelectorAll('input[name="exportSize"]').forEach((radio) => {
  radio.addEventListener('change', () => applySize(radio.value));
});
panelSelect.addEventListener('change', () => {
  selectedPanel = Number(panelSelect.value);
  const t = state.panels[selectedPanel];
  if (t) zoomRange.value = String(t.scale ?? 1);
});
zoomRange.addEventListener('input', () => {
  const t = state.panels[selectedPanel];
  if (!t) return;
  t.scale = Number(zoomRange.value);
  redraw();
});
document.getElementById('rotate').addEventListener('click', () => {
  const t = state.panels[selectedPanel];
  if (!t) return;
  t.rot = ((t.rot ?? 0) + 1) % 4;
  redraw();
});
document.getElementById('fit').addEventListener('click', () => {
  const t = state.panels[selectedPanel];
  if (!t) return;
  t.scale = 1;
  t.dx = 0;
  t.dy = 0;
  t.rot = 0;
  zoomRange.value = '1';
  redraw();
});
document.getElementById('nextPhoto').addEventListener('click', () => {
  if (state.photos.length === 0) return;
  const t = state.panels[selectedPanel];
  if (!t) return;
  t.photo = ((t.photo ?? 0) + 1) % state.photos.length;
  redraw();
});

// Drag a panel to pan its photo; scroll over the canvas to zoom the panel under the cursor.
let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const px = (e.clientX - rect.left) * (canvas.width / rect.width);
  const py = (e.clientY - rect.top) * (canvas.height / rect.height);
  const gutter = Math.max(4, Math.round(canvas.width * 0.008));
  const rects = panelRects(state.layout, canvas.width, canvas.height, gutter);
  const hit = panelAt(rects, px, py);
  if (hit === -1) return;
  selectedPanel = hit;
  drag = { x: px, y: py, panel: hit, rect: rects[hit] };
  canvas.setPointerCapture(e.pointerId);
  refreshPanelSelect();
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const rect = canvas.getBoundingClientRect();
  const px = (e.clientX - rect.left) * (canvas.width / rect.width);
  const py = (e.clientY - rect.top) * (canvas.height / rect.height);
  const t = state.panels[drag.panel];
  if (!t) return;
  t.dx = (t.dx ?? 0) + (px - drag.x) / drag.rect.w;
  t.dy = (t.dy ?? 0) + (py - drag.y) / drag.rect.h;
  drag.x = px;
  drag.y = py;
  redraw();
});
canvas.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const t = state.panels[selectedPanel];
  if (!t) return;
  const factor = e.deltaY < 0 ? 1.08 : 1 / 1.08;
  t.scale = Math.min(3, Math.max(0.5, (t.scale ?? 1) * factor));
  zoomRange.value = String(t.scale);
  redraw();
}, { passive: false });

/** Renders the cover at the chosen export size and downloads it as a PNG. */
export function exportCoverPNG() {
  const [w, h] = SIZES[state.size] ?? SIZES.square;
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  drawCover(off, state);
  const name = `vice-cover-${w}x${h}.png`;
  off.toBlob((blob) => {
    if (!blob) {
      setStatus('Export failed — the canvas could not make a PNG.');
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    setStatus(`Saved ${name}`);
  }, 'image/png');
}

document.getElementById('export').addEventListener('click', exportCoverPNG);

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) {
  runShot(shot, params, async (scene) => {
    state.layout = scene.layout;
    state.grade = scene.grade;
    state.size = scene.size;
    state.caption = scene.caption;
    state.subCaption = scene.sub;
    state.photos = [await loadImage(`samples/${scene.photo}.jpg`)];
    state.panels = defaultPanels(state.layout, 1);
    // One photo feeds every panel in a shot, so give each panel a different crop
    // of it — otherwise the panels read as clones of the same picture.
    const crops = [
      { scale: 1, dx: 0, dy: 0 },
      { scale: 1.4, dx: 0.16, dy: -0.06 },
      { scale: 1.4, dx: -0.16, dy: 0.08 },
      { scale: 1.25, dx: 0, dy: 0.12 },
    ];
    state.panels.forEach((panel, i) => {
      const crop = crops[i % crops.length];
      panel.scale = crop.scale;
      panel.dx = crop.dx;
      panel.dy = crop.dy;
    });
    markActive('layout', state.layout);
    markActive('grade', state.grade);
    const radio = document.querySelector(`input[name="exportSize"][value="${state.size}"]`);
    if (radio) radio.checked = true;
    captionInput.value = state.caption;
    subInput.value = state.subCaption;
    redraw();
  });
} else {
  Promise.all([loadImage('samples/boulevard.jpg'), loadImage('samples/pier.jpg')])
    .then((loaded) => {
      state.photos = loaded;
      state.panels = defaultPanels(state.layout, loaded.length);
      markActive('layout', state.layout);
      markActive('grade', state.grade);
      redraw();
    })
    .catch(() => {
      state.photos = [];
      redraw();
    });
}
