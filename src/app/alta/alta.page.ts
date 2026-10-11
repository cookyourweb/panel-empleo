import { afterRenderEffect, ChangeDetectionStrategy, Component, computed, ElementRef, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AltaStore, Paso, PASOS } from './alta.store';
import { Consentimiento } from './consentimiento';
import { MotivoManual } from './dominio';
import { FormularioManual } from './formulario-manual';
import { IndicadorDePasos } from './indicador-de-pasos';
import { ResumenDeArchivo } from './resumen-de-archivo';
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

// The sign-up has four visible steps; reading the CV belongs to step 2 and the
// review and the manual form are both step 3.
const ETIQUETAS_DE_PASOS: readonly string[] = [
  $localize`:Etiqueta del paso 1 del alta@@alta.pasos.consentimiento:Antes de empezar`,
  $localize`:Etiqueta del paso 2 del alta@@alta.pasos.subida:Sube tu CV`,
  $localize`:Etiqueta del paso 3 del alta@@alta.pasos.perfil:Completa tu perfil`,
  $localize`:Etiqueta del paso 4 del alta@@alta.pasos.hecho:Listo`,
];

const NUMERO_DE_PASO: Readonly<Record<Paso, number>> = {
  [PASOS.consentimiento]: 1,
  [PASOS.subida]: 2,
  [PASOS.extrayendo]: 2,
  [PASOS.revision]: 3,
  [PASOS.manual]: 3,
  [PASOS.hecho]: 4,
};

const QUE_VIENE_DESPUES: Readonly<Record<Paso, string>> = {
  [PASOS.consentimiento]: $localize`:Que pasa despues del consentimiento@@alta.siguiente.consentimiento:A continuación: elegirás tu CV y lo guardaremos cifrado.`,
  [PASOS.subida]: $localize`:Que pasa despues de elegir el CV@@alta.siguiente.subida:A continuación: guardamos tu CV cifrado y, si podemos, lo leemos para proponerte los datos de tu perfil.`,
  [PASOS.extrayendo]: $localize`:Que pasa mientras se sube y se lee el CV@@alta.siguiente.extrayendo:A continuación: te enseñaremos lo que hayamos leído o, si no se puede, un formulario para rellenar a mano.`,
  [PASOS.revision]: $localize`:Que pasa despues de la revision@@alta.siguiente.revision:A continuación: acepta, corrige o descarta cada dato y pulsa «Guardar mi perfil». Hasta entonces no se guarda tu perfil.`,
  [PASOS.manual]: $localize`:Que pasa despues del formulario manual@@alta.siguiente.manual:A continuación: rellena el formulario y pulsa «Guardar mi perfil».`,
  [PASOS.hecho]: $localize`:Que pasa cuando el alta termina@@alta.siguiente.hecho:Ya has terminado: tu perfil está listo.`,
};

const REGISTRANDO = $localize`:Aviso de que se registra el consentimiento@@alta.anuncio.registrando:Registrando tu consentimiento…`;
const GUARDANDO = $localize`:Aviso de que se guarda el perfil@@alta.anuncio.guardando:Guardando tu perfil…`;

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
  imports: [Consentimiento, SubidaDeCv, RevisionDeCampos, FormularioManual, IndicadorDePasos, ResumenDeArchivo, RouterLink],
  providers: [AltaStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './alta.css',
  template: `
    <h1 i18n="Titulo de la pantalla de alta@@alta.titulo">Tu perfil</h1>

    <app-indicador-de-pasos [etiquetas]="etiquetas" [actual]="numeroDePaso()" />
    <p class="siguiente" data-siguiente>{{ siguiente() }}</p>

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
          [ocupado]="store.consentiendo()"
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
          @if (store.archivoElegido(); as archivo) {
            <p class="archivo" data-archivo>
              <app-resumen-de-archivo [nombre]="archivo.nombre" [tamano]="archivo.tamano" />
            </p>
          }
        </section>
      }
      @case (pasos.revision) {
        <app-revision-de-campos
          [cvGuardado]="store.cvGuardado()"
          [propuestas]="store.propuestas()"
          [errorDeGuardado]="store.errorDeGuardado()"
          [guardando]="store.guardando()"
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
          <app-formulario-manual
            [errorDeGuardado]="store.errorDeGuardado()"
            [guardando]="store.guardando()"
            (guardar)="store.guardar($event)"
          />
        </section>
      }
      @case (pasos.hecho) {
        <section class="paso" data-hecho aria-labelledby="hecho-titulo">
          <h2 id="hecho-titulo" tabindex="-1" data-titulo-de-paso i18n="Titulo del paso final@@alta.hecho.titulo">
            Perfil guardado
          </h2>
          <p i18n="Introduccion del resumen final@@alta.hecho.introduccion">Esto es lo que hemos guardado:</p>
          <ul class="resumen" data-resumen>
            <li data-resumen-perfil i18n="Resumen final, perfil guardado@@alta.hecho.perfil">
              Tu perfil, con los datos que has confirmado.
            </li>
            @if (store.cvGuardado()) {
              <li data-resumen-cv i18n="Resumen final, CV guardado cifrado@@alta.hecho.cv">Tu CV, guardado cifrado.</li>
            }
            @if (store.consentido()) {
              <li data-resumen-consentimientos i18n="Resumen final, consentimientos registrados@@alta.hecho.consentimientos">
                Tus consentimientos, registrados: guardar tu CV cifrado y enviarlo a proveedores de IA para leerlo y para generar tus CV y cartas cuando lo pidas.
              </li>
            }
          </ul>
          <p i18n="Como borrar lo guardado@@alta.hecho.borrar">
            Puedes borrarlo todo cuando quieras. Es inmediato y no se puede deshacer.
          </p>
          <p class="acciones">
            <a routerLink="/cuenta" i18n="Enlace a la cuenta para borrar los datos@@alta.hecho.enlaceCuenta">Borrar mis datos o mi cuenta</a>
            <a routerLink="/panel" i18n="Enlace al panel tras el alta@@alta.hecho.enlacePanel">Ir a mi panel</a>
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
    if (this.store.guardando()) return GUARDANDO;
    if (this.store.consentiendo()) return REGISTRANDO;
    if (this.store.paso() !== PASOS.extrayendo) return null;
    return this.store.cvGuardado() ? GUARDADO_Y_LEYENDO : SUBIENDO;
  });

  protected readonly etiquetas = ETIQUETAS_DE_PASOS;
  protected readonly numeroDePaso = computed(() => NUMERO_DE_PASO[this.store.paso()]);
  protected readonly siguiente = computed(() => QUE_VIENE_DESPUES[this.store.paso()]);

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
