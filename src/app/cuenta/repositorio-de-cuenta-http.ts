import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { CONFIGURACION_DE_SESION } from '../sesion/configuracion';
import { RepositorioDeCuenta } from './repositorio-de-cuenta';

/** El token lo pone el interceptor conToken: aqui solo se conoce la ruta. */
@Injectable()
export class RepositorioDeCuentaHttp implements RepositorioDeCuenta {
  private readonly http = inject(HttpClient);
  private readonly configuracion = inject(CONFIGURACION_DE_SESION);

  async borrar(): Promise<void> {
    await firstValueFrom(this.http.delete(`${this.configuracion.urlApi}/cuenta`));
  }
}
