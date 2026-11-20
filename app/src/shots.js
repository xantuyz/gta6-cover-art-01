// Fixed scenes for screenshots: ?shot=cover shows the cover alone,
// ?shot=editor shows the editor with a sample photo loaded. The query picks
// the layout, theme, sample photo, caption and canvas size. window.__shotReady
// is set once the font is loaded and the cover has been painted twice.
export async function runShot(shot, query, load) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const photo = query.get('photo') ?? 'pier';
  const caption = query.get('caption') ?? 'Sunset Heist';
  const sub = query.get('sub') ?? '';
  const layout = query.get('layout') ?? 'grid';
  const theme = query.get('theme') ?? 'sunset';
  const photos = (query.get('photos') ?? photo).split(',');
  await load(photos, caption, sub, layout, theme);
  try { await document.fonts.ready; } catch { /* font fallback is fine */ }
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
