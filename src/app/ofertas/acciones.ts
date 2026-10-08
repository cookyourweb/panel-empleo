import { Candidatura } from './dominio';

/**
 * Las direcciones a las que se manda cada accion, hasta el "id=" final.
 *
 * Hoy son los webhooks de n8n que ya usa el correo diario, y su ruta es
 * secreta: quien la conoce dispara la accion. Por eso no viven en este
 * repositorio, que es publico, sino en public/local/acciones.json, fuera de git.
 * Cuando exista el login, aqui iran los endpoints de cv-server y la pantalla no
 * cambiara.
 */
export interface EnlacesDeAccion {
  aprobar: string;
  descartar: string;
  enviarEmpresa: string;
}

export type TipoDeAccion = keyof EnlacesDeAccion;

export interface Accion {
  tipo: TipoDeAccion;
  etiqueta: string;
  url: string;
}

const ETIQUETAS: Record<TipoDeAccion, string> = {
  aprobar: $localize`:Boton de accion sobre una candidatura@@accion.aprobar:Aprobar`,
  descartar: $localize`:Boton de accion sobre una candidatura@@accion.descartar:Descartar`,
  enviarEmpresa: $localize`:Boton de accion sobre una candidatura@@accion.enviarEmpresa:Enviar a empresa`,
};

/**
 * Lo que anuncia el lector de pantalla en el boton de una accion: el boton
 * solo dice "Aprobar", y en una tabla de filas iguales no dice a cual.
 * Una frase entera por accion y no etiqueta + empresa pegadas: el orden de las
 * palabras no es el mismo en todos los idiomas.
 */
export function descripcionDeAccion(tipo: TipoDeAccion, empresa: string): string {
  switch (tipo) {
    case 'aprobar':
      return $localize`:Descripcion accesible del boton Aprobar@@accion.aprobar.descripcion:Aprobar la oferta de ${empresa}:empresa:`;
    case 'descartar':
      return $localize`:Descripcion accesible del boton Descartar@@accion.descartar.descripcion:Descartar la oferta de ${empresa}:empresa:`;
    case 'enviarEmpresa':
      return $localize`:Descripcion accesible del boton Enviar a empresa@@accion.enviarEmpresa.descripcion:Enviar a empresa la oferta de ${empresa}:empresa:`;
  }
}

/** Las fichas creadas en local aun no existen en Notion: n8n no las encontraria. */
const SOLO_LOCAL = /^local-/;

/**
 * Que se puede hacer con una candidatura desde el panel.
 *
 * Es la misma regla que el correo: una pendiente se aprueba o se descarta, y
 * una aprobada que ya tiene su CV se envia a la empresa. Sin enlaces (la demo
 * publica) no se ofrece nada.
 *
 * Lo que dice que esta lista para enviar es el CV, no el estado: al aprobar,
 * n8n la marca Aprobado y al instante En proceso mientras genera el CV.
 */
export function accionesPara(una: Candidatura, enlaces: EnlacesDeAccion | null): Accion[] {
  if (!enlaces || SOLO_LOCAL.test(una.id)) {
    return [];
  }
  // En proceso tambien se usa para procesos ya enviados por otro canal (portal,
  // LinkedIn...): esos tienen via de envio y no hay que volver a mandarlos.
  const listaParaEnviar =
    Boolean(una.cv) && !una.viaEnvio && (una.estado === 'Aprobado' || una.estado === 'En proceso');
  const tipos: TipoDeAccion[] =
    una.estado === 'Pendiente' ? ['aprobar', 'descartar'] : listaParaEnviar ? ['enviarEmpresa'] : [];

  return tipos.map((tipo) => ({
    tipo,
    etiqueta: ETIQUETAS[tipo],
    url: enlaces[tipo] + encodeURIComponent(una.id),
  }));
}
