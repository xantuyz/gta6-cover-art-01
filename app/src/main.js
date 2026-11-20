// Wires the editor: photo upload (multi-file + drag-drop), layout and grade
// pickers, caption editing, per-panel drag / zoom / rotate, and PNG export at
// three post sizes. A `?shot=` query sets up a fixed scene for a screenshot.
import { drawCover, renderCoverPNG } from './cover.js';
import { LAYOUTS, LAYOUT_IDS, layoutSlots, defaultPanels, hitPanel } from './panels.js';
import { THEMES, THEME_IDS } from './themes.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const captionInput = document.getElementById('caption');
const subInput = document.getElementById('subcaption');
const status = document.getElementById('status');
const panelSelect = document.getElementById('panel');
const zoomInput = document.getElementById('zoom');
const zoomValue = document.getElementById('zoomValue');

export const EXPORT_SIZES = {
  '1080x1080': [1080, 1080],
  '1080x1350': [1080, 1350],
  '1920x1080': [1920, 1080],
};

let state = {
  layout: 'vice-grid',
  theme: 'sunset',
  photos: [],
  panels: defaultPanels('vice-grid', 0),
  caption: 'SUNSET HEIST',
  subcaption: 'A POSTER FROM YOUR PHOTOS',
  captionPos: 'bottom',
  captionColor: 'white',
  fillMode: 'per-panel',
};
let selectedPanel = 0;
let exportSize = '1080x1080';

/** Loads an image from a URL, resolving to the image once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function currentSize() {
  return EXPORT_SIZES[exportSize];
}

function redraw() {
  const [w, h] = currentSize();
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  drawCover(canvas, state);
}

/** Spreads the loaded photos over the panels (or one photo over all panels). */
function applyPhotosToPanels() {
  const count = state.photos.length;
  if (state.fillMode === 'one-photo' || count === 0) {
    state.panels = layoutSlots(state.layout).map((_, i) => ({
      photo: count > 0 ? 0 : -1, scale: 1, dx: 0, dy: 0, rot: 0,
    }));
    return;
  }
  state.panels = layoutSlots(state.layout).map((_, i) => ({
    photo: i % count, scale: 1, dx: 0, dy: 0, rot: 0,
  }));
}

function refreshPanelControls() {
  const slots = layoutSlots(state.layout);
  panelSelect.innerHTML = '';
  slots.forEach((_, i) => {
    const option = document.createElement('option');
    option.value = String(i);
    option.textContent = i === 0 ? `Panel ${i + 1} (hero)` : `Panel ${i + 1}`;
    panelSelect.appendChild(option);
  });
  panelSelect.value = String(Math.min(selectedPanel, slots.length - 1));
  selectedPanel = Number(panelSelect.value);
  const panel = state.panels[selectedPanel];
  if (panel) {
    zoomInput.value = String(panel.scale);
    zoomValue.textContent = `${panel.scale.toFixed(2)}x`;
  }
}

function setLayout(layoutId) {
  state.layout = LAYOUT_IDS.includes(layoutId) ? layoutId : 'vice-grid';
  applyPhotosToPanels();
  refreshPanelControls();
  document.querySelectorAll('.layout-btn').forEach((b) => {
    b.classList.toggle('active', b.dataset.layout === state.layout);
  });
  redraw();
}

function setTheme(themeId) {
  state.theme = THEME_IDS.includes(themeId) ? themeId : 'sunset';
  document.querySelectorAll('.theme-btn').forEach((b) => {
    b.classList.toggle('active', b.dataset.theme === state.theme);
  });
  redraw();
}

async function addPhotoFiles(files) {
  const images = [];
  for (const file of files) {
    if (!file.type.startsWith('image/')) continue;
    try {
      images.push(await loadImage(URL.createObjectURL(file)));
    } catch {
      // A file that is not a readable image is skipped, the rest still load.
    }
  }
  if (!images.length) return;
  state.photos.push(...images);
  applyPhotosToPanels();
  refreshPanelControls();
  redraw();
  status.textContent = `${state.photos.length} photo${state.photos.length > 1 ? 's' : ''} loaded.`;
}

/** Scale that fits the whole photo inside its panel (contain, vs cover-fit 1). */
function fitScaleForPanel(panelIndex) {
  const panel = state.panels[panelIndex];
  const img = panel && panel.photo >= 0 ? state.photos[panel.photo] : null;
  if (!img) return 1;
  const slot = layoutSlots(state.layout)[panelIndex];
  const rect = { w: slot.w * canvas.width, h: slot.h * canvas.height };
  const cover = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight);
  const contain = Math.min(rect.w / img.naturalWidth, rect.h / img.naturalHeight);
  return contain / cover;
}

