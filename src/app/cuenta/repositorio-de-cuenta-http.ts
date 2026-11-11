import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { TipoDeConsentimiento } from '../alta/dominio';
import { enviarCv } from '../compartido/enviar-cv';
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

  async consentir(tipo: TipoDeConsentimiento, version: string): Promise<void> {
    await firstValueFrom(this.http.post(`${this.configuracion.urlApi}/consentimientos`, { tipo, version }));
  }

  async subirCv(archivo: File): Promise<void> {
    await enviarCv(this.http, this.configuracion.urlApi, archivo);
  }

  async estadoDeClave(): Promise<{ configurada: boolean; trialRestante: number }> {
    const r = await firstValueFrom(
      this.http.get<{ configurada: boolean; trial_restante: number }>(`${this.configuracion.urlApi}/clave-api`),
    );
    return { configurada: !!r.configurada, trialRestante: r.trial_restante ?? 0 };
  }

  async guardarClave(proveedor: 'anthropic' | 'groq', apiKey: string): Promise<void> {
    await firstValueFrom(
      this.http.put(`${this.configuracion.urlApi}/clave-api`, { proveedor, api_key: apiKey }),
    );
  }

  async borrarClave(proveedor: 'anthropic' | 'groq'): Promise<void> {
    await firstValueFrom(this.http.delete(`${this.configuracion.urlApi}/clave-api/${proveedor}`));
  }
}
