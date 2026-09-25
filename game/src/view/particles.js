// Fixed pool of solid dots. Never allocates after createParticles().
export const POOL_SIZE = 200;

export function createParticles() {
  const items = [];
  for (let i = 0; i < POOL_SIZE; i++) {
    items.push({ alive: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 1, color: '#26252E', size: 2, alpha: 1 });
  }
  return { items, next: 0 };
}

export function spawn(pool, x, y, vx, vy, life, color, size, alpha = 1) {
  const p = pool.items[pool.next];
  pool.next = (pool.next + 1) % POOL_SIZE;
  p.alive = true;
  p.x = x; p.y = y; p.vx = vx; p.vy = vy;
  p.life = life; p.maxLife = life;
  p.color = color; p.size = size; p.alpha = alpha;
}

export function burst(pool, x, y, count, speed, life, color, size) {
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const s = speed * (0.6 + 0.4 * ((i * 7) % count) / count);   // deterministic speed spread
    spawn(pool, x, y, Math.cos(a) * s, Math.sin(a) * s, life, color, size);
  }
}

export function updateParticles(pool, dt) {
  for (const p of pool.items) {
    if (!p.alive) continue;
    p.life -= dt;
    if (p.life <= 0) { p.alive = false; continue; }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }
}

// Opacity = the particle's own alpha × a four-step fade over its life (flat look, no smooth fade).
export function drawParticles(ctx, pool) {
  for (const p of pool.items) {
    if (!p.alive) continue;
    ctx.globalAlpha = p.alpha * (Math.ceil((p.life / p.maxLife) * 4) / 4);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}
