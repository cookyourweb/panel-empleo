import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const html = readFileSync("src/index.html", "utf8");

/**
 * El contenido es español: sin lang="es" el lector de pantalla lo pronuncia
 * con la fonética del inglés (WCAG 3.1.1). El index.html no lo compila
 * ningún componente, asi que se lee del disco como la hoja de estilos.
 */
describe("index.html", () => {
  it("declara el idioma de la pagina como español", () => {
    expect(html).toMatch(/<html[^>]*\slang="es"/);
  });

  it("arranca con un titulo legible, no con el nombre del proyecto", () => {
    expect(html).toContain("<title>Panel de empleo</title>");
  });
});
