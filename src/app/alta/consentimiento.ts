import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';

import { TextoDeConsentimiento } from '../compartido/texto-de-consentimiento';

/**
 * El consentimiento antes de subir nada, mas la confirmacion de ser mayor de
 * 18 años (sin ella no se continua). El texto debe nombrar a todos los
 * proveedores a los que puede llegar el CV y todos los usos; si cambia el
 * fondo, se sube VERSION_DE_CONSENTIMIENTO (dominio.ts).
 */
@Component({
  selector: 'app-consentimiento',
  imports: [TextoDeConsentimiento],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './alta.css',
  template: `
    <section class="paso columna-formulario" aria-labelledby="consentimiento-titulo">
      <h2 class="titulo-seccion" id="consentimiento-titulo" tabindex="-1" data-titulo-de-paso i18n="Titulo del paso de consentimiento@@alta.consentimiento.titulo">
        Antes de empezar
      </h2>
      <app-texto-de-consentimiento />

      <div class="casilla">
        <input
          id="consentimiento-casilla"
          type="checkbox"
          aria-describedby="consentimiento-texto"
          [checked]="marcado()"
          (change)="alternar($event)"
        />
        <label
          for="consentimiento-casilla"
          i18n="Casilla de consentimiento@@alta.consentimiento.casilla"
        >
          Entiendo y acepto que mi CV se guarde cifrado y que se envíe a Anthropic y Groq, en Estados Unidos, para
          extraer mi perfil y para generar mis CV y cartas cuando yo lo pida.
        </label>
      </div>

      <div class="casilla">
        <input
          id="consentimiento-mayor"
          type="checkbox"
          [checked]="mayorDeEdad()"
          (change)="alternarEdad($event)"
        />
        <label for="consentimiento-mayor" i18n="Casilla de mayoria de edad@@alta.consentimiento.mayor">
          Confirmo que tengo 18 años o más.
        </label>
      </div>

      @if (conError()) {
        <p class="error" role="alert" i18n="Error al registrar el consentimiento@@alta.consentimiento.error">
          No hemos podido registrar tu consentimiento. Prueba de nuevo.
        </p>
      }

      <div class="acciones">
        <button
          type="button"
          class="boton boton--primario boton--grande boton--bloque"
          data-continuar
          [disabled]="!marcado() || !mayorDeEdad() || ocupado()"
          [attr.aria-busy]="ocupado() ? 'true' : null"
          (click)="aceptar.emit()"
        >
          @if (ocupado()) {
            <ng-container i18n="Boton de consentimiento mientras se registra@@alta.consentimiento.registrando">Registrando tu consentimiento…</ng-container>
          } @else {
            <ng-container i18n="Boton que acepta el consentimiento@@alta.consentimiento.continuar">Continuar</ng-container>
          }
        </button>
        <button
          type="button"
          class="boton boton--neutro boton--bloque"
          data-a-mano
          (click)="aMano.emit()"
          i18n="Boton para rellenar el perfil sin subir CV@@alta.consentimiento.aMano"
        >
          Prefiero rellenar el perfil a mano
        </button>
      </div>
    </section>
  `,
})
export class Consentimiento {
  readonly conError = input(false);
  /** True while the consent request is in flight. */
  readonly ocupado = input(false);
  readonly aceptar = output<void>();
  readonly aMano = output<void>();

  protected readonly marcado = signal(false);
  protected readonly mayorDeEdad = signal(false);

  protected alternar(evento: Event): void {
    this.marcado.set((evento.target as HTMLInputElement).checked);
  }

  protected alternarEdad(evento: Event): void {
    this.mayorDeEdad.set((evento.target as HTMLInputElement).checked);
  }
}
