import { inject, Injectable, signal } from '@angular/core';

import { Sesion } from '../sesion/sesion';
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

/** Lo que se enseña del archivo elegido: nunca su contenido. */
export interface ArchivoElegido {
  readonly nombre: string;
  readonly tamano: number;
}

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
  private readonly sesion = inject(Sesion);

  private readonly _paso = signal<Paso>(PASOS.consentimiento);
  private readonly _propuestas = signal<Propuesta[]>([]);
  private readonly _motivoManual = signal<MotivoManual | null>(null);
  private readonly _rechazoDeSubida = signal<MotivoDeSubida | null>(null);
  private readonly _errorDeConsentimiento = signal(false);
  private readonly _errorDeGuardado = signal(false);
  private readonly _cvGuardado = signal(false);
  private readonly _consentiendo = signal(false);
  private readonly _consentido = signal(false);
  private readonly _guardando = signal(false);
  private readonly _archivoElegido = signal<ArchivoElegido | null>(null);

  readonly paso = this._paso.asReadonly();
  readonly propuestas = this._propuestas.asReadonly();
  /** null en el formulario manual significa que se eligio a mano, no que fallo algo. */
  readonly motivoManual = this._motivoManual.asReadonly();
  readonly rechazoDeSubida = this._rechazoDeSubida.asReadonly();
  readonly errorDeConsentimiento = this._errorDeConsentimiento.asReadonly();
  readonly errorDeGuardado = this._errorDeGuardado.asReadonly();
  /**
   * True once the server accepted the CV. Storing it and reading it are two
   * separate facts: reading may fail or be unavailable while the CV stays safe.
   */
  readonly cvGuardado = this._cvGuardado.asReadonly();
  /** True once both consents were recorded, so the final summary only states what happened. */
  readonly consentido = this._consentido.asReadonly();
  /** True while the consent request is in flight. */
  readonly consentiendo = this._consentiendo.asReadonly();
  /** Nombre y tamano del CV elegido, para enseñarlos mientras se sube. */
  readonly archivoElegido = this._archivoElegido.asReadonly();
  /** True while the profile is being saved: the form shows it and refuses a second submit. */
  readonly guardando = this._guardando.asReadonly();

  /** Registra los dos consentimientos de la version vigente y abre la subida. */
  async consentir(): Promise<void> {
    if (this._paso() !== PASOS.consentimiento || this._consentiendo()) return;
    this._errorDeConsentimiento.set(false);
    this._consentiendo.set(true);
    try {
      await this.repositorio.consentir(TIPOS_DE_CONSENTIMIENTO.almacenarCv, VERSION_DE_CONSENTIMIENTO);
      await this.repositorio.consentir(TIPOS_DE_CONSENTIMIENTO.enviarCvAIa, VERSION_DE_CONSENTIMIENTO);
    } catch {
      this._errorDeConsentimiento.set(true);
      return;
    } finally {
      this._consentiendo.set(false);
    }
    // The cached /yo answer is from before the alta: without this, Tu cuenta asks for consent again.
    this.sesion.consentimientosDados();
    this._consentido.set(true);
    this._paso.set(PASOS.subida);
  }

  /** Sube el CV y propone campos. Un archivo rechazado deja la subida usable. */
  async subirCv(archivo: File): Promise<void> {
    if (this._paso() !== PASOS.subida) return;
    this._rechazoDeSubida.set(null);
    this._archivoElegido.set({ nombre: archivo.name, tamano: archivo.size });
    this._paso.set(PASOS.extrayendo);
    try {
      await this.extractor.subir(archivo);
    } catch (error) {
      this._rechazoDeSubida.set(error instanceof SubidaRechazada ? error.motivo : 'servidor');
      this._paso.set(PASOS.subida);
      return;
    }
    this._cvGuardado.set(true);
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
    if ((this._paso() !== PASOS.revision && this._paso() !== PASOS.manual) || this._guardando()) return;
    this._errorDeGuardado.set(false);
    this._guardando.set(true);
    try {
      await this.repositorio.guardar(perfil);
    } catch {
      this._errorDeGuardado.set(true);
      return;
    } finally {
      this._guardando.set(false);
    }
    // The cached /yo answer may still say "no profile": correct it before any guard runs.
    this.sesion.perfilGuardado();
    this._paso.set(PASOS.hecho);
  }
}
