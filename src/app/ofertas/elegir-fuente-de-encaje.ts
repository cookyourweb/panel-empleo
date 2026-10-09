import { Type } from '@angular/core';

import { FuenteDeEncaje } from './encaje';
import { FuenteDeEncajeDemo } from './fuente-de-encaje-demo';
import { FuenteDeEncajeHttp } from './fuente-de-encaje-http';

/**
 * Que adaptador se conecta al puerto del encaje. Mientras el cv-server no
 * publique /encaje y /encajes, todo el mundo usa la demo. Recibe el flag como
 * argumento, igual que elegirRepositorio, para probar las dos ramas.
 */
export function elegirFuenteDeEncaje(conBackend: boolean): Type<FuenteDeEncaje> {
  return conBackend ? FuenteDeEncajeHttp : FuenteDeEncajeDemo;
}
