// Loads the self-hosted Baloo 2 subset. Resolves false on missing file, error or timeout;
// the theme's font stack then falls back to ui-rounded / system-ui.
export async function loadFonts(font) {
  if (typeof FontFace === 'undefined' || typeof document === 'undefined') return false;
  try {
    const face = new FontFace('Baloo 2', `url(${font.file}) format('woff2')`, { weight: font.weights, display: 'block' });
    const timeout = new Promise((resolve) => setTimeout(() => resolve(null), font.loadTimeoutMs));
    const loaded = await Promise.race([face.load(), timeout]);
    if (!loaded) return false;
    document.fonts.add(loaded);
    return true;
  } catch {
    return false;
  }
}
