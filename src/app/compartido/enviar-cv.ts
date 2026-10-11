import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { MotivoDeSubida, SubidaRechazada } from './subida-rechazada';

/** El motivo por el que el servidor no acepto el CV, segun el codigo HTTP de POST /cv. */
export function motivoDeSubida(error: unknown): MotivoDeSubida {
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

/** POST /cv (campo `archivo`). Lanza SubidaRechazada con el motivo si el servidor no lo acepta. */
export async function enviarCv(http: HttpClient, urlApi: string, archivo: File): Promise<void> {
  const formulario = new FormData();
  formulario.append('archivo', archivo);
  try {
    await firstValueFrom(http.post(`${urlApi}/cv`, formulario));
  } catch (error) {
    throw new SubidaRechazada(motivoDeSubida(error));
  }
}
