// In-place 2D helpers on plain {x, y} objects. Nothing here allocates.

export function set(o, x, y) { o.x = x; o.y = y; return o; }

export function len(x, y) { return Math.sqrt(x * x + y * y); }

export function clampLen(v, max) {
  const l = len(v.x, v.y);
  if (l > max) { const s = max / l; v.x *= s; v.y *= s; }
  return v;
}

export function rotate(v, rad) {
  const c = Math.cos(rad), s = Math.sin(rad);
  const x = v.x * c - v.y * s;
  v.y = v.x * s + v.y * c;
  v.x = x;
  return v;
}
