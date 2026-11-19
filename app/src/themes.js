// Sunset / neon grade presets for Vice Cover Studio.
// Each theme is a small palette object: the sky gradient that washes over
// every photo panel, the colours of the procedural art (striped sun, palms,
// skyline), the caption strip and the thin frame around the cover.
export const THEMES = {
  sunset: {
    id: 'sunset',
    label: 'Sunset Vice City',
    skyTop: '#2a1052',
    skyMid: '#c62b7e',
    skyBottom: '#ff7a3d',
    sunCore: '#ffd23f',
    sunRim: '#ff5e62',
    silhouette: '#1c0b2e',
    gradeTop: 'rgba(255, 122, 61, 0.10)',
    gradeBottom: 'rgba(198, 43, 126, 0.42)',
    strip: '#14081f',
    stripText: '#ffffff',
    accent: '#ffd23f',
    frame: '#ffffff',
  },
  neon: {
    id: 'neon',
    label: 'Neon Night',
    skyTop: '#04122e',
    skyMid: '#7b2ff7',
    skyBottom: '#00e5ff',
    sunCore: '#ff2e88',
    sunRim: '#00e5ff',
    silhouette: '#050818',
    gradeTop: 'rgba(0, 229, 255, 0.08)',
    gradeBottom: 'rgba(123, 47, 247, 0.45)',
    strip: '#050818',
    stripText: '#e8fbff',
    accent: '#00e5ff',
    frame: '#e8fbff',
  },
  dusk: {
    id: 'dusk',
    label: 'Palm Dusk',
    skyTop: '#1b1035',
    skyMid: '#8e3b8f',
    skyBottom: '#f2a65a',
    sunCore: '#ffe9a3',
    sunRim: '#e2703a',
    silhouette: '#241233',
    gradeTop: 'rgba(242, 166, 90, 0.10)',
    gradeBottom: 'rgba(142, 59, 143, 0.45)',
    strip: '#1b1035',
    stripText: '#fff3d6',
    accent: '#f2a65a',
    frame: '#fff3d6',
  },
};

/** Returns the theme object for `id`, falling back to the Sunset theme. */
export function themeById(id) {
  return THEMES[id] ?? THEMES.sunset;
}

/** The ids of all themes, in the order the editor shows them. */
export function themeIds() {
  return Object.keys(THEMES);
}
