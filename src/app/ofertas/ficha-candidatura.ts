import { Component, computed, inject, input } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { Accion } from './acciones';
import { Bloque, Candidatura } from './dominio';
import { EtiquetaEstado } from './etiqueta-estado';
import { agruparBloques, GrupoDeBloques, seccionesDeFicha } from './ficha-campos';

/**
 * Lo que se sabe de una candidatura, sin saber donde se pinta.
 *
 * La usan la pagina de detalle y el panel lateral de la tabla: si cada una
 * tuviera su copia, acabarian enseñando cosas distintas de la misma oferta.
 * Sigue la ficha de la maqueta aprobada: cabecera, tres grupos de campos y
 * el contenido de la pagina de Notion.
 */
@Component({
  selector: 'app-ficha-candidatura',
  imports: [EtiquetaEstado],
  templateUrl: './ficha-candidatura.html',
  styleUrl: './ficha-candidatura.css',
})
export class FichaCandidatura {
  readonly candidatura = input.required<Candidatura>();
  readonly acciones = input<Accion[]>([]);
  /** Para que quien la contiene pueda nombrarse con el titulo (aria-labelledby). */
  readonly idTitulo = input('titulo-ficha');

  protected readonly ficha = computed(() => seccionesDeFicha(this.candidatura()));
  protected readonly grupos = computed(() => agruparBloques(this.candidatura().cuerpo ?? []));

  /** La plantilla no estrecha el tipo en el @else de una lista. */
  protected comoBloque(grupo: GrupoDeBloques): Bloque {
    return grupo as Bloque;
  }

  private readonly sanitizer = inject(DomSanitizer);

  /**
   * Angular no deja poner una direccion en un iframe sin decirle que es de
   * fiar. Solo llegan aqui las que monta vistaPreviaDeCv, nunca una de Notion.
   */
  protected incrustable(vistaPrevia: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(vistaPrevia);
  }

  protected sinEspacios(telefono: string): string {
    return telefono.replace(/\s+/g, '');
  }
}
