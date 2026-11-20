// The cover renderer: `drawCover(canvas, state)` composes the whole poster —
// multi-panel photos, original procedural art, the colour grade, and the bold
// poster lettering — at the canvas's own pixel size, so the live preview and
// the exported PNG are the same drawing at different resolutions.
//
// `state` shape:
//   { layout, theme, photos: HTMLImageElement[], panels: [{photo, scale, dx, dy, rot}],
//     title, sub, captionPos: 'bottom'|'top'|'center', titleColor: 'white'|'yellow'|'pink' }
// A panel whose `photo` is -1 (or whose photo is missing) draws procedural art.

import { themeById } from './themes.js';
import { layoutRects } from './panels.js';
import { drawPhotoInPanel } from './images.js';

const TITLE_COLORS = {
  white: '#ffffff',
  yellow: '#ffcf4d',
  pink: '#ff7ad9',
};

/** Deterministic pseudo-random from an integer seed (no Math.random in art). */
function seeded(i) {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Draws the full cover onto `canvas` from `state`. Safe to call on every UI
 * change: it repaints from scratch each time.
 */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const theme = themeById(state.theme);
  const gap = Math.max(5, Math.round(W * 0.007));
  const bandH = Math.round(H * 0.155);

  // Caption band position decides where the panels live.
  let area;
  let bandY;
  if (state.captionPos === 'top') {
    bandY = 0;
    area = { x: 0, y: bandH, w: W, h: H - bandH };
  } else if (state.captionPos === 'center') {
    bandY = Math.round((H - bandH) / 2);
    area = { x: 0, y: 0, w: W, h: H };
  } else {
    bandY = H - bandH;
    area = { x: 0, y: 0, w: W, h: H - bandH };
  }

  ctx.fillStyle = theme.band;
  ctx.fillRect(0, 0, W, H);

  const rects = layoutRects(state.layout, area);
  rects.forEach((r, i) => {
    const inset = {
      x: r.x + gap / 2,
      y: r.y + gap / 2,
      w: r.w - gap,
      h: r.h - gap,
      art: r.art,
    };
    ctx.save();
    ctx.beginPath();
    ctx.rect(inset.x, inset.y, inset.w, inset.h);
    ctx.clip();
    const panel = state.panels[i];
    const img = panel && panel.photo >= 0 ? state.photos[panel.photo] : null;
    if (img) {
      drawPhotoInPanel(ctx, img, inset, panel);
    } else {
      drawProceduralArt(ctx, inset, theme);
    }
    ctx.restore();
    ctx.strokeStyle = theme.frame;
    ctx.lineWidth = Math.max(2, Math.round(W * 0.003));
    ctx.strokeRect(inset.x, inset.y, inset.w, inset.h);
  });

  applySunsetGrade(ctx, area, theme, W, H);
  drawCaptionBand(ctx, W, H, bandY, bandH, state, theme);
}

