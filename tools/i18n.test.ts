import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

interface Unidad {
  id: string;
  origen: string;
  destino: string | null;
}

/** Los ids de cada mensaje y sus textos, leidos del xlf sin cargar un parser de XML. */
function unidades(ruta: string): Unidad[] {
  const xlf = readFileSync(ruta, "utf8");
  return [...xlf.matchAll(/<unit id="([^"]+)">([\s\S]*?)<\/unit>/g)].map(([, id, cuerpo]) => ({
    id,
    origen: /<source>([\s\S]*?)<\/source>/.exec(cuerpo)?.[1] ?? "",
    destino: /<target>([\s\S]*?)<\/target>/.exec(cuerpo)?.[1] ?? null,
  }));
}

const marcadores = (texto: string) => [...texto.matchAll(/<ph id="(\d+)"/g)].map((m) => m[1]).sort();

const angular = JSON.parse(readFileSync("angular.json", "utf8"));
const i18n = angular.projects["panel-empleo"].i18n;
const ORIGEN = "src/locale/messages.xlf";
const IDIOMAS: [string, string][] = Object.entries<{ translation: string }>(i18n.locales).map(([codigo, l]) => [codigo, l.translation]);
const origen = unidades(ORIGEN);

function ficherosDeCodigo(extension: RegExp): { ruta: string; texto: string }[] {
  return (readdirSync("src/app", { recursive: true }) as string[])
    .filter((ruta) => extension.test(ruta) && !ruta.endsWith(".spec.ts"))
    .map((ruta) => ({ ruta: `src/app/${ruta}`, texto: readFileSync(`src/app/${ruta}`, "utf8") }));
}

/**
 * Una build por idioma: si falta un mensaje en un idioma, Angular lo deja en
 * español sin avisar, y quien lo ve en ingles se encuentra una pantalla a medias.
 * Estas pruebas son lo que lo impide. Para añadir un idioma: declararlo en
 * angular.json y crear su fichero; esto lo recorre solo.
 */
describe("traducciones", () => {
  it("hay al menos un idioma que traducir y el origen tiene mensajes", () => {
    expect(IDIOMAS.length).toBeGreaterThan(0);
    expect(origen.length).toBeGreaterThan(0);
  });

  describe.each(IDIOMAS)("%s (%s)", (_codigo, fichero) => {
    const traducidas = unidades(fichero);
    const porId = new Map(traducidas.map((u) => [u.id, u]));

    it("traduce todos los mensajes del origen", () => {
      const sinTraducir = origen.filter((u) => !porId.has(u.id)).map((u) => u.id);

      expect(sinTraducir).toEqual([]);
    });

    it("ningun mensaje tiene el destino vacio", () => {
      const vacios = traducidas.filter((u) => (u.destino ?? "").trim() === "").map((u) => u.id);

      expect(vacios).toEqual([]);
    });

    it("no sobran mensajes que el origen ya no tiene", () => {
      const ids = new Set(origen.map((u) => u.id));

      expect(traducidas.filter((u) => !ids.has(u.id)).map((u) => u.id)).toEqual([]);
    });

    it("conserva los marcadores de cada mensaje: sin ellos se pierde un dato en pantalla", () => {
      const cambiados = traducidas
        .filter((u) => u.destino !== null && marcadores(u.destino).join() !== marcadores(u.origen).join())
        .map((u) => u.id);

      expect(cambiados).toEqual([]);
    });

    it("el texto original no se ha quedado sin traducir: el destino no repite el origen", () => {
      // Mensajes que se escriben igual en los dos idiomas.
      const IGUALES = new Set(["campo.tags", "campo.cv", "campo.prep", "estado.entrevista"]);
      const iguales = traducidas
        .filter((u) => u.destino !== null && u.destino.trim() === u.origen.trim() && !IGUALES.has(u.id) && !/^\{?\s*<ph/.test(u.origen.trim()))
        .map((u) => u.id);

      expect(iguales).toEqual([]);
    });
  });
});

/**
 * El xlf de origen se genera con ng extract-i18n, y es facil cambiar un texto
 * y olvidar volver a extraer. Se compara con lo que hay escrito en el codigo.
 */
describe("mensajes del codigo", () => {
  const ts = ficherosDeCodigo(/\.ts$/);
  const html = ficherosDeCodigo(/\.html$/);
  // Las plantillas en linea de los componentes tambien llevan i18n.
  const plantillas = [...html, ...ts];

  const idsDelCodigo = new Set(
    [...ts, ...html].flatMap(({ texto }) => [...texto.matchAll(/@@([\w.-]+)/g)].map((m) => m[1])),
  );

  it("cada mensaje del codigo esta en el xlf de origen: falta ng extract-i18n", () => {
    const ids = new Set(origen.map((u) => u.id));

    expect([...idsDelCodigo].filter((id) => !ids.has(id))).toEqual([]);
  });

  it("cada mensaje del xlf de origen sigue en el codigo", () => {
    const sobrantes = origen.filter((u) => !/^\d+$/.test(u.id) && !idsDelCodigo.has(u.id)).map((u) => u.id);

    expect(sobrantes).toEqual([]);
  });

  it("todo $localize lleva un id propio: un id calculado cambia al corregir una errata", () => {
    const sinId = ts.flatMap(({ ruta, texto }) =>
      [...texto.matchAll(/\$localize`:([^`]*?):/g)].filter((m) => !m[1].includes("@@")).map(() => ruta),
    );
    const sinMetadatos = ts.flatMap(({ ruta, texto }) =>
      [...texto.matchAll(/\$localize`(?!:)/g)].map(() => ruta),
    );

    expect([...sinId, ...sinMetadatos]).toEqual([]);
  });

  it("todo atributo i18n de una plantilla lleva un id propio", () => {
    const sinId = plantillas.flatMap(({ ruta, texto }) =>
      [...texto.matchAll(/\si18n(?:-[\w-]+)?(?:="([^"]*)")?(?=[\s>])/g)]
        .filter((m) => !(m[1] ?? "").includes("@@"))
        .map(() => ruta),
    );

    expect(sinId).toEqual([]);
  });
});
