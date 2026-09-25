// A Canvas 2D stand-in that records every call and property write, tracks save/restore, and
// enforces the flat-art rule (no gradients, patterns, shadows or filters).
export function recordingCtx() {
  const log = [];
  const state = {
    fillStyle: '#000000', strokeStyle: '#000000', globalAlpha: 1, lineWidth: 1,
    font: '10px sans-serif', textAlign: 'start', textBaseline: 'alphabetic', lineCap: 'butt',
  };
  const stack = [];
  const banned = new Set(['createLinearGradient', 'createRadialGradient', 'createConicGradient', 'createPattern']);
  const snapshot = () => ({ fill: state.fillStyle, stroke: state.strokeStyle, alpha: state.globalAlpha, font: state.font, lineWidth: state.lineWidth });
  const api = {
    save() { stack.push({ ...state }); },
    restore() { Object.assign(state, stack.pop() ?? {}); },
    measureText(s) {
      const size = parseFloat((/(\d+(?:\.\d+)?)px/.exec(state.font) ?? [0, 10])[1]);
      return { width: String(s).length * size * 0.55, actualBoundingBoxAscent: size * 0.7, actualBoundingBoxDescent: size * 0.1 };
    },
  };
  return new Proxy(api, {
    get(t, k) {
      if (banned.has(k)) throw new Error(`flat art rule: ${String(k)}`);
      if (k === 'log') return log;
      if (k in t) return t[k];
      if (k in state) return state[k];
      return (...args) => { log.push({ op: 'call', name: k, args, ...snapshot() }); };
    },
    set(t, k, v) {
      if ((k === 'shadowBlur' && v > 0) || k === 'filter') throw new Error(`flat art rule: ${String(k)}`);
      state[k] = v;
      log.push({ op: 'set', name: k, value: v, ...snapshot() });
      return true;
    },
  });
}
