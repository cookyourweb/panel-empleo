import { Injectable } from '@angular/core';

import { RepositorioDeCuenta } from './repositorio-de-cuenta';

/** La demo no guarda nada, asi que no hay nada que borrar. */
@Injectable()
export class RepositorioDeCuentaDemo implements RepositorioDeCuenta {
  async borrar(): Promise<void> {}
}
