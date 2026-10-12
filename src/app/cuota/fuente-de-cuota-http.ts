import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { CONFIGURACION_DE_SESION } from '../sesion/configuracion';
import { Sesion } from '../sesion/sesion';
import { Cuota, Interes } from './cuota';
import { FuenteDeCuota } from './fuente-de-cuota';

/**
 * La cuota la dice /yo, y /yo ya la guarda Sesion con su vigencia de 30 s:
 * aqui no hay una segunda cache. El token lo pone el interceptor conToken.
 */
@Injectable()
export class FuenteDeCuotaHttp implements FuenteDeCuota {
  private readonly http = inject(HttpClient);
  private readonly configuracion = inject(CONFIGURACION_DE_SESION);
  private readonly sesion = inject(Sesion);

  async actual(): Promise<Cuota | null> {
    const reciente = this.sesion.cuotaReciente();
    return reciente !== null ? reciente.cuota : this.refrescar();
  }

  /** Si /yo falla se queda lo ultimo sabido: esconder el medidor por un fallo de red engañaria mas. */
  async refrescar(): Promise<Cuota | null> {
    try {
      await this.sesion.refrescar();
    } catch {
      // se conserva lo anterior
    }
    return this.sesion.cuota();
  }

  async registrarInteres(interes: Interes): Promise<void> {
    const organizacion = interes.organizacion?.trim();
    const cuerpo = organizacion ? { tipo: interes.tipo, organizacion } : { tipo: interes.tipo };
    await firstValueFrom(this.http.post(`${this.configuracion.urlApi}/interes`, cuerpo));
  }
}
