import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { contrastRatio } from "./contrast.js";
import { readThemeTokens } from "./tokens.js";

/**
 * Sistema de botones y tarjetas de CookYourWeb AI (Tailwind v3 por defecto).
 * La web madre usa texto blanco sobre las paradas -500 del degradado, que NO
 * llegan a AA. Aqui los botones usan las paradas -600 y estos tests lo fijan.
 */
const css = readFileSync("src/styles.css", "utf8");
const tokens = readThemeTokens(":root");

/** Cuerpo de la regla `selector { ... }` (primera aparicion exacta). */
function regla(selector: string): string {
  const escapado = selector.replace(/[.*+?^${}()|[\]\\:>~]/g, "\\$&");
  const m = css.match(new RegExp(`(?:^|\\n|\\})\\s*${escapado}\\s*\\{([^}]*)\\}`));
  if (!m) throw new Error(`No hay regla ${selector}`);
  return m[1];
}

/** El CSS sin los bloques `@media (prefers-reduced-motion: no-preference)`. */
function sinMovimientoOpcional(): string {
  const inicio = css.indexOf("@media (prefers-reduced-motion: no-preference)");
  if (inicio === -1) return css;
  let profundidad = 0;
  let fin = css.indexOf("{", inicio);
  for (let i = fin; i < css.length; i++) {
    if (css[i] === "{") profundidad++;
    if (css[i] === "}") {
      profundidad--;
      if (profundidad === 0) {
        fin = i + 1;
        break;
      }
    }
  }
  return css.slice(0, inicio) + css.slice(fin);
}

