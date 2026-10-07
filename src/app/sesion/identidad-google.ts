import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';

import { ProveedorDeIdentidad } from './proveedor-de-identidad';

const URL_SCRIPT = 'https://accounts.google.com/gsi/client';

/** Adaptador de Google Identity Services: el unico sitio que nombra a Google. */
@Injectable()
export class IdentidadGoogle extends ProveedorDeIdentidad {
  private readonly documento = inject(DOCUMENT);
  private carga: Promise<void> | null = null;

  async preparar(_contenedor: HTMLElement, _alRecibir: (credencial: string) => void): Promise<void> {
    await this.cargarScript();
  }

  olvidar(): void {
    // Se completa al inicializar el boton.
  }

  /** Una sola carga aunque se prepare varias veces: se reutiliza la promesa. */
  private cargarScript(): Promise<void> {
    this.carga ??= new Promise<void>((resolver, rechazar) => {
      const script = this.documento.createElement('script');
      script.src = URL_SCRIPT;
      script.async = true;
      script.addEventListener('load', () => resolver());
      script.addEventListener('error', () => rechazar(new Error('No se pudo cargar el script de identidad')));
      this.documento.head.appendChild(script);
    });
    return this.carga;
  }
}
