import { afterRenderEffect, ChangeDetectionStrategy, Component, computed, ElementRef, inject } from '@angular/core';

import { AltaStore, PASOS } from './alta.store';
import { Consentimiento } from './consentimiento';
import { MotivoManual } from './dominio';
import { FormularioManual } from './formulario-manual';
import { RevisionDeCampos } from './revision-de-campos';
import { SubidaDeCv } from './subida-de-cv';

// Every reason starts from the same fact: the CV is stored. What failed is only the reading.
const MENSAJES_DE_MOTIVO: Readonly<Record<MotivoManual, string>> = {
  desactivada: $localize`:Motivo manual, lectura apagada@@alta.manual.motivo.desactivada:Tu CV está guardado (cifrado). La lectura automática no está disponible por ahora, así que rellena tu perfil a mano; solo te llevará unos minutos.`,
  ya_usada: $localize`:Motivo manual, lectura ya usada@@alta.manual.motivo.yaUsada:Tu CV está guardado (cifrado). Ya has usado tu lectura automática, así que rellena tu perfil a mano; solo te llevará unos minutos.`,
  tope: $localize`:Motivo manual, tope mensual@@alta.manual.motivo.tope:Tu CV está guardado (cifrado). Hemos llegado al límite de lecturas automáticas de este mes, así que rellena tu perfil a mano; solo te llevará unos minutos.`,
  proveedor: $localize`:Motivo manual, fallo del proveedor@@alta.manual.motivo.proveedor:Tu CV está guardado y no has perdido tu intento: el servicio que lo lee no ha respondido y puedes volver a probar más tarde. Mientras tanto, rellena tu perfil a mano; solo te llevará unos minutos.`,
  indisponible: $localize`:Motivo manual, servicio no disponible@@alta.manual.motivo.indisponible:Tu CV está guardado. Ahora mismo no podemos leerlo automáticamente, así que rellena tu perfil a mano; solo te llevará unos minutos.`,
};

const SUBIENDO = $localize`:Aviso de que se esta subiendo el CV@@alta.extrayendo.subiendo:Subiendo tu CV…`;
const LEYENDO = $localize`:Titulo mientras se lee el CV ya guardado@@alta.extrayendo.leyendo:Leyendo tu CV…`;
const GUARDADO_Y_LEYENDO = $localize`:Aviso de que el CV esta guardado y se esta leyendo@@alta.extrayendo.guardado:Tu CV está guardado (cifrado). Ahora lo estamos leyendo, un momento.`;

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
      @if (anuncio(); as texto) {
        <p>{{ texto }}</p>
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
      @case (pasos.extrayendo) {
        <section class="paso" aria-labelledby="extrayendo-titulo" aria-busy="true">
          <h2 id="extrayendo-titulo" tabindex="-1" data-titulo-de-paso>
            {{ store.cvGuardado() ? textos.leyendo : textos.subiendo }}
          </h2>
        </section>
      }
      @case (pasos.revision) {
        <app-revision-de-campos
          [cvGuardado]="store.cvGuardado()"
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
  protected readonly textos = { subiendo: SUBIENDO, leyendo: LEYENDO };

  /** What the live region says: the CV is first uploaded, then (already stored) read. */
  protected readonly anuncio = computed(() => {
    if (this.store.paso() !== PASOS.extrayendo) return null;
    return this.store.cvGuardado() ? GUARDADO_Y_LEYENDO : SUBIENDO;
  });

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
