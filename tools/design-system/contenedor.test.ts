import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";


const leer = (ruta: string) => readFileSync(ruta, "utf8");
const css = leer("src/styles.css");

/** Valor de un token dentro del bloque :root de un punto de corte (o del base si no hay). */
function tokenEn(token: string, minWidth?: number): string | undefined {
  const bloques = [...css.matchAll(/(@media \(min-width: (\d+)px\) \{\s*)?:root \{([^}]*)\}/g)]
    .filter(([, , corte]) => (minWidth === undefined ? corte === undefined : Number(corte) === minWidth));
  for (const [, , , cuerpo] of bloques) {
    const valor = cuerpo.match(new RegExp(`${token}:\\s*([^;]+);`))?.[1].trim();
    if (valor !== undefined) return valor;
  }
  return undefined;
}

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
  ])("%s no se centra ni pone su propio relleno lateral: lo da el contenedor", (ruta) => {
    const hoja = leer(ruta);

    expect(hoja).not.toMatch(/margin:[^;]*\bauto\b/);
    expect(hoja).not.toMatch(/padding-inline:\s*1rem/);
  });

  it("la barra de la app usa el relleno compartido y no el suyo", () => {
    expect(leer("src/app/app.css")).not.toMatch(/padding:\s*0\.75rem 1rem/);
  });
});
