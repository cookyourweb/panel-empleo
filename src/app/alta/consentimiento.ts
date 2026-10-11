import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';

import { URL_DE_PRIVACIDAD } from '../marca/enlaces-de-marca';

/**
 * El consentimiento antes de subir nada, mas la confirmacion de ser mayor de
 * 18 años (sin ella no se continua). El texto debe nombrar a todos los
 * proveedores a los que puede llegar el CV y todos los usos; si cambia el
 * fondo, se sube VERSION_DE_CONSENTIMIENTO (dominio.ts).
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
      <div id="consentimiento-texto">
        <p i18n="Que se guarda del CV@@alta.consentimiento.texto">
          Guardamos tu CV cifrado. Solo se guarda el texto, no el archivo que subes.
        </p>
        <p i18n="A quien se envia el CV y para que@@alta.consentimiento.textoIa">
          Para proponerte los datos de tu perfil, el texto de tu CV se envía una vez a Anthropic y a Groq, proveedores
          de inteligencia artificial que lo procesan en Estados Unidos. Cuando lo pidas, también se envía para generar
          CV y cartas de presentación adaptados a cada oferta.
        </p>
        <p i18n="Como borrar el CV o retirar el consentimiento@@alta.consentimiento.textoDerechos">
          Puedes borrar tu CV o retirar tu consentimiento cuando quieras desde «Tu cuenta».
        </p>
        @if (urlDePrivacidad) {
          <p>
            <ng-container i18n="Antes del enlace a la politica de privacidad@@alta.consentimiento.privacidadAntes">Más información en nuestra</ng-container>
            <a
              data-privacidad
              [href]="urlDePrivacidad"
              target="_blank"
              rel="noopener noreferrer"
              i18n="Enlace a la politica de privacidad@@alta.consentimiento.privacidad"
              >política de privacidad</a
            >.
          </p>
        }
      </div>

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
  /** Vacia mientras no exista la politica de Empleo Tech: entonces no se pinta enlace. */
  protected readonly urlDePrivacidad = inject(URL_DE_PRIVACIDAD);

  protected alternar(evento: Event): void {
    this.marcado.set((evento.target as HTMLInputElement).checked);
  }

  protected alternarEdad(evento: Event): void {
    this.mayorDeEdad.set((evento.target as HTMLInputElement).checked);
  }
}
