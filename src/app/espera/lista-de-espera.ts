/**
 * Webhook de n8n que recibe los leads de todos los formularios de CookYourWebAI.
 * Es una URL publica: la web principal ya la usa desde su front. Guarda la fila
 * en Notion y avisa; responde 200 con {"ok": true} solo si la guardo.
 */
export const URL_DEL_WEBHOOK_DE_LEADS: `https://${string}` =
  'https://n8n-asistente-correo.onrender.com/webhook/leads-web';

/** Lo unico que se pide: para avisar de una plaza alcanza el email (nada de telefono). */
export interface SolicitudDeEspera {
  readonly nombre: string;
  readonly email: string;
}

/** Puerto: apuntar a una persona a la lista de espera de Empleo Tech. */
export abstract class ListaDeEspera {
  /** Resuelve solo si quedo guardada. Rechaza ante cualquier otra cosa: nunca se finge el exito. */
  abstract apuntar(solicitud: SolicitudDeEspera): Promise<void>;
}
