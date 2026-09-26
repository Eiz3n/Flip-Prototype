// DEV ONLY. Simulates colour-vision deficiency on the canvas element (Machado et al. 2009,
// severity 1.0) so the + / − marks can be checked. CSS filter on the element, not ctx.filter.
const MATRICES = {
  protan: '0.152286 1.052583 -0.204868 0 0  0.114503 0.786281 0.099216 0 0  -0.003882 -0.048116 1.051998 0 0  0 0 0 1 0',
  deutan: '0.367322 0.860646 -0.227968 0 0  0.280085 0.672501 0.047413 0 0  -0.011820 0.042940 0.968881 0 0  0 0 0 1 0',
  tritan: '1.255528 -0.076749 -0.178779 0 0  -0.078411 0.930809 0.147602 0 0  0.004733 0.691367 0.303900 0 0  0 0 0 1 0',
};

export function applyColourBlindFilter(canvas, kind) {
  const values = MATRICES[kind];
  if (!values) return false;
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.style.position = 'absolute';
  const filter = document.createElementNS(ns, 'filter');
  filter.setAttribute('id', `cb-${kind}`);
  const m = document.createElementNS(ns, 'feColorMatrix');
  m.setAttribute('type', 'matrix');
  m.setAttribute('values', values);
  filter.appendChild(m);
  svg.appendChild(filter);
  document.body.appendChild(svg);
  canvas.style.filter = `url(#cb-${kind})`;
  return true;
}
