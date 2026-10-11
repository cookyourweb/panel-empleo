import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { readTokenAt } from "./tokens.js";


const leer = (ruta: string) => readFileSync(ruta, "utf8");
const css = leer("src/styles.css");

const tokenEn = readTokenAt;

describe("contenedor unico de la plataforma", () => {
  it("por defecto ocupa todo el ancho con 1rem de relleno, como el container de Tailwind de la cabecera", () => {
    expect(tokenEn("--contenedor-ancho")).toBe("100%");
    expect(tokenEn("--contenedor-relleno")).toBe("1rem");
  });

  it.each([
    [640, "640px"],
    [768, "768px"],
    [1024, "1024px"],
    [1280, "1280px"],
    [1536, "1536px"],
  ])("desde %i px el ancho maximo es %s", (corte, ancho) => {
    expect(tokenEn("--contenedor-ancho", corte)).toBe(ancho);
  });

  it("el relleno lateral pasa a 2rem desde 768 px, como md:px-8", () => {
    expect(tokenEn("--contenedor-relleno", 768)).toBe("2rem");
  });

  it("la clase compartida .contenedor-pagina se define una sola vez con esos tokens", () => {
    expect(css.match(/\.contenedor-pagina \{/g)).toHaveLength(1);
    const regla = css.match(/\.contenedor-pagina \{([^}]*)\}/)![1];

    expect(regla).toContain("max-width: var(--contenedor-ancho)");
    expect(regla).toContain("padding-inline: var(--contenedor-relleno)");
    expect(regla).toContain("margin-inline: auto");
    expect(regla).toContain("box-sizing: border-box");
  });

  it("la cabecera de marca no repite anchos maximos en pixeles: usa el contenedor compartido", () => {
    expect(leer("src/app/marca/cabecera-de-marca.css")).not.toMatch(/max-width:\s*\d+px/);
  });

  it.each([
    "src/app/bienvenida/bienvenida.page.css",
    "src/app/entrada/entrada.page.css",
    "src/app/alta/alta.css",
  ])("%s no fija columnas ni se centra a mano: usa las clases compartidas de styles.css", (ruta) => {
    const hoja = leer(ruta);

    expect(hoja).not.toMatch(/margin[^:]*:[^;]*\bauto\b/);
    expect(hoja).not.toMatch(/^\s+max-width:\s*[\d.]+rem/m);
    expect(hoja).not.toMatch(/padding-inline:\s*1rem/);
  });

  it.each([
    ["src/app/bienvenida/bienvenida.page.html", ["rejilla-tarjetas", "tarjeta-destacada", "columna-texto", "columna-compacta"]],
    ["src/app/entrada/entrada.page.html", ["columna-compacta", "titulo-seccion"]],
    ["src/app/cuenta/cuenta.page.html", ["columna-formulario", "titulo-seccion"]],
    ["src/app/alta/alta.page.ts", ["columna-formulario", "titulo-seccion"]],
    ["src/app/alta/consentimiento.ts", ["columna-formulario", "titulo-seccion"]],
    ["src/app/alta/revision-de-campos.ts", ["columna-formulario", "titulo-seccion"]],
    ["src/app/alta/indicador-de-pasos.ts", ["columna-formulario"]],
    ["src/app/compartido/subida-de-cv.ts", ["columna-formulario", "titulo-seccion"]],
  ])("%s coloca su contenido con las clases compartidas", (ruta, clases) => {
    const plantilla = leer(ruta);

    for (const clase of clases) expect(plantilla).toContain(clase);
  });

  it("la barra de la app usa el relleno compartido y no el suyo", () => {
    expect(leer("src/app/app.css")).not.toMatch(/padding:\s*0\.75rem 1rem/);
  });
});
