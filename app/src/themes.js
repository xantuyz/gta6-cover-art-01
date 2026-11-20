// Sunset / neon colour grades for Vice Cover Studio. Each theme is a small
// plain object: sky gradient stops, sun colour, overlay tint, caption accent
// and the halftone dot colour. Nothing here is loaded from the network; the
// grade is painted straight onto the canvas by cover.js.

export const THEMES = {
  sunset: {
    id: 'sunset',
    label: 'Sunset Vice City',
    skyTop: '#2b1055',
    skyMid: '#ff2d78',
    skyLow: '#ff7a18',
    sun: '#ffd23f',
    sunCore: '#fff3b0',
    tint: 'rgba(255, 45, 120, 0.22)',
    tintTop: 'rgba(43, 16, 85, 0.10)',
    accent: '#ffd23f',
    dot: 'rgba(255, 210, 63, 0.55)',
    palm: '#1c0b33',
    skyline: '#160a2e',
  },
  neon: {
    id: 'neon',
    label: 'Neon Night',
    skyTop: '#05001f',
    skyMid: '#7b00ff',
    skyLow: '#ff00a8',
    sun: '#00f0ff',
    sunCore: '#d6fbff',
    tint: 'rgba(0, 240, 255, 0.16)',
    tintTop: 'rgba(123, 0, 255, 0.18)',
    accent: '#00f0ff',
    dot: 'rgba(0, 240, 255, 0.55)',
    palm: '#04001a',
    skyline: '#0a0030',
  },
  dusk: {
    id: 'dusk',
    label: 'Palm Dusk',
    skyTop: '#1d1140',
    skyMid: '#8e2de2',
    skyLow: '#f7b733',
    sun: '#ff9a3d',
    sunCore: '#ffe9a8',
    tint: 'rgba(247, 183, 51, 0.18)',
    tintTop: 'rgba(29, 17, 64, 0.14)',
    accent: '#f7b733',
    dot: 'rgba(247, 183, 51, 0.5)',
    palm: '#14082e',
    skyline: '#1a0b38',
  },
};

/** Returns the theme object for `id`, falling back to the sunset grade. */
export function getTheme(id) {
  return THEMES[id] || THEMES.sunset;
}

/** The ids of the themes, in the order the editor shows them. */
export const THEME_IDS = Object.keys(THEMES);
