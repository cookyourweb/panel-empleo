import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { CONFIGURACION_DE_SESION } from '../sesion/configuracion';
import { Sesion } from '../sesion/sesion';
import { EventoDeBusqueda, ParametrosDeBusqueda } from './evento-de-busqueda';

/**
 * Abre una conexión SSE contra cv-server para seguir el progreso de una búsqueda.
 *
 * EventSource no puede enviar cabeceras, así que el token (JWT del usuario) viaja
 * en la query string. La conexión se cierra automáticamente al recibir 'done' o
 * 'error', y también al desuscribirse (evita fugas y consumo de tokens).
 */
@Injectable({ providedIn: 'root' })
export class BusquedaProgresoService {
  private readonly configuracion = inject(CONFIGURACION_DE_SESION);
  private readonly sesion = inject(Sesion);

  buscar(parametros: ParametrosDeBusqueda): Observable<EventoDeBusqueda> {
    return new Observable<EventoDeBusqueda>((subscriber) => {
      const token = this.sesion.token();
      if (token === null) {
        subscriber.error(new Error('sin sesión'));
        return;
      }
      const usuarioId = parametros.usuarioId;
      if (!usuarioId) {
        subscriber.error(new Error('sin usuario'));
        return;
      }

      const url = new URL(`${this.configuracion.urlApi}/buscar-para-usuaria/progress`);
      url.searchParams.set('usuario_id', usuarioId);
      url.searchParams.set('top_n', String(parametros.topN ?? 5));
      url.searchParams.set('token', token);

      const fuente = new EventSource(url.toString());
      let cerrada = false;

      const cerrar = () => {
        if (cerrada) return;
        cerrada = true;
        fuente.close();
      };

      fuente.onmessage = (evento) => {
        let datos: EventoDeBusqueda;
        try {
          datos = JSON.parse(evento.data) as EventoDeBusqueda;
        } catch {
          subscriber.error(new Error('evento SSE malformado'));
          cerrar();
          return;
        }
        subscriber.next(datos);
        if (datos.stage === 'done' || datos.stage === 'error') {
          cerrar();
          subscriber.complete();
        }
      };

      fuente.onerror = () => {
        if (cerrada) return;
        subscriber.error(new Error('conexión SSE interrumpida'));
        cerrar();
      };

      // Teardown: se ejecuta al desuscribirse (ngOnDestroy, cancelar, etc.).
      return () => cerrar();
    });
  }
}