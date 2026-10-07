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

/**
 * Quien ha entrado. Vive solo en memoria: recargar la pagina cierra la sesion
 * y nada de la credencial toca localStorage ni sessionStorage.
 */
@Injectable({ providedIn: 'root' })
export class Sesion {
  private readonly http = inject(HttpClient);
  private readonly configuracion = inject(CONFIGURACION_DE_SESION);

  private readonly _usuaria = signal<Usuaria | null>(null);
  private credencial: string | null = null;

  readonly usuaria = this._usuaria.asReadonly();
  readonly activa = computed(() => this._usuaria() !== null);

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
      this.credencial = credencial;
      return RESULTADO_DE_ENTRADA.dentro;
    } catch (error) {
      return resultadoDeError(error);
    }
  }

  cerrar(): void {
    this._usuaria.set(null);
    this.credencial = null;
  }
}

function resultadoDeError(error: unknown): ResultadoDeEntrada {
  const status = error instanceof HttpErrorResponse ? error.status : 0;
  if (status === 403) return RESULTADO_DE_ENTRADA.noInvitada;
  if (status === 0 || status === 503) return RESULTADO_DE_ENTRADA.sinServidor;
  return RESULTADO_DE_ENTRADA.rechazada;
}
