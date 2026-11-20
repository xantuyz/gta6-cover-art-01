// Colour grades for Vice Cover Studio. Each theme is one complete look for the
// cover: sky gradient, sun, grade overlays, frame, caption band and text.
// Nothing here references any real game or brand — these are original palettes.

/** All available grades, keyed by id. `sunset` is the default. */
export const THEMES = {
  sunset: {
    id: 'sunset',
    label: 'Sunset Vice City',
    // Sky painted behind the procedural art panels, top to bottom.
    sky: ['#ffb347', '#ff6b6b', '#c94b7c', '#4b1d5e'],
    sunTop: '#ffe27a',
    sunBottom: '#ff7a3d',
    // Grade washed over the photos: warm on top, magenta-purple at the foot.
    gradeTop: 'rgba(255, 150, 60, 0.08)',
    gradeBottom: 'rgba(140, 20, 100, 0.42)',
    vignette: 'rgba(20, 5, 35, 0.55)',
    frame: '#f7f0e3',
    band: '#2b103f',
    title: '#ffffff',
    titleStroke: '#22083a',
    sub: '#ffcf4d',
    accent: '#ffcf4d',
    silhouette: '#2b103f',
    halftone: 'rgba(255, 255, 255, 0.20)',
    window: '#ffd76a',
  },
  neon: {
    id: 'neon',
    label: 'Neon Night',
    sky: ['#0b1035', '#1c2a6b', '#7a2ea6', '#ff2e88'],
    sunTop: '#7df9ff',
    sunBottom: '#ff2e88',
    gradeTop: 'rgba(40, 220, 255, 0.10)',
    gradeBottom: 'rgba(160, 20, 140, 0.45)',
    vignette: 'rgba(5, 5, 30, 0.60)',
    frame: '#eafcff',
    band: '#0d1030',
    title: '#ffffff',
    titleStroke: '#12063a',
    sub: '#54f0ff',
    accent: '#54f0ff',
    silhouette: '#0d1030',
    halftone: 'rgba(120, 240, 255, 0.22)',
    window: '#54f0ff',
  },
  dusk: {
    id: 'dusk',
    label: 'Palm Dusk',
    sky: ['#f7c873', '#e08a4c', '#8a4a7d', '#33204f'],
    sunTop: '#fff3b0',
    sunBottom: '#f78d3d',
    gradeTop: 'rgba(255, 200, 110, 0.10)',
    gradeBottom: 'rgba(90, 30, 90, 0.42)',
    vignette: 'rgba(25, 10, 40, 0.55)',
    frame: '#fbf3df',
    band: '#33204f',
    title: '#fff8e6',
    titleStroke: '#2a1740',
    sub: '#f7c873',
    accent: '#f7c873',
    silhouette: '#33204f',
    halftone: 'rgba(255, 230, 170, 0.20)',
    window: '#ffe9a3',
  },
};

/** Returns the theme for `id`, falling back to the sunset grade. */
export function themeById(id) {
  return THEMES[id] || THEMES.sunset;
}

/** The grade ids in menu order. */
export function themeIds() {
  return Object.keys(THEMES);
}
