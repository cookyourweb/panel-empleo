import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

interface Condicion {
  type: string;
  key: string;
  value?: string;
}
interface Redireccion {
  source: string;
  destination: string;
  permanent?: boolean;
  has?: Condicion[];
}
interface Reescritura {
  source: string;
  destination: string;
}
interface Cabeceras {
  source: string;
  headers: { key: string; value: string }[];
}
interface ConfiguracionDeVercel {
  outputDirectory: string;
  redirects: Redireccion[];
  rewrites: Reescritura[];
  headers: Cabeceras[];
}

const config: ConfiguracionDeVercel = JSON.parse(readFileSync("vercel.json", "utf8"));
const angular = JSON.parse(readFileSync("angular.json", "utf8"));
const i18n = angular.projects["panel-empleo"].i18n;
const IDIOMAS: string[] = [i18n.sourceLocale.subPath, ...Object.values<{ subPath: string }>(i18n.locales).map((l) => l.subPath)];

/**
 * Con una build por idioma, dist/panel-empleo/browser no tiene index.html: tiene
 * es/index.html y en/index.html. El enrutado de Vercel tiene que reflejarlo, y
 * esto se lee del disco como el resto de configuracion que ningun componente compila.
 */
describe("vercel.json", () => {
  it("sirve la salida de la build, que tiene una carpeta por idioma", () => {
    expect(config.outputDirectory).toBe("dist/panel-empleo/browser");
    expect(IDIOMAS).toEqual(["es", "en"]);
  });

  describe("rutas por idioma", () => {
    it.each(IDIOMAS)("/%s/* cae en el index.html de ese idioma, para que la SPA resuelva la ruta", (idioma) => {
      expect(config.rewrites).toContainEqual({ source: `/${idioma}/:path*`, destination: `/${idioma}/index.html` });
    });

    it("no reescribe nada a un /index.html raiz que ya no existe", () => {
      for (const regla of config.rewrites) expect(regla.destination).not.toBe("/index.html");
    });

    it("no reescribe fuera de los prefijos de idioma: los ficheros estaticos se sirven tal cual", () => {
      for (const regla of config.rewrites) expect(regla.source).toMatch(/^\/(es|en)\//);
    });
  });

  describe("redireccion de la raiz", () => {
    const deLaRaiz = () => config.redirects.filter((r) => r.source === "/");
    const cabeceraDeIdioma = (r: Redireccion) => r.has?.find((c) => c.type === "header" && c.key.toLowerCase() === "accept-language");

    it("quien pide en español va a /es/", () => {
      const regla = deLaRaiz().find((r) => r.destination === "/es/");
      const condicion = regla && cabeceraDeIdioma(regla);

      expect(condicion).toBeDefined();
      const patron = new RegExp(condicion!.value!);
      expect(patron.test("es")).toBe(true);
      expect(patron.test("es-ES,es;q=0.9,en;q=0.8")).toBe(true);
      expect(patron.test("es-MX")).toBe(true);
    });

    it("quien pide en otro idioma, o en ninguno, va a /en/", () => {
      const reglas = deLaRaiz();
      const ultima = reglas[reglas.length - 1];

      expect(ultima.destination).toBe("/en/");
      expect(ultima.has).toBeUndefined();
    });

    it("el español se comprueba antes que el valor por defecto: gana la primera que coincide", () => {
      const destinos = deLaRaiz().map((r) => r.destination);

      expect(destinos).toEqual(["/es/", "/en/"]);
    });

    it("no distingue el español de otro idioma que solo empiece parecido", () => {
      const condicion = cabeceraDeIdioma(deLaRaiz().find((r) => r.destination === "/es/")!);
      const patron = new RegExp(condicion!.value!);

      expect(patron.test("en-US,en;q=0.9,es;q=0.8")).toBe(false);
      expect(patron.test("eso")).toBe(false);
      expect(patron.test("")).toBe(false);
    });

    it("son temporales: la preferencia de idioma de quien llega puede cambiar", () => {
      for (const regla of deLaRaiz()) expect(regla.permanent).toBe(false);
    });
  });

  describe("cabeceras de seguridad", () => {
    const todas = () => config.headers.find((h) => h.source === "/(.*)")?.headers ?? [];

    it("se aplican a todas las rutas", () => {
      expect(todas()).toContainEqual({ key: "X-Content-Type-Options", value: "nosniff" });
      expect(todas()).toContainEqual({ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" });
      expect(todas()).toContainEqual({ key: "X-Frame-Options", value: "DENY" });
    });
  });
});
