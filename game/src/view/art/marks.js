// + / − marks as Baloo 2 glyphs in ink, vertically centred on the shape (canvas: Sprites).
// size = glyph size in px (theme.font.markPlayer / markHook).
const MINUS = '−';

export function polColor(theme, pol) {
  return pol > 0 ? theme.color.positive : theme.color.negative;
}

// Baseline that centres the current font's line box on y, as the canvas does (CSS centres the
// line box): y + (fontAscent − fontDescent) / 2. Sets an alphabetic baseline. Measured each call
// so it is right before and after the font finishes loading.
export function centredBaseline(ctx, y, size) {
  ctx.textBaseline = 'alphabetic';
  const m = ctx.measureText('0');
  const a = m.fontBoundingBoxAscent, d = m.fontBoundingBoxDescent;
  return y + (Number.isFinite(a) && Number.isFinite(d) ? (a - d) / 2 : size * 0.3);
}

export function drawMark(ctx, x, y, size, pol, theme) {
  const glyph = pol > 0 ? '+' : MINUS;
  ctx.font = `${theme.font.hud} ${size}px ${theme.font.family}`;
  ctx.fillStyle = theme.color.ink;
  ctx.textAlign = 'center';
  ctx.fillText(glyph, x, centredBaseline(ctx, y, size));
}
