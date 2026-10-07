import { Component, ElementRef, inject, input, LOCALE_ID, output, viewChild, afterNextRender } from '@angular/core';

import { Eliminada } from './candidaturas.store';
import { formatearFecha } from './fecha';

@Component({
  selector: 'app-lista-de-eliminadas',
  template: `
    <div class="fondo" (click)="cerrar.emit()">
      <div
        class="caja ancha"
        role="dialog"
        aria-modal="true"
        data-eliminadas
        aria-labelledby="titulo-eliminadas"
        (click)="$event.stopPropagation()"
        (keydown.escape)="$event.stopPropagation(); cerrar.emit()"
      >
        <h2 id="titulo-eliminadas">Eliminadas</h2>
        <p class="apagado">
          Están en la papelera de Notion, que las guarda 30 días. Restaurar devuelve la ficha a Notion y a la tabla.
        </p>
        @for (e of eliminadas(); track e.candidatura.id) {
          <div class="fila">
            <div class="texto">
              <b>{{ e.candidatura.oferta.empresa }}</b>
              <span class="apagado">{{ e.candidatura.oferta.puesto }} · eliminada el {{ fecha(e.cuando) }}</span>
              @if (e.candidatura.oferta.enlace) {
                <a [href]="e.candidatura.oferta.enlace" target="_blank" rel="noopener noreferrer">{{
                  e.candidatura.oferta.enlace
                }}</a>
              }
            </div>
            <button
              type="button"
              class="boton"
              data-restaurar
              [attr.aria-label]="'Restaurar ' + e.candidatura.oferta.empresa"
              (click)="restaurar.emit([e.candidatura.id])"
            >
              Restaurar
            </button>
          </div>
        } @empty {
          <p class="apagado">No hay nada eliminado desde el panel.</p>
        }
        <div class="pie">
          <button type="button" class="boton" [disabled]="!eliminadas().length" (click)="restaurarTodas()">
            Restaurar todas
          </button>
          <button #cerrarBoton type="button" class="boton primario" (click)="cerrar.emit()">Cerrar</button>
        </div>
      </div>
    </div>
  `,
  styleUrl: './dialogo.css',
})
export class ListaDeEliminadas {
  readonly eliminadas = input.required<Eliminada[]>();
  readonly restaurar = output<string[]>();
  readonly cerrar = output<void>();

  private readonly locale = inject(LOCALE_ID);
  protected readonly fecha = (iso: string) => formatearFecha(iso, this.locale);
  private readonly cerrarBoton = viewChild<ElementRef<HTMLButtonElement>>('cerrarBoton');

  constructor() {
    afterNextRender(() => this.cerrarBoton()?.nativeElement.focus());
  }

  protected restaurarTodas(): void {
    this.restaurar.emit(this.eliminadas().map((e) => e.candidatura.id));
  }
}
