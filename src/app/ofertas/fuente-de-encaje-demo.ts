import { Injectable } from '@angular/core';

import { Encaje, ESTADO_DE_ENCAJE, FuenteDeEncaje, ResultadoDeEncaje, ResumenDeEncaje } from './encaje';

/**
 * Encajes de ejemplo para las ofertas de la demo. Los CV y las empresas son
 * inventados: ningun dato de una persona real sale ni entra por aqui.
 */
const DEMO: Record<string, Encaje> = {
  o1: {
    cubiertos: [
      { requisito: 'Angular', evidencia: 'Angular 17 con signals en una plataforma de pagos' },
      { requisito: 'TypeScript', evidencia: 'TypeScript estricto en tres productos' },
      { requisito: 'Accesibilidad', evidencia: 'Auditoria WCAG 2.2 AA de un design system' },
    ],
    huecos: [{ requisito: 'Nx', eliminatorio: false }],
    noEvaluables: ['Buena comunicacion con negocio'],
    alcanzable: true,
    cobertura: 0.75,
  },
  o2: {
    cubiertos: [
      { requisito: 'Angular', evidencia: 'Angular 17 con signals en una plataforma de pagos' },
      { requisito: 'RxJS', evidencia: 'Flujos de datos con RxJS en tiempo real' },
    ],
    huecos: [],
    noEvaluables: [],
    alcanzable: true,
    cobertura: 1,
  },
  o3: {
    cubiertos: [{ requisito: 'TypeScript', evidencia: 'TypeScript estricto en tres productos' }],
    huecos: [
      { requisito: 'Mas de 25 anos de experiencia', eliminatorio: true },
      { requisito: 'Rust', eliminatorio: false },
    ],
    noEvaluables: [],
    alcanzable: false,
    cobertura: 0.33,
  },
  o7: {
    cubiertos: [
      { requisito: 'Angular', evidencia: 'Angular 17 con signals en una plataforma de pagos' },
      { requisito: 'Testing', evidencia: 'Pruebas con Vitest y Playwright en integracion continua' },
    ],
    huecos: [{ requisito: 'GraphQL', eliminatorio: false }],
    noEvaluables: [],
    alcanzable: true,
    cobertura: 0.67,
  },
};

/** Sin tecnologias reconocidas: cobertura 0, no alcanzable y nada que mostrar. */
const SIN_DATOS: Encaje = { cubiertos: [], huecos: [], noEvaluables: [], alcanzable: false, cobertura: 0 };

@Injectable()
export class FuenteDeEncajeDemo implements FuenteDeEncaje {
  async obtener(idDeOferta: string): Promise<ResultadoDeEncaje> {
    return { estado: ESTADO_DE_ENCAJE.listo, encaje: DEMO[idDeOferta] ?? SIN_DATOS };
  }

  async resumen(idsDeOfertas: string[]): Promise<Record<string, ResumenDeEncaje>> {
    return Object.fromEntries(
      idsDeOfertas.map((id) => {
        const { alcanzable, cobertura } = DEMO[id] ?? SIN_DATOS;
        return [id, { alcanzable, cobertura }];
      }),
    );
  }
}
