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
        <h2 id="titulo-eliminar">Eliminar {{ cuantas() }}</h2>
        <div id="detalle-eliminar">
          <ol>
            <li>La ficha va a la papelera de Notion: libera espacio y se puede recuperar durante 30 días.</li>
            <li>Su copia queda en la lista de Eliminadas, desde donde se puede restaurar.</li>
          </ol>
          <ul>
            @for (una of aLaVista(); track una.id) {
              <li>
                <b>{{ una.oferta.empresa }}</b> <span class="apagado">{{ una.oferta.puesto }}</span>
              </li>
            }
            @if (resto() > 0) {
              <li class="apagado">y {{ resto() }} más</li>
            }
          </ul>
          @if (enCurso() > 0) {
            <p class="aviso" data-aviso>{{ textoEnCurso() }}</p>
          }
        </div>
        <div class="pie">
          <button #cancelarBoton type="button" class="boton" (click)="cancelar.emit()">Cancelar</button>
          <button type="button" class="boton peligro" data-confirmar-eliminar (click)="confirmar.emit()">
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

  protected readonly cuantas = computed(() => plural(this.candidaturas().length, 'oferta', 'ofertas'));
  protected readonly aLaVista = computed(() => this.candidaturas().slice(0, NOMBRES_A_LA_VISTA));
  protected readonly resto = computed(() => this.candidaturas().length - NOMBRES_A_LA_VISTA);
  protected readonly enCurso = computed(() => this.candidaturas().filter((una) => EN_CURSO.includes(una.estado)).length);
  protected readonly textoEnCurso = computed(
    () =>
      `${plural(this.enCurso(), 'ficha está', 'fichas están')} en curso (aprobadas, enviadas, en proceso o con entrevista). Revísalo antes de confirmar.`,
  );

  constructor() {
    // El foco arranca en Cancelar: un Enter de mas no tiene que eliminar nada.
    afterNextRender(() => this.cancelarBoton()?.nativeElement.focus());
  }
}
