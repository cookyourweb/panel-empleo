import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { AltaStore, PASOS } from './alta.store';
import { Consentimiento } from './consentimiento';
import { SubidaDeCv } from './subida-de-cv';

/**
 * El contenedor del alta: lee el store y pinta el paso que toca.
 * Los puertos (RepositorioDePerfil, ExtractorDeCv) los aporta quien monte la
 * ruta con elegirAdaptadoresDeAlta.
 */
@Component({
  selector: 'app-alta',
  imports: [Consentimiento, SubidaDeCv],
  providers: [AltaStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './alta.css',
  template: `
    <h1 i18n="Titulo de la pantalla de alta@@alta.titulo">Tu perfil</h1>

    <!-- La region existe siempre: un role="status" que nace ya con texto no se
         anuncia de forma fiable. Solo cambia el texto de dentro. -->
    <div role="status" class="paso">
      @if (store.paso() === pasos.extrayendo) {
        <p i18n="Aviso de que se esta leyendo el CV@@alta.extrayendo">Leyendo tu CV, un momento</p>
      }
    </div>

    @switch (store.paso()) {
      @case (pasos.consentimiento) {
        <app-consentimiento
          [conError]="store.errorDeConsentimiento()"
          (aceptar)="store.consentir()"
          (aMano)="store.irAManual()"
        />
      }
      @case (pasos.subida) {
        <app-subida-de-cv
          [rechazo]="store.rechazoDeSubida()"
          (elegido)="store.subirCv($event)"
          (aMano)="store.irAManual()"
        />
      }
    }
  `,
})
export class AltaPage {
  protected readonly store = inject(AltaStore);
  protected readonly pasos = PASOS;
}
