import { Injectable } from '@angular/core';

import { ListaDeEspera, SolicitudDeEspera } from './lista-de-espera';

/** Para desarrollo: no envia nada a nadie. */
@Injectable()
export class ListaDeEsperaDemo implements ListaDeEspera {
  async apuntar(solicitud: SolicitudDeEspera): Promise<void> {
    void solicitud;
  }
}
