import { config } from '../../config.js';
import { easeOutCubic } from '../anim/ease.js';
import { drawMark, polColor } from './marks.js';

const TAU = Math.PI * 2;

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

function drawTrail(ctx, fx, theme) {
  const tr = fx.trail, f = theme.fx;
  // Skip the newest sample: it is 0–10 units behind and hidden under the player's disc, so the
  // drawn dots sit 10–20 / 20–30 / 30–40 behind, as on the canvas (about 13 / 23 / 32).
  const n = Math.min(tr.count - 1, f.trailRadii.length);
  for (let i = 0; i < n; i++) {
    const idx = (tr.head - 2 - i + 2 * tr.x.length) % tr.x.length;   // second newest first
    ctx.globalAlpha = f.trailAlphas[i];
    ctx.fillStyle = polColor(theme, tr.pol[idx]);
    ctx.beginPath();
    ctx.arc(tr.x[idx], tr.y[idx], f.trailRadii[i], 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export function drawPlayer(ctx, x, y, player, fx, theme) {
  drawTrail(ctx, fx, theme);

  const r = config.playerRadius;
  const w = theme.stroke.ink;
  ctx.fillStyle = polColor(theme, player.pol);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = theme.color.ink;
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.arc(x, y, r - w / 2, 0, TAU);
  ctx.stroke();
  drawMark(ctx, x, y, theme.font.markPlayer, player.pol, theme);

  if (fx.flipRing.t > 0) {
    const e = easeOutCubic(1 - fx.flipRing.t / theme.fx.flipRingTime);
    ctx.globalAlpha = 1 - e;
    ctx.strokeStyle = theme.color.ink;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.arc(x, y, r + e * theme.fx.flipRingGrow, 0, TAU);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}