describe("tokens de color de los botones y las tarjetas", () => {
  it.each([
    ["--color-cyw-azul-600", "#2563eb"],
    ["--color-cyw-purpura-600", "#9333ea"],
    ["--color-cyw-rosa-600", "#db2777"],
    ["--color-cyw-rojo-500", "#ef4444"],
    ["--color-cyw-rojo-600", "#dc2626"],
    ["--color-cyw-rojo-700", "#b91c1c"],
    ["--color-cyw-naranja-500", "#f97316"],
    ["--color-cyw-esmeralda-500", "#10b981"],
    ["--color-cyw-turquesa-500", "#14b8a6"],
    ["--color-cyw-celeste-500", "#06b6d4"],
    ["--color-cyw-zinc-600", "#52525b"],
    ["--color-cyw-zinc-700", "#3f3f46"],
    ["--color-cyw-zinc-900", "#18181b"],
  ])("%s vale %s, como en Tailwind v3", (token, valor) => {
    expect(tokens[token]).toBe(valor);
  });

  it.each([
    ["--color-cyw-zinc-900-rgb", "--color-cyw-zinc-900"],
    ["--color-cyw-esmeralda-500-rgb", "--color-cyw-esmeralda-500"],
  ])("%s es el mismo color que %s en componentes R G B", (rgb, hex) => {
    const [r, g, b] = tokens[rgb].split(/\s+/).map(Number);
    const esperado = `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
    expect(esperado).toBe(tokens[hex]);
  });
});

describe("contraste AA de los botones (texto normal en negrita: 4,5:1)", () => {
  const blanco = () => tokens["--color-cyw-blanco"];

  it.each([
    ["--color-cyw-azul-600"],
    ["--color-cyw-purpura-600"],
    ["--color-cyw-rosa-600"],
    ["--color-cyw-rojo-600"],
    ["--color-cyw-rojo-700"],
    ["--color-cyw-zinc-800"],
    ["--color-cyw-zinc-700"],
  ])("texto blanco sobre %s pasa AA", (fondo) => {
    expect(contrastRatio(tokens[fondo], blanco())).toBeGreaterThanOrEqual(4.5);
  });

  it("documenta por que no se usan las paradas -500: el blanco no llega a AA en ninguna", () => {
    for (const parada of ["azul-500", "purpura-500", "rosa-500"]) {
      expect(contrastRatio(tokens[`--color-cyw-${parada}`], blanco())).toBeLessThan(4.5);
    }
  });

  it("el boton claro: morado-600 sobre blanco pasa AA", () => {
    expect(contrastRatio(blanco(), tokens["--color-cyw-purpura-600"])).toBeGreaterThanOrEqual(4.5);
  });

  it.each([["--color-cyw-esmeralda-500"], ["--color-cyw-azul-500"]])(
    "la pildora usa texto negro sobre %s y pasa AA",
    (fondo) => {
      expect(contrastRatio(tokens[fondo], tokens["--color-cyw-negro"])).toBeGreaterThanOrEqual(4.5);
    },
  );

  it("el anillo de foco blanco se ve (3:1) sobre el negro de la pagina y sobre el boton azul", () => {
    expect(contrastRatio(tokens["--color-cyw-negro"], blanco())).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(tokens["--color-cyw-azul-600"], blanco())).toBeGreaterThanOrEqual(3);
  });

  it("el titulo de tarjeta en azul-400 sobre el interior negro pasa AA", () => {
    expect(contrastRatio(tokens["--color-cyw-negro"], tokens["--color-cyw-azul-400"])).toBeGreaterThanOrEqual(4.5);
  });
});

describe("clases del sistema de botones", () => {
  it.each([
    ".boton",
    ".boton--primario",
    ".boton--secundario",
    ".boton--claro",
    ".boton--opcion",
    ".boton--neutro",
    ".boton--peligro",
    ".boton--grande",
  ])("existe %s", (selector) => {
    expect(() => regla(selector)).not.toThrow();
  });

  it("la base parece un boton: relleno, radio, negrita y 44 px de objetivo minimo", () => {
    const base = regla(".boton");
    expect(base).toContain("min-height: 2.75rem");
    expect(base).toContain("min-width: 2.75rem");
    expect(base).toContain("font-weight: 700");
    expect(base).toMatch(/border-radius: 0\.75rem/);
    expect(base).toContain("cursor: pointer");
    expect(base).toContain("text-decoration: none");
  });

  it("el primario es el degradado de 3 paradas azul, purpura y rosa", () => {
    const r = regla(".boton--primario");
    expect(r).toContain("linear-gradient(to right");
    expect(r).toContain("var(--color-cyw-azul-600)");
    expect(r).toContain("var(--color-cyw-purpura-600)");
    expect(r).toContain("var(--color-cyw-rosa-600)");
  });

  it("el secundario es el degradado de 2 paradas azul y purpura", () => {
    const r = regla(".boton--secundario");
    expect(r).toContain("var(--color-cyw-azul-600)");
    expect(r).toContain("var(--color-cyw-purpura-600)");
    expect(r).not.toContain("rosa");
  });

  it("el peligro es rojo solido, nunca el degradado de marca", () => {
    const r = regla(".boton--peligro");
    expect(r).toContain("var(--color-cyw-rojo-600)");
    expect(r).not.toContain("gradient");
  });

  it("la opcion ocupa todo el ancho y se alinea a la izquierda", () => {
    const r = regla(".boton--opcion");
    expect(r).toContain("width: 100%");
    expect(r).toContain("justify-content: flex-start");
  });

  it("el foco visible se dibuja con un anillo blanco de 2 px y separacion", () => {
    const r = regla(".boton:focus-visible");
    expect(r).toContain("outline: 2px solid var(--color-cyw-blanco)");
    expect(r).toContain("outline-offset: 2px");
  });

  it("el estado deshabilitado baja la opacidad al 60 % y no muestra puntero de clic", () => {
    const r = regla(".boton:disabled");
    expect(r).toContain("opacity: 0.6");
    expect(r).toContain("cursor: not-allowed");
  });

  it("hover:scale solo existe dentro de prefers-reduced-motion: no-preference", () => {
    expect(css).toContain("@media (prefers-reduced-motion: no-preference)");
    expect(css).toMatch(/prefers-reduced-motion: no-preference\)[\s\S]*\.boton:hover[\s\S]*scale\(1\.05\)/);
    expect(sinMovimientoOpcional()).not.toMatch(/scale\(/);
  });

  it("con movimiento reducido las transiciones se anulan", () => {
    expect(css).toMatch(/prefers-reduced-motion: reduce\)[\s\S]*transition: none/);
  });
});

describe("clases del sistema de tarjetas", () => {
  it("la tarjeta es el marco de degradado con p-1, rounded-3xl y sombra", () => {
    const r = regla(".tarjeta");
    expect(r).toContain("padding: 0.25rem");
    expect(r).toContain("border-radius: 1.5rem");
    expect(r).toContain("overflow: hidden");
    expect(r).toContain("linear-gradient(to bottom right");
  });

  it("el interior es negro al 90 %", () => {
    const r = regla(".tarjeta__interior");
    expect(r).toContain("rgb(var(--color-cyw-negro-rgb) / 0.9)");
    expect(r).toContain("height: 100%");
    expect(r).toContain("flex-direction: column");
  });

  it.each([
    [".tarjeta--azul-rosa", ["azul-500", "purpura-500", "rosa-500"]],
    [".tarjeta--esmeralda-celeste", ["esmeralda-500", "turquesa-500", "celeste-500"]],
    [".tarjeta--verde-purpura", ["verde-500", "azul-500", "purpura-500"]],
    [".tarjeta--esmeralda-azul", ["esmeralda-500", "turquesa-500", "azul-500"]],
    [".tarjeta--rosa-naranja", ["rosa-500", "rojo-500", "naranja-500"]],
  ])("%s lleva sus tres paradas", (selector, paradas) => {
    const r = regla(selector);
    for (const p of paradas) expect(r).toContain(`var(--color-cyw-${p})`);
  });

  it("el titulo de tarjeta sigue la escala de la web madre: text-2xl, y text-3xl desde 768 px", () => {
    const r = regla(".tarjeta__titulo");
    expect(r).toContain("var(--titulo-seccion-tamano)");
    expect(r).toContain("font-weight: 700");
    expect(r).toContain("line-height: 1.25");
  });

  it("la tarjeta de plan: zinc-900 al 90 %, desenfoque, borde de 2 px zinc-800 y borde azul al pasar el raton", () => {
    const r = regla(".tarjeta-plan");
    expect(r).toContain("rgb(var(--color-cyw-zinc-900-rgb) / 0.9)");
    expect(r).toContain("backdrop-filter: blur(");
    expect(r).toContain("2px solid var(--color-cyw-zinc-800)");
    expect(regla(".tarjeta-plan:hover")).toContain("var(--color-cyw-azul-500)");
  });

  it("la caja CTA lleva borde de 2 px esmeralda", () => {
    expect(regla(".tarjeta-cta")).toContain("2px solid var(--color-cyw-esmeralda-500)");
  });

  it("el panel suave: zinc-800 al 50 % y rounded-xl", () => {
    const r = regla(".panel-suave");
    expect(r).toContain("rgb(var(--color-cyw-zinc-800-rgb) / 0.5)");
    expect(r).toContain("border-radius: 0.75rem");
    expect(r).toContain("padding: 1rem");
  });

  it("la pildora: redondeada, xs y negrita, con degradado esmeralda a azul", () => {
    const r = regla(".pildora");
    expect(r).toContain("border-radius: 9999px");
    expect(r).toContain("font-size: 0.75rem");
    expect(r).toContain("font-weight: 700");
    expect(r).toContain("var(--color-cyw-esmeralda-500)");
    expect(r).toContain("var(--color-cyw-azul-500)");
  });
});
