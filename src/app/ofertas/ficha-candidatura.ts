import { Component, input } from '@angular/core';

import { Accion } from './acciones';
import { Candidatura } from './dominio';
import { fechaEspanola } from './fecha';

/**
 * Lo que se sabe de una candidatura, sin saber donde se pinta.
 *
 * La usan la pagina de detalle y el panel lateral de la tabla: si cada una
 * tuviera su copia, acabarian enseñando cosas distintas de la misma oferta.
 */
@Component({
  selector: 'app-ficha-candidatura',
  templateUrl: './ficha-candidatura.html',
  styleUrl: './ficha-candidatura.css',
})
export class FichaCandidatura {
  readonly candidatura = input.required<Candidatura>();
  readonly acciones = input<Accion[]>([]);
  /** Para que quien la contiene pueda nombrarse con el titulo (aria-labelledby). */
  readonly idTitulo = input('titulo-ficha');

  protected readonly fecha = fechaEspanola;
}
