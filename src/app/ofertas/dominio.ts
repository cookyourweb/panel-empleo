/**
 * Los estados por los que pasa una candidatura, en el orden en que se avanza.
 *
 * Aprobado es un paso real y no un detalle de Pendiente: el CV y la carta ya
 * estan hechos y solo falta enviarlos. Cada uno pide una accion distinta.
 *
 * Descartado y Rechazado no son lo mismo: el primero lo decide quien busca, el
 * segundo la empresa. Fundirlos perderia el dato de cuantas puertas se cierran
 * fuera y cuantas se cierran dentro.
 */
export const ESTADOS = [
  'Pendiente',
  'Aprobado',
  'En proceso',
  'Enviado',
  'Entrevista',
  'Rechazado',
  'Descartado',
  'Caducada',
  'Contactada directamente',
] as const;

export type EstadoDeCandidatura = (typeof ESTADOS)[number];

export const MODALIDADES = ['Remoto', 'Hibrido', 'Presencial', 'Sin confirmar'] as const;

export type Modalidad = (typeof MODALIDADES)[number];

export type Idioma = 'es' | 'en';

/**
 * La oferta: lo que describe el puesto y no depende de quien lo mire.
 *
 * No lleva estado. El estado es de la candidatura, no de la oferta: una oferta
 * puede existir sin que nadie se haya presentado, y dos personas pueden
 * presentarse a la misma con estados distintos.
 */
export interface Oferta {
  id: string;
  empresa: string;
  puesto: string;
  /** En que idioma esta escrita. Decide en que idioma se genera el curriculum. */
  idioma: Idioma;

  /**
   * Lo que sigue es opcional a proposito: la captacion no siempre lo encuentra.
   * Un campo obligatorio que a veces falta obliga a inventarse un valor, y un
   * valor inventado no se distingue de uno real.
   */
  descripcion?: string;
  enlace?: string;
  ubicacion?: string;
  modalidad?: Modalidad;
  salario?: string;
  /** Fecha ISO (AAAA-MM-DD) en que la empresa publico la oferta. */
  fechaPublicacion?: string;
}

/** La candidatura: una persona sobre una oferta. Aqui vive el seguimiento. */
export interface Candidatura {
  id: string;
  oferta: Oferta;
  estado: EstadoDeCandidatura;

  /** Por donde se mando: LinkedIn, portal de la empresa, email... */
  viaEnvio?: string;
  /** Fecha ISO (AAAA-MM-DD) en que salio la candidatura. */
  fechaEnvio?: string;
  /** Enlace al CV que se mando, para saber que version vio la empresa. */
  cv?: string;
  /** La carta tal como se mando, con sus saltos de linea. */
  carta?: string;
}