/** Warm grade wash + vignette + halftone dots over the panel area. */
export function applySunsetGrade(ctx, area, theme, W, H) {
  const g = ctx.createLinearGradient(0, area.y, 0, area.y + area.h);
  g.addColorStop(0, theme.gradeTop);
  g.addColorStop(0.55, 'rgba(255, 90, 120, 0.10)');
  g.addColorStop(1, theme.gradeBottom);
  ctx.fillStyle = g;
  ctx.fillRect(area.x, area.y, area.w, area.h);

  const v = ctx.createRadialGradient(
    area.x + area.w / 2, area.y + area.h / 2, Math.min(area.w, area.h) * 0.35,
    area.x + area.w / 2, area.y + area.h / 2, Math.max(area.w, area.h) * 0.75,
  );
  v.addColorStop(0, 'rgba(0, 0, 0, 0)');
  v.addColorStop(1, theme.vignette);
  ctx.fillStyle = v;
  ctx.fillRect(area.x, area.y, area.w, area.h);

  // Halftone dots fading down the top-right corner of the panel area.
  const step = Math.max(14, Math.round(W * 0.014));
  ctx.fillStyle = theme.halftone;
  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < 9; col++) {
      const r = Math.max(0.6, (7 - row) * 0.55);
      const cx = area.x + area.w - (col + 0.7) * step;
      const cy = area.y + (row + 0.7) * step;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/**
 * Original procedural scene: gradient sky, a striped setting sun, a city
 * skyline silhouette, palm silhouettes, birds, and a perspective road line.
 * Drawn fresh from code every time — no image assets involved.
 */
export function drawProceduralArt(ctx, rect, theme) {
  const { x, y, w, h } = rect;
  const sky = ctx.createLinearGradient(0, y, 0, y + h);
  theme.sky.forEach((c, i) => sky.addColorStop(i / (theme.sky.length - 1), c));
  ctx.fillStyle = sky;
  ctx.fillRect(x, y, w, h);

  drawStripedSun(ctx, x + w * 0.62, y + h * 0.42, Math.min(w, h) * 0.30, theme);
  drawBirds(ctx, x + w * 0.16, y + h * 0.20, Math.min(w, h) * 0.05, theme);
  // Palms stand behind the skyline so their trunks read against the sky and
  // disappear naturally behind the buildings.
  drawPalm(ctx, x + w * 0.10, y + h, h * 0.60, -1, theme);
  drawPalm(ctx, x + w * 0.92, y + h, h * 0.48, 1, theme);
  drawSkyline(ctx, x, y + h * 0.62, w, h * 0.38, theme);
  drawRoad(ctx, x, y + h, w, h, theme);
}

/** A setting sun with horizontal slats cut through its lower half. */
export function drawStripedSun(ctx, cx, cy, r, theme) {
  const off = document.createElement('canvas');
  off.width = Math.ceil(r * 2 + 4);
  off.height = Math.ceil(r * 2 + 4);
  const o = off.getContext('2d');
  const g = o.createLinearGradient(0, 0, 0, off.height);
  g.addColorStop(0, theme.sunTop);
  g.addColorStop(1, theme.sunBottom);
  o.fillStyle = g;
  o.beginPath();
  o.arc(r + 2, r + 2, r, 0, Math.PI * 2);
  o.fill();
  // Cut slats out of the lower half: gaps widen toward the bottom.
  o.globalCompositeOperation = 'destination-out';
  let yy = r + 2 + r * 0.08;
  let thick = Math.max(2, r * 0.035);
  while (yy < r * 2) {
    o.fillRect(0, yy, off.width, thick);
    yy += thick + Math.max(3, r * 0.10);
    thick += Math.max(1, r * 0.02);
  }
  ctx.drawImage(off, cx - r - 2, cy - r - 2);
}

/** A dark skyline silhouette with a few lit windows. */
export function drawSkyline(ctx, x, top, w, h, theme) {
  ctx.fillStyle = theme.silhouette;
  let bx = x;
  let i = 0;
  while (bx < x + w) {
    const bw = w * (0.10 + seeded(i) * 0.10);
    const bh = h * (0.35 + seeded(i + 40) * 0.65);
    ctx.fillRect(bx, top + h - bh, bw, bh);
    // Tiny lit windows on the taller blocks.
    if (bh > h * 0.55) {
      ctx.fillStyle = theme.window;
      for (let wy = 0; wy < 3; wy++) {
        for (let wx = 0; wx < 2; wx++) {
          if (seeded(i * 7 + wy * 3 + wx) > 0.45) {
            ctx.fillRect(bx + bw * (0.2 + wx * 0.4), top + h - bh + h * 0.12 + wy * h * 0.16, 3, 3);
          }
        }
      }
      ctx.fillStyle = theme.silhouette;
    }
    bx += bw;
    i++;
  }
  ctx.fillRect(x, top + h - 2, w, 2);
}

/**
 * One stylised palm: a leaning trunk and seven arched fronds that droop from
 * the crown. `lean` is -1 (leans left) or 1 (leans right); `size` is the palm
 * height in pixels. Fronds stay close to the trunk so they read as a palm
 * even inside a narrow panel.
 */
export function drawPalm(ctx, baseX, baseY, size, lean, theme) {
  const topX = baseX + lean * size * 0.16;
  const topY = baseY - size;
  ctx.strokeStyle = theme.silhouette;
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(3, size * 0.05);
  ctx.beginPath();
  ctx.moveTo(baseX, baseY);
  ctx.quadraticCurveTo(baseX + lean * size * 0.04, baseY - size * 0.55, topX, topY);
  ctx.stroke();
  ctx.lineWidth = Math.max(2, size * 0.028);
  for (let f = 0; f < 7; f++) {
    const spread = (f / 6 - 0.5) * 2; // -1 (left) .. 1 (right)
    const reach = size * 0.26;
    const fx = topX + spread * reach;
    const fy = topY + size * 0.16 + Math.abs(spread) * size * 0.06;
    const mx = topX + spread * reach * 0.55;
    const my = topY - size * 0.05;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(mx, my, fx, fy);
    ctx.stroke();
  }
  ctx.fillStyle = theme.silhouette;
  ctx.beginPath();
  ctx.arc(topX - size * 0.02, topY + size * 0.03, Math.max(2, size * 0.03), 0, Math.PI * 2);
  ctx.arc(topX + size * 0.02, topY + size * 0.04, Math.max(2, size * 0.025), 0, Math.PI * 2);
  ctx.fill();
}

/** Three small birds as simple curved strokes. */
export function drawBirds(ctx, x, y, s, theme) {
  ctx.strokeStyle = theme.silhouette;
  ctx.lineWidth = Math.max(1.5, s * 0.12);
  ctx.lineCap = 'round';
  const spots = [[0, 0], [1.6, 0.7], [0.7, 1.5]];
  for (const [ox, oy] of spots) {
    const bx = x + ox * s;
    const by = y + oy * s;
    ctx.beginPath();
    ctx.moveTo(bx - s * 0.45, by);
    ctx.quadraticCurveTo(bx - s * 0.15, by - s * 0.4, bx, by);
    ctx.quadraticCurveTo(bx + s * 0.15, by - s * 0.4, bx + s * 0.45, by);
    ctx.stroke();
  }
}

/** A single accent road line rising along the foot of the art panel. */
export function drawRoad(ctx, x, bottomY, w, h, theme) {
  ctx.strokeStyle = theme.accent;
  ctx.lineWidth = Math.max(2, h * 0.012);
  ctx.beginPath();
  ctx.moveTo(x, bottomY - h * 0.02);
  ctx.lineTo(x + w, bottomY - h * 0.10);
  ctx.stroke();
}

/** The caption band: bold auto-fit title with outline and the sub-caption. */
export function drawCaptionBand(ctx, W, H, bandY, bandH, state, theme) {
  const title = (state.title || '').trim().toUpperCase();
  const sub = (state.sub || '').trim().toUpperCase();
  if (!title && !sub) return;

  if (state.captionPos === 'center') {
    ctx.fillStyle = 'rgba(20, 8, 35, 0.72)';
    ctx.fillRect(0, bandY, W, bandH);
  } else {
    ctx.fillStyle = theme.band;
    ctx.fillRect(0, bandY, W, bandH);
    // Thin accent rule along the band edge that meets the panels.
    ctx.fillStyle = theme.accent;
    const ruleY = state.captionPos === 'top' ? bandY + bandH - 3 : bandY;
    ctx.fillRect(0, ruleY, W, 3);
  }

  if (title) {
    const color = TITLE_COLORS[state.titleColor] || TITLE_COLORS.white;
    let size = bandH * (sub ? 0.52 : 0.62);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const setFont = (s) => { ctx.font = `${s}px Anton, 'Arial Narrow', sans-serif`; };
    setFont(size);
    while (ctx.measureText(title).width > W * 0.92 && size > 14) {
      size -= 2;
      setFont(size);
    }
    const ty = bandY + bandH * (sub ? 0.38 : 0.52);
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(2, size * 0.10);
    ctx.strokeStyle = theme.titleStroke;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = size * 0.12;
    ctx.shadowOffsetY = size * 0.05;
    ctx.strokeText(title, W / 2, ty);
    ctx.fillStyle = color;
    ctx.fillText(title, W / 2, ty);
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  }

  if (sub) {
    let size = Math.max(12, bandH * 0.20);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const setFont = (s) => { ctx.font = `700 ${s}px system-ui, sans-serif`; };
    setFont(size);
    while (ctx.measureText(sub).width > W * 0.85 && size > 10) {
      size -= 1;
      setFont(size);
    }
    ctx.fillStyle = theme.sub;
    ctx.fillText(sub, W / 2, bandY + bandH * 0.80);
  }
}
