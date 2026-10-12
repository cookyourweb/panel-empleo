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

/**
 * Valor de un token declarado en un bloque :root de src/styles.css.
 * Sin minWidth lee los bloques base; con minWidth, el bloque de ese punto de corte.
 */
export function readTokenAt(token: string, minWidth?: number): string | undefined {
  const css = readFileSync(STYLES_CSS, 'utf8');
  const bloques = [...css.matchAll(/(@media \(min-width: (\d+)px\) \{\s*)?:root \{([^}]*)\}/g)].filter(([, , corte]) =>
    minWidth === undefined ? corte === undefined : Number(corte) === minWidth,
  );
  for (const [, , , cuerpo] of bloques) {
    const valor = cuerpo.match(new RegExp(`${token}:\\s*([^;]+);`))?.[1].trim();
    if (valor !== undefined) return valor;
  }
  return undefined;
}

/** Cuerpo de la primera regla `selector { ... }` de src/styles.css (sin media queries). */
export function readRule(selector: string): string | undefined {
  const css = readFileSync(STYLES_CSS, 'utf8');
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return css.match(new RegExp(`(?:^|\\n)${escaped} \\{([^}]*)\\}`))?.[1];
}
