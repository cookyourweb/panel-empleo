import { existsSync, readFileSync } from "node:fs";
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

  describe("favicon", () => {
    it("declara el favicon y el icono de iphone en la raiz del dominio", () => {
      expect(html).toContain('<link rel="icon" href="/favicon.ico" sizes="any">');
      expect(html).toContain('<link rel="apple-touch-icon" href="/apple-touch-icon.png">');
    });

    it("ya no trae el favicon por defecto de Angular ni el svg, que depende de la tipografia de cada visita", () => {
      expect(html).not.toContain("image/x-icon");
      expect(html).not.toContain("favicon.svg");
    });

    it("los dos ficheros existen en public/, de donde la build los copia", () => {
      expect(existsSync("public/favicon.ico")).toBe(true);
      expect(existsSync("public/apple-touch-icon.png")).toBe(true);
    });

    it("favicon.ico es un ICO de verdad, con 16, 32 y 48 px", () => {
      const ico = readFileSync("public/favicon.ico");

      // Cabecera ICONDIR: reservado 0, tipo 1 (icono), y cuantas imagenes lleva.
      expect([ico.readUInt16LE(0), ico.readUInt16LE(2)]).toEqual([0, 1]);
      const lados = Array.from({ length: ico.readUInt16LE(4) }, (_, i) => ico[6 + i * 16] || 256);
      expect(lados).toEqual(expect.arrayContaining([16, 32, 48]));
    });

    it("apple-touch-icon.png es un PNG de 180 x 180", () => {
      const png = readFileSync("public/apple-touch-icon.png");

      expect(png.subarray(1, 4).toString("ascii")).toBe("PNG");
      expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([180, 180]);
    });
  });
});
