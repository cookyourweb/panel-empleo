/**
 * Los estados por los que pasa una candidatura, en el orden en que se avanza.
 *
 * Descartado y Rechazado no son lo mismo: el primero lo decide quien busca, el
 * segundo la empresa. Fundirlos perderia el dato de cuantas puertas se cierran
 * fuera y cuantas se cierran dentro.
 */
export const ESTADOS = [
  'Pendiente',
  'En proceso',
  'Enviado',
  'Entrevista',
  'Rechazado',
  'Descartado',
  'Caducada',
  'Contactada directamente',
] as const;

export type EstadoDeCandidatura = (typeof ESTADOS)[number];

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
}

/** La candidatura: una persona sobre una oferta. Aqui vive el seguimiento. */
export interface Candidatura {
  id: string;
  oferta: Oferta;
  estado: EstadoDeCandidatura;
}
