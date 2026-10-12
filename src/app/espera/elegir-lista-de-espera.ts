import { Type } from '@angular/core';

import { ListaDeEspera } from './lista-de-espera';
import { ListaDeEsperaDemo } from './lista-de-espera-demo';
import { ListaDeEsperaHttp } from './lista-de-espera-http';

/** En desarrollo la demo, para no llenar Notion de pruebas; en produccion el webhook. */
export function elegirListaDeEspera(enDesarrollo: boolean): Type<ListaDeEspera> {
  return enDesarrollo ? ListaDeEsperaDemo : ListaDeEsperaHttp;
}
