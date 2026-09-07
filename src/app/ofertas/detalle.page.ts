import { Component, computed, inject, input, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CandidaturasStore } from './candidaturas.store';

@Component({
  selector: 'app-detalle',
  imports: [RouterLink],
  templateUrl: './detalle.page.html',
  styleUrl: './detalle.page.css',
})
export class DetallePage implements OnInit {
  /** Llega de la ruta, con withComponentInputBinding. */
  readonly id = input.required<string>();

  protected readonly store = inject(CandidaturasStore);

  protected readonly candidatura = computed(() => this.store.buscarPorId(this.id()));

  ngOnInit(): void {
    // El store se comparte con la lista: si ya cargo, esto no vuelve a pedir nada.
    void this.store.cargar();
  }
}
