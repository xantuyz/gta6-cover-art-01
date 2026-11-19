// The cover renderer for Vice Cover Studio: multi-panel composition, sunset
// grade, original procedural art (striped sun, palm silhouettes, skyline) and
// bold poster lettering. Everything is drawn with Canvas 2D — no images
// other than the user's own photos.
//
// State shape (built by main.js):
//   { photos: [HTMLImageElement], assign: [photoIndex per panel, -1 = art],
//     layout, theme, title, subtitle, titlePos: 'bottom'|'middle'|'top',
//     titleColor: '#ffffff'|..., fillMode: 'all'|'per-panel',
//     panels: [{ zoom, dx, dy, rot }] }  (zoom/dx/dy/rot per panel index)
import { layoutById, panelRects } from './panels.js';
import { themeById } from './themes.js';

const CAPTION_FONT = 'Anton, "Arial Black", sans-serif';

/** Largest font size (px) that lets `text` fit inside `maxWidth`. */
export function fitCaptionFont(ctx, text, maxWidth, startSize) {
  let size = startSize;
  ctx.font = `${size}px ${CAPTION_FONT}`;
  while (size > 14 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `${size}px ${CAPTION_FONT}`;
  }
  return size;
}

/**
 * Draws `img` into rectangle (x, y, w, h) with cover-fit cropping, applying
 * a zoom factor, a pan offset (fractions of the rect) and a 90-degree-step
 * rotation. The photo is clipped to the rectangle.
 */
export function cropPanelToFit(ctx, img, x, y, w, h, zoom, dx, dy, rot) {
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const steps = ((Math.round(rot / 90) % 4) + 4) % 4;
  const swapped = steps % 2 === 1;
  const srcW = swapped ? ih : iw;
  const srcH = swapped ? iw : ih;
  const scale = Math.max(w / srcW, h / srcH) * (zoom || 1);
  const dw = srcW * scale;
  const dh = srcH * scale;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.translate(x + w / 2 + (dx || 0) * w, y + h / 2 + (dy || 0) * h);
  ctx.rotate((steps * Math.PI) / 2);
  ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
  ctx.restore();
}

/** A retro striped sun: a circle sliced by horizontal sky-coloured gaps. */
export function drawStripedSun(ctx, cx, cy, r, theme) {
  ctx.save();
  const grad = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
  grad.addColorStop(0, theme.sunCore);
  grad.addColorStop(1, theme.sunRim);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  // Cut widening horizontal slits through the lower half of the disc.
  ctx.globalCompositeOperation = 'destination-out';
  let gap = r * 0.045;
  for (let i = 0; i < 5; i += 1) {
    const yy = cy + r * (0.08 + i * 0.17);
    ctx.fillRect(cx - r, yy, r * 2, gap);
    gap *= 1.55;
  }
  ctx.restore();
}

/** A palm silhouette: curved trunk plus seven drooping fronds. */
export function drawPalmSilhouette(ctx, x, baseY, height, lean, theme) {
  ctx.save();
  ctx.strokeStyle = theme.silhouette;
  ctx.fillStyle = theme.silhouette;
  ctx.lineCap = 'round';
  const topX = x + lean * height;
  const topY = baseY - height;
  ctx.lineWidth = Math.max(2, height * 0.045);
  ctx.beginPath();
  ctx.moveTo(x, baseY);
  ctx.quadraticCurveTo(x + lean * height * 0.4, baseY - height * 0.55, topX, topY);
  ctx.stroke();
  // Fronds fan upward from the crown, then droop: each one is a quadratic
  // arc whose tip ends at or just below crown height.
  for (let i = 0; i < 7; i += 1) {
    const angle = Math.PI * (1.12 + i * 0.13);
    const len = height * (0.26 + (i % 3) * 0.04);
    const tipX = topX + Math.cos(angle) * len;
    const tipY = topY + Math.sin(angle) * len * 0.55 + len * 0.42;
    const midX = topX + Math.cos(angle) * len * 0.5;
    const midY = topY + Math.sin(angle) * len * 0.7 - len * 0.12;
    ctx.lineWidth = Math.max(1.5, height * 0.018);
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(midX, midY, tipX, tipY);
    ctx.stroke();
  }
  ctx.restore();
}

