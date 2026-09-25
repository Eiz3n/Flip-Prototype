// Shared builders for sim tests.
export function blankLevel(overrides = {}) {
  return {
    index: 1, name: 'Blank',
    wave: { enabled: false, period: 6.5, startPol: +1 },
    minOrbitSpeed: 3.2, minLaunchWindow: 0.22, minCatchWindow: 0.48,
    entry: { x: 180 }, exit: { x: 265 },
    hookPoints: [], obstacles: [],
    ...overrides,
  };
}

export const still = { ampX: 0, ampY: 0 };   // spread into a hook point to switch its bob off
