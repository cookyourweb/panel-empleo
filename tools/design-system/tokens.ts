import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const STYLES_CSS = resolve(dirname(fileURLToPath(import.meta.url)), '../../src/styles.css');

/**
 * Lee los tokens declarados bajo un selector de src/styles.css.
 *
 * Lee el fichero de verdad a proposito: si alguien cambia un token y baja el
 * contraste, el test se entera. Una copia de los valores aqui pasaria siempre,
 * aunque el panel se viera ilegible.
 */
export function readThemeTokens(selector: string): Record<string, string> {
  const css = readFileSync(STYLES_CSS, 'utf8');
  const start = css.indexOf(`${selector} {`);
  if (start === -1) {
    throw new Error(`El selector ${selector} no existe en styles.css`);
  }
  const end = css.indexOf('\n}', start);
  const block = css.slice(start, end);

  const tokens: Record<string, string> = {};
  for (const [, name, value] of block.matchAll(/(--[\w-]+):\s*([^;]+);/g)) {
    tokens[name] = value.trim();
  }
  return tokens;
}
