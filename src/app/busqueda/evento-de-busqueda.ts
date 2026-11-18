// Tipos del dominio SSE para la búsqueda de ofertas (Spec: consumo SSE en panel).

export type EtapaDeBusqueda = 'searching' | 'filtering' | 'ranking' | 'done' | 'error';

export interface ResumenDeBusqueda {
  readonly ok?: boolean;
  readonly creadas?: number;
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