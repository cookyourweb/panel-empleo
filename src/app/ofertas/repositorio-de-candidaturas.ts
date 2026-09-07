import { Candidatura } from './dominio';

/**
 * De donde salen las candidaturas.
 *
 * La aplicacion depende de esta clase abstracta y no de una fuente concreta.
 * Eso es lo que permite que la demo publica funcione con datos de ejemplo
 * incluidos en el propio front, sin backend vivo detras, y que los tests corran
 * sin red.
 *
 * Es una clase abstracta y no una interfaz de TypeScript porque las interfaces
 * desaparecen al compilar, y hace falta algo que exista en tiempo de ejecucion
 * para poder inyectarlo.
 */
export abstract class RepositorioDeCandidaturas {
  abstract listar(): Promise<Candidatura[]>;
}
