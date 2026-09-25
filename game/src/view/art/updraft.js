import { config } from '../../config.js';

export function drawUpdraft(ctx, time, theme) {
  const u = theme.updraft;
  const R = config.room;
  const inner = R.width - 2 * R.wallBand;
  ctx.fillStyle = theme.color.ink;
  ctx.globalAlpha = u.alpha;
  for (let i = 0; i < u.count; i++) {
    const x = R.wallBand + ((i * 97) % inner);                         // fixed scatter, no randomness
    const y = R.height - ((time * u.speed + i * 53) % R.height);
    ctx.fillRect(x, y, u.dashWidth, u.dashLength);
  }
  ctx.globalAlpha = 1;
}
