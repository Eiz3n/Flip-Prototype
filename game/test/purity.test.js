import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { test, expect } from 'vitest';

const SIM_DIR = fileURLToPath(new URL('../src/sim/', import.meta.url));
const BANNED = [
  /\bwindow\b/, /\bdocument\b/, /\bperformance\b/, /\bDate\b/,
  /Math\.random/, /getContext/, /localStorage/, /requestAnimationFrame/,
];

function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

test('src/sim/ never touches the DOM, the clock or randomness', () => {
  const files = readdirSync(SIM_DIR).filter((f) => f.endsWith('.js'));
  for (const file of files) {
    const code = stripComments(readFileSync(join(SIM_DIR, file), 'utf8'));
    for (const pattern of BANNED) {
      expect(code, `${file} uses ${pattern}`).not.toMatch(pattern);
    }
  }
});
