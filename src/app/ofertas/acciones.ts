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
  aprobar: 'Aprobar',
  descartar: 'Descartar',
  enviarEmpresa: 'Enviar a empresa',
};

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
