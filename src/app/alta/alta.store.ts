import { inject, Injectable, signal } from '@angular/core';

import {
  MotivoDeSubida,
  MotivoManual,
  Perfil,
  Propuesta,
  SubidaRechazada,
  TIPOS_DE_CONSENTIMIENTO,
  VERSION_DE_CONSENTIMIENTO,
} from './dominio';
import { ExtractorDeCv } from './extractor-de-cv';
import { RepositorioDePerfil } from './repositorio-de-perfil';

export const PASOS = {
  consentimiento: 'consentimiento',
  subida: 'subida',
  extrayendo: 'extrayendo',
  revision: 'revision',
  manual: 'manual',
  hecho: 'hecho',
} as const;

export type Paso = (typeof PASOS)[keyof typeof PASOS];

/**
 * El recorrido del alta: consentimiento, subida, extraccion y revision (o
 * formulario manual), hasta guardar.
 *
 * Cada metodo solo actua en el paso que le toca. Asi "subir sin consentir" no
 * es una condicion que la interfaz tenga que vigilar: la maquina no la permite.
 */
@Injectable()
export class AltaStore {
  private readonly repositorio = inject(RepositorioDePerfil);
  private readonly extractor = inject(ExtractorDeCv);

  private readonly _paso = signal<Paso>(PASOS.consentimiento);
  private readonly _propuestas = signal<Propuesta[]>([]);
  private readonly _motivoManual = signal<MotivoManual | null>(null);
  private readonly _rechazoDeSubida = signal<MotivoDeSubida | null>(null);
  private readonly _errorDeConsentimiento = signal(false);
  private readonly _errorDeGuardado = signal(false);

  readonly paso = this._paso.asReadonly();
  readonly propuestas = this._propuestas.asReadonly();
  /** null en el formulario manual significa que se eligio a mano, no que fallo algo. */
  readonly motivoManual = this._motivoManual.asReadonly();
  readonly rechazoDeSubida = this._rechazoDeSubida.asReadonly();
  readonly errorDeConsentimiento = this._errorDeConsentimiento.asReadonly();
  readonly errorDeGuardado = this._errorDeGuardado.asReadonly();

  /** Registra los dos consentimientos de la version vigente y abre la subida. */
  async consentir(): Promise<void> {
    if (this._paso() !== PASOS.consentimiento) return;
    this._errorDeConsentimiento.set(false);
    try {
      await this.repositorio.consentir(TIPOS_DE_CONSENTIMIENTO.almacenarCv, VERSION_DE_CONSENTIMIENTO);
      await this.repositorio.consentir(TIPOS_DE_CONSENTIMIENTO.enviarCvAIa, VERSION_DE_CONSENTIMIENTO);
    } catch {
      this._errorDeConsentimiento.set(true);
      return;
    }
    this._paso.set(PASOS.subida);
  }

  /** Sube el CV y propone campos. Un archivo rechazado deja la subida usable. */
  async subirCv(archivo: File): Promise<void> {
    if (this._paso() !== PASOS.subida) return;
    this._rechazoDeSubida.set(null);
    this._paso.set(PASOS.extrayendo);
    try {
      await this.extractor.subir(archivo);
    } catch (error) {
      this._rechazoDeSubida.set(error instanceof SubidaRechazada ? error.motivo : 'servidor');
      this._paso.set(PASOS.subida);
      return;
    }
    const resultado = await this.extractor.extraer();
    if (resultado.estado === 'propuesta') {
      this._propuestas.set(resultado.propuestas);
      this._paso.set(PASOS.revision);
    } else {
      this._motivoManual.set(resultado.motivo);
      this._paso.set(PASOS.manual);
    }
  }

  /** Rellenar a mano sin CV: disponible hasta que hay propuestas en pantalla. */
  irAManual(): void {
    if (this._paso() !== PASOS.consentimiento && this._paso() !== PASOS.subida) return;
    this._motivoManual.set(null);
    this._paso.set(PASOS.manual);
  }

  /** Solo al confirmar (REQ-5.5). Si el servidor falla, no se pierde lo escrito. */
  async guardar(perfil: Perfil): Promise<void> {
    if (this._paso() !== PASOS.revision && this._paso() !== PASOS.manual) return;
    this._errorDeGuardado.set(false);
    try {
      await this.repositorio.guardar(perfil);
    } catch {
      this._errorDeGuardado.set(true);
      return;
    }
    this._paso.set(PASOS.hecho);
  }
}
