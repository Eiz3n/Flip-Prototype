export function drawObstacle(ctx, o, flash, theme) {
  ctx.fillStyle = theme.color.neutral;
  ctx.fillRect(o.left, o.top, o.w, o.h);
  ctx.strokeStyle = theme.color.ink;
  ctx.lineWidth = theme.stroke.ink * (flash > 0 ? 2 : 1);
  ctx.strokeRect(o.left, o.top, o.w, o.h);
}
