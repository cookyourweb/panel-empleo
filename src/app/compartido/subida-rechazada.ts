export const MOTIVOS_DE_SUBIDA = ['tamano', 'tipo', 'ilegible', 'sinConsentimiento', 'servidor'] as const;

export type MotivoDeSubida = (typeof MOTIVOS_DE_SUBIDA)[number];

/** El servidor no acepto el CV. Lleva el motivo, nunca el contenido. */
export class SubidaRechazada extends Error {
  constructor(readonly motivo: MotivoDeSubida) {
    super(`Subida rechazada: ${motivo}`);
    this.name = 'SubidaRechazada';
  }
}
