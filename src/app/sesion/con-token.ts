import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { CONFIGURACION_DE_SESION } from './configuracion';
import { Sesion } from './sesion';

function origenDe(url: string): string | null {
  try {
    return new URL(url, document.baseURI).origin;
  } catch {
    return null;
  }
}

/** El token solo viaja a cv-server: ni al puente local /api ni a terceros. */
export const conToken: HttpInterceptorFn = (peticion, siguiente) => {
  const sesion = inject(Sesion);
  const { urlApi } = inject(CONFIGURACION_DE_SESION);

  const origen = origenDe(peticion.url);
  const esCvServer = origen !== null && origen === origenDe(urlApi);
  const token = sesion.token();
  if (!esCvServer || token === null || peticion.headers.has('Authorization')) {
    return siguiente(peticion);
  }
  return siguiente(peticion.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
