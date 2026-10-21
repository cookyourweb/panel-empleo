import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { Cuota, cuotaDeCuerpo } from '../cuota/cuota';
import { CONFIGURACION_DE_SESION } from './configuracion';

export const RESULTADO_DE_ENTRADA = {
  dentro: 'dentro',
  rechazada: 'rechazada',
  noInvitada: 'no-invitada',
  sinServidor: 'sin-servidor',
} as const;

export type ResultadoDeEntrada = (typeof RESULTADO_DE_ENTRADA)[keyof typeof RESULTADO_DE_ENTRADA];

/** How long a /yo answer about the profile is trusted before the guards ask again. */
export const VIGENCIA_DE_PERFIL_MS = 30_000;

export type OrigenMaster = 'drive' | 'neon';

/** What the latest /yo said about the profile, and when it was learned. */
export interface EstadoDePerfil {
  readonly tienePerfil: boolean;
  readonly origenMaster: OrigenMaster | null;
  readonly conocidoEn: number;
}

/** What the latest /yo said about the generation quota (null: none applies), and when. */
interface EstadoDeCuota {
  readonly cuota: Cuota | null;
  readonly conocidoEn: number;
}

/** Which consents are active for the current text version (true only for it and not withdrawn). */
export interface ConsentimientosVigentes {
  readonly almacenarCv: boolean;
  readonly enviarCvAIa: boolean;
}

interface EstadoDeConsentimientos {
  readonly valores: ConsentimientosVigentes;
  readonly conocidoEn: number;
}

export interface Usuaria {
  readonly sub: string;
  readonly email: string;
  readonly nombre: string;
}

function esUsuaria(valor: unknown): valor is Usuaria {
  if (typeof valor !== 'object' || valor === null) return false;
  const candidata = valor as Record<string, unknown>;
  return (
    typeof candidata['sub'] === 'string' &&
    typeof candidata['email'] === 'string' &&
    typeof candidata['nombre'] === 'string'
  );
}

function estadoDePerfilDe(cuerpo: unknown): EstadoDePerfil | null {
  if (typeof cuerpo !== 'object' || cuerpo === null) return null;
  const { tiene_perfil: tiene, origen_master: origen } = cuerpo as Record<string, unknown>;
  // Only a definite boolean counts: anything else means "unknown", never "no profile".
  if (typeof tiene !== 'boolean') return null;
  return {
    tienePerfil: tiene,
    origenMaster: origen === 'drive' || origen === 'neon' ? origen : null,
    conocidoEn: Date.now(),
  };
}

/** Absent or malformed means "unknown" (null), never "no consent". */
function consentimientosDe(cuerpo: unknown): ConsentimientosVigentes | null {
  if (typeof cuerpo !== 'object' || cuerpo === null) return null;
  const bruto = (cuerpo as Record<string, unknown>)['consentimientos'];
  if (typeof bruto !== 'object' || bruto === null) return null;
  const { almacenar_cv: almacenar, enviar_cv_a_ia: enviar } = bruto as Record<string, unknown>;
  if (typeof almacenar !== 'boolean' || typeof enviar !== 'boolean') return null;
  return { almacenarCv: almacenar, enviarCvAIa: enviar };
}

/**
 * Quien ha entrado. Vive solo en memoria: recargar la pagina cierra la sesion
 * y nada de la credencial toca localStorage ni sessionStorage.
 */
@Injectable({ providedIn: 'root' })
export class Sesion {
  private readonly http = inject(HttpClient);
  private readonly configuracion = inject(CONFIGURACION_DE_SESION);

  private readonly _usuaria = signal<Usuaria | null>(null);
  private readonly _perfil = signal<EstadoDePerfil | null>(null);
  private readonly _cuota = signal<EstadoDeCuota | null>(null);
  private readonly _consentimientos = signal<EstadoDeConsentimientos | null>(null);
  private credencial: string | null = null;

  readonly usuaria = this._usuaria.asReadonly();
  readonly activa = computed(() => this._usuaria() !== null);
  /** The latest definite /yo answer about the profile, or null while unknown. */
  readonly perfil = this._perfil.asReadonly();
  /** The latest quota /yo reported; null when none applies (owner, exempt, legacy) or unknown. */
  readonly cuota = computed(() => this._cuota()?.cuota ?? null);
  /** The latest consent state /yo reported; null when unknown (never read it as "no consent"). */
  readonly consentimientos = computed(() => this._consentimientos()?.valores ?? null);

