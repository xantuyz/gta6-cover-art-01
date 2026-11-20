// Multi-panel layouts for the cover. A layout splits the photo area (the part of
// the cover outside the caption band) into rectangles. Each rectangle is either a
// photo panel or an original procedural-art panel (`art: 'sunset'`), so every
// cover mixes the user's photos with drawn art. Coordinates are fractions of the
// photo area, so the same layout works at any export size.

/**
 * A panel rectangle: x/y/w/h are fractions of the photo area, `art` names the
 * procedural scene drawn when the panel holds no photo.
 */
function rect(x, y, w, h, art) {
  return { x, y, w, h, art: art || null };
}

export const LAYOUTS = {
  'vice-grid': {
    id: 'vice-grid',
    label: 'Vice Grid',
    blurb: 'Big hero photo left, two panels right',
    rects() {
      return [
        rect(0, 0, 0.58, 1, null),
        rect(0.58, 0, 0.42, 0.52, null),
        rect(0.58, 0.52, 0.42, 0.48, 'sunset'),
      ];
    },
  },
  'sunset-strip': {
    id: 'sunset-strip',
    label: 'Sunset Strip',
    blurb: 'Wide hero on top, three panels below',
    rects() {
      return [
        rect(0, 0, 1, 0.62, null),
        rect(0, 0.62, 0.34, 0.38, null),
        rect(0.34, 0.62, 0.33, 0.38, null),
        rect(0.67, 0.62, 0.33, 0.38, 'sunset'),
      ];
    },
  },
  'neon-trio': {
    id: 'neon-trio',
    label: 'Neon Trio',
    blurb: 'Three tall panels, art in the middle',
    rects() {
      return [
        rect(0, 0, 0.34, 1, null),
        rect(0.34, 0, 0.32, 1, 'sunset'),
        rect(0.66, 0, 0.34, 1, null),
      ];
    },
  },
};

/** Returns the layout for `id`, falling back to Vice Grid. */
export function layoutById(id) {
  return LAYOUTS[id] || LAYOUTS['vice-grid'];
}

/** The layout ids in menu order. */
export function layoutIds() {
  return Object.keys(LAYOUTS);
}

/**
 * Turns a layout's fractional rects into pixel rects inside `area`
 * ({x, y, w, h} in pixels). The returned rects keep the `art` marker.
 */
export function layoutRects(layoutId, area) {
  return layoutById(layoutId).rects().map((r) => ({
    x: area.x + r.x * area.w,
    y: area.y + r.y * area.h,
    w: r.w * area.w,
    h: r.h * area.h,
    art: r.art,
  }));
}

/**
 * Finds which pixel rect contains point (px, py), or -1 when the point is
 * outside every panel. Used to select a panel by clicking the preview.
 */
export function panelAt(rects, px, py) {
  for (let i = 0; i < rects.length; i++) {
    const r = rects[i];
    if (px >= r.x && px < r.x + r.w && py >= r.y && py < r.y + r.h) return i;
  }
  return -1;
}
