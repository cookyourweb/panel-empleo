import { afterRenderEffect, ChangeDetectionStrategy, Component, ElementRef, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { Sesion } from '../sesion/sesion';
import { RepositorioDeCuenta } from './repositorio-de-cuenta';

/**
 * Borrar la cuenta. Dos pasos dentro de la propia pagina (nada de confirm() del
 * navegador): explicar que se borra y pedir una confirmacion explicita.
 */
@Component({
  selector: 'app-cuenta',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: '../alta/alta.css',
  template: `
    @if (!confirmando()) {
      <section class="paso" aria-labelledby="cuenta-titulo">
        <h1 id="cuenta-titulo" tabindex="-1" data-titulo-de-paso i18n="Titulo de la pagina de cuenta@@cuenta.titulo">
          Tu cuenta
        </h1>
        <p i18n="Que se borra al eliminar la cuenta@@cuenta.explicacion">
          Si borras tu cuenta eliminamos tu perfil, tu CV cifrado y tus consentimientos. Es inmediato y no se puede
          deshacer.
        </p>
        <div class="acciones">
          <button type="button" data-borrar (click)="pedirConfirmacion()" i18n="Boton que inicia el borrado@@cuenta.borrar">
            Borrar mi cuenta
          </button>
        </div>
      </section>
    } @else {
      <section class="paso" aria-labelledby="cuenta-confirmar-titulo">
        <h1
          id="cuenta-confirmar-titulo"
          tabindex="-1"
          data-titulo-de-paso
          i18n="Titulo de la confirmacion del borrado@@cuenta.confirmar.titulo"
        >
          ¿Seguro que quieres borrar tu cuenta?
        </h1>
        <p i18n="Aviso final antes de borrar@@cuenta.confirmar.texto">
          Se borrarán tu perfil, tu CV cifrado y tus consentimientos, y se cerrará tu sesión. Para volver a usar el
          panel necesitarías una nueva invitación.
        </p>

        @if (error()) {
          <p class="error" role="alert" i18n="Error al borrar la cuenta@@cuenta.error">
            No hemos podido borrar tu cuenta. No se ha borrado nada: prueba de nuevo.
          </p>
        }

        <div class="acciones">
          <button type="button" data-confirmar [disabled]="borrando()" (click)="confirmar()" i18n="Boton que confirma el borrado@@cuenta.confirmar">
            Sí, borrar todo
          </button>
          <button type="button" data-cancelar [disabled]="borrando()" (click)="cancelar()" i18n="Boton que cancela el borrado@@cuenta.cancelar">
            Cancelar
          </button>
        </div>
      </section>
    }
  `,
})
export class CuentaPage {
  private readonly repositorio = inject(RepositorioDeCuenta);
  private readonly sesion = inject(Sesion);
  private readonly router = inject(Router);
  private readonly anfitrion = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly confirmando = signal(false);
  protected readonly borrando = signal(false);
  protected readonly error = signal(false);

  private primerPaso = true;

  constructor() {
    afterRenderEffect(() => {
      this.confirmando();
      if (this.primerPaso) {
        this.primerPaso = false;
        return;
      }
      this.anfitrion.nativeElement.querySelector<HTMLElement>('[data-titulo-de-paso]')?.focus();
    });
  }

  protected pedirConfirmacion(): void {
    this.confirmando.set(true);
  }

  protected cancelar(): void {
    this.error.set(false);
    this.confirmando.set(false);
  }

  protected async confirmar(): Promise<void> {
    if (this.borrando()) return;
    this.borrando.set(true);
    this.error.set(false);
    try {
      await this.repositorio.borrar();
    } catch {
      this.error.set(true);
      this.borrando.set(false);
      return;
    }
    this.sesion.cerrar();
    await this.router.navigateByUrl('/');
  }
}
