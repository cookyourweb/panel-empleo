import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { URL_DE_PRIVACIDAD } from '../marca/enlaces-de-marca';

/**
 * El texto del consentimiento (v2), compartido por el alta y Tu cuenta para que
 * no puedan decir cosas distintas. Debe nombrar a todos los proveedores a los
 * que puede llegar el CV y todos los usos; si cambia el fondo, se sube
 * VERSION_DE_CONSENTIMIENTO (alta/dominio.ts).
 */
@Component({
  selector: 'app-texto-de-consentimiento',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
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
  `,
})
export class TextoDeConsentimiento {
  /** Vacia mientras no exista la politica de Empleo Tech: entonces no se pinta enlace. */
  protected readonly urlDePrivacidad = inject(URL_DE_PRIVACIDAD);
}
