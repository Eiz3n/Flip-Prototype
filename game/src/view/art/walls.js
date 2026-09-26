// Side bands (full height, local wall polarity, no edge), neutral top/bottom walls with an ink
// edge facing the room and the shaft openings cut out, and the full-width ink wave-front line.
import { config } from '../../config.js';
import { polColor } from './marks.js';

function wallRun(ctx, x0, x1, top, edgeAtBottom, theme) {
  if (x1 <= x0) return;
  const R = config.room, e = theme.walls.innerEdge;
  const h = edgeAtBottom ? R.topWall : R.bottomWall;
  ctx.fillStyle = theme.color.neutral;
  ctx.fillRect(x0, top, x1 - x0, h);
  ctx.fillStyle = theme.color.ink;
  ctx.fillRect(x0, edgeAtBottom ? top + h - e : top, x1 - x0, e);
}

export function drawWalls(ctx, room, wave, theme) {
  const R = config.room, s = config.shaft;
  const cut = s.opening / 2 + s.postWidth;              // 38: from the centre to a post's outer edge
  const f = wave.frontY < 0 ? 0 : wave.frontY;

  for (const x of [0, R.width - R.wallBand]) {
    ctx.fillStyle = polColor(theme, wave.polAbove);
    ctx.fillRect(x, 0, R.wallBand, f);
    ctx.fillStyle = polColor(theme, wave.polBelow);
    ctx.fillRect(x, f, R.wallBand, R.height - f);
  }

  const L = R.wallBand, Rt = R.width - R.wallBand;
  wallRun(ctx, L, room.exitX - cut, 0, true, theme);
  wallRun(ctx, room.exitX + cut, Rt, 0, true, theme);
  const bottom = R.height - R.bottomWall;
  wallRun(ctx, L, room.entryX - cut, bottom, false, theme);
  wallRun(ctx, room.entryX + cut, Rt, bottom, false, theme);

  if (wave.frontY >= 0) {
    ctx.fillStyle = theme.color.ink;
    ctx.fillRect(0, wave.frontY, R.width, theme.walls.frontLineWidth);
  }
}
