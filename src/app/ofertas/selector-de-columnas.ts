import { Component, computed, ElementRef, inject, signal, viewChild, afterRenderEffect } from '@angular/core';

import { CandidaturasStore } from './candidaturas.store';
import { COLUMNAS, conDato, GRUPOS_DE_COLUMNAS } from './columnas';
import { PreferenciasDeColumnas } from './preferencias-de-columnas';

/** El boton "Columnas" y su desplegable, como en la maqueta aprobada. */
@Component({
  selector: 'app-selector-de-columnas',
  templateUrl: './selector-de-columnas.html',
  styleUrl: './selector-de-columnas.css',
  host: { '(document:click)': 'cerrarSiFuera($event)' },
})
export class SelectorDeColumnas {
  protected readonly preferencias = inject(PreferenciasDeColumnas);
  private readonly store = inject(CandidaturasStore);
  private readonly anfitrion = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly desplegable = viewChild<ElementRef<HTMLElement>>('desplegable');

  protected readonly abierto = signal(false);
  protected readonly total = COLUMNAS.length;

  /** Por grupos y con cuantas fichas tienen dato: una columna casi vacia no merece sitio. */
  protected readonly grupos = computed(() => {
    const todas = this.store.candidaturas();
    return GRUPOS_DE_COLUMNAS.map((grupo) => ({
      grupo,
      columnas: COLUMNAS.filter((c) => c.grupo === grupo).map((columna) => ({
        columna,
        conDato: conDato(todas, columna),
      })),
    }));
  });

  constructor() {
    // Al abrir, el foco entra en la primera casilla que se puede tocar.
    afterRenderEffect(() => {
      this.desplegable()?.nativeElement.querySelector<HTMLInputElement>('input:not(:disabled)')?.focus();
    });
  }

  protected alternarDesplegable(): void {
    this.abierto.update((a) => !a);
  }

  /** Escape cierra esto y nada mas: no tiene que llegar a cerrar la ficha abierta. */
  protected cerrarConTeclado(evento: Event): void {
    evento.stopPropagation();
    this.abierto.set(false);
    this.anfitrion.nativeElement.querySelector<HTMLButtonElement>('[data-columnas]')?.focus();
  }

  protected cerrarSiFuera(evento: Event): void {
    if (this.abierto() && !this.anfitrion.nativeElement.contains(evento.target as Node)) {
      this.abierto.set(false);
    }
  }
}
