import { Component, ElementRef, input, output, signal, viewChild, afterRenderEffect } from '@angular/core';

import { EstadoDeCandidatura, ESTADOS } from './dominio';
import { EtiquetaEstado } from './etiqueta-estado';
import { plural } from './plural';

/** La barra que aparece al marcar filas, con las acciones en bloque de la maqueta. */
@Component({
  selector: 'app-barra-de-seleccion',
  imports: [EtiquetaEstado],
  template: `
    <div class="barra" data-bloque role="region" aria-label="Acciones en bloque">
      <span class="cuantas" aria-live="polite">{{ texto() }}</span>
      <button type="button" class="boton peligro" data-eliminar (click)="eliminar.emit()">Eliminar</button>
      <span class="menu-envoltorio">
        <button
          type="button"
          class="boton"
          data-cambiar-estado
          aria-haspopup="menu"
          [attr.aria-expanded]="menuAbierto()"
          aria-controls="menu-estados"
          (click)="menuAbierto.set(!menuAbierto())"
        >
          Cambiar estado
        </button>
        @if (menuAbierto()) {
          <div #menu id="menu-estados" class="menu" role="menu" aria-label="Nuevo estado" (keydown)="teclaEnMenu($event)">
            @for (estado of estados; track estado) {
              <button type="button" role="menuitem" (click)="elegir(estado)"><app-estado [estado]="estado" /></button>
            }
          </div>
        }
      </span>
      <button type="button" class="boton" data-caducada (click)="caducar.emit()">Marcar caducada</button>
      <span class="hueco"></span>
      <button type="button" class="boton fantasma" (click)="limpiar.emit()">Quitar selección</button>
    </div>
  `,
  styleUrl: './barra-de-seleccion.css',
})
export class BarraDeSeleccion {
  readonly cuantas = input.required<number>();
  readonly eliminar = output<void>();
  readonly cambiarEstado = output<EstadoDeCandidatura>();
  readonly caducar = output<void>();
  readonly limpiar = output<void>();

  protected readonly estados = ESTADOS;
  protected readonly menuAbierto = signal(false);
  private readonly menu = viewChild<ElementRef<HTMLElement>>('menu');

  constructor() {
    afterRenderEffect(() => this.menu()?.nativeElement.querySelector('button')?.focus());
  }

  protected texto(): string {
    return plural(this.cuantas(), 'seleccionada', 'seleccionadas');
  }

  protected elegir(estado: EstadoDeCandidatura): void {
    this.menuAbierto.set(false);
    this.cambiarEstado.emit(estado);
  }

  /** Flechas para moverse por el menu y Escape para cerrarlo, como cualquier menu. */
  protected teclaEnMenu(evento: KeyboardEvent): void {
    const botones = [...(this.menu()?.nativeElement.querySelectorAll('button') ?? [])];
    const actual = botones.indexOf(document.activeElement as HTMLButtonElement);
    if (evento.key === 'Escape') {
      evento.stopPropagation();
      this.menuAbierto.set(false);
    } else if (evento.key === 'ArrowDown' || evento.key === 'ArrowUp') {
      evento.preventDefault();
      const paso = evento.key === 'ArrowDown' ? 1 : -1;
      botones[(actual + paso + botones.length) % botones.length]?.focus();
    }
  }
}
