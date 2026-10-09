/** Un requisito de la oferta que el CV cubre, con la linea del CV que lo demuestra. */
export interface RequisitoCubierto {
  requisito: string;
  /** Texto del propio CV de quien mira. Se pinta siempre como texto. */
  evidencia: string;
}

/** Un requisito que el CV no demuestra. Eliminatorio: la oferta lo pide como imprescindible. */
export interface Hueco {
  requisito: string;
  eliminatorio: boolean;
}

/** El encaje de una oferta con el perfil y el CV de quien la mira. */
export interface Encaje {
  cubiertos: RequisitoCubierto[];
  huecos: Hueco[];
  /** Lo que la oferta pide y una regla no puede medir (una actitud, un idioma de trabajo...). */
  noEvaluables: string[];
  alcanzable: boolean;
  /** De 0 a 1: cubiertos entre requisitos tecnicos. */
  cobertura: number;
}

/** Lo que basta para filtrar una lista, sin el detalle. */
export interface ResumenDeEncaje {
  alcanzable: boolean;
  cobertura: number;
}

export const ESTADO_DE_ENCAJE = {
  listo: 'listo',
  sinPerfil: 'sin-perfil',
} as const;

/** Sin perfil no es un fallo: hay que darse de alta, y se le dice. */
export type ResultadoDeEncaje =
  | { estado: typeof ESTADO_DE_ENCAJE.listo; encaje: Encaje }
  | { estado: typeof ESTADO_DE_ENCAJE.sinPerfil };

/** El servidor rechaza mas de 50 ids por peticion. */
export const LOTE_MAXIMO_DE_ENCAJES = 50;

/** De donde sale el encaje. Mismo patron que el repositorio: puerto + http + demo. */
export abstract class FuenteDeEncaje {
  abstract obtener(idDeOferta: string): Promise<ResultadoDeEncaje>;
  /** Un resumen por oferta; las que el servidor no devuelve no estan en el resultado. */
  abstract resumen(idsDeOfertas: string[]): Promise<Record<string, ResumenDeEncaje>>;
}

/**
 * Cuantos requisitos tecnicos se han podido medir. Es el denominador del
 * "Cubres X de Y": se cuenta lo que hay en las listas, no se deduce de la cobertura.
 */
export function totalDeRequisitos(encaje: Encaje): number {
  return encaje.cubiertos.length + encaje.huecos.length;
}

/**
 * Una oferta sin tecnologias reconocidas tiene cobertura 0 y no es alcanzable,
 * pero eso no significa "no te encaja": significa que no hay nada que medir.
 * Se dice asi, sin convertir la falta de datos en una mala nota.
 */
export function sinDatosParaEvaluar(encaje: Encaje): boolean {
  return totalDeRequisitos(encaje) === 0;
}
