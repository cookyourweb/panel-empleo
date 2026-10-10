import { InjectionToken } from '@angular/core';

/**
 * Go-live switches. Both are off until the cv-server publishes the endpoints
 * each feature needs (see the "Go-live checklist" in the README). While off,
 * the matching routes and screens are not exposed at all: the in-memory demo
 * adapters must never present invented data as real in production.
 */

/** Sign-up and account: /perfil, /consentimientos, /cv, /extraccion, /cuenta. */
export const ALTA_CON_BACKEND = false;

/** Fit analysis: /ofertas/{id}/encaje and /encajes. */
export const ENCAJE_CON_BACKEND = false;

/** Whether the sign-up and account screens are available. Overridable in tests. */
export const ALTA_ACTIVA = new InjectionToken<boolean>('ALTA_ACTIVA', {
  providedIn: 'root',
  factory: () => ALTA_CON_BACKEND,
});

/** Whether the fit analysis is available. Overridable in tests. */
export const ENCAJE_ACTIVO = new InjectionToken<boolean>('ENCAJE_ACTIVO', {
  providedIn: 'root',
  factory: () => ENCAJE_CON_BACKEND,
});
