import { Type } from '@angular/core';

import { RepositorioDeCandidaturas } from './repositorio-de-candidaturas';
import { RepositorioDemo } from './repositorio-demo';
import { RepositorioLocal } from './repositorio-local';

/**
 * Que adaptador se conecta al puerto.
 *
 * Recibe el entorno como argumento en vez de preguntarlo dentro para poder
 * probar las dos ramas. La regla que protege: fuera de desarrollo, nunca datos
 * reales.
 */
export function elegirRepositorio(esDesarrollo: boolean): Type<RepositorioDeCandidaturas> {
  return esDesarrollo ? RepositorioLocal : RepositorioDemo;
}
