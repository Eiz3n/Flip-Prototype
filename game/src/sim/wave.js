// Two-band wall wave. A front moves top → bottom over `period` seconds;
// above it the walls show the new polarity, below it the old one.

export function polarityAt(s, t, period, height, startPol) {
  const n = Math.floor(t / period - s / height) + 1;
  return (n & 1) ? -startPol : startPol;
}

export function frontY(t, period, height) {
  return ((t / period) % 1) * height;
}

export function wallPolAt(room, y) {
  const w = room.wave;
  if (!w.enabled) return w.startPol;
  return polarityAt(y, room.time, w.period, room.height, w.startPol);
}
