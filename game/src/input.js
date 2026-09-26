// Pointer down or Space flips polarity: one call per press, holding does nothing.
// event.timeStamp is passed through for future per-tap latency use; v1 applies the fixed
// config.inputLatencyComp rewind inside the sim.
export function bindInput(pointerTarget, keyTarget, onTap) {
  const onPointer = (e) => {
    if (e.cancelable) e.preventDefault();
    onTap(e.timeStamp);
  };
  const onKey = (e) => {
    if (e.code !== 'Space') return;
    if (e.cancelable) e.preventDefault();
    if (!e.repeat) onTap(e.timeStamp);
  };
  pointerTarget.addEventListener('pointerdown', onPointer);
  keyTarget.addEventListener('keydown', onKey);
  return () => {
    pointerTarget.removeEventListener('pointerdown', onPointer);
    keyTarget.removeEventListener('keydown', onKey);
  };
}
