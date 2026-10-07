import { InjectionToken } from '@angular/core';

export interface ConfiguracionDeSesion {
  readonly urlApi: string;
  readonly idCliente: string;
}

export const CONFIGURACION_DE_SESION = new InjectionToken<ConfiguracionDeSesion>(
  'CONFIGURACION_DE_SESION',
);

// El id de cliente de Google es publico a proposito: no es un secreto.
// Google lo protege con los origenes autorizados de la consola.
const ID_CLIENTE = '36051363838-1ofkd3vj09ti3jf42uptsl6nl3f75rrk.apps.googleusercontent.com';

/**
 * Que servidor y que cliente de Google usa la sesion.
 *
 * Recibe el entorno como argumento, igual que elegirRepositorio, para probar
 * las dos ramas.
 */
export function elegirConfiguracion(esDesarrollo: boolean): ConfiguracionDeSesion {
  return {
    idCliente: ID_CLIENTE,
    urlApi: esDesarrollo ? 'http://localhost:5000' : 'https://cv-server-ggd8.onrender.com',
  };
}
