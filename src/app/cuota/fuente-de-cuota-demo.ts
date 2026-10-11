import { Injectable } from '@angular/core';

import { Cuota, Interes } from './cuota';
import { FuenteDeCuota } from './fuente-de-cuota';

/**
 * La demo no inventa una cuota: un contador falso en produccion se leeria como
 * un dato real. Sin cuota, la pantalla no pinta nada.
 */
@Injectable()
export class FuenteDeCuotaDemo implements FuenteDeCuota {
  async actual(): Promise<Cuota | null> {
    return null;
  }

  async refrescar(): Promise<Cuota | null> {
    return null;
  }

  async registrarInteres(_interes: Interes): Promise<void> {}
}
