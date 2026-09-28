// Pointer down or Space taps; arrow keys step the stage select. One call per press, holding does nothing.
// onTap gets the pointer's client position ({ x, y }) or null for Space; main.js maps it to room units.
const ARROWS = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };

export function bindInput(pointerTarget, keyTarget, onTap, onArrow = () => {}) {
  const onPointer = (e) => {
    if (e.cancelable) e.preventDefault();
    onTap({ x: e.clientX, y: e.clientY });
  };
  const onKey = (e) => {
    const dir = ARROWS[e.code];
    if (e.code !== 'Space' && !dir) return;
    if (e.cancelable) e.preventDefault();
    if (e.repeat) return;
    if (dir) onArrow(dir);
    else onTap(null);
  };
  pointerTarget.addEventListener('pointerdown', onPointer);
  keyTarget.addEventListener('keydown', onKey);
  return () => {
    pointerTarget.removeEventListener('pointerdown', onPointer);
    keyTarget.removeEventListener('keydown', onKey);
  };
}
