import { CanActivateFn } from '@angular/router';

import { soloConSesion } from './solo-con-sesion';

/**
 * Que guardas protegen el panel. Mismo criterio que elegirRepositorio: solo
 * los datos reales exigen sesion; la demo publica no tiene nada que proteger.
 */
export function elegirGuardas(esDesarrollo: boolean): CanActivateFn[] {
  return esDesarrollo ? [soloConSesion] : [];
}
