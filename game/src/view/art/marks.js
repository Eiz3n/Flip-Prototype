// + / − marks as Baloo 2 glyphs in ink, vertically centred on the shape (canvas: Sprites).
// size = glyph size in px (theme.font.markPlayer / markHook).
const MINUS = '−';

export function polColor(theme, pol) {
  return pol > 0 ? theme.color.positive : theme.color.negative;
}

export function drawMark(ctx, x, y, size, pol, theme) {
  const glyph = pol > 0 ? '+' : MINUS;
  ctx.font = `${theme.font.hud} ${size}px ${theme.font.family}`;
  ctx.fillStyle = theme.color.ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  // Centre the font's line box on y, as the canvas does (flex centring, line-height 1): baseline
  // at y + (fontAscent − fontDescent) / 2. Measured each call so it is right before and after
  // the font finishes loading; about ten marks a frame, so the cost is negligible.
  const m = ctx.measureText(glyph);
  const a = m.fontBoundingBoxAscent, d = m.fontBoundingBoxDescent;
  const offset = Number.isFinite(a) && Number.isFinite(d) ? (a - d) / 2 : size * 0.3;
  ctx.fillText(glyph, x, y + offset);
}
