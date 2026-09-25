// Side bands in local wall polarity (hard edge at the wave front), neutral top/bottom walls,
// and the thin ink wave-front line.
import { config } from '../../config.js';
import { polColor } from './marks.js';

export function drawWalls(ctx, room, wave, theme) {
  const R = config.room;
  const c = theme.color;
  const f = wave.frontY < 0 ? 0 : wave.frontY;

  for (const x of [0, R.width - R.wallBand]) {
    ctx.fillStyle = polColor(theme, wave.polAbove);
    ctx.fillRect(x, 0, R.wallBand, f);
    ctx.fillStyle = polColor(theme, wave.polBelow);
    ctx.fillRect(x, f, R.wallBand, R.height - f);
  }

  ctx.fillStyle = c.neutral;
  ctx.fillRect(0, 0, R.width, R.topWall);
  ctx.fillRect(0, R.height - R.bottomWall, R.width, R.bottomWall);
  ctx.fillStyle = c.ink;
  const e = theme.walls.innerEdge;
  ctx.fillRect(0, R.topWall - e, R.width, e);
  ctx.fillRect(0, R.height - R.bottomWall, R.width, e);
  ctx.fillRect(R.wallBand - e, 0, e, R.height);
  ctx.fillRect(R.width - R.wallBand, 0, e, R.height);

  if (wave.frontY >= 0) {
    ctx.fillRect(R.wallBand, wave.frontY, R.width - 2 * R.wallBand, theme.walls.frontLineWidth);
  }
}
