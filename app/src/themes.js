// Grade presets: each grade is a sunset palette the cover renderer blends over the
// panels, plus the ink used for caption outlines and the glow of the caption band.
// "Sunset Vice City" is the default; "Neon Night" is cyan/magenta; "Palm Dusk" is
// purple and gold.
export const THEMES = {
  sunset: {
    name: 'Sunset Vice City',
    top: '#ff9a3d',
    mid: '#ff5e7a',
    low: '#7b2f8b',
    deep: '#2b1838',
    accent: '#ffb347',
    ink: '#1a0b2e',
    glow: 'rgba(255, 94, 122, 0.55)',
    band: 'rgba(26, 11, 46, 0.72)',
  },
  neon: {
    name: 'Neon Night',
    top: '#00e5ff',
    mid: '#ff2fb3',
    low: '#6a1fb0',
    deep: '#0a0618',
    accent: '#00e5ff',
    ink: '#060212',
    glow: 'rgba(0, 229, 255, 0.50)',
    band: 'rgba(6, 2, 18, 0.72)',
  },
  'palm-dusk': {
    name: 'Palm Dusk',
    top: '#ffd166',
    mid: '#c65d7b',
    low: '#5b2a86',
    deep: '#1c1033',
    accent: '#ffd166',
    ink: '#160a24',
    glow: 'rgba(255, 209, 102, 0.45)',
    band: 'rgba(22, 10, 36, 0.72)',
  },
};

export const GRADE_ORDER = ['sunset', 'neon', 'palm-dusk'];

/** Returns the theme for a grade id, falling back to the default sunset grade. */
export function themeFor(grade) {
  return THEMES[grade] ?? THEMES.sunset;
}
