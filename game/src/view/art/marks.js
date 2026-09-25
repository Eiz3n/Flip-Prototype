// + / − glyph in ink. Every polarity-coloured shape carries one (colour-blind rule).
export function drawMark(ctx, x, y, size, pol, theme) {
  const h = size * theme.size.markScale;
  ctx.strokeStyle = theme.color.ink;
  ctx.lineWidth = theme.stroke.ink;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - h, y);
  ctx.lineTo(x + h, y);
  if (pol > 0) {
    ctx.moveTo(x, y - h);
    ctx.lineTo(x, y + h);
  }
  ctx.stroke();
}

export function polColor(theme, pol) {
  return pol > 0 ? theme.color.positive : theme.color.negative;
}
