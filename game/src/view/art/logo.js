// "Flip" with the capital F rotated. flip: 0 upright, 1 upside down (canvas default), between = mid-turn.
// Drawn letter by letter so the −2 tracking works without ctx.letterSpacing.
export function drawLogo(ctx, cx, cy, size, flip, theme) {
  const f = theme.font;
  const letters = 'Flip';
  ctx.font = `${f.logo} ${size}px ${f.family}`;
  ctx.fillStyle = theme.color.ink;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  let total = 0;
  for (let i = 0; i < letters.length; i++) total += ctx.measureText(letters[i]).width + (i > 0 ? f.logoTracking : 0);

  // Baseline that centres the font's line box on cy, as the canvas does (line-height 1). cy is
  // also the F's rotation centre, matching CSS rotate() on the inline-block F.
  const m = ctx.measureText('F');
  const a = m.fontBoundingBoxAscent, d = m.fontBoundingBoxDescent;
  const baseY = cy + (Number.isFinite(a) && Number.isFinite(d) ? (a - d) / 2 : size * 0.35);

  let x = cx - total / 2;
  for (let i = 0; i < letters.length; i++) {
    const ch = letters[i];
    const w = ctx.measureText(ch).width;
    const turn = Number(flip) * Math.PI;
    if (i === 0 && turn !== 0) {
      ctx.save();
      ctx.translate(x + w / 2, cy);
      ctx.rotate(turn);
      ctx.fillText(ch, -w / 2, baseY - cy);
      ctx.restore();
    } else {
      ctx.fillText(ch, x, baseY);
    }
    x += w + f.logoTracking;
  }
}
