import { describe, expect, it } from "vitest";

import { contrastRatio } from "./contrast.js";
import { readRule, readThemeTokens, readTokenAt } from "./tokens.js";

/**
 * Como se coloca el contenido dentro del contenedor unico. Medidas tomadas de
 * www.cookyourwebai.es: texto max-w-4xl, columna corta max-w-2xl, rejillas
 * max-w-7xl, bloques destacados rounded-3xl con degradado al 20 %.
 */
describe("columnas centradas, como la agencia", () => {
  it.each([
    [".columna-texto", "56rem"], // max-w-4xl, 896 px
    [".columna-estrecha", "42rem"], // max-w-2xl, 672 px
    [".columna-formulario", "36rem"],
    [".columna-compacta", "28rem"],
    [".rejilla-tarjetas", "80rem"], // max-w-7xl, 1280 px
  ])("%s se centra y llega como mucho a %s", (selector, ancho) => {
    const regla = readRule(selector);

    expect(regla, `${selector} no existe en styles.css`).toBeDefined();
    expect(regla).toContain(`max-width: ${ancho}`);
    expect(regla).toContain("margin-inline: auto");
    expect(regla).toContain("box-sizing: border-box");
  });

  it("las rejillas separan sus tarjetas 1,5rem y 2rem desde 768 px (gap-6, md:gap-8)", () => {
    expect(readRule(".rejilla-tarjetas")).toContain("gap: var(--rejilla-hueco)");
    expect(readTokenAt("--rejilla-hueco")).toBe("1.5rem");
    expect(readTokenAt("--rejilla-hueco", 768)).toBe("2rem");
  });
});

describe("escala tipografica de pagina", () => {
  it.each([
    ["--titulo-seccion-tamano", "1.5rem", "1.875rem", undefined], // text-2xl, md:text-3xl
    ["--titulo-hero-tamano", "2.25rem", "3rem", "4.5rem"], // text-4xl, md:text-5xl, lg:text-7xl
    ["--lead-tamano", "1.125rem", "1.25rem", "1.5rem"], // text-lg, md:text-xl, lg:text-2xl
  ])("%s: %s, %s en 768 px y %s en 1024 px", (token, base, md, lg) => {
    expect(readTokenAt(token)).toBe(base);
    expect(readTokenAt(token, 768)).toBe(md);
    if (lg) expect(readTokenAt(token, 1024)).toBe(lg);
  });

  it("el titular de seccion va centrado y en negrita", () => {
    const regla = readRule(".titulo-seccion");

    expect(regla).toContain("text-align: center");
    expect(regla).toContain("font-weight: 700");
    expect(regla).toContain("font-size: var(--titulo-seccion-tamano)");
  });

  it("el hero centra su contenido en columna", () => {
    const regla = readRule(".hero");

    expect(regla).toContain("flex-direction: column");
    expect(regla).toContain("align-items: center");
    expect(regla).toContain("text-align: center");
  });
});

describe("bloque destacado", () => {
  const regla = readRule(".tarjeta-destacada") ?? "";

  it("tiene esquinas de 1,5rem (rounded-3xl), borde zinc-800 y texto centrado", () => {
    expect(regla).toContain("border-radius: 1.5rem");
    expect(regla).toContain("border: 1px solid var(--color-cyw-zinc-800)");
    expect(regla).toContain("text-align: center");
  });

  it("rellena 1,5rem y 2rem desde 768 px (p-6, md:p-8)", () => {
    expect(regla).toContain("padding: var(--tarjeta-relleno)");
    expect(readTokenAt("--tarjeta-relleno")).toBe("1.5rem");
    expect(readTokenAt("--tarjeta-relleno", 768)).toBe("2rem");
  });

  it("su degradado va de azul a purpura a rosa, de izquierda a derecha, al 20 %", () => {
    for (const color of ["azul-500", "purpura-500", "rosa-500"]) {
      expect(regla).toContain(`rgb(var(--color-cyw-${color}-rgb) / 0.2)`);
    }
    expect(regla).toMatch(/linear-gradient\(\s*to right/);
  });
});

/** Mezcla un color con alfa sobre el fondo, como lo pinta el navegador. */
function sobreFondo(rgb: string, alfa: number, fondo: number[]): string {
  const mezcla = rgb
    .split(/\s+/)
    .map(Number)
    .map((canal, i) => Math.round(canal * alfa + fondo[i] * (1 - alfa)));
  return `#${mezcla.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

describe("contraste AA del texto sobre el bloque destacado", () => {
  const tokens = readThemeTokens(":root");
  const fondo = tokens["--background-rgb"].split(/\s+/).map(Number);
  const tramos = ["azul-500", "purpura-500", "rosa-500"].map((c) => ({
    nombre: c,
    color: sobreFondo(tokens[`--color-cyw-${c}-rgb`], 0.2, fondo),
  }));

  it.each(tramos.flatMap((t) => [["blanco", t.nombre, t.color], ["zinc-300", t.nombre, t.color]]))(
    "%s sobre el tramo %s (%s) llega a 4,5:1",
    (texto, _nombre, color) => {
      expect(contrastRatio(tokens[`--color-cyw-${texto}`], color)).toBeGreaterThanOrEqual(4.5);
    },
  );

  it("el texto de apoyo (zinc-300) lee bien sobre el fondo de la pagina", () => {
    expect(contrastRatio(tokens["--color-cyw-zinc-300"], `#${fondo.map((c) => c.toString(16).padStart(2, "0")).join("")}`)).toBeGreaterThanOrEqual(4.5);
  });
});
