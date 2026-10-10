import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { CONFIGURACION_DE_SESION } from '../sesion/configuracion';
import { Campo, MOTIVOS_MANUAL, MotivoDeSubida, MotivoManual, Propuesta, ResultadoExtraccion, SubidaRechazada } from './dominio';
import { ExtractorDeCv } from './extractor-de-cv';

const INDISPONIBLE: ResultadoExtraccion = { estado: 'manual', motivo: 'indisponible' };

/** Los nombres de campo del servidor (snake_case) y el campo del dominio. */
const CAMPOS_DE_API: ReadonlyMap<string, Campo> = new Map<string, Campo>([
  ['rol', 'rol'],
  ['anios_experiencia', 'aniosExperiencia'],
  ['stack', 'stack'],
  ['idiomas', 'idiomas'],
  ['ubicacion', 'ubicacion'],
]);

function motivoDeSubida(error: unknown): MotivoDeSubida {
  switch (error instanceof HttpErrorResponse ? error.status : 0) {
    case 413:
      return 'tamano';
    case 415:
      return 'tipo';
    case 422:
      return 'ilegible';
    case 403:
      return 'sinConsentimiento';
    default:
      return 'servidor';
  }
}

function esRegistro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null;
}

/** Un valor suelto o una lista, como texto editable. */
function valorComoTexto(valor: unknown): string | null {
  if (typeof valor === 'string') return valor;
  if (typeof valor === 'number') return String(valor);
  if (Array.isArray(valor) && valor.every((v) => typeof v === 'string')) return valor.join(', ');
  return null;
}

/** Descarta lo que no encaja: un campo desconocido o sin cita no se enseña. */
function propuestaValida(bruta: unknown): Propuesta | null {
  if (!esRegistro(bruta)) return null;
  const campo = typeof bruta['campo'] === 'string' ? CAMPOS_DE_API.get(bruta['campo']) : undefined;
  const valor = valorComoTexto(bruta['valor']);
  const cita = bruta['cita'];
  if (campo === undefined || valor === null || typeof cita !== 'string' || cita === '') return null;
  return { campo, valor, cita };
}

function resultadoDe(cuerpo: unknown): ResultadoExtraccion {
  if (!esRegistro(cuerpo)) return INDISPONIBLE;
  if (cuerpo['estado'] === 'propuesta' && Array.isArray(cuerpo['propuestas'])) {
    const propuestas = cuerpo['propuestas'].flatMap((p: unknown) => propuestaValida(p) ?? []);
    return { estado: 'propuesta', propuestas };
  }
  if (cuerpo['estado'] === 'manual') {
    const motivo = (MOTIVOS_MANUAL as readonly unknown[]).includes(cuerpo['motivo'])
      ? (cuerpo['motivo'] as MotivoManual)
      : 'indisponible';
    return { estado: 'manual', motivo };
  }
  return INDISPONIBLE;
}

/** El token lo pone el interceptor conToken. */
@Injectable()
export class ExtractorDeCvHttp implements ExtractorDeCv {
  private readonly http = inject(HttpClient);
  private readonly configuracion = inject(CONFIGURACION_DE_SESION);

  async subir(archivo: File): Promise<void> {
    const formulario = new FormData();
    formulario.append('archivo', archivo);
    try {
      await firstValueFrom(this.http.post(`${this.configuracion.urlApi}/cv`, formulario));
    } catch (error) {
      throw new SubidaRechazada(motivoDeSubida(error));
    }
  }

  async extraer(): Promise<ResultadoExtraccion> {
    try {
      return resultadoDe(await firstValueFrom(this.http.post<unknown>(`${this.configuracion.urlApi}/extraccion`, {})));
    } catch {
      return INDISPONIBLE;
    }
  }
}
