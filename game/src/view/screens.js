// Title and win screens, laid out from the Flip Art canvas (art plan Task 7 table).
import { config } from '../config.js';
import { titleFlipValue } from './anim/effects.js';
import { drawLogo } from './art/logo.js';
import { drawHookDisc } from './art/hookPoint.js';
import { drawTabular, tabularWidth, formatTime } from './art/hud.js';

const TAU = Math.PI * 2;
const DASH = '—';

function text(ctx, s, x, y, size, weight, theme, align = 'center', alpha = 1) {
  ctx.font = `${weight} ${size}px ${theme.font.family}`;
  ctx.fillStyle = theme.color.ink;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.globalAlpha = alpha;
  ctx.fillText(s, x, y);
  ctx.globalAlpha = 1;
}

const box = (size, theme) => size * theme.font.lineHeight;

export function drawTitle(ctx, game, fx, theme) {
  const f = theme.font, t = theme.title, b = config.bob;
  const cx = config.room.width / 2;

  // Idle hook points: faint rings, bobbing in the TDD figure eight. Offsets are relative to the
  // starting phase so at time 0 every hook sits exactly where the canvas draws it.
  t.hooks.forEach((h, i) => {
    const ph = i * b.phaseStep;
    const x = h.x + b.ampX * (Math.sin(TAU * b.freq * fx.time + ph) - Math.sin(ph));
    const y = h.y + b.ampY * (Math.sin(2 * TAU * b.freq * fx.time + ph) - Math.sin(ph));
    ctx.strokeStyle = theme.color.ink;
    ctx.lineWidth = theme.field.idleWidth;
    ctx.globalAlpha = theme.field.titleAlpha;
    ctx.beginPath();
    ctx.arc(x, y, config.fieldRadius - theme.field.idleWidth / 2, 0, TAU);
    ctx.stroke();
    ctx.globalAlpha = 1;
    drawHookDisc(ctx, x, y, h.pol, 1, theme);
  });

  const logoY = t.columnY + f.logoSize / 2;
  drawLogo(ctx, cx, logoY, f.logoSize, titleFlipValue(fx), theme);
  const tapY = t.columnY + f.logoSize + t.gap + box(f.bodySize, theme) / 2;
  text(ctx, 'tap to start', cx, tapY, f.bodySize, f.hud, theme);
  const bestY = tapY + box(f.bodySize, theme) / 2 + t.gap + box(f.smallSize, theme) / 2;
  const best = game.best === null ? DASH : formatTime(game.best);
  text(ctx, `best ${best}`, cx, bestY, f.smallSize, f.body, theme, 'center', t.bestAlpha);
}

export function drawWin(ctx, game, theme) {
  const f = theme.font, w = theme.win;
  const cx = config.room.width / 2;

  const clearedBox = box(f.titleSize, theme);
  text(ctx, 'Cleared', cx, w.columnY + clearedBox / 2, f.titleSize, f.logo, theme);

  // The canvas panel has no box-sizing, so its 2 px border sits outside the padding.
  const sw = theme.stroke.ink;
  const rowBox = box(f.rowSize, theme);
  const top = w.columnY + clearedBox + w.gap;
  const height = 2 * sw + 2 * w.panelPadY + 3 * rowBox + 2 * w.rowGap;   // 140
  ctx.fillStyle = theme.color.neutral;
  ctx.beginPath();
  ctx.roundRect(w.panelX, top, w.panelW, height, w.panelRadius);
  ctx.fill();
  ctx.strokeStyle = theme.color.ink;
  ctx.lineWidth = sw;
  ctx.beginPath();
  ctx.roundRect(w.panelX + sw / 2, top + sw / 2, w.panelW - sw, height - sw, w.panelRadius - sw / 2);
  ctx.stroke();

  const rows = [
    ['Time', formatTime(game.lastTimeMs)],
    ['Deaths', String(game.deaths)],
    ['Best', game.best === null ? DASH : formatTime(game.best)],
  ];
  const left = w.panelX + sw + w.panelPadX;                // 66
  const right = w.panelX + w.panelW - sw - w.panelPadX;    // 294
  rows.forEach(([label, value], i) => {
    const y = top + sw + w.panelPadY + rowBox / 2 + i * (rowBox + w.rowGap);
    text(ctx, label, left, y, f.rowSize, f.body, theme, 'left');
    ctx.font = `${f.logo} ${f.rowSize}px ${f.family}`;
    ctx.fillStyle = theme.color.ink;
    ctx.textBaseline = 'middle';
    drawTabular(ctx, value, right - tabularWidth(ctx, value) / 2, y);
  });

  const bottom = top + height;
  const newBestY = bottom + w.gap + box(f.smallSize, theme) / 2;
  if (game.newBest) text(ctx, 'New best', cx, newBestY, f.smallSize, f.hud, theme);
  const tapY = bottom + w.gap + box(f.smallSize, theme) + w.gap + box(f.bodySize, theme) / 2;
  text(ctx, 'tap to return', cx, tapY, f.bodySize, f.hud, theme);
}
