// Photo loading and per-panel photo placement. A panel transform is
// `{ photo, scale, dx, dy, rot }`: which loaded photo it shows, a zoom
// multiplier on top of cover-fit, a pan offset as a fraction of the panel
// size, and a rotation in quarter turns. Photos never leave the browser:
// they are read from local files or the bundled samples only.

/** Loads an image from a URL (object URL or a bundled sample path). */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('could not load image: ' + url));
    img.src = url;
  });
}

/** Loads one of the bundled sample photos by name (`boulevard` or `pier`). */
export function loadSample(name) {
  return loadImage('samples/' + name + '.jpg');
}

/** A fresh, centred panel transform showing photo `photoIndex`. */
export function defaultTransform(photoIndex) {
  return { photo: photoIndex, scale: 1, dx: 0, dy: 0, rot: 0 };
}

/**
 * Draws `img` inside `rect` with a cover fit, then the panel transform:
 * zoomed around the panel centre, panned by (dx, dy) and rotated by
 * `rot` quarter-turns. The caller clips to the panel first.
 */
export function drawPhotoInPanel(ctx, img, rect, t) {
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  if (!iw || !ih) return;
  const base = Math.max(rect.w / iw, rect.h / ih);
  const w = iw * base * t.scale;
  const h = ih * base * t.scale;
  ctx.save();
  ctx.translate(rect.x + rect.w / 2 + t.dx * rect.w, rect.y + rect.h / 2 + t.dy * rect.h);
  ctx.rotate((t.rot * Math.PI) / 2);
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  ctx.restore();
}

/** Resets a transform to a centred cover fit (keeps the same photo). */
export function fitTransform(t) {
  return { photo: t.photo, scale: 1, dx: 0, dy: 0, rot: 0 };
}

/** Zooms a transform out until the whole photo fits inside the panel. */
export function fillTransform(t, img, rect) {
  if (!img || !img.naturalWidth) return fitTransform(t);
  const base = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight);
  const contain = Math.min(rect.w / img.naturalWidth, rect.h / img.naturalHeight);
  const scale = Math.max(0.2, contain / base);
  return { photo: t.photo, scale, dx: 0, dy: 0, rot: 0 };
}