function exportCover() {
  const [w, h] = currentSize();
  const out = renderCoverPNG(state, w, h);
  out.toBlob((blob) => {
    if (!blob) {
      status.textContent = 'Export failed — try again.';
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-cover-${w}x${h}.png`;
    a.click();
    status.textContent = `Saved vice-cover-${w}x${h}.png`;
    setTimeout(() => URL.revokeObjectURL(a.href), 60_000);
  }, 'image/png');
}

// ---- Controls -------------------------------------------------------------
document.getElementById('photo').addEventListener('change', (e) => {
  addPhotoFiles([...e.target.files]);
});
const dropZone = document.getElementById('dropZone');
dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag'));
dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('drag');
  addPhotoFiles([...e.dataTransfer.files]);
});
captionInput.addEventListener('input', () => { state.caption = captionInput.value; redraw(); });
subInput.addEventListener('input', () => { state.subcaption = subInput.value; redraw(); });
document.getElementById('captionPos').addEventListener('change', (e) => {
  state.captionPos = e.target.value;
  redraw();
});
document.getElementById('captionColor').addEventListener('change', (e) => {
  state.captionColor = e.target.value;
  redraw();
});
document.getElementById('fillMode').addEventListener('change', (e) => {
  state.fillMode = e.target.value;
  applyPhotosToPanels();
  refreshPanelControls();
  redraw();
});
document.querySelectorAll('.layout-btn').forEach((b) => {
  b.addEventListener('click', () => setLayout(b.dataset.layout));
});
document.querySelectorAll('.theme-btn').forEach((b) => {
  b.addEventListener('click', () => setTheme(b.dataset.theme));
});
document.querySelectorAll('input[name="size"]').forEach((r) => {
  r.addEventListener('change', () => { exportSize = r.value; redraw(); });
});
panelSelect.addEventListener('change', () => {
  selectedPanel = Number(panelSelect.value);
  refreshPanelControls();
});
zoomInput.addEventListener('input', () => {
  const panel = state.panels[selectedPanel];
  if (!panel) return;
  panel.scale = Number(zoomInput.value);
  zoomValue.textContent = `${panel.scale.toFixed(2)}x`;
  redraw();
});
document.getElementById('rotate').addEventListener('click', () => {
  const panel = state.panels[selectedPanel];
  if (!panel) return;
  panel.rot = (panel.rot + 1) % 4;
  redraw();
});
document.getElementById('fit').addEventListener('click', () => {
  const panel = state.panels[selectedPanel];
  if (!panel) return;
  panel.scale = fitScaleForPanel(selectedPanel);
  panel.dx = 0;
  panel.dy = 0;
  refreshPanelControls();
  redraw();
});
document.getElementById('fill').addEventListener('click', () => {
  const panel = state.panels[selectedPanel];
  if (!panel) return;
  panel.scale = 1;
  panel.dx = 0;
  panel.dy = 0;
  refreshPanelControls();
  redraw();
});
document.getElementById('export').addEventListener('click', exportCover);

// ---- Drag a panel's photo to reposition it --------------------------------
let drag = null;
function canvasPoint(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - r.left) * (canvas.width / r.width),
    y: (e.clientY - r.top) * (canvas.height / r.height),
  };
}
canvas.addEventListener('pointerdown', (e) => {
  const p = canvasPoint(e);
  const hit = hitPanel(state.layout, canvas.width, canvas.height, p.x, p.y);
  if (hit < 0) return;
  selectedPanel = hit;
  refreshPanelControls();
  drag = { x: p.x, y: p.y };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const p = canvasPoint(e);
  const panel = state.panels[selectedPanel];
  const slot = layoutSlots(state.layout)[selectedPanel];
  if (!panel || !slot) return;
  panel.dx += (p.x - drag.x) / (slot.w * canvas.width);
  panel.dy += (p.y - drag.y) / (slot.h * canvas.height);
  drag = { x: p.x, y: p.y };
  redraw();
});
canvas.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const panel = state.panels[selectedPanel];
  if (!panel) return;
  panel.scale = Math.min(3, Math.max(0.5, panel.scale * (e.deltaY < 0 ? 1.08 : 0.92)));
  refreshPanelControls();
  redraw();
}, { passive: false });

// ---- Start: sample photos, then a deterministic shot if requested ----------
const params = new URLSearchParams(location.search);
if (params.get('shot')) {
  runShot(params, async (scene) => {
    const first = await loadImage(`samples/${scene.photo}.jpg`);
    const second = await loadImage(`samples/${scene.photo2}.jpg`);
    state.photos = [first, second];
    state.layout = scene.layout;
    state.theme = scene.theme;
    state.caption = scene.caption;
    state.subcaption = scene.sub;
    state.captionPos = scene.pos;
    state.captionColor = scene.color;
    const [w, h] = scene.size.split('x').map(Number);
    exportSize = `${w}x${h}` in EXPORT_SIZES ? `${w}x${h}` : '1920x1080';
    if (scene.mode === 'cover') {
      canvas.width = w;
      canvas.height = h;
    }
    applyPhotosToPanels();
    if (scene.art >= 0 && state.panels[scene.art]) state.panels[scene.art].photo = -1;
    refreshPanelControls();
    document.querySelectorAll('.layout-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.layout === state.layout);
    });
    document.querySelectorAll('.theme-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.theme === state.theme);
    });
    captionInput.value = state.caption;
    subInput.value = state.subcaption;
    drawCover(canvas, state);
  });
} else {
  (async () => {
    try {
      const [a, b] = await Promise.all([
        loadImage('samples/boulevard.jpg'),
        loadImage('samples/pier.jpg'),
      ]);
      state.photos = [a, b];
    } catch {
      state.photos = [];
    }
    applyPhotosToPanels();
    refreshPanelControls();
    try {
      await document.fonts.load('100px Anton');
    } catch {
      // Fallback sans-serif still draws the caption.
    }
    redraw();
  })();
}
