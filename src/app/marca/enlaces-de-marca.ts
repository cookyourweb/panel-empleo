import { inject, InjectionToken } from '@angular/core';

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

/**
 * La direccion absoluta de una pagina legal, o '' cuando todavia no existe.
 * El tipo obliga a que sea https: una ruta relativa o inventada no compila.
 */
export type UrlDePrivacidad = '' | `https://${string}`;

/**
 * FUENTE UNICA de la URL de la politica de privacidad de Empleo Tech.
 *
 * Las paginas legales viviran en www.cookyourwebai.es, en una seccion "Empleo
 * Tech" que aun no existe. Mientras este vacia, ni el paso de consentimiento ni
 * el pie pintan enlace: un enlace a la politica de OTRO servicio (la de la
 * agencia no describe esta plataforma) seria peor que no tenerlo. Cuando la
 * pagina este publicada, se pone aqui su URL y las dos pantallas la usan.
 */
export const URL_DE_PRIVACIDAD_DE_EMPLEO: UrlDePrivacidad = '';

/** Politica de privacidad general de la agencia: la que se enlaza en la lista de espera hasta que exista la seccion de Empleo Tech. */
export const POLITICA_DE_PRIVACIDAD_DE_LA_AGENCIA = 'https://www.cookyourwebai.es/politicadeprivacidad';

/** La politica que enlaza la lista de espera: la de Empleo Tech si ya esta publicada y, si no, la base sin ancla. */
export function urlDePrivacidadDeLaLista(empleo: UrlDePrivacidad): string {
  return empleo || POLITICA_DE_PRIVACIDAD_DE_LA_AGENCIA;
}

/** Inyectable para poder sustituirla en las pruebas. */
export const URL_DE_PRIVACIDAD = new InjectionToken<UrlDePrivacidad>('URL_DE_PRIVACIDAD', {
  providedIn: 'root',
  factory: () => URL_DE_PRIVACIDAD_DE_EMPLEO,
});

export type ClaveLegal = 'privacidad' | 'cookies' | 'avisoLegal' | 'baja';

export interface EnlaceLegal {
  readonly clave: ClaveLegal;
  /** URL de la pagina: una ruta de esta plataforma o la direccion absoluta de su seccion en cookyourwebai.es. */
  readonly url: string;
}

/** Los enlaces legales que existen para esa URL de privacidad: ninguno mientras este vacia. */
export function enlacesLegalesDe(privacidad: UrlDePrivacidad): readonly EnlaceLegal[] {
  return privacidad ? [{ clave: 'privacidad', url: privacidad }] : [];
}

/**
 * Paginas legales de la propia plataforma, que el pie enlaza cuando existen.
 *
 * Esta plataforma recoge sus propios datos (lista de espera, usuarias
 * invitadas), asi que necesita su politica de privacidad, de cookies, su aviso
 * legal y su pagina de baja. NO sirven las generales de cookyourwebai.es:
 * describen otros formularios y otros proveedores; solo vale su seccion "Empleo
 * Tech" (ver URL_DE_PRIVACIDAD_DE_EMPLEO). Mientras no existan, la lista va vacia y el
 * pie no pinta la fila de enlaces legales: un enlace que no lleva a ninguna
 * parte, o que lleva a una politica que no es la de esta plataforma, es peor
 * que no tenerlo.
 *
 * La politica de privacidad sale de URL_DE_PRIVACIDAD_DE_EMPLEO. Las demas
 * paginas, cuando existan, se anaden aqui a continuacion con su URL, en el
 * orden en el que se quieren ver, por ejemplo:
 *   { clave: 'cookies', url: '/es/cookies' }
 * (una ruta propia lleva el prefijo de idioma, igual que cualquier ruta de la app).
 */
export const ENLACES_LEGALES_DE_LA_PLATAFORMA: readonly EnlaceLegal[] = enlacesLegalesDe(URL_DE_PRIVACIDAD_DE_EMPLEO);

/** Inyectable para poder sustituirlo en las pruebas. */
export const ENLACES_LEGALES = new InjectionToken<readonly EnlaceLegal[]>('ENLACES_LEGALES', {
  providedIn: 'root',
  factory: () => enlacesLegalesDe(inject(URL_DE_PRIVACIDAD)),
});
