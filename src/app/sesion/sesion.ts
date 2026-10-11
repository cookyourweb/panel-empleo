import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

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
  private credencial: string | null = null;

  readonly usuaria = this._usuaria.asReadonly();
  readonly activa = computed(() => this._usuaria() !== null);
  /** The latest definite /yo answer about the profile, or null while unknown. */
  readonly perfil = this._perfil.asReadonly();

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

  /** Keeps a definite answer learned elsewhere (a guard's own /yo, a 404). */
  recordarPerfil(estado: { tienePerfil: boolean; origenMaster: OrigenMaster | null }): void {
    this._perfil.set({ ...estado, conocidoEn: Date.now() });
  }

  /** The profile was just saved: the cached answer must never send the user back to /alta. */
  perfilGuardado(): void {
    this.recordarPerfil({ tienePerfil: true, origenMaster: null });
  }

  cerrar(): void {
    this._usuaria.set(null);
    this._perfil.set(null);
    this.credencial = null;
  }
}

function resultadoDeError(error: unknown): ResultadoDeEntrada {
  const status = error instanceof HttpErrorResponse ? error.status : 0;
  if (status === 403) return RESULTADO_DE_ENTRADA.noInvitada;
  if (status === 0 || status === 503) return RESULTADO_DE_ENTRADA.sinServidor;
  return RESULTADO_DE_ENTRADA.rechazada;
}
