import { Type } from '@angular/core';

import { ExtractorDeCv } from './extractor-de-cv';
import { ExtractorDeCvDemo } from './extractor-de-cv-demo';
import { ExtractorDeCvHttp } from './extractor-de-cv-http';
import { RepositorioDePerfil } from './repositorio-de-perfil';
import { RepositorioDePerfilDemo } from './repositorio-de-perfil-demo';
import { RepositorioDePerfilHttp } from './repositorio-de-perfil-http';

export interface AdaptadoresDeAlta {
  repositorio: Type<RepositorioDePerfil>;
  extractor: Type<ExtractorDeCv>;
}

/**
 * Que adaptadores se conectan a los puertos del alta.
 *
 * Mientras no haya backend desplegado (o la extraccion este apagada), todo el
 * mundo usa la demo. Recibe el flag como argumento, igual que elegirRepositorio,
 * para probar las dos ramas.
 */
export function elegirAdaptadoresDeAlta(conBackend: boolean): AdaptadoresDeAlta {
  return conBackend
    ? { repositorio: RepositorioDePerfilHttp, extractor: ExtractorDeCvHttp }
    : { repositorio: RepositorioDePerfilDemo, extractor: ExtractorDeCvDemo };
}
