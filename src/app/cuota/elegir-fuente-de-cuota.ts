import { Type } from '@angular/core';

import { FuenteDeCuota } from './fuente-de-cuota';
import { FuenteDeCuotaDemo } from './fuente-de-cuota-demo';
import { FuenteDeCuotaHttp } from './fuente-de-cuota-http';

/**
 * Que adaptador se conecta al puerto de la cuota. Va con el flag del alta
 * (ALTA_CON_BACKEND): /yo con cuota y /interes son del mismo backend. Recibe el
 * flag como argumento, igual que elegirRepositorioDeCuenta, para probar las dos ramas.
 */
export function elegirFuenteDeCuota(conBackend: boolean): Type<FuenteDeCuota> {
  return conBackend ? FuenteDeCuotaHttp : FuenteDeCuotaDemo;
}
