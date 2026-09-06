/** Los ocho estados por los que pasa una candidatura. */
export type EstadoDeOferta =
  | 'Pendiente'
  | 'En proceso'
  | 'Enviado'
  | 'Entrevista'
  | 'Rechazado'
  | 'Descartado'
  | 'Caducada'
  | 'Contactada directamente';

export interface Oferta {
  id: string;
  empresa: string;
  puesto: string;
  estado: EstadoDeOferta;
}
