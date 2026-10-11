import { describe, expect, it } from "vitest";

import { contrastRatio } from "./contrast.js";
import { readThemeTokens } from "./tokens.js";

/**
 * La cabecera y el pie de CookYourWeb AI usan la paleta por defecto de Tailwind v3
 * de www.cookyourwebai.es. Si un valor se desvia, la plataforma deja de verse como
 * la agencia, y esto es lo que lo avisa.
 */
describe("tokens de la cabecera y el pie de marca", () => {
  const tokens = readThemeTokens(":root");

  it.each([
    ["--color-cyw-negro", "#000000"],
    ["--color-cyw-zinc-300", "#d4d4d8"],
    ["--color-cyw-zinc-400", "#a1a1aa"],
    ["--color-cyw-zinc-500", "#71717a"],
    ["--color-cyw-zinc-800", "#27272a"],
    ["--color-cyw-azul-400", "#60a5fa"],
    ["--color-cyw-azul-300", "#93c5fd"],
    ["--color-cyw-purpura-500", "#a855f7"],
    ["--color-cyw-purpura-400", "#c084fc"],
    ["--color-cyw-verde-400", "#4ade80"],
    ["--color-cyw-verde-500", "#22c55e"],
    ["--color-cyw-rojo-400", "#f87171"],
    ["--color-cyw-rosa-500", "#ec4899"],
  ])("%s vale %s, como en la especificacion", (token, valor) => {
    expect(tokens[token]).toBe(valor);
  });

  it.each([
    ["--color-cyw-negro-rgb", "--color-cyw-negro"],
    ["--color-cyw-zinc-800-rgb", "--color-cyw-zinc-800"],
    ["--color-cyw-azul-500-rgb", "--color-cyw-azul-500"],
    ["--color-cyw-purpura-500-rgb", "--color-cyw-purpura-500"],
    ["--color-cyw-verde-500-rgb", "--color-cyw-verde-500"],
    ["--color-cyw-rosa-500-rgb", "--color-cyw-rosa-500"],
  ])("%s es el mismo color que %s, en componentes R G B", (rgb, hex) => {
    const [r, g, b] = tokens[rgb].split(/\s+/).map(Number);
    const esperado = `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;

    expect(esperado).toBe(tokens[hex]);
  });

  /** Los textos que la especificacion pone sobre negro y que si llegan a AA (4,5:1). */
  it.each([
    ["--color-cyw-zinc-300"],
    ["--color-cyw-zinc-400"],
    ["--color-cyw-azul-400"],
    ["--color-cyw-purpura-400"],
    ["--color-cyw-verde-400"],
  ])("%s sobre negro pasa AA", (texto) => {
    expect(contrastRatio(tokens["--color-cyw-negro"], tokens[texto])).toBeGreaterThanOrEqual(4.5);
  });

  it("el tooltip (blanco sobre zinc-800) pasa AA", () => {
    expect(contrastRatio(tokens["--color-cyw-zinc-800"], tokens["--color-cyw-blanco"])).toBeGreaterThanOrEqual(4.5);
  });

  it("las medidas de la cabecera fija dejan libre lo que la especificacion pide: 96 px y 128 px desde 768 px", async () => {
    const { readFileSync } = await import("node:fs");
    const css = readFileSync("src/styles.css", "utf8");

    expect(css).toMatch(/:root \{\s*--cabecera-espacio: 6rem;/);
    expect(css).toMatch(/@media \(min-width: 768px\) \{\s*:root \{\s*--cabecera-espacio: 8rem;/);
  });
});

describe("curva de las transiciones de la cabecera de marca", () => {
  it("--suave existe: sin ella el navegador descarta cada transition que la usa", () => {
    expect(readThemeTokens(":root")["--suave"]).toBe("cubic-bezier(0.4, 0, 0.2, 1)");
  });
});
