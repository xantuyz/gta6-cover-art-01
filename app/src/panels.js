// Multi-panel layouts for Vice Cover Studio. A layout is a list of panel
// rectangles in relative coordinates (x, y, w, h as fractions of the cover),
// plus a label the editor shows. The hero panel is listed first so a single
// photo fills the biggest panel by default; the other panels take the next
// photos, or fall back to procedural art when empty.

export const LAYOUTS = {
  grid: {
    id: 'grid',
    label: 'Vice Grid',
    panels: [
      { x: 0, y: 0, w: 0.58, h: 1 },
      { x: 0.58, y: 0, w: 0.42, h: 0.5 },
      { x: 0.58, y: 0.5, w: 0.42, h: 0.5 },
    ],
  },
  strip: {
    id: 'strip',
    label: 'Sunset Strip',
    panels: [
      { x: 0, y: 0, w: 1, h: 0.62 },
      { x: 0, y: 0.62, w: 0.34, h: 0.38 },
      { x: 0.34, y: 0.62, w: 0.33, h: 0.38 },
      { x: 0.67, y: 0.62, w: 0.33, h: 0.38 },
    ],
  },
  trio: {
    id: 'trio',
    label: 'Neon Trio',
    panels: [
      { x: 0, y: 0, w: 0.34, h: 1 },
      { x: 0.34, y: 0, w: 0.33, h: 1 },
      { x: 0.67, y: 0, w: 0.33, h: 1 },
    ],
  },
};

/** Returns the layout object for `id`, falling back to Vice Grid. */
export function getLayout(id) {
  return LAYOUTS[id] || LAYOUTS.grid;
}

/** The ids of the layouts, in the order the editor shows them. */
export const LAYOUT_IDS = Object.keys(LAYOUTS);

/**
 * Builds one panel state per layout slot. `photos` is an array of images;
 * photo i fills panel i when present, otherwise the panel stays empty and
 * cover.js paints procedural art into it.
 */
export function makePanelStates(layout, photos) {
  return layout.panels.map((rect, i) => ({
    rect,
    img: photos[i] || null,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    rotation: 0,
  }));
}

/**
 * Cover-fits an image into a rectangle: returns the draw width/height so the
 * image covers the rectangle with no gaps, before the panel's own zoom and
 * pan offsets are applied.
 */
export function cropPanelToFit(img, rectW, rectH) {
  const scale = Math.max(rectW / img.naturalWidth, rectH / img.naturalHeight);
  return { w: img.naturalWidth * scale, h: img.naturalHeight * scale };
}
