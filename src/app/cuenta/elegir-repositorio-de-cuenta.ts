import { Type } from '@angular/core';

import { RepositorioDeCuenta } from './repositorio-de-cuenta';
import { RepositorioDeCuentaDemo } from './repositorio-de-cuenta-demo';
import { RepositorioDeCuentaHttp } from './repositorio-de-cuenta-http';

/** Igual que elegirAdaptadoresDeAlta: el flag entra como argumento para probar las dos ramas. */
export function elegirRepositorioDeCuenta(conBackend: boolean): Type<RepositorioDeCuenta> {
  return conBackend ? RepositorioDeCuentaHttp : RepositorioDeCuentaDemo;
}
