// Fixed scenes for screenshots: ?shot=cover shows the cover alone, ?shot=editor
// shows the editor with a sample photo loaded. Query parameters pick the layout,
// grade, sample photos, caption and export size, so every screenshot is
// reproducible. window.__shotReady is set once painted and the font is loaded.
export function shotScene(query) {
  return {
    mode: query.get('shot') ?? 'editor',
    layout: query.get('layout') ?? 'vice-grid',
    theme: query.get('theme') ?? 'sunset',
    photo: query.get('photo') ?? 'pier',
    photo2: query.get('photo2') ?? 'boulevard',
    caption: query.get('caption') ?? 'Sunset Heist',
    sub: query.get('sub') ?? 'A poster from your photos',
    size: query.get('size') ?? '1920x1080',
    // Slot forced to procedural art (-1 = none). Lets a cover show the art panel.
    art: Number(query.get('art') ?? -1),
    pos: query.get('pos') ?? 'bottom',
    color: query.get('color') ?? 'white',
  };
}

/**
 * Sets up a deterministic scene: `setup(scene)` loads the photos, applies the
 * state and paints once. Afterwards waits for the display font, then marks the
 * shot ready for the screenshot.
 */
export async function runShot(query, setup) {
  const scene = shotScene(query);
  if (scene.mode === 'cover') document.body.classList.add('shot-cover');
  await setup(scene);
  try {
    await document.fonts.load('100px Anton');
    await document.fonts.ready;
  } catch {
    // The bold sans-serif fallback still draws a poster caption.
  }
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.__shotReady = true;
  return scene;
}
