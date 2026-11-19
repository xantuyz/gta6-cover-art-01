// Multi-panel layout presets for Vice Cover Studio.
// A layout is a list of panels. Every panel is a rectangle in fractions of
// the cover (x, y, w, h from 0 to 1) plus a kind: 'photo' shows a user photo,
// 'art' is drawn procedurally (striped sun, palms, skyline) by cover.js.
// The caption strip is drawn by cover.js below the panels, it is not a panel.
export const LAYOUTS = {
  vice: {
    id: 'vice',
    label: 'Vice Grid',
    panels: [
      { x: 0, y: 0, w: 0.58, h: 1, kind: 'photo' },
      { x: 0.6, y: 0, w: 0.4, h: 0.48, kind: 'photo' },
      { x: 0.6, y: 0.5, w: 0.4, h: 0.5, kind: 'art' },
    ],
  },
  strip: {
    id: 'strip',
    label: 'Sunset Strip',
    panels: [
      { x: 0, y: 0, w: 1, h: 0.62, kind: 'photo' },
      { x: 0, y: 0.64, w: 0.32, h: 0.36, kind: 'photo' },
      { x: 0.34, y: 0.64, w: 0.32, h: 0.36, kind: 'art' },
      { x: 0.68, y: 0.64, w: 0.32, h: 0.36, kind: 'photo' },
    ],
  },
  trio: {
    id: 'trio',
    label: 'Neon Trio',
    panels: [
      { x: 0, y: 0, w: 0.32, h: 1, kind: 'photo' },
      { x: 0.34, y: 0, w: 0.32, h: 1, kind: 'art' },
      { x: 0.68, y: 0, w: 0.32, h: 1, kind: 'photo' },
    ],
  },
};

/** Returns the layout object for `id`, falling back to Vice Grid. */
export function layoutById(id) {
  return LAYOUTS[id] ?? LAYOUTS.vice;
}

/** The ids of all layouts, in the order the editor shows them. */
export function layoutIds() {
  return Object.keys(LAYOUTS);
}

/**
 * Turns a layout's fractional panels into pixel rectangles for a cover of
 * size `width` x `height`, leaving a caption strip of `stripH` pixels at the
 * bottom and a thin outer margin around everything.
 */
export function panelRects(layout, width, height, stripH, margin) {
  const bodyH = height - stripH - margin * 2;
  return layout.panels.map((p) => ({
    x: margin + p.x * (width - margin * 2),
    y: margin + p.y * bodyH,
    w: p.w * (width - margin * 2),
    h: p.h * bodyH,
    kind: p.kind,
  }));
}
