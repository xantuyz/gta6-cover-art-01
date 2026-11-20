// The heart of Vice Cover Studio: draws a multi-panel poster cover onto a
// canvas. Photos fill the panels (cover-fit, draggable, zoomable, rotatable);
// empty panels get original procedural art — a striped setting sun, palm
// silhouettes, a skyline, halftone dots and birds — all drawn with Canvas 2D
// primitives, no images, no network. A grade overlay, white gutters, a
// diagonal accent and a bold Anton caption finish the poster look.

import { getTheme } from './themes.js';
import { cropPanelToFit } from './panels.js';

/** Draws a striped setting sun: a disc with horizontal sky-coloured slats. */
export function drawStripedSun(ctx, cx, cy, r, theme) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  const grad = ctx.createLinearGradient(0, cy - r, 0, cy + r);
  grad.addColorStop(0, theme.sunCore);
  grad.addColorStop(0.55, theme.sun);
  grad.addColorStop(1, theme.skyLow);
  ctx.fillStyle = grad;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  ctx.fillStyle = theme.skyTop;
  let y = cy + r * 0.08;
  let gap = r * 0.055;
  while (y < cy + r) {
    ctx.fillRect(cx - r, y, r * 2, gap);
    y += gap + r * 0.13;
    gap *= 1.45;
  }
  ctx.restore();
}

/** Draws one palm silhouette: a curved trunk with seven drooping fronds. */
export function drawPalmSilhouette(ctx, x, y, s, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(2, s * 0.045);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + s * 0.1, y - s * 0.55, x + s * 0.28, y - s * 0.85);
  ctx.stroke();
  const tx = x + s * 0.28;
  const ty = y - s * 0.85;
  for (let i = 0; i < 7; i++) {
    const a = (-Math.PI * 0.95) + (i * Math.PI * 0.32);
    const len = s * (0.42 - Math.abs(i - 3) * 0.03);
    const ex = tx + Math.cos(a) * len;
    const ey = ty + Math.sin(a) * len * 0.55 + s * 0.12;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.quadraticCurveTo(tx + Math.cos(a) * len * 0.5, ty + Math.sin(a) * len * 0.4, ex, ey);
    ctx.stroke();
  }
  ctx.restore();
}

/** Draws a blocky skyline silhouette along the bottom of a rectangle. */
export function drawSkyline(ctx, x, y, w, h, color) {
  ctx.save();
  ctx.fillStyle = color;
  const base = y + h;
  let cx = x;
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  while (cx < x + w) {
    const bw = w * (0.06 + rnd() * 0.07);
    const bh = h * (0.25 + rnd() * 0.5);
    ctx.fillRect(cx, base - bh, bw, bh);
    if (rnd() > 0.6) ctx.fillRect(cx + bw * 0.3, base - bh - h * 0.12, bw * 0.4, h * 0.12);
    cx += bw + w * 0.012;
  }
  ctx.restore();
}

