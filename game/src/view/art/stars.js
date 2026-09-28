// Stage stars: five-point stars in ink, filled = earned, outline = not earned (palette-only rule).
const TAU = Math.PI * 2;

function starPath(ctx, cx, cy, r, inner) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * TAU) / 10;
    const d = i % 2 === 0 ? r : r * inner;
    if (i === 0) ctx.moveTo(cx + d * Math.cos(a), cy + d * Math.sin(a));
    else ctx.lineTo(cx + d * Math.cos(a), cy + d * Math.sin(a));
  }
  ctx.closePath();
}

export function drawStar(ctx, cx, cy, r, filled, theme) {
  const s = theme.stars;
  starPath(ctx, cx, cy, r, s.inner);
  ctx.lineJoin = 'round';
  if (filled) {
    ctx.fillStyle = theme.color.ink;
    ctx.fill();
  }
  ctx.strokeStyle = theme.color.ink;
  ctx.lineWidth = r >= s.big ? theme.stroke.ink : s.smallStroke;
  ctx.stroke();
}

export function starRowWidth(count, r, gap) {
  return count * 2 * r + (count - 1) * gap;
}

// A row of `count` stars centred on cx, the first `earned` filled.
export function drawStarRow(ctx, cx, cy, earned, count, r, gap, theme) {
  let x = cx - starRowWidth(count, r, gap) / 2 + r;
  for (let i = 0; i < count; i++) {
    drawStar(ctx, x, cy, r, i < earned, theme);
    x += 2 * r + gap;
  }
}
