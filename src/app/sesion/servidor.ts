import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { CONFIGURACION_DE_SESION } from './configuracion';

/** Si el servidor esta despierto. Render tarda en arrancar tras dormir. */
@Injectable({ providedIn: 'root' })
export class Servidor {
  private readonly http = inject(HttpClient);
  private readonly configuracion = inject(CONFIGURACION_DE_SESION);

  async comprobar(): Promise<boolean> {
    try {
      await firstValueFrom(this.http.get(`${this.configuracion.urlApi}/health`));
      return true;
    } catch {
      return false;
    }
  }
}
