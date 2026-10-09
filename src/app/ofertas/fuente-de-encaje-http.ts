import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { CONFIGURACION_DE_SESION } from '../sesion/configuracion';
import { ESTADO_DE_ENCAJE, Encaje, FuenteDeEncaje, LOTE_MAXIMO_DE_ENCAJES, ResultadoDeEncaje, ResumenDeEncaje } from './encaje';

/** El encaje tal como viaja: snake_case, como el resto de la API. */
interface EncajeDeApi {
  cubiertos: Encaje['cubiertos'];
  huecos: Encaje['huecos'];
  no_evaluables: string[];
  alcanzable: boolean;
  cobertura: number;
}

/** El servidor contesta 409 o 422 cuando todavia no hay perfil. */
const SIN_PERFIL = [409, 422];

/** El token lo pone el interceptor conToken: aqui solo se conoce la ruta. */
@Injectable()
export class FuenteDeEncajeHttp implements FuenteDeEncaje {
  private readonly http = inject(HttpClient);
  private readonly configuracion = inject(CONFIGURACION_DE_SESION);

  async obtener(idDeOferta: string): Promise<ResultadoDeEncaje> {
    const url = `${this.configuracion.urlApi}/ofertas/${encodeURIComponent(idDeOferta)}/encaje`;
    try {
      const api = await firstValueFrom(this.http.get<EncajeDeApi>(url));
      return {
        estado: ESTADO_DE_ENCAJE.listo,
        encaje: {
          cubiertos: api.cubiertos,
          huecos: api.huecos,
          noEvaluables: api.no_evaluables,
          alcanzable: api.alcanzable,
          cobertura: api.cobertura,
        },
      };
    } catch (error) {
      if (error instanceof HttpErrorResponse && SIN_PERFIL.includes(error.status)) {
        return { estado: ESTADO_DE_ENCAJE.sinPerfil };
      }
      throw error;
    }
  }

  /** Si un lote falla, falla todo: un filtro con la mitad de los datos engaña. */
  async resumen(idsDeOfertas: string[]): Promise<Record<string, ResumenDeEncaje>> {
    const lotes: string[][] = [];
    for (let i = 0; i < idsDeOfertas.length; i += LOTE_MAXIMO_DE_ENCAJES) {
      lotes.push(idsDeOfertas.slice(i, i + LOTE_MAXIMO_DE_ENCAJES));
    }
    const respuestas = await Promise.all(
      lotes.map((ids) =>
        firstValueFrom(this.http.post<Record<string, ResumenDeEncaje>>(`${this.configuracion.urlApi}/encajes`, { ids })),
      ),
    );
    return Object.assign({}, ...respuestas);
  }
}
