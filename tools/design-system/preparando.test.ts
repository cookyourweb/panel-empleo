import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * El aviso "Estamos preparando tu zona" sale justo después de entrar, mientras el
 * servidor arranca. Tiene que verse como el resto de la marca, no como la tarjeta
 * genérica de antes.
 */
describe("aviso de preparando tu zona", () => {
  const css = readFileSync("src/app/preparacion/preparando-zona.css", "utf8");

  it("usa los colores de la marca y no los de la tarjeta genérica", () => {
    expect(css).toContain("--color-cyw-zinc-900");
    expect(css).not.toContain("var(--card)");
  });

  it("es una tarjeta centrada con las esquinas de la web madre", () => {
    expect(css).toMatch(/text-align:\s*center/);
    expect(css).toMatch(/border-radius:\s*1\.5rem/);
  });

  it("la barra lleva el degradado azul, violeta y rosa", () => {
    const degradado = css.split("\n").find((linea) => linea.includes("linear-gradient")) ?? "";
    for (const color of ["azul-500", "purpura-500", "rosa-500"]) {
      expect(degradado).toContain(`--color-cyw-${color}`);
    }
  });
});
