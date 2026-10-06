import { Injectable, signal } from '@angular/core';

import { CLAVES_POR_DEFECTO, COLUMNAS, columnaPorClave, columnasGuardadas } from './columnas';

export const CLAVE_DE_ALMACEN = 'panel-empleo.columnas';

/**
 * Que columnas se ven. Es una preferencia de quien mira, no un dato: vive en
 * este navegador y, si el navegador no deja guardar (modo privado, datos
 * bloqueados), la tabla funciona igual con las de por defecto.
 */
@Injectable({ providedIn: 'root' })
export class PreferenciasDeColumnas {
  private readonly elegidas = signal<ReadonlySet<string>>(new Set(leer() ?? CLAVES_POR_DEFECTO));

  readonly visibles = this.elegidas.asReadonly();

  alternar(clave: string): void {
    const columna = columnaPorClave(clave);
    if (!columna || columna.fija) {
      return;
    }
    const nuevas = new Set(this.elegidas());
    if (nuevas.has(clave)) {
      nuevas.delete(clave);
    } else {
      nuevas.add(clave);
    }
    this.fijar(nuevas);
  }

  todas(): void {
    this.fijar(new Set(COLUMNAS.map((c) => c.clave)));
  }

  porDefecto(): void {
    this.fijar(new Set(CLAVES_POR_DEFECTO));
  }

  private fijar(claves: Set<string>): void {
    this.elegidas.set(claves);
    try {
      localStorage.setItem(CLAVE_DE_ALMACEN, JSON.stringify([...claves]));
    } catch {
      // Sin almacen la eleccion dura hasta recargar, que es lo mejor posible.
    }
  }
}

function leer(): string[] | null {
  try {
    const guardado = localStorage.getItem(CLAVE_DE_ALMACEN);
    return guardado ? columnasGuardadas(JSON.parse(guardado)) : null;
  } catch {
    return null;
  }
}
