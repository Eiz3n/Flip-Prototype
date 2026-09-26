// Exit doorway (ceiling) and entry hatch (floor), per the canvas: ink interior 46 deep, neutral
// posts ending at the mouth line, chevrons rising and fading (three visible), the exit's dashed pull cue.
import { config } from '../../config.js';

function posts(ctx, x, top, bottom, theme) {
  const s = config.shaft, half = s.opening / 2, w = theme.shaft.postOutline;
  for (const left of [x - half - s.postWidth, x + half]) {
    ctx.fillStyle = theme.color.neutral;
    ctx.fillRect(left, top, s.postWidth, bottom - top);
    ctx.strokeStyle = theme.color.ink;
    ctx.lineWidth = w;
    ctx.strokeRect(left + w / 2, top + w / 2, s.postWidth - w, bottom - top - w);
  }
}

// Four chevrons on a loop of four slots, `spacing` apart, moving up at chevronSpeed. Slot 0 sits
// just below the interior, so a wrapping chevron slides in from the bottom edge instead of
// popping into view. Slots 1–3 are the canvas's three visible chevrons: brightest at the bottom,
// faintest at the top. At t = 0 the visible centres match the canvas (exit: 36.8, 23.0, 9.2).
function chevrons(ctx, x, top, time, theme) {
  const t = theme.shaft, s = config.shaft;
  const spacing = t.chevronHeight + t.chevronGap;        // 13.8
  const span = 4 * spacing;
  const base = top + s.depth / 2 + 2 * spacing;          // slot 0 centre (exit: 50.6)
  const hw = (t.chevronWidth * 0.8) / 2;                 // canvas path spans x 1–9 of 10
  const hh = (t.chevronHeight * (4 / 6)) / 2;            // and y 1–5 of 6

  ctx.save();
  ctx.beginPath();
  ctx.rect(x - s.opening / 2, top, s.opening, s.depth);
  ctx.clip();
  ctx.strokeStyle = theme.color.background;
  ctx.lineWidth = t.chevronStroke;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const [faint, mid, bright] = t.chevronAlphas;
  for (let i = 0; i < 4; i++) {
    const rise = (time * t.chevronSpeed + i * spacing) % span;
    const y = base - rise;
    const slot = Math.min(3, Math.floor(rise / spacing + 1e-6));
    ctx.globalAlpha = slot <= 1 ? bright : slot === 2 ? mid : faint;
    ctx.beginPath();
    ctx.moveTo(x - hw, y + hh);
    ctx.lineTo(x, y - hh);
    ctx.lineTo(x + hw, y + hh);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function pullCue(ctx, x, theme) {
  const s = config.shaft, t = theme.shaft;
  const a = (t.pullCueAngle * Math.PI) / 180;
  const foot = s.opening / 2 + s.postWidth;
  ctx.strokeStyle = theme.color.ink;
  ctx.globalAlpha = t.pullCueAlpha;
  ctx.lineWidth = t.pullCueWidth;
  ctx.setLineDash(t.pullCueDash);
  for (const sign of [-1, 1]) {
    const fx = x + sign * foot;
    ctx.beginPath();
    ctx.moveTo(fx, s.exitMouthY);
    ctx.lineTo(fx + sign * Math.sin(a) * t.pullCueLength, s.exitMouthY + Math.cos(a) * t.pullCueLength);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
}

export function drawExitDoorway(ctx, x, time, theme) {
  const s = config.shaft;
  ctx.fillStyle = theme.color.ink;
  ctx.fillRect(x - s.opening / 2, 0, s.opening, s.depth);
  chevrons(ctx, x, 0, time, theme);
  posts(ctx, x, 0, s.exitMouthY, theme);
  pullCue(ctx, x, theme);
}

export function drawEntryHatch(ctx, x, time, theme) {
  const s = config.shaft, H = config.room.height;
  ctx.fillStyle = theme.color.ink;
  ctx.fillRect(x - s.opening / 2, H - s.depth, s.opening, s.depth);
  chevrons(ctx, x, H - s.depth, time, theme);
  posts(ctx, x, s.entryMouthY, H, theme);
}
