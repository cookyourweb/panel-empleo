/**
 * Los campos del perfil que el CV puede proponer.
 *
 * Salario y modalidad NO estan: nunca se extraen, siempre se preguntan
 * (REQ-4.6, REQ-5.3). Que no esten aqui es lo que lo garantiza en tipos.
 */
export const CAMPOS = ['rol', 'aniosExperiencia', 'stack', 'idiomas', 'ubicacion'] as const;

export type Campo = (typeof CAMPOS)[number];

export function esCampo(valor: unknown): valor is Campo {
  return typeof valor === 'string' && (CAMPOS as readonly string[]).includes(valor);
}

export const MODALIDADES_DE_PERFIL = ['remoto', 'hibrido', 'presencial'] as const;

export type ModalidadDePerfil = (typeof MODALIDADES_DE_PERFIL)[number];

/** Un valor propuesto desde el CV, con la frase literal que lo respalda. */
export interface Propuesta {
  campo: Campo;
  valor: string;
  cita: string;
}

export interface Perfil {
  rol: string;
  aniosExperiencia: number;
  stack: string[];
  idiomas: string[];
  ubicacion: string;
  modalidad: ModalidadDePerfil[];
  salarioMin: number;
  salarioMoneda: string;
}

/** Por que la extraccion no se hizo y toca el formulario manual. */
export const MOTIVOS_MANUAL = ['desactivada', 'ya_usada', 'tope', 'proveedor', 'indisponible'] as const;

export type MotivoManual = (typeof MOTIVOS_MANUAL)[number];

export type ResultadoExtraccion =
  | { estado: 'propuesta'; propuestas: Propuesta[] }
  | { estado: 'manual'; motivo: MotivoManual };

export const TIPOS_DE_CONSENTIMIENTO = {
  almacenarCv: 'almacenar_cv',
  enviarCvAIa: 'enviar_cv_a_ia',
} as const;

export type TipoDeConsentimiento = (typeof TIPOS_DE_CONSENTIMIENTO)[keyof typeof TIPOS_DE_CONSENTIMIENTO];

/**
 * Version del texto de consentimiento. Si el texto cambia de verdad (otro
 * proveedor, otro uso) se sube la version: el servidor no da por bueno un
 * consentimiento anterior (REQ-2.2). Debe coincidir con la del servidor.
 */
export const VERSION_DE_CONSENTIMIENTO = 'v1';

export const MOTIVOS_DE_SUBIDA = ['tamano', 'tipo', 'ilegible', 'sinConsentimiento', 'servidor'] as const;

export type MotivoDeSubida = (typeof MOTIVOS_DE_SUBIDA)[number];

/** El servidor no acepto el CV. Lleva el motivo, nunca el contenido. */
export class SubidaRechazada extends Error {
  constructor(readonly motivo: MotivoDeSubida) {
    super(`Subida rechazada: ${motivo}`);
    this.name = 'SubidaRechazada';
  }
}
