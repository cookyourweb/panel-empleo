import { Bloque, Candidatura } from './dominio';
import { formatearFecha } from './fecha';

export type TipoDeCampo = 'texto' | 'enlace' | 'email' | 'tel' | 'largo';

export interface Campo {
  clave: string;
  etiqueta: string;
  tipo: TipoDeCampo;
  /** Ya listo para leer: fechas en DD/MM/AAAA, casillas como "Sí". */
  valor: string;
  /** Lo que se lee en un enlace en vez de la direccion entera. */
  textoEnlace?: string;
  /** Ocupa las dos columnas: un texto largo partido en media no se lee. */
  completo: boolean;
  /** Direccion para incrustar el documento, ya comprobada. Solo en el CV. */
  vistaPrevia?: string;
}

export interface Seccion {
  titulo: string;
  campos: Campo[];
}

type Formato = 'texto' | 'fecha' | 'enlace' | 'email' | 'tel' | 'largo' | 'casilla';

interface Definicion {
  clave: string;
  etiqueta: string;
  formato: Formato;
  leer: (una: Candidatura) => string | boolean | undefined;
  textoEnlace?: string;
}

const IDIOMAS = { es: 'Español', en: 'Inglés' } as const;

/**
 * Los campos de la ficha, en el orden y los grupos de la maqueta aprobada.
 *
 * Empresa, puesto, estado y el enlace a la oferta no estan: van en la cabecera
 * del panel, y repetirlos abajo solo empuja lo que no se ve arriba.
 */
const SECCIONES: { titulo: string; campos: Definicion[] }[] = [
  {
    titulo: 'Oferta',
    campos: [
      { clave: 'modalidad', etiqueta: 'Modalidad', formato: 'texto', leer: (u) => u.oferta.modalidad },
      { clave: 'ubicacion', etiqueta: 'Ubicación', formato: 'texto', leer: (u) => u.oferta.ubicacion },
      { clave: 'salario', etiqueta: 'Salario', formato: 'texto', leer: (u) => u.oferta.salario },
      { clave: 'fechaPublicacion', etiqueta: 'Publicada', formato: 'fecha', leer: (u) => u.oferta.fechaPublicacion },
      { clave: 'idioma', etiqueta: 'Idioma', formato: 'texto', leer: (u) => IDIOMAS[u.oferta.idioma] },
      { clave: 'tipoContrato', etiqueta: 'Tipo de contrato', formato: 'texto', leer: (u) => u.oferta.tipoContrato },
      {
        clave: 'modoContratacion',
        etiqueta: 'Modo de contratación',
        formato: 'texto',
        leer: (u) => u.oferta.modoContratacion,
      },
      { clave: 'tags', etiqueta: 'Tags', formato: 'texto', leer: (u) => u.oferta.tags },
      { clave: 'verificada', etiqueta: 'Verificada', formato: 'casilla', leer: (u) => u.oferta.verificada },
      { clave: 'palabrasClave', etiqueta: 'Palabras clave', formato: 'largo', leer: (u) => u.oferta.palabrasClave },
      { clave: 'descripcion', etiqueta: 'Descripción', formato: 'largo', leer: (u) => u.oferta.descripcion },
    ],
  },
  {
    titulo: 'Candidatura',
    campos: [
      { clave: 'fase', etiqueta: 'Fase', formato: 'texto', leer: (u) => u.fase },
      { clave: 'viaEnvio', etiqueta: 'Vía envío', formato: 'texto', leer: (u) => u.viaEnvio },
      { clave: 'fechaEnvio', etiqueta: 'Fecha envío', formato: 'fecha', leer: (u) => u.fechaEnvio },
      { clave: 'seguimiento', etiqueta: 'Seguimiento', formato: 'fecha', leer: (u) => u.seguimiento },
      { clave: 'fechaEntrevista', etiqueta: 'Fecha entrevista', formato: 'fecha', leer: (u) => u.fechaEntrevista },
      { clave: 'formatoTecnico', etiqueta: 'Formato técnico', formato: 'texto', leer: (u) => u.formatoTecnico },
      { clave: 'nombreContacto', etiqueta: 'Nombre contacto', formato: 'texto', leer: (u) => u.nombreContacto },
      { clave: 'telefonoContacto', etiqueta: 'Teléfono contacto', formato: 'tel', leer: (u) => u.telefonoContacto },
      { clave: 'emailEmpresa', etiqueta: 'Email empresa', formato: 'email', leer: (u) => u.emailEmpresa },
      { clave: 'emailEnviado', etiqueta: 'Email enviado', formato: 'email', leer: (u) => u.emailEnviado },
      { clave: 'notas', etiqueta: 'Notas', formato: 'largo', leer: (u) => u.notas },
    ],
  },
  {
    titulo: 'Documentos',
    campos: [
      // El CV y la carta primero: es lo que se revisa antes de darle a enviar.
      { clave: 'cv', etiqueta: 'CV generado', formato: 'enlace', leer: (u) => u.cv, textoEnlace: 'Abrir CV' },
      { clave: 'carta', etiqueta: 'Carta de presentación', formato: 'largo', leer: (u) => u.carta },
      { clave: 'cvUsado', etiqueta: 'CV usado', formato: 'enlace', leer: (u) => u.cvUsado, textoEnlace: 'Abrir CV base' },
      { clave: 'prep', etiqueta: 'Preparación', formato: 'enlace', leer: (u) => u.prep, textoEnlace: 'Abrir prep' },
      {
        clave: 'avisoAutonoma',
        etiqueta: 'Aviso autónoma en carta',
        formato: 'casilla',
        leer: (u) => u.avisoAutonoma,
      },
    ],
  },
];

