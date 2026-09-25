// Bars and squares: neutral fill, ink stroke inside the edge; the stroke doubles while flashing,
// capped so a thin shape (an 8-wide shaft post) keeps a neutral core instead of turning solid ink.
export function drawObstacle(ctx, o, flash, theme) {
  const w = flash > 0 ? Math.min(theme.stroke.ink * 2, Math.min(o.w, o.h) / 2 - 1) : theme.stroke.ink;
  ctx.fillStyle = theme.color.neutral;
  ctx.fillRect(o.left, o.top, o.w, o.h);
  ctx.strokeStyle = theme.color.ink;
  ctx.lineWidth = w;
  ctx.strokeRect(o.left + w / 2, o.top + w / 2, o.w - w, o.h - w);
}
