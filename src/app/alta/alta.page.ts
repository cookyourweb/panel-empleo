import { afterRenderEffect, ChangeDetectionStrategy, Component, ElementRef, inject } from '@angular/core';

import { AltaStore, PASOS } from './alta.store';
import { Consentimiento } from './consentimiento';
import { MotivoManual } from './dominio';
import { FormularioManual } from './formulario-manual';
import { RevisionDeCampos } from './revision-de-campos';
import { SubidaDeCv } from './subida-de-cv';

const MENSAJES_DE_MOTIVO: Readonly<Record<MotivoManual, string>> = {
  desactivada: $localize`:Motivo manual, lectura apagada@@alta.manual.motivo.desactivada:La lectura automática del CV no está disponible por ahora. Rellena tu perfil a mano.`,
  ya_usada: $localize`:Motivo manual, lectura ya usada@@alta.manual.motivo.yaUsada:Ya has usado tu lectura automática del CV. Rellena tu perfil a mano.`,
  tope: $localize`:Motivo manual, tope mensual@@alta.manual.motivo.tope:Hemos llegado al límite de lecturas automáticas de este mes. Rellena tu perfil a mano.`,
  proveedor: $localize`:Motivo manual, fallo del proveedor@@alta.manual.motivo.proveedor:El servicio que lee el CV no ha respondido. Rellena tu perfil a mano.`,
  indisponible: $localize`:Motivo manual, servicio no disponible@@alta.manual.motivo.indisponible:Ahora mismo no podemos leer tu CV. Rellena tu perfil a mano.`,
};

/**
 * El contenedor del alta: lee el store y pinta el paso que toca.
 * Los puertos (RepositorioDePerfil, ExtractorDeCv) los aporta quien monte la
 * ruta con elegirAdaptadoresDeAlta.
 */
@Component({
  selector: 'app-alta',
  imports: [Consentimiento, SubidaDeCv, RevisionDeCampos, FormularioManual],
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
      @case (pasos.revision) {
        <app-revision-de-campos
          [propuestas]="store.propuestas()"
          [errorDeGuardado]="store.errorDeGuardado()"
          (guardar)="store.guardar($event)"
        />
      }
      @case (pasos.manual) {
        <section class="paso" aria-labelledby="manual-titulo">
          <h2 id="manual-titulo" tabindex="-1" data-titulo-de-paso i18n="Titulo del paso manual@@alta.manual.titulo">
            Cuéntanos tu perfil
          </h2>
          @if (store.motivoManual(); as motivo) {
            <p [attr.data-motivo]="motivo">{{ motivos[motivo] }}</p>
          } @else {
            <p data-motivo-elegido i18n="Texto del formulario manual elegido@@alta.manual.elegido">
              Rellena tu perfil a mano. No se guarda nada hasta que lo confirmes.
            </p>
          }
          <app-formulario-manual [errorDeGuardado]="store.errorDeGuardado()" (guardar)="store.guardar($event)" />
        </section>
      }
      @case (pasos.hecho) {
        <section class="paso" data-hecho aria-labelledby="hecho-titulo">
          <h2 id="hecho-titulo" tabindex="-1" data-titulo-de-paso i18n="Titulo del paso final@@alta.hecho.titulo">
            Perfil guardado
          </h2>
          <p i18n="Texto del paso final@@alta.hecho.texto">
            Ya tenemos tu perfil. Puedes borrar tus datos y tu cuenta cuando quieras.
          </p>
        </section>
      }
    }
  `,
})
export class AltaPage {
  protected readonly store = inject(AltaStore);
  protected readonly pasos = PASOS;
  protected readonly motivos = MENSAJES_DE_MOTIVO;

  private readonly anfitrion = inject<ElementRef<HTMLElement>>(ElementRef);
  private primerPaso = true;

  constructor() {
    // Every step change moves focus to the new step heading, so keyboard and
    // screen reader users land where the new content starts.
    afterRenderEffect(() => {
      this.store.paso();
      if (this.primerPaso) {
        this.primerPaso = false;
        return;
      }
      this.anfitrion.nativeElement.querySelector<HTMLElement>('[data-titulo-de-paso]')?.focus();
    });
  }
}
