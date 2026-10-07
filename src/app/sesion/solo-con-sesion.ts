import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { Sesion } from './sesion';

function caducidadEnSegundos(token: string): number | null {
  try {
    const carga = token.split('.')[1];
    if (!carga) return null;
    const base64 = carga.replace(/-/g, '+').replace(/_/g, '/');
    const payload: unknown = JSON.parse(atob(base64));
    if (typeof payload !== 'object' || payload === null) return null;
    const exp = (payload as Record<string, unknown>)['exp'];
    return typeof exp === 'number' ? exp : null;
  } catch {
    return null;
  }
}

function estaVigente(token: string | null): boolean {
  if (token === null) return false;
  const exp = caducidadEnSegundos(token);
  return exp !== null && exp * 1000 > Date.now();
}

/** Solo deja pasar con sesion activa y token sin caducar; si no, a /entrar. */
export const soloConSesion: CanActivateFn = (_ruta, estado) => {
  const sesion = inject(Sesion);
  const router = inject(Router);
  if (sesion.activa() && estaVigente(sesion.token())) return true;
  sesion.cerrar();
  return router.createUrlTree(['/entrar'], { queryParams: { volver: estado.url } });
};
