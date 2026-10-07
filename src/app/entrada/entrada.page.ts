import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { ProveedorDeIdentidad } from '../sesion/proveedor-de-identidad';
import { RESULTADO_DE_ENTRADA, ResultadoDeEntrada, Sesion } from '../sesion/sesion';

const MENSAJES = {
  [RESULTADO_DE_ENTRADA.dentro]: null,
  [RESULTADO_DE_ENTRADA.rechazada]: 'No se pudo comprobar tu cuenta',
  [RESULTADO_DE_ENTRADA.noInvitada]: 'Tu cuenta no está invitada',
  [RESULTADO_DE_ENTRADA.sinServidor]: 'El servidor no puede comprobar la identidad ahora',
} as const satisfies Record<ResultadoDeEntrada, string | null>;

/** Solo rutas internas: evita que un enlace de entrada nos mande a otro sitio. */
function rutaInterna(volver: string | null): string {
  const esInterna =
    volver !== null && volver.startsWith('/') && !volver.startsWith('//') && !volver.includes('\\');
  return esInterna ? volver : '/';
}

@Component({
  selector: 'app-entrada',
  templateUrl: './entrada.page.html',
  styleUrl: './entrada.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntradaPage {
  private readonly proveedor = inject(ProveedorDeIdentidad);
  private readonly sesion = inject(Sesion);
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);
  private readonly acceso = viewChild.required<ElementRef<HTMLElement>>('acceso');

  protected readonly error = signal<string | null>(null);

  constructor() {
    afterNextRender(() => {
      void this.proveedor.preparar(
        this.acceso().nativeElement,
        (credencial) => void this.entrar(credencial),
      );
    });
  }

  private async entrar(credencial: string): Promise<void> {
    const resultado = await this.sesion.entrar(credencial);
    if (resultado === RESULTADO_DE_ENTRADA.dentro) {
      await this.router.navigateByUrl(rutaInterna(this.ruta.snapshot.queryParamMap.get('volver')));
      return;
    }
    if (resultado === RESULTADO_DE_ENTRADA.noInvitada) this.proveedor.olvidar();
    this.error.set(MENSAJES[resultado]);
  }
}
