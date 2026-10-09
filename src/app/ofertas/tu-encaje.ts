import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Encaje, sinDatosParaEvaluar, totalDeRequisitos } from './encaje';

export const VISTA_DE_ENCAJE = {
  cargando: 'cargando',
  error: 'error',
  sinPerfil: 'sin-perfil',
  listo: 'listo',
} as const;

/** Los estados de la seccion, todos definidos: nunca se queda en blanco sin decir por que. */
export type VistaDeEncaje =
  | { estado: typeof VISTA_DE_ENCAJE.cargando }
  | { estado: typeof VISTA_DE_ENCAJE.error }
  | { estado: typeof VISTA_DE_ENCAJE.sinPerfil }
  | { estado: typeof VISTA_DE_ENCAJE.listo; encaje: Encaje };

/**
 * "Tu encaje": que de lo que pide la oferta demuestra tu CV, y que no.
 *
 * Solo pinta lo que le dan. No decide nada y no anima de mas: el unico mensaje
 * de animo es el veredicto "alcanzable" que ya calculo el servidor.
 */
@Component({
  selector: 'app-tu-encaje',
  imports: [RouterLink],
  templateUrl: './tu-encaje.html',
  styleUrl: './tu-encaje.css',
})
export class TuEncaje {
  readonly vista = input.required<VistaDeEncaje>();

  protected readonly encaje = computed(() => {
    const vista = this.vista();
    return vista.estado === VISTA_DE_ENCAJE.listo ? vista.encaje : null;
  });

  protected readonly sinDatos = computed(() => {
    const encaje = this.encaje();
    return encaje ? sinDatosParaEvaluar(encaje) : false;
  });

  /** "Cubres 7 de 10 requisitos": el texto es el dato, no una barra que solo se ve. */
  protected readonly cobertura = computed(() => {
    const encaje = this.encaje();
    if (!encaje) {
      return '';
    }
    const cubiertos = encaje.cubiertos.length;
    const total = totalDeRequisitos(encaje);
    return total === 1
      ? $localize`:Cuantos requisitos cubre el CV, cuando solo hay uno@@encaje.cobertura.uno:Cubres ${cubiertos}:cubiertos: de ${total}:total: requisito`
      : $localize`:Cuantos requisitos cubre el CV@@encaje.cobertura.varios:Cubres ${cubiertos}:cubiertos: de ${total}:total: requisitos`;
  });
}
