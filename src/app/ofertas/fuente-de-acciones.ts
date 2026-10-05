import { Injectable, Type } from '@angular/core';

import { EnlacesDeAccion } from './acciones';

/** De donde salen los enlaces de las acciones. Mismo patron que el repositorio. */
export abstract class FuenteDeAcciones {
  abstract enlaces(): Promise<EnlacesDeAccion | null>;
}

/** Fuera de git, igual que los datos reales: las rutas son secretas. */
export const RUTA_ACCIONES_LOCALES = '/local/acciones.json';

const CLAVES: (keyof EnlacesDeAccion)[] = ['aprobar', 'descartar', 'enviarEmpresa'];

/**
 * Los enlaces de n8n que usa el correo diario, leidos de un fichero local.
 *
 * Si falta alguno, o alguno no es https, no se ofrece ninguna accion: un boton
 * a medias o con una direccion rara es peor que no tener boton.
 */
@Injectable()
export class FuenteDeAccionesLocal implements FuenteDeAcciones {
  async enlaces(): Promise<EnlacesDeAccion | null> {
    const respuesta = await fetch(RUTA_ACCIONES_LOCALES);
    if (!respuesta.ok) {
      return null;
    }
    const datos = (await respuesta.json()) as Partial<Record<keyof EnlacesDeAccion, unknown>> | null;
    const validos = CLAVES.every((clave) => {
      const valor = datos?.[clave];
      return typeof valor === 'string' && valor.startsWith('https://');
    });
    return validos ? (datos as EnlacesDeAccion) : null;
  }
}

/** La demo publica enseña la tabla, no acciones sobre datos reales. */
@Injectable()
export class FuenteDeAccionesDemo implements FuenteDeAcciones {
  async enlaces(): Promise<EnlacesDeAccion | null> {
    return null;
  }
}

export function elegirFuenteDeAcciones(esDesarrollo: boolean): Type<FuenteDeAcciones> {
  return esDesarrollo ? FuenteDeAccionesLocal : FuenteDeAccionesDemo;
}
