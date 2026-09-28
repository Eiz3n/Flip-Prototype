// Title, stage select, stage clear and win screens, laid out from the Flip Art canvas (art plan
// Task 7 table). Stage select, stage clear and the stars are v1.1 additions in the same style.
import { config } from '../config.js';
import { titleFlipValue } from './anim/effects.js';
import { drawLogo } from './art/logo.js';
import { drawHookDisc } from './art/hookPoint.js';
import { centredBaseline } from './art/marks.js';
import { drawTabular, tabularWidth, formatTime } from './art/hud.js';
import { drawStar, drawStarRow, starRowWidth } from './art/stars.js';
import { easeOutBack } from './anim/ease.js';
import { MAX_STARS } from '../stars.js';
import { starTotal } from '../progress.js';

const TAU = Math.PI * 2;
const DASH = '—';

function text(ctx, s, x, y, size, weight, theme, align = 'center', alpha = 1) {
  ctx.font = `${weight} ${size}px ${theme.font.family}`;
  ctx.fillStyle = theme.color.ink;
  ctx.textAlign = align;
  ctx.globalAlpha = alpha;
  ctx.fillText(s, x, centredBaseline(ctx, y, size));
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
  // Stars collected: best stars summed over every stage, out of 3 per stage.
  const starsY = tapY + box(f.bodySize, theme) / 2 + t.gap + box(f.smallSize, theme) / 2;
  const label = `${starTotal(game.progress)} / ${game.stages.length * MAX_STARS}`;
  ctx.font = `${f.body} ${f.smallSize}px ${f.family}`;
  const st = theme.stars, lw = ctx.measureText(label).width;
  const left = cx - (2 * st.small + st.labelGap + lw) / 2;
  ctx.globalAlpha = t.bestAlpha;
  drawStar(ctx, left + st.small, starsY, st.small, true, theme);
  ctx.globalAlpha = 1;
  text(ctx, label, left + 2 * st.small + st.labelGap + lw / 2, starsY, f.smallSize, f.body, theme, 'center', t.bestAlpha);
}

// The stage numeral's flip, the title F's turn applied to one digit: half a turn with the same
// ease. The digit swaps at the quarter turn (sideways) and the new one carries an extra half turn,
// so it lands upright after the overshoot. Returns the stage index to draw and its rotation.
export function numeralFlip(game) {
  const time = config.timing.titleFlipTime;
  if (game.selectFlip <= 0 || time <= 0) return { index: game.selected, rot: 0 };
  const turn = Math.PI * easeOutBack(1 - game.selectFlip / time);
  return turn < Math.PI / 2 ? { index: game.selectFrom, rot: turn } : { index: game.selected, rot: turn - Math.PI };
}

