// Draws the multi-panel poster cover: photos in framed panels, original
// procedural art where a panel has no photo, a sunset grade over everything,
// and the big caption in bold poster lettering.
import { layoutSlots, drawPhotoInPanel } from './panels.js';
import { THEMES, applySunsetGrade } from './themes.js';

const CAPTION_COLORS = {
  white: null, // falls back to the theme's caption colour
  yellow: '#ffd166',
  pink: '#ff5e9e',
};

/** Shrinks `size` until `text` fits `maxWidth` at `family`. Returns the size. */
export function fitCaptionFont(ctx, text, maxWidth, startSize, family) {
  let size = startSize;
  ctx.font = `bold ${size}px ${family}`;
  while (ctx.measureText(text).width > maxWidth && size > 12) {
    size -= 2;
    ctx.font = `bold ${size}px ${family}`;
  }
  return size;
}

/** An outrun-style sun: a disc cut by horizontal slats that widen downwards. */
export function drawStripedSun(ctx, x, y, r, theme) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.clip();
  const grad = ctx.createLinearGradient(0, y - r, 0, y + r);
  grad.addColorStop(0, theme.sun);
  grad.addColorStop(1, theme.sunStripe);
  ctx.fillStyle = grad;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  // Slats: sky-coloured bars, thicker toward the bottom of the disc.
  ctx.fillStyle = theme.skyBot;
  let yy = y + r * 0.05;
  let gap = r * 0.06;
  while (yy < y + r) {
    ctx.fillRect(x - r, yy, r * 2, gap);
    yy += gap + r * 0.16;
    gap *= 1.45;
  }
  ctx.restore();
}

/** A palm silhouette: a curved trunk with drooping fronds. */
export function drawPalmSilhouette(ctx, x, y, s, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = 'round';
  // Trunk, leaning slightly.
  ctx.lineWidth = s * 0.09;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + s * 0.12, y - s * 0.55, x + s * 0.3, y - s * 0.95);
  ctx.stroke();
  // Fronds fanning from the crown.
  const crownX = x + s * 0.3;
  const crownY = y - s * 0.95;
  ctx.lineWidth = s * 0.05;
  for (let i = 0; i < 7; i += 1) {
    const a = Math.PI * (0.08 + i * 0.14);
    const len = s * (0.42 - Math.abs(i - 3) * 0.04);
    const ex = crownX + Math.cos(a) * len;
    const ey = crownY - Math.sin(a) * len * 0.55 + len * 0.28;
    ctx.beginPath();
    ctx.moveTo(crownX, crownY);
    ctx.quadraticCurveTo(
      crownX + Math.cos(a) * len * 0.6, crownY - Math.sin(a) * len * 0.75,
      ex, ey,
    );
    ctx.stroke();
  }
  ctx.restore();
}

/** A low city skyline with a few lit windows, along the bottom of `rect`. */
export function drawViceSkyline(ctx, rect, theme) {
  const base = rect.y + rect.h;
  let x = rect.x;
  let seed = 7;
  const next = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  ctx.fillStyle = theme.skyline;
  while (x < rect.x + rect.w) {
    const bw = rect.w * (0.06 + next() * 0.09);
    const bh = rect.h * (0.18 + next() * 0.3);
    ctx.fillRect(x, base - bh, bw, bh);
    // Antenna on the tallest towers.
    if (bh > rect.h * 0.36) {
      ctx.fillRect(x + bw / 2 - 1, base - bh - rect.h * 0.08, 2, rect.h * 0.08);
    }
    // Lit windows.
    ctx.fillStyle = theme.accent;
    for (let wy = base - bh + 6; wy < base - 6; wy += 12) {
      for (let wx = x + 4; wx < x + bw - 4; wx += 10) {
        if (next() > 0.72) ctx.fillRect(wx, wy, 3, 4);
      }
    }
    ctx.fillStyle = theme.skyline;
    x += bw + 2;
  }
}

