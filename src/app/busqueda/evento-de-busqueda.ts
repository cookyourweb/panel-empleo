// Tipos del dominio SSE para la búsqueda de ofertas (Spec: consumo SSE en panel).

export type EtapaDeBusqueda = 'searching' | 'filtering' | 'ranking' | 'done' | 'error';

/** An offer as the server sends it in the done event: display fields only. */
export interface OfertaEncontrada {
  readonly puesto: string;
  readonly empresa: string;
  readonly ubicacion: string;
  readonly modalidad: string;
  readonly salario: string;
  /** Empty when the source gave no http(s) link. */
  readonly link: string;
  readonly score: number | null;
  readonly fuente: string;
}

export interface ResumenDeBusqueda {
  readonly ok?: boolean;
  readonly creadas?: number;
  readonly ofertas?: readonly OfertaEncontrada[];
}

export interface EventoDeBusqueda {
  readonly stage: EtapaDeBusqueda;
  readonly detail?: string;
  readonly summary?: ResumenDeBusqueda;
}

export interface ParametrosDeBusqueda {
  readonly usuarioId: string;
  readonly topN?: number;
}

export type EstadoDeBusqueda = 'idle' | EtapaDeBusqueda;