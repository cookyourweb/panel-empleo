import { Injectable, Type } from '@angular/core';

import { RegistroLocal } from './desde-notion';
import { CambiosDeCandidatura, OpcionesDeEdicion } from './edicion';

/** Una ficha eliminada desde el panel: cuando, y como estaba para poder devolverla. */
export interface EliminadaGuardada {
  cuando: string;
  registro: RegistroLocal;
}

/**
 * Donde se guardan los cambios hechos desde la ficha. Mismo patron que el
 * repositorio: hoy es el puente local a Notion; con el backend de verdad sera
 * otro adaptador, y la ficha no se entera.
 */
export abstract class EditorDeCandidaturas {
  /** null si no se puede editar: la ficha entonces no ofrece el boton. */
  abstract opciones(): Promise<OpcionesDeEdicion | null>;
  abstract guardar(id: string, cambios: CambiosDeCandidatura): Promise<void>;
  /** A la papelera de Notion, nunca un borrado del todo. Devuelve las que fueron. */
  abstract eliminar(ids: string[]): Promise<string[]>;
  /** De vuelta desde la papelera. Devuelve las que volvieron. */
  abstract restaurar(ids: string[]): Promise<string[]>;
  abstract eliminadas(): Promise<EliminadaGuardada[]>;
}

/**
 * Habla con puente.py a traves del proxy de ng serve. El token de Notion se
 * queda en el puente: aqui solo viajan los cambios.
 */
@Injectable()
export class EditorLocal implements EditorDeCandidaturas {
  async opciones(): Promise<OpcionesDeEdicion | null> {
    try {
      const respuesta = await fetch('/api/opciones');
      return respuesta.ok ? ((await respuesta.json()) as OpcionesDeEdicion) : null;
    } catch {
      // Sin puente arrancado el panel sigue funcionando, solo que sin editar.
      return null;
    }
  }

  async guardar(id: string, cambios: CambiosDeCandidatura): Promise<void> {
    const respuesta = await fetch(`/api/candidaturas/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cambios),
    });
    if (!respuesta.ok) {
      const cuerpo = (await respuesta.json().catch(() => null)) as { error?: string } | null;
      throw new Error(cuerpo?.error ?? `El puente respondio ${respuesta.status}`);
    }
  }

  eliminar(ids: string[]): Promise<string[]> {
    return this.papelera('eliminar', ids);
  }

  restaurar(ids: string[]): Promise<string[]> {
    return this.papelera('restaurar', ids);
  }

  async eliminadas(): Promise<EliminadaGuardada[]> {
    try {
      const respuesta = await fetch('/api/eliminadas');
      return respuesta.ok ? ((await respuesta.json()) as EliminadaGuardada[]) : [];
    } catch {
      return [];
    }
  }

  /** Si unas salen y otras no (207), devuelve solo las que salieron: no se finge el resto. */
  private async papelera(accion: 'eliminar' | 'restaurar', ids: string[]): Promise<string[]> {
    const respuesta = await fetch(`/api/candidaturas/${accion}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
    const cuerpo = (await respuesta.json().catch(() => null)) as { hechas?: string[]; error?: string } | null;
    if (!respuesta.ok) {
      throw new Error(cuerpo?.error ?? `El puente respondio ${respuesta.status}`);
    }
    return cuerpo?.hechas ?? [];
  }
}

/** La demo publica enseña datos de ejemplo: no hay nada que guardar. */
@Injectable()
export class EditorDemo implements EditorDeCandidaturas {
  async opciones(): Promise<OpcionesDeEdicion | null> {
    return null;
  }

  async guardar(): Promise<void> {
    throw new Error('La demo no guarda cambios');
  }

  async eliminar(): Promise<string[]> {
    throw new Error('La demo no elimina nada');
  }

  async restaurar(): Promise<string[]> {
    throw new Error('La demo no elimina nada');
  }

  async eliminadas(): Promise<EliminadaGuardada[]> {
    return [];
  }
}

export function elegirEditor(esDesarrollo: boolean): Type<EditorDeCandidaturas> {
  return esDesarrollo ? EditorLocal : EditorDemo;
}
