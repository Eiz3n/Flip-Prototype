import { drawMark, polColor } from './marks.js';

const TAU = Math.PI * 2;

// The coloured disc with its inside ink stroke and mark. scale 1 = 28 px across.
export function drawHookDisc(ctx, x, y, pol, scale, theme) {
  const r = theme.size.hook * scale;
  const w = theme.stroke.ink;
  ctx.fillStyle = polColor(theme, pol);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = theme.color.ink;
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.arc(x, y, r - w / 2, 0, TAU);
  ctx.stroke();
  drawMark(ctx, x, y, theme.font.markHook * scale, pol, theme);
}

// pop: 1 at the moment of latching, falling to 0 over latchPopTime. The scale rises to
// latchPopScale halfway and settles back, a single smooth beat.
export function drawHookPoint(ctx, hook, playerInside, pop, theme) {
  const f = theme.field;
  const w = playerInside ? f.insideWidth : f.idleWidth;
  ctx.globalAlpha = playerInside ? f.insideAlpha : f.idleAlpha;
  ctx.strokeStyle = theme.color.ink;
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.arc(hook.pos.x, hook.pos.y, hook.fieldRadius - w / 2, 0, TAU);
  ctx.stroke();
  ctx.globalAlpha = 1;

  const bump = pop > 0 ? Math.sin(Math.PI * pop) : 0;
  drawHookDisc(ctx, hook.pos.x, hook.pos.y, hook.pol, 1 + (theme.fx.latchPopScale - 1) * bump, theme);
}
