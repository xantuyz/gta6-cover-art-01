// The heart of the art: composes the multi-panel poster cover on a canvas.
// Panels come from panels.js, grades from themes.js. Panels without a photo get
// original procedural art (striped sun, palm silhouettes, skyline, perspective
// grid). A grade gradient, vignette and halftone dots tie the panels together,
// then the caption is lettered in bold Anton capitals with a dark outline and
// drop shadow, poster style.
import { panelRects, drawPhotoInPanel } from './panels.js';
import { themeFor } from './themes.js';

/** Turns a #rrggbb hex colour into an rgba() string at the given opacity. */
export function hexWithAlpha(hex, alpha) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Procedural art kinds, one per panel slot when no photo is assigned. */
export const ART_KINDS = ['sun', 'palms', 'skyline', 'grid'];

/** Draws a striped sunset: a disc cut by horizontal slats, low on the panel. */
export function drawStripedSun(ctx, rect, theme) {
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h * 0.62;
  const r = Math.min(rect.w, rect.h) * 0.42;
  const grad = ctx.createLinearGradient(0, cy - r, 0, cy + r);
  grad.addColorStop(0, theme.top);
  grad.addColorStop(1, theme.mid);
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = grad;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  ctx.fillStyle = theme.deep;
  let y = cy + r * 0.05;
  let gap = r * 0.07;
  while (y < cy + r) {
    ctx.fillRect(cx - r, y, r * 2, gap);
    y += gap * 2.4;
    gap *= 1.35;
  }
  ctx.restore();
}

/** Draws two palm silhouettes leaning over the panel, in the grade's deep ink. */
export function drawPalms(ctx, rect, theme) {
  ctx.save();
  ctx.strokeStyle = theme.deep;
  ctx.fillStyle = theme.deep;
  ctx.lineCap = 'round';
  const palms = [
    { x: rect.x + rect.w * 0.22, top: rect.y + rect.h * 0.3, lean: -rect.w * 0.1, size: rect.w * 0.5 },
    { x: rect.x + rect.w * 0.82, top: rect.y + rect.h * 0.42, lean: rect.w * 0.08, size: rect.w * 0.42 },
  ];
  for (const p of palms) {
    ctx.lineWidth = Math.max(3, rect.w * 0.02);
    ctx.beginPath();
    ctx.moveTo(p.x, rect.y + rect.h);
    ctx.quadraticCurveTo(p.x + p.lean * 0.4, rect.y + rect.h * 0.65, p.x + p.lean, p.top);
    ctx.stroke();
    for (let i = 0; i < 6; i += 1) {
      const a = -Math.PI * (0.08 + i * 0.16);
      const len = p.size * (0.55 + (i % 2) * 0.25);
      ctx.lineWidth = Math.max(2, rect.w * 0.012);
      ctx.beginPath();
      ctx.moveTo(p.x + p.lean, p.top);
      ctx.quadraticCurveTo(
        p.x + p.lean + Math.cos(a) * len * 0.6, p.top + Math.sin(a) * len * 0.6 - p.size * 0.12,
        p.x + p.lean + Math.cos(a) * len, p.top + Math.sin(a) * len + p.size * 0.22,
      );
      ctx.stroke();
    }
  }
  ctx.restore();
}

/** Draws a city skyline with lit windows against the grade gradient. */
export function drawSkyline(ctx, rect, theme) {
  const grad = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
  grad.addColorStop(0, theme.top);
  grad.addColorStop(0.6, theme.mid);
  grad.addColorStop(1, theme.low);
  ctx.fillStyle = grad;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  const base = rect.y + rect.h;
  let x = rect.x;
  let i = 0;
  ctx.fillStyle = theme.deep;
  while (x < rect.x + rect.w) {
    const bw = rect.w * (0.08 + ((i * 37) % 10) / 90);
    const bh = rect.h * (0.25 + ((i * 53) % 10) / 22);
    ctx.fillRect(x, base - bh, bw, bh);
    ctx.fillStyle = theme.accent;
    for (let wy = base - bh + rect.h * 0.04; wy < base - rect.h * 0.03; wy += rect.h * 0.09) {
      for (let wx = x + bw * 0.2; wx < x + bw * 0.85; wx += bw * 0.32) {
        if (((i * 7 + Math.round(wy)) % 3) === 0) ctx.fillRect(wx, wy, Math.max(2, bw * 0.08), Math.max(2, rect.h * 0.03));
      }
    }
    ctx.fillStyle = theme.deep;
    x += bw + rect.w * 0.015;
    i += 1;
  }
}

