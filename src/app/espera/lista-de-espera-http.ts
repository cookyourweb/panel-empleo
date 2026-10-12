import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ListaDeEspera, SolicitudDeEspera, URL_DEL_WEBHOOK_DE_LEADS } from './lista-de-espera';

/**
 * Envia la solicitud al webhook de leads. Solo cuenta como apuntada con un 200
 * y {"ok": true}. El interceptor conToken no le pone el token de Google: el
 * webhook es de otro origen.
 */
@Injectable()
export class ListaDeEsperaHttp implements ListaDeEspera {
  private readonly http = inject(HttpClient);

  async apuntar({ nombre, email }: SolicitudDeEspera): Promise<void> {
    const respuesta = await firstValueFrom(
      this.http.post<{ ok?: unknown } | null>(
        URL_DEL_WEBHOOK_DE_LEADS,
        { formulario: 'empleo', nombre, email, origen: 'web', timestamp: new Date().toISOString() },
        { observe: 'response' },
      ),
    );
    if (respuesta.status !== 200 || respuesta.body?.ok !== true) {
      throw new Error('El webhook no confirmo que la solicitud se guardara');
    }
  }
}