export function drawSelect(ctx, game, theme) {
  const f = theme.font, sl = theme.select, cfg = config.select;
  const cx = config.room.width / 2;
  text(ctx, 'choose a stage', cx, sl.labelY, f.bodySize, f.hud, theme, 'center', sl.labelAlpha);

  // "Stage N", centred as one word; only the numeral turns. Sized for the widest digit so the
  // word never shifts between stages.
  ctx.font = `${f.logo} ${sl.stageSize}px ${f.family}`;
  ctx.fillStyle = theme.color.ink;
  let digitW = 0;
  for (let i = 1; i <= game.stages.length; i++) digitW = Math.max(digitW, ctx.measureText(String(i)).width);
  const wordW = ctx.measureText('Stage ').width;
  const left = cx - (wordW + digitW) / 2;
  const base = centredBaseline(ctx, sl.stageY, sl.stageSize);
  ctx.textAlign = 'left';
  ctx.fillText('Stage', left, base);
  const { index, rot } = numeralFlip(game);
  const dx = left + wordW + digitW / 2;
  ctx.save();
  ctx.translate(dx, sl.stageY);
  if (rot !== 0) ctx.rotate(rot);
  ctx.textAlign = 'center';
  ctx.fillText(String(index + 1), 0, base - sl.stageY);
  ctx.restore();

  // Best for the stage on show: time and stars, or a note until it is cleared.
  const best = game.progress.stages[String(index + 1)];
  if (best) {
    const st = theme.stars;
    const t = `best ${formatTime(best.bestMs)}`;
    ctx.font = `${f.hud} ${f.rowSize}px ${f.family}`;
    const tw = ctx.measureText(t).width, rw = starRowWidth(MAX_STARS, sl.statStar, st.smallGap);
    const l = cx - (tw + sl.statGap + rw) / 2;
    text(ctx, t, l + tw / 2, sl.statsY, f.rowSize, f.hud, theme);
    drawStarRow(ctx, l + tw + sl.statGap + rw / 2, sl.statsY, best.stars, MAX_STARS, sl.statStar, st.smallGap, theme);
  } else {
    text(ctx, 'not cleared yet', cx, sl.statsY, f.rowSize, f.body, theme, 'center', sl.labelAlpha);
  }
  text(ctx, 'tap to change', cx, sl.hintY, f.smallSize, f.body, theme, 'center', sl.hintAlpha);

  // Start: neutral pill with the ink outline, centred in its tap area.
  const b = cfg.startBox, sw = theme.stroke.ink;
  const bx = b.x + b.w / 2 - sl.buttonW / 2, by = b.y + b.h / 2 - sl.buttonH / 2, r = sl.buttonH / 2;
  ctx.fillStyle = theme.color.neutral;
  ctx.beginPath();
  ctx.roundRect(bx, by, sl.buttonW, sl.buttonH, r);
  ctx.fill();
  ctx.strokeStyle = theme.color.ink;
  ctx.lineWidth = sw;
  ctx.beginPath();
  ctx.roundRect(bx + sw / 2, by + sw / 2, sl.buttonW - sw, sl.buttonH - sw, r - sw / 2);
  ctx.stroke();
  text(ctx, 'Start', cx, by + sl.buttonH / 2, sl.buttonSize, f.logo, theme);
}

// Rounded neutral panel of label/value rows, starting at top. Returns the panel's bottom y.
// The canvas panel has no box-sizing, so its 2 px border sits outside the padding.
function drawPanel(ctx, top, rows, theme) {
  const f = theme.font, w = theme.win;
  const sw = theme.stroke.ink;
  const rowBox = box(f.rowSize, theme);
  const height = 2 * sw + 2 * w.panelPadY + rows.length * rowBox + (rows.length - 1) * w.rowGap;   // 3 rows: 140
  ctx.fillStyle = theme.color.neutral;
  ctx.beginPath();
  ctx.roundRect(w.panelX, top, w.panelW, height, w.panelRadius);
  ctx.fill();
  ctx.strokeStyle = theme.color.ink;
  ctx.lineWidth = sw;
  ctx.beginPath();
  ctx.roundRect(w.panelX + sw / 2, top + sw / 2, w.panelW - sw, height - sw, w.panelRadius - sw / 2);
  ctx.stroke();

  const left = w.panelX + sw + w.panelPadX;                // 66
  const right = w.panelX + w.panelW - sw - w.panelPadX;    // 294
  rows.forEach(([label, value], i) => {
    const y = top + sw + w.panelPadY + rowBox / 2 + i * (rowBox + w.rowGap);
    text(ctx, label, left, y, f.rowSize, f.body, theme, 'left');
    ctx.font = `${f.logo} ${f.rowSize}px ${f.family}`;
    ctx.fillStyle = theme.color.ink;
    drawTabular(ctx, value, right - tabularWidth(ctx, value) / 2, centredBaseline(ctx, y, f.rowSize));
  });
  return top + height;
}

// Big stars row whose top edge is at top. Returns its bottom y.
function drawBigStars(ctx, top, earned, theme) {
  const st = theme.stars;
  drawStarRow(ctx, config.room.width / 2, top + st.big, earned, MAX_STARS, st.big, st.gap, theme);
  return top + 2 * st.big;
}