  token(): string | null {
    return this.credencial;
  }

  /** Comprueba la credencial en /yo. Solo guarda algo si el servidor la acepta. */
  async entrar(credencial: string): Promise<ResultadoDeEntrada> {
    try {
      // La cabecera va a mano: entrar no depende de ningun interceptor.
      const cuerpo = await firstValueFrom(
        this.http.get<unknown>(`${this.configuracion.urlApi}/yo`, {
          headers: { Authorization: `Bearer ${credencial}` },
        }),
      );
      if (!esUsuaria(cuerpo)) return RESULTADO_DE_ENTRADA.sinServidor;
      this._usuaria.set(cuerpo);
      this._perfil.set(estadoDePerfilDe(cuerpo));
      this.recordarCuota(cuerpo);
      this.recordarConsentimientos(cuerpo);
      this.credencial = credencial;
      return RESULTADO_DE_ENTRADA.dentro;
    } catch (error) {
      return resultadoDeError(error);
    }
  }

  /** The profile answer, only while it is fresh enough for the guards to reuse. */
  perfilReciente(): EstadoDePerfil | null {
    const estado = this._perfil();
    return estado !== null && Date.now() - estado.conocidoEn <= VIGENCIA_DE_PERFIL_MS ? estado : null;
  }

  /** The quota answer, only while /yo is fresh enough to reuse; `{ cuota: null }` means "none applies". */
  cuotaReciente(): { cuota: Cuota | null } | null {
    const estado = this._cuota();
    return estado !== null && Date.now() - estado.conocidoEn <= VIGENCIA_DE_PERFIL_MS
      ? { cuota: estado.cuota }
      : null;
  }

  /** The consent answer, only while /yo is fresh enough to reuse. */
  consentimientosRecientes(): ConsentimientosVigentes | null {
    const estado = this._consentimientos();
    return estado !== null && Date.now() - estado.conocidoEn <= VIGENCIA_DE_PERFIL_MS ? estado.valores : null;
  }

  /**
   * Asks /yo again (after a generation, say) and refreshes what it says about the
   * profile and the quota. The interceptor adds the token. Rejects if /yo fails,
   * leaving what was known untouched.
   */
  async refrescar(): Promise<void> {
    const cuerpo = await firstValueFrom(this.http.get<unknown>(`${this.configuracion.urlApi}/yo`));
    if (!esUsuaria(cuerpo)) return;
    const perfil = estadoDePerfilDe(cuerpo);
    if (perfil !== null) this._perfil.set(perfil);
    this.recordarCuota(cuerpo);
    this.recordarConsentimientos(cuerpo);
  }

  private recordarConsentimientos(cuerpo: unknown): void {
    const valores = consentimientosDe(cuerpo);
    this._consentimientos.set(valores === null ? null : { valores, conocidoEn: Date.now() });
  }

  private recordarCuota(cuerpo: unknown): void {
    this._cuota.set({ cuota: cuotaDeCuerpo(cuerpo), conocidoEn: Date.now() });
  }

  /** Keeps a definite answer learned elsewhere (a guard's own /yo, a 404). */
  recordarPerfil(estado: { tienePerfil: boolean; origenMaster: OrigenMaster | null }): void {
    this._perfil.set({ ...estado, conocidoEn: Date.now() });
  }

  /** The profile was just saved: the cached answer must never send the user back to /alta. */
  perfilGuardado(): void {
    this.recordarPerfil({ tienePerfil: true, origenMaster: null });
  }

  /** Both consents were just recorded: the sign-in /yo still says "none" and must not be shown. */
  consentimientosDados(): void {
    this._consentimientos.set({ valores: { almacenarCv: true, enviarCvAIa: true }, conocidoEn: Date.now() });
  }

  cerrar(): void {
    this._usuaria.set(null);
    this._perfil.set(null);
    this._cuota.set(null);
    this._consentimientos.set(null);
    this.credencial = null;
  }
}

function resultadoDeError(error: unknown): ResultadoDeEntrada {
  const status = error instanceof HttpErrorResponse ? error.status : 0;
  if (status === 403) return RESULTADO_DE_ENTRADA.noInvitada;
  if (status === 0 || status === 503) return RESULTADO_DE_ENTRADA.sinServidor;
  return RESULTADO_DE_ENTRADA.rechazada;
}
