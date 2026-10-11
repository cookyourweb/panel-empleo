import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { TipoDeConsentimiento } from '../alta/dominio';
import { CONFIGURACION_DE_SESION } from '../sesion/configuracion';
import { CvGuardado, esIdiomaDeCv, IdiomaDeCv, RepositorioDeCuenta } from './repositorio-de-cuenta';

/** Un CV tal como viaja en GET /cv: snake_case, solo metadatos. */
interface CvDeApi {
  idioma: string;
  formato: string;
  subido_en: string;
}

/** El token lo pone el interceptor conToken: aqui solo se conoce la ruta. */
@Injectable()
export class RepositorioDeCuentaHttp implements RepositorioDeCuenta {
  private readonly http = inject(HttpClient);
  private readonly configuracion = inject(CONFIGURACION_DE_SESION);

  async borrar(): Promise<void> {
    await firstValueFrom(this.http.delete(`${this.configuracion.urlApi}/cuenta`));
  }

  async listarCvs(): Promise<CvGuardado[]> {
    const lista = await firstValueFrom(this.http.get<CvDeApi[]>(`${this.configuracion.urlApi}/cv`));
    // Algo que no es una lista no se puede leer como "no hay CV": seria mentir.
    if (!Array.isArray(lista)) throw new Error('Respuesta inesperada de /cv');
    return lista.flatMap((cv) =>
      esIdiomaDeCv(cv?.idioma) ? [{ idioma: cv.idioma, formato: cv.formato, subidoEn: cv.subido_en }] : [],
    );
  }

  async borrarCv(idioma: IdiomaDeCv): Promise<void> {
    try {
      await firstValueFrom(this.http.delete(`${this.configuracion.urlApi}/cv/${idioma}`));
    } catch (error) {
      // 404: ya no estaba. El resultado que ella pedia (no tener ese CV) ya se cumple.
      if (error instanceof HttpErrorResponse && error.status === 404) return;
      throw error;
    }
  }

  async retirarConsentimiento(tipo: TipoDeConsentimiento): Promise<void> {
    await firstValueFrom(this.http.delete(`${this.configuracion.urlApi}/consentimientos/${tipo}`));
  }
}