/** A jagged skyline silhouette with a few lit windows. */
export function drawSkylineSilhouette(ctx, x, baseY, w, h, theme) {
  ctx.save();
  ctx.fillStyle = theme.silhouette;
  let cx = x;
  let seed = 7;
  const next = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  ctx.beginPath();
  ctx.moveTo(x, baseY);
  while (cx < x + w) {
    const bw = w * (0.08 + next() * 0.1);
    const bh = h * (0.35 + next() * 0.65);
    ctx.lineTo(cx, baseY - bh);
    ctx.lineTo(cx + bw, baseY - bh);
    ctx.lineTo(cx + bw, baseY);
    cx += bw;
  }
  ctx.lineTo(x + w, baseY);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = theme.sunCore;
  for (let i = 0; i < 14; i += 1) {
    const wx = x + next() * w;
    const wy = baseY - h * (0.15 + next() * 0.6);
    ctx.globalAlpha = 0.75;
    ctx.fillRect(wx, wy, Math.max(2, w * 0.008), Math.max(2, w * 0.008));
  }
  ctx.restore();
}

/** A field of tiny halftone dots, used as a corner texture. */
export function drawHalftoneDots(ctx, x, y, w, h, color, spacing) {
  ctx.save();
  ctx.fillStyle = color;
  const step = spacing || 14;
  for (let yy = y; yy < y + h; yy += step) {
    for (let xx = x; xx < x + w; xx += step) {
      const fade = 1 - ((xx - x) / w) * 0.6 - ((yy - y) / h) * 0.6;
      if (fade <= 0) continue;
      ctx.globalAlpha = 0.28 * fade;
      ctx.beginPath();
      ctx.arc(xx, yy, step * 0.16, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/**
 * One fully procedural art panel: sunset sky, striped sun, skyline, two
 * palms and a halftone corner. No photo needed — this is the original art
 * that makes the cover read as a poster, not a photo grid.
 */
export function drawArtPanel(ctx, x, y, w, h, theme) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  const sky = ctx.createLinearGradient(0, y, 0, y + h);
  sky.addColorStop(0, theme.skyTop);
  sky.addColorStop(0.55, theme.skyMid);
  sky.addColorStop(1, theme.skyBottom);
  ctx.fillStyle = sky;
  ctx.fillRect(x, y, w, h);
  drawStripedSun(ctx, x + w * 0.5, y + h * 0.42, Math.min(w, h) * 0.3, theme);
  drawSkylineSilhouette(ctx, x, y + h * 0.92, w, h * 0.34, theme);
  ctx.fillStyle = theme.silhouette;
  ctx.fillRect(x, y + h * 0.92, w, h * 0.08);
  drawPalmSilhouette(ctx, x + w * 0.12, y + h, h * 0.55, 0.12, theme);
  drawPalmSilhouette(ctx, x + w * 0.9, y + h, h * 0.44, -0.1, theme);
  drawHalftoneDots(ctx, x + w * 0.62, y + h * 0.04, w * 0.36, h * 0.3, '#ffffff', Math.max(9, w * 0.045));
  ctx.restore();
}

/** Sunset / neon wash over the whole cover plus a soft vignette. */
export function applySunsetGrade(ctx, w, h, theme) {
  const wash = ctx.createLinearGradient(0, 0, 0, h);
  wash.addColorStop(0, theme.gradeTop);
  wash.addColorStop(1, theme.gradeBottom);
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);
  const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.75);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(10,4,20,0.38)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
}

/** Bold poster lettering: outlined capitals with a hard drop shadow. */
export function drawCaptionLettering(ctx, text, cx, cy, maxWidth, color, startSize) {
  const clean = (text || '').trim().toUpperCase();
  if (!clean) return 0;
  const size = fitCaptionFont(ctx, clean, maxWidth, startSize);
  ctx.save();
  ctx.font = `${size}px ${CAPTION_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = size * 0.06;
  ctx.shadowOffsetY = size * 0.06;
  ctx.strokeStyle = 'rgba(0,0,0,0.9)';
  ctx.lineWidth = Math.max(2, size * 0.09);
  ctx.strokeText(clean, cx, cy);
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = color;
  ctx.fillText(clean, cx, cy);
  ctx.restore();
  return size;
}

/**
 * Renders the full multi-panel cover into `canvas` from `state`.
 * Layout panels fill the body; the caption strip sits at the bottom (or top
 * / middle when titlePos asks for it); a thin frame and a diagonal accent
 * bar finish the poster look.
 */
export function renderMultiPanelCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const theme = themeById(state.theme);
  const layout = layoutById(state.layout);
  ctx.fillStyle = theme.strip;
  ctx.fillRect(0, 0, w, h);

  const margin = Math.round(Math.min(w, h) * 0.018);
  const stripH = Math.round(h * 0.16);
  const rects = panelRects(layout, w, h, stripH, margin);
  const photos = state.photos || [];

  rects.forEach((r, i) => {
    if (r.kind === 'art') {
      drawArtPanel(ctx, r.x, r.y, r.w, r.h, theme);
      return;
    }
    let photoIdx = -1;
    if (state.fillMode === 'all') photoIdx = photos.length ? 0 : -1;
    else photoIdx = (state.assign || [])[i] ?? (photos.length ? Math.min(i, photos.length - 1) : -1);
    const img = photoIdx >= 0 ? photos[photoIdx] : null;
    if (img) {
      const tune = (state.panels || [])[i] || {};
      cropPanelToFit(ctx, img, r.x, r.y, r.w, r.h, tune.zoom || 1, tune.dx || 0, tune.dy || 0, tune.rot || 0);
      // A light grade on photo panels only, so faces stay readable.
      const g = ctx.createLinearGradient(0, r.y, 0, r.y + r.h);
      g.addColorStop(0, 'rgba(255,122,61,0.05)');
      g.addColorStop(1, theme.gradeBottom);
      ctx.fillStyle = g;
      ctx.fillRect(r.x, r.y, r.w, r.h);
    } else {
      drawArtPanel(ctx, r.x, r.y, r.w, r.h, theme);
    }
  });

  // Thin white frame + diagonal accent bar across the panel seams.
  ctx.strokeStyle = theme.frame;
  ctx.lineWidth = Math.max(2, Math.min(w, h) * 0.006);
  ctx.strokeRect(margin / 2, margin / 2, w - margin, h - stripH - margin);
  ctx.fillStyle = theme.accent;
  ctx.save();
  ctx.beginPath();
  ctx.rect(margin / 2, margin / 2, w - margin, h - stripH - margin);
  ctx.clip();
  ctx.translate(w * 0.72, h - stripH - margin);
  ctx.rotate(-0.06);
  ctx.fillRect(0, -Math.max(3, h * 0.008), w * 0.28, Math.max(4, h * 0.012));
  ctx.restore();

  // Caption strip.
  const stripY = h - stripH;
  ctx.fillStyle = theme.strip;
  ctx.fillRect(0, stripY, w, stripH);
  const pos = state.titlePos || 'bottom';
  let cy = stripY + stripH * 0.42;
  if (pos === 'top') cy = margin + stripH * 0.4;
  if (pos === 'middle') cy = h * 0.46;
  if (pos === 'top') {
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(0, 0, w, stripH);
  }
  const titleSize = drawCaptionLettering(
    ctx, state.title || 'VICE CITY', w / 2, cy, w * 0.92,
    state.titleColor || theme.stripText, Math.round(stripH * 0.62),
  );
  if (state.subtitle && state.subtitle.trim()) {
    ctx.save();
    ctx.font = `600 ${Math.max(12, Math.round(titleSize * 0.28))}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = theme.accent;
    const subY = pos === 'middle' ? cy + titleSize * 0.75 : cy + titleSize * 0.72;
    ctx.fillText(state.subtitle.trim().toUpperCase(), w / 2, Math.min(subY, h - stripH * 0.18));
    ctx.restore();
  }
  applySunsetGrade(ctx, w, h, theme);
  return canvas;
}

/** Backwards-compatible entry point: draws the cover from `state`. */
export function drawCover(canvas, state) {
  return renderMultiPanelCover(canvas, state);
}

/**
 * Renders the cover offscreen at `width` x `height` and resolves with a
 * PNG Blob ready to download. Used by the export buttons.
 */
export function exportCoverPNG(state, width, height) {
  return new Promise((resolve) => {
    const off = document.createElement('canvas');
    off.width = width;
    off.height = height;
    renderMultiPanelCover(off, state);
    off.toBlob((blob) => resolve(blob), 'image/png');
  });
}
