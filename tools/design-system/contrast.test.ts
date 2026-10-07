import { describe, expect, it } from "vitest";

import { contrastRatio } from "./contrast.js";
import { readThemeTokens } from "./tokens.js";

describe("contrastRatio", () => {
  it("da 21:1 entre negro y blanco, que es el maximo posible", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 1);
  });
});

describe("tema oscuro", () => {
  it("el texto sobre el fondo pasa AA", () => {
    const tokens = readThemeTokens(":root");

    expect(contrastRatio(tokens["--background"], tokens["--foreground"])).toBeGreaterThanOrEqual(4.5);
  });
});

/**
 * Cada par semantico existe para llevar el contraste incorporado: un componente
 * que pide bg-primary text-primary-foreground no deberia poder quedar ilegible.
 * Si uno de estos baja de AA, el sistema esta roto aunque el sitio "se vea bien".
 */
const PARES_DE_TEXTO = [
  ["--background", "--foreground"],
  ["--card", "--card-foreground"],
  ["--popover", "--popover-foreground"],
  ["--primary", "--primary-foreground"],
  ["--secondary", "--secondary-foreground"],
  ["--muted", "--muted-foreground"],
  ["--accent", "--accent-foreground"],
  ["--destructive", "--destructive-foreground"],
] as const;

describe.each([
  ["oscuro", ":root"],
  ["claro", ".light"],
])("tema %s", (_nombre, selector) => {
  const tokens = readThemeTokens(selector);

  it.each(PARES_DE_TEXTO)("%s sobre %s pasa AA para texto normal", (fondo, texto) => {
    expect(contrastRatio(tokens[fondo], tokens[texto])).toBeGreaterThanOrEqual(4.5);
  });

  /**
   * WCAG 1.4.11: los elementos que no son texto pero hacen falta para
   * identificar un control (el borde de un campo, el anillo de foco)
   * necesitan 3:1 contra lo que tienen detras. Un foco que no se ve deja
   * la navegacion por teclado a ciegas.
   */
  it.each(["--border", "--input", "--ring", "--error-borde"])("%s se distingue del fondo", (token) => {
    expect(contrastRatio(tokens["--background"], tokens[token])).toBeGreaterThanOrEqual(3);
  });
});
