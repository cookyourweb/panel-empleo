import { Injectable } from '@angular/core';

import { TIPOS_DE_CONSENTIMIENTO, TipoDeConsentimiento } from '../alta/dominio';
import { CvGuardado, IdiomaDeCv, RepositorioDeCuenta } from './repositorio-de-cuenta';

/** En memoria: la demo no guarda nada en ningun sitio, solo recuerda lo que haces mientras la usas. */
@Injectable()
export class RepositorioDeCuentaDemo implements RepositorioDeCuenta {
  private cvs: CvGuardado[] = [];

  async borrar(): Promise<void> {}

  async listarCvs(): Promise<CvGuardado[]> {
    return [...this.cvs];
  }

  async borrarCv(idioma: IdiomaDeCv): Promise<void> {
    this.cvs = this.cvs.filter((cv) => cv.idioma !== idioma);
  }

  async retirarConsentimiento(tipo: TipoDeConsentimiento): Promise<void> {
    // Igual que el servidor: sin consentimiento para guardar no queda ningun CV.
    if (tipo === TIPOS_DE_CONSENTIMIENTO.almacenarCv) this.cvs = [];
  }

  async consentir(_tipo: TipoDeConsentimiento, _version: string): Promise<void> {}

  async subirCv(archivo: File): Promise<void> {
    const formato = archivo.name.toLowerCase().endsWith('.docx') ? 'docx' : 'pdf';
    this.cvs = [{ idioma: 'es', formato, subidoEn: new Date().toISOString() }];
  }
}
