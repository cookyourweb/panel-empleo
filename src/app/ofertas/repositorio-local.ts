import { Injectable } from '@angular/core';

import { candidaturaDesdeRegistro, RegistroLocal } from './desde-notion';
import { Candidatura } from './dominio';
import { RepositorioDeCandidaturas } from './repositorio-de-candidaturas';

/**
 * Donde busca el panel los datos reales en desarrollo.
 *
 * La carpeta public/local/ esta en .gitignore: el repositorio es publico y ahi
 * van candidaturas de verdad. El fichero lo genera un script que vive fuera de
 * este repositorio, junto al export privado de Notion.
 */
export const RUTA_DATOS_LOCALES = '/local/candidaturas.json';

/**
 * Las candidaturas reales, leidas de un fichero local.
 *
 * Es el segundo adaptador del mismo puerto que usa la demo: la pantalla no
 * sabe de donde salen los datos. Solo se conecta en desarrollo (ver
 * app.routes.ts); la build publica sigue con los datos de ejemplo.
 */
@Injectable()
export class RepositorioLocal implements RepositorioDeCandidaturas {
  async listar(): Promise<Candidatura[]> {
    const respuesta = await fetch(RUTA_DATOS_LOCALES);
    if (!respuesta.ok) {
      console.warn(
        `No hay datos locales en ${RUTA_DATOS_LOCALES}. ` +
          'Hay que generar el fichero con el script de buscartrabajo-privado/panel-local.',
      );
      return [];
    }

    const registros: unknown = await respuesta.json();
    if (!Array.isArray(registros)) {
      console.warn(`${RUTA_DATOS_LOCALES} no contiene una lista de candidaturas.`);
      return [];
    }

    return (registros as RegistroLocal[])
      .map(candidaturaDesdeRegistro)
      .filter((una): una is Candidatura => una !== null);
  }
}
