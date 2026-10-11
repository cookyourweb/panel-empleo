import { globSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * Guarda del sistema de botones: lee las plantillas (.html y las inline de los
 * .ts) y exige que toda accion sea un <button class="boton ..."> y que los
 * enlaces de llamada a la accion se vistan de boton. Los enlaces dentro de una
 * frase siguen siendo enlaces.
 */
const ficheros = [...globSync("src/app/**/*.{html,ts}")].filter((f) => !f.endsWith(".spec.ts"));

type Etiqueta = { fichero: string; texto: string };

/** Etiquetas de apertura `<nombre ...>` completas (respeta comillas, que pueden llevar `>`). */
function etiquetas(nombre: string): Etiqueta[] {
  const resultado: Etiqueta[] = [];
  for (const fichero of ficheros) {
    const fuente = readFileSync(fichero, "utf8");
    const re = new RegExp(`<${nombre}(?=[\\s>])`, "g");
    for (const m of fuente.matchAll(re)) {
      let comilla = "";
      let i = m.index! + m[0].length;
      for (; i < fuente.length; i++) {
        const c = fuente[i];
        if (comilla) {
          if (c === comilla) comilla = "";
        } else if (c === '"' || c === "'") comilla = c;
        else if (c === ">") break;
      }
      resultado.push({ fichero, texto: fuente.slice(m.index!, i + 1) });
    }
  }
  return resultado;
}

const clases = (e: Etiqueta) => (e.texto.match(/\sclass="([^"]*)"/)?.[1] ?? "").split(/\s+/);
const esBoton = (e: Etiqueta) => clases(e).includes("boton");

/** Botones que NO son acciones de contenido y conservan su aspecto propio. */
const EXCEPCIONES = [
  { marca: 'class="alternar"', motivo: "icono de hamburguesa de la cabecera de marca" },
  { marca: '(click)="ordenarPor(', motivo: "cabecera de columna ordenable: es una cabecera de tabla, no una accion suelta" },
  { marca: 'role="menuitem"', motivo: "opcion de un menu desplegable, dibujada como el estado" },
];

describe("todo <button> de la aplicacion usa el sistema de botones", () => {
  const botones = etiquetas("button");

  it("encuentra los botones (la guarda no esta ciega)", () => {
    expect(botones.length).toBeGreaterThan(40);
  });

  it("cada boton lleva la clase .boton, salvo las excepciones documentadas", () => {
    const sueltos = botones
      .filter((b) => !esBoton(b) && !EXCEPCIONES.some((x) => b.texto.includes(x.marca)))
      .map((b) => `${b.fichero}: ${b.texto.replace(/\s+/g, " ").slice(0, 110)}`);

    expect(sueltos).toEqual([]);
  });

  it("las excepciones son pocas y no crecen sin que se note", () => {
    const usadas = botones.filter((b) => EXCEPCIONES.some((x) => b.texto.includes(x.marca)));
    expect(usadas.length).toBeLessThanOrEqual(4);
  });

  it("ningun boton conserva las clases sueltas anteriores", () => {
    const viejas = botones.filter((b) =>
      clases(b).some((c) => ["principal", "secundaria", "enlace", "primario", "peligro", "fantasma", "pequeno", "boton-principal", "boton-cabecera", "vista-previa"].includes(c)),
    );
    expect(viejas.map((b) => b.fichero)).toEqual([]);
  });
});

describe("los enlaces de llamada a la accion se visten de boton y los de frase siguen siendo enlaces", () => {
  const enlaces = etiquetas("a");
  const con = (marca: string) => enlaces.filter((e) => e.texto.includes(marca));

  it.each([
    ["data-entrar", "bienvenida"],
    ["data-oferta-original", "ficha-candidatura"],
    ["data-notion", "ficha-candidatura"],
    ["data-accion", "ficha-candidatura"],
    ["data-accion", "ofertas.page"],
    ['routerLink="/alta"', "tu-encaje"],
    ['routerLink="/panel"', "alta.page"],
    ['routerLink="/cuenta"', "alta.page"],
    ['routerLink="/cuenta"', "app.html"],
    ["'/panel/candidatura'", "ofertas.page"],
  ])("el <a> con %s de %s lleva .boton", (marca, fichero) => {
    const candidatos = con(marca).filter((e) => e.fichero.includes(fichero));
    expect(candidatos.length).toBeGreaterThan(0);
    expect(candidatos.filter((e) => !esBoton(e)).map((e) => e.texto.replace(/\s+/g, " ").slice(0, 100))).toEqual([]);
  });

  it("las clases de enlace antiguas de los CTA ya no se usan", () => {
    const viejas = enlaces.filter((e) => clases(e).some((c) => ["secundaria", "completa", "accion"].includes(c)));
    expect(viejas.map((e) => e.fichero)).toEqual([]);
  });

  it("los enlaces mailto, tel, de privacidad y del pie no son botones", () => {
    const frase = enlaces.filter((e) => /mailto:|tel:|urlDePrivacidad|pie__legal|\[href\]="agencia"/.test(e.texto));
    expect(frase.length).toBeGreaterThan(3);
    expect(frase.filter(esBoton)).toEqual([]);
  });
});
