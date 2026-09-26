// Faint rounded ink dashes drifting up through open air. Fixed scatter, no randomness, so poses
// and screenshots are repeatable.
import { config } from '../../config.js';

export function drawUpdraft(ctx, time, theme) {
  const u = theme.updraft, R = config.room;
  const inner = R.width - 2 * R.wallBand - u.dashWidth;
  ctx.fillStyle = theme.color.ink;
  ctx.globalAlpha = u.alpha;
  for (let i = 0; i < u.count; i++) {
    const x = R.wallBand + ((i * 97) % inner);
    const y = R.height - ((time * u.speed + i * 53) % R.height);
    ctx.beginPath();
    ctx.roundRect(x, y, u.dashWidth, u.dashLength, u.radius);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}