/** Draws a perspective grid floor fading into the horizon. */
export function drawGrid(ctx, rect, theme) {
  const grad = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
  grad.addColorStop(0, theme.low);
  grad.addColorStop(1, theme.deep);
  ctx.fillStyle = grad;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  const horizon = rect.y + rect.h * 0.38;
  ctx.strokeStyle = theme.accent;
  ctx.globalAlpha = 0.8;
  ctx.lineWidth = Math.max(1, rect.w * 0.006);
  for (let i = -6; i <= 6; i += 1) {
    ctx.beginPath();
    ctx.moveTo(rect.x + rect.w / 2 + i * rect.w * 0.06, horizon);
    ctx.lineTo(rect.x + rect.w / 2 + i * rect.w * 0.28, rect.y + rect.h);
    ctx.stroke();
  }
  for (let i = 0; i < 7; i += 1) {
    const t = i / 6;
    const y = horizon + (rect.y + rect.h - horizon) * t * t;
    ctx.globalAlpha = 0.25 + 0.55 * t;
    ctx.beginPath();
    ctx.moveTo(rect.x, y);
    ctx.lineTo(rect.x + rect.w, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

/** Fills a panel with procedural art of the given kind. */
export function drawProceduralPanel(ctx, rect, kind, theme) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  if (kind === 'sun') {
    const grad = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
    grad.addColorStop(0, theme.mid);
    grad.addColorStop(1, theme.deep);
    ctx.fillStyle = grad;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    drawStripedSun(ctx, rect, theme);
  } else if (kind === 'palms') {
    const grad = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
    grad.addColorStop(0, theme.top);
    grad.addColorStop(1, theme.low);
    ctx.fillStyle = grad;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    drawPalms(ctx, rect, theme);
  } else if (kind === 'skyline') {
    drawSkyline(ctx, rect, theme);
  } else {
    drawGrid(ctx, rect, theme);
  }
  ctx.restore();
}

/** Scatters halftone dots across a band at the bottom of the cover. */
export function drawHalftone(ctx, w, h, theme) {
  const bandY = h * 0.78;
  const step = Math.max(10, w * 0.018);
  ctx.save();
  ctx.fillStyle = theme.accent;
  for (let y = bandY; y < h; y += step) {
    const t = (y - bandY) / (h - bandY);
    for (let x = (y / step) % 2 === 0 ? 0 : step / 2; x < w; x += step) {
      const r = Math.max(0.6, step * 0.2 * (1 - t * 0.5));
      ctx.globalAlpha = 0.22 + 0.38 * t;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/** Darkens the corners so the caption band and panels read as one poster. */
export function drawVignette(ctx, w, h) {
  const grad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0.38)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

/** Fits the caption to the width, shrinking the font until it fits or hits the floor. */
export function fitCaptionFont(ctx, text, maxWidth, startSize) {
  let size = startSize;
  ctx.font = `900 ${size}px Anton, 'Arial Black', sans-serif`;
  while (ctx.measureText(text).width > maxWidth && size > 14) {
    size -= 2;
    ctx.font = `900 ${size}px Anton, 'Arial Black', sans-serif`;
  }
  return size;
}

const CAPTION_COLORS = {
  white: '#ffffff',
  yellow: '#ffe45e',
  pink: '#ff7ad9',
};

/**
 * Draws the whole cover: panels (photo or procedural art), grade wash, vignette,
 * halftone dots, then the caption band with the big lettering and sub-caption.
 * `state` is { layout, grade, photos, panels, caption, subCaption, captionColor,
 * captionPos }. The canvas keeps its own pixel size; the drawing scales to it.
 */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const theme = themeFor(state.grade);
  const gutter = Math.max(4, Math.round(w * 0.008));
  ctx.fillStyle = theme.ink;
  ctx.fillRect(0, 0, w, h);

  const rects = panelRects(state.layout, w, h, gutter);
  rects.forEach((rect, i) => {
    const t = state.panels[i] ?? { photo: i % Math.max(state.photos.length, 1), scale: 1, dx: 0, dy: 0, rot: 0 };
    const img = state.photos[t.photo] ?? null;
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    if (img) {
      drawPhotoInPanel(ctx, img, rect, t);
    } else {
      drawProceduralPanel(ctx, rect, ART_KINDS[i % ART_KINDS.length], theme);
    }
    ctx.restore();
  });

  // Grade wash: the grade's own colours sweep the cover, deepening toward the
  // caption band so the sunset/neon identity reads even over bright photos.
  const wash = ctx.createLinearGradient(0, 0, 0, h);
  wash.addColorStop(0, hexWithAlpha(theme.top, 0.22));
  wash.addColorStop(0.5, hexWithAlpha(theme.mid, 0.20));
  wash.addColorStop(1, hexWithAlpha(theme.low, 0.42));
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);
  drawHalftone(ctx, w, h, theme);
  drawVignette(ctx, w, h);

  // Caption band.
  const text = (state.caption ?? '').trim().toUpperCase();
  const sub = (state.subCaption ?? '').trim().toUpperCase();
  if (!text && !sub) return;
  const bandH = h * 0.2;
  const pos = state.captionPos ?? 'bottom';
  const bandY = pos === 'top' ? 0 : pos === 'middle' ? (h - bandH) / 2 : h - bandH;
  ctx.fillStyle = theme.band;
  ctx.fillRect(0, bandY, w, bandH);
  ctx.fillStyle = theme.accent;
  ctx.fillRect(0, bandY, w, Math.max(2, h * 0.004));
  ctx.fillRect(0, bandY + bandH - Math.max(2, h * 0.004), w, Math.max(2, h * 0.004));

  if (text) {
    const size = fitCaptionFont(ctx, text, w * 0.88, h * 0.085);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(2, size * 0.12);
    ctx.strokeStyle = theme.ink;
    ctx.fillStyle = CAPTION_COLORS[state.captionColor] ?? CAPTION_COLORS.white;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = size * 0.22;
    ctx.shadowOffsetY = size * 0.05;
    const textY = sub ? bandY + bandH * 0.4 : bandY + bandH * 0.52;
    ctx.strokeText(text, w / 2, textY);
    ctx.fillText(text, w / 2, textY);
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  }
  if (sub) {
    const subSize = Math.max(12, Math.round(h * 0.024));
    ctx.font = `700 ${subSize}px system-ui, sans-serif`;
    try { ctx.letterSpacing = `${Math.max(2, subSize * 0.22)}px`; } catch { /* older canvas: no letter-spacing */ }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = theme.accent;
    ctx.fillText(sub, w / 2, bandY + bandH * 0.78);
    try { ctx.letterSpacing = '0px'; } catch { /* ignore */ }
  }
}
