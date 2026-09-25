// Exit doorway (ceiling) and entry hatch (floor): ink interior, neutral posts with ink outline,
// three rising chevrons, and the exit's dashed pull cue. Geometry from config.shaft.
import { config } from '../../config.js';

function posts(ctx, x, top, bottom, theme) {
  const s = config.shaft;
  const half = s.opening / 2;
  for (const left of [x - half - s.postWidth, x + half]) {
    ctx.fillStyle = theme.color.neutral;
    ctx.fillRect(left, top, s.postWidth, bottom - top);
    ctx.strokeStyle = theme.color.ink;
    ctx.lineWidth = theme.shaft.postOutline;
    ctx.strokeRect(left, top, s.postWidth, bottom - top);
  }
}

function chevrons(ctx, x, top, bottom, time, theme) {
  const t = theme.shaft;
  const span = bottom - top;
  const w = t.chevronWidth / 2;
  ctx.strokeStyle = theme.color.background;
  ctx.lineWidth = theme.stroke.ink;
  for (let i = 0; i < 3; i++) {
    const y = bottom - ((time * t.chevronSpeed + i * t.chevronSpacing) % span);
    const k = Math.min(2, Math.floor(((bottom - y) / span) * 3));   // 0 near bottom → 2 near top
    ctx.globalAlpha = t.chevronAlphas[k];
    ctx.beginPath();
    ctx.moveTo(x - w, y + w / 2);
    ctx.lineTo(x, y - w / 2);
    ctx.lineTo(x + w, y + w / 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

export function drawExitDoorway(ctx, x, time, theme) {
  const s = config.shaft;
  const half = s.opening / 2;
  ctx.fillStyle = theme.color.ink;
  ctx.fillRect(x - half, 0, s.opening, s.depth);                 // interior 46 deep, posts reach the mouth
  chevrons(ctx, x, 0, s.depth, time, theme);
  posts(ctx, x, 0, s.exitMouthY, theme);

  const t = theme.shaft;
  const feetY = s.exitMouthY;
  const a = (t.pullCueAngle * Math.PI) / 180;
  ctx.strokeStyle = theme.color.ink;
  ctx.globalAlpha = t.pullCueAlpha;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  for (const sign of [-1, 1]) {
    const fx = x + sign * (half + s.postWidth);                   // outer foot of each post
    ctx.beginPath();
    ctx.moveTo(fx, feetY);
    ctx.lineTo(fx + sign * Math.sin(a) * t.pullCueLength, feetY + Math.cos(a) * t.pullCueLength);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
}

export function drawEntryHatch(ctx, x, time, theme) {
  const s = config.shaft;
  const H = config.room.height;
  ctx.fillStyle = theme.color.ink;
  ctx.fillRect(x - s.opening / 2, H - s.depth, s.opening, s.depth);
  chevrons(ctx, x, H - s.depth, H, time, theme);
  posts(ctx, x, s.entryMouthY, H, theme);
}
