import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { firstValueFrom, timeout } from 'rxjs';

import { CONFIGURACION_DE_SESION } from '../sesion/configuracion';
import { OrigenMaster, Sesion } from '../sesion/sesion';

/** Lo que espera la guarda al servidor antes de rendirse y dejar pasar. */
export const ESPERA_MAXIMA_DE_PERFIL = 8000;

const RESPUESTA = {
  conPerfil: 'con-perfil',
  sinPerfil: 'sin-perfil',
  desconocida: 'desconocida',
} as const;

type Respuesta = (typeof RESPUESTA)[keyof typeof RESPUESTA];

function origenDe(cuerpo: Record<string, unknown> | undefined): OrigenMaster | null {
  const origen = cuerpo?.['origen_master'];
  return origen === 'drive' || origen === 'neon' ? origen : null;
}

/**
 * Responde con lo que la sesion ya sabe de /yo si es reciente; solo si no, lo
 * pregunta. Solo contesta "sin perfil" cuando el servidor lo dice sin
 * ambiguedad (tiene_perfil=false o 404). Red caida, timeout, 5xx o una
 * respuesta rara son "desconocida" (y no se recuerdan): un arranque en frio de
 * Render nunca debe mandar a nadie a darse de alta.
 */
async function consultar(http: HttpClient, urlApi: string, sesion: Sesion): Promise<Respuesta> {
  const conocido = sesion.perfilReciente();
  if (conocido !== null) return conocido.tienePerfil ? RESPUESTA.conPerfil : RESPUESTA.sinPerfil;
  try {
    const cuerpo = await firstValueFrom(
      http.get<unknown>(`${urlApi}/yo`).pipe(timeout(ESPERA_MAXIMA_DE_PERFIL)),
    );
    const registro = typeof cuerpo === 'object' && cuerpo !== null ? (cuerpo as Record<string, unknown>) : undefined;
    const tiene = registro?.['tiene_perfil'];
    if (tiene === true || tiene === false) {
      sesion.recordarPerfil({ tienePerfil: tiene, origenMaster: origenDe(registro) });
      return tiene ? RESPUESTA.conPerfil : RESPUESTA.sinPerfil;
    }
    return RESPUESTA.desconocida;
  } catch (error) {
    if (error instanceof HttpErrorResponse && error.status === 404) {
      sesion.recordarPerfil({ tienePerfil: false, origenMaster: null });
      return RESPUESTA.sinPerfil;
    }
    return RESPUESTA.desconocida;
  }
}

/** Sin perfil, al alta; con perfil o ante la duda, pasa. */
export const conPerfil: CanActivateFn = async () => {
  const router = inject(Router);
  const respuesta = await consultar(inject(HttpClient), inject(CONFIGURACION_DE_SESION).urlApi, inject(Sesion));
  return respuesta === RESPUESTA.sinPerfil ? router.createUrlTree(['/alta']) : true;
};

/** Con perfil, al panel (no se repite el alta); sin perfil o ante la duda, pasa. */
export const sinPerfil: CanActivateFn = async () => {
  const router = inject(Router);
  const respuesta = await consultar(inject(HttpClient), inject(CONFIGURACION_DE_SESION).urlApi, inject(Sesion));
  return respuesta === RESPUESTA.conPerfil ? router.createUrlTree(['/panel']) : true;
};
