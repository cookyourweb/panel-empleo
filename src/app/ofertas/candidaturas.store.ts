import { computed, inject, Injectable, signal } from '@angular/core';

import { Candidatura, EstadoDeCandidatura } from './dominio';
import { RepositorioDeCandidaturas } from './repositorio-de-candidaturas';

@Injectable()
export class CandidaturasStore {
  private readonly repositorio = inject(RepositorioDeCandidaturas);
  private readonly todas = signal<Candidatura[]>([]);
  private readonly filtro = signal<EstadoDeCandidatura | null>(null);

  readonly candidaturas = this.todas.asReadonly();
  readonly filtroActivo = this.filtro.asReadonly();

  /**
   * Las que se estan viendo ahora mismo.
   *
   * Filtrar no descarta nada: las caducadas dejan de estorbar sin borrarse, y
   * siguen contando en el recuento.
   */
  readonly visibles = computed(() => {
    const estado = this.filtro();
    return estado === null ? this.todas() : this.todas().filter((una) => una.estado === estado);
  });

  /**
   * Cuantas hay en cada estado.
   *
   * No es un adorno del filtro: es lo que deja ver de un vistazo que un estado
   * tiene mas de las que deberia, que es como se nota que el seguimiento se ha
   * quedado atras.
   */
  readonly recuentoPorEstado = computed(() => {
    const recuento: Partial<Record<EstadoDeCandidatura, number>> = {};
    for (const una of this.todas()) {
      recuento[una.estado] = (recuento[una.estado] ?? 0) + 1;
    }
    return recuento;
  });

  /** Pasar null quita el filtro y vuelve a enseñarlas todas. */
  filtrarPor(estado: EstadoDeCandidatura | null): void {
    this.filtro.set(estado);
  }

  async cargar(): Promise<void> {
    this.todas.set(await this.repositorio.listar());
  }
}
