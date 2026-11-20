// Panel layouts and per-panel photo placement. A layout is a list of slots in
// normalised coordinates (0..1 of the cover); the cover renderer scales them to
// the canvas. A panel transform is { photo, scale, dx, dy, rot }: which loaded
// photo it shows, a zoom multiplier on top of cover-fit, a pan offset as a
// fraction of the panel size, and a rotation in quarter turns.
export const LAYOUTS = {
  'vice-grid': {
    label: 'Vice Grid',
    slots: [
      { x: 0, y: 0, w: 0.56, h: 1 },
      { x: 0.58, y: 0, w: 0.42, h: 0.49 },
      { x: 0.58, y: 0.51, w: 0.42, h: 0.49 },
    ],
  },
  'sunset-strip': {
    label: 'Sunset Strip',
    slots: [
      { x: 0, y: 0, w: 1, h: 0.62 },
      { x: 0, y: 0.64, w: 0.32, h: 0.36 },
      { x: 0.34, y: 0.64, w: 0.32, h: 0.36 },
      { x: 0.68, y: 0.64, w: 0.32, h: 0.36 },
    ],
  },
  'neon-trio': {
    label: 'Neon Trio',
    slots: [
      { x: 0, y: 0, w: 0.32, h: 1 },
      { x: 0.34, y: 0, w: 0.32, h: 1 },
      { x: 0.68, y: 0, w: 0.32, h: 1 },
    ],
  },
};

export const LAYOUT_IDS = Object.keys(LAYOUTS);

/** Slots for a layout id, falling back to Vice Grid for unknown ids. */
export function layoutSlots(layoutId) {
  return (LAYOUTS[layoutId] ?? LAYOUTS['vice-grid']).slots;
}

/** A fresh, centred panel transform showing photo `photoIndex`. */
export function defaultTransform(photoIndex) {
  return { photo: photoIndex, scale: 1, dx: 0, dy: 0, rot: 0 };
}

/** One transform per slot, spreading the loaded photos across the panels. */
export function defaultPanels(layoutId, photoCount) {
  const slots = layoutSlots(layoutId);
  return slots.map((_, i) => defaultTransform(photoCount > 0 ? i % photoCount : -1));
}

/** Cover-fit rectangle for `img` inside `rect` (the photo always fills the panel). */
export function cropPanelToFit(img, rect) {
  const scale = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight);
  const pw = img.naturalWidth * scale;
  const ph = img.naturalHeight * scale;
  return { x: rect.x + (rect.w - pw) / 2, y: rect.y + (rect.h - ph) / 2, w: pw, h: ph };
}

/**
 * Draws `img` inside `rect` with a cover fit, then the panel transform: zoomed
 * around the panel centre, panned by (dx, dy) and rotated by `rot` quarter-turns.
 * The caller clips to the panel first.
 */
export function drawPhotoInPanel(ctx, img, rect, transform) {
  const t = transform ?? defaultTransform(0);
  const base = cropPanelToFit(img, rect);
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((t.rot % 4) * Math.PI / 2);
  ctx.scale(t.scale, t.scale);
  ctx.translate(-cx, -cy);
  const px = base.x + t.dx * rect.w;
  const py = base.y + t.dy * rect.h;
  ctx.drawImage(img, px, py, base.w, base.h);
  ctx.restore();
}

/** Which slot contains point (x, y) in cover pixels, or -1. */
export function hitPanel(layoutId, coverW, coverH, x, y) {
  const slots = layoutSlots(layoutId);
  for (let i = 0; i < slots.length; i += 1) {
    const s = slots[i];
    const r = { x: s.x * coverW, y: s.y * coverH, w: s.w * coverW, h: s.h * coverH };
    if (x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h) return i;
  }
  return -1;
}
