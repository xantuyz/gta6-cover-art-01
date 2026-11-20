// Fixed scenes for screenshots: ?shot=cover shows the cover alone (controls hidden),
// ?shot=editor shows the editor with a sample photo loaded. The query picks the size,
// layout, grade, sample photo and words; window.__shotReady is set once the cover is
// painted and the display font is loaded, so a screenshot never catches a half-drawn
// frame.
export async function runShot(shot, query, setup) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  await setup({
    size: query.get('size') ?? 'square',
    layout: query.get('layout') ?? 'vice-grid',
    grade: query.get('grade') ?? 'sunset',
    photo: query.get('photo') ?? 'pier',
    caption: query.get('caption') ?? 'Vice City Nights',
    sub: query.get('sub') ?? 'A story in every panel',
  });
  try {
    await document.fonts.load('900 100px Anton');
    await document.fonts.ready;
  } catch {
    // The Anton file is local; if it fails to load the canvas falls back to a
    // heavy sans-serif and the shot is still valid.
  }
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.__shotReady = true;
}
