import { DOCUMENT } from '@angular/common';
import { inject, Injectable, LOCALE_ID } from '@angular/core';

import { CONFIGURACION_DE_SESION } from './configuracion';
import { ProveedorDeIdentidad } from './proveedor-de-identidad';

const URL_SCRIPT = 'https://accounts.google.com/gsi/client';

interface RespuestaDeGoogle {
  readonly credential: string;
}

/** Lo minimo que usamos del objeto global que deja el script de Google. */
interface GoogleAccountsId {
  initialize(opciones: {
    client_id: string;
    callback: (respuesta: RespuestaDeGoogle) => void;
    auto_select: boolean;
  }): void;
  renderButton(contenedor: HTMLElement, opciones: Record<string, string>): void;
  prompt(): void;
  disableAutoSelect(): void;
}

function leerGoogle(ventana: Window): GoogleAccountsId | null {
  const candidata = (ventana as unknown as Record<string, unknown>)['google'];
  if (typeof candidata !== 'object' || candidata === null) return null;
  const cuentas = (candidata as Record<string, unknown>)['accounts'];
  if (typeof cuentas !== 'object' || cuentas === null) return null;
  const id = (cuentas as Record<string, unknown>)['id'];
  return typeof id === 'object' && id !== null ? (id as GoogleAccountsId) : null;
}

/** Adaptador de Google Identity Services: el unico sitio que nombra a Google. */
@Injectable()
export class IdentidadGoogle extends ProveedorDeIdentidad {
  private readonly documento = inject(DOCUMENT);
  private readonly configuracion = inject(CONFIGURACION_DE_SESION);
  private readonly locale = inject(LOCALE_ID);
  private carga: Promise<void> | null = null;

  async preparar(
    contenedor: HTMLElement,
    alRecibir: (credencial: string) => void,
    cancelacion?: AbortSignal,
  ): Promise<void> {
    await this.cargarScript();
    if (cancelacion?.aborted) return;
    const google = this.google();
    if (!google) throw new Error('El script de identidad no dejo su objeto global');
    google.initialize({
      client_id: this.configuracion.idCliente,
      callback: (respuesta) => alRecibir(respuesta.credential),
      auto_select: true,
    });
    google.renderButton(contenedor, { type: 'standard', theme: 'filled_black', size: 'large', locale: this.locale });
    google.prompt();
  }

  olvidar(): void {
    this.google()?.disableAutoSelect();
  }

  private google(): GoogleAccountsId | null {
    const ventana = this.documento.defaultView;
    return ventana ? leerGoogle(ventana) : null;
  }

  /**
   * Una sola carga aunque se prepare varias veces: se reutiliza la promesa.
   * Si falla no se guarda: se retira el script roto y el siguiente intento
   * (el boton Reintentar) vuelve a pedirlo en vez de heredar el rechazo.
   */
  private cargarScript(): Promise<void> {
    this.carga ??= new Promise<void>((resolver, rechazar) => {
      const script = this.documento.createElement('script');
      script.src = URL_SCRIPT;
      script.async = true;
      script.addEventListener('load', () => resolver());
      script.addEventListener('error', () => {
        script.remove();
        this.carga = null;
        rechazar(new Error('No se pudo cargar el script de identidad'));
      });
      this.documento.head.appendChild(script);
    });
    return this.carga;
  }
}