/** A perspective grid floor fading toward a vanishing point. */
export function drawPerspectiveGrid(ctx, rect, theme) {
  const horizon = rect.y + rect.h * 0.42;
  const cx = rect.x + rect.w / 2;
  ctx.save();
  ctx.strokeStyle = theme.grid;
  ctx.lineWidth = Math.max(1, rect.w * 0.002);
  for (let i = 0; i <= 8; i += 1) {
    const t = i / 8;
    const y = horizon + (rect.y + rect.h - horizon) * t * t;
    ctx.globalAlpha = 0.25 + t * 0.6;
    ctx.beginPath();
    ctx.moveTo(rect.x, y);
    ctx.lineTo(rect.x + rect.w, y);
    ctx.stroke();
  }
  for (let i = -6; i <= 6; i += 1) {
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.moveTo(cx + i * rect.w * 0.06, horizon);
    ctx.lineTo(cx + i * rect.w * 0.35, rect.y + rect.h);
    ctx.stroke();
  }
  ctx.restore();
}

/** A few birds as small chevrons in the sky. */
export function drawBirdFlock(ctx, x, y, s, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1.5, s * 0.06);
  ctx.lineCap = 'round';
  const spots = [[0, 0, 1], [1.6, 0.5, 0.8], [3.1, -0.3, 0.65], [-1.4, 0.7, 0.7]];
  for (const [ox, oy, k] of spots) {
    const bx = x + ox * s;
    const by = y + oy * s;
    ctx.beginPath();
    ctx.moveTo(bx - s * 0.22 * k, by);
    ctx.quadraticCurveTo(bx, by - s * 0.16 * k, bx, by);
    ctx.quadraticCurveTo(bx, by - s * 0.16 * k, bx + s * 0.22 * k, by);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Original procedural art for a panel with no photo. `variant` picks the scene:
 * 0 = striped sun over skyline and palms, 1 = skyline over a perspective grid,
 * 2 = big sun with palms and birds.
 */
export function drawProceduralPanel(ctx, rect, theme, variant) {
  ctx.save();
  const sky = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
  sky.addColorStop(0, theme.skyTop);
  sky.addColorStop(0.55, theme.skyMid);
  sky.addColorStop(1, theme.skyBot);
  ctx.fillStyle = sky;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  if (variant === 0) {
    drawStripedSun(ctx, rect.x + rect.w * 0.5, rect.y + rect.h * 0.42, rect.w * 0.26, theme);
    drawViceSkyline(ctx, rect, theme);
    drawPalmSilhouette(ctx, rect.x + rect.w * 0.12, rect.y + rect.h * 0.98, rect.h * 0.34, theme.palm);
    drawPalmSilhouette(ctx, rect.x + rect.w * 0.82, rect.y + rect.h * 0.98, rect.h * 0.26, theme.palm);
  } else if (variant === 1) {
    drawStripedSun(ctx, rect.x + rect.w * 0.72, rect.y + rect.h * 0.3, rect.w * 0.2, theme);
    drawPerspectiveGrid(ctx, rect, theme);
    drawViceSkyline(ctx, { x: rect.x, y: rect.y + rect.h * 0.3, w: rect.w, h: rect.h * 0.7 }, theme);
    drawBirdFlock(ctx, rect.x + rect.w * 0.2, rect.y + rect.h * 0.2, rect.w * 0.05, theme.palm);
  } else {
    drawStripedSun(ctx, rect.x + rect.w * 0.5, rect.y + rect.h * 0.36, rect.w * 0.3, theme);
    drawBirdFlock(ctx, rect.x + rect.w * 0.18, rect.y + rect.h * 0.16, rect.w * 0.045, theme.palm);
    drawBirdFlock(ctx, rect.x + rect.w * 0.68, rect.y + rect.h * 0.1, rect.w * 0.04, theme.palm);
    drawViceSkyline(ctx, rect, theme);
    drawPalmSilhouette(ctx, rect.x + rect.w * 0.08, rect.y + rect.h * 0.98, rect.h * 0.4, theme.palm);
    drawPalmSilhouette(ctx, rect.x + rect.w * 0.88, rect.y + rect.h * 0.98, rect.h * 0.32, theme.palm);
  }
  ctx.restore();
}

/** The caption in bold poster lettering with an outline and a drop shadow. */
export function drawPosterCaption(ctx, w, h, state, theme) {
  const text = (state.caption ?? '').trim().toUpperCase();
  const sub = (state.subcaption ?? '').trim().toUpperCase();
  const pos = state.captionPos ?? 'bottom';
  const family = "Anton, 'Arial Narrow', sans-serif";
  const color = CAPTION_COLORS[state.captionColor ?? 'white'] ?? theme.caption;
  let baseY;
  if (pos === 'top') baseY = h * 0.16;
  else if (pos === 'middle') baseY = h * 0.52;
  else baseY = h * 0.9;

  // A soft dark band behind the caption so it reads over any photo.
  if (text) {
    const band = ctx.createLinearGradient(0, baseY - h * 0.14, 0, baseY + h * 0.05);
    band.addColorStop(0, 'rgba(10, 4, 18, 0)');
    band.addColorStop(0.5, 'rgba(10, 4, 18, 0.42)');
    band.addColorStop(1, 'rgba(10, 4, 18, 0)');
    ctx.fillStyle = band;
    ctx.fillRect(0, baseY - h * 0.14, w, h * 0.19);
  }

  if (text) {
    const size = fitCaptionFont(ctx, text, w * 0.92, h * 0.11, family);
    ctx.font = `bold ${size}px ${family}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.lineJoin = 'round';
    ctx.shadowColor = theme.captionShadow;
    ctx.shadowBlur = size * 0.18;
    ctx.shadowOffsetY = size * 0.05;
    ctx.strokeStyle = 'rgba(10, 4, 18, 0.9)';
    ctx.lineWidth = Math.max(2, size * 0.09);
    ctx.strokeText(text, w / 2, baseY);
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillStyle = color;
    ctx.fillText(text, w / 2, baseY);
    // Accent underline.
    const tw = ctx.measureText(text).width;
    ctx.fillStyle = theme.accent;
    ctx.fillRect(w / 2 - tw * 0.28, baseY + size * 0.16, tw * 0.56, Math.max(3, size * 0.045));
  }

  if (sub) {
    const subSize = Math.max(12, h * 0.028);
    ctx.font = `bold ${subSize}px ${family}`;
    if ('letterSpacing' in ctx) ctx.letterSpacing = `${Math.max(2, subSize * 0.28)}px`;
    ctx.textAlign = 'center';
    ctx.fillStyle = theme.subcaption;
    ctx.shadowColor = theme.captionShadow;
    ctx.shadowBlur = subSize * 0.3;
    ctx.fillText(sub, w / 2, baseY + subSize * 2.1);
    ctx.shadowBlur = 0;
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  }
}

/**
 * Draws the whole cover onto `canvas` (at the canvas's own size) from `state`:
 * { layout, theme, photos, panels, caption, subcaption, captionPos, captionColor }.
 */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const theme = THEMES[state.theme] ?? THEMES.sunset;
  const slots = layoutSlots(state.layout);
  const gutter = Math.max(3, Math.round(w * 0.012));

  ctx.fillStyle = theme.background;
  ctx.fillRect(0, 0, w, h);

  slots.forEach((slot, i) => {
    const rect = {
      x: slot.x * w + gutter / 2,
      y: slot.y * h + gutter / 2,
      w: slot.w * w - gutter,
      h: slot.h * h - gutter,
    };
    if (rect.w <= 0 || rect.h <= 0) return;
    const panel = (state.panels ?? [])[i] ?? { photo: -1, scale: 1, dx: 0, dy: 0, rot: 0 };
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    const photo = panel.photo >= 0 ? (state.photos ?? [])[panel.photo] : null;
    if (photo) drawPhotoInPanel(ctx, photo, rect, panel);
    else drawProceduralPanel(ctx, rect, theme, i % 3);
    ctx.restore();
    // White frame + a diagonal accent tick on the hero panel.
    ctx.strokeStyle = theme.frame;
    ctx.lineWidth = Math.max(2, w * 0.004);
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    if (i === 0) {
      ctx.fillStyle = theme.accent;
      ctx.beginPath();
      ctx.moveTo(rect.x, rect.y);
      ctx.lineTo(rect.x + rect.w * 0.1, rect.y);
      ctx.lineTo(rect.x, rect.y + rect.h * 0.1);
      ctx.closePath();
      ctx.fill();
    }
  });

  applySunsetGrade(ctx, w, h, theme);
  drawPosterCaption(ctx, w, h, state, theme);
}

/** Renders the cover offscreen at `width` x `height` and returns the canvas. */
export function renderCoverPNG(state, width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  drawCover(canvas, state);
  return canvas;
}
