// Deterministic screenshot scenes: `?shot=cover` shows the cover alone at an
// export size, `?shot=editor` shows the editor with samples loaded. The query
// picks layout, grade, sample photos and captions. `window.__shotReady` is set
// once the fonts are loaded and the scene has painted, so screenshots are
// reproducible frame for frame.

/**
 * Reads the shot query into a plain scene description. Defaults match the
 * cover screenshot: Vice Grid, sunset grade, pier hero + boulevard panel.
 */
export function parseShotQuery(query) {
  const size = (query.get('size') || '1920x1080').split('x');
  return {
    shot: query.get('shot') || 'cover',
    width: Number(size[0]) || 1920,
    height: Number(size[1]) || 1080,
    layout: query.get('layout') || 'vice-grid',
    theme: query.get('theme') || 'sunset',
    photo: query.get('photo') || 'pier',
    photo2: query.get('photo2') || 'boulevard',
    caption: query.get('caption') || 'Sunset Heist',
    sub: query.get('sub') || 'Vice City Nights',
    position: query.get('position') || 'bottom',
    color: query.get('color') || 'white',
  };
}

/**
 * Waits for the Anton display font, then two animation frames, then marks
 * the scene ready for the screenshot runner.
 */
export async function markShotReady() {
  try {
    await document.fonts.load('100px Anton');
    await document.fonts.ready;
  } catch {
    // Fallback sans-serif still draws a correct cover.
  }
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.__shotReady = true;
}
