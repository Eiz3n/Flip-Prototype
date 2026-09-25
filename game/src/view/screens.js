import { config } from '../config.js';
import { drawLogo } from './art/logo.js';
import { formatTime } from './art/hud.js';

function text(ctx, s, y, size, weight, theme) {
  ctx.font = `${weight} ${size}px ${theme.font.family}`;
  ctx.fillStyle = theme.color.ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(s, config.room.width / 2, y);
}

export function drawTitle(ctx, game, fx, theme) {
  const f = theme.font;
  drawLogo(ctx, config.room.width / 2, 240, f.logoSize, fx.titleFlipped, theme);
  text(ctx, 'Tap to flip', 360, f.bodySize, f.body, theme);
  text(ctx, `Best ${game.best === null ? '—' : formatTime(game.best)}`, 400, f.bodySize, f.body, theme);
}

export function drawWin(ctx, game, theme) {
  const f = theme.font;
  text(ctx, 'Cleared', 200, f.titleSize, f.logo, theme);
  text(ctx, formatTime(game.lastTimeMs), 260, f.titleSize, f.hud, theme);
  text(ctx, `× ${game.deaths}`, 300, f.bodySize, f.hud, theme);
  text(ctx, `Best ${game.best === null ? '—' : formatTime(game.best)}`, 340, f.bodySize, f.body, theme);
  if (game.newBest) text(ctx, 'New best', 380, f.bodySize, f.hud, theme);
  text(ctx, 'Tap to play again', 460, f.bodySize, f.body, theme);
}
