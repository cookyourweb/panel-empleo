import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { accionesPara, EnlacesDeAccion } from './acciones';
import { CandidaturasStore } from './candidaturas.store';
import { CambiosDeCandidatura } from './edicion';
import { FichaCandidatura } from './ficha-candidatura';
import { FuenteDeAcciones } from './fuente-de-acciones';

@Component({
  selector: 'app-detalle',
  imports: [RouterLink, FichaCandidatura],
  templateUrl: './detalle.page.html',
  styleUrl: './detalle.page.css',
})
export class DetallePage implements OnInit {
  /** Llega de la ruta, con withComponentInputBinding. */
  readonly id = input.required<string>();

  protected readonly store = inject(CandidaturasStore);
  private readonly fuenteDeAcciones = inject(FuenteDeAcciones);
  private readonly enlaces = signal<EnlacesDeAccion | null>(null);

  protected readonly candidatura = computed(() => this.store.buscarPorId(this.id()));

  /** Las mismas reglas que la tabla: la ficha no decide por su cuenta. */
  protected readonly acciones = computed(() => {
    const una = this.candidatura();
    return una ? accionesPara(una, this.enlaces()) : [];
  });

  protected readonly guardar = (id: string, cambios: CambiosDeCandidatura) => this.store.guardarCambios(id, cambios);

  ngOnInit(): void {
    // El store se comparte con la lista: si ya cargo, esto no vuelve a pedir nada.
    void this.store.cargar();
    void this.fuenteDeAcciones.enlaces().then((enlaces) => this.enlaces.set(enlaces));
  }
}
