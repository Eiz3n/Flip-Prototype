// "Flip" with the capital F upside down. flipped = true shows the upside-down F.
export function drawLogo(ctx, cx, cy, size, flipped, theme) {
  const f = theme.font;
  ctx.font = `${f.logo} ${size}px ${f.family}`;
  ctx.fillStyle = theme.color.ink;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  const fw = ctx.measureText('F').width;
  const rest = ctx.measureText('lip').width;
  const x0 = cx - (fw + rest) / 2;
  ctx.save();
  ctx.translate(x0 + fw / 2, cy);
  if (flipped) ctx.rotate(Math.PI);
  ctx.fillText('F', -fw / 2, 0);
  ctx.restore();
  ctx.fillText('lip', x0 + fw, cy);
}
