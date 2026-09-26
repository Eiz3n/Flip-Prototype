// HUD row (canvas Room 1 / Room 2): "n / N" left, timer centre (tabular, tenths), "× d" right.
import { config } from '../../config.js';
import { centredBaseline } from './marks.js';

const DIGITS = '0123456789';
const isDigit = (ch) => ch >= '0' && ch <= '9';
const pad2 = (n) => (n < 10 ? '0' : '') + n;

export function formatTime(ms) {
  const m = Math.floor(ms / 60000);
  const s = Math.floor(ms / 1000) % 60;
  const t = Math.floor(ms / 100) % 10;
  return `${m}:${pad2(s)}.${t}`;
}

// Fixed-width digit cells so a counting timer never shifts. Uses the current ctx.font.
export function drawTabular(ctx, text, cx, y) {
  let cell = 0;
  for (const d of DIGITS) cell = Math.max(cell, ctx.measureText(d).width);
  let x = cx - tabularWidth(ctx, text) / 2;
  ctx.textAlign = 'center';
  for (const ch of text) {
    const w = isDigit(ch) ? cell : ctx.measureText(ch).width;
    ctx.fillText(ch, x + w / 2, y);
    x += w;
  }
}

export function tabularWidth(ctx, text) {
  let cell = 0;
  for (const d of DIGITS) cell = Math.max(cell, ctx.measureText(d).width);
  let total = 0;
  for (const ch of text) total += isDigit(ch) ? cell : ctx.measureText(ch).width;
  return total;
}

export function drawHud(ctx, hud, theme) {
  const f = theme.font, h = theme.hud, R = config.room;
  const y = h.y + h.rowHeight / 2;
  ctx.fillStyle = theme.color.ink;
  ctx.font = `${f.hud} ${f.hudSize}px ${f.family}`;
  const base = centredBaseline(ctx, y, f.hudSize);

  // Room label, popping once when the room is cleared.
  const k = hud.roomPop > 0 ? 1 - hud.roomPop / theme.fx.roomPopTime : 1;
  const s = hud.roomPop > 0 ? 1 + (theme.fx.roomPopScale - 1) * Math.sin(Math.PI * k) : 1;
  ctx.textAlign = 'left';
  ctx.save();
  ctx.translate(h.sidePad, y);
  if (s !== 1) ctx.scale(s, s);
  ctx.fillText(`${hud.room} / ${hud.rooms}`, 0, base - y);
  ctx.restore();

  ctx.textAlign = 'right';
  ctx.fillText(`× ${hud.deaths}`, R.width - h.sidePad, base);

  ctx.font = `${f.hud} ${f.timerSize}px ${f.family}`;
  drawTabular(ctx, formatTime(hud.timeMs), R.width / 2, centredBaseline(ctx, y, f.timerSize));
}
