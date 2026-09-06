import { Oferta } from './oferta';

/**
 * De donde salen las ofertas.
 *
 * La aplicacion depende de esta interfaz y no de una fuente concreta. Eso es lo
 * que permite que la demo publica funcione con datos de ejemplo incluidos en el
 * propio front, sin backend vivo detras, y que los tests corran sin red.
 *
 * Es una clase abstracta y no una interfaz de TypeScript porque las interfaces
 * desaparecen al compilar, y hace falta algo que exista en tiempo de ejecucion
 * para poder inyectarlo.
 */
export abstract class RepositorioDeOfertas {
  abstract listar(): Promise<Oferta[]>;
}
