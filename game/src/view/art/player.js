import { config } from '../../config.js';
import { drawMark, polColor } from './marks.js';

export function drawTether(ctx, x, y, hook, theme) {
  ctx.strokeStyle = theme.color.ink;
  ctx.globalAlpha = theme.tether.alpha;
  ctx.lineWidth = theme.tether.width;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(hook.pos.x, hook.pos.y);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

export function drawPlayer(ctx, x, y, player, fx, theme) {
  const r = config.playerRadius;
  const tr = fx.trail;
  for (let i = 0; i < tr.count; i++) {
    const idx = (tr.head - 1 - i + tr.x.length) % tr.x.length;   // newest first
    ctx.globalAlpha = 1 - (i + 1) / (tr.count + 1);                 // stepped, one level per dot
    ctx.fillStyle = polColor(theme, tr.pol[idx]);
    ctx.beginPath();
    ctx.arc(tr.x[idx], tr.y[idx], r * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = polColor(theme, player.pol);
  ctx.strokeStyle = theme.color.ink;
  ctx.lineWidth = theme.stroke.ink;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  drawMark(ctx, x, y, r, player.pol, theme);

  if (fx.flipRing.t > 0) {
    const k = 1 - fx.flipRing.t / theme.fx.flipRingTime;
    ctx.globalAlpha = 1 - k;
    ctx.beginPath();
    ctx.arc(x, y, r + k * theme.fx.flipRingGrow, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}
