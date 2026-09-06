/**
 * Los ocho estados por los que pasa una candidatura, en el orden en que se
 * avanza. Descartado y Rechazado no son lo mismo: el primero lo decide quien
 * busca, el segundo la empresa.
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

export type EstadoDeOferta = (typeof ESTADOS)[number];

export interface Oferta {
  id: string;
  empresa: string;
  puesto: string;
  estado: EstadoDeOferta;
}
