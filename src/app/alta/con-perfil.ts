import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { firstValueFrom, timeout } from 'rxjs';

import { CONFIGURACION_DE_SESION } from '../sesion/configuracion';

/** Lo que espera la guarda al servidor antes de rendirse y dejar pasar. */
export const ESPERA_MAXIMA_DE_PERFIL = 8000;

const RESPUESTA = {
  conPerfil: 'con-perfil',
  sinPerfil: 'sin-perfil',
  desconocida: 'desconocida',
} as const;

type Respuesta = (typeof RESPUESTA)[keyof typeof RESPUESTA];

/**
 * Pregunta a /yo si hay perfil. Solo contesta "sin perfil" cuando el servidor lo
 * dice sin ambiguedad (tiene_perfil=false o 404). Red caida, timeout, 5xx o una
 * respuesta rara son "desconocida": un arranque en frio de Render nunca debe
 * mandar a nadie a darse de alta.
 */
async function consultar(http: HttpClient, urlApi: string): Promise<Respuesta> {
  try {
    const cuerpo = await firstValueFrom(
      http.get<unknown>(`${urlApi}/yo`).pipe(timeout(ESPERA_MAXIMA_DE_PERFIL)),
    );
    const tiene = typeof cuerpo === 'object' && cuerpo !== null ? (cuerpo as Record<string, unknown>)['tiene_perfil'] : undefined;
    if (tiene === true) return RESPUESTA.conPerfil;
    if (tiene === false) return RESPUESTA.sinPerfil;
    return RESPUESTA.desconocida;
  } catch (error) {
    return error instanceof HttpErrorResponse && error.status === 404 ? RESPUESTA.sinPerfil : RESPUESTA.desconocida;
  }
}

/** Sin perfil, al alta; con perfil o ante la duda, pasa. */
export const conPerfil: CanActivateFn = async () => {
  const router = inject(Router);
  const respuesta = await consultar(inject(HttpClient), inject(CONFIGURACION_DE_SESION).urlApi);
  return respuesta === RESPUESTA.sinPerfil ? router.createUrlTree(['/alta']) : true;
};

/** Con perfil, al panel (no se repite el alta); sin perfil o ante la duda, pasa. */
export const sinPerfil: CanActivateFn = async () => {
  const router = inject(Router);
  const respuesta = await consultar(inject(HttpClient), inject(CONFIGURACION_DE_SESION).urlApi);
  return respuesta === RESPUESTA.conPerfil ? router.createUrlTree(['/panel']) : true;
};
