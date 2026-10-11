import { InjectionToken } from '@angular/core';

import { IDIOMAS } from '../idioma/idiomas';

/** La web de la agencia: otro dominio, asi que todas sus URL son absolutas. */
export const URL_DE_LA_AGENCIA = 'https://www.cookyourwebai.es/';

/** Chat de WhatsApp de la agencia. En la plataforma es un enlace, no el modal de la home. */
export const URL_DE_WHATSAPP = 'https://wa.me/34688757782';

export interface EnlaceDelMenu {
  readonly clave: string;
  readonly etiqueta: string;
  readonly url: string;
  /** La pagina en la que estamos: lleva aria-current="page". */
  readonly actual: boolean;
}

/** Las secciones de la home de la agencia, en el orden de su menu. */
export function enlacesDeLaAgencia(): readonly Omit<EnlaceDelMenu, 'actual'>[] {
  return [
    {
      clave: 'automatizacion',
      etiqueta: $localize`:Enlace del menu a la seccion de automatizacion de la agencia@@cabecera.menu.automatizacion:Automatización`,
      url: `${URL_DE_LA_AGENCIA}#automatizacion-empresarial`,
    },
    {
      clave: 'funnels',
      etiqueta: $localize`:Enlace del menu a la seccion de funnels de la agencia@@cabecera.menu.funnels:Funnels AI`,
      url: `${URL_DE_LA_AGENCIA}#funnels-ia-avanzados`,
    },
    {
      clave: 'avatares',
      etiqueta: $localize`:Enlace del menu a la seccion de avatares de la agencia@@cabecera.menu.avatares:Avatares AI`,
      url: `${URL_DE_LA_AGENCIA}#ia-influencer-avatares`,
    },
    {
      clave: 'auditoria',
      etiqueta: $localize`:Enlace del menu a la seccion de auditoria gratuita de la agencia@@cabecera.menu.auditoria:Auditoría Gratis`,
      url: `${URL_DE_LA_AGENCIA}#consultoria-transformacion-ia`,
    },
    {
      clave: 'desarrolladores',
      etiqueta: $localize`:Enlace del menu a la seccion de desarrolladores de la agencia@@cabecera.menu.desarrolladores:Desarrolladores`,
      url: `${URL_DE_LA_AGENCIA}#desarrolladores`,
    },
  ];
}

/**
 * La raiz de la plataforma en el idioma de esta build: /es/ o /en/.
 *
 * Cada idioma es una build distinta bajo su subruta, asi que "la propia
 * plataforma" no es "/" sino la subruta del idioma (igual que el selector de
 * idioma). Un idioma que no se sirve cae en espanol, que es el de origen.
 */
export function raizDeLaPlataforma(localeId: string): string {
  const idioma = new Intl.Locale(localeId).language;
  const servido = IDIOMAS.some((i) => i.codigo === idioma) ? idioma : IDIOMAS[0].codigo;
  return `/${servido}/`;
}

export type ClaveLegal = 'privacidad' | 'cookies' | 'avisoLegal' | 'baja';

export interface EnlaceLegal {
  readonly clave: ClaveLegal;
  /** URL de una pagina de ESTA plataforma, no de cookyourwebai.es. */
  readonly url: string;
}

/**
 * Paginas legales de la propia plataforma, que el pie enlaza cuando existen.
 *
 * Esta plataforma recoge sus propios datos (lista de espera, usuarias
 * invitadas), asi que necesita su politica de privacidad, de cookies, su aviso
 * legal y su pagina de baja. NO sirven las de cookyourwebai.es: describen otros
 * formularios y otros proveedores. Mientras no existan, la lista va vacia y el
 * pie no pinta la fila de enlaces legales: un enlace que no lleva a ninguna
 * parte, o que lleva a una politica que no es la de esta plataforma, es peor
 * que no tenerlo.
 *
 * Cuando las paginas existan, se declaran aqui con su URL, en el orden en el
 * que se quieren ver, por ejemplo:
 *   { clave: 'privacidad', url: '/es/privacidad' }
 * (la URL debe llevar el prefijo de idioma, igual que cualquier ruta de la app).
 */
export const ENLACES_LEGALES_DE_LA_PLATAFORMA: readonly EnlaceLegal[] = [];

/** Inyectable para poder sustituirlo en las pruebas. */
export const ENLACES_LEGALES = new InjectionToken<readonly EnlaceLegal[]>('ENLACES_LEGALES', {
  providedIn: 'root',
  factory: () => ENLACES_LEGALES_DE_LA_PLATAFORMA,
});
