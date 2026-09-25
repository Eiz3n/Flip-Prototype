import { config } from '../../config.js';

const pad2 = (n) => (n < 10 ? '0' : '') + n;

export function formatTime(ms) {
  const m = Math.floor(ms / 60000);
  const s = Math.floor(ms / 1000) % 60;
  const cs = Math.floor(ms / 10) % 100;
  return `${m}:${pad2(s)}.${pad2(cs)}`;
}

// hud = { room, rooms, timeMs, deaths, roomPop }
export function drawHud(ctx, hud, theme) {
  const f = theme.font, y = theme.hud.y, pad = theme.hud.sidePad;
  ctx.fillStyle = theme.color.ink;
  ctx.textBaseline = 'top';
  const pop = hud.roomPop > 0 ? 1 + 0.3 * (hud.roomPop / theme.fx.roomPopTime) : 1;
  ctx.font = `${f.hud} ${Math.round(f.hudSize * pop)}px ${f.family}`;
  ctx.textAlign = 'left';
  ctx.fillText(`${hud.room} / ${hud.rooms}`, pad, y);
  ctx.font = `${f.hud} ${f.hudSize}px ${f.family}`;
  ctx.textAlign = 'center';
  ctx.fillText(formatTime(hud.timeMs), config.room.width / 2, y);
  ctx.textAlign = 'right';
  ctx.fillText(`× ${hud.deaths}`, config.room.width - pad, y);
}
