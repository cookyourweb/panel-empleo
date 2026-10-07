import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { CONFIGURACION_DE_SESION } from './configuracion';
import { Sesion } from './sesion';

function origenDe(url: string): string | null {
  try {
    return new URL(url, document.baseURI).origin;
  } catch {
    return null;
  }
}

/**
 * El token solo viaja a cv-server: ni al puente local /api ni a terceros.
 * Un 401 de cv-server cierra la sesion y lleva a /entrar, salvo en peticiones
 * con su propia cabecera (la de Sesion.entrar), que ya gestionan su rechazo.
 */
export const conToken: HttpInterceptorFn = (peticion, siguiente) => {
  const sesion = inject(Sesion);
  const router = inject(Router);
  const { urlApi } = inject(CONFIGURACION_DE_SESION);

  const origen = origenDe(peticion.url);
  const esCvServer = origen !== null && origen === origenDe(urlApi);
  const token = sesion.token();
  if (!esCvServer || token === null || peticion.headers.has('Authorization')) {
    return siguiente(peticion);
  }

  const conCabecera = peticion.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  return siguiente(conCabecera).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        sesion.cerrar();
        void router.navigate(['/entrar'], { queryParams: { volver: router.url } });
      }
      return throwError(() => error);
    }),
  );
};
