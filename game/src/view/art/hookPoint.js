import { drawMark, polColor } from './marks.js';

// pop: 1 at the moment of latching, falling to 0 over theme.fx.latchPopTime.
export function drawHookPoint(ctx, hook, playerInside, pop, theme) {
  const f = theme.field;
  ctx.strokeStyle = theme.color.ink;
  ctx.globalAlpha = playerInside ? f.insideAlpha : f.idleAlpha;
  ctx.lineWidth = playerInside ? f.insideWidth : f.idleWidth;
  ctx.beginPath();
  ctx.arc(hook.pos.x, hook.pos.y, hook.fieldRadius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;

  const r = theme.size.hook * (1 + (theme.fx.latchPopScale - 1) * pop);
  ctx.fillStyle = polColor(theme, hook.pol);
  ctx.beginPath();
  ctx.arc(hook.pos.x, hook.pos.y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = theme.stroke.ink;
  ctx.stroke();
  drawMark(ctx, hook.pos.x, hook.pos.y, r, hook.pol, theme);
}
