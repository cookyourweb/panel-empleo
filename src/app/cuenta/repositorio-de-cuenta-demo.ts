import { Injectable } from '@angular/core';

import { TipoDeConsentimiento } from '../alta/dominio';
import { CvGuardado, IdiomaDeCv, RepositorioDeCuenta } from './repositorio-de-cuenta';

/** La demo no guarda nada, asi que no hay nada que borrar ni que retirar. */
@Injectable()
export class RepositorioDeCuentaDemo implements RepositorioDeCuenta {
  async borrar(): Promise<void> {}

  async listarCvs(): Promise<CvGuardado[]> {
    return [];
  }

  async borrarCv(_idioma: IdiomaDeCv): Promise<void> {}

  async retirarConsentimiento(_tipo: TipoDeConsentimiento): Promise<void> {}
}
