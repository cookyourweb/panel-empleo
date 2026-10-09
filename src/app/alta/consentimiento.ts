import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';

/**
 * El consentimiento antes de subir nada. El texto debe nombrar a todos los
 * proveedores a los que puede llegar el CV; si cambia el fondo, se sube
 * VERSION_DE_CONSENTIMIENTO (dominio.ts).
 */
@Component({
  selector: 'app-consentimiento',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './alta.css',
  template: `
    <section class="paso" aria-labelledby="consentimiento-titulo">
      <h2 id="consentimiento-titulo" tabindex="-1" data-titulo-de-paso i18n="Titulo del paso de consentimiento@@alta.consentimiento.titulo">
        Antes de empezar
      </h2>
      <p id="consentimiento-texto" i18n="Explicacion de que pasa con el CV@@alta.consentimiento.texto">
        Guardamos tu CV cifrado. Para proponerte los datos de tu perfil, el texto de tu CV puede enviarse una sola vez
        a proveedores externos de inteligencia artificial (Anthropic y Groq). Puedes borrar tu CV y tu cuenta cuando
        quieras.
      </p>

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
          Entiendo y acepto que mi CV se guarde cifrado y que pueda enviarse a Anthropic y Groq para extraer mi perfil.
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
          data-continuar
          [disabled]="!marcado()"
          (click)="aceptar.emit()"
          i18n="Boton que acepta el consentimiento@@alta.consentimiento.continuar"
        >
          Continuar
        </button>
        <button
          type="button"
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
  readonly aceptar = output<void>();
  readonly aMano = output<void>();

  protected readonly marcado = signal(false);

  protected alternar(evento: Event): void {
    this.marcado.set((evento.target as HTMLInputElement).checked);
  }
}
