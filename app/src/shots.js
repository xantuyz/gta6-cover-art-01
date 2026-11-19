// Fixed scenes for screenshots: ?shot=cover shows the cover alone, filling
// the viewport; ?shot=editor shows the editor with sample photos loaded.
// Query params: photo (boulevard|pier), caption, subtitle, layout, theme,
// fill (all|per-panel). window.__shotReady is set once painted, twice, so
// Playwright can wait for a settled frame.
import { loadImage } from './images.js';

export async function runShot(shot, query, apply) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const first = query.get('photo') ?? 'pier';
  const second = first === 'pier' ? 'boulevard' : 'pier';
  const one = await loadImage(`samples/${first}.jpg`);
  const two = await loadImage(`samples/${second}.jpg`);
  apply({
    photos: [one, two],
    title: query.get('caption') ?? 'Sunset Heist',
    subtitle: query.get('subtitle') ?? 'Vice City Nights',
    layout: query.get('layout') ?? 'vice',
    theme: query.get('theme') ?? 'sunset',
    fillMode: query.get('fill') ?? 'all',
  });
  await document.fonts.ready;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
  }));
}