export function drawStageClear(ctx, game, theme) {
  const f = theme.font, w = theme.win, c = theme.clear;
  const cx = config.room.width / 2;
  const result = game.stageResults[game.stageResults.length - 1];

  const labelBox = box(f.smallSize, theme);
  text(ctx, `Stage ${game.stageIndex + 1}`, cx, c.columnY + labelBox / 2, f.smallSize, f.hud, theme, 'center', c.labelAlpha);
  const clearedTop = c.columnY + labelBox + theme.stars.labelGap;
  const clearedBox = box(f.titleSize, theme);
  text(ctx, 'Cleared', cx, clearedTop + clearedBox / 2, f.titleSize, f.logo, theme);

  const starsBottom = drawBigStars(ctx, clearedTop + clearedBox + w.starsGap, result.stars, theme);
  const bottom = drawPanel(ctx, starsBottom + w.gap, [
    ['Time', formatTime(result.timeMs)],
    ['Deaths', String(result.deaths)],
  ], theme);
  const smallBox = box(f.smallSize, theme);
  const newBestY = bottom + w.gap + smallBox / 2;
  if (result.newBest) text(ctx, 'New best', cx, newBestY, f.smallSize, f.hud, theme);
  text(ctx, 'tap to continue', cx, newBestY + smallBox / 2 + w.gap + box(f.bodySize, theme) / 2, f.bodySize, f.hud, theme);
}

// One small group per stage: the stage number, then its stars.
function drawStageSummary(ctx, y, results, theme) {
  const f = theme.font, st = theme.stars;
  ctx.font = `${f.hud} ${f.smallSize}px ${f.family}`;
  const rowW = starRowWidth(MAX_STARS, st.small, st.smallGap);
  const groups = results.map((r) => ({ label: String(r.stage), stars: r.stars, labelW: ctx.measureText(String(r.stage)).width }));
  const groupW = (g) => g.labelW + st.labelGap + rowW;
  const total = groups.reduce((sum, g) => sum + groupW(g), 0) + (groups.length - 1) * st.stageGap;
  let x = config.room.width / 2 - total / 2;
  for (const g of groups) {
    text(ctx, g.label, x + g.labelW / 2, y, f.smallSize, f.hud, theme);
    drawStarRow(ctx, x + g.labelW + st.labelGap + rowW / 2, y, g.stars, MAX_STARS, st.small, st.smallGap, theme);
    x += groupW(g) + st.stageGap;
  }
}

export function drawWin(ctx, game, theme) {
  const f = theme.font, w = theme.win;
  const cx = config.room.width / 2;
  const results = game.stageResults ?? [];
  const last = results[results.length - 1];

  const clearedBox = box(f.titleSize, theme);
  text(ctx, 'Cleared', cx, w.columnY + clearedBox / 2, f.titleSize, f.logo, theme);
  const starsBottom = drawBigStars(ctx, w.columnY + clearedBox + w.starsGap, last ? last.stars : 0, theme);

  // Timers are per stage: the panel shows the final stage, the summary every stage played this run.
  const bottom = drawPanel(ctx, starsBottom + w.gap, [
    ['Time', last ? formatTime(last.timeMs) : DASH],
    ['Deaths', last ? String(last.deaths) : DASH],
  ], theme);

  const smallBox = box(f.smallSize, theme);
  const summaryY = bottom + w.gap + smallBox / 2;
  if (results.length) drawStageSummary(ctx, summaryY, results, theme);
  const newBestY = summaryY + smallBox / 2 + w.gap + smallBox / 2;
  if (last?.newBest) text(ctx, 'New best', cx, newBestY, f.smallSize, f.hud, theme);
  const tapY = newBestY + smallBox / 2 + w.gap + box(f.bodySize, theme) / 2;
  text(ctx, 'tap to return', cx, tapY, f.bodySize, f.hud, theme);
}