/** Por encima de esto un valor corto ya no cabe en media columna. */
const LARGO_PARA_MEDIA_COLUMNA = 48;

function campoDesde(def: Definicion, valor: string | true, locale: string): Campo {
  let tipo: TipoDeCampo;
  let texto: string;
  switch (def.formato) {
    case 'fecha':
      tipo = 'texto';
      texto = formatearFecha(String(valor), locale) || String(valor);
      break;
    case 'casilla':
      tipo = 'texto';
      texto = 'Sí';
      break;
    case 'enlace':
      // Hay campos de "enlace" que en Notion son texto libre: si no es una
      // direccion, se enseña tal cual en vez de fabricar un enlace roto.
      texto = String(valor);
      tipo = /^https?:\/\//.test(texto) ? 'enlace' : 'texto';
      break;
    default:
      tipo = def.formato;
      texto = String(valor);
  }
  const campo: Campo = {
    clave: def.clave,
    etiqueta: def.etiqueta,
    tipo,
    valor: texto,
    completo: tipo === 'largo' || texto.length > LARGO_PARA_MEDIA_COLUMNA,
  };
  if (tipo === 'enlace' && def.textoEnlace) {
    campo.textoEnlace = def.textoEnlace;
    campo.completo = false;
  }
  const vistaPrevia = def.clave === 'cv' ? vistaPreviaDeCv(texto) : null;
  if (vistaPrevia) {
    campo.vistaPrevia = vistaPrevia;
    campo.completo = true;
  }
  return campo;
}

/**
 * Los dos sitios donde se guardan los CV generados: Google Docs y PDF en Drive.
 * El id solo admite lo que Google usa en sus ids, nada que cierre la direccion.
 */
const DOCUMENTOS_INCRUSTABLES = [
  /^https:\/\/docs\.google\.com\/document\/d\/([\w-]+)/,
  /^https:\/\/drive\.google\.com\/file\/d\/([\w-]+)/,
];

/**
 * La direccion de vista previa del CV, o null si no se debe incrustar.
 *
 * Lo que llega de Notion no se mete tal cual en un iframe: se saca el id y se
 * monta la direccion aqui. Asi solo se incrusta Google, y en modo lectura.
 */
export function vistaPreviaDeCv(url: string): string | null {
  for (const patron of DOCUMENTOS_INCRUSTABLES) {
    const encontrado = patron.exec(url);
    if (encontrado) {
      return url.startsWith('https://docs.')
        ? `https://docs.google.com/document/d/${encontrado[1]}/preview`
        : `https://drive.google.com/file/d/${encontrado[1]}/preview`;
    }
  }
  return null;
}

/** Los campos con dato, por secciones, y los nombres de los que no tienen. */
export function seccionesDeFicha(una: Candidatura, locale: string): { secciones: Seccion[]; vacios: string[] } {
  const vacios: string[] = [];
  const secciones = SECCIONES.map(({ titulo, campos }) => ({
    titulo,
    campos: campos.flatMap((def) => {
      const valor = def.leer(una);
      if (valor === undefined || valor === false || valor === '') {
        vacios.push(def.etiqueta);
        return [];
      }
      return [campoDesde(def, valor, locale)];
    }),
  }));
  return { secciones, vacios };
}

export type GrupoDeBloques = Bloque | { tipo: 'lista'; ordenada: boolean; elementos: Bloque[] };

/** Las vinetas y los numerados seguidos forman una lista: asi los anuncia el lector de pantalla. */
export function agruparBloques(bloques: Bloque[]): GrupoDeBloques[] {
  const grupos: GrupoDeBloques[] = [];
  for (const bloque of bloques) {
    if (bloque.tipo !== 'vineta' && bloque.tipo !== 'numerado') {
      grupos.push(bloque);
      continue;
    }
    const ordenada = bloque.tipo === 'numerado';
    const ultimo = grupos.at(-1);
    if (ultimo?.tipo === 'lista' && ultimo.ordenada === ordenada) {
      ultimo.elementos.push(bloque);
    } else {
      grupos.push({ tipo: 'lista', ordenada, elementos: [bloque] });
    }
  }
  return grupos;
}
