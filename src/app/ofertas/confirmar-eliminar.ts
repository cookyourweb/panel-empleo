import { Component, computed, ElementRef, input, output, viewChild, afterNextRender } from '@angular/core';

import { Candidatura, EstadoDeCandidatura } from './dominio';
import { plural } from './plural';

/** Los estados en los que eliminar seria perder una candidatura viva. */
const EN_CURSO: readonly EstadoDeCandidatura[] = ['Aprobado', 'En proceso', 'Enviado', 'Entrevista', 'Contactada directamente'];

/** Cuantas se enseñan por nombre; el resto se cuentan. */
const NOMBRES_A_LA_VISTA = 6;

@Component({
  selector: 'app-confirmar-eliminar',
  template: `
    <div class="fondo" (click)="cancelar.emit()">
      <div
        class="caja"
        role="dialog"
        aria-modal="true"
        data-confirmar
        aria-labelledby="titulo-eliminar"
        aria-describedby="detalle-eliminar"
        (click)="$event.stopPropagation()"
        (keydown.escape)="$event.stopPropagation(); cancelar.emit()"
      >
        <h2 id="titulo-eliminar" i18n="Titulo del dialogo de confirmacion, con el numero de ofertas@@confirmar.titulo">
          Eliminar {{ cuantas() }}
        </h2>
        <div id="detalle-eliminar">
          <ol>
            <li i18n="Primer efecto de eliminar@@confirmar.efectoPapelera">
              La ficha va a la papelera de Notion: libera espacio y se puede recuperar durante 30 días.
            </li>
            <li i18n="Segundo efecto de eliminar@@confirmar.efectoLista">
              Su copia queda en la lista de Eliminadas, desde donde se puede restaurar.
            </li>
          </ol>
          <ul>
            @for (una of aLaVista(); track una.id) {
              <li>
                <b>{{ una.oferta.empresa }}</b> <span class="apagado">{{ una.oferta.puesto }}</span>
              </li>
            }
            @if (resto() > 0) {
              <li class="apagado" i18n="Cuantas ofertas mas hay sin nombrar@@confirmar.resto">y {{ resto() }} más</li>
            }
          </ul>
          @if (enCurso() > 0) {
            <p class="aviso" data-aviso>{{ textoEnCurso() }}</p>
          }
        </div>
        <div class="pie">
          <button #cancelarBoton type="button" class="boton" (click)="cancelar.emit()" i18n="Boton que cierra el dialogo sin eliminar@@confirmar.cancelar">
            Cancelar
          </button>
          <button type="button" class="boton peligro" data-confirmar-eliminar (click)="confirmar.emit()" i18n="Boton que confirma la eliminacion, con el numero de ofertas@@confirmar.confirmar">
            Eliminar {{ cuantas() }}
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrl: './dialogo.css',
})
export class ConfirmarEliminar {
  readonly candidaturas = input.required<Candidatura[]>();
  readonly confirmar = output<void>();
  readonly cancelar = output<void>();

  private readonly cancelarBoton = viewChild<ElementRef<HTMLButtonElement>>('cancelarBoton');

  protected readonly cuantas = computed(() => plural(
      this.candidaturas().length,
      $localize`:Una oferta, detras del numero@@confirmar.oferta:oferta`,
      $localize`:Varias ofertas, detras del numero@@confirmar.ofertas:ofertas`,
    ));
  protected readonly aLaVista = computed(() => this.candidaturas().slice(0, NOMBRES_A_LA_VISTA));
  protected readonly resto = computed(() => this.candidaturas().length - NOMBRES_A_LA_VISTA);
  protected readonly enCurso = computed(() => this.candidaturas().filter((una) => EN_CURSO.includes(una.estado)).length);
  protected readonly textoEnCurso = computed(() => {
    const cuantas = this.enCurso();
    return cuantas === 1
      ? $localize`:Aviso de que una ficha esta en curso@@confirmar.enCursoUna:${cuantas}:cuantas: ficha está en curso (aprobadas, enviadas, en proceso o con entrevista). Revísalo antes de confirmar.`
      : $localize`:Aviso de que varias fichas estan en curso@@confirmar.enCursoVarias:${cuantas}:cuantas: fichas están en curso (aprobadas, enviadas, en proceso o con entrevista). Revísalo antes de confirmar.`;
  });

  constructor() {
    // El foco arranca en Cancelar: un Enter de mas no tiene que eliminar nada.
    afterNextRender(() => this.cancelarBoton()?.nativeElement.focus());
  }
}
