import { computed, inject, Injectable, signal } from '@angular/core';

import { EstadoDeOferta, Oferta } from './oferta';
import { RepositorioDeOfertas } from './repositorio-de-ofertas';

@Injectable()
export class OfertasStore {
  private readonly repositorio = inject(RepositorioDeOfertas);
  private readonly estado = signal<Oferta[]>([]);

  readonly ofertas = this.estado.asReadonly();

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

  async cargar(): Promise<void> {
    this.estado.set(await this.repositorio.listar());
  }
}
