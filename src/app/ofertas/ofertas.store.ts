import { computed, inject, Injectable, signal } from '@angular/core';

import { EstadoDeOferta, Oferta } from './oferta';
import { RepositorioDeOfertas } from './repositorio-de-ofertas';

@Injectable()
export class OfertasStore {
  private readonly repositorio = inject(RepositorioDeOfertas);
  private readonly estado = signal<Oferta[]>([]);
  private readonly filtro = signal<EstadoDeOferta | null>(null);

  readonly ofertas = this.estado.asReadonly();
  readonly filtroActivo = this.filtro.asReadonly();

  /**
   * Las ofertas que se estan viendo ahora mismo.
   *
   * Filtrar no descarta nada: las cuarenta caducadas dejan de estorbar sin
   * borrarse, y siguen contando en el recuento.
   */
  readonly visibles = computed(() => {
    const estado = this.filtro();
    return estado === null ? this.estado() : this.estado().filter((oferta) => oferta.estado === estado);
  });

  /**
   * Cuantas ofertas hay en cada estado.
   *
   * No es un adorno del filtro: es lo que deja ver de un vistazo que un estado
   * tiene mas de las que deberia, que es como se detecta que el seguimiento se
   * ha quedado atras.
   */
  readonly recuentoPorEstado = computed(() => {
    const recuento: Partial<Record<EstadoDeOferta, number>> = {};
    for (const oferta of this.estado()) {
      recuento[oferta.estado] = (recuento[oferta.estado] ?? 0) + 1;
    }
    return recuento;
  });

  /** Pasar null quita el filtro y vuelve a enseñarlas todas. */
  filtrarPor(estado: EstadoDeOferta | null): void {
    this.filtro.set(estado);
  }

  async cargar(): Promise<void> {
    this.estado.set(await this.repositorio.listar());
  }
}
