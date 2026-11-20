// Panel layouts and per-panel photo placement. A layout is a list of panel slots,
// each a rectangle in unit space (fractions of the cover width/height). Every slot
// carries its own photo transform: which loaded photo it shows, a zoom multiplier on
// top of cover-fit, a pan offset as a fraction of the panel size, and a rotation in
// quarter turns. Photos never leave the browser.
export const LAYOUTS = {
  'vice-grid': {
    name: 'Vice Grid',
    slots: [
      { x: 0, y: 0, w: 0.58, h: 1 },
      { x: 0.58, y: 0, w: 0.42, h: 0.5 },
      { x: 0.58, y: 0.5, w: 0.42, h: 0.5 },
    ],
  },
  'sunset-strip': {
    name: 'Sunset Strip',
    slots: [
      { x: 0, y: 0, w: 1, h: 0.62 },
      { x: 0, y: 0.62, w: 0.333, h: 0.38 },
      { x: 0.333, y: 0.62, w: 0.334, h: 0.38 },
      { x: 0.667, y: 0.62, w: 0.333, h: 0.38 },
    ],
  },
  'neon-trio': {
    name: 'Neon Trio',
    slots: [
      { x: 0, y: 0, w: 0.333, h: 1 },
      { x: 0.333, y: 0, w: 0.334, h: 1 },
      { x: 0.667, y: 0, w: 0.333, h: 1 },
    ],
  },
};

export const LAYOUT_ORDER = ['vice-grid', 'sunset-strip', 'neon-trio'];

/** Pixel rectangles for a layout on a cover of w x h, with a white gutter between panels. */
export function panelRects(layout, w, h, gutter) {
  const def = LAYOUTS[layout] ?? LAYOUTS['vice-grid'];
  return def.slots.map((s) => ({
    x: s.x * w + (s.x > 0 ? gutter / 2 : 0),
    y: s.y * h + (s.y > 0 ? gutter / 2 : 0),
    w: s.w * w - (s.x > 0 ? gutter / 2 : 0) - (s.x + s.w < 1 ? gutter / 2 : 0),
    h: s.h * h - (s.y > 0 ? gutter / 2 : 0) - (s.y + s.h < 1 ? gutter / 2 : 0),
  }));
}

/** A fresh, centred panel transform showing photo `photoIndex`. */
export function defaultTransform(photoIndex) {
  return { photo: photoIndex, scale: 1, dx: 0, dy: 0, rot: 0 };
}

/** Default panel transforms for a layout: photos cycle across the slots. */
export function defaultPanels(layout, photoCount) {
  const def = LAYOUTS[layout] ?? LAYOUTS['vice-grid'];
  const count = Math.max(photoCount, 1);
  return def.slots.map((_, i) => defaultTransform(i % count));
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load image: ${url}`));
    img.src = url;
  });
}

/**
 * Draws `img` inside `rect` with a cover fit, then the panel transform: zoomed around
 * the panel centre, panned by (dx, dy) and rotated by `rot` quarter-turns. The caller
 * clips to the panel first.
 */
export function drawPhotoInPanel(ctx, img, rect, t) {
  const base = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight);
  const scale = base * (t.scale || 1);
  const pw = img.naturalWidth * scale;
  const ph = img.naturalHeight * scale;
  const cx = rect.x + rect.w / 2 + (t.dx || 0) * rect.w;
  const cy = rect.y + rect.h / 2 + (t.dy || 0) * rect.h;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(((t.rot || 0) % 4) * Math.PI / 2);
  ctx.drawImage(img, -pw / 2, -ph / 2, pw, ph);
  ctx.restore();
}

/** Returns the index of the panel rect containing point (px, py), or -1. */
export function panelAt(rects, px, py) {
  for (let i = rects.length - 1; i >= 0; i -= 1) {
    const r = rects[i];
    if (px >= r.x && px < r.x + r.w && py >= r.y && py < r.y + r.h) return i;
  }
  return -1;
}
