// Per-stage bests: fastest stage time and most stars, kept separately (a slower clear with no
// deaths can still raise the stars). Pure apart from the injected storage; blocked or corrupt
// storage reads as no progress and never throws.

export function emptyProgress() {
  return { stages: {} };
}

export function loadProgress(storage, key) {
  try {
    const raw = storage ? storage.getItem(key) : null;
    const data = raw == null ? null : JSON.parse(raw);
    const out = emptyProgress();
    if (!data || typeof data.stages !== 'object' || data.stages === null) return out;
    for (const [n, s] of Object.entries(data.stages)) {
      const bestMs = Number(s?.bestMs), stars = Number(s?.stars);
      if (Number.isFinite(bestMs) && bestMs > 0 && Number.isInteger(stars) && stars >= 1) out.stages[n] = { bestMs, stars };
    }
    return out;
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(storage, key, progress) {
  try {
    if (storage) storage.setItem(key, JSON.stringify(progress));
  } catch {
    // Storage blocked: keep the in-memory progress only.
  }
}

// Records one cleared stage (1-based number). Returns true when the time is a new best.
export function recordStage(progress, stage, timeMs, stars) {
  const key = String(stage);
  const prev = progress.stages[key];
  const newBest = !prev || timeMs < prev.bestMs;
  progress.stages[key] = {
    bestMs: newBest ? timeMs : prev.bestMs,
    stars: prev ? Math.max(prev.stars, stars) : stars,
  };
  return newBest;
}

export function starTotal(progress) {
  let n = 0;
  for (const s of Object.values(progress.stages)) n += s.stars;
  return n;
}
