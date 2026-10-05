import { Component, computed, input } from '@angular/core';

import { EstadoDeCandidatura } from './dominio';

/** Los estados que cierran la candidatura se pintan huecos: ya no piden nada. */
const CERRADOS: readonly EstadoDeCandidatura[] = ['Rechazado', 'Descartado', 'Caducada'];

/** El estado como etiqueta de color, igual en la tabla que en la ficha. */
@Component({
  selector: 'app-estado',
  template: `<span class="estado" [class.cerrado]="cerrado()" [attr.data-estado]="estado()">{{ estado() }}</span>`,
  styleUrl: './etiqueta-estado.css',
})
export class EtiquetaEstado {
  readonly estado = input.required<EstadoDeCandidatura>();

  protected readonly cerrado = computed(() => CERRADOS.includes(this.estado()));
}
