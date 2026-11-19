// Small image helpers shared by the editor and the screenshot scenes.

/** Loads an image from a URL, resolving to the image once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });
}

/** Loads an image from a user-picked File via an object URL. */
export function loadFileImage(file) {
  return loadImage(URL.createObjectURL(file));
}
