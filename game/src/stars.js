// Stage star rating. Pure: no state, no storage.
// Time sets the base (gold 3, silver 2, else 1); any death in the stage removes one star, once.
// A clear always earns at least one star.
export const MAX_STARS = 3;

export function starsFor(timeMs, deaths, stage) {
  const base = timeMs <= stage.goldMs ? 3 : timeMs <= stage.silverMs ? 2 : 1;
  return Math.max(1, base - (deaths > 0 ? 1 : 0));
}
