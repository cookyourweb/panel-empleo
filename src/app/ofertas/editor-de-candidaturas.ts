import { Injectable, Type } from '@angular/core';

import { CambiosDeCandidatura, OpcionesDeEdicion } from './edicion';

/**
 * Donde se guardan los cambios hechos desde la ficha. Mismo patron que el
 * repositorio: hoy es el puente local a Notion; con el backend de verdad sera
 * otro adaptador, y la ficha no se entera.
 */
export abstract class EditorDeCandidaturas {
  /** null si no se puede editar: la ficha entonces no ofrece el boton. */
  abstract opciones(): Promise<OpcionesDeEdicion | null>;
  abstract guardar(id: string, cambios: CambiosDeCandidatura): Promise<void>;
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
}

export function elegirEditor(esDesarrollo: boolean): Type<EditorDeCandidaturas> {
  return esDesarrollo ? EditorLocal : EditorDemo;
}
