/**
 * Los idiomas en los que se sirve el panel: uno por subruta (/es/, /en/) y uno
 * por entrada de i18n.locales en angular.json. Añadir un idioma es añadirlo
 * ahi, crear su fichero de mensajes y añadirlo aqui.
 *
 * El nombre va en su propio idioma, nunca traducido: quien no entiende la
 * pagina tiene que poder reconocer el suyo.
 */
export const IDIOMAS = [
  { codigo: 'es', nombre: 'Español' },
  { codigo: 'en', nombre: 'English' },
] as const;

export type CodigoDeIdioma = (typeof IDIOMAS)[number]['codigo'];