/** Draws a field of halftone dots that grow denser towards the bottom. */
export function drawHalftoneDots(ctx, x, y, w, h, color) {
  ctx.save();
  ctx.fillStyle = color;
  const step = Math.max(10, w * 0.035);
  for (let row = 0; row * step < h; row++) {
    for (let col = 0; col * step < w; col++) {
      const r = (row / Math.max(1, h / step)) * step * 0.16;
      ctx.beginPath();
      ctx.arc(x + col * step + step / 2, y + row * step + step / 2, Math.max(0.6, r), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/** Draws a few tiny "v" birds in the sky. */
export function drawBirds(ctx, x, y, w, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1.5, w * 0.004);
  ctx.lineCap = 'round';
  const spots = [[0.2, 0.25], [0.45, 0.16], [0.68, 0.3], [0.85, 0.2]];
  for (const [fx, fy] of spots) {
    const bx = x + w * fx;
    const by = y + w * fy * 0.6;
    const s = w * 0.03;
    ctx.beginPath();
    ctx.moveTo(bx - s, by);
    ctx.quadraticCurveTo(bx - s * 0.4, by - s * 0.7, bx, by);
    ctx.quadraticCurveTo(bx + s * 0.4, by - s * 0.7, bx + s, by);
    ctx.stroke();
  }
  ctx.restore();
}

/** Paints the full procedural art scene into one panel rectangle. */
export function drawProceduralPanel(ctx, rect, theme) {
  const { x, y, w, h } = rect;
  const sky = ctx.createLinearGradient(0, y, 0, y + h);
  sky.addColorStop(0, theme.skyTop);
  sky.addColorStop(0.55, theme.skyMid);
  sky.addColorStop(1, theme.skyLow);
  ctx.fillStyle = sky;
  ctx.fillRect(x, y, w, h);
  drawStripedSun(ctx, x + w * 0.5, y + h * 0.46, Math.min(w, h) * 0.3, theme);
  drawBirds(ctx, x, y, w, 'rgba(20, 8, 46, 0.85)');
  drawSkyline(ctx, x, y + h * 0.62, w, h * 0.38, theme.skyline);
  drawPalmSilhouette(ctx, x + w * 0.12, y + h * 0.98, Math.min(w, h) * 0.55, theme.palm);
  drawPalmSilhouette(ctx, x + w * 0.88, y + h * 0.98, Math.min(w, h) * 0.42, theme.palm);
  drawHalftoneDots(ctx, x, y + h * 0.72, w, h * 0.28, theme.dot);
}

/** Draws one panel: its photo (cover-fit, zoom, pan, rotate) or art. */
export function drawPanel(ctx, panel, theme, gutter) {
  const { rect, img } = panel;
  const px = rect.x;
  const py = rect.y;
  const pw = rect.w;
  const ph = rect.h;
  ctx.save();
  ctx.beginPath();
  ctx.rect(px + gutter / 2, py + gutter / 2, pw - gutter, ph - gutter);
  ctx.clip();
  if (img) {
    const fit = cropPanelToFit(img, pw, ph);
    const dw = fit.w * panel.scale;
    const dh = fit.h * panel.scale;
    ctx.translate(px + pw / 2 + panel.offsetX, py + ph / 2 + panel.offsetY);
    ctx.rotate((panel.rotation * Math.PI) / 180);
    ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
  } else {
    drawProceduralPanel(ctx, { x: px, y: py, w: pw, h: ph }, theme);
  }
  ctx.restore();
  // Grade wash over the panel so every panel shares the poster's sunset.
  ctx.save();
  ctx.beginPath();
  ctx.rect(px + gutter / 2, py + gutter / 2, pw - gutter, ph - gutter);
  ctx.clip();
  const wash = ctx.createLinearGradient(0, py, 0, py + ph);
  wash.addColorStop(0, theme.tintTop);
  wash.addColorStop(1, theme.tint);
  ctx.fillStyle = wash;
  ctx.fillRect(px, py, pw, ph);
  ctx.restore();
}

/** Draws the caption band: bold Anton title with outline + shadow, auto-fit. */
export function drawCaptionBand(ctx, w, h, caption, subcaption, theme, position, color) {
  const text = (caption || '').trim().toUpperCase();
  const sub = (subcaption || '').trim();
  if (!text && !sub) return;
  const bandH = h * 0.17;
  let bandY = h - bandH;
  if (position === 'top') bandY = 0;
  if (position === 'middle') bandY = (h - bandH) / 2;
  const grad = ctx.createLinearGradient(0, bandY, 0, bandY + bandH);
  grad.addColorStop(0, 'rgba(10, 4, 26, 0)');
  grad.addColorStop(0.35, 'rgba(10, 4, 26, 0.72)');
  grad.addColorStop(1, 'rgba(10, 4, 26, 0.88)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, bandY, w, bandH);
  // Diagonal accent stripe above the band.
  ctx.fillStyle = theme.accent;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, bandY);
  ctx.lineTo(w * 0.16, bandY);
  ctx.lineTo(w * 0.12, bandY - h * 0.012);
  ctx.lineTo(0, bandY - h * 0.012);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  if (text) {
    let size = h * 0.085;
    ctx.font = `${size}px Anton, 'Arial Black', sans-serif`;
    while (ctx.measureText(text).width > w * 0.88 && size > 14) {
      size -= 2;
      ctx.font = `${size}px Anton, 'Arial Black', sans-serif`;
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(2, size * 0.14);
    ctx.strokeStyle = 'rgba(10, 4, 26, 0.95)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = size * 0.18;
    ctx.shadowOffsetY = size * 0.05;
    const ty = bandY + bandH * (sub ? 0.38 : 0.52);
    ctx.strokeText(text, w / 2, ty);
    ctx.fillStyle = color;
    ctx.fillText(text, w / 2, ty);
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  }
  if (sub) {
    const subSize = Math.max(12, h * 0.026);
    ctx.font = `700 ${subSize}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.fillText(sub.toUpperCase(), w / 2, bandY + bandH * 0.78);
  }
}

/** Applies a vignette over the whole cover. */
export function applySunsetGrade(ctx, w, h, theme) {
  const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.75);
  vg.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vg.addColorStop(1, 'rgba(12, 4, 30, 0.42)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, w, h);
}

/**
 * Draws the whole cover: panels, gutters, grade, caption. `state` carries
 * { panels, themeId, caption, subcaption, captionPosition, captionColor }.
 */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const theme = getTheme(state.themeId);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  const gutter = Math.max(3, Math.min(w, h) * 0.008);
  for (const panel of state.panels) {
    const rect = {
      x: panel.rect.x * w,
      y: panel.rect.y * h,
      w: panel.rect.w * w,
      h: panel.rect.h * h,
    };
    drawPanel(ctx, { ...panel, rect }, theme, gutter);
  }
  applySunsetGrade(ctx, w, h, theme);
  drawCaptionBand(ctx, w, h, state.caption, state.subcaption, theme, state.captionPosition || 'bottom', state.captionColor || '#ffffff');
}

/** Renders the cover offscreen at W x H and returns a PNG blob. */
export function exportCoverPNG(state, width, height) {
  const off = document.createElement('canvas');
  off.width = width;
  off.height = height;
  drawCover(off, state);
  return new Promise((resolve) => off.toBlob(resolve, 'image/png'));
}
