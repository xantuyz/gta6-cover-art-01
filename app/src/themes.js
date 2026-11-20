// Colour grades for the cover: three sunset / neon looks, all drawn with plain
// canvas gradients. No image assets, no network — every grade is procedural.
export const THEMES = {
  sunset: {
    label: 'Sunset Vice City',
    // Deep plum background behind the panels.
    background: '#241430',
    // Sky used by the procedural art panels (top -> bottom).
    skyTop: '#ff9e3d',
    skyMid: '#ff5e7a',
    skyBot: '#5b2a6e',
    // Warm wash laid over the whole cover after the photos.
    gradeTop: 'rgba(255, 140, 66, 0.00)',
    gradeMid: 'rgba(255, 94, 122, 0.18)',
    gradeBot: 'rgba(90, 42, 110, 0.38)',
    sun: '#ffd166',
    sunStripe: '#ff5e7a',
    palm: '#1d0f2a',
    skyline: '#2a1840',
    grid: 'rgba(255, 209, 102, 0.55)',
    accent: '#ffd166',
    frame: '#ffffff',
    caption: '#ffffff',
    captionShadow: 'rgba(20, 8, 30, 0.85)',
    subcaption: '#ffd166',
  },
  neon: {
    label: 'Neon Night',
    background: '#0b1026',
    skyTop: '#00e5ff',
    skyMid: '#7b2fff',
    skyBot: '#ff2e88',
    gradeTop: 'rgba(0, 229, 255, 0.00)',
    gradeMid: 'rgba(123, 47, 255, 0.16)',
    gradeBot: 'rgba(255, 46, 136, 0.34)',
    sun: '#00e5ff',
    sunStripe: '#ff2e88',
    palm: '#05081a',
    skyline: '#120a33',
    grid: 'rgba(0, 229, 255, 0.6)',
    accent: '#00e5ff',
    frame: '#ffffff',
    caption: '#ffffff',
    captionShadow: 'rgba(5, 8, 26, 0.9)',
    subcaption: '#00e5ff',
  },
  dusk: {
    label: 'Palm Dusk',
    background: '#1c1030',
    skyTop: '#f7b733',
    skyMid: '#b06ab3',
    skyBot: '#3b1d5e',
    gradeTop: 'rgba(247, 183, 51, 0.00)',
    gradeMid: 'rgba(176, 106, 179, 0.18)',
    gradeBot: 'rgba(59, 29, 94, 0.40)',
    sun: '#ffe29a',
    sunStripe: '#b06ab3',
    palm: '#160b26',
    skyline: '#241640',
    grid: 'rgba(255, 226, 154, 0.5)',
    accent: '#f7b733',
    frame: '#ffffff',
    caption: '#fff8e7',
    captionShadow: 'rgba(22, 11, 38, 0.85)',
    subcaption: '#f7b733',
  },
};

export const THEME_IDS = Object.keys(THEMES);

/** Vertical sunset wash + vignette + halftone dots over the whole cover. */
export function applySunsetGrade(ctx, w, h, theme) {
  const wash = ctx.createLinearGradient(0, 0, 0, h);
  wash.addColorStop(0, theme.gradeTop);
  wash.addColorStop(0.55, theme.gradeMid);
  wash.addColorStop(1, theme.gradeBot);
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);

  // Vignette: darkened corners keep the eye on the middle of the poster.
  const vg = ctx.createRadialGradient(
    w / 2, h / 2, Math.min(w, h) * 0.42,
    w / 2, h / 2, Math.max(w, h) * 0.75,
  );
  vg.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vg.addColorStop(1, 'rgba(10, 4, 18, 0.42)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, w, h);

  drawHalftoneDots(ctx, w, h);
}

/** Small print-style halftone dots, denser toward the bottom edge. */
export function drawHalftoneDots(ctx, w, h) {
  const step = Math.max(14, Math.round(w / 90));
  ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
  for (let y = step / 2; y < h; y += step) {
    const depth = y / h; // 0 at the top, 1 at the bottom
    const r = step * 0.08 + depth * step * 0.16;
    for (let x = step / 2 + (Math.round(y / step) % 2) * step / 2; x < w; x += step) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
